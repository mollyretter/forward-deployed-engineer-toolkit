/**
 * Schema for the `north-star` skill's locked artifact.
 *
 * The artifact lives at `<project>/docs/00-north-star.md` with YAML frontmatter
 * conforming to this schema, plus a 3-to-5-sentence markdown paragraph body.
 *
 * Apps that consume the artifact (e.g. a web app's "/why" page) can import
 * `NorthStar`, `parseNorthStar`, and `validateNorthStar` to render or validate.
 *
 * Note on versioning: schema version (this file) is independent of skill version
 * (the SKILL.md `## Status` section). A skill may iterate (v0.2 → v0.3 → ...)
 * while continuing to produce the same v1 artifact shape. Schema versions only
 * increment when artifact frontmatter shape changes.
 *
 * Note on changelog: drift-mode runs add a `## Changelog` section to the
 * artifact body markdown. That changelog is intentionally NOT a structured
 * frontmatter field; it lives in body markdown only. If a downstream consumer
 * needs structured changelog access, add a `changelog` field here.
 */

import matter from "gray-matter";

export const NORTH_STAR_SCHEMA_VERSION =
  "forward-deployed-engineer-toolkit/north-star/v1" as const;

export interface NorthStar {
  /** Display name of the project, business, or pivot. */
  name: string;

  /** Founder's name(s). */
  founder: string;

  /** ISO date string (YYYY-MM-DD) when this version was locked. */
  locked_at: string;

  /** Version number. Increments on drift-mode re-runs. */
  version: number;

  /** Schema identifier. Always equals NORTH_STAR_SCHEMA_VERSION for v1 artifacts. */
  schema: typeof NORTH_STAR_SCHEMA_VERSION;

  /**
   * The locked paragraph (3-5 sentences) capturing what / why / for-whom,
   * the approach, and the philosophical posture.
   * Plain text; same content as the human-readable body below the frontmatter.
   */
  paragraph: string;
}

/**
 * Parse a 00-north-star.md file (frontmatter + body) into a typed NorthStar.
 *
 * Throws if:
 * - The markdown lacks YAML frontmatter
 * - The frontmatter doesn't validate against the NorthStar shape
 *
 * The body of the markdown (everything after the frontmatter) is intentionally
 * ignored by this parser; the canonical paragraph lives in `frontmatter.paragraph`,
 * which is duplicated for human-readability in the body.
 */
export function parseNorthStar(markdown: string): NorthStar {
  const { data, matter: rawFrontmatter } = matter(markdown);
  if (!rawFrontmatter || rawFrontmatter.length === 0) {
    throw new Error(
      "parseNorthStar: input has no YAML frontmatter; expected --- block at top of file",
    );
  }
  // YAML auto-parses unquoted YYYY-MM-DD as a Date. Normalize to an ISO date
  // string so consumers always see a string regardless of how the artifact's
  // frontmatter was written.
  if (data.locked_at instanceof Date) {
    data.locked_at = data.locked_at.toISOString().slice(0, 10);
  }
  if (!validateNorthStar(data)) {
    throw new Error(
      `parseNorthStar: frontmatter does not match NorthStar schema (version ${NORTH_STAR_SCHEMA_VERSION})`,
    );
  }
  return data;
}

/**
 * Type guard: does an unknown value conform to the NorthStar shape?
 *
 * For runtime validation in app code that doesn't already trust the source.
 * For schema-aware validation (e.g. with detailed error messages), wrap with `zod`
 * downstream.
 */
export function validateNorthStar(value: unknown): value is NorthStar {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Partial<NorthStar>;
  return (
    typeof v.name === "string" &&
    typeof v.founder === "string" &&
    typeof v.locked_at === "string" &&
    typeof v.version === "number" &&
    v.schema === NORTH_STAR_SCHEMA_VERSION &&
    typeof v.paragraph === "string"
  );
}
