#!/usr/bin/env tsx
/**
 * Append one trace event to a panel-review JSONL file. Designed to be the
 * agent's single entry point for trace logging during a /panel-review run, so
 * that skipping a trace is a missing-shell-command instead of a forgotten
 * inline JSON construction.
 *
 * Usage:
 *   npm run append-trace -- \
 *     --jsonl /tmp/claude/panel-review-traces-pr-5.jsonl \
 *     --name panel-review/fan-out/opus \
 *     --input-file /tmp/claude/opus-input.json \
 *     --output-file /tmp/claude/opus-output.json \
 *     --metadata '{"phase":"fan-out","model":"opus","pr_number":5,"repo":"owner/name","head_sha":"abc","total_tokens":4500,"skill_version":"0.1.0"}'
 *
 * The script validates the trace shape (required fields exist), serializes
 * exactly one JSONL line, and appends to the target file (creates parent
 * directories if needed). The atomic-append makes skipping detectable: if
 * Phase 6's verification step counts lines and expects N, a missing call
 * shows up as a missing line.
 *
 * Privacy: the script reads and writes local files only. It does not contact
 * braintrust; flush-traces.ts handles the upload. The aggregate-only stdout
 * rule still applies; this script prints `OK: appended <name>` and nothing
 * about the trace contents.
 */

import { readFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

interface Args {
  jsonl: string;
  name: string;
  input: unknown;
  output: unknown;
  metadata: Record<string, unknown>;
}

function parseArgs(argv: string[]): Args {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error(`Bad CLI form near "${key}". Expected --flag value pairs.`);
    }
    flags.set(key.slice(2), value);
  }

  const jsonl = flags.get("jsonl");
  const name = flags.get("name");
  if (!jsonl) throw new Error("Missing --jsonl <path>");
  if (!name) throw new Error("Missing --name <trace-name>");

  // Input: either --input-file <path> or --input-json '<json>'
  const inputFile = flags.get("input-file");
  const inputJson = flags.get("input-json");
  if (!inputFile && !inputJson) {
    throw new Error("Provide one of: --input-file <path> or --input-json '<json>'");
  }
  const input = inputFile ? JSON.parse(readFileSync(inputFile, "utf-8")) : JSON.parse(inputJson!);

  // Output: same shape choice
  const outputFile = flags.get("output-file");
  const outputJson = flags.get("output-json");
  if (!outputFile && !outputJson) {
    throw new Error("Provide one of: --output-file <path> or --output-json '<json>'");
  }
  const output = outputFile ? JSON.parse(readFileSync(outputFile, "utf-8")) : JSON.parse(outputJson!);

  // Metadata is always JSON inline (typically short and structured)
  const metadataRaw = flags.get("metadata");
  if (!metadataRaw) throw new Error("Missing --metadata '<json>'");
  const metadata = JSON.parse(metadataRaw);
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
    throw new Error("--metadata must be a JSON object");
  }

  return { jsonl, name, input, output, metadata };
}

function validate(args: Args): void {
  if (!args.name.startsWith("panel-review/") && !args.name.startsWith("north-star/")) {
    throw new Error(`Trace name "${args.name}" should start with "panel-review/" or "north-star/"`);
  }
  const md = args.metadata;
  if (typeof md.phase !== "string") {
    throw new Error("metadata.phase is required and must be a string");
  }
  if (typeof md.skill_version !== "string") {
    throw new Error("metadata.skill_version is required (extract from SKILL.md frontmatter)");
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  validate(args);

  const parent = dirname(args.jsonl);
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }

  const line = JSON.stringify({
    name: args.name,
    input: args.input,
    output: args.output,
    metadata: args.metadata,
  });
  appendFileSync(args.jsonl, line + "\n", "utf-8");

  // Aggregate-only stdout: name and target path; never trace content.
  console.log(`OK: appended ${args.name} to ${args.jsonl}`);
}

try {
  main();
} catch (err) {
  console.error(`FAIL: ${(err as Error).message}`);
  process.exit(1);
}
