import asyncHandler from "express-async-handler";
import { authService } from "../services/authService.js";
import { successResponse } from "../utils/responseWrapper.js";
import {
  validateLogin,
  validateRegister,
} from "../validators/authValidator.js";
import { AUTH, SUCCESS_MESSAGES } from "../config/constants.js";

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
      maxAge: AUTH.COOKIE_MAX_AGE,
    });

    res.json(
      successResponse(SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESS, {
        accessToken,
        user,
      })
    );
  }),

  register: asyncHandler(async (req, res) => {
    const validatedData = validateRegister(req.body);
    const user = await authService.register(validatedData);
    res
      .status(201)
      .json(successResponse(SUCCESS_MESSAGES.AUTH.REGISTER_SUCCESS, user));
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
      maxAge: AUTH.COOKIE_MAX_AGE,
    });

    res.json(
      successResponse(SUCCESS_MESSAGES.AUTH.TOKEN_REFRESHED, { accessToken })
    );
  }),

  logout: asyncHandler(async (req, res) => {
    res.clearCookie("refreshToken");
    res.json(successResponse(SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS));
  }),

  me: asyncHandler(async (req, res) => {
    res.json(
      successResponse(SUCCESS_MESSAGES.AUTH.PROFILE_RETRIEVED, req.user)
    );
  }),
};
