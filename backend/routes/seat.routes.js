import { Router } from "express";
import { verifyToken, requireAdmin } from "../middlewares/auth.js";
import {
  getAllSeats,
  getSeatsByRoom,
  getSeatLayout,
  getSeatById,
  createSeat,
  createBulkSeats,
  updateSeat,
  deleteSeat,
  updateSeatStatus,
  getSeatStats
} from "../controllers/seat.controller.js";
import {
  validateCreateSeat,
  validateCreateBulkSeats,
  validateUpdateSeat,
  validateSeatStatus,
  validateSeatId,
  validateRoomId
} from "../middlewares/seatValidation.js";

const router = Router();

// Tất cả routes đều yêu cầu admin
router.use(verifyToken, requireAdmin);

// Lấy danh sách tất cả ghế
// POST /api/seats/list
router.post("/list", getAllSeats);

// Lấy danh sách ghế theo phòng (body pagination)
// POST /api/seats/room/:roomId/list
router.post("/room/:roomId/list", validateRoomId, getSeatsByRoom);

// Lấy layout ghế theo phòng (theo hàng)
// GET /api/seats/room/:roomId/layout
router.get("/room/:roomId/layout", validateRoomId, getSeatLayout);

// Lấy chi tiết ghế theo ID
// GET /api/seats/:id
router.get("/:id", validateSeatId, getSeatById);

// Tạo ghế mới
// POST /api/seats
router.post("/", validateCreateSeat, createSeat);

// Tạo nhiều ghế cùng lúc
// POST /api/seats/bulk
router.post("/bulk", validateCreateBulkSeats, createBulkSeats);

// Cập nhật ghế
// PUT /api/seats/:id
router.put("/:id", validateSeatId, validateUpdateSeat, updateSeat);

// Xóa ghế (soft delete)
// DELETE /api/seats/:id
router.delete("/:id", validateSeatId, deleteSeat);

// Thay đổi trạng thái ghế
// PATCH /api/seats/:id/status
router.patch("/:id/status", validateSeatId, validateSeatStatus, updateSeatStatus);

// Lấy thống kê ghế
// GET /api/seats/:id/stats
router.get("/:id/stats", validateSeatId, getSeatStats);

export default router;


