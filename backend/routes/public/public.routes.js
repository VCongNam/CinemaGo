import { Router } from "express";
import { getPublicTheaters, getPublicTheaterById } from "../../controllers/public/theaterPublic.controller.js";
import { getPublicRoomsByTheater, getPublicRoomSeats } from "../../controllers/public/roomPublic.controller.js";

const router = Router();

// Theaters (public)
router.post("/theaters/list", getPublicTheaters);
router.get("/theaters/:theaterId", getPublicTheaterById);

// Rooms (public)
router.post("/theaters/:theaterId/rooms/list", getPublicRoomsByTheater);
router.get("/rooms/:roomId/seats", getPublicRoomSeats);

export default router;


