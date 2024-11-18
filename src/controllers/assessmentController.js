import { successResponse, errorResponse } from "../utils/responseWrapper.js";
import {
  validateCreateAssessment,
  validateUpdateAssessment,
  validateStatusUpdate,
  validateQuestionnaireResponse,
} from "../validators/assessmentValidator.js";
import { assessmentService } from "../services/assessmentService.js";
import { StatusCodes } from "http-status-codes";

export const assessmentController = {
  // Get all assessments with optional filters
  async getAssessments(req, res) {
    try {
      const { status, metodePelaksanaan, startDate, endDate } = req.query;
      const { assessments, metadata } = await assessmentService.getAssessments({
        status,
        metodePelaksanaan,
        startDate,
        endDate,
      });

      return res
        .status(StatusCodes.OK)
        .json(
          successResponse(
            "Assessments retrieved successfully",
            assessments,
            metadata
          )
        );
    } catch (error) {
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(errorResponse(error.message));
    }
  },

  // Get assessment by ID
  async getAssessmentById(req, res) {
    try {
      const { id } = req.params;
      const assessment = await assessmentService.getAssessmentById(Number(id));

      return res
        .status(StatusCodes.OK)
        .json(successResponse("Assessment retrieved successfully", assessment));
    } catch (error) {
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(errorResponse(error.message));
    }
  },

  // Get assessments for a specific participant
  async getParticipantAssessments(req, res) {
    try {
      const { userId } = req.params;
      const { assessments, metadata } =
        await assessmentService.getParticipantAssessments(Number(userId));

      return res
        .status(StatusCodes.OK)
        .json(
          successResponse(
            "Participant assessments retrieved successfully",
            assessments,
            metadata
          )
        );
    } catch (error) {
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(errorResponse(error.message));
    }
  },

  // Get assessments for a specific evaluator
  async getEvaluatorAssessments(req, res) {
    try {
      const { userId } = req.params;
      const { assessments, metadata } =
        await assessmentService.getEvaluatorAssessments(Number(userId));

      return res
        .status(StatusCodes.OK)
        .json(
          successResponse(
            "Evaluator assessments retrieved successfully",
            assessments,
            metadata
          )
        );
    } catch (error) {
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(errorResponse(error.message));
    }
  },

  // Create new assessment
  async createAssessment(req, res) {
    try {
      const validatedData = validateCreateAssessment(req.body);
      const result = await assessmentService.createAssessment(validatedData);

      return res
        .status(StatusCodes.CREATED)
        .json(
          successResponse(
            `Successfully created ${result.createdCount} assessments`,
            result.assessments
          )
        );
    } catch (error) {
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(errorResponse(error.message));
    }
  },

  // Update assessment
  async updateAssessment(req, res) {
    try {
      const { id } = req.params;
      const validatedData = validateUpdateAssessment(req.body);
      console.log(validatedData);
      const updatedAssessment = await assessmentService.updateAssessment(
        Number(id),
        validatedData
      );

      return res
        .status(StatusCodes.OK)
        .json(
          successResponse("Assessment updated successfully", updatedAssessment)
        );
    } catch (error) {
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(errorResponse(error.message));
    }
  },

  // Update assessment status
  async updateAssessmentStatus(req, res) {
    try {
      const { id } = req.params;
      const validatedData = validateStatusUpdate(req.body);
      const updatedAssessment = await assessmentService.updateAssessmentStatus(
        Number(id),
        validatedData.status
      );

      return res
        .status(StatusCodes.OK)
        .json(
          successResponse(
            "Assessment status updated successfully",
            updatedAssessment
          )
        );
    } catch (error) {
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(errorResponse(error.message));
    }
  },

  // Delete assessment
  async deleteAssessment(req, res) {
    try {
      const { id } = req.params;
      await assessmentService.deleteAssessment(Number(id));

      return res
        .status(StatusCodes.OK)
        .json(successResponse("Assessment deleted successfully"));
    } catch (error) {
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(errorResponse(error.message));
    }
  },

  // Send invitation for assessment
  async sendInvitation(req, res) {
    try {
      const { id } = req.params;
      await assessmentService.sendInvitation(Number(id));

      return res
        .status(StatusCodes.OK)
        .json(successResponse("Invitation sent successfully"));
    } catch (error) {
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(errorResponse(error.message));
    }
  },

  // Update assessment submission
  async updateAssessmentSubmission(req, res) {
    try {
      const { id } = req.params;
      const {
        presentationFile,
        attendanceConfirmation,
        questionnaireResponses,
      } = req.body;

      await assessmentService.updateAssessmentSubmission(
        Number(id),
        presentationFile,
        attendanceConfirmation,
        questionnaireResponses
      );

      return res
        .status(StatusCodes.OK)
        .json(successResponse("Assessment submission updated successfully"));
    } catch (error) {
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(errorResponse(error.message));
    }
  },

  // Start assessment
  async startAssessment(req, res) {
    try {
      const { id } = req.params;
      await assessmentService.startAssessment(Number(id));

      return res
        .status(StatusCodes.OK)
        .json(successResponse("Assessment started successfully"));
    } catch (error) {
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(errorResponse(error.message));
    }
  },
};
