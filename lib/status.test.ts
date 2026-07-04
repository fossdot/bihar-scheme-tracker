import { describe, expect, it } from "vitest";
import { STATUS_BUCKET, DEFAULT_BUCKETS, statusesForBuckets } from "./status";
import type { SchemeStatus } from "./types";

// The bucket mapping is load-bearing for the project's core promise: a regression here could
// silently start HIDING dormant/unknown schemes (CLAUDE.md — never hide potentially-live help).

describe("status buckets (CLAUDE.md taxonomy)", () => {
  it("maps each internal status to the documented bucket", () => {
    expect(STATUS_BUCKET).toEqual({
      active: "active",
      likely_active: "active",
      dormant: "possibly_active",
      unknown: "possibly_active",
      subsumed: "inactive",
      superseded: "inactive",
      lapsed: "inactive",
    });
  });

  it("default view = Active + Possibly active", () => {
    expect(DEFAULT_BUCKETS).toEqual(["active", "possibly_active"]);
  });

  it("default buckets resolve to exactly the four shown-by-default statuses", () => {
    expect(new Set(statusesForBuckets(DEFAULT_BUCKETS))).toEqual(
      new Set<SchemeStatus>(["active", "likely_active", "dormant", "unknown"])
    );
  });

  it("default buckets NEVER include the inactive trio", () => {
    const def = statusesForBuckets(DEFAULT_BUCKETS);
    for (const s of ["subsumed", "superseded", "lapsed"] as SchemeStatus[])
      expect(def).not.toContain(s);
  });

  it("possibly_active bucket = dormant + unknown", () => {
    expect(new Set(statusesForBuckets(["possibly_active"]))).toEqual(
      new Set<SchemeStatus>(["dormant", "unknown"])
    );
  });

  it("inactive bucket = subsumed + superseded + lapsed", () => {
    expect(new Set(statusesForBuckets(["inactive"]))).toEqual(
      new Set<SchemeStatus>(["subsumed", "superseded", "lapsed"])
    );
  });
});
