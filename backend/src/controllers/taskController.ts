import type { Request, Response } from "express";
import prisma from "../prisma/client.js";
import {
  checkTaskConflict,
  findAvailableSlot,
  autoScheduleTask,
} from "../scheduler/schedulerEngine.js";
import {
  createTaskSchema,
  autoScheduleTaskSchema,
  updateTaskSchema,
} from "../validators/taskValidators.js";
import {
  validateDateRange,
  validateWorkingHours,
} from "../scheduler/businessRules.js";
import { RBTreeScheduler } from "../scheduler/rbTreeScheduler.js";
import type { AuthRequest } from "../middleware/authMiddleware.js";

function getCurrentUserId(req: AuthRequest): string {
  if (!req.user) {
    throw new Error("Authenticated user is missing");
  }

  return req.user.userId;
}

function getTaskId(req: Request): string {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    throw new Error("Invalid task id");
  }

  return id;
}

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getCurrentUserId(req);

    const validation = createTaskSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid task data",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const {
      title,
      description,
      priority,
      startTime,
      endTime,
      status,
      groupId,
    } = validation.data;

    const parsedStart = new Date(startTime);
    const parsedEnd = new Date(endTime);

    validateDateRange(parsedStart, parsedEnd);
    validateWorkingHours(parsedStart, parsedEnd);

    if (groupId) {
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
        },
      });

      if (!membership) {
        return res.status(403).json({
          error: "You are not a member of this group",
        });
      }
    }

    const conflict = await checkTaskConflict(
      userId,
      parsedStart,
      parsedEnd,
      groupId,
    );

    if (conflict.hasConflict) {
      return res.status(409).json({
        error: "Task conflicts with an existing task.",
        conflictingTask: conflict.conflictingTask,
      });
    }

    const createData: {
      title: string;
      description?: string;
      priority: number;
      startTime: Date;
      endTime: Date;
      status: "scheduled" | "completed" | "cancelled";
      userId: string;
      groupId?: string;
    } = {
      title,
      priority,
      startTime: parsedStart,
      endTime: parsedEnd,
      status,
      userId,
    };

    if (description !== undefined) {
      createData.description = description;
    }

    if (groupId !== undefined) {
      createData.groupId = groupId;
    }

    const task = await prisma.task.create({
      data: createData,
    });

    return res.status(201).json(task);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create task";

    return res.status(400).json({
      error: message,
    });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getCurrentUserId(req);

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          {
            userId,
          },
          {
            group: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        ],
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return res.json(tasks);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to fetch tasks",
    });
  }
};

export const getAvailableSlot = async (req: AuthRequest, res: Response) => {
  try {
    const { durationMinutes, searchStart, searchEnd } = req.body;
    const userId = getCurrentUserId(req);

    const slot = await findAvailableSlot(
      userId,
      Number(durationMinutes),
      new Date(searchStart),
      new Date(searchEnd),
    );

    if (!slot) {
      return res.status(404).json({
        error: "No available slot found.",
      });
    }

    return res.json(slot);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to find available slot.",
    });
  }
};

export const autoScheduleTaskController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = getCurrentUserId(req);
    const validation = autoScheduleTaskSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid auto-schedule data",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const {
      title,
      description,
      priority,
      durationMinutes,
      searchStart,
      searchEnd,
    } = validation.data;

    const parsedSearchStart = new Date(searchStart);
    const parsedSearchEnd = new Date(searchEnd);

    validateDateRange(parsedSearchStart, parsedSearchEnd);
    validateWorkingHours(parsedSearchStart, parsedSearchEnd);

    const slot = await autoScheduleTask(
      userId,
      durationMinutes,
      parsedSearchStart,
      parsedSearchEnd,
    );

    if (!slot) {
      return res.status(404).json({
        error: "No available slot found for this task.",
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        priority,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: "scheduled",
        userId,
      },
    });

    return res.status(201).json({
      message: "Task auto-scheduled successfully.",
      task,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to auto-schedule task.";

    return res.status(400).json({
      error: message,
    });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const id = getTaskId(req);

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    await prisma.task.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete task";

    return res.status(400).json({
      error: message,
    });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const id = getTaskId(req);

    const validation = updateTaskSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid update data",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    const updatedStartTime = validation.data.startTime
      ? new Date(validation.data.startTime)
      : existingTask.startTime;

    const updatedEndTime = validation.data.endTime
      ? new Date(validation.data.endTime)
      : existingTask.endTime;

    validateDateRange(updatedStartTime, updatedEndTime);
    validateWorkingHours(updatedStartTime, updatedEndTime);

    const otherTasks = await prisma.task.findMany({
      where: {
        userId,
        id: {
          not: id,
        },
        status: {
          not: "cancelled",
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    const scheduler = new RBTreeScheduler(otherTasks);

    const conflict = scheduler.detectConflict(updatedStartTime, updatedEndTime);

    if (conflict.hasConflict) {
      return res.status(409).json({
        error: "Updated task conflicts with an existing task.",
        conflictingTask: conflict.conflictingTask,
      });
    }

    const updateData: {
      title?: string;
      description?: string;
      priority?: number;
      status?: "scheduled" | "completed" | "cancelled";
      startTime?: Date;
      endTime?: Date;
    } = {};

    if (validation.data.title !== undefined) {
      updateData.title = validation.data.title;
    }

    if (validation.data.description !== undefined) {
      updateData.description = validation.data.description;
    }

    if (validation.data.priority !== undefined) {
      updateData.priority = validation.data.priority;
    }

    if (validation.data.status !== undefined) {
      updateData.status = validation.data.status;
    }

    if (validation.data.startTime !== undefined) {
      updateData.startTime = updatedStartTime;
    }

    if (validation.data.endTime !== undefined) {
      updateData.endTime = updatedEndTime;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return res.json(task);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update task";

    return res.status(400).json({
      error: message,
    });
  }
};
