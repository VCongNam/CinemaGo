import { Router } from "express";
import { verifyToken, requireAdmin, requireStaff } from "../middlewares/auth.js";
import {
  createCombo,
  updateCombo,
  deleteCombo,
  updateComboStatus,
  getAllCombosForStaff
} from "../controllers/combo.controller.js";

const router = Router();

// Protected combo routes (staff/admin only)
// Get all combos (including inactive) for staff/admin
router.get("/all", verifyToken, requireStaff, getAllCombosForStaff);

// Create a new combo
router.post("/", verifyToken, requireStaff, createCombo);

// Update a combo
router.put("/:id", verifyToken, requireStaff, updateCombo);

// Delete a combo
router.delete("/:id", verifyToken, requireStaff, deleteCombo);

// Update combo status
router.patch("/:id/status", verifyToken, requireStaff, updateComboStatus);

export default router;
