import { parseCron } from "./parse.js";
import { describeCron } from "./describe.js";
import { nextDates, nextDate } from "./next.js";
import { matchesCron } from "./match.js";
import { DOW_MAP, MONTH_MAP } from "./types.js";

export type DayName = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT"
  | "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";

export type MonthName = "JAN" | "FEB" | "MAR" | "APR" | "MAY" | "JUN"
  | "JUL" | "AUG" | "SEP" | "OCT" | "NOV" | "DEC";

class EveryContext {
  constructor(private _b: CronExpression, private _n: number) {}

  minutes(): CronExpression {
    this._b._minute = this._n === 1 ? "*" : `*/${this._n}`;
    return this._b;
  }

  hours(): CronExpression {
    this._b._hour = this._n === 1 ? "*" : `*/${this._n}`;
    if (this._b._minute === "*") this._b._minute = "0";
    return this._b;
  }

  days(): CronExpression {
    this._b._dom = this._n === 1 ? "*" : `*/${this._n}`;
    if (this._b._hour === "*") this._b._hour = "0";
    if (this._b._minute === "*") this._b._minute = "0";
    return this._b;
  }

  months(): CronExpression {
    this._b._month = this._n === 1 ? "*" : `*/${this._n}`;
    return this._b;
  }

  weeks(): CronExpression {
    this._b._dow = `*/${this._n}`;
    if (this._b._hour === "*") this._b._hour = "0";
    if (this._b._minute === "*") this._b._minute = "0";
    return this._b;
  }
}

export class CronExpression {
  _minute = "*";
  _hour = "*";
  _dom = "*";
  _month = "*";
  _dow = "*";

  // Raw field setters (chainable)
  minute(v: string | number): this { this._minute = String(v); return this; }
  hour(v: string | number): this { this._hour = String(v); return this; }
  dom(v: string | number): this { this._dom = String(v); return this; }
  month(v: string | number): this { this._month = String(v); return this; }
  dow(v: string | number): this { this._dow = String(v); return this; }

  // Fluent time helpers
  every(n: number): EveryContext {
    return new EveryContext(this, n);
  }

  atMinute(...minutes: number[]): this {
    this._minute = minutes.join(",");
    return this;
  }

  atHour(...hours: number[]): this {
    this._hour = hours.join(",");
    if (this._minute === "*") this._minute = "0";
    return this;
  }

  // Day-of-week helpers
  onDays(...days: (DayName | number)[]): this {
    this._dow = days
      .map((d) => (typeof d === "number" ? d : (DOW_MAP[d.toUpperCase()] ?? d)))
      .join(",");
    return this;
  }

  weekdays(): this { return this.onDays("MON", "TUE", "WED", "THU", "FRI"); }
  weekends(): this { return this.onDays("SAT", "SUN"); }

  // Day-of-month helpers
  onDayOfMonth(...days: number[]): this {
    this._dom = days.join(",");
    return this;
  }

  // Month helpers
  inMonths(...months: (MonthName | number)[]): this {
    this._month = months
      .map((m) => (typeof m === "number" ? m : (MONTH_MAP[m.toUpperCase()] ?? m)))
      .join(",");
    return this;
  }

  // Presets
  static everyMinute(): CronExpression { return new CronExpression(); }
  static everyHour(): CronExpression { return new CronExpression().every(1).hours(); }
  static daily(hour = 0, minute = 0): CronExpression {
    return new CronExpression().atHour(hour).atMinute(minute);
  }
  static weekly(day: DayName | number = "SUN", hour = 0, minute = 0): CronExpression {
    return CronExpression.daily(hour, minute).onDays(day);
  }
  static monthly(dayOfMonth = 1, hour = 0, minute = 0): CronExpression {
    return CronExpression.daily(hour, minute).onDayOfMonth(dayOfMonth);
  }
  static yearly(month: MonthName | number = 1, day = 1, hour = 0, minute = 0): CronExpression {
    return CronExpression.monthly(day, hour, minute).inMonths(month);
  }

  // Output
  toString(): string {
    return `${this._minute} ${this._hour} ${this._dom} ${this._month} ${this._dow}`;
  }

  toJSON(): string { return this.toString(); }

  describe(): string { return describeCron(this.toString()); }

  nextDate(from?: Date): Date | undefined { return nextDate(this.toString(), from); }

  nextDates(count: number, from?: Date): Date[] { return nextDates(this.toString(), count, from); }

  matches(date: Date): boolean { return matchesCron(this.toString(), date); }

  isValid(): boolean {
    try { parseCron(this.toString()); return true; }
    catch { return false; }
  }

  static parse(expr: string): CronExpression {
    parseCron(expr); // throws if invalid
    const parts = expr.trim().split(/\s+/);
    const c = new CronExpression();
    [c._minute, c._hour, c._dom, c._month, c._dow] = parts;
    return c;
  }
}

export const Cron = {
  every(n: number): EveryContext { return new CronExpression().every(n); },
};
