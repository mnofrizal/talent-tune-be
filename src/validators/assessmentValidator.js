import { z } from "zod";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";

// Define error messages object for better maintenance
const ERROR_MESSAGES = {
  VALIDATION: {
    TITLE_REQUIRED: "Title is required",
    MATERIAL_REQUIRED: "Material is required",
    PROJECTION_REQUIRED: "Projection is required",
    METHOD_REQUIRED: "Method of implementation is required",
    ROOM_REQUIRED: "Room is required",
    INVALID_EMAIL: "Invalid email format",
    INVALID_PHONE: "Invalid phone number format",
    NAME_REQUIRED: "Name is required",
    NIP_REQUIRED: "NIP is required",
    POSITION_REQUIRED: "Position is required",
    DIVISION_REQUIRED: "Division is required",
    INVALID_MEETING_LINK: "Invalid meeting link format",
    INVALID_STATUS: "Invalid assessment status",
    INVALID_SCORES: "Invalid scores format",
    RECOMMENDATION_REQUIRED: "Recommendation is required",
    INVALID_SCHEDULE: "Schedule must be a future date and time",
    PARTICIPANT_REQUIRED: "Participant information is required",
  },
};

// Enum schemas
const metodePelaksanaanEnum = z.enum(["OFFLINE", "ONLINE", "HYBRID"]);

const assessmentStatusEnum = z.enum([
  "CREATED",
  "SCHEDULED",
  "WAITING_CONFIRMATION",
  "TALENT_REQUIREMENTS",
  "READY_FOR_ASSESSMENT",
  "EVALUATING",
  "NEED_REVIEW",
  "DONE",
  "CANCELED",
  "RESCHEDULE",
]);

const evaluationStatusEnum = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]);

const evaluatorSchema = z.object({
  evaluatorId: z.number().int().positive(),
});

// Participant schema with individual schedule
const participantScheduleSchema = z.object({
  participantId: z.number().int().positive(),
  schedule: z.string().datetime({
    message: ERROR_MESSAGES.VALIDATION.INVALID_SCHEDULE,
  }),
});

// Base schemas
const createAssessmentSchema = z.object({
  assessment: z.object({
    judul: z.string().min(1, ERROR_MESSAGES.VALIDATION.TITLE_REQUIRED),
    materi: z.string().min(1, ERROR_MESSAGES.VALIDATION.MATERIAL_REQUIRED),
    proyeksi: z.string().min(1, ERROR_MESSAGES.VALIDATION.PROJECTION_REQUIRED),
    metodePelaksanaan: metodePelaksanaanEnum,
    ruangan: z.string().optional().nullable(),
    linkMeeting: z.string().url().optional().nullable(),
    notaDinas: z.any().optional().nullable(),
    participants: z
      .array(participantScheduleSchema)
      .min(1, "At least one participant with schedule is required"),
    isActive: z.boolean().default(true),
  }),
  evaluators: z
    .array(evaluatorSchema)
    .min(1, "At least one evaluator is required")
    .max(2, "Maximum two evaluators allowed"),
});

const updateAssessmentSchema = z.object({
  judul: z.string().min(1, ERROR_MESSAGES.VALIDATION.TITLE_REQUIRED).optional(),
  materi: z
    .string()
    .min(1, ERROR_MESSAGES.VALIDATION.MATERIAL_REQUIRED)
    .optional(),
  proyeksi: z
    .string()
    .min(1, ERROR_MESSAGES.VALIDATION.PROJECTION_REQUIRED)
    .optional(),
  metodePelaksanaan: metodePelaksanaanEnum.optional(),
  ruangan: z
    .string()
    .min(1, ERROR_MESSAGES.VALIDATION.ROOM_REQUIRED)
    .optional()
    .nullable(),
  linkMeeting: z.string().url().optional().nullable(),
  notaDinas: z.string().optional().nullable(),
  schedule: z
    .string()
    .datetime()
    .refine(
      (date) => new Date(date) > new Date(),
      ERROR_MESSAGES.VALIDATION.INVALID_SCHEDULE
    )
    .optional(),
  isActive: z.boolean().optional(),
  presentationFile: z.string().optional(),
  attendanceConfirmation: z.boolean(),
  questionnaireResponses: z
    .record(z.string(), z.unknown())
    .optional()
    .nullable(),
});

const statusUpdateSchema = z.object({
  status: assessmentStatusEnum,
});

const createEvaluationSchema = z.object({
  evaluatorId: z.number().int().positive(),
  assessmentId: z.number().int().positive(),
  scores: z.record(z.string(), z.number()).optional(),
  recommendation: z
    .string()
    .min(1, ERROR_MESSAGES.VALIDATION.RECOMMENDATION_REQUIRED),
  status: evaluationStatusEnum.default("PENDING"),
});

const updateEvaluationSchema = z.object({
  scores: z.record(z.string(), z.number()).optional(),
  recommendation: z
    .string()
    .min(1, ERROR_MESSAGES.VALIDATION.RECOMMENDATION_REQUIRED)
    .optional(),
  status: evaluationStatusEnum.optional(),
});

const questionnaireResponseSchema = z.object({
  presentationFile: z.string().optional(),
  attendanceConfirmation: z.boolean(),
  questionnaireResponses: z.record(z.string(), z.unknown()).optional(),
});

// Validation functions
export const validateCreateAssessment = (data) => {
  try {
    return createAssessmentSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};

export const validateUpdateAssessment = (data) => {
  try {
    return updateAssessmentSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};

export const validateStatusUpdate = (data) => {
  try {
    return statusUpdateSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};

export const validateCreateEvaluation = (data) => {
  try {
    return createEvaluationSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};

export const validateUpdateEvaluation = (data) => {
  try {
    return updateEvaluationSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};

export const validateQuestionnaireResponse = (data) => {
  try {
    return questionnaireResponseSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};

// Export schemas for reuse in other validators if needed
export const schemas = {
  createAssessmentSchema,
  updateAssessmentSchema,
  statusUpdateSchema,
  createEvaluationSchema,
  updateEvaluationSchema,
  questionnaireResponseSchema,
  metodePelaksanaanEnum,
  assessmentStatusEnum,
  evaluationStatusEnum,
};
