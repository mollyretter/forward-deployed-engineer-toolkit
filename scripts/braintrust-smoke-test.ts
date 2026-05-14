#!/usr/bin/env tsx
/**
 * Smoke test for the braintrust integration, plus eval-activation gauge.
 *
 * Two parts run in sequence:
 *
 *   1. SDK smoke test. Initialize the braintrust SDK against the
 *      `fdet-panel-review` project, send one synthetic trace event, flush.
 *      Fails (exit 1) on any error. This is the wiring check.
 *
 *   2. Counter readout. Read each skill's eval-runs counter file at
 *      `docs/eval-runs/<skill>.md`, parse the frontmatter, print the activation
 *      status to stdout (informational only, never blocks the build). This is
 *      the gauge that surfaces dataset accumulation in CI logs.
 *
 * Run locally: BRAINTRUST_API_KEY=... npm run braintrust:smoke
 * Run in CI:   same, with the secret provided via GitHub Actions secrets.
 *
 * Privacy: prints only the smoke test status and aggregate counter values.
 * Never trace content, never PR-specific data. See CLAUDE.md
 * ("Privacy: CI stdout is public, braintrust is private").
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { logTrace, flushTraces, BRAINTRUST_PROJECT_NAME } from "../skills/panel-review/traces.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");

async function runSmokeTest(): Promise<void> {
  if (!process.env.BRAINTRUST_API_KEY) {
    console.error(
      "FAIL: BRAINTRUST_API_KEY is not set. Set it locally (e.g. in ~/.bashrc) " +
        "or as a GitHub Actions secret named BRAINTRUST_API_KEY before running this smoke test.",
    );
    process.exit(1);
  }

  const traceId = `smoke-test-${new Date().toISOString()}`;
  console.log(`Sending smoke trace to braintrust project "${BRAINTRUST_PROJECT_NAME}" (id: ${traceId})`);

  logTrace({
    name: "panel-review/smoke-test",
    input: { test: true, timestamp: traceId },
    output: { ok: true },
    metadata: {
      ci: process.env.GITHUB_ACTIONS === "true" ? "github-actions" : "local",
      trace_id: traceId,
    },
  });

  await flushTraces();
  console.log("OK: smoke trace sent and flushed.");
}

/**
 * Minimal frontmatter reader. Pulls non-quoted scalar values for known keys
 * and parses them as integers when possible. Does not handle multi-line YAML;
 * the eval-runs counter frontmatter is intentionally simple.
 */
function readCounterFile(path: string): Record<string, string | number> {
  const content = readFileSync(path, "utf-8");
  const lines = content.split("\n");
  if (lines[0] !== "---") {
    throw new Error(`counter file ${path} missing YAML frontmatter`);
  }
  const endIdx = lines.indexOf("---", 1);
  if (endIdx === -1) {
    throw new Error(`counter file ${path} has unterminated YAML frontmatter`);
  }
  const fm: Record<string, string | number> = {};
  for (const line of lines.slice(1, endIdx)) {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (!match) continue;
    const [, key, raw] = match;
    const trimmed = raw.trim().replace(/^["'](.*)["']$/, "$1");
    const n = Number(trimmed);
    fm[key] = Number.isInteger(n) && trimmed !== "" ? n : trimmed;
  }
  return fm;
}

function readSkillVersion(skillName: string): string | null {
  try {
    const content = readFileSync(
      join(REPO_ROOT, `skills/${skillName}/SKILL.md`),
      "utf-8",
    );
    const match = content.match(/^version:\s*(.+)$/m);
    if (!match) return null;
    return match[1].trim().replace(/^["'](.*)["']$/, "$1");
  } catch {
    return null;
  }
}

function asInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function reportCounters(): void {
  console.log("");
  console.log("Usage counters (precision math runs in braintrust via eval-action; see PR comments):");

  try {
    const fm = readCounterFile(join(REPO_ROOT, "docs/eval-runs/panel-review.md"));
    const version = readSkillVersion("panel-review") ?? "unknown";
    console.log(
      `  panel-review v${version}: ${asInt(fm.runs_labeled)} labeled, ${asInt(fm.runs_total)} total runs.`,
    );
  } catch (err) {
    console.log(`  panel-review: counter file unreadable (${(err as Error).message}); skipping.`);
  }

  try {
    const fm = readCounterFile(join(REPO_ROOT, "docs/eval-runs/north-star.md"));
    const version = readSkillVersion("north-star") ?? "unknown";
    console.log(
      `  north-star v${version}: ${asInt(fm.runs_total)} run(s) (${asInt(fm.runs_drift)} drift).`,
    );
  } catch (err) {
    console.log(`  north-star: counter file unreadable (${(err as Error).message}); skipping.`);
  }
}

async function main(): Promise<void> {
  await runSmokeTest();
  reportCounters();
}

main().catch((err: unknown) => {
  console.error(`FAIL: smoke test threw: ${(err as Error).message}`);
  process.exit(1);
});
