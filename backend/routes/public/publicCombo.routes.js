import { Router } from "express";
import { 
  getAllCombos, 
  getComboById,
} from "../../controllers/combo.controller.js";

const router = Router();

// Public routes for combos (no authentication needed)
// Get a list of all combos
router.get("/", getAllCombos);

// Get a combo by ID
router.get("/:id", getComboById);

export default router;
