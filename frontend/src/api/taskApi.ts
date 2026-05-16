import type { Task } from "../types/task";
import { getToken } from "./authStorage";

const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export type CreateTaskInput = {
  title: string;
  description?: string;
  priority: number;
  startTime: string;
  endTime: string;
  status: "scheduled" | "completed" | "cancelled";
  groupId?: string;
};

export type UpdateTaskInput = Partial<CreateTaskInput>;

export type AutoScheduleInput = {
  title: string;
  description?: string;
  priority: number;
  durationMinutes: number;
  searchStart: string;
  searchEnd: string;
  groupId?: string;
};

export async function getTasks(): Promise<Task[]> {
  const response = await fetch(`${API_URL}/tasks`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch tasks");
  }

  return response.json();
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create task");
  }

  return response.json();
}

export async function autoScheduleTask(input: AutoScheduleInput): Promise<{
  message: string;
  task: Task;
}> {
  const response = await fetch(`${API_URL}/tasks/auto-schedule`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to auto-schedule task");
  }

  return response.json();
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update task");
  }

  return response.json();
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete task");
  }
}
