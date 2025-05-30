import { z } from "zod";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";
import { ERROR_MESSAGES } from "../config/constants.js";

const loginSchema = z.object({
  email: z.string().email(ERROR_MESSAGES.VALIDATION.INVALID_EMAIL),
  password: z.string().min(6, ERROR_MESSAGES.VALIDATION.PASSWORD_MIN),
});

const registerSchema = z.object({
  email: z.string().email(ERROR_MESSAGES.VALIDATION.INVALID_EMAIL),
  password: z.string().min(6, ERROR_MESSAGES.VALIDATION.PASSWORD_MIN),
  name: z.string().min(2, ERROR_MESSAGES.VALIDATION.NAME_MIN),
  nip: z.string().min(5, ERROR_MESSAGES.VALIDATION.NIP_MIN),
  phone: z.string().optional(),
  systemRole: z.enum(["ADMINISTRATOR", "USER"]).default("USER"),
  jabatan: z.string(),
  bidang: z.string(),
});

export const validateLogin = (data) => {
  try {
    return loginSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};

export const validateRegister = (data) => {
  try {
    return registerSchema.parse(data);
  } catch (error) {
    throw new CustomError(error.errors[0].message, StatusCodes.BAD_REQUEST);
  }
};
