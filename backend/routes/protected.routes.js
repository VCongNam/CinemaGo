import { Router } from "express";
import { verifyToken, requireAdmin, requireStaff, requireCustomer } from "../middlewares/auth.js";
import { updateUserRole } from "../controllers/auth.controller.js";
import { 
  createMovie, 
  updateMovie, 
  deleteMovie, 
  updateMovieStatus 
} from "../controllers/movie.controller.js";
import {
  validateCreateMovie,
  validateUpdateMovie,
  validateStatusUpdate
} from "../middlewares/movieValidation.js";
import bookingRoutes from './booking.routes.js';

const router = Router();

// Booking routes
router.use('/bookings', bookingRoutes);

// Route lấy thông tin profile (cần đăng nhập)
router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: "Lấy thông tin profile thành công",
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      fullName: req.user.full_name,
      role: req.user.role,
      status: req.user.status
    }
  });
});

// Route cập nhật profile (cần đăng nhập)
router.put("/profile", verifyToken, (req, res) => {
  const { fullName, phone, address, dateOfBirth } = req.body;
  
  // Cập nhật thông tin user
  req.user.full_name = fullName || req.user.full_name;
  req.user.phone = phone || req.user.phone;
  req.user.address = address || req.user.address;
  req.user.date_of_birth = dateOfBirth || req.user.date_of_birth;
  
  req.user.save()
    .then(() => {
      res.json({ message: "Cập nhật profile thành công" });
    })
    .catch(err => {
      res.status(500).json({ message: "Lỗi cập nhật profile" });
    });
});

// Route chỉ dành cho admin
router.get("/admin/users", verifyToken, requireAdmin, (req, res) => {
  res.json({
    message: "Danh sách tất cả users (chỉ admin)",
    data: "Đây là dữ liệu nhạy cảm chỉ admin mới thấy"
  });
});

// Route chỉ dành cho admin để cập nhật vai trò của staff
router.patch("/admin/users/:userId/role", verifyToken, requireAdmin, updateUserRole);

// Route dành cho staff và admin
router.get("/staff/dashboard", verifyToken, requireStaff, (req, res) => {
  res.json({
    message: "Dashboard nhân viên",
    data: "Thống kê doanh thu, phim, vé..."
  });
});

// Route dành cho customer (và cao hơn)
router.get("/customer/bookings", verifyToken, requireCustomer, (req, res) => {
  res.json({
    message: "Lịch sử đặt vé của bạn",
    userId: req.user._id,
    data: "Danh sách vé đã đặt..."
  });
});

// Route test phân quyền
router.get("/test-auth", verifyToken, (req, res) => {
  res.json({
    message: "Bạn đã đăng nhập thành công!",
    user: {
      id: req.user._id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// Protected movie routes (chỉ staff/admin)
// Tạo phim mới
router.post("/movies", verifyToken, requireStaff, validateCreateMovie, createMovie);

// Cập nhật phim
router.put("/movies/:id", verifyToken, requireStaff, validateUpdateMovie, updateMovie);

// Xóa phim
router.delete("/movies/:id", verifyToken, requireStaff, deleteMovie);

// Cập nhật trạng thái phim
router.patch("/movies/:id/status", verifyToken, requireStaff, validateStatusUpdate, updateMovieStatus);

export default router;
