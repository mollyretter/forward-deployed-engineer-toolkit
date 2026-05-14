# `@forward-deployed-engineer-toolkit/panel-review`

> Multi-agent code review with a dev approval gate. Three model agents fan out on a PR diff, produce structured findings, a fresh-context Sonnet confidence-rechecks blockers and polishes the comment, dev approves before anything posts to the PR. Build log committed alongside the PR as a durable audit trail.

## What this skill does

Runs a structured panel review of a PR (or a current-branch diff) using three model agents in parallel:

- **Opus** and **Sonnet** review the diff for regressions, security issues, and bugs.
- **Haiku** reviews convention drift, naming clarity, dead code, comment quality, and whether the diff matches the PR description.

Each finding gets a discrete severity (`nit | question | blocker`). Findings are deduped across agents by location and topic, taking the highest severity any agent assigned. A fresh-context Sonnet then confidence-rechecks the `blocker`-severity findings (false positives demote to `question`, never silently drop) and polishes the final comment. The dev approves, edits, or rejects before anything is posted via `gh pr review`.

The point of the panel is robustness through perspective diversity. The point of the gate is that a dev always reads the comment before it goes on a PR.

## Output

Two artifacts:

1. **`<consumer-repo>/docs/build-logs/panel-review-pr-{N}.md`**: a durable build log with typed YAML frontmatter. Captures all three agents' raw findings, the aggregated and deduped findings table, the Sonnet confidence-recheck adjustments, the polished comment, the dev decision, and a Retro section for follow-up tests, doc notes, or lint rules. Committed to the PR's head branch so it merges with the PR.

2. **A posted PR review comment** via `gh pr review`, gated on dev approval. One of two shapes: an approve-with-summary if no blockers remain (posted as `--comment`), or a request-changes-with-blockers (posted as `--request-changes`). Questions and nits stay in the build log; they are not posted publicly by default.

## How to invoke

Inside Claude Code, run from the consumer repo root:

```
/panel-review 5
```

Or no-arg to review the current branch's diff vs `main` (useful before opening a PR):

```
/panel-review
```

The skill creates an isolated worktree, runs the panel inside it, and removes the worktree on completion.

## Hard rules (headlines; full text in SKILL.md)

1. Worktree on entry. Build log accumulates inside it during the run.
2. 3-agent fan-out, parallel.
3. Different prompts: Opus and Sonnet on regression/security/bugs; Haiku on convention/naming/dead-code/comment-quality.
4. Discrete severity levels (nit, question, blocker), no numeric scoring.
5. Auto-merge findings by max severity across agents.
6. Confidence recheck and draft polish merged into one fresh-Sonnet pass.
7. Dev approval gate before posting.
8. Never auto-posts to a PR.
9. Build log lives on the PR's branch and merges with the PR.
10. Retro items live in the build log; post-cleanup prompt asks the dev whether to act now.
11. Token usage captured per agent and per phase; total in frontmatter, breakdown in body, included in retro prompt for cost context.
12. Braintrust trace logging is env-var opt-in (project `fdet-panel-review`); failures degrade silently; nothing braintrust-related is committed.
13. Fork PRs may fail at post time (`gh pr review` requires write access); the comment is preserved in the build log so it isn't lost.
14. North-star pre-flight (Phase 0) loads `docs/00-north-star.md` if present and passes the locked paragraph as project-identity context to all 3 agents; absence is a warning, not a block.
15. Privacy default: questions and nits stay in the build log; public comments are either approve-with-summary or request-changes-with-blockers. Dev may opt in per item.

## Consuming the build log downstream

The schema and parser are exported from this package:

```typescript
import { parseReviewLog, type ReviewLog } from "@forward-deployed-engineer-toolkit/panel-review";
import { readFileSync } from "node:fs";

const log: ReviewLog = parseReviewLog(
  readFileSync("docs/build-logs/panel-review-pr-5.md", "utf-8"),
);
// log.pr_number, log.verdict, log.posted, log.head_sha, log.reviewed_at, log.repo
```

`parseReviewLog` throws on missing frontmatter or invalid shape. Use `validateReviewLog` for runtime validation when reading from sources you don't already trust.

The intended downstream consumers are eval pipelines (e.g. braintrust dataset builders that join build logs with dev decisions) and retrospective dashboards.

### Installing this package

Until published to npm, install via git URL:

```bash
npm install github:mollyretter/forward-deployed-engineer-toolkit
```

The package exports TypeScript directly (`schema.ts`); modern bundlers (Vite, Next.js, esbuild) consume it natively. No build step.

## Status

v0.1 (draft). Designed and cross-model reviewed against the design plan; not yet exercised in real-world use. The first dogfood run on FDET itself will surface refinements. Tracking-quality questions for that first run: dedupe heuristic robustness, false-positive rate of the Sonnet confidence recheck, usefulness of the retro prompt.
