import asyncHandler from "express-async-handler";
import { userService } from "../services/userService.js";
import { successResponse } from "../utils/responseWrapper.js";

export const userController = {
  getUsers: asyncHandler(async (req, res) => {
    const users = await userService.getUsers();
    res.json(successResponse("Users retrieved successfully", users));
  }),

  createUser: asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body);
    res.status(201).json(successResponse("User created successfully", user));
  }),

  getUserById: asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    res.json(successResponse("User retrieved successfully", user));
  }),

  updateUser: asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(successResponse("User updated successfully", user));
  }),

  deleteUser: asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id);
    res.status(200).json(successResponse("User deleted successfully", null));
  }),
};
