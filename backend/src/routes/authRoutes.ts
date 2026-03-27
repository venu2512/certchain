import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  toggleUserStatus,
  logout,
} from "../controllers/authController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { validateBody } from "../middleware/validation.js";
import { registerSchema, loginSchema } from "../validations/index.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.post("/change-password", authenticate, changePassword);
router.post("/logout", authenticate, logout);

router.get("/users", authenticate, requireAdmin, getAllUsers);
router.patch("/users/:userId/toggle", authenticate, requireAdmin, toggleUserStatus);

export default router;