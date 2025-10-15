import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  validateCreateTheater,
  validateUpdateTheater,
  validateTheaterStatus,
  validateTheaterId,
} from '../middlewares/theaterValidation.js'; // Sửa lại đường dẫn nếu cần

describe('Theater Validation Middlewares', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  // Trước mỗi bài test, tạo lại các object mock để đảm bảo sự cô lập
  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  // --- Tests cho validateCreateTheater ---
  describe('validateCreateTheater', () => {
    it('nên gọi next() khi dữ liệu hợp lệ', () => {
      mockReq.body = {
        name: 'Galaxy Nguyễn Du',
        location: '116 Nguyễn Du, Quận 1, TPHCM',
      };
      validateCreateTheater(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu thiếu tên rạp', () => {
      mockReq.body = { location: '116 Nguyễn Du, Quận 1, TPHCM' };
      validateCreateTheater(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining(['Tên rạp là bắt buộc và phải là chuỗi']),
      }));
    });

    it('nên trả về lỗi 400 nếu địa điểm quá ngắn', () => {
      mockReq.body = { name: 'Galaxy Nguyễn Du', location: '123' };
      validateCreateTheater(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining(['Địa điểm phải có ít nhất 5 ký tự']),
      }));
    });
  });

  // --- Tests cho validateUpdateTheater ---
  describe('validateUpdateTheater', () => {
    it('nên gọi next() khi body rỗng', () => {
      validateUpdateTheater(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('nên gọi next() khi dữ liệu cập nhật hợp lệ', () => {
      mockReq.body = { name: 'BHD Star Vincom', status: 'inactive' };
      validateUpdateTheater(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu trạng thái không hợp lệ', () => {
      mockReq.body = { status: 'closed' };
      validateUpdateTheater(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining(["Trạng thái phải là 'active' hoặc 'inactive'"]),
      }));
    });
  });

  // --- Tests cho validateTheaterStatus ---
  describe('validateTheaterStatus', () => {
    it('nên gọi next() khi trạng thái hợp lệ', () => {
      mockReq.body = { status: 'active' };
      validateTheaterStatus(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu thiếu trạng thái', () => {
      validateTheaterStatus(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining(['Trạng thái là bắt buộc']),
      }));
    });
  });

  // --- Tests cho validateTheaterId ---
  describe('validateTheaterId', () => {
    it('nên gọi next() khi ID hợp lệ', () => {
      mockReq.params.id = '60d0fe4f5311236168a109ca';
      validateTheaterId(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu ID không hợp lệ', () => {
      mockReq.params.id = 'abc-123';
      validateTheaterId(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID rạp không hợp lệ',
      });
    });

    it('nên trả về lỗi 400 nếu thiếu ID', () => {
        validateTheaterId(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'ID rạp là bắt buộc',
        });
      });
  });
});