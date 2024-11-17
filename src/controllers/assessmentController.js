import asyncHandler from "express-async-handler";
import { assessmentService } from "../services/assessmentService.js";
import { successResponse } from "../utils/responseWrapper.js";
import {
  validateCreateAssessment,
  validateUpdateAssessment,
  validateStatus,
  validateParticipant,
  validateParticipantUpdate,
} from "../validators/assessmentValidator.js";

export const assessmentController = {
  getAssessments: asyncHandler(async (req, res) => {
    const assessments = await assessmentService.getAssessments(req.user);
    res.json(
      successResponse("Assessments retrieved successfully", assessments)
    );
  }),

  getAssessmentById: asyncHandler(async (req, res) => {
    const assessment = await assessmentService.getAssessmentById(
      req.params.id,
      req.user
    );
    res.json(successResponse("Assessment retrieved successfully", assessment));
  }),

  createAssessment: asyncHandler(async (req, res) => {
    const validatedData = validateCreateAssessment(req.body);
    const assessment = await assessmentService.createAssessment(validatedData);
    res
      .status(201)
      .json(successResponse("Assessment created successfully", assessment));
  }),

  updateAssessment: asyncHandler(async (req, res) => {
    const validatedData = validateUpdateAssessment(req.body);
    const assessment = await assessmentService.updateAssessment(
      req.params.id,
      validatedData,
      req.user
    );
    res.json(successResponse("Assessment updated successfully", assessment));
  }),

  deleteAssessment: asyncHandler(async (req, res) => {
    await assessmentService.deleteAssessment(req.params.id, req.user);
    res.json(successResponse("Assessment deleted successfully", null));
  }),

  addParticipant: asyncHandler(async (req, res) => {
    const validatedData = validateParticipant(req.body);
    const participant = await assessmentService.addParticipant(
      req.params.id,
      validatedData
    );
    res
      .status(201)
      .json(successResponse("Participant added successfully", participant));
  }),

  removeParticipant: asyncHandler(async (req, res) => {
    await assessmentService.removeParticipant(
      req.params.id,
      req.params.participantId
    );
    res.json(successResponse("Participant removed successfully", null));
  }),

  updateParticipantStatus: asyncHandler(async (req, res) => {
    const validatedData = validateStatus(req.body);
    const participant = await assessmentService.updateParticipantStatus(
      req.params.id,
      req.params.participantId,
      validatedData.status
    );
    res.json(
      successResponse("Participant status updated successfully", participant)
    );
  }),

  updateParticipantSchedule: asyncHandler(async (req, res) => {
    const validatedData = validateParticipantUpdate(req.body);
    const participant = await assessmentService.updateParticipantSchedule(
      req.params.id,
      req.params.participantId,
      validatedData.schedule
    );
    res.json(
      successResponse("Participant schedule updated successfully", participant)
    );
  }),
};
