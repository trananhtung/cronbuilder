import {
  CronExpression, Cron,
  parseCron, validateCron,
  describeCron,
  nextDates, nextDate,
  matchesCron,
  CronPresets,
} from "../src/index.js";

// Helper: make a Date from UTC fields (avoids TZ issues in tests)
function utc(year: number, month: number, day: number, hour = 0, min = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, min, 0, 0));
}

// ────────────────────────────────────────────────────────────────────────────
// parseCron
// ────────────────────────────────────────────────────────────────────────────
describe("parseCron", () => {
  test("wildcard expression", () => {
    const p = parseCron("* * * * *");
    expect(p.minute).toHaveLength(60);
    expect(p.hour).toHaveLength(24);
    expect(p.month).toHaveLength(12);
    expect(p.domStar).toBe(true);
    expect(p.dowStar).toBe(true);
  });

  test("specific values", () => {
    const p = parseCron("30 9 15 6 1");
    expect(p.minute).toEqual([30]);
    expect(p.hour).toEqual([9]);
    expect(p.dom).toEqual([15]);
    expect(p.month).toEqual([6]);
    expect(p.dow).toEqual([1]);
  });

  test("step expressions", () => {
    const p = parseCron("*/5 */2 * * *");
    expect(p.minute).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    expect(p.hour).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);
  });

  test("range", () => {
    const p = parseCron("0 9-17 * * *");
    expect(p.hour).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
  });

  test("list", () => {
    const p = parseCron("0 9,12,17 * * *");
    expect(p.hour).toEqual([9, 12, 17]);
  });

  test("range with step", () => {
    const p = parseCron("0 8-18/2 * * *");
    expect(p.hour).toEqual([8, 10, 12, 14, 16, 18]);
  });

  test("named months", () => {
    const p = parseCron("0 0 1 JAN,JUN,DEC *");
    expect(p.month).toEqual([1, 6, 12]);
  });

  test("named dow", () => {
    const p = parseCron("0 9 * * MON-FRI");
    expect(p.dow).toEqual([1, 2, 3, 4, 5]);
  });

  test("dow 7 normalized to 0 (Sunday)", () => {
    const p = parseCron("0 0 * * 7");
    expect(p.dow).toEqual([0]);
    expect(p.dow).not.toContain(7);
  });

  test("domStar / dowStar flags", () => {
    const p1 = parseCron("0 0 15 * *");
    expect(p1.domStar).toBe(false);
    expect(p1.dowStar).toBe(true);

    const p2 = parseCron("0 0 * * 1");
    expect(p2.domStar).toBe(true);
    expect(p2.dowStar).toBe(false);
  });

  test("throws on wrong field count", () => {
    expect(() => parseCron("* * * *")).toThrow();
    expect(() => parseCron("* * * * * *")).toThrow();
  });

  test("throws on invalid range value", () => {
    expect(() => parseCron("0 25 * * *")).toThrow(); // hour 25 invalid
  });
});

// ────────────────────────────────────────────────────────────────────────────
// validateCron
// ────────────────────────────────────────────────────────────────────────────
describe("validateCron", () => {
  test("valid expression returns empty array", () => {
    expect(validateCron("*/5 * * * *")).toEqual([]);
    expect(validateCron("0 9 * * MON-FRI")).toEqual([]);
  });

  test("invalid expression returns error messages", () => {
    expect(validateCron("not-valid")).not.toHaveLength(0);
    expect(validateCron("* * * *")).not.toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// matchesCron
// ────────────────────────────────────────────────────────────────────────────
describe("matchesCron", () => {
  test("every minute matches any time", () => {
    expect(matchesCron("* * * * *", utc(2026, 6, 24, 10, 0))).toBe(true);
    expect(matchesCron("* * * * *", utc(2026, 1, 1, 0, 0))).toBe(true);
  });

  test("specific time matches", () => {
    expect(matchesCron("30 9 * * *", utc(2026, 6, 24, 9, 30))).toBe(true);
    expect(matchesCron("30 9 * * *", utc(2026, 6, 24, 9, 31))).toBe(false);
    expect(matchesCron("30 9 * * *", utc(2026, 6, 24, 10, 30))).toBe(false);
  });

  test("step expression matches correct minutes", () => {
    expect(matchesCron("*/15 * * * *", utc(2026, 6, 24, 10, 0))).toBe(true);
    expect(matchesCron("*/15 * * * *", utc(2026, 6, 24, 10, 15))).toBe(true);
    expect(matchesCron("*/15 * * * *", utc(2026, 6, 24, 10, 30))).toBe(true);
    expect(matchesCron("*/15 * * * *", utc(2026, 6, 24, 10, 45))).toBe(true);
    expect(matchesCron("*/15 * * * *", utc(2026, 6, 24, 10, 7))).toBe(false);
  });

  test("day of week matches", () => {
    // 2026-06-22 is Monday (dow=1)
    expect(matchesCron("0 9 * * MON", utc(2026, 6, 22, 9, 0))).toBe(true);
    expect(matchesCron("0 9 * * MON", utc(2026, 6, 23, 9, 0))).toBe(false); // Tuesday
  });

  test("day of month matches", () => {
    expect(matchesCron("0 0 15 * *", utc(2026, 6, 15, 0, 0))).toBe(true);
    expect(matchesCron("0 0 15 * *", utc(2026, 6, 16, 0, 0))).toBe(false);
  });

  test("month matches", () => {
    expect(matchesCron("0 0 1 6 *", utc(2026, 6, 1, 0, 0))).toBe(true);
    expect(matchesCron("0 0 1 6 *", utc(2026, 7, 1, 0, 0))).toBe(false);
  });

  test("DOM/DOW both restricted → OR semantics", () => {
    // dom=1 OR dow=MON — if 2026-06-01 is a Monday:
    // Let's pick a known: 2026-06-01 is Monday (dow=1)
    expect(matchesCron("0 0 1 6 MON", utc(2026, 6, 1, 0, 0))).toBe(true); // matches both
    // 2026-06-08 is Monday but not day 1
    expect(matchesCron("0 0 1 6 MON", utc(2026, 6, 8, 0, 0))).toBe(true); // dow matches
    // 2026-06-15 is Monday, but also not day 1... wait, let me pick another:
    // 2026-06-03 is Wednesday, dom=3 not 1, dow=3 not 1 → should be false
    expect(matchesCron("0 0 1 6 MON", utc(2026, 6, 3, 0, 0))).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// nextDates
// ────────────────────────────────────────────────────────────────────────────
describe("nextDates", () => {
  test("every-5-min: 3 consecutive fires", () => {
    const from = utc(2026, 6, 24, 10, 0);
    const dates = nextDates("*/5 * * * *", 3, from);
    expect(dates).toHaveLength(3);
    // next after 10:00 → 10:05, 10:10, 10:15
    expect(dates[0].getUTCHours()).toBe(10);
    expect(dates[0].getUTCMinutes()).toBe(5);
    expect(dates[1].getUTCMinutes()).toBe(10);
    expect(dates[2].getUTCMinutes()).toBe(15);
  });

  test("daily 9 AM: 3 consecutive days", () => {
    const from = utc(2026, 6, 24, 10, 0); // after 9AM
    const dates = nextDates("0 9 * * *", 3, from);
    expect(dates).toHaveLength(3);
    expect(dates[0].getUTCDate()).toBe(25);
    expect(dates[0].getUTCHours()).toBe(9);
    expect(dates[1].getUTCDate()).toBe(26);
    expect(dates[2].getUTCDate()).toBe(27);
  });

  test("weekdays only", () => {
    // 2026-06-24 is Wednesday — next weekday after end of day
    const from = utc(2026, 6, 24, 23, 59);
    const dates = nextDates("0 9 * * 1-5", 3, from);
    // Thursday Jun 25, Friday Jun 26, Monday Jun 29
    expect(dates[0].getUTCDate()).toBe(25);
    expect(dates[1].getUTCDate()).toBe(26);
    expect(dates[2].getUTCDate()).toBe(29); // skips weekend
  });

  test("monthly on the 1st", () => {
    const from = utc(2026, 6, 15, 0, 0);
    const dates = nextDates("0 0 1 * *", 3, from);
    expect(dates[0].getUTCMonth()).toBe(6); // July (0-indexed)
    expect(dates[0].getUTCDate()).toBe(1);
    expect(dates[1].getUTCMonth()).toBe(7); // August
    expect(dates[2].getUTCMonth()).toBe(8); // September
  });

  test("yearly on Jan 1", () => {
    const from = utc(2026, 6, 24, 0, 0);
    const dates = nextDates("0 0 1 1 *", 2, from);
    expect(dates[0].getUTCFullYear()).toBe(2027);
    expect(dates[0].getUTCMonth()).toBe(0);
    expect(dates[0].getUTCDate()).toBe(1);
    expect(dates[1].getUTCFullYear()).toBe(2028);
  });

  test("count=0 returns empty array", () => {
    expect(nextDates("* * * * *", 0)).toEqual([]);
  });

  test("nextDate returns first result", () => {
    const from = utc(2026, 6, 24, 10, 0);
    const d = nextDate("*/30 * * * *", from);
    expect(d).toBeDefined();
    expect(d!.getUTCMinutes()).toBe(30);
  });

  test("each result is later than the previous", () => {
    const dates = nextDates("*/7 * * * *", 10);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getTime()).toBeGreaterThan(dates[i - 1].getTime());
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// describeCron
// ────────────────────────────────────────────────────────────────────────────
describe("describeCron", () => {
  test("every minute", () => {
    expect(describeCron("* * * * *")).toBe("Every minute");
  });

  test("every 5 minutes", () => {
    expect(describeCron("*/5 * * * *")).toBe("Every 5 minutes");
  });

  test("every 15 minutes", () => {
    expect(describeCron("*/15 * * * *")).toBe("Every 15 minutes");
  });

  test("every hour", () => {
    const d = describeCron("0 * * * *");
    expect(d.toLowerCase()).toContain("every");
  });

  test("specific time", () => {
    expect(describeCron("0 9 * * *")).toBe("At 09:00");
  });

  test("specific time with minutes", () => {
    expect(describeCron("30 9 * * *")).toBe("At 09:30");
  });

  test("multiple hours", () => {
    const d = describeCron("0 9,17 * * *");
    expect(d).toContain("09:00");
    expect(d).toContain("17:00");
  });

  test("weekday restriction", () => {
    const d = describeCron("0 9 * * 1-5");
    expect(d).toContain("Monday");
    expect(d).toContain("Friday");
  });

  test("specific day of month", () => {
    const d = describeCron("0 0 15 * *");
    expect(d).toContain("15th");
  });

  test("specific month", () => {
    const d = describeCron("0 0 1 1 *");
    expect(d).toContain("January");
  });

  test("multiple months", () => {
    const d = describeCron("0 0 1 1,7 *");
    expect(d).toContain("January");
    expect(d).toContain("July");
  });

  test("returns a non-empty string for all presets", () => {
    for (const expr of Object.values(CronPresets)) {
      expect(describeCron(expr).length).toBeGreaterThan(0);
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// CronExpression builder
// ────────────────────────────────────────────────────────────────────────────
describe("CronExpression", () => {
  test("default is every minute", () => {
    expect(new CronExpression().toString()).toBe("* * * * *");
  });

  test("every(5).minutes()", () => {
    expect(new CronExpression().every(5).minutes().toString()).toBe("*/5 * * * *");
  });

  test("every(1).hours()", () => {
    expect(new CronExpression().every(1).hours().toString()).toBe("0 * * * *");
  });

  test("every(2).hours()", () => {
    expect(new CronExpression().every(2).hours().toString()).toBe("0 */2 * * *");
  });

  test("atHour sets minute to 0 if not set", () => {
    const expr = new CronExpression().atHour(9).toString();
    expect(expr).toBe("0 9 * * *");
  });

  test("atHour multiple hours", () => {
    expect(new CronExpression().atHour(9, 17).toString()).toBe("0 9,17 * * *");
  });

  test("atMinute + atHour", () => {
    expect(new CronExpression().atMinute(30).atHour(9).toString()).toBe("30 9 * * *");
  });

  test("onDays with names", () => {
    const expr = new CronExpression().atHour(9).onDays("MON", "FRI").toString();
    expect(expr).toBe("0 9 * * 1,5");
  });

  test("onDays with numbers", () => {
    const expr = new CronExpression().atHour(9).onDays(1, 5).toString();
    expect(expr).toBe("0 9 * * 1,5");
  });

  test("weekdays()", () => {
    const expr = new CronExpression().atHour(9).weekdays().toString();
    expect(expr).toBe("0 9 * * 1,2,3,4,5");
  });

  test("weekends()", () => {
    const expr = new CronExpression().atHour(10).weekends().toString();
    expect(expr).toBe("0 10 * * 6,0");
  });

  test("onDayOfMonth", () => {
    expect(new CronExpression().atHour(0).onDayOfMonth(1).toString()).toBe("0 0 1 * *");
  });

  test("inMonths with names", () => {
    expect(new CronExpression().atHour(0).inMonths("JAN", "JUL").toString()).toBe("0 0 * 1,7 *");
  });

  test("inMonths with numbers", () => {
    expect(new CronExpression().atHour(0).inMonths(1, 7).toString()).toBe("0 0 * 1,7 *");
  });

  test("every(1).days()", () => {
    expect(new CronExpression().every(1).days().toString()).toBe("0 0 * * *");
  });

  test("static everyMinute()", () => {
    expect(CronExpression.everyMinute().toString()).toBe("* * * * *");
  });

  test("static everyHour()", () => {
    expect(CronExpression.everyHour().toString()).toBe("0 * * * *");
  });

  test("static daily()", () => {
    expect(CronExpression.daily().toString()).toBe("0 0 * * *");
    expect(CronExpression.daily(9, 30).toString()).toBe("30 9 * * *");
  });

  test("static weekly()", () => {
    expect(CronExpression.weekly("MON").toString()).toBe("0 0 * * 1");
  });

  test("static monthly()", () => {
    expect(CronExpression.monthly(15, 9).toString()).toBe("0 9 15 * *");
  });

  test("static yearly()", () => {
    expect(CronExpression.yearly("JAN", 1).toString()).toBe("0 0 1 1 *");
  });

  test("static parse()", () => {
    const c = CronExpression.parse("30 9 * * 1-5");
    expect(c.toString()).toBe("30 9 * * 1-5");
  });

  test("isValid()", () => {
    expect(new CronExpression().isValid()).toBe(true);
    expect(new CronExpression().minute("invalid").isValid()).toBe(false);
  });

  test("describe()", () => {
    const d = CronExpression.daily(9).describe();
    expect(d).toContain("09:00");
  });

  test("matches()", () => {
    const c = CronExpression.daily(9, 30);
    expect(c.matches(utc(2026, 6, 24, 9, 30))).toBe(true);
    expect(c.matches(utc(2026, 6, 24, 9, 31))).toBe(false);
  });

  test("nextDate()", () => {
    const c = CronExpression.daily(9);
    const d = c.nextDate(utc(2026, 6, 24, 10, 0));
    expect(d!.getUTCDate()).toBe(25);
    expect(d!.getUTCHours()).toBe(9);
  });

  test("nextDates()", () => {
    const c = new CronExpression().every(5).minutes();
    const dates = c.nextDates(3, utc(2026, 6, 24, 10, 0));
    expect(dates).toHaveLength(3);
  });

  test("toJSON()", () => {
    const c = CronExpression.daily(9);
    expect(JSON.stringify({ cron: c })).toContain('"0 9 * * *"');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Cron helper
// ────────────────────────────────────────────────────────────────────────────
describe("Cron helper", () => {
  test("Cron.every(5).minutes().toString()", () => {
    expect(Cron.every(5).minutes().toString()).toBe("*/5 * * * *");
  });

  test("Cron.every(2).hours().weekdays()", () => {
    const expr = Cron.every(2).hours().weekdays().toString();
    expect(expr).toBe("0 */2 * * 1,2,3,4,5");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// CronPresets
// ────────────────────────────────────────────────────────────────────────────
describe("CronPresets", () => {
  test("all presets are valid cron expressions", () => {
    for (const [name, expr] of Object.entries(CronPresets)) {
      expect(validateCron(expr)).toHaveLength(0); // preset: ${name}
    }
  });

  test("WEEKDAYS_9AM fires on weekdays at 9:00", () => {
    expect(matchesCron(CronPresets.WEEKDAYS_9AM, utc(2026, 6, 22, 9, 0))).toBe(true); // Mon
    expect(matchesCron(CronPresets.WEEKDAYS_9AM, utc(2026, 6, 27, 9, 0))).toBe(false); // Sat
  });

  test("MONTHLY_1ST fires on the 1st at midnight", () => {
    expect(matchesCron(CronPresets.MONTHLY_1ST, utc(2026, 6, 1, 0, 0))).toBe(true);
    expect(matchesCron(CronPresets.MONTHLY_1ST, utc(2026, 6, 2, 0, 0))).toBe(false);
  });
});
