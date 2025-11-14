import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose'; // Chỉ import mongoose thật

// --- Biến toàn cục cho Mocks và Middleware ---
let validateCreateShowtime, validateUpdateShowtime;
let mockMovieFindById, mockShowtimeFindById, mockGetCurrentVietnamTime;
let mockCurrentTime;

// --- Biến cho req, res, next ---
let req, res, next;

// --- Thiết lập Mocks ---
beforeAll(async () => {
  // 1. Tạo các hàm mock rỗng
  mockMovieFindById = jest.fn();
  mockShowtimeFindById = jest.fn();
  mockGetCurrentVietnamTime = jest.fn();

  // 2. Mock module 'Movie'
  await jest.unstable_mockModule('../models/movie.js', () => ({
    default: {
      findById: mockMovieFindById,
    }
  }));

  // 3. Mock module 'Showtime'
  await jest.unstable_mockModule('../models/showtime.js', () => ({
    default: {
      findById: mockShowtimeFindById,
    }
  }));

  // 4. Mock module 'timezone'
  await jest.unstable_mockModule('../utils/timezone.js', () => ({
    // Mock tất cả các hàm được import, nhưng chỉ triển khai hàm cần thiết
    toVietnamTime: jest.fn((date) => date),
    getCurrentVietnamTime: mockGetCurrentVietnamTime,
    formatVietnamTime: jest.fn(),
    getDayRangeVietnam: jest.fn(),
  }));

  // 5. Import middleware SAU KHI đã mock
  const middleware = await import('../middlewares/showtimeValidation.js'); // Đảm bảo đúng đường dẫn
  validateCreateShowtime = middleware.validateCreateShowtime;
  validateUpdateShowtime = middleware.validateUpdateShowtime;
});

// --- Dọn dẹp Mocks ---
afterAll(() => {
  jest.unmock('../models/movie.js');
  jest.unmock('../models/showtime.js');
  jest.unmock('../utils/timezone.js');
});

// --- Thiết lập môi trường test chung ---
beforeEach(() => {
  // Reset tất cả mock
  jest.clearAllMocks();

  // Tạo req, res, next giả lập
  req = {
    body: {},
    params: {},
  };
  res = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
  };
  next = jest.fn();

  // --- Cài đặt thời gian cố định ---
  // Giả lập "hiện tại" là 10:00 sáng ngày 21/10/2025
  mockCurrentTime = new Date('2025-10-21T10:00:00.000+07:00');
  mockGetCurrentVietnamTime.mockReturnValue(mockCurrentTime);

  // Mock Movie.findById trả về phim hợp lệ (mặc định)
  mockMovieFindById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ duration: 120 })
  });
});

// ===============================================
// == Bắt đầu các bộ test
// ===============================================

describe('validateCreateShowtime', () => {

  it('1.1: nên gọi next() nếu tất cả dữ liệu hợp lệ và thời gian ở tương lai', async () => {
    req.body = {
      movie_id: new mongoose.Types.ObjectId().toHexString(),
      room_id: new mongoose.Types.ObjectId().toHexString(),
      date: '2025-10-21', // Hôm nay
      time: '12:00', // 12:00 (sau 10:00 + 1 tiếng)
      status: 'active'
    };

    await validateCreateShowtime(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body.start_time).toBeInstanceOf(Date);
    expect(req.body.end_time).toBeInstanceOf(Date);
    expect(req.body.end_time.getTime()).toBe(req.body.start_time.getTime() + 120 * 60000);
  });

  it('2.1: nên trả về lỗi 400 nếu thiếu trường bắt buộc', async () => {
    req.body = {
      movie_id: new mongoose.Types.ObjectId().toHexString(),
      // thiếu room_id, date, time
    };

    await validateCreateShowtime(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: "Dữ liệu không hợp lệ",
      errors: expect.arrayContaining([
        expect.objectContaining({ field: 'room_id' }),
        expect.objectContaining({ field: 'date' }),
        expect.objectContaining({ field: 'time' }),
      ])
    }));
  });

  it('2.2: nên trả về lỗi 400 nếu định dạng date/time sai', async () => {
    req.body = {
      movie_id: new mongoose.Types.ObjectId().toHexString(),
      room_id: new mongoose.Types.ObjectId().toHexString(),
      date: '21-10-2025', // Sai
      time: '12h00', // Sai
    };

    await validateCreateShowtime(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('2.3: nên trả về lỗi 400 nếu status không hợp lệ', async () => {
    req.body = {
        movie_id: new mongoose.Types.ObjectId().toHexString(),
        room_id: new mongoose.Types.ObjectId().toHexString(),
        date: '2025-10-21',
        time: '12:00',
        status: 'pending' // Sai
    };

    await validateCreateShowtime(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
            expect.objectContaining({ field: 'status' })
        ])
    }));
  });

  it('3.1: nên trả về lỗi 400 nếu thời gian bắt đầu < 1 giờ so với hiện tại', async () => {
    req.body = {
      movie_id: new mongoose.Types.ObjectId().toHexString(),
      room_id: new mongoose.Types.ObjectId().toHexString(),
      date: '2025-10-21',
      time: '10:59', // (Hiện tại là 10:00, 10:59 < 11:00)
    };

    await validateCreateShowtime(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Thời gian bắt đầu phải ít nhất 1 giờ từ bây giờ"
    });
  });

  it('3.2: nên trả về lỗi 404 nếu không tìm thấy phim', async () => {
    mockMovieFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null) // Không tìm thấy phim
    });

    req.body = {
      movie_id: new mongoose.Types.ObjectId().toHexString(),
      room_id: new mongoose.Types.ObjectId().toHexString(),
      date: '2025-10-21',
      time: '12:00',
    };

    await validateCreateShowtime(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Không tìm thấy phim" });
  });

  it('3.3: nên trả về lỗi 400 nếu thời lượng phim không hợp lệ (duration=0)', async () => {
    mockMovieFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ duration: 0 }) // Thời lượng = 0
    });

    req.body = {
        movie_id: new mongoose.Types.ObjectId().toHexString(),
        room_id: new mongoose.Types.ObjectId().toHexString(),
        date: '2025-10-21',
        time: '12:00',
    };

    await validateCreateShowtime(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Thời lượng phim không hợp lệ" });
  });

});

describe('validateUpdateShowtime', () => {

  beforeEach(() => {
    req.params.id = new mongoose.Types.ObjectId().toHexString();
  });

  it('1.1: nên gọi next() nếu chỉ cập nhật status (không có time)', async () => {
    req.body = {
      status: 'inactive'
    };

    await validateUpdateShowtime(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body.start_time).toBeUndefined(); // Logic tính toán thời gian bị bỏ qua
  });

  it('1.2: nên gọi next() nếu cập nhật thời gian (hợp lệ) và movie_id (hợp lệ)', async () => {
    req.body = {
      movie_id: new mongoose.Types.ObjectId().toHexString(),
      date: '2025-10-21',
      time: '12:00', // Hợp lệ
    };
    // mock Movie.findById (mặc định đã trả về phim duration 120)

    await validateUpdateShowtime(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body.start_time).toBeInstanceOf(Date);
    expect(req.body.end_time).toBeInstanceOf(Date);
  });

  it('1.3: nên gọi next() nếu cập nhật thời gian (hợp lệ) và KHÔNG có movie_id', async () => {
    const existingMovieId = new mongoose.Types.ObjectId().toHexString();
    
    req.body = {
      // không có movie_id
      date: '2025-10-21',
      time: '12:00',
    };

    // Phải mock Showtime.findById để tìm movie_id cũ
    mockShowtimeFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ movie_id: existingMovieId })
    });
    // Phải mock Movie.findById để tìm duration của phim cũ
    mockMovieFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ duration: 90 }) // Giả sử phim cũ 90p
    });

    await validateUpdateShowtime(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockShowtimeFindById).toHaveBeenCalledWith(req.params.id);
    expect(mockMovieFindById).toHaveBeenCalledWith(existingMovieId);
    expect(req.body.start_time).toBeInstanceOf(Date);
    expect(req.body.end_time.getTime()).toBe(req.body.start_time.getTime() + 90 * 60000);
  });

  it('2.1: nên trả về lỗi 400 nếu định dạng movie_id sai (khi được cung cấp)', async () => {
    req.body = {
      movie_id: '123' // Sai
    };

    await validateUpdateShowtime(req, res, next);
    
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
            expect.objectContaining({ field: 'movie_id' })
        ])
    }));
  });
  
  it('2.2: nên trả về lỗi 400 nếu cập nhật thời gian về quá khứ', async () => {
    req.body = {
        date: '2025-10-21',
        time: '10:30', // < 11:00 (so với 10:00)
    };
    // mock Movie.findById (mặc định đã trả về phim)

    await validateUpdateShowtime(req, res, next);
    
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Thời gian bắt đầu phải ít nhất 1 giờ từ bây giờ"
    });
  });

});