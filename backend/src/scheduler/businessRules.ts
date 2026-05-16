export const WORK_DAY_START_HOUR = 9;
export const WORK_DAY_END_HOUR = 18;

const TIME_ZONE = "Europe/Sofia";

export function validateDateRange(startTime: Date, endTime: Date): void {
  if (startTime >= endTime) {
    throw new Error("Start time must be before end time.");
  }
}

function getHourInSofia(date: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    hour12: false,
  });

  return Number(formatter.format(date));
}

function getMinutesInSofia(date: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    minute: "2-digit",
  });

  return Number(formatter.format(date));
}

export function isWithinWorkingHours(startTime: Date, endTime: Date): boolean {
  const startHour = getHourInSofia(startTime);
  const endHour = getHourInSofia(endTime);
  const endMinutes = getMinutesInSofia(endTime);

  const startsAfterWorkDayStart = startHour >= WORK_DAY_START_HOUR;

  const endsBeforeWorkDayEnd =
    endHour < WORK_DAY_END_HOUR ||
    (endHour === WORK_DAY_END_HOUR && endMinutes === 0);

  return startsAfterWorkDayStart && endsBeforeWorkDayEnd;
}

export function validateWorkingHours(startTime: Date, endTime: Date): void {
  if (!isWithinWorkingHours(startTime, endTime)) {
    throw new Error(
      "Task must be scheduled within working hours: 09:00 - 18:00.",
    );
  }
}
