import { jest, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import errorHandler from '../middlewares/errorHandler.js'; // Đường dẫn tới file của bạn

describe('Error Handling Middleware', () => {
    let app;

    // Thiết lập một app Express giả lập trước mỗi test
    beforeEach(() => {
        app = express();
    });

    it('nên trả về status 500 và message mặc định cho lỗi không xác định', async () => {
        // Tạo một route giả lập luôn luôn ném ra lỗi
        app.get('/error', (req, res, next) => {
            const genericError = new Error('Something went wrong!');
            next(genericError); // Chuyển lỗi tới errorHandler
        });

        // Gắn errorHandler vào app
        app.use(errorHandler);

        // Dùng supertest để gọi route và kiểm tra kết quả
        const response = await request(app).get('/error');

        expect(response.status).toBe(500);
        // Sửa lại cho đúng
        expect(response.body).toEqual({
            message: 'Something went wrong!',
        });
    });

    it('nên trả về status và message tùy chỉnh từ đối tượng lỗi', async () => {
        // Tạo một route giả lập ném ra lỗi có status và message tùy chỉnh
        app.get('/custom-error', (req, res, next) => {
            const customError = new Error('Resource not found');
            customError.status = 404;
            next(customError);
        });

        app.use(errorHandler);

        const response = await request(app).get('/custom-error');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            message: 'Resource not found',
        });
    });
});