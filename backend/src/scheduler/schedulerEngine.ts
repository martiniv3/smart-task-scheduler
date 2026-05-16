import prisma from "../prisma/client.js";
import { RBTreeScheduler } from "./rbTreeScheduler.js";

export async function checkTaskConflict(
  userId: string,
  startTime: Date,
  endTime: Date,
  groupId?: string,
) {
  const existingTasks = await prisma.task.findMany({
    where: {
      status: {
        not: "cancelled",
      },
      OR: groupId
        ? [
            {
              groupId,
            },
          ]
        : [
            {
              userId,
              groupId: null,
            },
          ],
    },
    orderBy: {
      startTime: "asc",
    },
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
  const existingTasks = await prisma.task.findMany({
    where: {
      userId,
      status: {
        not: "cancelled",
      },
    },
    orderBy: {
      startTime: "asc",
    },
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
  const existingTasks = await prisma.task.findMany({
    where: {
      userId,
      status: {
        not: "cancelled",
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  const scheduler = new RBTreeScheduler(existingTasks);

  return scheduler.findFirstAvailableSlot(
    durationMinutes,
    searchStart,
    searchEnd,
  );
}
