import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// --- Khai báo biến toàn cục ---
let request, mongoose, MongoMemoryServer, express;
let User, Theater, Room, Movie, Seat, Showtime, Booking, BookingSeat;
let bookingRoutes, errorHandler, payos; // payos sẽ là mock
let mongoServer;
let app;

// --- Biến dữ liệu test ---
let customerId, adminId, otherCustomerId, offlineUserId;
let testTheater, testRoom, seatA1, seatA2, seatA3, testMovie, testShowtime;
let testBookingPending, testBookingConfirmed; // Các booking mẫu
let FAKE_ORDER_CODE = 123456;
let FAKE_PAYMENT_LINK_ID = 'pl_abcdef123456';

// --- Thiết lập môi trường test ---
beforeAll(async () => {
  // --- Set fake environment variables ---
  process.env.PAYOS_CLIENT_ID = 'fake-client-id';
  process.env.PAYOS_API_KEY = 'fake-api-key';
  process.env.PAYOS_CHECKSUM_KEY = 'fake-checksum-key';
  process.env.FRONTEND_URL = 'http://fake-frontend.com';

  // --- Mock các module phụ thuộc ---
  // 1. Mock Middleware xác thực
  await jest.unstable_mockModule('../middlewares/auth.js', () => ({
    verifyToken: jest.fn((req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ message: 'Chưa xác thực' });
      
      const token = authHeader.split(' ')[1];
      if (token === 'customer-token') {
        // req.user._id phải là ObjectId, req.user.id là string
        req.user = { _id: new mongoose.Types.ObjectId(customerId), id: customerId, role: 'customer' };
      } else if (token === 'admin-token') {
        req.user = { _id: new mongoose.Types.ObjectId(adminId), id: adminId, role: 'admin' };
      } else if (token === 'other-customer-token') {
        req.user = { _id: new mongoose.Types.ObjectId(otherCustomerId), id: otherCustomerId, role: 'customer' };
      } else if (token === 'staff-token') {
        req.user = { _id: new mongoose.Types.ObjectId(adminId), id: adminId, role: 'LV2' }; // Staff dùng chung ID admin
      } else {
        return res.status(401).json({ message: 'Token không hợp lệ' });
      }
      next();
    }),
    isAdmin: jest.fn((req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Không có quyền Admin' }))),
    isStaff: jest.fn((req, res, next) => (['admin', 'LV1', 'LV2'].includes(req.user.role) ? next() : res.status(403).json({ message: 'Không có quyền Staff' }))),
  }));

  // 2. Mock Timezone utils
  await jest.unstable_mockModule('../utils/timezone.js', () => ({
    formatForAPI: jest.fn((date) => new Date(date).toISOString()),
  }));

  // 3. Mock PayOS SDK (Rất quan trọng)
  await jest.unstable_mockModule('../utils/payos.js', () => ({
    default: {
      createPaymentLink: jest.fn(),
      verifyPaymentWebhookData: jest.fn(),
      getPaymentLinkInformation: jest.fn(),
    }
  }));
  // --- Hết Mock ---

  // --- Import động (Bắt buộc cho ES Module) ---
  request = (await import('supertest')).default;
  MongoMemoryServer = (await import('mongodb-memory-server')).MongoMemoryServer;
  express = (await import('express')).default;
  mongoose = (await import('mongoose')).default;
  payos = (await import('../utils/payos.js')).default; // Lấy mock

  // Import models (Giả định đường dẫn models là chính xác)
  User = (await import('../models/user.js')).default;
  Theater = (await import('../models/theater.js')).default;
  Room = (await import('../models/room.js')).default;
  Movie = (await import('../models/movie.js')).default;
  Seat = (await import('../models/seat.js')).default;
  Showtime = (await import('../models/showtime.js')).default;
  Booking = (await import('../models/booking.js')).default;
  BookingSeat = (await import('../models/bookingSeat.js')).default;

  // Import routes (Giả sử file routes của bạn tên là booking.routes.js)
  bookingRoutes = (await import('../routes/booking.routes.js')).default;
  errorHandler = (await import('../middlewares/errorHandler.js')).default;

  // --- Khởi tạo ID ---
  customerId = new mongoose.Types.ObjectId().toHexString();
  adminId = new mongoose.Types.ObjectId().toHexString();
  otherCustomerId = new mongoose.Types.ObjectId().toHexString();
  offlineUserId = new mongoose.Types.ObjectId().toHexString();
  
  // --- Khởi tạo DB và App ---
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  // Gắn tất cả routes (booking và payment) vào '/api/bookings'
  app.use('/api/bookings', bookingRoutes); 
  app.use(errorHandler);
});

// --- Dọn dẹp ---
afterAll(async () => {
  if (mongoose) await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  jest.unmock('../middlewares/auth.js');
  jest.unmock('../utils/timezone.js');
  jest.unmock('../utils/payos.js');
});

// --- Setup dữ liệu test chung ---
beforeEach(async () => {
  // Xóa sạch DB
  await User.deleteMany({});
  await Theater.deleteMany({});
  await Room.deleteMany({});
  await Movie.deleteMany({});
  await Seat.deleteMany({});
  await Showtime.deleteMany({});
  await Booking.deleteMany({});
  await BookingSeat.deleteMany({});
  
  // Reset mocks
  jest.clearAllMocks();

  // Tạo User
  await User.create([
    { _id: customerId, username: 'testUser', email: 'customer@test.com', phone: '0123456789' },
    { _id: adminId, username: 'testAdmin', email: 'admin@test.com', role: 'admin' },
    { _id: otherCustomerId, username: 'otherUser', email: 'other@test.com' },
    { _id: offlineUserId, username: 'offlineUser', email: 'offline@test.com', phone: '0987654321' },
  ]);

  // Tạo hạ tầng rạp
  testTheater = await Theater.create({ name: 'Test Theater' });
  testRoom = await Room.create({ name: 'Room 1', theater_id: testTheater._id });
  [seatA1, seatA2, seatA3] = await Seat.create([
    { room_id: testRoom._id, seat_number: 'A1', base_price: 100000 },
    { room_id: testRoom._id, seat_number: 'A2', base_price: 120000 },
    { room_id: testRoom._id, seat_number: 'A3', base_price: 100000 }, // Ghế trống
  ]);

  // Tạo Phim và Suất chiếu
  testMovie = await Movie.create({ title: 'Test Movie', duration: 120 });
  testShowtime = await Showtime.create({
    movie_id: testMovie._id,
    room_id: testRoom._id,
    start_time: new Date('2025-01-01T10:00:00Z'),
    end_time: new Date('2025-01-01T12:00:00Z'),
    status: 'active',
    booked_seats: [seatA1._id, seatA2._id] // ✅ Quan trọng: Logic $pull của bạn dựa vào đây
  });

  // Tạo một booking 'pending' (A1)
  testBookingPending = await Booking.create({
    user_id: customerId,
    showtime_id: testShowtime._id,
    total_price: 100000,
    status: 'pending',
    payment_status: 'pending',
    order_code: FAKE_ORDER_CODE, // Dùng cho webhook test
    payment_link_id: FAKE_PAYMENT_LINK_ID // Dùng cho check status
  });
  await BookingSeat.create({ booking_id: testBookingPending._id, seat_id: seatA1._id });

  // Tạo một booking 'confirmed' (A2)
  testBookingConfirmed = await Booking.create({
    user_id: otherCustomerId,
    showtime_id: testShowtime._id,
    total_price: 120000,
    status: 'confirmed',
    payment_status: 'success'
  });
  await BookingSeat.create({ booking_id: testBookingConfirmed._id, seat_id: seatA2._id });
});
// --- Hết Setup ---


// ===============================================
// == Bắt đầu các bộ test cho Booking API (CRUD)
// ===============================================
describe('Booking API (CRUD)', () => {

  describe('POST /api/bookings (createBooking)', () => {
    it('1.1: nên tạo booking thành công với ghế trống (A3)', async () => {
      const newBookingData = {
        showtime_id: testShowtime._id.toString(),
        seat_ids: [seatA3._id.toString()], // Đặt ghế A3 (trống)
        payment_method: 'cash'
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', 'Bearer customer-token')
        .send(newBookingData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Tạo đặt vé thành công');
      expect(response.body.booking.user_id).toBe(customerId);
      expect(response.body.booking.total_price).toBe(100000); // Giá của ghế A3
    });

    it('2.1: nên trả về lỗi 400 nếu ghế (A1) đang pending', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', 'Bearer customer-token')
        .send({ showtime_id: testShowtime._id, seat_ids: [seatA1._id] });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Ghế đã được đặt');
    });

    it('2.2: nên trả về lỗi 400 nếu ghế (A2) đã confirmed', async () => {
        const response = await request(app)
            .post('/api/bookings')
            .set('Authorization', 'Bearer customer-token')
            .send({ showtime_id: testShowtime._id, seat_ids: [seatA2._id] });
        
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Ghế đã được đặt');
    });

    it('2.3: nên trả về lỗi 401 nếu không đăng nhập', async () => {
        const response = await request(app)
            .post('/api/bookings')
            .send({ showtime_id: testShowtime._id, seat_ids: [seatA3._id] });
        expect(response.status).toBe(401);
    });
  });

  describe('GET /api/bookings/my-bookings', () => {
    it('3.1: nên lấy lịch sử đặt vé của user đã đăng nhập', async () => {
      const response = await request(app)
        .get('/api/bookings/my-bookings')
        .set('Authorization', 'Bearer customer-token');
      
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]._id).toBe(testBookingPending._id.toString());
      expect(response.body[0].showtime_id.movie_id.title).toBe('Test Movie');
    });

    it('3.2: nên trả về mảng rỗng nếu user không có booking', async () => {
        const response = await request(app)
          .get('/api/bookings/my-bookings')
          .set('Authorization', 'Bearer admin-token'); // Admin (ID khác)
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(0);
    });
  });

  describe('POST /api/bookings/offline (createOfflineBooking)', () => {
    it('4.1: (Admin/Staff) nên tạo booking offline thành công bằng SĐT', async () => {
        const newBookingData = {
            showtime_id: testShowtime._id.toString(),
            seat_ids: [seatA3._id.toString()], // Đặt ghế A3
            payment_method: 'cash',
            phone: '0987654321' // SĐT của offlineUser
        };
        
        const response = await request(app)
            .post('/api/bookings/offline')
            .set('Authorization', 'Bearer admin-token') // Đăng nhập với admin
            .send(newBookingData);

        expect(response.status).toBe(201);
        expect(response.body.booking.user_id).toBe(offlineUserId);
    });

    it('4.2: (Admin/Staff) nên trả về lỗi 400 nếu SĐT không tồn tại', async () => {
        const newBookingData = {
            showtime_id: testShowtime._id,
            seat_ids: [seatA3._id],
            payment_method: 'cash',
            phone: '000000000' // SĐT không tồn tại
        };
        
        const response = await request(app)
            .post('/api/bookings/offline')
            .set('Authorization', 'Bearer admin-token')
            .send(newBookingData);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Không tìm thấy người dùng');
    });

    it('4.3: (Customer) KHÔNG nên tạo được booking offline', async () => {
          const response = await request(app)
            .post('/api/bookings/offline')
            .set('Authorization', 'Bearer customer-token') // Customer
            .send({});
        expect(response.status).toBe(403); // Bị mock isStaff chặn
    });
  });

  describe('GET /api/bookings/:id (getBookingDetails)', () => {
    it('5.1: Customer nên lấy được chi tiết booking của mình', async () => {
        const response = await request(app)
            .get(`/api/bookings/${testBookingPending._id}`)
            .set('Authorization', 'Bearer customer-token'); // Chính chủ
        
        expect(response.status).toBe(200);
        expect(response.body.booking._id).toBe(testBookingPending._id.toString());
        expect(response.body.seats).toHaveLength(1);
        expect(response.body.seats[0].seat_id.seat_number).toBe('A1');
    });

    it('5.2: Customer KHÔNG nên lấy được chi tiết booking của người khác', async () => {
        const response = await request(app)
            .get(`/api/bookings/${testBookingPending._id}`)
            .set('Authorization', 'Bearer other-customer-token'); // User khác
        
        expect(response.status).toBe(403); // Bị cấm
        expect(response.body.message).toContain('không có quyền xem');
    });

    it('5.3: Admin nên lấy được chi tiết booking của bất kỳ ai', async () => {
        const response = await request(app)
            .get(`/api/bookings/${testBookingPending._id}`)
            .set('Authorization', 'Bearer admin-token'); // Admin
        
        expect(response.status).toBe(200);
        expect(response.body.booking.user_id.username).toBe('testUser');
    });
  });

  describe('PATCH /api/bookings/:id/cancel (cancelBooking)', () => {
    // (Giả sử route là /:id/cancel. Nếu route là DELETE /:id, hãy đổi tên test)
    it('6.1: Customer nên hủy được booking của mình và ghế được giải phóng', async () => {
        const response = await request(app)
            .patch(`/api/bookings/${testBookingPending._id}/cancel`)
            .set('Authorization', 'Bearer customer-token'); // Chính chủ
        
        expect(response.status).toBe(200);
        expect(response.body.booking.status).toBe('cancelled');

        // Kiểm tra xem ghế đã được giải phóng khỏi Showtime chưa
        const showtime = await Showtime.findById(testShowtime._id);
        expect(showtime.booked_seats).toHaveLength(1); // Chỉ còn A2 (từ testBookingConfirmed)
        expect(showtime.booked_seats).not.toContain(seatA1._id);
    });

    it('6.2: Admin cũng nên hủy được booking của customer', async () => {
        const response = await request(app)
            .patch(`/api/bookings/${testBookingPending._id}/cancel`)
            .set('Authorization', 'Bearer admin-token'); // Admin
        
        expect(response.status).toBe(200);
        expect(response.body.booking.status).toBe('cancelled');
    });

    it('6.3: nên trả về lỗi 400 nếu hủy booking đã hủy', async () => {
        await testBookingPending.updateOne({ status: 'cancelled' }); // Hủy trước
        const response = await request(app)
            .patch(`/api/bookings/${testBookingPending._id}/cancel`)
            .set('Authorization', 'Bearer customer-token');
        
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('đã được hủy trước đó');
    });
  });

  describe('Admin Operations (getAll, updateStatus, getByUser)', () => {
      it('7.1: (Admin) nên lấy được TẤT CẢ booking', async () => {
        const response = await request(app)
            .get('/api/bookings')
            .set('Authorization', 'Bearer admin-token');
        
        expect(response.status).toBe(200);
        expect(response.body.bookings).toHaveLength(2);
      });

      it('7.2: (Customer) KHÔNG nên lấy được tất cả booking', async () => {
        const response = await request(app)
            .get('/api/bookings')
            .set('Authorization', 'Bearer customer-token'); // Customer
        
        expect(response.status).toBe(403); // Bị cấm bởi mock 'isAdmin'
      });

      it('8.1: (Admin) nên cập nhật được status (confirmed)', async () => {
        const response = await request(app)
            .patch(`/api/bookings/${testBookingPending._id}/status`)
            .set('Authorization', 'Bearer admin-token')
            .send({ status: 'confirmed', payment_status: 'success' });
        
        expect(response.status).toBe(200);
        expect(response.body.booking.status).toBe('confirmed');
      });
      
      it('8.2: (Admin) nên giải phóng ghế nếu cập nhật status (cancelled)', async () => {
        const response = await request(app)
            .patch(`/api/bookings/${testBookingPending._id}/status`)
            .set('Authorization', 'Bearer admin-token')
            .send({ status: 'cancelled' });
        
        expect(response.status).toBe(200);
        const showtime = await Showtime.findById(testShowtime._id);
        expect(showtime.booked_seats).toHaveLength(1); // Chỉ còn A2
      });

      it('9.1: (Admin) nên lấy được booking của user bất kỳ', async () => {
        const response = await request(app)
            .get(`/api/bookings/user/${otherCustomerId}`)
            .set('Authorization', 'Bearer admin-token');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]._id).toBe(testBookingConfirmed._id.toString());
      });

      it('9.2: (Admin) nên trả về 404 nếu user không có booking', async () => {
        const response = await request(app)
            .get(`/api/bookings/user/${adminId}`) // Admin tự tìm
            .set('Authorization', 'Bearer admin-token');
        expect(response.status).toBe(404);
      });
  });
});

// ===============================================
// == Bắt đầu các bộ test cho Payment API (PayOS)
// ===============================================
describe('Payment API (PayOS)', () => {

  describe('POST /api/bookings/payment-link (createPaymentLink)', () => {
    beforeEach(() => {
        // Mock hàm createPaymentLink thành công
        payos.createPaymentLink.mockResolvedValue({
          checkoutUrl: 'http://fake-payos-url.com',
          paymentLinkId: FAKE_PAYMENT_LINK_ID,
        });
    });

    it('1.1: nên tạo link thanh toán cho booking (pending) của chính mình', async () => {
      const response = await request(app)
        .post('/api/bookings/payment-link')
        .set('Authorization', 'Bearer customer-token')
        .send({ bookingId: testBookingPending._id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.data.paymentLink).toBe('http://fake-payos-url.com');
      // Kiểm tra xem controller đã gọi PayOS SDK đúng chưa
      expect(payos.createPaymentLink).toHaveBeenCalledWith(expect.objectContaining({
        amount: 100000,
        orderCode: FAKE_ORDER_CODE,
      }));
    });
    
    it('2.1: nên trả về lỗi 403 nếu tạo link cho booking của người khác', async () => {
        const response = await request(app)
            .post('/api/bookings/payment-link')
            .set('Authorization', 'Bearer other-customer-token') // User khác
            .send({ bookingId: testBookingPending._id.toString() }); // Booking của customer
        expect(response.status).toBe(403);
    });

    it('2.2: nên trả về lỗi 400 nếu booking đã (confirmed)', async () => {
        const response = await request(app)
            .post('/api/bookings/payment-link')
            .set('Authorization', 'Bearer other-customer-token') // Chính chủ của booking confirmed
            .send({ bookingId: testBookingConfirmed._id.toString() });
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('không ở trạng thái pending');
    });

    it('2.3: nên trả về lỗi 404 nếu booking không tồn tại', async () => {
        const fakeId = new mongoose.Types.ObjectId().toHexString();
        const response = await request(app)
            .post('/api/bookings/payment-link')
            .set('Authorization', 'Bearer customer-token')
            .send({ bookingId: fakeId });
        expect(response.status).toBe(404);
    });

    it('2.4: nên trả về lỗi 400 nếu description quá dài (PayOS API Error)', async () => {
        // Tạo booking mới với ID dài để test lỗi description
        const longIdBooking = new Booking({
          _id: new mongoose.Types.ObjectId(),
          user_id: customerId,
          showtime_id: testShowtime._id,
          total_price: 100,
          status: 'pending',
        });
        await longIdBooking.save();

        // Mock PayOS trả về lỗi code '20' (description too long)
        payos.createPaymentLink.mockImplementation(() => {
          const err = new Error("Description too long");
          err.code = '20'; // Hoặc 20
          throw err;
        });

        const response = await request(app)
            .post('/api/bookings/payment-link')
            .set('Authorization', 'Bearer customer-token')
            .send({ bookingId: longIdBooking._id.toString() });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('mô tả quá dài');
    });
  });

  describe('POST /api/bookings/webhook (handlePayosWebhook)', () => {
    it('3.1: nên cập nhật booking (confirmed) khi webhook (code 00) thành công', async () => {
        const webhookPayload = { code: "00", orderCode: FAKE_ORDER_CODE, amount: 100000, description: 'Success' };
        // Mock verify, trả về chính payload
        payos.verifyPaymentWebhookData.mockReturnValue(webhookPayload);
        
        const response = await request(app)
            .post('/api/bookings/webhook')
            .send(webhookPayload);

        expect(response.status).toBe(200);
        const booking = await Booking.findById(testBookingPending._id);
        expect(booking.status).toBe('confirmed');
        expect(booking.payment_status).toBe('success');
    });

    it('3.2: nên cập nhật booking (cancelled) và giải phóng ghế khi webhook (code 24) thất bại', async () => {
        // 💡 ĐÃ SỬA: Test này yêu cầu ghế PHẢI được giải phóng khi booking bị hủy/thất bại thanh toán.
        const webhookPayload = { code: "24", orderCode: FAKE_ORDER_CODE, description: 'Cancelled' };
        payos.verifyPaymentWebhookData.mockReturnValue(webhookPayload);

        const response = await request(app)
            .post('/api/bookings/webhook')
            .send(webhookPayload);
        
        expect(response.status).toBe(200);
        const booking = await Booking.findById(testBookingPending._id);
        expect(booking.status).toBe('cancelled');
        expect(booking.payment_status).toBe('failed');

        // Kiểm tra ghế (A1) PHẢI được giải phóng khỏi mảng booked_seats của Showtime
        const showtime = await Showtime.findById(testShowtime._id);
        expect(showtime.booked_seats).toHaveLength(1); // Chỉ còn A2 (từ confirmed booking)
        expect(showtime.booked_seats).not.toContainEqual(seatA1._id); // A1 đã được giải phóng
    });
    
    it('3.3: nên trả về lỗi 400 nếu xác thực webhook thất bại', async () => {
        payos.verifyPaymentWebhookData.mockImplementation(() => {
            throw new Error("Invalid checksum");
        });
        
        const response = await request(app)
            .post('/api/bookings/webhook')
            .send({ code: "00" });
        
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('verification failed');
    });

    it('3.4: nên bỏ qua nếu booking đã (confirmed)', async () => {
        const webhookPayload = { code: "00", orderCode: testBookingConfirmed.order_code, amount: 120000 };
        payos.verifyPaymentWebhookData.mockReturnValue(webhookPayload);
        
        // Booking Confirmed đã sẵn sàng (testBookingConfirmed)
        const response = await request(app)
            .post('/api/bookings/webhook')
            .send(webhookPayload);

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('Webhook already processed');
    });
  });

  describe('GET /api/bookings/payment-status/:bookingId (checkBookingPaymentStatus)', () => {
    it('4.1: nên đối soát (reconcile) DB nếu PayOS (PAID) và DB (pending)', async () => {
        // Mock PayOS SDK
        payos.getPaymentLinkInformation.mockResolvedValue({
          status: 'PAID',
          amountPaid: 100000,
          orderCode: FAKE_ORDER_CODE
        });
        
        // testBookingPending đang ở status 'pending'
        const response = await request(app)
            .get(`/api/bookings/payment-status/${testBookingPending._id}`)
            .set('Authorization', 'Bearer customer-token');

        expect(response.status).toBe(200);
        expect(response.body.data.paymentInfo.status).toBe('PAID');
        
        // Kiểm tra DB đã được cập nhật (reconciled)
        const booking = await Booking.findById(testBookingPending._id);
        expect(booking.status).toBe('confirmed');
        expect(booking.payment_status).toBe('success');
    });

    it('4.2: nên đối soát (reconcile) và giải phóng ghế nếu PayOS (CANCELLED) và DB (pending)', async () => {
        payos.getPaymentLinkInformation.mockResolvedValue({ status: 'CANCELLED' });
        
        const response = await request(app)
            .get(`/api/bookings/payment-status/${testBookingPending._id}`)
            .set('Authorization', 'Bearer customer-token');

        expect(response.status).toBe(200);

        // Kiểm tra DB
        const booking = await Booking.findById(testBookingPending._id);
        expect(booking.status).toBe('cancelled');
        
        // Kiểm tra ghế (A1) đã được giải phóng
        const showtime = await Showtime.findById(testShowtime._id);
        expect(showtime.booked_seats).toHaveLength(1); // Chỉ còn A2
        expect(showtime.booked_seats).not.toContainEqual(seatA1._id);
    });

    it('4.3: KHÔNG nên đối soát nếu DB đã (confirmed)', async () => {
        payos.getPaymentLinkInformation.mockResolvedValue({ status: 'CANCELLED' }); // Dù PayOS nói Cancelled
        
        const response = await request(app)
            .get(`/api/bookings/payment-status/${testBookingConfirmed._id}`) // Dùng booking đã confirmed
            .set('Authorization', 'Bearer other-customer-token'); // Chính chủ

        expect(response.status).toBe(200);
        // Kiểm tra DB không bị thay đổi
        const booking = await Booking.findById(testBookingConfirmed._id);
        expect(booking.status).toBe('confirmed'); 
    });
  });
});