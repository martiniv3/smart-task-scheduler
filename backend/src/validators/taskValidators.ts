import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be at most 100 characters"),

  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),

  priority: z
    .number()
    .int("Priority must be an integer")
    .min(1, "Priority must be at least 1")
    .max(5, "Priority must be at most 5"),

  startTime: z
    .string()
    .datetime({ offset: true, message: "Start time must be a valid ISO date" }),

  endTime: z
    .string()
    .datetime({ offset: true, message: "End time must be a valid ISO date" }),

  status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),

  groupId: z.string().uuid("Group id must be valid").optional(),
});

export const autoScheduleTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be at most 100 characters"),

  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),

  priority: z
    .number()
    .int("Priority must be an integer")
    .min(1, "Priority must be at least 1")
    .max(5, "Priority must be at most 5"),

  durationMinutes: z
    .number()
    .int("Duration must be an integer")
    .min(15, "Duration must be at least 15 minutes")
    .max(480, "Duration must be at most 480 minutes"),

  searchStart: z.string().datetime({
    offset: true,
    message: "Search start must be a valid ISO date",
  }),

  searchEnd: z.string().datetime({
    offset: true,
    message: "Search end must be a valid ISO date",
  }),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be at most 100 characters")
    .optional(),

  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),

  priority: z
    .number()
    .int("Priority must be an integer")
    .min(1, "Priority must be at least 1")
    .max(5, "Priority must be at most 5")
    .optional(),

  startTime: z
    .string()
    .datetime({
      offset: true,
      message: "Start time must be a valid ISO date",
    })
    .optional(),

  endTime: z
    .string()
    .datetime({
      offset: true,
      message: "End time must be a valid ISO date",
    })
    .optional(),

  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),

  groupId: z.string().uuid("Group id must be valid").optional(),
});
