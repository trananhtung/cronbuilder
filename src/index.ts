export { CronExpression, Cron } from "./builder.js";
export type { DayName, MonthName } from "./builder.js";
export { parseCron, validateCron } from "./parse.js";
export { describeCron } from "./describe.js";
export { nextDates, nextDate } from "./next.js";
export { matchesCron } from "./match.js";
export type { ParsedCron } from "./types.js";

export const CronPresets = {
  EVERY_MINUTE: "* * * * *",
  EVERY_HOUR: "0 * * * *",
  DAILY_MIDNIGHT: "0 0 * * *",
  DAILY_9AM: "0 9 * * *",
  WEEKLY_SUNDAY: "0 0 * * 0",
  MONTHLY_1ST: "0 0 1 * *",
  YEARLY_JAN1: "0 0 1 1 *",
  WEEKDAYS_9AM: "0 9 * * 1-5",
} as const;
