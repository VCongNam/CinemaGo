import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

let request, mongoose, MongoMemoryServer, express; 
let Theater, Room, Seat, seatRoutes, errorHandler;
let mongoServer;
let app;
let testTheater, testRoom, testRoomEmpty;

beforeAll(async () => {
  await jest.unstable_mockModule('../middlewares/auth.js', () => ({
    verifyToken: jest.fn((req, res, next) => next()),
    requireStaff: jest.fn((req, res, next) => next()),
    requireAdmin: jest.fn((req, res, next) => next()),
    requireRole: jest.fn((...roles) => (req, res, next) => next()),
  }));

  request = (await import('supertest')).default;
  MongoMemoryServer = (await import('mongodb-memory-server')).MongoMemoryServer;
  express = (await import('express')).default;
  mongoose = (await import('mongoose')).default; 

  Theater = (await import('../models/theater.js')).default;
  Room = (await import('../models/room.js')).default;
  Seat = (await import('../models/seat.js')).default;
  seatRoutes = (await import('../routes/seat.routes.js')).default; 
  errorHandler = (await import('../middlewares/errorHandler.js')).default;
 
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use('/api/seats', seatRoutes);
  app.use(errorHandler);
});

afterAll(async () => {
  if (mongoose) await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  jest.unmock('../middlewares/auth.js');
});

beforeEach(async () => {
  if (Theater) await Theater.deleteMany({});
  if (Room) await Room.deleteMany({});
  if (Seat) await Seat.deleteMany({});

  testTheater = await Theater.create({ name: 'Test Cinema', location: 'Test Location' });
  testRoom = await Room.create({ name: 'Room 1', theater_id: testTheater._id, status: 'active' });
  testRoomEmpty = await Room.create({ name: 'Room Empty', theater_id: testTheater._id, status: 'active' });

  await Seat.insertMany([
    { room_id: testRoom._id, seat_number: 'A1', type: 'vip', base_price: 150000, status: 'active' },
    { room_id: testRoom._id, seat_number: 'A2', type: 'normal', base_price: 100000, status: 'active' },
    { room_id: testRoom._id, seat_number: 'B1', type: 'normal', base_price: 100000, status: 'inactive' },
  ]);
});


describe('Seat API', () => {

  describe('POST /api/seats/list (getAllSeats)', () => {
    it('1.1: should get all seats successfully with default pagination', async () => {
      const response = await request(app).post('/api/seats/list').send({});
      expect(response.status).toBe(200);
      expect(response.body.list).toHaveLength(3);
    });

    it('1.2: should filter seats by room_id', async () => {
      const response = await request(app).post('/api/seats/list').send({ room_id: testRoom._id.toString() });
      expect(response.status).toBe(200);
      expect(response.body.list).toHaveLength(3);
    });

    it('1.3: should filter seats by status=active', async () => {
        const response = await request(app).post('/api/seats/list').send({ status: 'active', room_id: testRoom._id.toString() });
        expect(response.status).toBe(200);
        expect(response.body.list).toHaveLength(2);
      });

    it('1.4: should filter seats by type=vip', async () => {
        const response = await request(app).post('/api/seats/list').send({ type: 'vip', room_id: testRoom._id.toString() });
        expect(response.status).toBe(200);
        expect(response.body.list).toHaveLength(1);
      });

    it('2.1: should return 400 for invalid room_id format', async () => {
      const response = await request(app).post('/api/seats/list').send({ room_id: 'invalid-id' });
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/seats/room/:roomId (getSeatsByRoom)', () => {
    it('3.1: should get seats for a specific room', async () => {
      const response = await request(app).post(`/api/seats/room/${testRoom._id}`).send({});
      expect(response.status).toBe(200);
      expect(response.body.data.seats).toHaveLength(3);
    });

    it('3.2: should filter seats by status=inactive within a room', async () => {
        const response = await request(app).post(`/api/seats/room/${testRoom._id}`).send({ status: 'inactive' });
        expect(response.status).toBe(200);
        expect(response.body.data.seats).toHaveLength(1);
      });
      
    it('2.2: should return 400 for invalid roomId format', async () => {
        const response = await request(app).post('/api/seats/room/invalid-id').send({});
        expect(response.status).toBe(400);
      });

    it('4.1: should return 404 if room not found', async () => {
      const nonExistentRoomId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).post(`/api/seats/room/${nonExistentRoomId}`).send({});
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/seats/layout/:roomId (getSeatLayout)', () => {
    it('5.1: should get seat layout and summary for a room', async () => {
      const response = await request(app).get(`/api/seats/layout/${testRoom._id}`);
      expect(response.status).toBe(200);
      expect(response.body.data.layout).toHaveProperty('A');
      expect(response.body.data.summary.total_seats).toBe(3);
    });

    it('5.2: should get empty layout for an empty room', async () => {
        const response = await request(app).get(`/api/seats/layout/${testRoomEmpty._id}`);
        expect(response.status).toBe(200);
        expect(response.body.data.layout).toEqual({});
        expect(response.body.data.summary.total_seats).toBe(0);
      });

    it('2.2: should return 400 for invalid roomId format', async () => {
        const response = await request(app).get('/api/seats/layout/invalid-id');
        expect(response.status).toBe(400);
      });

    it('4.1: should return 404 if room not found', async () => {
      const nonExistentRoomId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(`/api/seats/layout/${nonExistentRoomId}`);
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/seats/:id (getSeatById)', () => {
    let seatA1;
    beforeEach(async () => {
        seatA1 = await Seat.findOne({ seat_number: 'A1', room_id: testRoom._id });
    });

    it('6.1: should get seat details successfully', async () => {
      const response = await request(app).get(`/api/seats/${seatA1._id}`);
      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(seatA1._id.toString());
    });

    it('2.3: should return 400 for invalid seat ID format', async () => {
        const response = await request(app).get('/api/seats/invalid-id');
        expect(response.status).toBe(400);
      });

    it('4.2: should return 404 if seat not found', async () => {
      const nonExistentSeatId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(`/api/seats/${nonExistentSeatId}`);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/seats (createSeat)', () => {
    it('7.1: should create a seat successfully', async () => {
      const newSeatData = { room_id: testRoom._id.toString(), seat_number: 'C1', type: 'normal', base_price: 90000 };
      const response = await request(app).post('/api/seats').send(newSeatData);
      expect(response.status).toBe(201);
      expect(response.body.data.seat_number).toBe('C1');
    });

    it('8.1: should return 400 if required fields are missing', async () => {
        const newSeatData = { room_id: testRoom._id.toString(), seat_number: 'C1' };
        const response = await request(app).post('/api/seats').send(newSeatData);
        expect(response.status).toBe(400);
      });

    it('8.2: should return 400 if seat_number already exists in the room', async () => {
      const newSeatData = { room_id: testRoom._id.toString(), seat_number: 'A1', base_price: 90000 };
      const response = await request(app).post('/api/seats').send(newSeatData);
      expect(response.status).toBe(400);
    });

    it('4.1: should return 404 if room not found', async () => {
      const nonExistentRoomId = new mongoose.Types.ObjectId().toString();
      const newSeatData = { room_id: nonExistentRoomId, seat_number: 'D1', base_price: 90000 };
      const response = await request(app).post('/api/seats').send(newSeatData);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/seats/bulk (createBulkSeats)', () => {
    it('9.1: should create multiple seats successfully', async () => {
      const bulkData = {
        room_id: testRoom._id.toString(),
        seats: [
          { seat_number: 'D1', type: 'normal', base_price: 100000 },
          { seat_number: 'D2', type: 'vip', base_price: 160000 },
        ]
      };
      const response = await request(app).post('/api/seats/bulk').send(bulkData);
      expect(response.status).toBe(201);
      expect(response.body.data.created_count).toBe(2);
    });

    it('10.1: should return 400 if seats array is invalid or missing', async () => {
        const bulkData = { room_id: testRoom._id.toString() };
        const response = await request(app).post('/api/seats/bulk').send(bulkData);
        expect(response.status).toBe(400);
      });

    it('10.2: should return 400 if any seat data is invalid', async () => {
      const bulkData = {
        room_id: testRoom._id.toString(),
        seats: [ { seat_number: 'D1' }, { seat_number: 'D2', type: 'vip', base_price: 160000 }]
      };
      const response = await request(app).post('/api/seats/bulk').send(bulkData);
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('10.3: should return 400 if any seat_number already exists', async () => {
      const bulkData = {
        room_id: testRoom._id.toString(),
        seats: [ { seat_number: 'A1', type: 'normal', base_price: 100000 }, { seat_number: 'D2', type: 'vip', base_price: 160000 }]
      };
      const response = await request(app).post('/api/seats/bulk').send(bulkData);
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('A1');
    });

    it('4.1: should return 404 if room not found', async () => {
        const nonExistentRoomId = new mongoose.Types.ObjectId().toString();
        const bulkData = { room_id: nonExistentRoomId, seats: [{ seat_number: 'E1', base_price: 100000 }] };
        const response = await request(app).post('/api/seats/bulk').send(bulkData);
        expect(response.status).toBe(404);
      });
  });

  describe('PUT /api/seats/:id (updateSeat)', () => {
    let seatA2;
    beforeEach(async () => {
        seatA2 = await Seat.findOne({ seat_number: 'A2', room_id: testRoom._id });
    });
    it('11.1: should update seat details successfully', async () => {
      const updateData = { type: 'vip', base_price: 170000, status: 'inactive' };
      const response = await request(app).put(`/api/seats/${seatA2._id}`).send(updateData);
      expect(response.status).toBe(200);
      expect(response.body.data.type).toBe('vip');
    });

    it('12.1: should return 400 if updated seat_number already exists', async () => {
      const updateData = { seat_number: 'A1' };
      const response = await request(app).put(`/api/seats/${seatA2._id}`).send(updateData);
      expect(response.status).toBe(400);
    });

    it('2.3: should return 400 for invalid seat ID format', async () => {
        const response = await request(app).put('/api/seats/invalid-id').send({ type: 'vip' });
        expect(response.status).toBe(400);
      });

    it('4.2: should return 404 if seat not found', async () => {
      const nonExistentSeatId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).put(`/api/seats/${nonExistentSeatId}`).send({ type: 'vip' });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/seats/:id (deleteSeat)', () => {
    let seatB1;
    beforeEach(async () => {
        seatB1 = await Seat.findOne({ seat_number: 'B1', room_id: testRoom._id });
    });

    it('13.1: should soft delete seat successfully', async () => {
      const response = await request(app).delete(`/api/seats/${seatB1._id}`);
      expect(response.status).toBe(200);
      const deletedSeat = await Seat.findById(seatB1._id);
      expect(deletedSeat.status).toBe('inactive');
    });

    it('2.3: should return 400 for invalid seat ID format', async () => {
        const response = await request(app).delete('/api/seats/invalid-id');
        expect(response.status).toBe(400);
      });

    it('4.2: should return 404 if seat not found', async () => {
      const nonExistentSeatId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).delete(`/api/seats/${nonExistentSeatId}`);
      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/seats/:id/status (updateSeatStatus)', () => {
    let seatA1;
    beforeEach(async () => {
        seatA1 = await Seat.findOne({ seat_number: 'A1', room_id: testRoom._id });
    });

    it('14.1: should update seat status successfully', async () => {
      const response = await request(app).patch(`/api/seats/${seatA1._id}/status`).send({ status: 'inactive' });
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('inactive');
    });

    it('15.1: should return 400 if status is invalid', async () => {
        const response = await request(app).patch(`/api/seats/${seatA1._id}/status`).send({ status: 'broken' });
        expect(response.status).toBe(400);
      });

    it('15.2: should return 400 if status is missing', async () => {
        const response = await request(app).patch(`/api/seats/${seatA1._id}/status`).send({});
        expect(response.status).toBe(400);
      });

    it('2.3: should return 400 for invalid seat ID format', async () => {
        const response = await request(app).patch('/api/seats/invalid-id/status').send({ status: 'active' });
        expect(response.status).toBe(400);
      });

    it('4.2: should return 404 if seat not found', async () => {
      const nonExistentSeatId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).patch(`/api/seats/${nonExistentSeatId}/status`).send({ status: 'active' });
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/seats/:id/stats (getSeatStats)', () => {
    let seatA1;
    beforeEach(async () => {
        seatA1 = await Seat.findOne({ seat_number: 'A1', room_id: testRoom._id });
    });

    it('16.1: should get seat stats successfully', async () => {
      const response = await request(app).get(`/api/seats/${seatA1._id}/stats`);
      expect(response.status).toBe(200);
      expect(response.body.data.seat.id).toBe(seatA1._id.toString());
    });

    it('2.3: should return 400 for invalid seat ID format', async () => {
        const response = await request(app).get('/api/seats/invalid-id/stats');
        expect(response.status).toBe(400);
      });

    it('4.2: should return 404 if seat not found', async () => {
      const nonExistentSeatId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(`/api/seats/${nonExistentSeatId}/stats`);
      expect(response.status).toBe(404);
    });
  });

});