import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";

import type { Group } from "../types/group";
import { addGroupMember, createGroup, getGroups } from "../api/groupApi";

import type { Task } from "../types/task";
import {
  autoScheduleTask,
  createTask,
  deleteTask,
  getTasks,
  updateTask,
} from "../api/taskApi";
import { TaskCalendar } from "../components/TaskCalendar";
import {
  checkUpcomingTasks,
  requestNotificationPermission,
} from "../services/notificationService";
import { getCurrentUserEmail } from "../api/authStorage";

export function TasksPage() {
  const currentUserEmail = getCurrentUserEmail();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [autoSelectedGroupId, setAutoSelectedGroupId] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberGroupId, setMemberGroupId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(3);
  const [startTime, setStartTime] = useState("2026-05-10T09:00");
  const [endTime, setEndTime] = useState("2026-05-10T10:00");

  const [autoTitle, setAutoTitle] = useState("");
  const [autoDescription, setAutoDescription] = useState("");
  const [autoPriority, setAutoPriority] = useState(3);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [searchStart, setSearchStart] = useState("2026-05-10T09:00");
  const [searchEnd, setSearchEnd] = useState("2026-05-10T18:00");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState(3);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  async function loadTasks() {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load tasks";

      setError(message);
    }
  }

  async function loadGroups() {
    try {
      const data = await getGroups();
      setGroups(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load groups";

      setError(message);
    }
  }

  useEffect(() => {
    async function initializePage() {
      try {
        await requestNotificationPermission();

        const [tasksData, groupsData] = await Promise.all([
          getTasks(),
          getGroups(),
        ]);

        setTasks(tasksData);
        setGroups(groupsData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load page data";

        setError(message);
      }
    }

    void initializePage();
  }, []);

  useEffect(() => {
    checkUpcomingTasks(tasks);

    const interval = window.setInterval(() => {
      checkUpcomingTasks(tasks);
    }, 60000);

    return () => {
      window.clearInterval(interval);
    };
  }, [tasks]);

  function toSofiaIso(value: string) {
    return `${value}:00.000+03:00`;
  }

  function toDateTimeLocalValue(value: string) {
    const date = new Date(value);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  async function handleCreateTask() {
    try {
      setError("");

      console.log("SELECTED GROUP ID:", selectedGroupId);

      const payload = {
        title,
        description,
        priority,
        startTime: toSofiaIso(startTime),
        endTime: toSofiaIso(endTime),
        status: "scheduled" as const,
        ...(selectedGroupId ? { groupId: selectedGroupId } : {}),
      };

      console.log("CREATE TASK PAYLOAD:", payload);

      await createTask(payload);

      setTitle("");
      setDescription("");
      setSelectedGroupId("");

      await loadTasks();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create task";

      setError(message);
    }
  }

  async function handleAutoScheduleTask() {
    try {
      setError("");

      await autoScheduleTask({
        title: autoTitle,
        description: autoDescription,
        priority: autoPriority,
        durationMinutes,
        searchStart: toSofiaIso(searchStart),
        searchEnd: toSofiaIso(searchEnd),
        ...(autoSelectedGroupId ? { groupId: autoSelectedGroupId } : {}),
      });

      setAutoTitle("");
      setAutoDescription("");
      setAutoSelectedGroupId("");

      await loadTasks();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to auto-schedule task";

      setError(message);
    }
  }

  async function handleDeleteTask(id: string) {
    const confirmed = window.confirm("Are you sure?");

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteTask(id);
      await loadTasks();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete task";

      setError(message);
    }
  }

  function startEditing(task: Task) {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority);
    setEditStartTime(toDateTimeLocalValue(task.startTime));
    setEditEndTime(toDateTimeLocalValue(task.endTime));
  }

  function cancelEditing() {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDescription("");
    setEditPriority(3);
    setEditStartTime("");
    setEditEndTime("");
  }

  async function handleUpdateTask() {
    if (!editingTaskId) {
      return;
    }

    try {
      setError("");

      await updateTask(editingTaskId, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        startTime: toSofiaIso(editStartTime),
        endTime: toSofiaIso(editEndTime),
        status: "scheduled",
      });

      cancelEditing();
      await loadTasks();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update task";

      setError(message);
    }
  }

  async function handleCreateGroup() {
    try {
      setError("");

      await createGroup(groupName);

      setGroupName("");
      await loadGroups();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create group";

      setError(message);
    }
  }

  async function handleAddMember() {
    if (!memberGroupId) {
      setError("Please select a group");
      return;
    }

    try {
      setError("");

      await addGroupMember(memberGroupId, memberEmail);

      setMemberEmail("");
      await loadGroups();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add member";

      setError(message);
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Smart Task Scheduler
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Logged in as: {currentUserEmail}
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Groups
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="New Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />

              <Button variant="contained" onClick={handleCreateGroup}>
                Create Group
              </Button>

              <TextField
                select
                label="Select Group"
                value={memberGroupId}
                onChange={(e) => setMemberGroupId(e.target.value)}
              >
                <MenuItem value="">Select group</MenuItem>

                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Member Email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
              />

              <Button variant="outlined" onClick={handleAddMember}>
                Add Member
              </Button>

              <Typography variant="subtitle1">My Groups</Typography>

              {groups.length === 0 ? (
                <Typography>No groups yet.</Typography>
              ) : (
                <Stack spacing={1}>
                  {groups.map((group) => (
                    <Card key={group.id} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1">
                          {group.name}
                        </Typography>

                        <Typography variant="body2">
                          Members:{" "}
                          {group.members
                            .map((member) => member.user.email)
                            .join(", ")}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Create Task Manually
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <TextField
                label="Priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />

              <TextField
                select
                label="Task Type"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <MenuItem value="">Personal Task</MenuItem>

                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    Group: {group.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Start Time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <TextField
                label="End Time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <Button variant="contained" onClick={handleCreateTask}>
                Create Task
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Auto Schedule Task
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Title"
                value={autoTitle}
                onChange={(e) => setAutoTitle(e.target.value)}
              />

              <TextField
                label="Description"
                value={autoDescription}
                onChange={(e) => setAutoDescription(e.target.value)}
              />

              <TextField
                label="Priority"
                type="number"
                value={autoPriority}
                onChange={(e) => setAutoPriority(Number(e.target.value))}
              />

              <TextField
                label="Duration Minutes"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />

              <TextField
                label="Search Start"
                type="datetime-local"
                value={searchStart}
                onChange={(e) => setSearchStart(e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <TextField
                label="Search End"
                type="datetime-local"
                value={searchEnd}
                onChange={(e) => setSearchEnd(e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <Button
                variant="contained"
                color="secondary"
                onClick={handleAutoScheduleTask}
              >
                Auto Schedule
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Calendar View
            </Typography>

            <TaskCalendar tasks={tasks} />
          </CardContent>
        </Card>

        <Typography variant="h5" gutterBottom>
          Tasks
        </Typography>

        <Stack spacing={2}>
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent>
                {editingTaskId === task.id ? (
                  <Stack spacing={2}>
                    <TextField
                      label="Title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />

                    <TextField
                      label="Description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />

                    <TextField
                      label="Priority"
                      type="number"
                      value={editPriority}
                      onChange={(e) => setEditPriority(Number(e.target.value))}
                    />

                    <TextField
                      label="Start Time"
                      type="datetime-local"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      slotProps={{
                        inputLabel: {
                          shrink: true,
                        },
                      }}
                    />

                    <TextField
                      label="End Time"
                      type="datetime-local"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      slotProps={{
                        inputLabel: {
                          shrink: true,
                        },
                      }}
                    />

                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={1}
                    >
                      <Button variant="contained" onClick={handleUpdateTask}>
                        Save
                      </Button>

                      <Button variant="outlined" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <>
                    <Typography variant="h6">{task.title}</Typography>

                    {task.description && (
                      <Typography>{task.description}</Typography>
                    )}

                    <Typography>Priority: {task.priority}</Typography>

                    <Typography>Status: {task.status}</Typography>

                    <Typography>
                      Start: {new Date(task.startTime).toLocaleString()}
                    </Typography>

                    <Typography>
                      End: {new Date(task.endTime).toLocaleString()}
                    </Typography>

                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={1}
                      sx={{ mt: 1 }}
                    >
                      <Button
                        variant="outlined"
                        onClick={() => startEditing(task)}
                      >
                        Edit
                      </Button>

                      <Button
                        color="error"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    </Container>
  );
}
