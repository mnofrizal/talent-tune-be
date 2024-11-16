import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";
import { AUTH, ERROR_MESSAGES } from "../config/constants.js";

export const authService = {
  login: async ({ email, password }) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new CustomError(
        ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
        StatusCodes.UNAUTHORIZED
      );
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token hash in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: await bcrypt.hash(refreshToken, 10) },
    });

    const { password: _, refreshToken: __, ...userWithoutSensitiveData } = user;
    return { accessToken, refreshToken, user: userWithoutSensitiveData };
  },

  register: async (userData) => {
    // Check for existing email
    const existingEmail = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingEmail) {
      throw new CustomError(
        ERROR_MESSAGES.AUTH.EMAIL_EXISTS,
        StatusCodes.CONFLICT
      );
    }

    // Check for existing NIP
    const existingNIP = await prisma.user.findUnique({
      where: { nip: userData.nip },
    });

    if (existingNIP) {
      throw new CustomError(
        ERROR_MESSAGES.AUTH.NIP_EXISTS,
        StatusCodes.CONFLICT
      );
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });

    const { password, refreshToken, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  },

  refreshToken: async (refreshToken) => {
    if (!refreshToken) {
      throw new CustomError(
        ERROR_MESSAGES.AUTH.REFRESH_TOKEN_REQUIRED,
        StatusCodes.UNAUTHORIZED
      );
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !(await bcrypt.compare(refreshToken, user.refreshToken))) {
        throw new CustomError(
          ERROR_MESSAGES.AUTH.REFRESH_TOKEN_INVALID,
          StatusCodes.UNAUTHORIZED
        );
      }

      const accessToken = generateAccessToken(user.id);
      const newRefreshToken = generateRefreshToken(user.id);

      // Update refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: await bcrypt.hash(newRefreshToken, 10) },
      });

      return { accessToken, newRefreshToken };
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new CustomError(
          ERROR_MESSAGES.AUTH.TOKEN_EXPIRED,
          StatusCodes.UNAUTHORIZED
        );
      }
      throw new CustomError(
        ERROR_MESSAGES.AUTH.REFRESH_TOKEN_INVALID,
        StatusCodes.UNAUTHORIZED
      );
    }
  },
};

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: AUTH.ACCESS_TOKEN_EXPIRES,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: AUTH.REFRESH_TOKEN_EXPIRES,
  });
};
