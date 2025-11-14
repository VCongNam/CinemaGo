
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

import {
  validateCreateMovie,
  validateUpdateMovie,
  validateStatusUpdate,
} from '../middlewares/movieValidation.js'; 

describe('Movie Validation Middlewares', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('validateCreateMovie', () => {
    it('nên gọi next() khi tất cả dữ liệu bắt buộc và tùy chọn đều hợp lệ', () => {
      mockReq.body = {
        title: 'Inception',
        duration: 148,
        description: 'A mind-bending thriller.',
        genre: ['Sci-Fi', 'Action'],
        status: 'active'
      };

      validateCreateMovie(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 nếu thiếu "title"', () => {
      mockReq.body = { duration: 148 };

      validateCreateMovie(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: "VALIDATION_ERROR",
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'title',
            message: 'Tiêu đề phim là bắt buộc và phải là chuỗi văn bản không rỗng'
          })
        ])
      }));
    });

    it('nên trả về lỗi 400 nếu thiếu "duration"', () => {
      mockReq.body = { title: 'Inception' };

      validateCreateMovie(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: "VALIDATION_ERROR",
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'duration',
            message: 'Thời lượng phim là bắt buộc và phải là số dương' 
          })
        ])
      }));
    });

    it('nên trả về lỗi 400 nếu "title" là chuỗi rỗng hoặc chỉ có khoảng trắng', () => {
      mockReq.body = { title: '  ', duration: 148 };
      validateCreateMovie(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'title', message: expect.stringContaining('không rỗng') })
        ])
      }));
    });

    it('nên trả về lỗi 400 nếu "duration" không phải là số dương', () => {
      mockReq.body = { title: 'Inception', duration: 0 }; 
      validateCreateMovie(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: "VALIDATION_ERROR",
        details: expect.arrayContaining([
            expect.objectContaining({
                field: 'duration',
                message: 'Thời lượng phim là bắt buộc và phải là số dương' 
            })
        ])
      }));
    });

    it('nên trả về lỗi 400 nếu một trường tùy chọn không hợp lệ (ví dụ: genre)', () => {
      mockReq.body = {
        title: 'Inception',
        duration: 148,
        genre: 'Sci-Fi' 
      };
      validateCreateMovie(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'genre' })
        ])
      }));
    });

    it('làm sạch (trim) các chuỗi và chuẩn hóa status trước khi gọi next()', () => {
      mockReq.body = {
        title: '   The Dark Knight   ',
        duration: 152,
        status: '  ACTIVE '
      };

      validateCreateMovie(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.title).toBe('The Dark Knight');
      expect(mockReq.body.status).toBe('active');
    });
  });

  describe('validateUpdateMovie', () => {
    it('trả về lỗi 400 khi body rỗng (vì phải có ít nhất 1 trường để cập nhật)', () => {
      mockReq.body = {};
      validateUpdateMovie(mockReq, mockRes, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          message: "Yêu cầu cập nhật phải chứa ít nhất một trường dữ liệu",
          error: "NO_FIELDS_TO_UPDATE"
      }));
    });

    it('gọi next() khi chỉ cung cấp các trường hợp lệ', () => {
      mockReq.body = { description: 'A hero rises.', trailer_url: 'http://example.com' };
      validateUpdateMovie(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled(); 
    });

    it.each([
      ['description', 12345, 'chuỗi văn bản'],
      ['genre', 'Action', 'mảng các chuỗi'],
      ['genre', ['Action', ''], 'chuỗi văn bản không rỗng'],
      ['release_date', 'not-a-date', 'ngày hợp lệ'],
      ['status', 'archived', 'active\' hoặc \'inactive'],
    ])('nên trả về lỗi 400 nếu trường "%s" không hợp lệ', (field, value, expectedMessagePart) => {
      mockReq.body = { [field]: value };
      validateUpdateMovie(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: "VALIDATION_ERROR",
        details: expect.arrayContaining([
          expect.objectContaining({
            field: field,
            message: expect.stringContaining(expectedMessagePart)
          })
        ])
      }));
    });

    it('chuẩn hóa (normalize) giá trị status và trim các chuỗi', () => {
      mockReq.body = {
        status: ' Active ',
        description: '  leading and trailing spaces  '
      };
      validateUpdateMovie(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.status).toBe('active');
      expect(mockReq.body.description).toBe('leading and trailing spaces');
    });
  });

  describe('validateStatusUpdate', () => {
    it('gọi next() và chuẩn hóa status hợp lệ', () => {
      mockReq.body = { status: ' Inactive  ' };
      validateStatusUpdate(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockReq.body.status).toBe('inactive');
    });

    it('trả về lỗi 400 nếu thiếu "status"', () => {
      mockReq.body = {}; 
      validateStatusUpdate(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Trạng thái là bắt buộc",
        error: "MISSING_STATUS"
      }));
    });

    it('trả về lỗi 400 nếu "status" là chuỗi rỗng', () => {
      mockReq.body = { status: '   ' }; 
      validateStatusUpdate(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Trạng thái không được để trống",
        error: "EMPTY_STATUS"
      }));
    });

    it('trả về lỗi 400 nếu "status" là một giá trị không được phép', () => {
      mockReq.body = { status: 'pending' };
      validateStatusUpdate(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('active\' hoặc \'inactive'),
        error: "INVALID_STATUS_VALUE",
        received: 'pending'
      }));
    });
  });
})
