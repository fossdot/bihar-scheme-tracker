import { describe, expect, it } from "vitest";
import { ago, daysUntil, isStale, validityLabel, deadlineLabel, fmtDate } from "./dates";

const TODAY = "2026-06-28";

describe("daysUntil", () => {
  it("is negative in the past, positive in the future, 0 today", () => {
    expect(daysUntil("2026-06-20", TODAY)).toBe(-8);
    expect(daysUntil("2026-07-08", TODAY)).toBe(10);
    expect(daysUntil(TODAY, TODAY)).toBe(0);
  });

  it("returns null for bad/empty input", () => {
    expect(daysUntil(null, TODAY)).toBeNull();
    expect(daysUntil("not-a-date", TODAY)).toBeNull();
  });
});

describe("ago", () => {
  it("says 'today' for the same date", () => {
    expect(ago(TODAY, TODAY, "en")).toBe("today");
  });

  it("formats past and future spans compactly", () => {
    expect(ago("2026-06-20", TODAY, "en")).toBe("8 days ago");
    expect(ago("2026-07-08", TODAY, "en")).toBe("in 10 days");
    expect(ago("2025-06-28", TODAY, "en")).toBe("1 yr ago");
  });

  it("never emits a negative day across a short-month span (diff borrow regression)", () => {
    // 2026-01-30 → 2026-03-01 crosses February; the month-borrow must not go negative.
    expect(ago("2026-01-30", "2026-03-01", "en")).not.toMatch(/-/);
  });
});

describe("isStale", () => {
  it("is true only after ~1 year unverified", () => {
    expect(isStale("2026-01-01", TODAY)).toBe(false);
    expect(isStale("2024-01-01", TODAY)).toBe(true);
  });
});

describe("validityLabel / deadlineLabel", () => {
  it("validityLabel flags past vs future", () => {
    expect(validityLabel("2030-01-01", TODAY, "en")?.past).toBe(false);
    expect(validityLabel("2020-01-01", TODAY, "en")?.past).toBe(true);
  });

  it("deadlineLabel flags open vs closed", () => {
    expect(deadlineLabel("2030-01-01", TODAY, "en")?.open).toBe(true);
    expect(deadlineLabel("2020-01-01", TODAY, "en")?.open).toBe(false);
  });
});

describe("fmtDate", () => {
  it("renders ISO as DD-MM-YYYY (Indian convention)", () => {
    expect(fmtDate("2026-06-28")).toBe("28-06-2026");
    expect(fmtDate(null)).toBeNull();
  });
});
