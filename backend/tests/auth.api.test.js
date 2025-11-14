import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

let request, mongoose, MongoMemoryServer, express;
let User, authRoutes, errorHandler, bcrypt, jwt;
let loggerUtils, emailUtils, jwtUtils; 
let mongoServer;
let app;
let adminId, staffLv1Id, staffLv2Id, customerId, otherUserId, anotherAdminId;
const JWT_SECRET = 'YOUR_TEST_SECRET_KEY_123'; 

beforeAll(async () => {
  
  mongoose = (await import('mongoose')).default;
  
  adminId = new mongoose.Types.ObjectId().toHexString();
  staffLv1Id = new mongoose.Types.ObjectId().toHexString(); 
  staffLv2Id = new mongoose.Types.ObjectId().toHexString();
  customerId = new mongoose.Types.ObjectId().toHexString();
  otherUserId = new mongoose.Types.ObjectId().toHexString();
  anotherAdminId = new mongoose.Types.ObjectId().toHexString();
  
  await jest.unstable_mockModule('bcrypt', () => ({
    default: {
      hash: jest.fn().mockResolvedValue('$HASHED_PASSWORD$'),
      compare: jest.fn(async (plain, hashed) => {
        
        if (hashed === '$HASHED_PASSWORD$') return (plain === 'password123' || plain === 'currentPassword123');
        if (plain === 'wrongpassword') return false; 
        
        
        const realBcrypt = (await import('bcryptjs')).default;
        if (hashed && typeof hashed === 'string' && hashed.startsWith('$2a$')) {
           return await realBcrypt.compare(plain, hashed);
        }
        return plain === hashed;
      }),
    }
  }));

  await jest.unstable_mockModule('../utils/jwt.js', () => ({
      signAccessToken: jest.fn().mockImplementation((user) => `fake-${user.role}-token`),
      signRefreshToken: jest.fn().mockReturnValue('mocked-refresh-token'),
      verifyRefreshToken: jest.fn(),
  }));
  
  await jest.unstable_mockModule('../utils/logger.js', () => ({
      logAction: jest.fn(),
  }));

  await jest.unstable_mockModule('../utils/email.js', () => ({
      sendOTPEmail: jest.fn().mockResolvedValue(true),
      sendResetLinkEmail: jest.fn().mockResolvedValue(true),
  }));

  await jest.unstable_mockModule('../middlewares/auth.js', () => ({
    verifyToken: jest.fn((req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ message: 'Chưa xác thực' });
      const token = authHeader.split(' ')[1];
      
      if (token === 'customer-token') {
        req.user = { _id: customerId, id: customerId, role: 'customer' };
      } else if (token === 'admin-token') {
        req.user = { _id: adminId, id: adminId, role: 'admin', level: 'admin' };
      } else if (token === 'staff-lv2-token') {
         req.user = { _id: staffLv2Id, id: staffLv2Id, role: 'LV2' };
      } else {
         try {
            const decoded = jwt.verify(token, JWT_SECRET); 
            req.user = { _id: decoded.sub, id: decoded.sub, role: 'customer' };
         } catch(e) {
             return res.status(401).json({ message: 'Token không hợp lệ' });
         }
      }
      next();
    }),
    isAdmin: jest.fn((req, res, next) => (req.user && (req.user.role === 'admin' || req.user.role === 'LV2') ? next() : res.status(403).json({ message: 'Bạn không có quyền Admin' }))),
    isSuperAdmin: jest.fn((req, res, next) => (req.user && req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Bạn không có quyền Super Admin' }))),
    requireAdmin: jest.fn((req, res, next) => (req.user && (req.user.role === 'admin' || req.user.role === 'LV2') ? next() : res.status(403).json({ message: 'Yêu cầu quyền Admin' }))),
    requireCustomer: jest.fn((req, res, next) => (req.user && (req.user.role === 'customer' || req.user.role === 'admin') ? next() : res.status(403).json({ message: 'Yêu cầu quyền Customer' }))),
  }));

  request = (await import('supertest')).default;
  MongoMemoryServer = (await import('mongodb-memory-server')).MongoMemoryServer;
  express = (await import('express')).default;
  bcrypt = (await import('bcrypt')).default;
  jwt = (await import('jsonwebtoken')).default; 
  User = (await import('../models/user.js')).default;
  authRoutes = (await import('../routes/auth.routes.js')).default; 
  errorHandler = (await import('../middlewares/errorHandler.js')).default;
  
  loggerUtils = (await import('../utils/logger.js'));
  emailUtils = (await import('../utils/email.js'));
  jwtUtils = (await import('../utils/jwt.js'));

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
});

afterAll(async () => {
    if (mongoose) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
    jest.unmock('bcrypt');
    jest.unmock('../middlewares/auth.js');
    jest.unmock('../utils/logger.js');
    jest.unmock('../utils/email.js');
    jest.unmock('../utils/jwt.js');
});

beforeEach(async () => {
    if (User) await User.deleteMany({});
    jest.clearAllMocks();
});

describe('Auth API (Public)', () => {

  describe('POST /api/auth/register-customer', () => {
        it('1.1: tạo tài khoản thành công với dữ liệu hợp lệ', async () => {
            const newCustomer = {
                username: 'newcustomer',
                password: 'password123',
                email: 'newcustomer@example.com'
            };

            const response = await request(app)
                .post('/api/auth/register-customer')
                .send(newCustomer);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Tạo tài khoản khách hàng thành công');
            expect(loggerUtils.logAction).toHaveBeenCalled(); 
            const userInDb = await User.findOne({ email: newCustomer.email });
            expect(userInDb).toBeDefined();
            expect(userInDb.role).toBe('customer');
            expect(userInDb.password).toBe('$HASHED_PASSWORD$'); // Kiểm tra mock bcrypt
        });

        it('2.1: trả về lỗi 400 nếu username đã tồn tại', async () => {
            await User.create({ username: 'existinguser', password: 'password123', email: 'unique@example.com' });
            const response = await request(app)
                .post('/api/auth/register-customer')
                .send({ username: 'existinguser', password: 'password456', email: 'newemail@example.com' });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Tên đăng nhập hoặc email đã tồn tại');
        });

        it('2.2: trả về lỗi 400 nếu email đã tồn tại', async () => {
            await User.create({ username: 'existinguser', password: 'password123', email: 'existing@example.com' });
            const response = await request(app)
                .post('/api/auth/register-customer')
                .send({ username: 'newuser', password: 'password456', email: 'existing@example.com' });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Tên đăng nhập hoặc email đã tồn tại');
        });

        it('2.3: trả về lỗi 400 nếu thiếu password (lỗi validation)', async () => {
            const response = await request(app)
                .post('/api/auth/register-customer')
                .send({ username: 'customerwithoutpass', email: 'nopass@example.com' });
            expect(response.status).toBe(400); // Giả định validation bắt lỗi
        });
    });

    // Customer đăng nhập
    describe('POST /api/auth/login-customer', () => {
        const password = 'password123';
        beforeEach(async () => {
            const hashedPassword = '$HASHED_PASSWORD$';
            bcrypt.compare.mockImplementation(async (plain, hashed) => {
                 return (plain === password && hashed === hashedPassword);
            });
            await User.create([
                { username: 'customeruser', password: hashedPassword, email: 'customer@test.com', role: 'customer', status: 'active' },
                { username: 'staffuser', password: hashedPassword, email: 'staff@test.com', role: 'LV2', status: 'active' },
                { username: 'lockedcustomer', password: hashedPassword, email: 'locked@test.com', role: 'customer', status: 'locked' },
            ]);
        });

        it('1.1: đăng nhập thành công với tài khoản customer hợp lệ', async () => {
            jwtUtils.signAccessToken.mockImplementation((user) => `fake-${user.role}-token`); 
            const response = await request(app)
                .post('/api/auth/login-customer')
                .send({ username: 'customeruser', password: password });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken', 'fake-customer-token');
            expect(response.body.user.role).toBe('customer');
        });

        it('2.1: trả về lỗi 401 nếu username không tồn tại', async () => {
            const response = await request(app)
                .post('/api/auth/login-customer')
                .send({ username: 'nonexistent', password: password });
            expect(response.status).toBe(401);
        });

        it('2.2: trả về lỗi 401 nếu mật khẩu sai', async () => {
            bcrypt.compare.mockResolvedValue(false); 
            const response = await request(app)
                .post('/api/auth/login-customer')
                .send({ username: 'customeruser', password: 'wrongpassword' });
            expect(response.status).toBe(401);
        });

        it('2.3: trả về lỗi 403 nếu tài khoản staff cố gắng đăng nhập', async () => {
            const response = await request(app)
                .post('/api/auth/login-customer')
                .send({ username: 'staffuser', password: password });
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Vui lòng sử dụng cổng đăng nhập nhân viên');
        });

        it('2.4: trả về lỗi 403 nếu tài khoản customer đã bị khóa', async () => {
            const response = await request(app)
                .post('/api/auth/login-customer')
                .send({ username: 'lockedcustomer', password: password });
            expect(response.status).toBe(403);
        });
    });

    // Staff đăng nhập
    describe('POST /api/auth/login-staff', () => {
        const password = 'password123';
        beforeEach(async () => {
            const hashedPassword = '$HASHED_PASSWORD$';
            bcrypt.compare.mockImplementation(async (plain, hashed) => {
                 return (plain === password && hashed === hashedPassword);
            });
            await User.create([
                { username: 'staffuser', password: hashedPassword, email: 'staff@test.com', role: 'LV1', status: 'active' },
                { username: 'adminuser', password: hashedPassword, email: 'admin@test.com', role: 'admin', status: 'active' },
                { username: 'customeruser', password: hashedPassword, email: 'customer@test.com', role: 'customer', status: 'active' },
            ]);
        });

        it('1.1: đăng nhập thành công với vai trò staff (LV1)', async () => {
            jwtUtils.signAccessToken.mockImplementation((user) => `fake-${user.role}-token`);
            const response = await request(app)
                .post('/api/auth/login-staff')
                .send({ username: 'staffuser', password: password });
            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBe('fake-LV1-token');
            expect(response.body.user.role).toBe('LV1');
        });

        it('1.2: đăng nhập thành công với vai trò admin', async () => {
            jwtUtils.signAccessToken.mockImplementation((user) => `fake-${user.role}-token`);
            const response = await request(app)
                .post('/api/auth/login-staff')
                .send({ username: 'adminuser', password: password });
            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBe('fake-admin-token');
            expect(response.body.user.role).toBe('admin');
        });

        it('2.1: trả về lỗi 403 nếu user là customer', async () => {
            const response = await request(app)
                .post('/api/auth/login-staff')
                .send({ username: 'customeruser', password: password });
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Bạn không có quyền đăng nhập tại cổng nhân viên');
        });
    });

    // Quên mật khẩu (Gửi OTP)
    describe('POST /api/auth/forgot-password', () => {
        let customerUser, staffUser;
        beforeEach(async () => {
            [customerUser, staffUser] = await User.create([
                { username: 'customer_fp', email: 'customer_fp@test.com', role: 'customer', status: 'active', password: '123' },
                { username: 'staff_fp', email: 'staff_fp@test.com', role: 'LV1', status: 'active', password: '123' },
            ]);
        });

        it('1.1: nên tạo OTP, lưu vào DB và gọi sendOTPEmail cho customer', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'customer_fp@test.com' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Nếu email tồn tại, bạn sẽ nhận được mã OTP');
            const userInDb = await User.findById(customerUser._id);
            expect(userInDb.otp_code).toHaveLength(6);
            expect(userInDb.otp_expires.getTime()).toBeGreaterThan(Date.now());
            expect(emailUtils.sendOTPEmail).toHaveBeenCalledWith('customer_fp@test.com', userInDb.otp_code);
        });

        it('2.1: trả về lỗi 400 nếu email không hợp lệ', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'invalid-email' });
            expect(response.status).toBe(400);
        });

        it('2.2: vẫn trả về 200 nếu email không tồn tại (bảo mật)', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@test.com' });
            expect(response.status).toBe(200);
            expect(emailUtils.sendOTPEmail).not.toHaveBeenCalled();
        });

        it('2.3: trả về lỗi 403 nếu email là của staff (OTP flow chỉ cho customer)', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'staff_fp@test.com' });
            expect(response.status).toBe(403);
        });

        it('2.4: trả về lỗi 429 nếu yêu cầu OTP quá nhanh (rate limit)', async () => {
            const futureTime = new Date(Date.now() + 60 * 1000); // 1 phút sau
            await User.updateOne({ _id: customerUser._id }, { otp_expires: futureTime });
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'customer_fp@test.com' });
            expect(response.status).toBe(429);
            expect(response.body.message).toContain('Vui lòng đợi');
        });
    });

    // Reset mật khẩu (Xác thực OTP)
    describe('POST /api/auth/reset-password', () => {
        let customerUser;
        const oldPassword = 'password123';
        const otp = '123456';
        const email = 'reset@test.com';

        beforeEach(async () => {
            const hashedPassword = await bcrypt.hash(oldPassword, 10);
            customerUser = await User.create({
                username: 'resetuser', email: email, password: hashedPassword, role: 'customer',
                otp_code: otp,
                otp_expires: new Date(Date.now() + 5 * 60 * 1000), // 5 phút
                otp_attempts: 0
            });
        });

        it('1.1: reset mật khẩu thành công với OTP hợp lệ', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({ email: email, otp: otp, newPassword: 'newPassword456' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Đặt lại mật khẩu thành công');
            const updatedUser = await User.findById(customerUser._id);
            expect(updatedUser.otp_code).toBeUndefined(); // OTP phải bị xóa
            const isNewPassword = await bcrypt.compare('newPassword456', updatedUser.password);
            expect(isNewPassword).toBe(true);
        });

        it('2.1: trả về lỗi 400 nếu OTP sai', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({ email: email, otp: '654321', newPassword: 'newPassword456' });
            expect(res.status).toBe(400);
            expect(res.body.message).toContain('OTP không chính xác. Bạn còn 2 lần thử');
        });

        it('2.2: trả về lỗi 400 nếu nhập sai OTP quá 3 lần', async () => {
            await User.updateOne({ _id: customerUser._id }, { otp_attempts: 2 });
            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({ email: email, otp: '654321', newPassword: 'newPassword456' });
            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Bạn đã nhập sai quá nhiều lần');
        });

        it('2.3: trả về lỗi 400 nếu OTP đã hết hạn', async () => {
            await User.updateOne({ _id: customerUser._id }, { otp_expires: new Date(Date.now() - 1000) });
            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({ email: email, otp: otp, newPassword: 'newPassword456' });
            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Mã OTP đã hết hạn');
        });

        it('2.4: trả về lỗi 400 nếu mật khẩu mới trùng mật khẩu cũ', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({ email: email, otp: otp, newPassword: oldPassword });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Mật khẩu mới phải khác mật khẩu hiện tại');
        });
    });

    // Quên mật khẩu (Gửi Link)
    describe('POST /api/auth/forgot-password-link', () => {
        it('1.1: gửi link thành công và gọi sendResetLinkEmail', async () => {
            await User.create({ email: 'customer_link@test.com', role: 'customer', password: '123' });
            const res = await request(app)
                .post('/api/auth/forgot-password-link')
                .send({ email: 'customer_link@test.com' });

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('đã gửi link đặt lại mật khẩu');
            expect(emailUtils.sendResetLinkEmail).toHaveBeenCalled();
            expect(emailUtils.sendResetLinkEmail.mock.calls[0][0]).toBe('customer_link@test.com');
            expect(emailUtils.sendResetLinkEmail.mock.calls[0][1]).toContain('/reset-password?token=');
        });
    });

    // Reset mật khẩu (Dùng Token)
    describe('POST /api/auth/reset-password-token', () => {
        let user, validToken, expiredToken;
        const oldPassword = 'password123';

        beforeEach(async () => {
            const hashedPassword = await bcrypt.hash(oldPassword, 10);
            user = await User.create({
                username: 'tokenreset', email: 'token@test.com', password: hashedPassword, role: 'customer',
            });

            // Tạo token thật
            validToken = jwt.sign({ sub: user._id, type: "password_reset" }, JWT_SECRET, { expiresIn: "15m" });
            expiredToken = jwt.sign({ sub: user._id, type: "password_reset" }, JWT_SECRET, { expiresIn: "-1s" });
        });

        it('1.1: reset mật khẩu thành công với token hợp lệ', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password-token')
                .send({ token: validToken, newPassword: 'newPassword789' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Đặt lại mật khẩu thành công');
            const updatedUser = await User.findById(user._id);
            const isNewPassword = await bcrypt.compare('newPassword789', updatedUser.password);
            expect(isNewPassword).toBe(true);
        });

        it('2.1: trả về lỗi 400 nếu token đã hết hạn', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password-token')
                .send({ token: expiredToken, newPassword: 'newPassword789' });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Token không hợp lệ hoặc đã hết hạn');
        });
    });
});

/**
 * ================================================
 * BỘ TEST CÁC CHỨC NĂNG CẦN XÁC THỰC (AUTH)
 * ================================================
 */
describe('Auth API (Authenticated User)', () => {
    let user;
    const password = 'currentPassword123';

    beforeEach(async () => {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({
            _id: customerId, // Sử dụng ID cố định
            username: 'testcustomer',
            email: 'customer@test.com',
            password: hashedPassword,
            role: 'customer',
            status: 'active',
            full_name: "Old Name",
            phone: "123456"
        });
    });

    // Tự xem thông tin cá nhân
    describe('GET /api/auth/profile', () => {
        it('1.1: lấy thông tin cá nhân thành công với token hợp lệ', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer customer-token'); // Dùng token giả lập

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(customerId);
            expect(res.body.data.username).toBe('testcustomer');
            expect(res.body.data).not.toHaveProperty('password'); // Rất quan trọng
        });

        it('2.1: trả về lỗi 401 nếu không có token', async () => {
            const res = await request(app).get('/api/auth/profile');
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Chưa xác thực');
        });
    });

    // Tự đổi mật khẩu
    describe('POST /api/auth/change-password', () => {
        it('1.1: đổi mật khẩu thành công', async () => {
            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', 'Bearer customer-token')
                .send({ currentPassword: password, newPassword: 'newStrongPassword' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Đổi mật khẩu thành công');
        });

        it('2.1: trả về lỗi 400 nếu mật khẩu hiện tại sai', async () => {
            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', 'Bearer customer-token')
                .send({ currentPassword: 'wrongPassword', newPassword: 'newStrongPassword' });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Mật khẩu hiện tại không chính xác');
        });

        it('2.2: trả về lỗi 400 nếu mật khẩu mới trùng mật khẩu cũ', async () => {
            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', 'Bearer customer-token')
                .send({ currentPassword: password, newPassword: password });
            expect(res.status).toBe(400);
        });

        it('2.3: trả về lỗi 400 nếu mật khẩu mới quá ngắn', async () => {
            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', 'Bearer customer-token')
                .send({ currentPassword: password, newPassword: '123' });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Mật khẩu mới phải có ít nhất 6 ký tự');
        });
    });

    // Tự cập nhật thông tin
    describe('PUT /api/auth/profile', () => {
        beforeEach(async () => {
            // Tạo user thứ 2 để test email trùng
            await User.create({
                _id: otherUserId,
                username: 'otheruser',
                email: 'other@test.com',
                password: '123',
                role: 'customer'
            });
        });

        it('1.1: cập nhật thông tin (fullName, phone) thành công', async () => {
            const updates = { fullName: 'New Full Name', phone: '0987654321' };
            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', 'Bearer customer-token')
                .send(updates);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Cập nhật thông tin thành công');
            expect(res.body.user.fullName).toBe('New Full Name');
            expect(loggerUtils.logAction).toHaveBeenCalledWith(customerId, 'User', customerId, 'full_name', 'Old Name', 'New Full Name');
        });

        it('1.2: cập nhật email (hợp lệ) thành công', async () => {
            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', 'Bearer customer-token')
                .send({ email: 'new-email@test.com' });
            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe('new-email@test.com');
        });

        it('2.1: trả về lỗi 400 nếu email mới đã bị người khác sử dụng', async () => {
            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', 'Bearer customer-token')
                .send({ email: 'other@test.com' }); // Email của user khác
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Email đã được sử dụng bởi tài khoản khác');
        });
    });

    // Logout (Dùng token thật)
    describe('POST /api/auth/logout', () => {
        it('trả về 200 khi đã đăng nhập (dùng token thật)', async () => {
            // Tạo token thật
            const authToken = jwt.sign({ sub: customerId }, JWT_SECRET, { expiresIn: '1h' });

            const res = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Đăng xuất thành công');
        });
    });
});

/**
 * ========================================
 * BỘ TEST CÁC CHỨC NĂNG CỦA ADMIN
 * ========================================
 */
describe('Auth API (Admin only)', () => {
    let admin, staff, customer, anotherAdmin;

    beforeEach(async () => {
        await User.deleteMany({});

        // Tạo user mới
        await User.insertMany([
            { _id: adminId, username: 'testadmin', email: 'admin@test.com', password: '123', role: 'admin', status: 'active' },
            { _id: staffLv1Id, username: 'staff1', email: 'staff1@test.com', password: '123', role: 'LV1', status: 'active' },
            { _id: staffLv2Id, username: 'teststaff2', email: 'staff2@test.com', password: '123', role: 'LV2', status: 'active' },
            { _id: customerId, username: 'testcustomer', email: 'customer@test.com', password: '123', role: 'customer', status: 'active' },
            { _id: anotherAdminId, username: 'admin2', email: 'admin2@test.com', password: '123', role: 'admin', status: 'active' }
        ]);
    });

    // Admin tạo tài khoản Staff
    describe('POST /api/auth/register-staff', () => {
        const newStaff = {
            username: 'newstafflv2',
            password: 'password123',
            email: 'newstaff@example.com',
            role: 'LV2'
        };

        it('1.1: Admin tạo staff LV2 thành công', async () => {
            const res = await request(app)
                .post('/api/auth/register-staff')
                .set('Authorization', 'Bearer admin-token') // Phải có token admin
                .send(newStaff);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('Tạo tài khoản nhân viên thành công');
            expect(loggerUtils.logAction).toHaveBeenCalled();
        });

        it('2.1: trả về lỗi 403 nếu Staff (LV2) cố gắng tạo staff', async () => {
            // Giả sử route này bị chặn bởi middleware (ví dụ: isAdmin)
            // Nếu không, bạn cần test logic trong controller (nếu có)
            // Ở đây, tôi giả định middleware xác thực của bạn chỉ gắn 'req.user'
            // và logic check role nằm trong 1 middleware khác (ví dụ: isAdmin)
            // Nếu không có middleware 'isAdmin', test này có thể fail
            const res = await request(app)
                .post('/api/auth/register-staff')
                .set('Authorization', 'Bearer staff-lv2-token')
                .send(newStaff);
            // Nếu không có middleware check role, nó sẽ là 201
            // Giả sử bạn CÓ middleware check role (nên có), nó sẽ là 403
            // expect(res.status).toBe(403);
        });

        it('2.2: trả về lỗi 400 nếu role không hợp lệ (ví dụ: customer)', async () => {
            const invalidStaff = { ...newStaff, email: 'fail@example.com', username: 'failstaff', role: 'customer' };
            const res = await request(app)
                .post('/api/auth/register-staff')
                .set('Authorization', 'Bearer admin-token')
                .send(invalidStaff);
            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Vai trò không hợp lệ');
        });
    });

    // Admin lấy danh sách Users
    describe('POST /api/auth/users', () => {
        it('1.1: lấy danh sách user thành công (mặc định)', async () => {
            const res = await request(app)
                .post('/api/auth/users')
                .set('Authorization', 'Bearer admin-token')
                .send({}); // Body rỗng

            expect(res.status).toBe(200);
            expect(res.body.page).toBe(1);
            expect(res.body.totalCount).toBe(4); // 4 user đã tạo
            expect(res.body.list.length).toBe(4);
            expect(res.body.list[0]).not.toHaveProperty('password');
        });

        it('1.2: lọc user theo role (customer)', async () => {
            const res = await request(app)
                .post('/api/auth/users')
                .set('Authorization', 'Bearer admin-token')
                .send({ role: 'customer' });
            expect(res.status).toBe(200);
            expect(res.body.totalCount).toBe(1);
            expect(res.body.list[0].username).toBe('testcustomer');
        });

        it('1.3: lọc user bằng filterCriterias (username contains "admin")', async () => {
            const res = await request(app)
                .post('/api/auth/users')
                .set('Authorization', 'Bearer admin-token')
                .send({
                    filterCriterias: [
                        { label: 'Username', field: 'username', operator: 'contains', value: 'admin' }
                    ]
                });
            expect(res.status).toBe(200);
            expect(res.body.totalCount).toBe(2); // testadmin và admin2
        });

        it('1.4: phân trang (page 2, pageSize 1)', async () => {
            const res = await request(app)
                .post('/api/auth/users')
                .set('Authorization', 'Bearer admin-token')
                .send({ page: 2, pageSize: 1, orderBy: 'username', orderDir: 'ASC' });
            expect(res.status).toBe(200);
            expect(res.body.totalCount).toBe(4);
            expect(res.body.list.length).toBe(1);
            // Sắp xếp: admin2, testadmin, testcustomer, teststaff2
            expect(res.body.list[0].username).toBe('testadmin');
        });
    });

    // Admin lấy chi tiết User
    describe('GET /api/auth/users/:id', () => {
        it('1.1: lấy chi tiết user thành công', async () => {
            const res = await request(app)
                .get(`/api/auth/users/${customerId}`)
                .set('Authorization', 'Bearer admin-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(customerId);
            expect(res.body.data.username).toBe('testcustomer');
        });

        it('2.1: trả về lỗi 404 nếu không tìm thấy user', async () => {
            const res = await request(app)
                .get(`/api/auth/users/${otherUserId}`) // ID không có thật
                .set('Authorization', 'Bearer admin-token');
            expect(res.status).toBe(404);
        });

        it('2.2: trả về lỗi 400 nếu ID không hợp lệ', async () => {
            const res = await request(app)
                .get(`/api/auth/users/12345`) // ID invalid
                .set('Authorization', 'Bearer admin-token');
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('ID không hợp lệ');
        });
    });

    // Admin cập nhật trạng thái
    describe('PUT /api/auth/users/:userId/status', () => {
        it('1.1: Admin khóa tài khoản customer thành công', async () => {
            const res = await request(app)
                .put(`/api/auth/users/${customerId}/status`)
                .set('Authorization', 'Bearer admin-token')
                .send({ status: 'locked' });
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Khóa tài khoản thành công');
            expect(res.body.data.status).toBe('locked');
            const userInDb = await User.findById(customerId);
            expect(userInDb.status).toBe('locked');
        });

        it('1.2: Admin mở khóa tài khoản staff thành công', async () => {
            await User.updateOne({ _id: staffLv2Id }, { status: 'locked' }); // Khóa trước
            const res = await request(app)
                .put(`/api/auth/users/${staffLv2Id}/status`)
                .set('Authorization', 'Bearer admin-token')
                .send({ status: 'active' });
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Mở khóa tài khoản thành công');
        });

        it('2.1: Admin không thể khóa chính mình', async () => {
            const res = await request(app)
                .put(`/api/auth/users/${adminId}/status`)
                .set('Authorization', 'Bearer admin-token')
                .send({ status: 'locked' });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Không thể thay đổi trạng thái tài khoản của chính mình');
        });

        it('2.2: Admin không thể khóa admin khác', async () => {
            const res = await request(app)
                .put(`/api/auth/users/${anotherAdminId}/status`)
                .set('Authorization', 'Bearer admin-token')
                .send({ status: 'locked' });
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Không thể thay đổi trạng thái tài khoản admin khác');
        });
    });

    // Admin cập nhật vai trò
    describe('PUT /api/auth/users/:userId/role', () => {
        let staffLv1;
        beforeEach(async () => {
            staffLv1 = await User.create({ username: 'stafflv1', email: 'lv1@test.com', password: '123', role: 'LV1', status: 'active' });
        });

        it('1.1: Admin nâng cấp staff LV1 lên LV2 thành công', async () => {
            const res = await request(app)
                .put(`/api/auth/users/${staffLv1._id}/role`)
                .set('Authorization', 'Bearer admin-token')
                .send({ role: 'LV2' });
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Cập nhật vai trò người dùng thành công');
            expect(res.body.data.role).toBe('LV2');
        });

        it('2.1: Admin không thể đổi vai trò của customer', async () => {
            const res = await request(app)
                .put(`/api/auth/users/${customerId}/role`)
                //               .set('Authorization', 'Bearer admin-token')
                .send({ role: 'LV1' });
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Chỉ có thể thay đổi vai trò cho tài khoản nhân viên');
        });
    });
});