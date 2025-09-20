import { Router } from "express";
import { 
  getAllMovies, 
  getMovieById
} from "../controllers/movie.controller.js";

const router = Router();

// Public routes cho phim (không cần authentication)
// Lấy danh sách tất cả phim
router.get("/", getAllMovies);

// Lấy phim theo ID
router.get("/:id", getMovieById);

export default router;
