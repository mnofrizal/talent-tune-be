import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new CustomError("Not authorized", StatusCodes.UNAUTHORIZED);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        systemRole: true,
        nip: true,
        jabatan: true,
        bidang: true,
      },
    });

    if (!user) {
      throw new CustomError("User not found", StatusCodes.UNAUTHORIZED);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new CustomError("Invalid token", StatusCodes.UNAUTHORIZED);
    }
    if (error.name === "TokenExpiredError") {
      throw new CustomError("Token expired", StatusCodes.UNAUTHORIZED);
    }
    throw error;
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.systemRole)) {
      throw new CustomError(
        "Not authorized to access this route",
        StatusCodes.FORBIDDEN
      );
    }
    next();
  };
};
