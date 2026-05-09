/**
 * Schema for the `north-star` skill's locked artifact.
 *
 * The artifact lives at `<project>/docs/00-north-star.md` with YAML frontmatter
 * conforming to this schema, plus a 3-5 sentence markdown paragraph body.
 *
 * Apps that consume the artifact (e.g. a web app's "/why" page) can import
 * `NorthStar` and `parseNorthStar` to render or validate.
 */

export const NORTH_STAR_SCHEMA_VERSION =
  "forward-deployed-engineer-toolkit/north-star/v1" as const;

export interface NorthStar {
  /** Display name of the project, business, or pivot. */
  name: string;

  /** Founder's name(s). */
  founder: string;

  /** ISO date string (YYYY-MM-DD) when this version was locked. */
  locked_at: string;

  /** Version number. Increments on drift re-runs. */
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
 * Parse a 00-north-star.md file (frontmatter + body) into a typed NorthStar object.
 *
 * Implementation note: this stub validates the type shape but does not yet
 * parse YAML. Wire up `gray-matter` or `yaml` when the package is built out
 * for downstream app consumption.
 */
export function parseNorthStar(_markdown: string): NorthStar {
  throw new Error(
    "parseNorthStar is a stub. Implement with `gray-matter` or `yaml` when consuming this artifact in an app.",
  );
}

/**
 * Validate a parsed object conforms to the NorthStar shape.
 *
 * Stub for now; wire to `zod` when this package is published to npm.
 */
export function validateNorthStar(value: unknown): value is NorthStar {
  if (!value || typeof value !== "object") return false;
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
