import asyncHandler from "express-async-handler";
import { authService } from "../services/authService.js";
import { successResponse } from "../utils/responseWrapper.js";
import {
  validateLogin,
  validateRegister,
} from "../validators/authValidator.js";

export const authController = {
  login: asyncHandler(async (req, res) => {
    const validatedData = validateLogin(req.body);
    const { accessToken, refreshToken, user } = await authService.login(
      validatedData
    );

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json(successResponse("Login successful", { accessToken, user }));
  }),

  register: asyncHandler(async (req, res) => {
    const validatedData = validateRegister(req.body);
    const user = await authService.register(validatedData);
    res.status(201).json(successResponse("Registration successful", user));
  }),

  refreshToken: asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const { accessToken, newRefreshToken } = await authService.refreshToken(
      refreshToken
    );

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(successResponse("Token refreshed successfully", { accessToken }));
  }),

  logout: asyncHandler(async (req, res) => {
    res.clearCookie("refreshToken");
    res.json(successResponse("Logged out successfully"));
  }),

  me: asyncHandler(async (req, res) => {
    res.json(successResponse("User profile retrieved successfully", req.user));
  }),
};
