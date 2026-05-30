import prisma from "../prisma/client.js";
import { RBTreeScheduler } from "./rbTreeScheduler.js";

export async function checkTaskConflict(
  userId: string,
  startTime: Date,
  endTime: Date,
  groupId?: string,
) {
  const activeTaskFilter = {
    status: {
      not: "cancelled",
    },
  };

  const taskOrder = {
    startTime: "asc" as const,
  };

  const conflictFilter = groupId
    ? {
        ...activeTaskFilter,
        groupId,
      }
    : {
        ...activeTaskFilter,
        userId,
        groupId: null,
      };

  const existingTasks = await prisma.task.findMany({
    where: conflictFilter,
    orderBy: taskOrder,
  });

  const scheduler = new RBTreeScheduler(existingTasks);

  return scheduler.detectConflict(startTime, endTime);
}

export async function findAvailableSlot(
  userId: string,
  durationMinutes: number,
  searchStart: Date,
  searchEnd: Date,
) {
  const activeTaskFilter = {
    userId,
    status: {
      not: "cancelled",
    },
  };

  const taskOrder = {
    startTime: "asc" as const,
  };

  const existingTasks = await prisma.task.findMany({
    where: activeTaskFilter,
    orderBy: taskOrder,
  });

  const scheduler = new RBTreeScheduler(existingTasks);

  return scheduler.findFirstAvailableSlot(
    durationMinutes,
    searchStart,
    searchEnd,
  );
}

export async function autoScheduleTask(
  userId: string,
  durationMinutes: number,
  searchStart: Date,
  searchEnd: Date,
) {
  return findAvailableSlot(userId, durationMinutes, searchStart, searchEnd);
}
