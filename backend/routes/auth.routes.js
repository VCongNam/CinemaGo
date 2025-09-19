import { Router } from "express";
import { registerStaff, loginStaff, registerCustomer, loginCustomer, changePassword, logout } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = Router();

router.post("/register-staff", registerStaff);
router.post("/login-staff", loginStaff);
router.post("/register-customer", registerCustomer);
router.post("/login-customer", loginCustomer);
router.post("/logout", verifyToken, logout);
router.put("/change-password", verifyToken, changePassword);

export default router;


