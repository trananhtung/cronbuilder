import { ParsedCron, MONTH_MAP, DOW_MAP } from "./types.js";

function expandField(
  field: string,
  min: number,
  max: number,
  names?: Record<string, number>,
): number[] {
  const result = new Set<number>();

  for (const part of field.split(",")) {
    let normalized = part.toUpperCase();
    if (names) {
      for (const [name, val] of Object.entries(names)) {
        normalized = normalized.replace(new RegExp(`\\b${name}\\b`, "g"), String(val));
      }
    }

    let step = 1;
    let rangeStr = normalized;

    if (normalized.includes("/")) {
      const idx = normalized.lastIndexOf("/");
      rangeStr = normalized.slice(0, idx);
      step = parseInt(normalized.slice(idx + 1), 10);
      if (isNaN(step) || step < 1) throw new Error(`Invalid step in field: "${part}"`);
    }

    let lo: number, hi: number;
    if (rangeStr === "*") {
      lo = min; hi = max;
    } else if (rangeStr.includes("-")) {
      const [a, b] = rangeStr.split("-");
      lo = parseInt(a, 10); hi = parseInt(b, 10);
      if (isNaN(lo) || isNaN(hi)) throw new Error(`Invalid range in field: "${part}"`);
    } else {
      lo = hi = parseInt(rangeStr, 10);
      if (isNaN(lo)) throw new Error(`Invalid value in field: "${part}"`);
    }

    for (let i = lo; i <= hi; i += step) {
      const v = i === 7 && max === 6 ? 0 : i; // dow: 7 → 0 (Sunday)
      if (v >= min && v <= max) result.add(v);
    }
  }

  if (result.size === 0) throw new Error(`Empty field expansion for: "${field}"`);
  return [...result].sort((a, b) => a - b);
}

export function parseCron(expr: string): ParsedCron {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: expected 5 fields, got ${parts.length} in "${expr}"`);
  }

  const [minF, hourF, domF, monthF, dowF] = parts;

  const minute = expandField(minF, 0, 59);
  const hour = expandField(hourF, 0, 23);
  const dom = expandField(domF, 1, 31);
  const month = expandField(monthF, 1, 12, MONTH_MAP);
  const dow = expandField(dowF, 0, 6, DOW_MAP);

  return { minute, hour, dom, month, dow, domStar: domF === "*", dowStar: dowF === "*" };
}

export function validateCron(expr: string): string[] {
  try {
    parseCron(expr);
    return [];
  } catch (e) {
    return [(e as Error).message];
  }
}
