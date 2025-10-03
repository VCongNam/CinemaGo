import { Router } from "express";
import { registerStaff, loginStaff, registerCustomer, loginCustomer, changePassword, logout, updateProfile, getUsers, getUserById, forgotPasswordLink, resetPasswordWithToken, getMyProfile, forgotPassword, resetPassword, updateUserStatus  } from "../controllers/auth.controller.js";
import { verifyToken,requireAdmin } from "../middlewares/auth.js";


const router = Router();

router.post("/register-staff", registerStaff);
router.post("/login-staff", loginStaff);
router.post("/register-customer", registerCustomer);
router.post("/login-customer", loginCustomer);
router.post("/logout", verifyToken, logout);
router.put("/change-password", verifyToken, changePassword);
router.put("/update-profile", verifyToken, updateProfile);
router.get("/profile-detail", verifyToken, getMyProfile);
// Forgot/reset with email link (JWT, stateless)
router.post("/forgot-password-link", forgotPasswordLink);
router.post("/reset-password-link", resetPasswordWithToken);
// OTP reset for customer
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/users", verifyToken, getUsers);
router.get("/users/:id", verifyToken, getUserById);
router.patch("/users/:userId/status", verifyToken, requireAdmin, updateUserStatus);


export default router;


