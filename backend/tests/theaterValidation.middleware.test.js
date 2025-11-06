import { jest, describe, it, expect, beforeEach } from '@jest/globals';
<<<<<<< Updated upstream
=======

// Import các middleware cần test
>>>>>>> Stashed changes
import {
  validateCreateTheater,
  validateUpdateTheater,
  validateTheaterStatus,
  validateTheaterId,
<<<<<<< Updated upstream
} from '../middlewares/theaterValidation.js'; // Sửa lại đường dẫn nếu cần

describe('Theater Validation Middlewares', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  // Trước mỗi bài test, tạo lại các object mock để đảm bảo sự cô lập
  beforeEach(() => {
=======
} from '../middlewares/theaterValidation.js'; // Sửa lại đường dẫn này nếu cần

describe('Theater Validation Middlewares', () => {
  let mockReq, mockRes, mockNext;
  const validMongoId = '60d0fe4f5311236168a109de';

  // Reset các mock trước mỗi lần test
  beforeEach(() => {
    jest.clearAllMocks();
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  // --- Tests cho validateCreateTheater ---
  describe('validateCreateTheater', () => {
    it('nên gọi next() khi dữ liệu hợp lệ', () => {
      mockReq.body = {
        name: 'Galaxy Nguyễn Du',
        location: '116 Nguyễn Du, Quận 1, TPHCM',
      };
=======
  describe('validateCreateTheater', () => {
    it('1.1: nên gọi next() khi tất cả dữ liệu đều hợp lệ', () => {
      mockReq.body = { name: 'CGV Vincom', location: '123 Nguyễn Huệ, Q1' };
>>>>>>> Stashed changes
      validateCreateTheater(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

<<<<<<< Updated upstream
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
=======
    it.each([
      ['name', { location: '123 Nguyễn Huệ' }, 'Tên rạp là bắt buộc'],
      ['location', { name: 'CGV Vincom' }, 'Địa điểm là bắt buộc'],
      ['name', { name: 'A', location: '123 Nguyễn Huệ' }, 'Tên rạp phải có ít nhất 2 ký tự'],
      ['location', { name: 'CGV Vincom', location: '123' }, 'Địa điểm phải có ít nhất 5 ký tự'],
      ['name', { name: 'A'.repeat(101), location: '123 Nguyễn Huệ' }, 'Tên rạp không được vượt quá 100 ký tự'],
    ])('2.1: nên trả về lỗi 400 nếu trường "%s" không hợp lệ', (field, body, messagePart) => {
      mockReq.body = body;
      validateCreateTheater(mockReq, mockRes, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([expect.stringContaining(messagePart)])
      }));
    });

    it('2.2: nên trả về nhiều lỗi nếu nhiều trường không hợp lệ', () => {
      mockReq.body = { name: 'A', location: '123' }; // Cả hai đều quá ngắn
      validateCreateTheater(mockReq, mockRes, mockNext);
      
      const errorResponse = mockRes.json.mock.calls[0][0];
      expect(errorResponse.errors).toHaveLength(2);
    });
  });

  describe('validateUpdateTheater', () => {
    it('3.1: nên gọi next() khi body rỗng (cập nhật không có gì)', () => {
      mockReq.body = {};
>>>>>>> Stashed changes
      validateUpdateTheater(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

<<<<<<< Updated upstream
    it('nên gọi next() khi dữ liệu cập nhật hợp lệ', () => {
      mockReq.body = { name: 'BHD Star Vincom', status: 'inactive' };
=======
    it('3.2: nên gọi next() khi tất cả các trường cung cấp đều hợp lệ', () => {
      mockReq.body = { name: 'CGV Mới', location: 'Địa điểm mới', status: 'inactive' };
>>>>>>> Stashed changes
      validateUpdateTheater(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

<<<<<<< Updated upstream
    it('nên trả về lỗi 400 nếu trạng thái không hợp lệ', () => {
      mockReq.body = { status: 'closed' };
      validateUpdateTheater(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining(["Trạng thái phải là 'active' hoặc 'inactive'"]),
=======
    it.each([
      ['name', { name: 'A' }, 'Tên rạp phải có ít nhất 2 ký tự'],
      ['location', { location: '123' }, 'Địa điểm phải có ít nhất 5 ký tự'],
      ['status', { status: 'pending' }, 'Trạng thái phải là \'active\' hoặc \'inactive\''],
    ])('4.1: nên trả về lỗi 400 nếu trường "%s" không hợp lệ', (field, body, messagePart) => {
      mockReq.body = body;
      validateUpdateTheater(mockReq, mockRes, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([expect.stringContaining(messagePart)])
>>>>>>> Stashed changes
      }));
    });
  });

<<<<<<< Updated upstream
  // --- Tests cho validateTheaterStatus ---
  describe('validateTheaterStatus', () => {
    it('nên gọi next() khi trạng thái hợp lệ', () => {
      mockReq.body = { status: 'active' };
=======
  describe('validateTheaterStatus', () => {
    it.each(['active', 'inactive'])('5.1: nên gọi next() với status hợp lệ: "%s"', (status) => {
      mockReq.body = { status };
>>>>>>> Stashed changes
      validateTheaterStatus(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

<<<<<<< Updated upstream
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
=======
    it('6.1: nên trả về lỗi 400 nếu thiếu status', () => {
      mockReq.body = {};
      validateTheaterStatus(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining(["Trạng thái là bắt buộc"])
      }));
    });

    it('6.2: nên trả về lỗi 400 nếu status không hợp lệ', () => {
      mockReq.body = { status: 'pending' };
      validateTheaterStatus(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateTheaterId', () => {
    it('7.1: nên gọi next() với ID rạp hợp lệ', () => {
      mockReq.params = { id: validMongoId };
>>>>>>> Stashed changes
      validateTheaterId(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

<<<<<<< Updated upstream
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
=======
    it('8.1: nên trả về lỗi 400 nếu thiếu ID rạp', () => {
      mockReq.params = {};
      validateTheaterId(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: "ID rạp là bắt buộc" }));
    });

    it('8.2: nên trả về lỗi 400 nếu ID rạp không hợp lệ (sai định dạng)', () => {
      mockReq.params = { id: '123-abc-xyz' };
      validateTheaterId(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: "ID rạp không hợp lệ" }));
    });
>>>>>>> Stashed changes
  });
});