import { Router } from "express";
import {
  getAllUsers,
  toggleUserStatus,
} from "../controllers/authController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, requireAdmin, getAllUsers);
router.patch("/:userId/status", authenticate, requireAdmin, toggleUserStatus);

export default router;