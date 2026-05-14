#!/usr/bin/env tsx
/**
 * Flush a batch of skill traces to braintrust.
 *
 * Reads a JSONL file where each line is a `TraceInput`-shaped object
 * (see `skills/panel-review/traces.ts`). For each line, calls `logTrace`.
 * Flushes the braintrust buffer at the end.
 *
 * Designed to run at the end of a skill invocation (panel-review Phase 6
 * cleanup; north-star Phase 6 lock), batching all phase traces into a
 * single SDK flush.
 *
 * Behavior with `BRAINTRUST_API_KEY` unset: `logTrace` no-ops, no traces
 * are sent. The script still runs to completion.
 *
 * The JSONL file is NOT deleted after flush. It stays on disk (typically
 * under `/tmp/`) for debugging: if a flush fails or you want to inspect
 * exactly what was forwarded to braintrust, the source of truth is the
 * file. `/tmp/` is cleared on system reboot, so the files are ephemeral
 * but inspectable until then.
 *
 * Privacy: this script prints ONLY aggregate counts. Never trace content.
 * See `CLAUDE.md` ("Privacy: CI stdout is public, braintrust is private").
 *
 * Usage: npm run flush-traces -- /tmp/claude/panel-review-traces-pr-{N}.jsonl
 */

import { readFileSync, existsSync } from "node:fs";
import { logTrace, flushTraces, type TraceInput } from "../skills/panel-review/traces.ts";

async function main(): Promise<void> {
  const jsonlPath = process.argv[2];
  if (!jsonlPath) {
    console.error("usage: tsx scripts/flush-traces.ts <path-to-jsonl>");
    process.exit(1);
  }

  if (!existsSync(jsonlPath)) {
    console.error(`FAIL: jsonl file not found: ${jsonlPath}`);
    process.exit(1);
  }

  const content = readFileSync(jsonlPath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim().length > 0);

  let parsed = 0;
  let skipped = 0;
  for (const line of lines) {
    let trace: TraceInput;
    try {
      trace = JSON.parse(line) as TraceInput;
    } catch {
      skipped += 1;
      continue;
    }
    if (!trace.name || trace.input === undefined || trace.output === undefined) {
      skipped += 1;
      continue;
    }
    logTrace(trace);
    parsed += 1;
  }

  await flushTraces();

  // Aggregate counts only. Privacy rule: never echo trace content.
  // File is intentionally NOT deleted so it remains available for debugging.
  console.log(`OK: flushed ${parsed} trace(s); ${skipped} skipped. JSONL preserved at ${jsonlPath}.`);
}

main().catch((err: unknown) => {
  console.error(`FAIL: flush-traces threw: ${(err as Error).message}`);
  process.exit(1);
});
