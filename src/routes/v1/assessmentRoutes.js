import express from "express";
import { assessmentController } from "../../controllers/assessmentController.js";
import { protect, authorize } from "../../middleware/auth.js";
import { upload } from "../../utils/uploadConfig.js";
import { handleFileDownload } from "../../utils/downloadConfig.js";

const router = express.Router();

// File download routes
router.get("/download-nota-dinas/:filename", handleFileDownload("notaDinas"));
router.get(
  "/download-presentation/:filename",
  handleFileDownload("presentation")
);
router.get(
  "/download-questionnaire/:filename",
  handleFileDownload("questionnaire")
);
router.get("/download-penilaian/:filename", handleFileDownload("penilaian"));

// Authentication middleware for all routes below
router.use(protect);

// Read operations - Available to both ADMINISTRATOR and USER
router.get("/", assessmentController.getAssessments);
router.get(
  "/participant/:userId",
  assessmentController.getParticipantAssessments
);
router.get("/evaluator/:userId", assessmentController.getEvaluatorAssessments);
router.get("/:id", assessmentController.getAssessmentById);

// Write operations - ADMINISTRATOR only
router.post(
  "/",
  authorize("ADMINISTRATOR"),
  upload.notaDinas.single("notaDinas"),
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

router.post(
  "/:id/reset-status",
  authorize("ADMINISTRATOR"),
  assessmentController.resetAssessmentStatus
);

// Assessment process routes
router.post("/:id/send-invitation", assessmentController.sendInvitation);

router.put(
  "/:id/requirement",
  upload.presentation.single("presentationFile"),
  assessmentController.updateAssessmentSubmission
);

router.put("/:id/start", assessmentController.startAssessment);

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
