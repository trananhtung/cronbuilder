import { parseCron } from "./parse.js";
import { MONTH_LONG, DOW_LONG, ORDINALS } from "./types.js";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtTime(h: number, m: number): string {
  return `${pad2(h)}:${pad2(m)}`;
}

function fmtList(items: string[], conj = "and"): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conj} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${conj} ${items[items.length - 1]}`;
}

function isContiguous(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) if (arr[i] !== arr[i - 1] + 1) return false;
  return true;
}

function fmtRange(arr: number[], mapper: (n: number) => string): string {
  if (arr.length > 2 && isContiguous(arr))
    return `${mapper(arr[0])} through ${mapper(arr[arr.length - 1])}`;
  return fmtList(arr.map(mapper));
}

function stepOf(field: string): number | null {
  if (!field.startsWith("*/")) return null;
  const n = parseInt(field.slice(2), 10);
  return isNaN(n) ? null : n;
}

export function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  const [minF, hourF, domF, monthF, dowF] = parts;
  const p = parseCron(expr);

  const allMin = p.minute.length === 60;
  const allHour = p.hour.length === 24;
  const allMonth = p.month.length === 12;
  const minStep = stepOf(minF);
  const hourStep = stepOf(hourF);

  // ---- time clause ----
  let when: string;

  if (allMin && allHour) {
    when = "every minute";
  } else if (minStep !== null && allHour) {
    when = minStep === 1 ? "every minute" : `every ${minStep} minutes`;
  } else if (allMin && hourStep !== null) {
    when = `every minute, every ${hourStep} hours`;
  } else if (minStep !== null && hourStep !== null) {
    when = `every ${minStep} minutes, every ${hourStep} hours`;
  } else if (minStep !== null) {
    const hrs = fmtRange(p.hour, (h) => pad2(h) + ":xx");
    when = `every ${minStep} minutes past ${hrs}`;
  } else if (allMin) {
    const hrs = fmtRange(p.hour, (h) => `${pad2(h)}:00`);
    when = `every minute from ${hrs}`;
  } else if (allHour) {
    // Specific minute(s), every hour — e.g. "0 * * * *" → "every hour"
    if (p.minute.length === 1 && p.minute[0] === 0) {
      when = "every hour";
    } else if (p.minute.length === 1) {
      when = `every hour at :${pad2(p.minute[0])}`;
    } else {
      when = `every hour at ${fmtList(p.minute.map((m) => ":" + pad2(m)))}`;
    }
  } else {
    // Enumerate specific times
    const times: string[] = [];
    for (const h of p.hour) {
      for (const m of p.minute) {
        times.push(fmtTime(h, m));
      }
    }
    when = times.length === 1 ? `at ${times[0]}` : `at ${fmtList(times)}`;
  }

  // ---- day clause ----
  let dayClause = "";
  if (!domF.startsWith("*") && dowF === "*") {
    dayClause = `, on the ${fmtRange(p.dom, (d) => ORDINALS[d - 1])} of each month`;
  } else if (domF === "*" && !dowF.startsWith("*")) {
    dayClause = `, ${fmtRange(p.dow, (d) => DOW_LONG[d])}`;
  } else if (!domF.startsWith("*") && !dowF.startsWith("*")) {
    const d1 = fmtRange(p.dom, (d) => ORDINALS[d - 1]);
    const d2 = fmtRange(p.dow, (d) => DOW_LONG[d]);
    dayClause = `, on the ${d1} of the month or ${d2}`;
  }

  // ---- month clause ----
  let monthClause = "";
  if (!allMonth) {
    monthClause = `, in ${fmtRange(p.month, (m) => MONTH_LONG[m - 1])}`;
  }

  const text = when + dayClause + monthClause;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
