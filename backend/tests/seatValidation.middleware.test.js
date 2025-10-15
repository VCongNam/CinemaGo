import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  validateCreateSeat,
  validateCreateBulkSeats,
  validateUpdateSeat,
  validateSeatStatus,
  validateSeatId,
  validateRoomId,
} from '../middlewares/seatValidation.js'; // Sửa lại đường dẫn nếu cần

describe('Seat Validation Middlewares', () => {
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

  // --- Tests cho validateCreateSeat ---
  describe('validateCreateSeat', () => {
    const validRoomId = '60d0fe4f5311236168a109ca';

    it('nên gọi next() khi dữ liệu hợp lệ', () => {
      mockReq.body = {
        room_id: validRoomId,
        seat_number: 'A1',
        type: 'vip',
        base_price: 150000,
      };
      validateCreateSeat(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu base_price là số âm', () => {
      mockReq.body = {
        room_id: validRoomId,
        seat_number: 'A1',
        type: 'vip',
        base_price: -100,
      };
      validateCreateSeat(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining(['Giá cơ bản phải là số dương']),
      }));
    });

    it('nên trả về lỗi 400 nếu loại ghế không hợp lệ', () => {
        mockReq.body = {
          room_id: validRoomId,
          seat_number: 'A1',
          type: 'luxury', // Loại không hợp lệ
          base_price: 150000,
        };
        validateCreateSeat(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          errors: expect.arrayContaining(["Loại ghế phải là 'normal' hoặc 'vip'"]),
        }));
      });
  });

  // --- Tests cho validateCreateBulkSeats ---
  describe('validateCreateBulkSeats', () => {
    const validRoomId = '60d0fe4f5311236168a109ca';

    it('nên gọi next() khi dữ liệu tạo hàng loạt hợp lệ', () => {
      mockReq.body = {
        room_id: validRoomId,
        seats: [
          { seat_number: 'B1', type: 'normal', base_price: 100000 },
          { seat_number: 'B2', type: 'vip', base_price: 200000 },
        ],
      };
      validateCreateBulkSeats(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu mảng ghế rỗng', () => {
        mockReq.body = { room_id: validRoomId, seats: [] };
        validateCreateBulkSeats(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          errors: expect.arrayContaining(['Danh sách ghế không được để trống']),
        }));
      });

    it('nên trả về lỗi 400 nếu một ghế trong mảng không hợp lệ', () => {
      mockReq.body = {
        room_id: validRoomId,
        seats: [
          { seat_number: 'C1', type: 'normal', base_price: 100000 },
          { seat_number: 'C2', type: 'vip', base_price: -50 }, // Giá không hợp lệ
        ],
      };
      validateCreateBulkSeats(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining(['Ghế 2: Giá cơ bản phải là số dương']),
      }));
    });
  });

  // --- Tests cho validateUpdateSeat ---
  describe('validateUpdateSeat', () => {
    it('nên gọi next() khi body rỗng (mọi trường đều là tùy chọn)', () => {
      validateUpdateSeat(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu cập nhật với trạng thái không hợp lệ', () => {
      mockReq.body = { status: 'occupied' };
      validateUpdateSeat(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining(["Trạng thái phải là 'active' hoặc 'inactive'"]),
      }));
    });
  });

  // --- Tests cho validateSeatStatus ---
  describe('validateSeatStatus', () => {
    it('nên gọi next() khi trạng thái hợp lệ', () => {
        mockReq.body = { status: 'inactive' };
        validateSeatStatus(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu thiếu trạng thái', () => {
        validateSeatStatus(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            errors: expect.arrayContaining(["Trạng thái là bắt buộc"]),
        }));
    });
  });

  // --- Tests cho validateSeatId ---
  describe('validateSeatId', () => {
    it('nên gọi next() khi ID hợp lệ', () => {
      mockReq.params.id = '60d0fe4f5311236168a109ca';
      validateSeatId(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu ID không hợp lệ', () => {
      mockReq.params.id = 'invalid-id';
      validateSeatId(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Seat ID không hợp lệ',
      });
    });
  });

  // --- Tests cho validateRoomId ---
  describe('validateRoomId', () => {
    it('nên gọi next() khi roomId hợp lệ', () => {
        mockReq.params.roomId = '60d0fe4f5311236168a109ca';
        validateRoomId(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu thiếu roomId', () => {
        validateRoomId(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            message: 'Room ID là bắt buộc',
        });
    });
  });
});