import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Khai báo biến ở scope cao hơn để có thể sử dụng trong toàn bộ file
let request, mongoose, MongoMemoryServer, express, bcrypt, User, authRoutes, errorHandler, jwtUtils;
let mongoServer;
let app;

// --- Bắt đầu thiết lập môi trường test ---

// Trước khi tất cả các bài test bắt đầu
beforeAll(async () => {
    // Bước 1: Mock các module phụ thuộc TRƯỚC KHI import chúng
    await jest.unstable_mockModule('../utils/jwt.js', () => ({
        signAccessToken: jest.fn(),
    }));
    await jest.unstable_mockModule('../utils/email.js', () => ({
        sendResetLinkEmail: jest.fn(),
        sendOTPEmail: jest.fn(),
    }));

    // Bước 2: Import động các thư viện và module SAU KHI đã mock
    request = (await import('supertest')).default;
    mongoose = (await import('mongoose')).default;
    MongoMemoryServer = (await import('mongodb-memory-server')).MongoMemoryServer;
    express = (await import('express')).default;
    bcrypt = (await import('bcryptjs')).default;

    authRoutes = (await import('../routes/auth.routes.js')).default;
    User = (await import('../models/user.js')).default;
    errorHandler = (await import('../middlewares/errorHandler.js')).default;
    jwtUtils = await import('../utils/jwt.js');

    // Bước 3: Khởi tạo server MongoDB ảo và kết nối
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Bước 4: Khởi tạo app Express để test
    app = express();
    app.use(express.json());
    // Giả lập req.user cho các route cần xác thực
    app.use((req, res, next) => {
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1];
            if (token === 'valid-user-token') {
                req.user = { _id: '60d0fe4f5311236168a109ca' };
            }
        }
        next();
    });
    app.use('/api/auth', authRoutes);
    app.use(errorHandler);
});

// Sau khi tất cả các bài test kết thúc
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// Trước mỗi bài test, xóa sạch dữ liệu cũ và reset các mock
beforeEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
});

// --- Bắt đầu viết các bài test ---

describe('Auth API', () => {

    // Test cho Customer Đăng ký 
    describe('POST /api/auth/register-customer', () => {

        // Test Case 1.1: Đăng ký thành công
        it('tạo tài khoản thành công với dữ liệu hợp lệ', async () => {
            // Arrange
            const newCustomer = {
                username: 'newcustomer',
                password: 'password123',
                email: 'newcustomer@example.com'
            };

            // Act
            const response = await request(app)
                .post('/api/auth/register-customer')
                .send(newCustomer);

            // Assert
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Tạo tài khoản khách hàng thành công');

            // Kiểm tra trong DB
            const userInDb = await User.findOne({ email: newCustomer.email });
            expect(userInDb).toBeDefined();
            expect(userInDb.role).toBe('customer');
        });

        // Test Case 2.1: Username đã tồn tại
        it('trả về lỗi 400 nếu username đã tồn tại', async () => {
            // Arrange: Tạo trước một user
            await User.create({
                username: 'existinguser',
                password: 'password123',
                email: 'unique@example.com'
            });

            const newCustomer = {
                username: 'existinguser', // Trùng username
                password: 'password456',
                email: 'newemail@example.com',
            };

            // Act
            const response = await request(app)
                .post('/api/auth/register-customer')
                .send(newCustomer);

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Tên đăng nhập hoặc email đã tồn tại');
        });

        // Test Case 2.3: Thiếu password (lỗi 500)
        it('trả về lỗi 500 nếu thiếu password do không có validation', async () => {
            const newCustomer = {
                username: 'customerwithoutpass',
                email: 'nopass@example.com',
                // Thiếu password
            };

            const response = await request(app)
                .post('/api/auth/register-customer')
                .send(newCustomer);

            // Assert
            // Mong đợi lỗi 500 vì bcrypt sẽ ném lỗi và được errorHandler bắt
            expect(response.status).toBe(500);
        });
    });

    // Customer đăng nhập
    describe('POST /api/auth/login-customer', () => {
        const password = 'password123';
        let customerUser, staffUser, lockedUser;

        // Trước mỗi test, tạo sẵn các user cần thiết
        beforeEach(async () => {
            const hashedPassword = await bcrypt.hash(password, 10);

            [customerUser, staffUser, lockedUser] = await User.create([
                { username: 'customeruser', password: hashedPassword, email: 'customer@test.com', role: 'customer', status: 'active' },
                { username: 'staffuser', password: hashedPassword, email: 'staff@test.com', role: 'staff', status: 'active' },
                { username: 'lockedcustomer', password: hashedPassword, email: 'locked@test.com', role: 'customer', status: 'locked' },
            ]);
        });

        // --- Trường hợp thành công ---

        it('1.1: đăng nhập thành công với tài khoản customer hợp lệ', async () => {
            // Arrange: Dạy cho mock biết phải trả về gì
            jwtUtils.signAccessToken.mockReturnValue('fake-customer-token');

            // Act
            const response = await request(app)
                .post('/api/auth/login-customer')
                .send({ username: 'customeruser', password: password });

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken', 'fake-customer-token');
            expect(response.body.user.role).toBe('customer');
        });

        // --- Các trường hợp thất bại ---

        it('2.1: trả về lỗi 401 nếu username không tồn tại', async () => {
            const response = await request(app)
                .post('/api/auth/login-customer')
                .send({ username: 'nonexistent', password: password });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Tên đăng nhập hoặc mật khẩu không chính xác');
        });

        it('2.2: trả về lỗi 401 nếu mật khẩu sai', async () => {
            const response = await request(app)
                .post('/api/auth/login-customer')
                .send({ username: 'customeruser', password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Tên đăng nhập hoặc mật khẩu không chính xác');
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
            expect(response.body.message).toContain('Tài khoản của bạn đang bị hạn chế');
        });
    });


    // Test cho Staff Đăng nhập
    describe('POST /api/auth/login-staff', () => {
        const password = 'password123';
        let staffUser, adminUser, customerUser, lockedUser;

        // Trước mỗi test trong nhóm này, tạo sẵn các loại user
        beforeEach(async () => {
            const hashedPassword = await bcrypt.hash(password, 10);

            // Tạo user mẫu
            [staffUser, adminUser, customerUser, lockedUser] = await User.create([
                { username: 'staffuser', password: hashedPassword, email: 'staff@test.com', role: 'staff', status: 'active' },
                { username: 'adminuser', password: hashedPassword, email: 'admin@test.com', role: 'admin', status: 'active' },
                { username: 'customeruser', password: hashedPassword, email: 'customer@test.com', role: 'customer', status: 'active' },
                { username: 'lockeduser', password: hashedPassword, email: 'locked@test.com', role: 'staff', status: 'locked' },
            ]);
        });

        // --- Các trường hợp thành công ---

        it('1.1: đăng nhập thành công với vai trò staff', async () => {
            jwtUtils.signAccessToken.mockReturnValue('fake-staff-token');

            // Act: Gửi request đăng nhập
            const response = await request(app)
                .post('/api/auth/login-staff')
                .send({ username: 'staffuser', password: password });

            // Assert: Kiểm tra kết quả
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken'); // Sẽ pass
            expect(response.body.accessToken).toBe('fake-staff-token'); // Kiểm tra luôn giá trị token
            expect(response.body.user.role).toBe('staff');
        });

        it('1.2: đăng nhập thành công với vai trò admin', async () => {
            jwtUtils.signAccessToken.mockReturnValue('fake-admin-token');

            const response = await request(app)
                .post('/api/auth/login-staff')
                .send({ username: 'adminuser', password: password });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken'); // Sẽ pass
            expect(response.body.accessToken).toBe('fake-admin-token');
            expect(response.body.user.role).toBe('admin');
        });
        // --- Các trường hợp thất bại ---

        it('2.1: trả về lỗi 401 nếu username không tồn tại', async () => {
            const response = await request(app)
                .post('/api/auth/login-staff')
                .send({ username: 'nonexistentuser', password: password });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Tên đăng nhập hoặc mật khẩu không chính xác');
        });

        it('2.2: trả về lỗi 401 nếu mật khẩu sai', async () => {
            const response = await request(app)
                .post('/api/auth/login-staff')
                .send({ username: 'staffuser', password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Tên đăng nhập hoặc mật khẩu không chính xác');
        });

        it('3.1: trả về lỗi 403 nếu user là customer', async () => {
            const response = await request(app)
                .post('/api/auth/login-staff')
                .send({ username: 'customeruser', password: password });

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Bạn không có quyền đăng nhập tại cổng nhân viên');
        });

        it('4.1: trả về lỗi 403 nếu tài khoản đã bị khóa', async () => {
            const response = await request(app)
                .post('/api/auth/login-staff')
                .send({ username: 'lockeduser', password: password });

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('Tài khoản của bạn đang bị hạn chế');
        });
    });


    // Logout
    describe('POST /api/auth/logout', () => {
        let authToken;
        const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

        // Trước khi chạy test, tạo user và tự tạo token cho user đó
        beforeEach(async () => {
            // 1. Arrange: Tạo user để có một ID hợp lệ
            const user = await User.create({
                username: 'logoutuser',
                password: 'password123',
                email: 'logout@test.com',
                role: 'customer',
                status: 'active'
            });

            // 2. Tự tạo một token hợp lệ bằng tay
            // Payload và secret key phải khớp với những gì verifyToken mong đợi
            authToken = jwt.sign({ sub: user._id.toString() }, JWT_SECRET);
        });

        it('trả về status 200 và message đăng xuất thành công khi có token hợp lệ', async () => {
            // Act: Gửi request đến endpoint logout với token thật đã tạo
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${authToken}`) // Dùng token thật ở đây
                .send();

            // Assert: Kiểm tra kết quả
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Đăng xuất thành công' });
        });
    });


    describe('POST /api/auth/forgot-password', () => {
        let customerUser, staffUser;

        beforeEach(async () => {
            // Tạo sẵn user customer và staff
            [customerUser, staffUser] = await User.create([
                { username: 'customer_fp', email: 'customer_fp@test.com', role: 'customer', status: 'active', password: '123' },
                { username: 'staff_fp', email: 'staff_fp@test.com', role: 'staff', status: 'active', password: '123' },
            ]);
        });

        // --- Trường hợp thành công ---

        it('1.1: nên tạo OTP, lưu vào DB và trả về 200 cho email customer hợp lệ', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'customer_fp@test.com' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Nếu email tồn tại, bạn sẽ nhận được mã OTP');

            // Kiểm tra database
            const userInDb = await User.findById(customerUser._id);
            expect(userInDb.otp_code).toBeDefined();
            expect(userInDb.otp_code).toHaveLength(6);
            expect(userInDb.otp_expires.getTime()).toBeGreaterThan(Date.now());

            // Kiểm tra mock gửi email
            // Giả sử bạn đã import emailUtils
            // expect(emailUtils.sendOTPEmail).toHaveBeenCalled();
        });

        // --- Các trường hợp thất bại & bảo mật ---

        it('2.1: trả về lỗi 400 nếu email không hợp lệ', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'invalid-email' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Email không hợp lệ');
        });

        it('2.2: vẫn trả về 200 nếu email không tồn tại (lý do bảo mật)', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@test.com' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Nếu email tồn tại, bạn sẽ nhận được mã OTP');
        });

        it('2.3: trả về lỗi 403 nếu email là của staff', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'staff_fp@test.com' });

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Chỉ khách hàng mới sử dụng được OTP reset');
        });

        it('2.4: trả về lỗi 429 nếu yêu cầu OTP quá nhanh', async () => {
            // Arrange: Cập nhật user với otp_expires trong tương lai
            const futureTime = new Date(Date.now() + 60 * 1000); // 1 phút sau
            await User.updateOne({ _id: customerUser._id }, { otp_expires: futureTime });

            // Act
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'customer_fp@test.com' });

            // Assert
            expect(response.status).toBe(429);
            expect(response.body.message).toContain('Vui lòng đợi');
        });
    });

});