import { parseCron } from "./parse.js";
import { ParsedCron } from "./types.js";
import { matchesParsed } from "./match.js";

function nextFrom(p: ParsedCron, from: Date): Date | null {
  const d = new Date(from);
  d.setUTCSeconds(0, 0);

  // Search up to 4 years out
  const limit = new Date(d.getTime() + 4 * 366 * 24 * 60 * 60 * 1000);

  while (d < limit) {
    const curMonth = d.getUTCMonth() + 1;

    // Find next valid month
    const nextMonth = p.month.find((m) => m >= curMonth);
    if (nextMonth === undefined) {
      d.setUTCFullYear(d.getUTCFullYear() + 1, 0, 1);
      d.setUTCHours(0, 0, 0, 0);
      continue;
    }
    if (nextMonth !== curMonth) {
      d.setUTCMonth(nextMonth - 1, 1);
      d.setUTCHours(0, 0, 0, 0);
      continue;
    }

    // Find next valid day
    const curDom = d.getUTCDate();
    const curDow = d.getUTCDay();

    let dayOk: boolean;
    if (!p.domStar && !p.dowStar) {
      dayOk = p.dom.includes(curDom) || p.dow.includes(curDow);
    } else if (!p.domStar) {
      dayOk = p.dom.includes(curDom);
    } else if (!p.dowStar) {
      dayOk = p.dow.includes(curDow);
    } else {
      dayOk = true;
    }

    if (!dayOk) {
      d.setUTCDate(d.getUTCDate() + 1);
      d.setUTCHours(0, 0, 0, 0);
      continue;
    }

    // Find next valid hour
    const curHour = d.getUTCHours();
    const nextHour = p.hour.find((h) => h >= curHour);
    if (nextHour === undefined) {
      d.setUTCDate(d.getUTCDate() + 1);
      d.setUTCHours(0, 0, 0, 0);
      continue;
    }
    if (nextHour !== curHour) {
      d.setUTCHours(nextHour, 0, 0, 0);
      continue;
    }

    // Find next valid minute
    const curMin = d.getUTCMinutes();
    const nextMin = p.minute.find((m) => m >= curMin);
    if (nextMin === undefined) {
      d.setUTCHours(d.getUTCHours() + 1, 0, 0, 0);
      continue;
    }
    if (nextMin !== curMin) {
      d.setUTCMinutes(nextMin, 0, 0);
      continue;
    }

    // All fields match
    return new Date(d);
  }

  return null;
}

export function nextDates(expr: string, count: number, from?: Date): Date[] {
  const p = parseCron(expr);
  const results: Date[] = [];

  let cur = new Date(from ?? new Date());
  cur.setUTCSeconds(0, 0);
  cur.setUTCMinutes(cur.getUTCMinutes() + 1);

  while (results.length < count) {
    const next = nextFrom(p, cur);
    if (!next) break;
    results.push(new Date(next)); // copy before mutating
    next.setUTCMinutes(next.getUTCMinutes() + 1);
    cur = next;
  }

  return results;
}

export function nextDate(expr: string, from?: Date): Date | undefined {
  return nextDates(expr, 1, from)[0];
}
