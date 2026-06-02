import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import jsPDF from "jspdf";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

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
    return new Date(value).toISOString();
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
  async function handleChangeTaskStatus(
    task: Task,
    status: "scheduled" | "completed" | "cancelled",
  ) {
    try {
      setError("");

      await updateTask(task.id, {
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        startTime: task.startTime,
        endTime: task.endTime,
        status,
        ...(task.groupId ? { groupId: task.groupId } : {}),
      });

      await loadTasks();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update task status";

      setError(message);
    }
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

  function handleExportPdf() {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("Smart Task Scheduler", 20, 20);

    doc.setFontSize(16);
    doc.text("Tasks Report", 20, 30);

    doc.setFontSize(11);

    let y = 45;

    filteredTasks.forEach((task, index) => {
      doc.setDrawColor(180);

      doc.rect(15, y - 5, 180, 60);

      doc.setFontSize(14);
      doc.text(`Task #${index + 1}`, 20, y + 2);

      doc.setFontSize(11);

      y += 10;

      doc.text(`Title: ${task.title}`, 20, y);

      y += 7;

      doc.text(`Description: ${task.description || "No description"}`, 20, y);

      y += 7;

      doc.text(`Priority: ${task.priority}`, 20, y);

      y += 7;

      doc.text(`Status: ${task.status}`, 20, y);

      y += 7;

      const taskType = task.groupId
        ? `Group Task${task.group?.name ? ` (${task.group.name})` : ""}`
        : "Personal Task";

      doc.text(`Type: ${taskType}`, 20, y);

      y += 7;

      doc.text(`Start: ${new Date(task.startTime).toLocaleString()}`, 20, y);

      y += 7;

      doc.text(`End: ${new Date(task.endTime).toLocaleString()}`, 20, y);

      y += 20;

      if (y > 250) {
        doc.addPage();
        y = 20;
      }
    });

    if (filteredTasks.length === 0) {
      doc.text("No tasks found.", 20, y);
    }

    doc.save("smart-task-scheduler-report.pdf");
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === "completed",
  ).length;
  const scheduledTasks = tasks.filter(
    (task) => task.status === "scheduled",
  ).length;
  const cancelledTasks = tasks.filter(
    (task) => task.status === "cancelled",
  ).length;
  const groupTasks = tasks.filter((task) => task.groupId).length;
  const highPriorityTasks = tasks.filter((task) => task.priority >= 4).length;
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (!matchesSearch) {
      return false;
    }

    switch (filter) {
      case "personal":
        return !task.groupId;

      case "group":
        return Boolean(task.groupId);

      case "completed":
        return task.status === "completed";

      case "scheduled":
        return task.status === "scheduled";

      case "cancelled":
        return task.status === "cancelled";

      case "high":
        return task.priority >= 4;

      default:
        return true;
    }
  });
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Smart Task Scheduler
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Logged in as: {currentUserEmail}
        </Typography>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Dashboard Statistics
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
              }}
            >
              <Card variant="outlined" sx={{ minWidth: 150 }}>
                <CardContent>
                  <Typography variant="body2">Total Tasks</Typography>
                  <Typography variant="h4">{totalTasks}</Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ minWidth: 150 }}>
                <CardContent>
                  <Typography variant="body2">Scheduled</Typography>
                  <Typography variant="h4">{scheduledTasks}</Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ minWidth: 150 }}>
                <CardContent>
                  <Typography variant="body2">Completed</Typography>
                  <Typography variant="h4">{completedTasks}</Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ minWidth: 150 }}>
                <CardContent>
                  <Typography variant="body2">Cancelled</Typography>
                  <Typography variant="h4">{cancelledTasks}</Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ minWidth: 150 }}>
                <CardContent>
                  <Typography variant="body2">Group Tasks</Typography>
                  <Typography variant="h4">{groupTasks}</Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ minWidth: 150 }}>
                <CardContent>
                  <Typography variant="body2">High Priority</Typography>
                  <Typography variant="h4">{highPriorityTasks}</Typography>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        </Card>

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

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="h5">Tasks</Typography>

          <Button
            variant="contained"
            color="secondary"
            onClick={handleExportPdf}
          >
            Export To PDF
          </Button>
        </Box>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <TextField
                label="Search Tasks"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Button
                  variant={filter === "all" ? "contained" : "outlined"}
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>

                <Button
                  variant={filter === "personal" ? "contained" : "outlined"}
                  onClick={() => setFilter("personal")}
                >
                  Personal
                </Button>

                <Button
                  variant={filter === "group" ? "contained" : "outlined"}
                  onClick={() => setFilter("group")}
                >
                  Group
                </Button>

                <Button
                  variant={filter === "scheduled" ? "contained" : "outlined"}
                  onClick={() => setFilter("scheduled")}
                >
                  Scheduled
                </Button>

                <Button
                  variant={filter === "completed" ? "contained" : "outlined"}
                  color="success"
                  onClick={() => setFilter("completed")}
                >
                  Completed
                </Button>

                <Button
                  variant={filter === "cancelled" ? "contained" : "outlined"}
                  color="warning"
                  onClick={() => setFilter("cancelled")}
                >
                  Cancelled
                </Button>

                <Button
                  variant={filter === "high" ? "contained" : "outlined"}
                  color="error"
                  onClick={() => setFilter("high")}
                >
                  High Priority
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Stack spacing={2}>
          {filteredTasks.map((task) => (
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

                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={1}
                      sx={{ mt: 1 }}
                    >
                      {task.status === "scheduled" && (
                        <Chip
                          label="Scheduled"
                          color="primary"
                          variant="filled"
                        />
                      )}

                      {task.status === "completed" && (
                        <Chip
                          label="Completed"
                          color="success"
                          variant="filled"
                        />
                      )}

                      {task.status === "cancelled" && (
                        <Chip
                          label="Cancelled"
                          variant="filled"
                          sx={{
                            backgroundColor: "orange",
                            color: "white",
                          }}
                        />
                      )}

                      {task.groupId ? (
                        <Chip
                          label={
                            task.group?.name
                              ? `Group: ${task.group.name}`
                              : "Group Task"
                          }
                          color="info"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="Personal Task"
                          color="default"
                          variant="outlined"
                        />
                      )}
                    </Stack>

                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={1}
                      sx={{ mt: 1 }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          handleChangeTaskStatus(task, "scheduled")
                        }
                      >
                        Mark Scheduled
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={() =>
                          handleChangeTaskStatus(task, "completed")
                        }
                      >
                        Mark Completed
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() =>
                          handleChangeTaskStatus(task, "cancelled")
                        }
                      >
                        Cancel Task
                      </Button>
                    </Stack>

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
          {filteredTasks.length === 0 && (
            <Typography>No tasks found.</Typography>
          )}
        </Stack>
      </Box>
    </Container>
  );
}
