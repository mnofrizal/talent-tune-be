import express from "express";
import { protect, authorize } from "../../middleware/auth.js";
import {
  createEvaluation,
  getEvaluations,
  getEvaluationById,
  updateEvaluation,
  deleteEvaluation,
} from "../../controllers/evaluationController.js";
import {
  validateCreateEvaluation,
  validateUpdateEvaluation,
  validateDeleteEvaluation,
} from "../../validators/evaluationValidator.js";

const router = express.Router();

// Get all evaluations (with optional filtering)
router.get("/", protect, getEvaluations);

// Get a specific evaluation by ID
router.get("/:id", protect, getEvaluationById);

// Create a new evaluation
router.post("/", protect, validateCreateEvaluation, createEvaluation);

// Update an existing evaluation
router.put(
  "/:id",
  protect,
  (req, res, next) => {
    try {
      const validatedData = validateUpdateEvaluation(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  },
  updateEvaluation
);

// Delete an existing evaluation
router.delete("/:id", protect, validateDeleteEvaluation, deleteEvaluation);

export const evaluationRoutes = router;
