import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name must be at most 100 characters"),
});

export const addGroupMemberSchema = z.object({
  email: z.string().email("Email must be valid"),
});
