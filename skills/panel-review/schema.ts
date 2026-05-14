/**
 * Schema for the `panel-review` skill's build-log artifact.
 *
 * The artifact lives at `<consumer-repo>/docs/build-logs/panel-review-pr-{N}.md`
 * with YAML frontmatter conforming to this schema, plus markdown body sections
 * for raw findings, the aggregated table, the Sonnet recheck, the polished
 * comment, the dev decision, and the Retro list.
 *
 * Downstream tools (eval pipelines, retrospective dashboards) can import
 * `ReviewLog`, `parseReviewLog`, and `validateReviewLog` to consume the log
 * programmatically.
 *
 * Note on versioning: schema version (this file) is independent of skill version
 * (the SKILL.md `## Status` section). A skill may iterate (v0.1 to v0.2 to ...)
 * while continuing to produce the same v1 build-log shape. Schema versions only
 * increment when artifact frontmatter shape changes.
 */

import matter from "gray-matter";

export const REVIEW_LOG_SCHEMA_VERSION =
  "forward-deployed-engineer-toolkit/panel-review/v1" as const;

export type ReviewVerdict =
  | "approved"
  | "changes_requested"
  | "comment_only"
  | "rejected";

const VERDICTS: readonly ReviewVerdict[] = [
  "approved",
  "changes_requested",
  "comment_only",
  "rejected",
];

export interface ReviewLog {
  /** Pull request number being reviewed. */
  pr_number: number;

  /** GitHub repo identifier in `owner/name` form (e.g. `mollyretter/forward-deployed-engineer-toolkit`). */
  repo: string;

  /** Git SHA of the PR's head commit at review time. Pinning the SHA matters because the PR can move. */
  head_sha: string;

  /** ISO date string (YYYY-MM-DD) when the review was conducted. */
  reviewed_at: string;

  /** What the dev decided after the gate. */
  verdict: ReviewVerdict;

  /** Whether the comment was actually posted to the PR. False if dev rejected, fork PR write-access failure, etc. */
  posted: boolean;

  /** Total tokens consumed across all agent calls in the run (fan-out + recheck/polish). Per-agent breakdown lives in body markdown. */
  total_tokens: number;

  /** Schema identifier. Always equals REVIEW_LOG_SCHEMA_VERSION for v1 artifacts. */
  schema: typeof REVIEW_LOG_SCHEMA_VERSION;
}

/**
 * Parse a panel-review-pr-{N}.md file (frontmatter + body) into a typed ReviewLog.
 *
 * Throws if:
 * - The markdown lacks YAML frontmatter
 * - The frontmatter doesn't validate against the ReviewLog shape
 *
 * The body of the markdown (raw findings, aggregated table, recheck, comment,
 * dev decision, retro) is intentionally ignored by this parser; it lives in
 * markdown only and is intended for human reading. Structured access to those
 * sections would require a v2 schema.
 */
export function parseReviewLog(markdown: string): ReviewLog {
  const { data } = matter(markdown);
  // Check `data` rather than the `matter` field: gray-matter caches by input
  // and returns a shallow copy on repeat calls, which loses non-enumerable
  // fields (including `matter`). Object.keys length is robust against that.
  if (Object.keys(data).length === 0) {
    throw new Error(
      "parseReviewLog: input has no YAML frontmatter; expected --- block at top of file",
    );
  }
  // YAML auto-parses unquoted YYYY-MM-DD as a Date. Normalize to an ISO date
  // string so consumers always see a string regardless of how the artifact's
  // frontmatter was written.
  if (data.reviewed_at instanceof Date) {
    data.reviewed_at = data.reviewed_at.toISOString().slice(0, 10);
  }
  if (!validateReviewLog(data)) {
    throw new Error(
      `parseReviewLog: frontmatter does not match ReviewLog schema (version ${REVIEW_LOG_SCHEMA_VERSION})`,
    );
  }
  return data;
}

/**
 * Type guard: does an unknown value conform to the ReviewLog shape?
 *
 * For runtime validation in tools that don't already trust the source. For
 * schema-aware validation with detailed error messages, wrap with `zod`
 * downstream.
 */
const REPO_RE = /^[\w.-]+\/[\w.-]+$/;
const HEAD_SHA_RE = /^[0-9a-f]{7,40}$/i;
const REVIEWED_AT_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateReviewLog(value: unknown): value is ReviewLog {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Partial<ReviewLog>;
  return (
    typeof v.pr_number === "number" &&
    Number.isInteger(v.pr_number) &&
    v.pr_number > 0 &&
    typeof v.repo === "string" &&
    REPO_RE.test(v.repo) &&
    typeof v.head_sha === "string" &&
    HEAD_SHA_RE.test(v.head_sha) &&
    typeof v.reviewed_at === "string" &&
    REVIEWED_AT_RE.test(v.reviewed_at) &&
    typeof v.verdict === "string" &&
    VERDICTS.includes(v.verdict as ReviewVerdict) &&
    typeof v.posted === "boolean" &&
    typeof v.total_tokens === "number" &&
    Number.isFinite(v.total_tokens) &&
    v.total_tokens >= 0 &&
    v.schema === REVIEW_LOG_SCHEMA_VERSION
  );
}
