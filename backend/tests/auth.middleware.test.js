import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Do ta sẽ import động, nên khai báo biến ở scope cao hơn
let jwt, User, verifyToken, requireRole;

describe('Auth Middlewares', () => {
  let mockReq, mockRes, mockNext;

  // Dùng beforeEach để mock và import module trước mỗi test
  beforeEach(async () => {
    // Bước 1: Dùng jest.unstable_mockModule thay cho jest.mock
    // Nó trả về một promise, nên ta cần await
    await jest.unstable_mockModule('jsonwebtoken', () => ({
      // Mặc định export một object có hàm verify là một jest function
      default: {
        verify: jest.fn(),
      },
    }));

    await jest.unstable_mockModule('../models/user.js', () => ({
      // Mặc định export một object có hàm findById là một jest function
      default: {
        findById: jest.fn(),
      },
    }));

    // Bước 2: Import động các module SAU KHI đã mock
    // Dùng .default vì chúng ta đang mock default export
    jwt = (await import('jsonwebtoken')).default;
    User = (await import('../models/user.js')).default;

    // Import các hàm cần test (giả sử file của bạn là 'auth.js')
    const authMiddleware = await import('../middlewares/auth.js');
    verifyToken = authMiddleware.verifyToken;
    requireRole = authMiddleware.requireRole;

    // Tạo lại các object req, res, next giả lập
    mockReq = {
      headers: {},
      user: null,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  // Dọn dẹp mock sau mỗi test
  afterEach(() => {
    jest.restoreAllMocks(); // Dùng restoreAllMocks để đảm bảo sạch sẽ hơn
  });

  // --- Bắt đầu test cho verifyToken ---
  describe('verifyToken', () => {
    it('trả về lỗi 401 nếu không có header "authorization"', async () => {
      await verifyToken(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token không được cung cấp' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('trả về lỗi 401 nếu header "authorization" không bắt đầu bằng "Bearer "', async () => {
      mockReq.headers.authorization = 'Basic some_other_token_format';
      await verifyToken(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token không được cung cấp' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('trả về lỗi 401 nếu token không hợp lệ (JsonWebTokenError)', async () => {
      mockReq.headers.authorization = 'Bearer invalid_token';
      jwt.verify.mockImplementation(() => {
        throw { name: 'JsonWebTokenError' };
      });

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token không hợp lệ' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('trả về lỗi 401 nếu token đã hết hạn (TokenExpiredError)', async () => {
      mockReq.headers.authorization = 'Bearer expired_token';
      jwt.verify.mockImplementation(() => {
        throw { name: 'TokenExpiredError' };
      });

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token đã hết hạn' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('trả về lỗi 401 nếu token hợp lệ nhưng không tìm thấy user', async () => {
      mockReq.headers.authorization = 'Bearer valid_token_no_user';
      const decodedPayload = { sub: 'non_existent_user_id' };
      jwt.verify.mockReturnValue(decodedPayload);

      // Giả lập User.findById().select() trả về null
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token không hợp lệ' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('trả về lỗi 403 nếu tài khoản người dùng đã bị khóa (locked)', async () => {
      mockReq.headers.authorization = 'Bearer valid_token_locked_user';
      const decodedPayload = { sub: 'locked_user_id' };
      const mockLockedUser = { _id: 'locked_user_id', status: 'locked' };

      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockLockedUser)
      });

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Tài khoản đã bị khóa' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('trả về lỗi 403 nếu tài khoản người dùng đã bị tạm khóa (suspended)', async () => {
      mockReq.headers.authorization = 'Bearer valid_token_suspended_user';
      const decodedPayload = { sub: 'suspended_user_id' };
      const mockSuspendedUser = { _id: 'suspended_user_id', status: 'suspended' };

      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockSuspendedUser)
      });

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Tài khoản đã bị tạm khóa' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('trả về lỗi 500 nếu có lỗi không xác định xảy ra', async () => {
      mockReq.headers.authorization = 'Bearer valid_token';
      // Giả lập một lỗi bất kỳ, ví dụ lỗi kết nối database
      const genericError = new Error('Database connection failed');
      jwt.verify.mockImplementation(() => {
        throw genericError;
      });

      await verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Lỗi xác thực' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('gọi next() và gán req.user nếu token hợp lệ và user active', async () => {
      mockReq.headers.authorization = 'Bearer valid_token_active_user';
      const decodedPayload = { sub: 'active_user_id' };
      const mockUser = { _id: 'active_user_id', username: 'testuser', role: 'customer', status: 'active' };

      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await verifyToken(mockReq, mockRes, mockNext);

      // Kiểm tra các hàm đã được gọi đúng
      expect(jwt.verify).toHaveBeenCalledWith('valid_token_active_user', expect.any(String));
      expect(User.findById).toHaveBeenCalledWith(decodedPayload.sub);

      // Kiểm tra kết quả
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  // --- Bắt đầu test cho requireRole ---
  describe('requireRole', () => {
    it('trả về lỗi 401 nếu req.user không tồn tại (chưa xác thực)', () => {
      mockReq.user = null; // Trường hợp verifyToken thất bại hoặc không được chạy trước
      const middleware = requireRole(['admin']);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Chưa xác thực' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('gọi next() nếu user có quyền hạn phù hợp (một quyền)', () => {
      mockReq.user = { role: 'admin' };
      const middleware = requireRole(['admin', 'staff']);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('gọi next() nếu user có một trong các quyền hạn được yêu cầu', () => {
      mockReq.user = { role: 'staff' };
      const middleware = requireRole(['admin', 'staff']);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('trả về lỗi 403 nếu user không có quyền hạn yêu cầu', () => {
      mockReq.user = { role: 'customer' };
      const middleware = requireRole(['admin', 'staff']);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Không có quyền truy cập' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});