import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email must be valid"),

  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Email must be valid"),

  password: z.string().min(1, "Password is required"),
});
