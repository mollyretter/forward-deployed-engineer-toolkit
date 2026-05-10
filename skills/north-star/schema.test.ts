import { describe, it, expect } from "vitest";
import {
  NORTH_STAR_SCHEMA_VERSION,
  type NorthStar,
  parseNorthStar,
  validateNorthStar,
} from "./schema";

const validNorthStar: NorthStar = {
  name: "Acme Project",
  founder: "Jane Doe",
  locked_at: "2026-05-10",
  version: 1,
  schema: NORTH_STAR_SCHEMA_VERSION,
  paragraph:
    "Acme Project is a thing for some people who want some outcome. The work is calm and considered. Nothing about it is awkward.",
};

const validMarkdown = `---
name: Acme Project
founder: Jane Doe
locked_at: 2026-05-10
version: 1
schema: forward-deployed-engineer-toolkit/north-star/v1
paragraph: |
  Acme Project is a thing for some people who want some outcome. The work is calm and considered. Nothing about it is awkward.
---

# Acme Project — North Star

Acme Project is a thing for some people who want some outcome. The work is calm and considered. Nothing about it is awkward.
`;

describe("NORTH_STAR_SCHEMA_VERSION", () => {
  it("matches the published v1 identifier", () => {
    expect(NORTH_STAR_SCHEMA_VERSION).toBe(
      "forward-deployed-engineer-toolkit/north-star/v1",
    );
  });
});

describe("validateNorthStar", () => {
  it("accepts a fully-shaped object", () => {
    expect(validateNorthStar(validNorthStar)).toBe(true);
  });

  it("rejects null", () => {
    expect(validateNorthStar(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(validateNorthStar(undefined)).toBe(false);
  });

  it("rejects non-objects", () => {
    expect(validateNorthStar("a string")).toBe(false);
    expect(validateNorthStar(42)).toBe(false);
    expect(validateNorthStar([])).toBe(false);
  });

  it("rejects when name is missing", () => {
    const { name: _name, ...rest } = validNorthStar;
    expect(validateNorthStar(rest)).toBe(false);
  });

  it("rejects when founder is missing", () => {
    const { founder: _founder, ...rest } = validNorthStar;
    expect(validateNorthStar(rest)).toBe(false);
  });

  it("rejects when locked_at is missing", () => {
    const { locked_at: _locked_at, ...rest } = validNorthStar;
    expect(validateNorthStar(rest)).toBe(false);
  });

  it("rejects when version is the wrong type", () => {
    expect(validateNorthStar({ ...validNorthStar, version: "1" })).toBe(false);
  });

  it("rejects when schema is the wrong identifier", () => {
    expect(
      validateNorthStar({ ...validNorthStar, schema: "some/other/v1" }),
    ).toBe(false);
  });

  it("rejects when paragraph is missing", () => {
    const { paragraph: _paragraph, ...rest } = validNorthStar;
    expect(validateNorthStar(rest)).toBe(false);
  });

  it("rejects when paragraph is the wrong type", () => {
    expect(validateNorthStar({ ...validNorthStar, paragraph: 123 })).toBe(false);
  });
});

describe("parseNorthStar", () => {
  it("parses a valid markdown file with frontmatter", () => {
    const result = parseNorthStar(validMarkdown);
    expect(result.name).toBe("Acme Project");
    expect(result.founder).toBe("Jane Doe");
    expect(result.locked_at).toBe("2026-05-10");
    expect(result.version).toBe(1);
    expect(result.schema).toBe(NORTH_STAR_SCHEMA_VERSION);
    expect(result.paragraph).toContain("Acme Project is a thing");
  });

  it("throws when there is no frontmatter", () => {
    expect(() => parseNorthStar("# just a markdown title\n\nno frontmatter here")).toThrow(
      /no YAML frontmatter/,
    );
  });

  it("throws when frontmatter is missing required fields", () => {
    const badMd = `---
name: Incomplete
---

# Incomplete

body
`;
    expect(() => parseNorthStar(badMd)).toThrow(/does not match NorthStar schema/);
  });

  it("throws when schema version is wrong", () => {
    const badMd = `---
name: Acme Project
founder: Jane Doe
locked_at: 2026-05-10
version: 1
schema: wrong/schema/v1
paragraph: |
  some paragraph
---

body
`;
    expect(() => parseNorthStar(badMd)).toThrow(/does not match NorthStar schema/);
  });
});
