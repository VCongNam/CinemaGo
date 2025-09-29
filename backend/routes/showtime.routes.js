import { Router } from "express";
import { verifyToken, requireAdmin } from "../middlewares/auth.js";
import {
  listShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  updateShowtimeStatus
} from "../controllers/showtime.controller.js";
import {
  validateCreateShowtime,
  validateUpdateShowtime
} from "../middlewares/showtimeValidation.js";

const router = Router();

// Admin-only for management
router.use(verifyToken, requireAdmin);

// POST /api/showtimes/list - filter by room/movie/date
router.post("/list", listShowtimes);

// GET /api/showtimes/:id
router.get("/:id", getShowtimeById);

// POST /api/showtimes
router.post("/", validateCreateShowtime, createShowtime);

// PUT /api/showtimes/:id
router.put("/:id", validateUpdateShowtime, updateShowtime);

// PATCH /api/showtimes/:id/status
router.patch("/:id/status", updateShowtimeStatus);

// DELETE /api/showtimes/:id
router.delete("/:id", deleteShowtime);

export default router;


