import express from "express";
import { assessmentController } from "../../controllers/assessmentController.js";
import { protect, authorize } from "../../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes accessible by both ADMINISTRATOR and USER
router.get("/", assessmentController.getAssessments);
router.get("/:id", assessmentController.getAssessmentById);

// Routes accessible only by ADMINISTRATOR
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
router.delete(
  "/:id",
  authorize("ADMINISTRATOR"),
  assessmentController.deleteAssessment
);

// Participant management
router.post(
  "/:id/participants",
  authorize("ADMINISTRATOR"),
  assessmentController.addParticipant
);
router.delete(
  "/:id/participants/:participantId",
  authorize("ADMINISTRATOR"),
  assessmentController.removeParticipant
);
router.patch(
  "/:id/participants/:participantId/status",
  authorize("ADMINISTRATOR"),
  assessmentController.updateParticipantStatus
);
router.patch(
  "/:id/participants/:participantId/schedule",
  authorize("ADMINISTRATOR"),
  assessmentController.updateParticipantSchedule
);

export const assessmentRoutes = router;
