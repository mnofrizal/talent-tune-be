import { z } from "zod";
import { CustomError } from "../utils/customError.js";
import { StatusCodes } from "http-status-codes";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  nip: z.string().min(5, "NIP must be at least 5 characters"),
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
