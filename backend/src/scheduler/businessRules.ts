export const WORK_DAY_START_HOUR = 9;
export const WORK_DAY_END_HOUR = 18;

export function validateDateRange(startTime: Date, endTime: Date): void {
  if (startTime >= endTime) {
    throw new Error("Start time must be before end time.");
  }
}

export function isWithinWorkingHours(startTime: Date, endTime: Date): boolean {
  const startHour = startTime.getHours();
  const endHour = endTime.getHours();
  const endMinutes = endTime.getMinutes();

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
