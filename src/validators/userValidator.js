import { z } from "zod";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";
import { ERROR_MESSAGES } from "../config/constants.js";

const createUserSchema = z.object({
  email: z.string().email(ERROR_MESSAGES.VALIDATION.INVALID_EMAIL),
  password: z.string().min(6, ERROR_MESSAGES.VALIDATION.PASSWORD_MIN),
  name: z.string().min(2, ERROR_MESSAGES.VALIDATION.NAME_MIN),
  nip: z.string().min(5, ERROR_MESSAGES.VALIDATION.NIP_MIN),
  phone: z.string().optional(),
  systemRole: z.enum(["ADMINISTRATOR", "USER"]).default("USER"),
  jabatan: z.string(),
  bidang: z.string(),
});

const updateUserSchema = z
  .object({
    email: z.string().email(ERROR_MESSAGES.VALIDATION.INVALID_EMAIL).optional(),
    password: z
      .string()
      .min(6, ERROR_MESSAGES.VALIDATION.PASSWORD_MIN)
      .optional(),
    name: z.string().min(2, ERROR_MESSAGES.VALIDATION.NAME_MIN).optional(),
    phone: z.string().optional(),
    systemRole: z.enum(["ADMINISTRATOR", "USER"]).optional(),
    jabatan: z.string().optional(),
    bidang: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const validateCreateUser = (data) => {
  try {
    return createUserSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};

export const validateUpdateUser = (data) => {
  try {
    return updateUserSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};
