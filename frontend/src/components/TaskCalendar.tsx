import { useState } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";

import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";

import "react-big-calendar/lib/css/react-big-calendar.css";

import type { Task } from "../types/task";

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
};

type TaskCalendarProps = {
  tasks: Task[];
};

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export function TaskCalendar({ tasks }: TaskCalendarProps) {
  const [date, setDate] = useState(new Date(2026, 4, 10));
  const [view, setView] = useState<View>("week");

  const events: CalendarEvent[] = tasks.map((task) => ({
    id: task.id,
    title: `${task.title} (P${task.priority})`,
    start: new Date(task.startTime),
    end: new Date(task.endTime),
  }));

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ height: 600, minWidth: 700 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={date}
          view={view}
          onNavigate={(newDate) => setDate(newDate)}
          onView={(newView) => setView(newView)}
          views={["month", "week", "day", "agenda"]}
          step={30}
          timeslots={2}
          min={new Date(2026, 0, 1, 9, 0)}
          max={new Date(2026, 0, 1, 18, 0)}
        />
      </div>
    </div>
  );
}
