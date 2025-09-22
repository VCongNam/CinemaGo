import { Router } from "express";
import { registerStaff, loginStaff, registerCustomer, loginCustomer, changePassword, logout, updateProfile, getUsers, getUserById, forgotPasswordLink, resetPasswordWithToken, getMyProfile } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.js";

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
router.post("/users", verifyToken, getUsers);
router.get("/users/:id", verifyToken, getUserById);

export default router;


