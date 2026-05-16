import createRBTree from "functional-red-black-tree";
import type {
  SchedulerTask,
  ConflictResult,
  TimeSlot,
} from "./schedulerTypes.js";
import { tasksOverlap, validateTimeRange } from "./conflictDetector.js";

type Tree = ReturnType<typeof createRBTree<number, SchedulerTask>>;

export class RBTreeScheduler {
  private tree: Tree;

  constructor(tasks: SchedulerTask[]) {
    this.tree = createRBTree<number, SchedulerTask>((a, b) => a - b);

    for (const task of tasks) {
      this.insert(task);
    }
  }

  insert(task: SchedulerTask): void {
    const key = task.startTime.getTime();

    this.tree = this.tree.insert(key, task);
  }

  detectConflict(startTime: Date, endTime: Date): ConflictResult {
    validateTimeRange(startTime, endTime);

    const timestamp = startTime.getTime();

    const iterator = this.tree.le(timestamp);

    // previous event
    if (iterator.valid) {
      const previousTask = iterator.value!;

      if (
        tasksOverlap(
          startTime,
          endTime,
          previousTask.startTime,
          previousTask.endTime,
        )
      ) {
        return {
          hasConflict: true,
          conflictingTask: previousTask,
        };
      }

      iterator.next();
    }

    // next event
    if (iterator.valid) {
      const nextTask = iterator.value!;

      if (
        tasksOverlap(startTime, endTime, nextTask.startTime, nextTask.endTime)
      ) {
        return {
          hasConflict: true,
          conflictingTask: nextTask,
        };
      }
    }

    return {
      hasConflict: false,

      conflictingTask: null,
    };
  }

  findFirstAvailableSlot(
    durationMinutes: number,
    searchStart: Date,
    searchEnd: Date,
  ): TimeSlot | null {
    if (durationMinutes <= 0) {
      throw new Error("Duration must be greater than zero.");
    }

    validateTimeRange(searchStart, searchEnd);

    let currentStart = new Date(searchStart);
    const durationMs = durationMinutes * 60 * 1000;

    const iterator = this.tree.ge(searchStart.getTime());

    while (iterator.valid) {
      const task = iterator.value!;

      const possibleEnd = new Date(currentStart.getTime() + durationMs);

      if (possibleEnd <= task.startTime) {
        return {
          startTime: currentStart,
          endTime: possibleEnd,
        };
      }

      if (task.endTime > currentStart) {
        currentStart = new Date(task.endTime);
      }

      iterator.next();
    }

    const finalEnd = new Date(currentStart.getTime() + durationMs);

    if (finalEnd <= searchEnd) {
      return {
        startTime: currentStart,
        endTime: finalEnd,
      };
    }

    return null;
  }
}
