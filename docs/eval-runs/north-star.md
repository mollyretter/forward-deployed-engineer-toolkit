---
skill: north-star
runs_total: 1
runs_drift: 0
last_updated_at: 2026-05-13
schema: forward-deployed-engineer-toolkit/eval-runs/v1
---

# north-star eval run counter

A lightweight usage indicator. Tracks how many real `/north-star` runs have completed against this repo. **Not the eval data source.** Real evals against north-star runs (if and when we add them) would live in `skills/north-star/evals/*.eval.ts` and run via the braintrust eval-action, scoring against the trace data sent to braintrust during each Phase 1-6 run.

## Fields

- `runs_total`: total north-star runs to date (fresh-start and drift mode combined). For FDET itself this counter starts at 1 to reflect Molly's own north-star lock that produced this toolkit's design opinions; subsequent runs increment from there. For other consumer repos, the counter starts at 0.
- `runs_drift`: subset of `runs_total` that were drift-mode reruns. Drift runs are surgery on an existing locked paragraph, structurally different from fresh-start runs.
- `last_updated_at`: ISO date of the most recent counter update.

## CI behavior

`scripts/braintrust-smoke-test.ts` reads this file and prints `north-star vX.Y.Z: N runs (M drift).` to CI logs. Informational only; never blocks the build. No precision math runs against north-star yet; that's a v0.2 question once we have something quantitative to grade.

## How the counter is incremented

The skill's SKILL.md describes the increment step at the end of Phase 6 (Lock). The skill reads this file's frontmatter, increments `runs_total` by 1, increments `runs_drift` by 1 if the run was drift mode, updates `last_updated_at`, writes the file back, and commits it alongside the build log artifact.

## CI behavior

`scripts/braintrust-smoke-test.ts` prints `north-star runs to date: X (Y drift)` to CI logs. north-star evals are not yet on the roadmap because the synthesis task is conversational and harder to grade automatically; this counter exists so we can see usage and decide later whether a synthesis eval is worth building.

## Privacy

Counters only. Never founder content, never paragraph text. Safe to commit publicly.
