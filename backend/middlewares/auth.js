import jwt from "jsonwebtoken";
import User from "../models/user.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// Middleware xác thực JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token không được cung cấp" });
    }

    const token = authHeader.substring(7); // Bỏ "Bearer "
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Lấy thông tin user từ database để đảm bảo user vẫn tồn tại
    const user = await User.findById(decoded.sub).select("-password");
    
    if (!user) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    // Gắn thông tin user vào request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token đã hết hạn" });
    }
    return res.status(500).json({ message: "Lỗi xác thực" });
  }
};

// Middleware kiểm tra quyền hạn
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Chưa xác thực" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    next();
  };
};

// Middleware kiểm tra quyền admin
export const requireAdmin = requireRole(["admin"]);

// Middleware kiểm tra quyền staff hoặc admin
export const requireStaff = requireRole(["staff", "admin"]);

// Middleware kiểm tra quyền customer hoặc cao hơn
export const requireCustomer = requireRole(["customer", "staff", "admin"]);
