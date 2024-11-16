import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";

export const authService = {
  login: async ({ email, password }) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new CustomError("Invalid credentials", StatusCodes.UNAUTHORIZED);
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
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { nip: userData.nip }],
      },
    });

    if (existingUser) {
      throw new CustomError(
        "User with this email or NIP already exists",
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
      throw new CustomError("Refresh token required", StatusCodes.UNAUTHORIZED);
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !(await bcrypt.compare(refreshToken, user.refreshToken))) {
        throw new CustomError(
          "Invalid refresh token",
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
      throw new CustomError("Invalid refresh token", StatusCodes.UNAUTHORIZED);
    }
  },
};

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};
