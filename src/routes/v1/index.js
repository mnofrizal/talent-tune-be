import express from "express";
import { userRoutes } from "./userRoutes.js";
import { authRoutes } from "./authRoutes.js";
import { assessmentRoutes } from "./assessmentRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/assessments", assessmentRoutes);

export const v1Routes = router;
