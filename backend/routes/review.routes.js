import { Router } from "express";
import {
  createReview,
  getReviewsByMovie,
  updateReview,
  deleteReview
} from "../controllers/review.controller.js";
import { verifyToken, requireCustomer } from "../middlewares/auth.js";
import { validateCreateReview, validateUpdateReview } from "../middlewares/reviewValidation.js";

const router = Router();

// Lấy tất cả đánh giá của một phim (Public)
router.get("/movie/:movieId", getReviewsByMovie);

// Tạo đánh giá mới (Cần đăng nhập)
router.post("/", verifyToken, requireCustomer, validateCreateReview, createReview);

// Cập nhật đánh giá (Cần đăng nhập, chủ sở hữu)
router.put("/:reviewId", verifyToken, requireCustomer, validateUpdateReview, updateReview);

// Xóa đánh giá (Cần đăng nhập, chủ sở hữu hoặc admin)
router.delete("/:reviewId", verifyToken, deleteReview);

export default router;