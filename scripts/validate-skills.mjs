#!/usr/bin/env node
// Validates the shape of every skill under skills/.
//
// For each directory in skills/ (excluding names starting with _ or .):
// - SKILL.md exists and starts with YAML frontmatter
// - Frontmatter has `name` and `description` fields (non-empty strings)
// - `name` matches the directory name
// - `description` contains no em dashes (style preference)
// - sibling README.md exists
//
// Exits 0 on success, 1 if any skill fails. Designed to run in CI on PRs.

import { readdir, readFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");
const EM_DASH = "—";

const errors = [];
const recordError = (skill, msg) => errors.push(`  [${skill}] ${msg}`);

/**
 * Minimal YAML frontmatter parser. Handles single-line `key: value` pairs
 * (with optional surrounding quotes). Doesn't support multi-line literal
 * blocks; SKILL.md frontmatter is intentionally simple.
 */
function parseFrontmatter(content) {
  const lines = content.split("\n");
  if (lines[0] !== "---") return null;
  const endIdx = lines.indexOf("---", 1);
  if (endIdx === -1) return null;
  const result = {};
  for (const line of lines.slice(1, endIdx)) {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const trimmed = rawValue.trim();
    const unquoted = trimmed.replace(/^["'](.*)["']$/, "$1");
    result[key] = unquoted;
  }
  return result;
}

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function validateSkill(skillName) {
  const skillDir = join(SKILLS_DIR, skillName);
  const skillFile = join(skillDir, "SKILL.md");

  if (!(await fileExists(skillFile))) {
    recordError(skillName, "missing SKILL.md");
    return;
  }

  const content = await readFile(skillFile, "utf-8");
  const fm = parseFrontmatter(content);

  if (!fm) {
    recordError(skillName, "SKILL.md is missing YAML frontmatter (must start with --- on line 1)");
    return;
  }

  if (!fm.name || fm.name.trim() === "") {
    recordError(skillName, "SKILL.md frontmatter missing or empty 'name' field");
  } else if (fm.name !== skillName) {
    recordError(
      skillName,
      `SKILL.md 'name' is "${fm.name}" but directory is "${skillName}" (must match)`,
    );
  }

  if (!fm.description || fm.description.trim() === "") {
    recordError(skillName, "SKILL.md frontmatter missing or empty 'description' field");
  } else if (fm.description.includes(EM_DASH)) {
    recordError(
      skillName,
      "SKILL.md 'description' contains an em dash (\\u2014); use commas, semicolons, or periods instead",
    );
  }

  if (!(await fileExists(join(skillDir, "README.md")))) {
    recordError(skillName, "missing README.md");
  }
}

async function main() {
  let skillNames;
  try {
    const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
    skillNames = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((name) => !name.startsWith(".") && !name.startsWith("_"));
  } catch (err) {
    console.error(`Failed to read skills directory at ${SKILLS_DIR}: ${err.message}`);
    process.exit(1);
  }

  if (skillNames.length === 0) {
    console.log("No skills found in skills/. Nothing to validate.");
    process.exit(0);
  }

  await Promise.all(skillNames.map(validateSkill));

  if (errors.length > 0) {
    console.error(`\nSkill validation FAILED with ${errors.length} error(s):\n`);
    for (const err of errors) console.error(err);
    console.error("");
    process.exit(1);
  }

  console.log(`OK: validated ${skillNames.length} skill(s).`);
}

main().catch((err) => {
  console.error(`validate-skills crashed: ${err.message}`);
  process.exit(1);
});
