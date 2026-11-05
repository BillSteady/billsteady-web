import { describe, expect, it } from "vitest";
import { todayIso } from "./date";

describe("todayIso", () => {
  it("reads the local calendar date, not the UTC one", () => {
    // `new Date(y, m, d, h, ...)` always constructs from local time
    // components, so this is deterministic regardless of the machine's
    // timezone - it pins todayIso() to local getFullYear/getMonth/getDate,
    // not `new Date().toISOString()` (which reads the UTC date and silently
    // reports "tomorrow" for part of the day in any timezone west of UTC).
    expect(todayIso(new Date(2026, 10, 4, 23, 30))).toBe("2026-11-04");
  });

  it("pads single-digit months and days", () => {
    expect(todayIso(new Date(2026, 0, 5, 9, 0))).toBe("2026-01-05");
  });

  it("handles December 31st without rolling into next year", () => {
    expect(todayIso(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });
});
