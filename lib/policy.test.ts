import { describe, expect, it } from "vitest";
import { policyStatusKey, policyBucket } from "./policy";

// Policy display status is DERIVED, never asserted (CLAUDE.md). These pin the derivation so a
// stored-status assertion can never sneak back into what citizens (or the API) see.

const base = { is_draft: false, superseded_by: null, period_end: null, consultation_end: null };
const TODAY = "2026-06-28";

describe("policyStatusKey", () => {
  it("superseded_by wins over every other signal", () => {
    expect(policyStatusKey({ ...base, superseded_by: "x", is_draft: true }, TODAY)).toBe("superseded");
  });

  it("draft past its consultation deadline → draft_closed", () => {
    expect(policyStatusKey({ ...base, is_draft: true, consultation_end: "2026-01-01" }, TODAY)).toBe("draft_closed");
  });

  it("draft with a future deadline → open", () => {
    expect(policyStatusKey({ ...base, is_draft: true, consultation_end: "2026-12-31" }, TODAY)).toBe("open");
  });

  it("draft with no stated deadline → open (verify at source)", () => {
    expect(policyStatusKey({ ...base, is_draft: true }, TODAY)).toBe("open");
  });

  it("non-draft past its validity window → lapsed", () => {
    expect(policyStatusKey({ ...base, period_end: "2020-01-01" }, TODAY)).toBe("lapsed");
  });

  it("non-draft within validity (or no end) → in_force", () => {
    expect(policyStatusKey(base, TODAY)).toBe("in_force");
    expect(policyStatusKey({ ...base, period_end: "2030-01-01" }, TODAY)).toBe("in_force");
  });
});

describe("policyBucket", () => {
  it("collapses keys to the coarse catalogue buckets", () => {
    expect(policyBucket("open")).toBe("open");
    expect(policyBucket("in_force")).toBe("in_force");
    expect(policyBucket("draft_closed")).toBe("past");
    expect(policyBucket("lapsed")).toBe("past");
    expect(policyBucket("superseded")).toBe("past");
  });
});
