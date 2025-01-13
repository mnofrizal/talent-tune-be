import { z } from "zod";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";
import { ERROR_MESSAGES } from "../config/constants.js";

// Define the evaluation status enum based on the Prisma schema
const EvaluationStatus = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]);

const createEvaluationSchema = z.object({
  assessmentId: z
    .number({
      required_error: "Assessment ID is required",
      invalid_type_error: "Assessment ID must be a number",
    })
    .positive("Assessment ID must be a positive number"),

  scores: z.record(z.number()).optional(),

  recommendation: z
    .string()
    .max(1000, { message: "Recommendation must be less than 1000 characters" })
    .optional(),

  status: EvaluationStatus.optional().default("PENDING"),
});

const scoreSchema = z.object({
  rating: z.enum(["K", "CK", "CB", "B"]),
  notes: z.string(),
});

const updateEvaluationSchema = z
  .object({
    scores: z.record(scoreSchema).optional(),
    recommendation: z.string().optional(),
    status: EvaluationStatus.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

const deleteEvaluationSchema = z.object({
  id: z
    .number({
      required_error: "Evaluation ID is required",
      invalid_type_error: "Evaluation ID must be a number",
    })
    .positive("Evaluation ID must be a positive number"),
});

export const validateCreateEvaluation = (data) => {
  try {
    return createEvaluationSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};

export const validateUpdateEvaluation = (data) => {
  try {
    // Log the incoming data for debugging
    console.log("Validation data:", JSON.stringify(data, null, 2));

    // Ensure data is an object
    if (!data || typeof data !== "object") {
      throw new CustomError(
        "Request body must be an object",
        StatusCodes.BAD_REQUEST
      );
    }

    // Parse and validate the data
    const validatedData = updateEvaluationSchema.parse(data);
    console.log("Validated data:", JSON.stringify(validatedData, null, 2));

    return validatedData;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    console.error("Validation error:", error);
    throw new CustomError(
      error.errors?.[0]?.message || "Validation failed",
      StatusCodes.BAD_REQUEST
    );
  }
};

export const validateDeleteEvaluation = (data) => {
  try {
    return deleteEvaluationSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};
