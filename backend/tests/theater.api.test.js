import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import request from 'supertest';

// Import Models and Routes
let Theater, Room, Seat, theaterRoutes, errorHandler;

// --- Mock Authentication Middleware ---
// ✅ SỬA LỖI 401: Mock TẤT CẢ các middleware xác thực
await jest.unstable_mockModule('../middlewares/auth.js', () => ({
    verifyToken: jest.fn((req, res, next) => next()),
    requireStaff: jest.fn((req, res, next) => next()),
    requireAdmin: jest.fn((req, res, next) => next()),
    requireRole: jest.fn((...roles) => (req, res, next) => next()), // Mock cả requireRole
}));
// --- End Mock ---

let mongoServer;
let app;

// --- Setup Test Environment ---
beforeAll(async () => {
    // Import động sau khi đã mock
    Theater = (await import('../models/theater.js')).default;
    Room = (await import('../models/room.js')).default;
    Seat = (await import('../models/seat.js')).default;
    theaterRoutes = (await import('../routes/theater.routes.js')).default;
    errorHandler = (await import('../middlewares/errorHandler.js')).default;

    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());
    app.use('/api/theaters', theaterRoutes);
    app.use(errorHandler);
});

// --- Teardown Test Environment ---
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    jest.unmock('../middlewares/auth.js'); // Hoàn tác mock
});

// --- Clear Data Before Each Test ---
beforeEach(async () => {
    await Theater.deleteMany({});
    await Room.deleteMany({});
    await Seat.deleteMany({});
});

describe('Theater API', () => {

    // --- Tests for createTheater ---
    describe('POST /api/theaters', () => {
        it('1.1: nên tạo rạp thành công và trả về 201', async () => {
            const newTheaterData = { name: 'CGV Vincom Test', location: '123 Test Street' };
            const response = await request(app)
                .post('/api/theaters')
                .send(newTheaterData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('name', 'CGV Vincom Test');
        });

        it('2.1: nên trả về lỗi 400 nếu thiếu tên rạp', async () => {
            const newTheaterData = { location: '123 Test Street' };
            const response = await request(app)
                .post('/api/theaters')
                .send(newTheaterData);

            expect(response.status).toBe(400);
        });

        it('2.2: nên trả về lỗi 400 nếu tên rạp đã tồn tại', async () => {
            await Theater.create({ name: 'CGV Vincom Test', location: 'Old Location' });
            const newTheaterData = { name: 'CGV Vincom Test', location: '123 Test Street' };
            const response = await request(app)
                .post('/api/theaters')
                .send(newTheaterData);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Tên rạp đã tồn tại");
        });
    });

    describe('POST /api/theaters/list (getAllTheaters)', () => {
        let theater1, theater2, theaterInactive;
        beforeEach(async () => {
            theater1 = await Theater.create({ name: 'Alpha Cinema', location: 'Location A', status: 'active' });
            theater2 = await Theater.create({ name: 'Beta Cineplex', location: 'Location B', status: 'active' });
            theaterInactive = await Theater.create({ name: 'Gamma Theater', location: 'Location C', status: 'inactive' });
        });

        it('3.1: nên lấy danh sách rạp thành công (chỉ active) với pagination mặc định', async () => {
            const response = await request(app).post('/api/theaters/list').send({ status: 'active' });

            expect(response.status).toBe(200);
            expect(response.body.list).toHaveLength(2);
            expect(response.body.totalCount).toBe(2);
        });

        it('3.2: nên phân trang đúng (pageSize=1, page=2)', async () => {
            const response = await request(app).post('/api/theaters/list').send({ page: 2, pageSize: 1, status: 'active', orderBy: 'name', orderDir: 'ASC' });

            expect(response.status).toBe(200);
            expect(response.body.list).toHaveLength(1);
            expect(response.body.list[0].name).toBe(theater2.name);
        });

        it('3.3: nên lọc theo status=inactive', async () => {
            const response = await request(app).post('/api/theaters/list').send({ status: 'inactive' });

            expect(response.status).toBe(200);
            expect(response.body.list).toHaveLength(1);
            expect(response.body.list[0].name).toBe(theaterInactive.name);
        });

        it('3.4: nên lọc theo filterCriterias (name contains "Alpha")', async () => {
            const response = await request(app).post('/api/theaters/list').send({
                filterCriterias: [{ field: 'name', operator: 'contains', value: 'Alpha' }],
                status: 'active'
            });

            expect(response.status).toBe(200);
            expect(response.body.list).toHaveLength(1);
        });

        it('3.5: nên sắp xếp theo tên DESC', async () => {
            const response = await request(app).post('/api/theaters/list').send({
                orderBy: 'name',
                orderDir: 'DESC',
                status: 'active'
            });

            expect(response.status).toBe(200);
            expect(response.body.list[0].name).toBe('Beta Cineplex');
        });

        it('2.3: nên trả về lỗi 400 nếu page < 1', async () => {
            const response = await request(app).post('/api/theaters/list').send({ page: 0 });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain("Page phải là số nguyên dương");
        });
    });

    // --- Tests for getTheaterById ---
    describe('GET /api/theaters/:id', () => {
        it('4.1: nên lấy chi tiết rạp thành công', async () => {
            const theater = await Theater.create({ name: 'Test Theater', location: 'Test Location' });
            const room = await Room.create({ name: 'Room 1', theater_id: theater._id, rows: 2, cols: 2 });
            // ✅ SỬA LỖI: Thêm base_price
            await Seat.create({ room_id: room._id, seat_number: 'A1', base_price: 100000 });

            const response = await request(app).get(`/api/theaters/${theater._id}`);

            expect(response.status).toBe(200);
            expect(response.body.data.name).toBe('Test Theater');
            expect(response.body.data).toHaveProperty('rooms_count', 1);
        });

        it('5.1: nên trả về lỗi 404 nếu ID không tồn tại', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const response = await request(app).get(`/api/theaters/${nonExistentId}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Không tìm thấy rạp");
        });

        it('5.2: nên trả về lỗi 400 nếu ID sai định dạng', async () => {
            const invalidId = '123';
            const response = await request(app).get(`/api/theaters/${invalidId}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("ID rạp không hợp lệ");
        });
    });

    // --- Tests for updateTheater ---
    describe('PUT /api/theaters/:id', () => {
        let theaterToUpdate;
        beforeEach(async () => {
            theaterToUpdate = await Theater.create({ name: 'Old Name', location: 'Old Location' });
        });

        it('6.1: nên cập nhật rạp thành công', async () => {
            const updateData = { name: 'New Name', status: 'inactive' };
            const response = await request(app)
                .put(`/api/theaters/${theaterToUpdate._id}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.data.name).toBe('New Name');
            expect(response.body.data.status).toBe('inactive');
        });

        it('7.1: nên trả về lỗi 400 nếu tên cập nhật đã tồn tại', async () => {
            await Theater.create({ name: 'Existing Name', location: 'Some Location' });
            const updateData = { name: 'Existing Name' };
            const response = await request(app)
                .put(`/api/theaters/${theaterToUpdate._id}`)
                .send(updateData);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Tên rạp đã tồn tại");
        });
    });

    // --- Tests for deleteTheater ---
    describe('DELETE /api/theaters/:id', () => {
        let theaterToDelete;
        beforeEach(async () => {
            theaterToDelete = await Theater.create({ name: 'To Delete', location: 'Delete Location' });
        });

        it('8.1: nên xóa (mềm) rạp thành công nếu không có phòng', async () => {
            const response = await request(app).delete(`/api/theaters/${theaterToDelete._id}`);

            expect(response.status).toBe(200);
            const deletedTheater = await Theater.findById(theaterToDelete._id);
            expect(deletedTheater.status).toBe('inactive');
        });

        it('9.1: nên trả về lỗi 400 nếu rạp vẫn còn phòng', async () => {
            await Room.create({ name: 'Room in Theater', theater_id: theaterToDelete._id });
            const response = await request(app).delete(`/api/theaters/${theaterToDelete._id}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain("Không thể xóa rạp có phòng chiếu");
        });
    });

    // --- Tests for updateTheaterStatus ---
    describe('PATCH /api/theaters/:id/status', () => {
        let theaterToUpdate;
        beforeEach(async () => {
            theaterToUpdate = await Theater.create({ name: 'Status Update', location: 'Location', status: 'active' });
        });

        it('10.1: nên cập nhật trạng thái thành công', async () => {
            const response = await request(app)
                .patch(`/api/theaters/${theaterToUpdate._id}/status`)
                .send({ status: 'inactive' });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('inactive');
        });

        it('11.1: nên trả về lỗi 400 nếu thiếu status', async () => {
            const response = await request(app)
                .patch(`/api/theaters/${theaterToUpdate._id}/status`)
                .send({});

            expect(response.status).toBe(400);
            // Lỗi này là từ middleware validateTheaterStatus
            expect(response.body.errors).toContain("Trạng thái là bắt buộc");
        });

        it('11.2: nên trả về lỗi 400 nếu status không hợp lệ', async () => {
            const response = await request(app)
                .patch(`/api/theaters/${theaterToUpdate._id}/status`)
                .send({ status: 'pending' });

            expect(response.status).toBe(400);
        });
    });

    // --- Tests for getTheaterStats ---
    describe('GET /api/theaters/:id/stats', () => {
        it('12.1: nên lấy thống kê rạp thành công', async () => {
            const theater = await Theater.create({ name: 'Stats Theater', location: 'Stats Location' });
            const room1 = await Room.create({ name: 'Room S1', theater_id: theater._id, rows: 2, cols: 2, status: 'active' });
            const room2 = await Room.create({ name: 'Room S2', theater_id: theater._id, rows: 3, cols: 3, status: 'inactive' });

            // ✅ SỬA LỖI: Thêm base_price
            await Seat.create({ room_id: room1._id, seat_number: 'A1', type: 'vip', base_price: 150000 });
            await Seat.create({ room_id: room1._id, seat_number: 'A2', type: 'normal', base_price: 100000 });
            await Seat.create({ room_id: room2._id, seat_number: 'B1', type: 'normal', base_price: 100000 });

            const response = await request(app).get(`/api/theaters/${theater._id}/stats`);

            expect(response.status).toBe(200);
            const stats = response.body.data;
            expect(stats.total_rooms).toBe(2);
            expect(stats.active_rooms).toBe(1);
            expect(stats.total_seats).toBe(3);
        });

        it('5.1: nên trả về lỗi 404 nếu ID không tồn tại', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const response = await request(app).get(`/api/theaters/${nonExistentId}/stats`);
            expect(response.status).toBe(404);
        });
    });
});