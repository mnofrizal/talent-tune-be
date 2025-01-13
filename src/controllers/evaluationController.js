import { successResponse, errorResponse } from "../utils/responseWrapper.js";
import { evaluationService } from "../services/evaluationService.js";
import { StatusCodes } from "http-status-codes";

export const getEvaluations = async (req, res) => {
  try {
    const { status, assessmentId, evaluatorId } = req.query;
    const evaluations = await evaluationService.getEvaluations({
      status,
      assessmentId,
      evaluatorId,
    });

    return res
      .status(StatusCodes.OK)
      .json(successResponse("Evaluations retrieved successfully", evaluations));
  } catch (error) {
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json(errorResponse(error.message));
  }
};

export const getEvaluationById = async (req, res) => {
  try {
    const { id } = req.params;
    const evaluation = await evaluationService.getEvaluationById(Number(id));

    return res
      .status(StatusCodes.OK)
      .json(successResponse("Evaluation retrieved successfully", evaluation));
  } catch (error) {
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json(errorResponse(error.message));
  }
};

export const createEvaluation = async (req, res) => {
  try {
    const evaluatorId = req.user.id;
    const newEvaluation = await evaluationService.createEvaluation(
      evaluatorId,
      req.body
    );

    return res
      .status(StatusCodes.CREATED)
      .json(successResponse("Evaluation created successfully", newEvaluation));
  } catch (error) {
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json(errorResponse(error.message));
  }
};

export const updateEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const evaluatorId = req.user.id;
    const userRole = req.user.systemRole;

    console.log("Update evaluation request:", {
      evaluationId: id,
      evaluatorId,
      userRole,
      body: req.body,
    });

    const { evaluation, fileError } = await evaluationService.updateEvaluation(
      Number(id),
      evaluatorId,
      req.body,
      userRole
    );

    // If there was a file generation error but the evaluation was updated successfully
    if (fileError) {
      return res
        .status(StatusCodes.OK)
        .json(
          successResponse(
            "Evaluation updated successfully but Excel generation failed",
            evaluation,
            { fileError }
          )
        );
    }

    return res
      .status(StatusCodes.OK)
      .json(successResponse("Evaluation updated successfully", evaluation));
  } catch (error) {
    console.error("Update evaluation error:", error);
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        errorResponse(
          error.message || "Failed to update evaluation",
          error.errors || null
        )
      );
  }
};

export const deleteEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const evaluatorId = req.user.id;
    const userRole = req.user.systemRole;

    console.log("Delete evaluation request:", {
      evaluationId: id,
      evaluatorId,
      userRole,
    });

    await evaluationService.deleteEvaluation(Number(id), evaluatorId, userRole);

    return res
      .status(StatusCodes.OK)
      .json(successResponse("Evaluation deleted successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json(errorResponse(error.message));
  }
};
