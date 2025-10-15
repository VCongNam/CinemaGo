import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  validateCreateRoom,
  validateUpdateRoom,
  validateRoomStatus,
  validateRoomId,
  validateTheaterId,
} from '../middlewares/roomValidation.js'; // Sửa lại đường dẫn nếu cần

describe('Room Validation Middlewares', () => {
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

  // --- Tests cho validateCreateRoom ---
  describe('validateCreateRoom', () => {
    const validTheaterId = '60d0fe4f5311236168a109ca'; // Một ObjectId hợp lệ

    it('nên gọi next() khi dữ liệu hợp lệ', () => {
      mockReq.body = { theater_id: validTheaterId, name: 'Phòng Chiếu 1' };
      validateCreateRoom(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu thiếu theater_id', () => {
      mockReq.body = { name: 'Phòng Chiếu 1' };
      validateCreateRoom(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining(["Theater ID là bắt buộc và phải là chuỗi"]),
      }));
    });

    it('nên trả về lỗi 400 nếu tên phòng quá ngắn', () => {
      mockReq.body = { theater_id: validTheaterId, name: 'A' };
      validateCreateRoom(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining(["Tên phòng phải có ít nhất 2 ký tự"]),
      }));
    });

    it('nên trả về nhiều lỗi nếu nhiều trường không hợp lệ', () => {
        mockReq.body = { theater_id: '123', name: 'A' };
        validateCreateRoom(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        const responseJson = mockRes.json.mock.calls[0][0];
        expect(responseJson.errors).toHaveLength(2);
        expect(responseJson.errors).toContain("Theater ID không hợp lệ");
        expect(responseJson.errors).toContain("Tên phòng phải có ít nhất 2 ký tự");
      });
  });

  // --- Tests cho validateUpdateRoom ---
  describe('validateUpdateRoom', () => {
    it('nên gọi next() khi body rỗng (mọi trường đều là tùy chọn)', () => {
      validateUpdateRoom(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('nên gọi next() khi dữ liệu cập nhật hợp lệ', () => {
      mockReq.body = { name: 'Phòng VIP', status: 'maintenance' };
      validateUpdateRoom(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu status không hợp lệ', () => {
      mockReq.body = { status: 'broken' };
      validateUpdateRoom(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining(["Trạng thái phải là 'active', 'inactive' hoặc 'maintenance'"]),
      }));
    });
  });

  // --- Tests cho validateRoomStatus ---
  describe('validateRoomStatus', () => {
    it('nên gọi next() khi status hợp lệ', () => {
        mockReq.body = { status: 'active' };
        validateRoomStatus(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu thiếu status', () => {
        validateRoomStatus(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            errors: expect.arrayContaining(["Trạng thái là bắt buộc"]),
        }));
    });
  });

  // --- Tests cho validateRoomId ---
  describe('validateRoomId', () => {
    it('nên gọi next() khi ID hợp lệ', () => {
      mockReq.params.id = '60d0fe4f5311236168a109ca';
      validateRoomId(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu ID không hợp lệ', () => {
      mockReq.params.id = 'invalid-id-123';
      validateRoomId(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Room ID không hợp lệ',
      });
    });
  });

  // --- Tests cho validateTheaterId ---
  describe('validateTheaterId', () => {
    it('nên gọi next() khi theaterId hợp lệ', () => {
        mockReq.params.theaterId = '60d0fe4f5311236168a109ca';
        validateTheaterId(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu thiếu theaterId', () => {
        validateTheaterId(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            message: 'Theater ID là bắt buộc',
        });
    });
  });
});