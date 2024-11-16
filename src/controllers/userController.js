import asyncHandler from "express-async-handler";
import { userService } from "../services/userService.js";
import { successResponse } from "../utils/responseWrapper.js";
import {
  validateCreateUser,
  validateUpdateUser,
} from "../validators/userValidator.js";

export const userController = {
  getUsers: asyncHandler(async (req, res) => {
    const users = await userService.getUsers();
    res.json(successResponse("Users retrieved successfully", users));
  }),

  createUser: asyncHandler(async (req, res) => {
    const validatedData = validateCreateUser(req.body);
    const user = await userService.createUser(validatedData);
    res.status(201).json(successResponse("User created successfully", user));
  }),

  getUserById: asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    res.json(successResponse("User retrieved successfully", user));
  }),

  updateUser: asyncHandler(async (req, res) => {
    const validatedData = validateUpdateUser(req.body);
    const user = await userService.updateUser(req.params.id, validatedData);
    res.json(successResponse("User updated successfully", user));
  }),

  deleteUser: asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id);
    res.json(successResponse("User deleted successfully", null));
  }),
};
