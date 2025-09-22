import { Router } from "express";
<<<<<<< Updated upstream
import { registerStaff, loginStaff, registerCustomer, loginCustomer, changePassword, logout, updateProfile, getUsers, getUserById } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.js";
=======
import { registerStaff, loginStaff, registerCustomer, loginCustomer, changePassword, logout, updateProfile, getUsers, getUserById, forgotPassword, resetPassword, updateUserStatus } from "../controllers/auth.controller.js";
import { verifyToken, requireAdmin } from "../middlewares/auth.js";
>>>>>>> Stashed changes

const router = Router();

router.post("/register-staff", registerStaff);
router.post("/login-staff", loginStaff);
router.post("/register-customer", registerCustomer);
router.post("/login-customer", loginCustomer);
router.post("/logout", verifyToken, logout);
router.put("/change-password", verifyToken, changePassword);
router.put("/update-profile", verifyToken, updateProfile);
router.post("/users", verifyToken, getUsers);
router.get("/users/:id", verifyToken, getUserById);

<<<<<<< Updated upstream
=======
// Forgot password routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Admin routes for user management
router.patch("/users/:userId/status", verifyToken, requireAdmin, updateUserStatus);

>>>>>>> Stashed changes
export default router;


