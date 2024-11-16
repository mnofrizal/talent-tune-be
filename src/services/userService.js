import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";
import { ERROR_MESSAGES } from "../config/constants.js";

const excludeFields = {
  password: false,
  refreshToken: false,
};

export const userService = {
  getUsers: async () => {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        systemRole: true,
        nip: true,
        jabatan: true,
        bidang: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  getUserById: async (id) => {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        systemRole: true,
        nip: true,
        jabatan: true,
        bidang: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new CustomError(
        ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
        StatusCodes.NOT_FOUND
      );
    }

    return user;
  },

  createUser: async (userData) => {
    try {
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

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          systemRole: true,
          nip: true,
          jabatan: true,
          bidang: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Failed to create user",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },

  updateUser: async (id, userData) => {
    try {
      // If password is being updated, hash it
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: userData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          systemRole: true,
          nip: true,
          jabatan: true,
          bidang: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      if (error.code === "P2025") {
        throw new CustomError(
          ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
          StatusCodes.NOT_FOUND
        );
      }
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      await prisma.user.delete({
        where: { id: parseInt(id) },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new CustomError(
          ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
          StatusCodes.NOT_FOUND
        );
      }
      throw error;
    }
  },
};
