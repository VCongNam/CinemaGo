import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const validateCreateReview = [
    body('movie_id')
        .notEmpty().withMessage('Cần cung cấp mã phim (movie_id).')
        .custom(value => isValidObjectId(value)).withMessage('movie_id phải là ObjectId hợp lệ.'),
    body('rating')
        .notEmpty().withMessage('Cần cung cấp điểm đánh giá (rating).')
        .isFloat({ min: 1, max: 5 }).withMessage('Điểm đánh giá phải từ 1 đến 5.'),
    body('comment')
        .optional()
        .isString().withMessage('Bình luận phải là chuỗi.'),
    handleValidationErrors
];

export const validateUpdateReview = [
    param('reviewId').custom(value => isValidObjectId(value)).withMessage('Mã đánh giá (reviewId) không hợp lệ.'),
    body('rating').optional().isFloat({ min: 1, max: 5 }).withMessage('Điểm đánh giá phải từ 1 đến 5.'),
    body('comment').optional().isString().withMessage('Bình luận phải là chuỗi.'),
    handleValidationErrors
];