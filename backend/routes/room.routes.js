import { Router } from "express";
import { verifyToken, requireAdmin } from "../middlewares/auth.js";
import {
  getAllRooms,
  getRoomsByTheater,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
  getRoomStats
} from "../controllers/room.controller.js";
import {
  validateCreateRoom,
  validateUpdateRoom,
  validateRoomStatus,
  validateRoomId,
  validateTheaterId
} from "../middlewares/roomValidation.js";

const router = Router();

// Tất cả routes đều yêu cầu admin
router.use(verifyToken, requireAdmin);

// Lấy danh sách tất cả phòng
// POST /api/rooms/list
router.post("/list", getAllRooms);

// Lấy danh sách phòng theo theater
// GET /api/rooms/theater/:theaterId?page=1&pageSize=10&status=active
router.get("/theater/:theaterId", validateTheaterId, getRoomsByTheater);

// Lấy chi tiết phòng theo ID
// GET /api/rooms/:id
router.get("/:id", validateRoomId, getRoomById);

// Tạo phòng mới
// POST /api/rooms
router.post("/", validateCreateRoom, createRoom);

// Cập nhật phòng
// PUT /api/rooms/:id
router.put("/:id", validateRoomId, validateUpdateRoom, updateRoom);

// Xóa phòng (soft delete)
// DELETE /api/rooms/:id
router.delete("/:id", validateRoomId, deleteRoom);

// Thay đổi trạng thái phòng
// PATCH /api/rooms/:id/status
router.patch("/:id/status", validateRoomId, validateRoomStatus, updateRoomStatus);

// Lấy thống kê phòng
// GET /api/rooms/:id/stats
router.get("/:id/stats", validateRoomId, getRoomStats);

export default router;


