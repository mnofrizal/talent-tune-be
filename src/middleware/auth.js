import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";
import { ERROR_MESSAGES } from "../config/constants.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new CustomError(
        ERROR_MESSAGES.AUTH.TOKEN_MISSING,
        StatusCodes.UNAUTHORIZED
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          systemRole: true,
          nip: true,
          jabatan: true,
          bidang: true,
        },
      });

      if (!user) {
        throw new CustomError(
          ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
          StatusCodes.UNAUTHORIZED
        );
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        // Return a specific response for token expiration
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.TOKEN_EXPIRED,
          errors: null,
          data: null,
          isTokenExpired: true, // Frontend can use this flag to trigger refresh token flow
        });
        return;
      }

      if (error.name === "JsonWebTokenError") {
        throw new CustomError(
          ERROR_MESSAGES.AUTH.TOKEN_INVALID,
          StatusCodes.UNAUTHORIZED
        );
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.systemRole)) {
      throw new CustomError(
        ERROR_MESSAGES.AUTH.UNAUTHORIZED,
        StatusCodes.FORBIDDEN
      );
    }
    next();
  };
};
