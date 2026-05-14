#!/usr/bin/env tsx
/**
 * Promote a labeled dev-gate trace from a panel-review run into the
 * `panel-review-labeled` Dataset in braintrust. This is what makes real-run
 * data show up in evals: the dataset is what `precision.eval.ts` reads.
 *
 * Reads the JSONL trace file produced by a /panel-review run, finds the
 * dev-gate trace, checks the labeling predicate (at least one confirmed OR
 * at least one rejected finding), and if labeled, inserts a Dataset record.
 *
 * The Dataset record uses the PR's head SHA + skill version + repo as the
 * record id, so re-running on the same commit upserts rather than duplicates.
 *
 * Behavior with BRAINTRUST_API_KEY unset: silent no-op (matches the same
 * convention as logTrace and flush-traces).
 *
 * Privacy: this script prints only aggregate counts. Never trace content.
 * See CLAUDE.md ("Privacy: CI stdout is public, braintrust is private").
 *
 * Usage: npm run promote-to-dataset -- /tmp/claude/panel-review-traces-pr-{N}.jsonl
 */

import { readFileSync, existsSync } from "node:fs";
import { initDataset, flush } from "braintrust";

const PROJECT_NAME = "fdet-panel-review";
const DATASET_NAME = "panel-review-labeled";

interface DevGateTrace {
  name: string;
  input: {
    polished_comment?: string;
    post_cull_findings?: Array<{
      id: string;
      severity: "blocker" | "question" | "nit";
      finding: string;
      suggestion?: string;
      location?: string;
    }>;
    culled_questions?: unknown[];
    culled_nits?: unknown[];
  };
  output: unknown;
  metadata?: {
    phase?: string;
    pr_number?: number;
    repo?: string;
    head_sha?: string;
    skill_version?: string;
    dev_decision?: {
      confirmed?: string[];
      rejected?: string[];
      dropped?: string[];
    };
  };
}

async function main(): Promise<void> {
  const jsonlPath = process.argv[2];
  if (!jsonlPath) {
    console.error("usage: tsx scripts/promote-to-dataset.ts <path-to-jsonl>");
    process.exit(1);
  }
  if (!existsSync(jsonlPath)) {
    console.error(`FAIL: jsonl file not found: ${jsonlPath}`);
    process.exit(1);
  }

  if (!process.env.BRAINTRUST_API_KEY) {
    console.log("BRAINTRUST_API_KEY not set; skipping dataset promotion (no-op).");
    return;
  }

  const lines = readFileSync(jsonlPath, "utf-8").split("\n").filter((l) => l.trim());
  const devGateTraces = lines
    .map((line) => {
      try {
        return JSON.parse(line) as DevGateTrace;
      } catch {
        return null;
      }
    })
    .filter((t): t is DevGateTrace => !!t && t.metadata?.phase === "dev-gate");

  if (devGateTraces.length === 0) {
    console.log("No dev-gate trace found in JSONL; nothing to promote.");
    return;
  }

  let promoted = 0;
  let skipped_unlabeled = 0;
  let skipped_no_findings = 0;

  const dataset = initDataset(PROJECT_NAME, { dataset: DATASET_NAME });

  for (const trace of devGateTraces) {
    const decision = trace.metadata?.dev_decision;
    const confirmedCount = decision?.confirmed?.length ?? 0;
    const rejectedCount = decision?.rejected?.length ?? 0;

    // Labeled predicate: at least one confirmed OR at least one rejected.
    if (confirmedCount + rejectedCount === 0) {
      skipped_unlabeled += 1;
      continue;
    }

    const findings = trace.input.post_cull_findings;
    if (!findings || findings.length === 0) {
      skipped_no_findings += 1;
      continue;
    }

    const { pr_number, repo, head_sha, skill_version } = trace.metadata ?? {};
    if (!pr_number || !repo || !head_sha || !skill_version) {
      skipped_no_findings += 1;
      continue;
    }

    // Stable id so reruns on the same commit upsert rather than duplicate.
    // `replaceAll` (not `replace`) so a multi-slash repo value can't silently
    // collide with another repo sharing the same prefix.
    const id = `${repo.replaceAll("/", "--")}-pr${pr_number}-${head_sha.slice(0, 12)}-v${skill_version}`;

    dataset.insert({
      id,
      input: { findings },
      expected: decision,
      metadata: {
        pr_number,
        repo,
        head_sha,
        skill_version,
        source: "real",
      },
      tags: ["real-run", `skill-v${skill_version}`],
    });
    promoted += 1;
  }

  await flush();

  // Aggregate counts only per CI privacy rule.
  console.log(
    `OK: promoted ${promoted} labeled trace(s); ${skipped_unlabeled} unlabeled, ${skipped_no_findings} missing fields skipped.`,
  );
}

main().catch((err: unknown) => {
  console.error(`FAIL: promote-to-dataset threw: ${(err as Error).message}`);
  process.exit(1);
});
