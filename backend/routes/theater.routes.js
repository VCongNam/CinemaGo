import { Router } from "express";
import { verifyToken, requireAdmin } from "../middlewares/auth.js";
import {
  getAllTheaters,
  getTheaterById,
  createTheater,
  updateTheater,
  deleteTheater,
  updateTheaterStatus,
  getTheaterStats
} from "../controllers/theater.controller.js";
import {
  validateCreateTheater,
  validateUpdateTheater,
  validateTheaterStatus,
  validateTheaterId
} from "../middlewares/theaterValidation.js";

const router = Router();

// Tất cả routes đều yêu cầu admin
router.use(verifyToken, requireAdmin);

// Lấy danh sách tất cả rạp
// POST /api/theaters/list
router.post("/list", getAllTheaters);

// Lấy chi tiết rạp theo ID
// GET /api/theaters/:id
router.get("/:id", validateTheaterId, getTheaterById);

// Tạo rạp mới
// POST /api/theaters
router.post("/", validateCreateTheater, createTheater);

// Cập nhật rạp
// PUT /api/theaters/:id
router.put("/:id", validateTheaterId, validateUpdateTheater, updateTheater);

// Xóa rạp (soft delete)
// DELETE /api/theaters/:id
router.delete("/:id", validateTheaterId, deleteTheater);

// Thay đổi trạng thái rạp
// PATCH /api/theaters/:id/status
router.patch("/:id/status", validateTheaterId, validateTheaterStatus, updateTheaterStatus);

// Lấy thống kê rạp
// GET /api/theaters/:id/stats
router.get("/:id/stats", validateTheaterId, getTheaterStats);

export default router;
