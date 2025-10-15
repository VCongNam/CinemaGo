import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// Import các controller cần test
import * as roomController from '../controllers/room.controller.js';

// Mock các model của Mongoose
import Room from '../models/room.js';
import Theater from '../models/theater.js';
import Seat from '../models/seat.js';

// Mock toàn bộ các module model
jest.mock('../models/room.js');
jest.mock('../models/theater.js');
jest.mock('../models/seat.js');

// Mock mongoose.Types.ObjectId
const mockObjectId = '60d0fe4f5311236168a109ca';
mongoose.Types.ObjectId = jest.fn(() => mockObjectId);

describe('Room API Controllers', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        // Reset mocks trước mỗi test
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

    // --- Tests for getAllRooms ---
    describe('getAllRooms', () => {
        it('nên trả về danh sách phòng với phân trang và sắp xếp mặc định', async () => {
            const mockRooms = [{ _id: '1', name: 'Room A' }];
            Room.aggregate.mockResolvedValue(mockRooms);
            Room.countDocuments.mockResolvedValue(1);

            await roomController.getAllRooms(mockReq, mockRes, mockNext);

            expect(Room.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
                { $sort: { created_at: 1 } }, // ASC mặc định
                { $skip: 0 },
                { $limit: 10 }
            ]));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                totalCount: 1,
                list: expect.any(Array)
            }));
        });

        it('nên xử lý các bộ lọc (filterCriterias) một cách chính xác', async () => {
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

        it('nên trả về lỗi 400 nếu page hoặc pageSize không hợp lệ', async () => {
            mockReq.body = { page: 0 }; // page không hợp lệ
            await roomController.getAllRooms(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Page phải là số nguyên dương" });
        });
    });

    // --- Tests for getRoomsByTheater ---
    describe('getRoomsByTheater', () => {
        it('nên trả về danh sách phòng của một rạp cụ thể', async () => {
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

        it('nên trả về lỗi 404 nếu không tìm thấy rạp', async () => {
            mockReq.params = { theaterId: mockObjectId };
            Theater.findById.mockResolvedValue(null);

            await roomController.getRoomsByTheater(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Không tìm thấy rạp' });
        });
    });

    // --- Tests for getRoomById ---
    describe('getRoomById', () => {
        it('nên trả về chi tiết một phòng', async () => {
            mockReq.params = { id: mockObjectId };
            Room.aggregate.mockResolvedValue([{ _id: mockObjectId, name: 'Room Detail' }]);

            await roomController.getRoomById(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: { _id: mockObjectId, name: 'Room Detail' }
            }));
        });

        it('nên trả về lỗi 404 nếu không tìm thấy phòng', async () => {
            mockReq.params = { id: mockObjectId };
            Room.aggregate.mockResolvedValue([]);

            await roomController.getRoomById(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    // --- Tests for createRoom ---
    describe('createRoom', () => {
        it('nên tạo phòng mới thành công', async () => {
            mockReq.body = { theater_id: mockObjectId, name: 'New Room' };
            Theater.findById.mockResolvedValue({ _id: mockObjectId });
            Room.findOne.mockResolvedValue(null); // Không có phòng trùng tên
            Room.create.mockResolvedValue({ _id: 'newId', ...mockReq.body });

            await roomController.createRoom(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: "Tạo phòng thành công"
            }));
        });

        it('nên trả về lỗi 400 nếu tên phòng đã tồn tại trong rạp', async () => {
            mockReq.body = { theater_id: mockObjectId, name: 'Existing Room' };
            Theater.findById.mockResolvedValue({ _id: mockObjectId });
            Room.findOne.mockResolvedValue({ name: 'Existing Room' }); // Phòng đã tồn tại

            await roomController.createRoom(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Tên phòng đã tồn tại trong rạp này' });
        });
    });

    // --- Tests for updateRoom ---
    describe('updateRoom', () => {
        it('nên cập nhật phòng thành công', async () => {
            mockReq.params = { id: mockObjectId };
            mockReq.body = { name: 'Updated Name' };
            const mockRoom = { _id: mockObjectId, name: 'Old Name', theater_id: 'theater1' };
            Room.findById.mockResolvedValue(mockRoom);
            Room.findOne.mockResolvedValue(null); // Không có tên trùng
            Room.findByIdAndUpdate.mockResolvedValue({ ...mockRoom, name: 'Updated Name' });

            await roomController.updateRoom(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({ name: 'Updated Name' })
            }));
        });

        it('nên trả về lỗi 404 nếu phòng không tồn tại', async () => {
            mockReq.params = { id: mockObjectId };
            Room.findById.mockResolvedValue(null);

            await roomController.updateRoom(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    // --- Tests for deleteRoom ---
    describe('deleteRoom', () => {
        it('nên xóa mềm (soft delete) phòng thành công', async () => {
            mockReq.params = { id: mockObjectId };
            Room.findById.mockResolvedValue({ _id: mockObjectId });
            Seat.countDocuments.mockResolvedValue(0); // Không có ghế
            Room.findByIdAndUpdate.mockResolvedValue({});

            await roomController.deleteRoom(mockReq, mockRes, mockNext);

            expect(Room.findByIdAndUpdate).toHaveBeenCalledWith(mockObjectId, { status: 'inactive' });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Xóa phòng thành công' });
        });

        it('nên trả về lỗi 400 nếu phòng vẫn còn ghế', async () => {
            mockReq.params = { id: mockObjectId };
            Room.findById.mockResolvedValue({ _id: mockObjectId });
            Seat.countDocuments.mockResolvedValue(5); // Còn 5 ghế

            await roomController.deleteRoom(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Không thể xóa phòng có ghế')
            }));
        });
    });

    // --- Tests for updateRoomStatus ---
    describe('updateRoomStatus', () => {
        it('nên cập nhật trạng thái phòng thành công', async () => {
            mockReq.params = { id: mockObjectId };
            mockReq.body = { status: 'maintenance' };
            const mockRoom = { _id: mockObjectId, status: 'active' };
            Room.findById.mockResolvedValue(mockRoom);
            Room.findByIdAndUpdate.mockResolvedValue({ ...mockRoom, status: 'maintenance' });

            await roomController.updateRoomStatus(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Cập nhật trạng thái phòng thành 'maintenance' thành công"
            }));
        });
    });
    
    // --- Tests for getRoomStats ---
    describe('getRoomStats', () => {
        it('nên trả về thống kê của phòng', async () => {
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

        it('nên trả về lỗi 404 nếu phòng không tồn tại', async () => {
            mockReq.params = { id: mockObjectId };
            Room.findById.mockResolvedValue(null);

            await roomController.getRoomStats(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });
});