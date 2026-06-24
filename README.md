# cronbuilder

<!-- ALL-CONTRIBUTORS-BADGE:START --><!-- ALL-CONTRIBUTORS-BADGE:END -->
[![npm version](https://img.shields.io/npm/v/@billdaddy/cronbuilder.svg)](https://www.npmjs.com/package/@billdaddy/cronbuilder)
[![npm downloads](https://img.shields.io/npm/dm/@billdaddy/cronbuilder.svg)](https://www.npmjs.com/package/@billdaddy/cronbuilder)
[![CI](https://img.shields.io/github/actions/workflow/status/trananhtung/cronbuilder/ci.yml?branch=main)](https://github.com/trananhtung/cronbuilder/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Fluent cron expression builder, parser, validator, human-readable descriptions, and next-fire-date calculator — zero dependencies, TypeScript-first.**

```ts
import { CronExpression, describeCron, nextDates } from "@billdaddy/cronbuilder";

// Fluent builder
const expr = new CronExpression()
  .every(5).minutes()
  .onDays("MON", "FRI")
  .toString(); // "*/5 * * * 1,5"

// Human-readable description
describeCron("0 9 * * 1-5");     // "At 09:00, Monday through Friday"
describeCron("*/15 * * * *");    // "Every 15 minutes"
describeCron("0 0 1 * *");       // "At 00:00, on the 1st of each month"

// Next fire times (UTC)
const dates = nextDates("0 9 * * 1-5", 3, new Date("2026-06-24T23:00:00Z"));
// → Mon Jun 29 2026 09:00, Tue Jun 30 09:00, Wed Jul 01 09:00
```

## Why cronbuilder?

Every major backend ecosystem has a programmatic cron builder:
- **Java** — `CronScheduleBuilder` in Quartz Scheduler
- **Python** — `croniter` (fluent API, next-date calculation)
- **C#** — `NCrontab.CronExpression`
- **Ruby** — `fugit` (parse, next, describe)

The last npm package attempting this space — `cron-builder` (version 0.3.0) — was published in **2016** and never updated. Runtime schedulers like `croner` and `node-cron` run jobs but don't help you *build or explain* the cron string itself.

## Install

```bash
npm install @billdaddy/cronbuilder
```

## Usage

### CronExpression — fluent builder

```ts
import { CronExpression, Cron } from "@billdaddy/cronbuilder";

// Every 5 minutes
new CronExpression().every(5).minutes().toString(); // "*/5 * * * *"

// At 9 AM every weekday
new CronExpression().atHour(9).weekdays().toString(); // "0 9 * * 1,2,3,4,5"

// At 09:30 and 17:30, Mon–Fri
new CronExpression()
  .atMinute(30)
  .atHour(9, 17)
  .weekdays()
  .toString(); // "30 9,17 * * 1,2,3,4,5"

// Every 2 hours, weekdays only
Cron.every(2).hours().weekdays().toString(); // "0 */2 * * 1,2,3,4,5"

// On the 1st of every month at midnight
new CronExpression().atHour(0).onDayOfMonth(1).toString(); // "0 0 1 * *"

// January 1st at midnight
CronExpression.yearly("JAN", 1, 0, 0).toString(); // "0 0 1 1 *"

// Static presets
CronExpression.everyMinute();       // * * * * *
CronExpression.everyHour();         // 0 * * * *
CronExpression.daily(9, 30);        // 30 9 * * *
CronExpression.weekly("MON", 8);    // 0 8 * * 1
CronExpression.monthly(15, 9);      // 0 9 15 * *
CronExpression.yearly("JAN", 1);    // 0 0 1 1 *

// Describe / validate / next dates — all on the expression object
const c = CronExpression.daily(9);
c.describe();        // "At 09:00"
c.isValid();         // true
c.nextDate();        // next fire from now
c.nextDates(5);      // next 5 fires
c.matches(new Date()); // true/false
```

### parseCron / validateCron

```ts
import { parseCron, validateCron } from "@billdaddy/cronbuilder";

const p = parseCron("0 9 * * 1-5");
p.minute;    // [0]
p.hour;      // [9]
p.dow;       // [1, 2, 3, 4, 5]
p.domStar;   // true
p.dowStar;   // false

validateCron("0 9 * * 1-5"); // [] — no errors
validateCron("* * * *");     // ["Invalid cron expression: ..."]
```

### describeCron

Produces human-readable descriptions in English:

| Expression | Description |
|-----------|-------------|
| `* * * * *` | Every minute |
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour |
| `0 9 * * *` | At 09:00 |
| `30 9 * * *` | At 09:30 |
| `0 9,17 * * *` | At 09:00 and 17:00 |
| `0 9 * * 1-5` | At 09:00, Monday through Friday |
| `0 9 * * 1,5` | At 09:00, Monday and Friday |
| `0 0 15 * *` | At 00:00, on the 15th of each month |
| `0 0 1 1 *` | At 00:00, on the 1st of each month, in January |

```ts
import { describeCron } from "@billdaddy/cronbuilder";

describeCron("*/15 * * * *");   // "Every 15 minutes"
describeCron("0 9 * * MON-FRI"); // "At 09:00, Monday through Friday"
describeCron("0 0 1 JAN *");    // "At 00:00, on the 1st of each month, in January"
```

### nextDates / nextDate

All dates are in UTC. Pass `from` to control the starting point.

```ts
import { nextDates, nextDate } from "@billdaddy/cronbuilder";

// Next 3 fires of "every 5 minutes" after 10:00 UTC
const dates = nextDates("*/5 * * * *", 3, new Date("2026-06-24T10:00:00Z"));
// → [10:05, 10:10, 10:15]

// Next weekday morning
const d = nextDate("0 9 * * 1-5");
```

### matchesCron

Checks whether a given Date (in UTC) matches a cron expression.

```ts
import { matchesCron } from "@billdaddy/cronbuilder";

matchesCron("*/5 * * * *", new Date("2026-06-24T10:15:00Z")); // true
matchesCron("0 9 * * 1-5", new Date("2026-06-27T09:00:00Z")); // false (Saturday)
```

### CronPresets

```ts
import { CronPresets } from "@billdaddy/cronbuilder";

CronPresets.EVERY_MINUTE;   // "* * * * *"
CronPresets.EVERY_HOUR;     // "0 * * * *"
CronPresets.DAILY_MIDNIGHT; // "0 0 * * *"
CronPresets.DAILY_9AM;      // "0 9 * * *"
CronPresets.WEEKLY_SUNDAY;  // "0 0 * * 0"
CronPresets.MONTHLY_1ST;    // "0 0 1 * *"
CronPresets.YEARLY_JAN1;    // "0 0 1 1 *"
CronPresets.WEEKDAYS_9AM;   // "0 9 * * 1-5"
```

## CronExpression API

| Method | Returns | Description |
|--------|---------|-------------|
| `new CronExpression()` | `CronExpression` | Defaults to `* * * * *` |
| `.every(n).minutes()` | `CronExpression` | Every N minutes |
| `.every(n).hours()` | `CronExpression` | Every N hours |
| `.every(n).days()` | `CronExpression` | Every N days |
| `.atMinute(...m)` | `this` | Set minute field |
| `.atHour(...h)` | `this` | Set hour field (sets minute=0 if unset) |
| `.onDays(...days)` | `this` | Day-of-week by name or number |
| `.weekdays()` | `this` | Monday–Friday |
| `.weekends()` | `this` | Saturday–Sunday |
| `.onDayOfMonth(...d)` | `this` | Day(s) of month |
| `.inMonths(...m)` | `this` | Month(s) by name or number |
| `.toString()` | `string` | Cron expression string |
| `.describe()` | `string` | Human-readable description |
| `.isValid()` | `boolean` | Validates the expression |
| `.matches(date)` | `boolean` | Match against UTC date |
| `.nextDate(from?)` | `Date \| undefined` | Next fire time (UTC) |
| `.nextDates(n, from?)` | `Date[]` | Next N fire times (UTC) |
| `CronExpression.parse(expr)` | `CronExpression` | Parse existing expression |
| `CronExpression.daily(h?, m?)` | `CronExpression` | Daily at given time |
| `CronExpression.weekly(day, h?)` | `CronExpression` | Weekly on given day |
| `CronExpression.monthly(day, h?)` | `CronExpression` | Monthly on given day |
| `CronExpression.yearly(month, day?)` | `CronExpression` | Yearly on given date |

## Field formats

All standard cron field formats are supported:

| Format | Example | Meaning |
|--------|---------|---------|
| `*` | `* * * * *` | Every value |
| `N` | `0 9 * * *` | Specific value |
| `N-M` | `0 9-17 * * *` | Range |
| `*/N` | `*/5 * * * *` | Step over full range |
| `N-M/N` | `0 8-18/2 * * *` | Step over range |
| `N,M` | `0 9,17 * * *` | List |
| `NAME` | `0 9 * * MON` | Named day/month |

Named months: `JAN`–`DEC`. Named days: `SUN`, `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`. Day `7` is normalized to `0` (both mean Sunday).

**DOM/DOW interaction**: when both day-of-month and day-of-week are specified (neither is `*`), fire times are the **union** of both conditions — the standard POSIX cron behavior.

## Timezone

All date operations use UTC. To work in a local timezone, convert before passing to `nextDates`/`matchesCron` or convert the results using a timezone library.

## Contributors ✨

<!-- ALL-CONTRIBUTORS-LIST:START --><!-- ALL-CONTRIBUTORS-LIST:END -->

## License

MIT © [trananhtung](https://github.com/trananhtung)
