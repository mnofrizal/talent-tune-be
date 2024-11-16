import { StatusCodes } from "http-status-codes";
import { errorResponse } from "../utils/responseWrapper.js";
import { Prisma } from "@prisma/client";
import { CustomError } from "../utils/customError.js";

const getPrismaErrorMessage = (error) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2001":
        return "The record you are looking for does not exist.";
      case "P2002":
        return "A record with this value already exists.";
      case "P2025":
        return "The record you are trying to update or delete does not exist.";
      default:
        return "Database operation failed.";
    }
  }
  return error.message;
};

export const errorHandler = (err, req, res, next) => {
  // Log error for debugging (only visible in server logs)
  console.error("Error:", err);

  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Internal server error";
  let errors = null;

  // Handle Custom Errors
  if (err instanceof CustomError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle Prisma Errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    message = getPrismaErrorMessage(err);

    switch (err.code) {
      case "P2001":
      case "P2025":
        statusCode = StatusCodes.NOT_FOUND;
        break;
      case "P2002":
        statusCode = StatusCodes.CONFLICT;
        break;
      default:
        statusCode = StatusCodes.BAD_REQUEST;
    }
  }

  // Handle Validation Errors
  else if (err.name === "ValidationError") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Validation failed";
    errors = Object.values(err.errors).map((error) => error.message);
  }

  // Handle Express Validation Errors
  else if (err.name === "ValidationError") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Invalid input data";
    errors = Object.values(err.errors).map((e) => e.message);
  }

  // Use status code from error if available
  if (err.statusCode) {
    statusCode = err.statusCode;
  }

  // Ensure response status is set
  res.status(statusCode);

  // Send clean error response without stack traces
  res.json(errorResponse(message, errors));
};
