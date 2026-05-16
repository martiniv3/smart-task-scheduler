import { getToken } from "./authStorage";
import type { Group } from "../types/group";

const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getGroups(): Promise<Group[]> {
  const response = await fetch(`${API_URL}/groups`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch groups");
  }

  return response.json();
}

export async function createGroup(name: string): Promise<Group> {
  const response = await fetch(`${API_URL}/groups`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create group");
  }

  return response.json();
}

export async function addGroupMember(
  groupId: string,
  email: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/groups/${groupId}/members`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add group member");
  }
}
