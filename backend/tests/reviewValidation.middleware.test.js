import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import {
  validateCreateReview,
  validateUpdateReview
} from '../middlewares/reviewValidation.js'; 

const runValidationMiddleware = async (middlewareArray, req, res, next) => {
  for (const middleware of middlewareArray) {
    await middleware(req, res, next);
    if (res.json.mock.calls.length > 0) {
      break;
    }
  }
};

let req, res, next;
let validMovieId, validReviewId;

beforeEach(() => {
  req = {
    body: {},
    params: {}
  };
  res = {
    status: jest.fn(() => res),
    json: jest.fn(() => res)
  };
  next = jest.fn();

  validMovieId = new mongoose.Types.ObjectId().toHexString();
  validReviewId = new mongoose.Types.ObjectId().toHexString();
});


describe('Review Validation Middlewares', () => {

  describe('validateCreateReview', () => {
    it('1.1: nên gọi next() khi dữ liệu hoàn toàn hợp lệ', async () => {
      req.body = {
        movie_id: validMovieId,
        rating: 5,
        comment: "Phim rất hay!"
      };
      await runValidationMiddleware(validateCreateReview, req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('1.2: nên gọi next() khi dữ liệu hợp lệ (không có comment)', async () => {
      req.body = {
        movie_id: validMovieId,
        rating: 4.5
      };
      await runValidationMiddleware(validateCreateReview, req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('2.1: nên trả về 400 nếu thiếu movie_id hoặc rating', async () => {
      req.body = { comment: "Thiếu hết" };
      await runValidationMiddleware(validateCreateReview, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      const errors = res.json.mock.calls[0][0].errors;
      expect(errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ msg: 'Cần cung cấp mã phim (movie_id).' }),
        expect.objectContaining({ msg: 'Cần cung cấp điểm đánh giá (rating).' })
      ]));
    });

    it('2.2: nên trả về 400 nếu movie_id không phải ObjectId', async () => {
      req.body = {
        movie_id: '123',
        rating: 5
      };
      await runValidationMiddleware(validateCreateReview, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toBe('movie_id phải là ObjectId hợp lệ.');
    });

    it('2.3: nên trả về 400 nếu rating > 5', async () => {
      req.body = {
        movie_id: validMovieId,
        rating: 6
      };
      await runValidationMiddleware(validateCreateReview, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toBe('Điểm đánh giá phải từ 1 đến 5.');
    });

    it('2.4: nên trả về 400 nếu rating < 1', async () => {
      req.body = {
        movie_id: validMovieId,
        rating: 0
      };
      await runValidationMiddleware(validateCreateReview, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toBe('Điểm đánh giá phải từ 1 đến 5.');
    });
  });

  describe('validateUpdateReview', () => {
    it('1.1: nên gọi next() khi ID hợp lệ và body hợp lệ', async () => {
      req.params.reviewId = validReviewId;
      req.body = {
        rating: 1,
        comment: "Phim tệ."
      };
      await runValidationMiddleware(validateUpdateReview, req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('1.2: nên gọi next() khi ID hợp lệ và body rỗng (tất cả đều optional)', async () => {
      req.params.reviewId = validReviewId;
      req.body = {};
      await runValidationMiddleware(validateUpdateReview, req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('2.1: nên trả về 400 nếu reviewId (param) không hợp lệ', async () => {
      req.params.reviewId = 'abc'; 
      req.body = { rating: 5 };
      await runValidationMiddleware(validateUpdateReview, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toBe('Mã đánh giá (reviewId) không hợp lệ.');
    });

    it('2.2: nên trả về 400 nếu rating (tùy chọn) không hợp lệ', async () => {
      req.params.reviewId = validReviewId;
      req.body = { rating: 10 }; 
      await runValidationMiddleware(validateUpdateReview, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toBe('Điểm đánh giá phải từ 1 đến 5.');
    });

    it('2.3: nên trả về 400 nếu comment (tùy chọn) không phải là chuỗi', async () => {
      req.params.reviewId = validReviewId;
      req.body = { comment: 12345 }; 
      await runValidationMiddleware(validateUpdateReview, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].errors[0].msg).toBe('Bình luận phải là chuỗi.');
    });
  });

});