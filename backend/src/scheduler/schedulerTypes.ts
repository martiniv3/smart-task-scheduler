export type SchedulerTask = {
  id: string;
  title: string;
  description?: string | null;
  priority: number;
  startTime: Date;
  endTime: Date;
  status: string;
  createdAt: Date;
};

export type ConflictResult = {
  hasConflict: boolean;
  conflictingTask: SchedulerTask | null;
};

export type TimeSlot = {
  startTime: Date;
  endTime: Date;
};
