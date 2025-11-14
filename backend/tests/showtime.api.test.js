import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

import request_ from 'supertest';
import { MongoMemoryServer as MongoMemoryServer_ } from 'mongodb-memory-server';
import express_ from 'express'; 

let request = request_;
let MongoMemoryServer = MongoMemoryServer_;
let express = express_;

let Theater, Room, Movie, Showtime, Booking, BookingSeat;
let showtimeRoutes, errorHandler;
let mongoServer;
let app;

let theater1, theater2, room1_t1, room2_t1, room3_t2, movie1, movie2;
let showtime1, showtime2, showtime3_inactive;

beforeAll(async () => {
  await jest.unstable_mockModule('../middlewares/auth.js', () => ({
    verifyToken: jest.fn((req, res, next) => next()),
    requireStaff: jest.fn((req, res, next) => next()),
    requireAdmin: jest.fn((req, res, next) => next()),
    requireRole: jest.fn(() => (req, res, next) => next()),
  }));

  await jest.unstable_mockModule('../middlewares/showtimeValidation.js', () => ({
    validateCreateShowtime: jest.fn((req, res, next) => next()),
    validateUpdateShowtime: jest.fn((req, res, next) => next()),
  }));

  await jest.unstable_mockModule('../utils/timezone.js', () => ({
    formatForAPI: jest.fn((date) => new Date(date).toISOString()), // Trả về ISO string
    getDayRangeVietnam: jest.fn((date) => {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return { startOfDay: start, endOfDay: end };
    }),
  }));

  // Tải các module chính sau khi các mock đã được thiết lập.
  request = (await import('supertest')).default;
  MongoMemoryServer = (await import('mongodb-memory-server')).MongoMemoryServer;
  express = (await import('express')).default;
  
  Theater = (await import('../models/theater.js')).default;
  Room = (await import('../models/room.js')).default;
  Movie = (await import('../models/movie.js')).default;
  Showtime = (await import('../models/showtime.js')).default;
  Booking = (await import('../models/booking.js')).default;
  BookingSeat = (await import('../models/bookingSeat.js')).default;

  showtimeRoutes = (await import('../routes/showtime.routes.js')).default;
  errorHandler = (await import('../middlewares/errorHandler.js')).default;
  

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use('/api/showtimes', showtimeRoutes);
  app.use(errorHandler);
});

afterAll(async () => {
  if (mongoose) await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Theater.deleteMany({});
  await Room.deleteMany({});
  await Movie.deleteMany({});
  await Showtime.deleteMany({});
  await Booking.deleteMany({});
  await BookingSeat.deleteMany({});

  theater1 = await Theater.create({ name: 'Theater 1' });
  theater2 = await Theater.create({ name: 'Theater 2' });

  room1_t1 = await Room.create({ name: 'Room 1 (T1)', theater_id: theater1._id });
  room2_t1 = await Room.create({ name: 'Room 2 (T1)', theater_id: theater1._id });
  room3_t2 = await Room.create({ name: 'Room 3 (T2)', theater_id: theater2._id });

  movie1 = await Movie.create({ title: 'Movie 1', duration: 120, status: 'active' });
  movie2 = await Movie.create({ title: 'Movie 2', duration: 90, status: 'active' });

  const today = new Date('2025-10-21T12:00:00.000Z');
  const tomorrow = new Date('2025-10-22T12:00:00.000Z');

  [showtime1, showtime2, showtime3_inactive] = await Showtime.create([
    { movie_id: movie1._id, room_id: room1_t1._id, start_time: today, end_time: new Date(today.getTime() + 120 * 60000), status: 'active' },
    { movie_id: movie2._id, room_id: room1_t1._id, start_time: tomorrow, end_time: new Date(tomorrow.getTime() + 90 * 60000), status: 'active' },
    { movie_id: movie1._id, room_id: room3_t2._id, start_time: today, end_time: new Date(today.getTime() + 120 * 60000), status: 'inactive' },
  ]);
});
describe('Showtime API', () => {

  describe('POST /api/showtimes/list (listShowtimes)', () => {
    it('1.1: nên lấy tất cả suất chiếu (bỏ qua status)', async () => {
      const response = await request(app).post('/api/showtimes/list').send({});
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
    });

    it('1.2: nên lọc theo theater_id', async () => {
      const response = await request(app).post('/api/showtimes/list').send({ theater_id: theater1._id.toString() });
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2); // showtime1, showtime2
    });

    it('1.3: nên lọc theo movie_id', async () => {
        const response = await request(app).post('/api/showtimes/list').send({ movie_id: movie1._id.toString() });
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2); // showtime1, showtime3
    });

    it('1.4: nên lọc theo date (Hôm nay)', async () => {
        const response = await request(app).post('/api/showtimes/list').send({ date: '2025-10-21' });
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2); // showtime1, showtime3
    });

    it('1.5: nên trả về mảng rỗng nếu theater không có phòng', async () => {
        const emptyTheater = await Theater.create({ name: 'Empty' });
        const response = await request(app).post('/api/showtimes/list').send({ theater_id: emptyTheater._id.toString() });
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(0);
    });
  });

  // --- Tests for getShowtimesByTheaterAndMovie ---
  describe('GET /api/showtimes/theater/:theaterId/movie/:movieId', () => {
    it('2.1: nên lấy suất chiếu theo Rạp và Phim', async () => {
        // (movie1 trong theater1)
        const response = await request(app).get(`/api/showtimes/theater/${theater1._id}/movie/${movie1._id}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]._id).toBe(showtime1._id.toString());
    });
  });

  // --- Tests for getShowtimeById ---
  describe('GET /api/showtimes/:id', () => {
    it('3.1: nên lấy chi tiết 1 suất chiếu thành công', async () => {
        const response = await request(app).get(`/api/showtimes/${showtime1._id}`);
        expect(response.status).toBe(200);
        expect(response.body.data.movie_id.title).toBe('Movie 1');
        expect(response.body.data.room_id.name).toBe('Room 1 (T1)');
    });

    it('3.2: nên trả về 404 nếu ID không tồn tại', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const response = await request(app).get(`/api/showtimes/${nonExistentId}`);
        expect(response.status).toBe(404);
    });
  });

  // --- Tests for createShowtime ---
  describe('POST /api/showtimes', () => {
    it('4.1: nên tạo suất chiếu thành công', async () => {
        const newTime = new Date('2025-10-25T10:00:00.000Z');
        const newEndTime = new Date(newTime.getTime() + 120 * 60000);
        const newShowtime = {
            movie_id: movie1._id.toString(),
            room_id: room1_t1._id.toString(),
            start_time: newTime.toISOString(),
            end_time: newEndTime.toISOString(),
            status: 'active'
        };
        
        const response = await request(app).post('/api/showtimes').send(newShowtime);
        expect(response.status).toBe(201);
        expect(response.body.data.movie_id.title).toBe('Movie 1');
    });

    it('4.2: nên trả về lỗi 409 (Conflict) nếu bị trùng lịch', async () => {
        const overlappingShowtime = {
            movie_id: movie2._id.toString(),
            room_id: room1_t1._id.toString(), // Cùng phòng
            start_time: showtime1.start_time, // Cùng thời gian với showtime1
            end_time: showtime1.end_time,
            status: 'active'
        };

        const response = await request(app).post('/api/showtimes').send(overlappingShowtime);
        expect(response.status).toBe(409);
        expect(response.body.message).toContain('Trùng lịch');
    });
    
    it('4.3: nên trả về lỗi 400 nếu phim không active', async () => {
        const inactiveMovie = await Movie.create({ title: 'Inactive Movie', duration: 90, status: 'inactive' });
        const newTime = new Date('2025-10-25T10:00:00.000Z');
        const newShowtime = {
            movie_id: inactiveMovie._id.toString(),
            room_id: room1_t1._id.toString(),
            start_time: newTime.toISOString(),
            end_time: new Date(newTime.getTime() + 90 * 60000).toISOString(),
        };

        const response = await request(app).post('/api/showtimes').send(newShowtime);
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Phim không ở trạng thái active');
    });
  });

  // --- Tests for updateShowtime ---
  describe('PUT /api/showtimes/:id', () => {
    it('5.1: nên cập nhật suất chiếu thành công', async () => {
        const response = await request(app)
            .put(`/api/showtimes/${showtime1._id}`)
            .send({ status: 'inactive' });
        
        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('inactive');
    });

    it('5.2: nên trả về lỗi 409 (Conflict) nếu cập nhật gây trùng lịch', async () => {
        const response = await request(app)
            .put(`/api/showtimes/${showtime2._id}`) // Cập nhật showtime2
            .send({ start_time: showtime1.start_time, end_time: showtime1.end_time }); // Trùng với showtime1

        expect(response.status).toBe(409);
        expect(response.body.message).toContain('Trùng lịch');
    });
  });

  // --- Tests for deleteShowtime ---
  describe('DELETE /api/showtimes/:id', () => {
    it('6.1: nên xóa suất chiếu thành công', async () => {
        const response = await request(app).delete(`/api/showtimes/${showtime1._id}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toContain('Xóa suất chiếu thành công');
        
        const count = await Showtime.countDocuments();
        expect(count).toBe(2);
    });

    it('6.2: nên trả về lỗi 404 nếu ID không tồn tại', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const response = await request(app).delete(`/api/showtimes/${nonExistentId}`);
        expect(response.status).toBe(404);
    });
  });

  // --- Tests for updateShowtimeStatus ---
  describe('PATCH /api/showtimes/:id/status', () => {
    it('7.1: nên cập nhật status thành công (vd: inactive)', async () => {
        const response = await request(app)
            .patch(`/api/showtimes/${showtime1._id}/status`)
            .send({ status: 'inactive' });
        
        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('inactive');
    });

    it('7.2: nên trả về lỗi 409 (Conflict) khi kích hoạt suất chiếu bị trùng', async () => {
        // Tạo 1 showtime active
        const activeST = await Showtime.create({
             movie_id: movie1._id, room_id: room2_t1._id, 
             start_time: new Date('2025-10-30T10:00:00Z'),
             end_time: new Date('2025-10-30T12:00:00Z'),
             status: 'active'
        });
        // Tạo 1 showtime inactive bị trùng
        const inactiveST = await Showtime.create({
            movie_id: movie2._id, room_id: room2_t1._id, 
            start_time: new Date('2025-10-30T11:00:00Z'), // Trùng
            end_time: new Date('2025-10-30T13:00:00Z'),
            status: 'inactive'
       });

       // Cố gắng kích hoạt
       const response = await request(app)
            .patch(`/api/showtimes/${inactiveST._id}/status`)
            .send({ status: 'active' });
        
        expect(response.status).toBe(409);
        expect(response.body.message).toContain('Không thể kích hoạt suất chiếu. Lịch chiếu bị trùng');
    });
  });

  // --- Tests for getBookedSeatsForShowtime ---
  describe('GET /api/showtimes/:id/booked-seats', () => {
    it('8.1: nên trả về danh sách các ghế đã đặt', async () => {
        const booking = await Booking.create({ showtime_id: showtime1._id, status: 'confirmed', user_id: new mongoose.Types.ObjectId() });
        const seat1 = new mongoose.Types.ObjectId();
        const seat2 = new mongoose.Types.ObjectId();
        await BookingSeat.insertMany([
            { booking_id: booking._id, seat_id: seat1 },
            { booking_id: booking._id, seat_id: seat2 },
        ]);
        
        const response = await request(app).get(`/api/showtimes/${showtime1._id}/booked-seats`);
        
        expect(response.status).toBe(200);
        expect(response.body.booked_seats).toHaveLength(2);
        expect(response.body.booked_seats).toContain(seat1.toString());
    });

    it('8.2: nên trả về mảng rỗng nếu không có booking', async () => {
        const response = await request(app).get(`/api/showtimes/${showtime1._id}/booked-seats`);
        expect(response.status).toBe(200);
        expect(response.body.booked_seats).toHaveLength(0);
    });
  });

});