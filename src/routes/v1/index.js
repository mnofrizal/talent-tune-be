import express from "express";
import { userRoutes } from "./userRoutes.js";
import { authRoutes } from "./authRoutes.js";
import { assessmentRoutes } from "./assessmentRoutes.js";
import { evaluationRoutes } from "./evaluationRoutes.js"; // Added evaluation routes

const router = express.Router();

router.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.path}`, req.body);
  next();
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/assessments", assessmentRoutes);
router.use("/evaluations", evaluationRoutes); // Added evaluation routes

export const v1Routes = router;
