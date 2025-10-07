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
        .custom(seats => seats.every(seat => isValidObjectId(seat))).withMessage('Tất cả seat_ids phải là ObjectId hợp lệ.'),

    body('payment_method')
        .isIn(['online', 'cash']).withMessage('Phương thức thanh toán phải là "online" hoặc "cash".'),

    handleValidationErrors
];

export const validateBookingId = [
    param('id')
        .custom(value => isValidObjectId(value)).withMessage('Mã đặt vé (id) phải là ObjectId hợp lệ.'),
    handleValidationErrors
];
