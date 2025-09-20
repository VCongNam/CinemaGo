import { Router } from "express";
import { 
  getAllMovies, 
  getMovieById,
  getAllGenres,
  getMoviesByGenre
} from "../controllers/movie.controller.js";

const router = Router();

// Public routes cho phim (không cần authentication)
// Lấy danh sách tất cả phim
router.get("/", getAllMovies);

// Lấy tất cả thể loại phim
router.get("/genres", getAllGenres);

// Lọc phim theo thể loại
router.get("/genre/:genre", getMoviesByGenre);

// Lấy phim theo ID
router.get("/:id", getMovieById);

export default router;
