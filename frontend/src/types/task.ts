export type TaskStatus = "scheduled" | "completed" | "cancelled";

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  priority: number;
  startTime: string;
  endTime: string;
  status: TaskStatus;
  createdAt: string;
  groupId?: string | null;
};
