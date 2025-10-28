import { Router } from "express";
import { verifyToken, requireAdmin } from "../middlewares/auth.js";
import {
  listShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  updateShowtimeStatus,
  getShowtimesByTheaterAndMovie,
  getShowtimesByTheaterRoomAndMovie,
  getBookedSeatsForShowtime
} from "../controllers/showtime.controller.js";
import {
  validateCreateShowtime,
  validateUpdateShowtime
} from "../middlewares/showtimeValidation.js";

const router = Router();

// PUBLIC
// GET /api/showtimes - filter by room/movie/date via query
router.get("/", listShowtimes);
// POST /api/showtimes/list - keep POST variant for complex filters
router.post("/list", listShowtimes);
// GET /api/showtimes/:id
router.get("/:id", getShowtimeById);
// GET /api/showtimes/:id/booked-seats
router.get("/:id/booked-seats", getBookedSeatsForShowtime);
// GET /api/showtimes/theater/:theaterId/movie/:movieId
router.get("/theater/:theaterId/movie/:movieId", getShowtimesByTheaterAndMovie);
// GET /api/showtimes/theater/:theaterId/room/:roomId/movie/:movieId
router.get("/theater/:theaterId/room/:roomId/movie/:movieId", getShowtimesByTheaterRoomAndMovie);

// PROTECTED admin-only write operations
router.post("/", verifyToken, requireAdmin, validateCreateShowtime, createShowtime);
router.put("/:id", verifyToken, requireAdmin, validateUpdateShowtime, updateShowtime);
router.patch("/:id/status", verifyToken, requireAdmin, updateShowtimeStatus);
router.delete("/:id", verifyToken, requireAdmin, deleteShowtime);

export default router;



