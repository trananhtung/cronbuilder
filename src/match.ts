import { parseCron } from "./parse.js";
import { ParsedCron } from "./types.js";

function dayMatches(p: ParsedCron, dom: number, dow: number): boolean {
  if (!p.domStar && !p.dowStar) return p.dom.includes(dom) || p.dow.includes(dow);
  if (!p.domStar) return p.dom.includes(dom);
  if (!p.dowStar) return p.dow.includes(dow);
  return true;
}

export function matchesParsed(p: ParsedCron, date: Date): boolean {
  if (!p.minute.includes(date.getUTCMinutes())) return false;
  if (!p.hour.includes(date.getUTCHours())) return false;
  if (!p.month.includes(date.getUTCMonth() + 1)) return false;
  return dayMatches(p, date.getUTCDate(), date.getUTCDay());
}

export function matchesCron(expr: string, date: Date): boolean {
  return matchesParsed(parseCron(expr), date);
}
