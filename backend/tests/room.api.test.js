import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// Khai báo mock factory cho các models để tương thích với ES Modules và Jest.
// Đây là mô hình robust nhất để tránh lỗi "ReferenceError: require is not defined" 
// trong môi trường Jest + ESM.
jest.mock('../models/room.js', () => {
    const mockRoom = {
        aggregate: jest.fn(),
        countDocuments: jest.fn(),
        findById: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    };
    return {
        __esModule: true,
        default: mockRoom,
    };
});

jest.mock('../models/theater.js', () => {
    const mockTheater = {
        findById: jest.fn(),
    };
    return {
        __esModule: true,
        default: mockTheater,
    };
});

jest.mock('../models/seat.js', () => {
    const mockSeat = {
        countDocuments: jest.fn(),
    };
    return {
        __esModule: true,
        default: mockSeat,
    };
});

import * as roomController from '../controllers/room.controller.js';
import Room from '../models/room.js';
import Theater from '../models/theater.js';
import Seat from '../models/seat.js';

const mockObjectId = '60d0fe4f5311236168a109ca';
const anotherObjectId = '60d0fe4f5311236168a109cb';
// Giả lập mongoose.Types.ObjectId nếu cần thiết
mongoose.Types.ObjectId = jest.fn((id) => id || mockObjectId);

describe('Room API Controllers', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        // Clear tất cả các mock (reset call counts và results)
        jest.clearAllMocks();
        
        mockReq = {
            body: {},
            params: {},
            query: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockNext = jest.fn();
    });

    describe('getAllRooms', () => {
        it('TC1.1: nên trả về danh sách phòng với phân trang và sắp xếp mặc định', async () => {
            const mockRooms = [{ _id: '1', name: 'Room A' }];
            Room.aggregate.mockResolvedValue(mockRooms);
            Room.countDocuments.mockResolvedValue(1);

            await roomController.getAllRooms(mockReq, mockRes, mockNext);

            expect(Room.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
                { $sort: { created_at: 1 } }, 
                { $skip: 0 },
                { $limit: 10 }
            ]));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                totalCount: 1,
                list: expect.any(Array)
            }));
        });

        it('TC1.2: nên xử lý các bộ lọc (filterCriterias) một cách chính xác', async () => {
            mockReq.body = {
                filterCriterias: [{ field: 'name', operator: 'contains', value: 'VIP' }]
            };
            Room.aggregate.mockResolvedValue([]);
            Room.countDocuments.mockResolvedValue(0);

            await roomController.getAllRooms(mockReq, mockRes, mockNext);

            expect(Room.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
                { $match: { name: { $regex: 'VIP', $options: 'i' } } }
            ]));
        });

        it('TC1.3: nên trả về lỗi 400 nếu page hoặc pageSize không hợp lệ', async () => {
            mockReq.body = { page: 0 }; 
            await roomController.getAllRooms(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Page phải là số nguyên dương" });
        });
        
        // --- Bổ sung TC1.4: Kiểm tra phân trang với tham số tùy chỉnh ---
        it('TC1.4: nên áp dụng phân trang và sắp xếp tùy chỉnh', async () => {
            mockReq.body = {
                page: 2,
                pageSize: 5,
                orderBy: 'name',
                orderDir: -1 // DESC
            };
            Room.aggregate.mockResolvedValue([]);
            Room.countDocuments.mockResolvedValue(20);

            await roomController.getAllRooms(mockReq, mockRes, mockNext);

            expect(Room.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
                // Page 2, PageSize 5 => Skip 5
                { $sort: { name: -1 } }, 
                { $skip: 5 },
                { $limit: 5 }
            ]));
        });
    });

    describe('getRoomsByTheater', () => {
        it('TC2.1: nên trả về danh sách phòng của một rạp cụ thể', async () => {
            mockReq.params = { theaterId: mockObjectId };
            Theater.findById.mockResolvedValue({ _id: mockObjectId, name: 'CGV' });
            Room.aggregate.mockResolvedValue([{ name: 'Room 1' }]);
            Room.countDocuments.mockResolvedValue(1);

            await roomController.getRoomsByTheater(mockReq, mockRes, mockNext);

            expect(Theater.findById).toHaveBeenCalledWith(mockObjectId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    theater: expect.any(Object),
                    rooms: expect.any(Array)
                })
            }));
        });

        it('TC2.2: nên trả về lỗi 404 nếu không tìm thấy rạp', async () => {
            mockReq.params = { theaterId: mockObjectId };
            Theater.findById.mockResolvedValue(null);

            await roomController.getRoomsByTheater(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Không tìm thấy rạp' });
        });
    });

    describe('getRoomById', () => {
        it('TC3.1: nên trả về chi tiết một phòng', async () => {
            mockReq.params = { id: mockObjectId };
            Room.aggregate.mockResolvedValue([{ _id: mockObjectId, name: 'Room Detail' }]);

            await roomController.getRoomById(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: { _id: mockObjectId, name: 'Room Detail' }
            }));
        });

        it('TC3.2: nên trả về lỗi 404 nếu không tìm thấy phòng', async () => {
            mockReq.params = { id: mockObjectId };
            Room.aggregate.mockResolvedValue([]);

            await roomController.getRoomById(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe('createRoom', () => {
        const validBody = { theater_id: mockObjectId, name: 'New Room' };
        
        it('TC4.1: nên tạo phòng mới thành công', async () => {
            mockReq.body = validBody;
            Theater.findById.mockResolvedValue({ _id: mockObjectId });
            Room.findOne.mockResolvedValue(null); // Không có phòng trùng tên
            Room.create.mockResolvedValue({ _id: 'newId', ...mockReq.body });

            await roomController.createRoom(mockReq, mockRes, mockNext);

            expect(Room.create).toHaveBeenCalledWith(validBody);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: "Tạo phòng thành công"
            }));
        });

        it('TC4.2: nên trả về lỗi 400 nếu tên phòng đã tồn tại trong rạp', async () => {
            mockReq.body = { theater_id: mockObjectId, name: 'Existing Room' };
            Theater.findById.mockResolvedValue({ _id: mockObjectId });
            Room.findOne.mockResolvedValue({ name: 'Existing Room' });

            await roomController.createRoom(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Tên phòng đã tồn tại trong rạp này' });
        });
        
        // --- Bổ sung TC4.3: Kiểm tra Validation khi thiếu theater_id ---
        it('TC4.3: nên trả về lỗi 400 nếu thiếu theater_id', async () => {
            mockReq.body = { name: 'Room without theater' }; 
            // Giả định Theater.findById sẽ được gọi và trả về null nếu theater_id không có trong body, 
            // hoặc middleware validation sẽ chặn. Ở đây ta giả định validation cơ bản trong controller.
            
            await roomController.createRoom(mockReq, mockRes, mockNext);

            // Giả định controller có kiểm tra sự tồn tại của theater_id
            expect(mockRes.status).toHaveBeenCalledWith(400); 
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Yêu cầu ID rạp (theater_id)') 
            }));
        });
    });

    describe('updateRoom', () => {
        let mockRoom;
        beforeEach(() => {
            mockRoom = { _id: mockObjectId, name: 'Old Name', theater_id: 'theater1' };
        });

        it('TC5.1: nên cập nhật phòng thành công', async () => {
            mockReq.params = { id: mockObjectId };
            mockReq.body = { name: 'Updated Name' };
            
            Room.findById.mockResolvedValue(mockRoom);
            Room.findOne.mockResolvedValue(null); // Không có phòng trùng tên
            Room.findByIdAndUpdate.mockResolvedValue({ ...mockRoom, name: 'Updated Name' });

            await roomController.updateRoom(mockReq, mockRes, mockNext);

            expect(Room.findByIdAndUpdate).toHaveBeenCalledWith(mockObjectId, mockReq.body, expect.anything());
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({ name: 'Updated Name' })
            }));
        });
        
        // --- Bổ sung TC5.2: Kiểm tra va chạm tên phòng (collision) ---
        it('TC5.2: nên trả về lỗi 400 nếu tên phòng mới đã tồn tại trong rạp đó (phòng khác)', async () => {
            mockReq.params = { id: mockObjectId };
            mockReq.body = { name: 'Existing Name' };

            // Phòng cần cập nhật
            Room.findById.mockResolvedValue({ _id: mockObjectId, name: 'Old Name', theater_id: anotherObjectId });
            
            // Phòng khác đã tồn tại với tên 'Existing Name' và theater_id giống nhau
            Room.findOne.mockResolvedValue({ _id: anotherObjectId, name: 'Existing Name', theater_id: anotherObjectId });

            await roomController.updateRoom(mockReq, mockRes, mockNext);

            expect(Room.findOne).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Existing Name',
                theater_id: anotherObjectId,
                _id: { $ne: mockObjectId } // Quan trọng: Phải kiểm tra ID khác nhau
            }));
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Tên phòng đã tồn tại trong rạp này' });
        });

        it('TC5.3: nên trả về lỗi 404 nếu phòng không tồn tại', async () => {
            mockReq.params = { id: mockObjectId };
            Room.findById.mockResolvedValue(null);

            await roomController.updateRoom(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe('deleteRoom', () => {
        it('TC6.1: nên xóa mềm (soft delete) phòng thành công', async () => {
            mockReq.params = { id: mockObjectId };
            Room.findById.mockResolvedValue({ _id: mockObjectId });
            Seat.countDocuments.mockResolvedValue(0); 
            Room.findByIdAndUpdate.mockResolvedValue({});

            await roomController.deleteRoom(mockReq, mockRes, mockNext);

            expect(Room.findByIdAndUpdate).toHaveBeenCalledWith(mockObjectId, { status: 'inactive' }, expect.anything());
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Xóa phòng thành công' });
        });

        it('TC6.2: nên trả về lỗi 400 nếu phòng vẫn còn ghế', async () => {
            mockReq.params = { id: mockObjectId };
            Room.findById.mockResolvedValue({ _id: mockObjectId });
            Seat.countDocuments.mockResolvedValue(5); 

            await roomController.deleteRoom(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Không thể xóa phòng có ghế')
            }));
        });
        
        // --- Bổ sung TC6.3: Kiểm tra 404 Not Found ---
        it('TC6.3: nên trả về lỗi 404 nếu phòng không tồn tại', async () => {
            mockReq.params = { id: mockObjectId };
            Room.findById.mockResolvedValue(null);
            
            await roomController.deleteRoom(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Không tìm thấy phòng' });
        });
    });

    describe('updateRoomStatus', () => {
        it('TC7.1: nên cập nhật trạng thái phòng thành công', async () => {
            mockReq.params = { id: mockObjectId };
            mockReq.body = { status: 'maintenance' };
            const mockRoom = { _id: mockObjectId, status: 'active' };
            Room.findById.mockResolvedValue(mockRoom);
            Room.findByIdAndUpdate.mockResolvedValue({ ...mockRoom, status: 'maintenance' });

            await roomController.updateRoomStatus(mockReq, mockRes, mockNext);

            expect(Room.findByIdAndUpdate).toHaveBeenCalledWith(mockObjectId, mockReq.body, expect.anything());
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Cập nhật trạng thái phòng thành 'maintenance' thành công"
            }));
        });
        
        // --- Bổ sung TC7.2: Kiểm tra 404 Not Found ---
        it('TC7.2: nên trả về lỗi 404 nếu phòng không tồn tại', async () => {
            mockReq.params = { id: mockObjectId };
            mockReq.body = { status: 'maintenance' };
            Room.findById.mockResolvedValue(null);

            await roomController.updateRoomStatus(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Không tìm thấy phòng' });
        });
    });
    
    describe('getRoomStats', () => {
        it('TC8.1: nên trả về thống kê của phòng', async () => {
            mockReq.params = { id: mockObjectId };
            const mockStats = { _id: mockObjectId, name: 'Room Stats', total_seats: 100 };
            Room.findById.mockResolvedValue({ _id: mockObjectId });
            Room.aggregate.mockResolvedValue([mockStats]);

            await roomController.getRoomStats(mockReq, mockRes, mockNext);
            
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: "Lấy thống kê phòng thành công",
                data: mockStats
            });
        });

        it('TC8.2: nên trả về lỗi 404 nếu phòng không tồn tại', async () => {
            mockReq.params = { id: mockObjectId };
            Room.findById.mockResolvedValue(null);

            await roomController.getRoomStats(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });
});