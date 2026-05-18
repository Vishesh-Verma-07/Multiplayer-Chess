import { Router } from "express";
import {
  getMe,
  login,
  logout,
  register,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.post("/logout", logout);

export { router as authRoutes };
