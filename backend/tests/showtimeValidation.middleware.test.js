import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// --- KHAI BÁO BIẾN Ở PHẠM VI NGOÀI CÙNG ---
let validateCreateShowtime, validateUpdateShowtime;
let Movie, Showtime;
let getCurrentVietnamTime;

// --- SETUP MOCK VÀ IMPORT ĐỘNG BÊN TRONG beforeAll ---
beforeAll(async () => {
  // Mock các model
  await jest.unstable_mockModule('../models/movie.js', () => ({
    default: { findById: jest.fn() },
  }));
  await jest.unstable_mockModule('../models/showtime.js', () => ({
    default: { findById: jest.fn() },
  }));
  // Mock timezone
  await jest.unstable_mockModule('../utils/timezone.js', () => ({
    getCurrentVietnamTime: jest.fn(),
  }));

  // Import động các module SAU KHI đã mock
  Movie = (await import('../models/movie.js')).default;
  Showtime = (await import('../models/showtime.js')).default;
  getCurrentVietnamTime = (await import('../utils/timezone.js')).getCurrentVietnamTime;
  
  // Import middleware cần test
  const middlewares = await import('../middlewares/showtimeValidation.js');
  validateCreateShowtime = middlewares.validateCreateShowtime;
  validateUpdateShowtime = middlewares.validateUpdateShowtime;
});

describe('Showtime Validation Middlewares', () => {
    let mockReq, mockRes, mockNext;
    const mockMovieId = '60d0fe4f5311236168a109ca';
    const mockRoomId = '60d0fe4f5311236168a109cb';
    const mockShowtimeId = '60d0fe4f5311236168a109cc';

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = { body: {}, params: { id: mockShowtimeId } };
        mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        mockNext = jest.fn();
        const fixedCurrentTime = new Date('2025-10-15T10:00:00.000+07:00');
        getCurrentVietnamTime.mockReturnValue(fixedCurrentTime);
    });

    describe('validateCreateShowtime', () => {
        const validMovie = { _id: mockMovieId, duration: 120 };
        const validBody = {
            movie_id: mockMovieId,
            room_id: mockRoomId,
            date: '2025-10-15',
            time: '12:00',
        };

        it('nên gọi next() và tính toán start/end time khi dữ liệu hợp lệ', async () => {
            mockReq.body = validBody;
            // SỬA LỖI: Mock findById để trả về một object có phương thức .select()
            Movie.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(validMovie)
            });

            await validateCreateShowtime(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.body.start_time).toEqual(new Date('2025-10-15T12:00:00.000+07:00'));
            expect(mockReq.body.end_time).toEqual(new Date('2025-10-15T14:00:00.000+07:00'));
        });

        it('nên trả về lỗi 404 nếu không tìm thấy phim', async () => {
            mockReq.body = validBody;
            // SỬA LỖI: Mock findById().select() để trả về null
            Movie.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            await validateCreateShowtime(mockReq, mockRes, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: "Không tìm thấy phim" });
        });
    });

    describe('validateUpdateShowtime', () => {
        it('nên gọi next() khi chỉ cập nhật status', async () => {
            mockReq.body = { status: 'inactive' };
            await validateUpdateShowtime(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });

        it('nên gọi next() và tính toán lại thời gian khi date và time được cung cấp', async () => {
            mockReq.body = { date: '2025-10-16', time: '15:00' };
            const existingShowtime = { movie_id: mockMovieId };
            const movie = { duration: 90 };
            
            Showtime.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(existingShowtime)
            });
            // SỬA LỖI: Mock findById().select() cho Movie
            Movie.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(movie)
            });

            await validateUpdateShowtime(mockReq, mockRes, mockNext);
            
            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.body.start_time).toEqual(new Date('2025-10-16T15:00:00.000+07:00'));
            expect(mockReq.body.end_time).toEqual(new Date('2025-10-16T16:30:00.000+07:00'));
        });
    });
});