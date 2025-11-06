import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Middleware to check for validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const validateCreateBooking = [
    body('showtime_id')
        .notEmpty().withMessage('Cần cung cấp mã suất chiếu (showtime_id).')
        .custom(value => isValidObjectId(value)).withMessage('showtime_id phải là ObjectId hợp lệ.'),

    body('seat_ids')
        .isArray({ min: 1 }).withMessage('Cần cung cấp ít nhất một mã ghế (seat_ids).')
        .custom(seats => seats.every(seat => isValidObjectId(seat))).withMessage('Tất cả seat_ids phải là ObjectId hợp lệ.')
        .custom(seats => {
            const uniqueSeats = new Set(seats);
            return uniqueSeats.size === seats.length;
        }).withMessage('Danh sách ghế (seat_ids) không được chứa các giá trị trùng lặp.'),

    body('payment_method')
        .isIn(['online', 'cash']).withMessage('Phương thức thanh toán phải là "online" hoặc "cash".'),

    handleValidationErrors
];

export const validateOfflineBooking = [
    body('showtime_id')
        .notEmpty().withMessage('Cần cung cấp mã suất chiếu (showtime_id).')
        .custom(value => isValidObjectId(value)).withMessage('showtime_id phải là ObjectId hợp lệ.'),

    body('seat_ids')
        .isArray({ min: 1 }).withMessage('Cần cung cấp ít nhất một mã ghế (seat_ids).')
        .custom(seats => seats.every(seat => isValidObjectId(seat))).withMessage('Tất cả seat_ids phải là ObjectId hợp lệ.')
        .custom(seats => {
            const uniqueSeats = new Set(seats);
            return uniqueSeats.size === seats.length;
        }).withMessage('Danh sách ghế (seat_ids) không được chứa các giá trị trùng lặp.'),

    body('payment_method')
        .isIn(['online', 'cash']).withMessage('Phương thức thanh toán phải là "online" hoặc "cash".'),
    
    body('phone')
        .notEmpty().withMessage('Cần cung cấp số điện thoại.')
        .isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ.'),

    handleValidationErrors
];

export const validateBookingId = [
    param('id')
        .custom(value => isValidObjectId(value)).withMessage('Mã đặt vé (id) phải là ObjectId hợp lệ.'),
    handleValidationErrors
];

export const validateUpdateStatus = [
    param('id')
        .custom(value => isValidObjectId(value)).withMessage('Mã đặt vé (id) phải là ObjectId hợp lệ.'),
    
    body('status')
        .trim()
        .notEmpty().withMessage('Cần cung cấp trạng thái (status).')
        .isIn(['pending', 'confirmed', 'cancelled', 'failed']).withMessage('Trạng thái không hợp lệ. Chỉ chấp nhận: pending, confirmed, cancelled, failed.'),

    handleValidationErrors
];

export const validateUserId = [
    param('userId')
        .custom(value => isValidObjectId(value)).withMessage('Mã người dùng (userId) phải là ObjectId hợp lệ.'),
    
    handleValidationErrors
];
