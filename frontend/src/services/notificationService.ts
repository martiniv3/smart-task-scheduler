import type { Task } from "../types/task";

const notifiedTasks = new Set<string>();

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

export function checkUpcomingTasks(tasks: Task[]) {
  if (Notification.permission !== "granted") {
    return;
  }

  const now = Date.now();

  for (const task of tasks) {
    const startTime = new Date(task.startTime).getTime();

    const minutesUntilStart = (startTime - now) / 1000 / 60;

    const shouldNotify = minutesUntilStart > 0 && minutesUntilStart <= 10;

    const alreadyNotified = notifiedTasks.has(task.id);

    if (shouldNotify && !alreadyNotified) {
      new Notification("Smart Scheduler", {
        body:
          `Task "${task.title}" ` +
          `starts in ${Math.ceil(minutesUntilStart)} minutes`,
      });

      notifiedTasks.add(task.id);
    }
  }
}
