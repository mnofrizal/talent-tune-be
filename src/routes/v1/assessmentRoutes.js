import express from "express";
import { assessmentController } from "../../controllers/assessmentController.js";
import { protect, authorize } from "../../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Assessment Routes - Available to both ADMINISTRATOR and USER
router.get("/", assessmentController.getAssessments);
router.get("/:id", assessmentController.getAssessmentById);
router.get(
  "/participant/:userId",
  assessmentController.getParticipantAssessments
);
router.get("/evaluator/:userId", assessmentController.getEvaluatorAssessments);

// Assessment Routes - ADMINISTRATOR only
router.post(
  "/",
  authorize("ADMINISTRATOR"),
  assessmentController.createAssessment
);

router.put(
  "/:id",
  authorize("ADMINISTRATOR"),
  assessmentController.updateAssessment
);

router.patch(
  "/:id/status",
  authorize("ADMINISTRATOR"),
  assessmentController.updateAssessmentStatus
);

router.delete(
  "/:id",
  authorize("ADMINISTRATOR"),
  assessmentController.deleteAssessment
);

// // Submission Routes - Available to participants
// router.post("/:id/submission", assessmentController.submitAssessment);

// router.put("/:id/submission", assessmentController.updateSubmission);

// // Evaluation Routes
// router.post("/:id/evaluation", assessmentController.createEvaluation);

// router.put(
//   "/:id/evaluation/:evaluationId",
//   assessmentController.updateEvaluation
// );

// router.get("/:id/evaluations", assessmentController.getAssessmentEvaluations);

// // Additional utility routes
// router.get(
//   "/statistics/summary",
//   authorize("ADMINISTRATOR"),
//   assessmentController.getAssessmentStatistics
// );

// router.post(
//   "/:id/reschedule",
//   authorize("ADMINISTRATOR"),
//   assessmentController.rescheduleAssessment
// );

// router.post(
//   "/:id/cancel",
//   authorize("ADMINISTRATOR"),
//   assessmentController.cancelAssessment
// );

export const assessmentRoutes = router;
