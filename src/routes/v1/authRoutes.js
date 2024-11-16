import express from "express";
import { authController } from "../../controllers/authController.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.get("/me", protect, authController.me);

export const authRoutes = router;
