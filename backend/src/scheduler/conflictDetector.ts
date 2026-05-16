import type { SchedulerTask } from "./schedulerTypes.js";

export function tasksOverlap(
  newStart: Date,
  newEnd: Date,
  existingStart: Date,
  existingEnd: Date,
): boolean {
  return newStart < existingEnd && newEnd > existingStart;
}

export function validateTimeRange(startTime: Date, endTime: Date): void {
  if (startTime >= endTime) {
    throw new Error("Start time must be before end time.");
  }
}

export function findConflictLinear(
  newStart: Date,
  newEnd: Date,
  existingTasks: SchedulerTask[],
): SchedulerTask | null {
  for (const task of existingTasks) {
    if (tasksOverlap(newStart, newEnd, task.startTime, task.endTime)) {
      return task;
    }
  }

  return null;
}
