import { z } from "zod";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";
import { ERROR_MESSAGES } from "../config/constants.js";

const participantSchema = z.object({
  userId: z.number().int().positive(),
  assessmentRoleId: z.number().int().positive(),
  schedule: z.string().datetime().optional(),
});

const createAssessmentSchema = z.object({
  assessment: z.object({
    judul: z.string().min(1, ERROR_MESSAGES.VALIDATION.TITLE_REQUIRED),
    materi: z.string().min(1, ERROR_MESSAGES.VALIDATION.MATERIAL_REQUIRED),
    proyeksi: z.string().min(1, ERROR_MESSAGES.VALIDATION.PROJECTION_REQUIRED),
    metodePelaksanaan: z
      .string()
      .min(1, ERROR_MESSAGES.VALIDATION.METHOD_REQUIRED),
    ruangan: z.string(),
    linkMeeting: z.string().url().optional().nullable(),
    notaDinas: z.string(),
    isActive: z.boolean().default(true),
  }),
  participants: z
    .array(participantSchema)
    .min(1, ERROR_MESSAGES.VALIDATION.PARTICIPANTS_REQUIRED),
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
  metodePelaksanaan: z
    .string()
    .min(1, ERROR_MESSAGES.VALIDATION.METHOD_REQUIRED)
    .optional(),
  ruangan: z.string().optional(),
  linkMeeting: z.string().url().optional().nullable(),
  notaDinas: z.string().optional(),
  isActive: z.boolean().optional(),
});

const participantUpdateSchema = z.object({
  schedule: z.string().datetime(),
});

const statusSchema = z.object({
  status: z.enum([
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
  ]),
});

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

export const validateStatus = (data) => {
  try {
    return statusSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};

export const validateParticipant = (data) => {
  try {
    return participantSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};

export const validateParticipantUpdate = (data) => {
  try {
    return participantUpdateSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};
