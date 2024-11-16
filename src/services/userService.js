import { prisma } from "../config/prisma.js";

import { StatusCodes } from "http-status-codes";
import { CustomError } from "../utils/customError.js";

export const userService = {
  getUsers: async () => {
    return prisma.user.findMany();
  },

  getUserById: async (id) => {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      throw new CustomError("User not found", StatusCodes.NOT_FOUND);
    }

    return user;
  },

  createUser: async (userData) => {
    try {
      return await prisma.user.create({
        data: userData,
      });
    } catch (error) {
      if (error.code === "P2002") {
        throw new CustomError(
          "A user with this email already exists",
          StatusCodes.CONFLICT
        );
      }
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    try {
      return await prisma.user.update({
        where: { id: parseInt(id) },
        data: userData,
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new CustomError("User not found", StatusCodes.NOT_FOUND);
      }
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      return await prisma.user.delete({
        where: { id: parseInt(id) },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new CustomError("User not found", StatusCodes.NOT_FOUND);
      }
      throw error;
    }
  },
};
