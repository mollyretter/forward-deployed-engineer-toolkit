---
skill: panel-review
runs_total: 0
runs_labeled: 0
last_updated_at: 2026-05-13
schema: forward-deployed-engineer-toolkit/eval-runs/v1
---

# panel-review eval run counter

A lightweight usage indicator. Tracks how many real `/panel-review` runs have completed against this repo. **Not the eval data source.** The actual precision math runs in braintrust via the `braintrustdata/eval-action` GitHub Action, which scores labeled traces and posts results to the PR.

## Fields

- `runs_total`: total panel-review runs to date (any verdict, posted or not, across all skill versions).
- `runs_labeled`: runs where the dev decision logged at least one confirmed OR at least one rejected finding (the run produced precision-math data, even if one side is empty). The OR predicate (not AND) is intentional: a run where the dev confirms 5 findings and rejects 0 is a valid precision datum (precision = 1.0) and should be in the dataset; excluding it would systematically skew the labeled dataset toward runs with at least one false positive.
- `last_updated_at`: ISO date of the most recent counter update.

## How the counter is incremented

The skill's SKILL.md describes the increment step in Phase 6. For every real run, the skill:

1. Reads this file's frontmatter.
2. Increments `runs_total` by 1.
3. If the dev_decision has at least one confirmed OR at least one rejected finding, increments `runs_labeled` by 1.
4. Updates `last_updated_at` to today's ISO date.
5. Writes the file back and commits it alongside the build log on the same PR branch.

## Per-version analysis

The skill version (currently `0.1.0`) lives in `skills/panel-review/SKILL.md` frontmatter. Every trace logged to braintrust includes `metadata.skill_version`. The eval-action and braintrust UI both filter and slice by that field, so per-version precision comparisons happen there, not here.

## CI behavior

`scripts/braintrust-smoke-test.ts` reads this file and prints `panel-review vX.Y.Z: N labeled, M total runs.` to CI logs. The braintrust eval-action workflow (`.github/workflows/braintrust-evals.yml`) runs the actual precision evals on every PR and posts results as a PR comment.

## Privacy

Counters only. Never trace content, never PR-specific data. Safe to commit publicly.
