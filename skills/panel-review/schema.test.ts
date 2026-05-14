import { describe, it, expect } from "vitest";
import {
  REVIEW_LOG_SCHEMA_VERSION,
  type ReviewLog,
  parseReviewLog,
  validateReviewLog,
} from "./schema";

const validReviewLog: ReviewLog = {
  pr_number: 5,
  repo: "mollyretter/forward-deployed-engineer-toolkit",
  head_sha: "abc123def456",
  reviewed_at: "2026-05-10",
  verdict: "approved",
  posted: true,
  total_tokens: 11500,
  schema: REVIEW_LOG_SCHEMA_VERSION,
};

const validMarkdown = `---
pr_number: 5
repo: mollyretter/forward-deployed-engineer-toolkit
head_sha: abc123def456
reviewed_at: 2026-05-10
verdict: approved
posted: true
total_tokens: 11500
schema: forward-deployed-engineer-toolkit/panel-review/v1
---

# PR #5 panel review

(body content here)
`;

describe("REVIEW_LOG_SCHEMA_VERSION", () => {
  it("matches the published v1 identifier", () => {
    expect(REVIEW_LOG_SCHEMA_VERSION).toBe(
      "forward-deployed-engineer-toolkit/panel-review/v1",
    );
  });
});

describe("validateReviewLog", () => {
  it("accepts a fully-shaped object", () => {
    expect(validateReviewLog(validReviewLog)).toBe(true);
  });

  it("rejects null", () => {
    expect(validateReviewLog(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(validateReviewLog(undefined)).toBe(false);
  });

  it("rejects non-objects", () => {
    expect(validateReviewLog("a string")).toBe(false);
    expect(validateReviewLog(42)).toBe(false);
    expect(validateReviewLog([])).toBe(false);
  });

  it("rejects when pr_number is missing", () => {
    const { pr_number: _pr_number, ...rest } = validReviewLog;
    expect(validateReviewLog(rest)).toBe(false);
  });

  it("rejects when pr_number is non-positive or non-integer", () => {
    expect(validateReviewLog({ ...validReviewLog, pr_number: 0 })).toBe(false);
    expect(validateReviewLog({ ...validReviewLog, pr_number: -1 })).toBe(false);
    expect(validateReviewLog({ ...validReviewLog, pr_number: 1.5 })).toBe(false);
  });

  it("rejects when repo is missing or malformed", () => {
    const { repo: _repo, ...rest } = validReviewLog;
    expect(validateReviewLog(rest)).toBe(false);
    // No slash.
    expect(validateReviewLog({ ...validReviewLog, repo: "no-slash" })).toBe(false);
    // Empty owner or name.
    expect(validateReviewLog({ ...validReviewLog, repo: "/foo" })).toBe(false);
    expect(validateReviewLog({ ...validReviewLog, repo: "foo/" })).toBe(false);
    // More than one slash.
    expect(validateReviewLog({ ...validReviewLog, repo: "a/b/c" })).toBe(false);
  });

  it("rejects when head_sha is missing, empty, or non-hex", () => {
    const { head_sha: _head_sha, ...rest } = validReviewLog;
    expect(validateReviewLog(rest)).toBe(false);
    expect(validateReviewLog({ ...validReviewLog, head_sha: "" })).toBe(false);
    // Too short.
    expect(validateReviewLog({ ...validReviewLog, head_sha: "abc" })).toBe(false);
    // Non-hex characters.
    expect(validateReviewLog({ ...validReviewLog, head_sha: "ghijklmnopqr" })).toBe(false);
    // Too long.
    expect(
      validateReviewLog({ ...validReviewLog, head_sha: "a".repeat(41) }),
    ).toBe(false);
    // Mixed case hex is accepted (gh CLI sometimes emits uppercase).
    expect(
      validateReviewLog({ ...validReviewLog, head_sha: "ABCDEF1234567890" }),
    ).toBe(true);
  });

  it("rejects when reviewed_at is missing or not YYYY-MM-DD", () => {
    const { reviewed_at: _reviewed_at, ...rest } = validReviewLog;
    expect(validateReviewLog(rest)).toBe(false);
    expect(validateReviewLog({ ...validReviewLog, reviewed_at: "not-a-date" })).toBe(false);
    expect(validateReviewLog({ ...validReviewLog, reviewed_at: "2026/05/10" })).toBe(false);
    expect(validateReviewLog({ ...validReviewLog, reviewed_at: "2026-5-10" })).toBe(false);
    expect(validateReviewLog({ ...validReviewLog, reviewed_at: "" })).toBe(false);
  });

  it("rejects when verdict is not in the allowed set", () => {
    expect(validateReviewLog({ ...validReviewLog, verdict: "merged" })).toBe(false);
    expect(validateReviewLog({ ...validReviewLog, verdict: "" })).toBe(false);
  });

  it("accepts each allowed verdict", () => {
    for (const v of ["approved", "changes_requested", "comment_only", "rejected"] as const) {
      expect(validateReviewLog({ ...validReviewLog, verdict: v })).toBe(true);
    }
  });

  it("rejects when posted is not a boolean", () => {
    expect(validateReviewLog({ ...validReviewLog, posted: "true" })).toBe(false);
    expect(validateReviewLog({ ...validReviewLog, posted: 1 })).toBe(false);
  });

  it("rejects when total_tokens is missing or invalid", () => {
    const { total_tokens: _total_tokens, ...rest } = validReviewLog;
    expect(validateReviewLog(rest)).toBe(false);
    expect(validateReviewLog({ ...validReviewLog, total_tokens: -5 })).toBe(false);
    expect(validateReviewLog({ ...validReviewLog, total_tokens: NaN })).toBe(false);
    expect(validateReviewLog({ ...validReviewLog, total_tokens: "1000" })).toBe(false);
  });

  it("accepts total_tokens of zero", () => {
    expect(validateReviewLog({ ...validReviewLog, total_tokens: 0 })).toBe(true);
  });

  it("rejects when schema is the wrong identifier", () => {
    expect(
      validateReviewLog({ ...validReviewLog, schema: "some/other/v1" }),
    ).toBe(false);
  });
});

describe("parseReviewLog", () => {
  it("parses a valid markdown file with frontmatter", () => {
    const result = parseReviewLog(validMarkdown);
    expect(result.pr_number).toBe(5);
    expect(result.repo).toBe("mollyretter/forward-deployed-engineer-toolkit");
    expect(result.head_sha).toBe("abc123def456");
    expect(result.reviewed_at).toBe("2026-05-10");
    expect(result.verdict).toBe("approved");
    expect(result.posted).toBe(true);
    expect(result.total_tokens).toBe(11500);
    expect(result.schema).toBe(REVIEW_LOG_SCHEMA_VERSION);
  });

  it("normalizes a YAML-parsed Date in reviewed_at to an ISO date string", () => {
    // YAML auto-parses unquoted YYYY-MM-DD as a Date object; the parser must
    // normalize it back to a string so consumers always see a string.
    const result = parseReviewLog(validMarkdown);
    expect(typeof result.reviewed_at).toBe("string");
    expect(result.reviewed_at).toBe("2026-05-10");
  });

  it("throws when there is no frontmatter", () => {
    expect(() => parseReviewLog("# just a markdown title\n\nno frontmatter here")).toThrow(
      /no YAML frontmatter/,
    );
  });

  it("throws when frontmatter is missing required fields", () => {
    const badMd = `---
pr_number: 5
---

# Incomplete

body
`;
    expect(() => parseReviewLog(badMd)).toThrow(/does not match ReviewLog schema/);
  });

  it("throws when schema version is wrong", () => {
    const badMd = `---
pr_number: 5
repo: mollyretter/forward-deployed-engineer-toolkit
head_sha: abc123
reviewed_at: 2026-05-10
verdict: approved
posted: true
total_tokens: 1000
schema: wrong/schema/v1
---

body
`;
    expect(() => parseReviewLog(badMd)).toThrow(/does not match ReviewLog schema/);
  });
});
