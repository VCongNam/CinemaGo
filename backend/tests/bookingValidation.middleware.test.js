import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import {
  validateCreateBooking,
  validateOfflineBooking,
  validateBookingId,
  validateUpdateStatus,
  validateUserId
} from '../middlewares/bookingValidation.js'; // 👈 Update this path if needed

// Helper function to run express-validator middleware chain
const runValidationMiddleware = async (middlewareArray, req, res, next) => {
  for (const middleware of middlewareArray) {
    await middleware(req, res, next);
    // If res.json() was called, an error was sent, so we stop
    if (res.json.mock.calls.length > 0) {
      break;
    }
  }
};

let req, res, next;
let validObjectId1, validObjectId2;

beforeEach(() => {
  // Reset mock req, res, next for every test
  req = {
    body: {},
    params: {}
  };
  res = {
    status: jest.fn(() => res),
    json: jest.fn(() => res)
  };
  next = jest.fn();

  // Generate fresh valid ObjectIds for testing
  validObjectId1 = new mongoose.Types.ObjectId().toHexString();
  validObjectId2 = new mongoose.Types.ObjectId().toHexString();
});

// ===============================================
// == Test Suites
// ===============================================

describe('Booking Validation Middlewares', () => {

  describe('validateCreateBooking', () => {
    it('1.1: should call next() with valid data', async () => {
      req.body = {
        showtime_id: validObjectId1,
        seat_ids: [validObjectId2],
        payment_method: 'online'
      };
      await runValidationMiddleware(validateCreateBooking, req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('2.1: should return 400 if required fields are missing', async () => {
      req.body = { payment_method: 'cash' }; // Missing showtime_id and seat_ids
      await runValidationMiddleware(validateCreateBooking, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      const errors = res.json.mock.calls[0][0].errors;
      expect(errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ msg: 'Cần cung cấp mã suất chiếu (showtime_id).' }),
        expect.objectContaining({ msg: 'Cần cung cấp ít nhất một mã ghế (seat_ids).' })
      ]));
    });

    it('2.2: should return 400 for invalid ObjectId formats', async () => {
      req.body = {
        showtime_id: '123',
        seat_ids: [validObjectId1, 'abc'],
        payment_method: 'online'
      };
      await runValidationMiddleware(validateCreateBooking, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      const errors = res.json.mock.calls[0][0].errors;
      expect(errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ msg: 'showtime_id phải là ObjectId hợp lệ.' }),
        expect.objectContaining({ msg: 'Tất cả seat_ids phải là ObjectId hợp lệ.' })
      ]));
    });

    it('2.3: should return 400 if seat_ids is an empty array', async () => {
      req.body = {
        showtime_id: validObjectId1,
        seat_ids: [],
        payment_method: 'online'
      };
      await runValidationMiddleware(validateCreateBooking, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toBe('Cần cung cấp ít nhất một mã ghế (seat_ids).');
    });

    it('2.4: should return 400 if seat_ids has duplicates', async () => {
      req.body = {
        showtime_id: validObjectId1,
        seat_ids: [validObjectId2, validObjectId2],
        payment_method: 'online'
      };
      await runValidationMiddleware(validateCreateBooking, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toBe('Danh sách ghế (seat_ids) không được chứa các giá trị trùng lặp.');
    });

    it('2.5: should return 400 for invalid payment_method', async () => {
      req.body = {
        showtime_id: validObjectId1,
        seat_ids: [validObjectId2],
        payment_method: 'paypal'
      };
      await runValidationMiddleware(validateCreateBooking, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toBe('Phương thức thanh toán phải là "online" hoặc "cash".');
    });
  });

  describe('validateOfflineBooking', () => {
    it('1.1: should call next() with valid data', async () => {
      req.body = {
        showtime_id: validObjectId1,
        seat_ids: [validObjectId2],
        payment_method: 'cash',
        phone: '0987654321'
      };
      await runValidationMiddleware(validateOfflineBooking, req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('2.1: should return 400 if phone is missing', async () => {
      req.body = {
        showtime_id: validObjectId1,
        seat_ids: [validObjectId2],
        payment_method: 'cash'
      };
      await runValidationMiddleware(validateOfflineBooking, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toBe('Cần cung cấp số điện thoại.');
    });

    it('2.2: should return 400 if phone is invalid', async () => {
      req.body = {
        showtime_id: validObjectId1,
        seat_ids: [validObjectId2],
        payment_method: 'cash',
        phone: '12345'
      };
      await runValidationMiddleware(validateOfflineBooking, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toBe('Số điện thoại không hợp lệ.');
    });
  });

  describe('validateBookingId', () => {
    it('1.1: should call next() with valid param id', async () => {
      req.params.id = validObjectId1;
      await runValidationMiddleware(validateBookingId, req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('2.1: should return 400 with invalid param id', async () => {
      req.params.id = '123';
      await runValidationMiddleware(validateBookingId, req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toBe('Mã đặt vé (id) phải là ObjectId hợp lệ.');
    });
  });

  describe('validateUpdateStatus', () => {
    it('1.1: should call next() with valid param id and status', async () => {
      req.params.id = validObjectId1;
      req.body.status = 'confirmed';
      await runValidationMiddleware(validateUpdateStatus, req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('2.1: should return 400 if status is invalid', async () => {
      req.params.id = validObjectId1;
      req.body.status = 'shipped';
      await runValidationMiddleware(validateUpdateStatus, req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toContain('Trạng thái không hợp lệ.');
    });

    it('2.2: should return 400 if param id is invalid', async () => {
      req.params.id = '123';
      req.body.status = 'pending';
      await runValidationMiddleware(validateUpdateStatus, req, res, next);
t      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toContain('Mã đặt vé (id) phải là ObjectId hợp lệ.');
    });
  });

  describe('validateUserId', () => {
    it('1.1: should call next() with valid param userId', async () => {
      req.params.userId = validObjectId1;
      await runValidationMiddleware(validateUserId, req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('2.1: should return 400 with invalid param userId', async () => {
      req.params.userId = '123';
      await runValidationMiddleware(validateUserId, req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toBe('Mã người dùng (userId) phải là ObjectId hợp lệ.');
    });
  });
});