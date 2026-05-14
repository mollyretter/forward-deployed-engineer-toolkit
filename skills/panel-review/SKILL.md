---
name: panel-review
version: 0.1.0
description: Multi-agent panel review of a PR or current-branch diff. Three-model fan-out across Opus, Sonnet, and Haiku. Opus and Sonnet review for regressions, security issues, and bugs; Haiku reviews convention drift, naming, dead code, and comment quality. Discrete severity levels (nit, question, blocker). Sonnet confidence recheck plus draft polish merged into one pass. Dev approval gate before posting via gh pr review. Worktree-isolated. Build log committed to docs/build-logs/panel-review-pr-N.md.
---

# /panel-review — multi-agent code review with a dev approval gate

## When to use

Open a PR. Run `/panel-review <PR-number>` from inside the consumer repo to fan three model agents over the diff and produce a structured, dev-approved review comment plus a durable audit-trail build log.

No-arg invocation (`/panel-review`) reviews the current branch's diff vs `main`. Useful when you want a panel pass before opening a PR.

Skip for: trivial doc-only PRs (overhead exceeds value), out-of-band reviews where you just want a quick scan rather than a posted review.

## What it produces

Two artifacts:

1. **`<consumer-repo>/docs/build-logs/panel-review-pr-{N}.md`** — durable build log. PR metadata, all three agents' raw findings, the Sonnet confidence recheck adjustments, the polished comment, the dev decision, and a Retro section. Committed to the PR's head branch so it merges with the PR. If a review is rerun on the same PR, append `-{ISO-date}` to the filename rather than overwriting (e.g. `panel-review-pr-5-2026-05-10.md`).

2. **A posted PR review comment** via `gh pr review`, gated on explicit dev approval. One of two shapes only: an approve-with-summary (no blockers) or a request-changes-with-blockers. Questions and nits stay in the build log; they are not posted publicly by default.

## Hard rules

1. **Worktree on entry.** The skill creates an isolated worktree on a new branch off the PR's head, then runs `gh pr checkout {N}` inside it. Build log accumulates inside the worktree during the run and is committed to that branch before exit.

2. **3-agent fan-out, parallel.** Spawn Opus, Sonnet, Haiku in parallel via the Task / Agent tool. Wait for all three before synthesizing.

3. **Different prompts for the cheap model.** Opus and Sonnet share a prompt focused on regression risk, security issues, and bugs. Haiku gets a different prompt focused on convention drift, naming, dead code, comment quality, and "does the diff match the PR description." This split keeps Opus and Sonnet's context free of style nits and gives Haiku a scope it handles well.

4. **Discrete severity levels.** Each finding is `nit | question | blocker`. No numeric scoring; LLMs cluster at round numbers and anchor differently across calls. Severity is "how bad if true," not confidence.

5. **Auto-merge by max severity.** Dedupe findings by location and topic; the deduped finding's severity is the highest level any agent assigned it.

6. **Confidence and polish merged into one Sonnet pass.** After fan-out merge, a single fresh-context Sonnet does both:
   - For each `blocker`-level finding, verify it's real. False positives demote to `question`, with the demotion and Sonnet's reasoning recorded in the build log. Never silently dropped.
   - Format the final review comment for clarity, tone, contradictions, and mis-categorization. One agent, one pass, no authority conflict between confidence and polish.

7. **Dev approval gate before posting.** The polished comment is shown to the dev with three labeled sections (Confirmed blockers, Questions for you/author, Low priority / nits). Dev approves, edits, or rejects. Only on explicit approval does the skill invoke `gh pr review`.

8. **Never auto-posts.** No path through this skill posts to a PR without explicit dev approval. If the gate is unclear, default to not posting.

9. **Build log lives on the PR's branch.** Committed before the worktree is removed so the audit trail merges with the PR. Reruns get an ISO-date suffix.

10. **Retro items live in the build log.** After dev decisions are recorded, the skill writes a "Retro" section listing tests, doc notes, or lint rules the dev might want to add. After worktree cleanup, the skill prompts the dev: *"Want to tackle these now?"* Dev decides whether to act now or later. The skill ends here either way.

11. **Token usage is captured.** Every Agent call's `total_tokens` is recorded. The build log frontmatter has `total_tokens` (sum across all calls); the body has a `## Token usage` section with per-agent and per-phase breakdown. The retro prompt includes the total so the dev has cost context when deciding whether the review was worth it.

12. **Braintrust trace logging is env-var opt-in.** If `BRAINTRUST_API_KEY` is set, the skill logs the PR diff, agent prompts and responses, dev decisions, and the posted comment to the `fdet-panel-review` braintrust project via the SDK at `skills/panel-review/traces.ts`. Without the env var, all trace calls are silent no-ops. Logging failures degrade silently after a one-time stderr warning; they never block the skill's primary work. Nothing braintrust-related (API keys, traces, dataset exports) is committed to the public toolkit repo.

13. **Fork PRs may fail at post time.** `gh pr review` requires write access to the base repo. If the skill is run on a PR from a fork without write access, the post step will fail; the comment is preserved in the build log so it isn't lost.

14. **North-star pre-flight is mandatory but non-blocking.** Phase 0 always runs. Absence of `docs/00-north-star.md` produces a one-line dev warning and a flag in the build log header; presence loads the locked paragraph and forwards it to the fan-out agents as project-identity context. The skill never refuses to run on absence, since toolkits and libraries are legitimate consumers without a north-star.

15. **Privacy default: questions and nits go to chat and build log, not the public PR.** Public comments are one of two shapes only: an approve-with-summary (Shape A) or a request-changes-with-blockers (Shape B). Questions and nits ARE surfaced to the dev in chat for them to act on; they are simply not posted publicly by default. The dev may opt in to surfacing specific items in the public comment item by item. Rationale: most questions and nits surface as refactor preferences or "would be nicer if" observations whose public-PR placement adds noise without proportionate signal, but they remain useful internal working items for the dev.

16. **Phase 4 cull is the noise filter the run depends on.** Each agent under-grades fewer findings than it over-grades; without aggressive culling, the chat surface drowns the dev. The recheck Sonnet has explicit authority to drop questions and nits with a one-line reason. Dropped items live in the build log raw findings; they do not surface to chat. If the cull repeatedly drops items the dev would have wanted to see, that is a signal to refine the cull prompt, not to disable it.

17. **CI scripts must not echo trace content.** Any script under `scripts/` or workflow under `.github/workflows/` that touches braintrust data may print only aggregate numbers. Never PR diff content, agent responses, finding text, or dev decisions beyond aggregate counts. Repo is public, GitHub Actions logs are public, braintrust traces are private; the boundary between them is preserved by this rule. Canonical statement of the rule lives in `CLAUDE.md`; repeated here so future SKILL.md edits surface it to the agent during a run.

## The 3-agent panel

Spawned in parallel via the Task / Agent tool with explicit `model="<model>"`.

**Opus and Sonnet (same prompt):**

> You are reviewing the diff below for regression risk, security issues, and bugs. For each finding, return JSON: `{ severity, location, finding, suggestion }`.
>
> - `severity`: one of `nit | question | blocker`
> - `location`: `file:line` or `file:line-range`
> - `finding`: one sentence stating the problem
> - `suggestion`: one sentence stating the fix
>
> Severity rubric (apply the bar strictly; default to a lower tier when in doubt):
> - `blocker`: an ACTUAL bad bug. Will cause a crash, vulnerability, data loss, regression, or wrong production behavior. "Would page someone at 2am" severity.
> - `question`: you are genuinely unsure this is correct AND being wrong would change runtime behavior.
> - `nit`: small style, polish, or refactor suggestion. Doesn't change correctness or behavior.
>
> Do not flag stylistic preferences (em-dashes, hyphenated compounds, naming conventions, etc.).
> Do not flag hypothetical library or SDK behavior. Only flag if you can verify the issue from the diff content alone or from authoritative source you can cite. "If the SDK does X then this is wrong" is not a finding.
>
> Be concise. Do not include praise. Return the findings list and nothing else.

**Haiku (different prompt):**

> You are reviewing the diff below for: (a) convention drift from existing patterns in the repo, (b) naming clarity, (c) dead code, (d) comment quality, and (e) whether the diff matches the PR description.
>
> Return findings in the same JSON shape as the panel: `{ severity, location, finding, suggestion }`. Apply the same strict severity bar: `blocker` only if it would break a tool, check, or contract; `question` only if you are genuinely unsure AND wrong-ness would change behavior; `nit` for everything else, including refactor preferences and "would be nicer if" suggestions.
>
> Do not flag stylistic preferences (em-dashes, hyphenated compounds, naming conventions, etc.).
> Do not flag hypothetical library or SDK behavior. Only flag if you can verify the issue from the diff content alone or from authoritative source you can cite. "If the SDK does X then this is wrong" is not a finding.
>
> Be concise. Do not duplicate findings about regression risk, security, or bugs (those are covered by the panel). Return the findings list and nothing else.

## Phases

Seven phases. Build log populated throughout.

0. **North-star pre-flight.** Check for `<consumer-repo>/docs/00-north-star.md`. If present, parse it and load the locked paragraph for use as project-identity context in the fan-out prompts (agents can then flag drift from the project's stated identity). If absent, warn the dev once but proceed; the run is degraded but not blocked, since toolkits and libraries legitimately won't have one. Either outcome is recorded in the build log's pre-flight section.

1. **Setup.** Resolve target: PR number from arg, or current branch's diff vs main. Enter worktree, run `gh pr checkout {N}` inside it. Open the build log at `<consumer-repo>/docs/build-logs/panel-review-pr-{N}.md` and write the header (PR number, repo, head SHA, reviewed-at date, model panel, north-star presence).

2. **Fan-out.** Spawn three Agent calls in parallel. Pass each agent: the unified diff (`gh pr diff {N}`), the PR title and description, the locked north-star paragraph from Phase 0 (or a note that none was found), and the agent-specific prompt. Wait for all three. Append each agent's raw findings verbatim to the build log under labeled subsections.

   **Trace each agent — REQUIRED.** Immediately after each agent returns, run this single command (do NOT construct JSON inline; the wrapper validates the shape and catches missing fields before the run continues):
   ```bash
   npm run append-trace -- \
     --jsonl /tmp/claude/panel-review-traces-pr-{N}.jsonl \
     --name panel-review/fan-out/<model> \
     --input-file <path-to-input.json> \
     --output-file <path-to-output.json> \
     --metadata '{"phase":"fan-out","model":"<opus|sonnet|haiku>","pr_number":<N>,"repo":"<owner/name>","head_sha":"<sha>","total_tokens":<n>,"skill_version":"<version from this SKILL.md frontmatter>"}'
   ```
   Write the agent's input and output to temp JSON files first (the wrapper reads from disk to avoid CLI quoting issues on large payloads). Three fan-out agents = three append-trace calls. Skipping any of them means Phase 6 verification will fail.

3. **Aggregate.** Dedupe findings across the three agents by `(location, finding-keyword)`. For each deduped finding, record: which agents flagged it, the max severity, and the merged location/finding/suggestion. Append the merged list to the build log as a table.

4. **Confidence, cull, and polish (single Sonnet pass).** Spawn one fresh-context Sonnet via Agent (`model="sonnet"`). Pass it the merged findings list with severities and contributing-agent attribution. Its mandate has THREE parts:
   1. **Verify blockers.** For each `blocker`-severity finding, decide `confirmed` or `false-positive`. False positives are demoted to `question` and the demotion is recorded with reasoning. Never silently dropped.
   2. **Cull questions and nits.** This is the noise filter the run lives or dies on. Default toward dropping. Keep a `question` only if it asks a behavior-changing yes/no the dev can actually answer (not "is this style choice good?" but "is this code path correct?"). Keep a `nit` only if it suggests a specific actionable change worth doing on this PR (not "would be nicer if" speculation, not generic refactor advice). Dropped items stay in the build log raw findings but are marked as culled with a one-line reason; they do not surface to chat or to the public comment.
   3. **Write the polished comment** in Shape A or Shape B (see "Posted comment format"). Specific about what the agents actually probed in this run, not generic.
   Append the Sonnet output verbatim to the build log: the recheck decisions, the cull decisions with reasons, and the comment.

   The cull is aggressive on purpose. In the dogfood run that produced v0.1, agents under a looser rubric produced 11 non-blocker items; manual culling reduced this to ~5 real items. The recheck Sonnet's pre-cull pass is what makes the chat surface signal-dense rather than noise.

   **Trace the recheck — REQUIRED.** Run the append-trace wrapper after the recheck Sonnet returns:
   ```bash
   npm run append-trace -- \
     --jsonl /tmp/claude/panel-review-traces-pr-{N}.jsonl \
     --name panel-review/recheck-and-polish \
     --input-file <path-to-recheck-input.json> \
     --output-file <path-to-recheck-output.json> \
     --metadata '{"phase":"recheck","model":"sonnet","pr_number":<N>,"repo":"<owner/name>","head_sha":"<sha>","total_tokens":<n>,"skill_version":"<version>"}'
   ```

5. **Dev gate and post.** Show the dev:
   - The polished comment in either Shape A (approve) or Shape B (request changes), determined by whether any confirmed blockers remain after the recheck.
   - The recheck summary: how many blockers were confirmed vs demoted to questions.
   - The **culled** question and nit list (post-Phase-4 filtering).
   - The cull summary: how many items were dropped during Phase 4, with one-line reasons.

   **Per-question triage.** For each culled question, ask the dev: do you already know the answer (then resolve internally with a code change or doc note), do you want to ask the PR author publicly (then opt in to surfacing it in the public comment), or drop it? Questions are not just "things to surface"; they are decisions the dev makes about who should answer them.

   **Per-nit triage.** For each culled nit, ask the dev: fix now (apply in this PR before merge), defer (add to the build log as a `[ ]` todo for a follow-up PR), or drop?

   Dev approves, edits, or rejects the public comment after triage.
   - On approval with confirmed blockers (Shape B): `gh pr review {N} --request-changes --body-file <path-to-comment>`
   - On approval with no confirmed blockers (Shape A): `gh pr review {N} --comment --body-file <path-to-comment>`
   - On rejection: do not post; record the rejection in the build log with the dev's reason.
   Append the dev decision and the posted-or-rejected outcome to the build log. Add a "Retro" section listing candidate tests, doc notes, or lint rules. Add a "Token usage" section with the per-agent breakdown captured from each Agent call's `total_tokens`, plus a row for the recheck-and-polish pass and a Total row. Update the frontmatter `total_tokens` to the sum. Commit the build log to the PR's branch and push.

   **Trace the dev gate — REQUIRED.** This is the labeled trace; the `dev_decision` metadata in the trace is what makes it usable for evals. **Critical:** the `input.post_cull_findings` field must include the full post-cull findings list (each with `id`, `severity`, `finding`, `suggestion`, `location`). The eval scorers in `skills/panel-review/evals/precision.eval.ts` use this to look up each decision's severity. Build the input and metadata JSON files first, then run:
   ```bash
   npm run append-trace -- \
     --jsonl /tmp/claude/panel-review-traces-pr-{N}.jsonl \
     --name panel-review/dev-gate \
     --input-file <path-to-dev-gate-input.json> \
     --output-file <path-to-dev-gate-output.json> \
     --metadata '{"phase":"dev-gate","pr_number":<N>,"repo":"<owner/name>","head_sha":"<sha>","skill_version":"<version>","dev_decision":{"confirmed":[<finding-ids>],"rejected":[<finding-ids>],"dropped":[<finding-ids>]}}'
   ```
   The input file should contain `{"polished_comment":"<markdown>","post_cull_findings":[{"id":"F1","severity":"blocker","finding":"...","suggestion":"...","location":"file:line"}, ...],"culled_questions":[...],"culled_nits":[...]}`. The output file should contain `{"verdict":"approved|changes_requested|rejected","posted":true|false,"posted_comment":"<markdown>"}`. The labeled predicate (used by `promote-to-dataset`): `confirmed.length + rejected.length >= 1`. Any dev decision that exercises at least one side counts.

6. **Verify, flush, promote, counter, retro.** Run these in order:

   **PRE-FLIGHT VERIFICATION — REQUIRED.** Count the lines in `/tmp/claude/panel-review-traces-pr-{N}.jsonl`. The file must exist and contain exactly **5 lines**: 3 fan-out (opus, sonnet, haiku), 1 recheck-and-polish, 1 dev-gate. If the file is missing or has fewer than 5 lines, you skipped a trace in an earlier phase. ABORT this cleanup. Identify which trace is missing (by `metadata.phase` and `metadata.model`), reconstruct it using `npm run append-trace`, and re-run verification. Do not proceed to the flush step until the count is exactly 5.

   ```bash
   wc -l /tmp/claude/panel-review-traces-pr-{N}.jsonl
   # expected: 5 /tmp/claude/panel-review-traces-pr-{N}.jsonl
   ```

   a. **Flush traces to braintrust:** `npm run flush-traces -- /tmp/claude/panel-review-traces-pr-{N}.jsonl`. Sends all the JSONL traces to the braintrust project's Logs. No-op without `BRAINTRUST_API_KEY`.

   b. **Promote to dataset:** `npm run promote-to-dataset -- /tmp/claude/panel-review-traces-pr-{N}.jsonl`. Reads the dev-gate trace and, if labeled (`confirmed.length + rejected.length >= 1`), inserts a record into the `panel-review-labeled` Dataset. The record uses a stable id (`repo-prN-headsha-vversion`) so reruns upsert rather than duplicate. No-op without `BRAINTRUST_API_KEY`.

   c. **Increment usage counter:**
   - Read `<consumer-repo>/docs/eval-runs/panel-review.md`. If the file does not exist on this consumer repo, create it with `runs_total: 0` and `runs_labeled: 0`.
   - Increment `runs_total` by 1 unconditionally.
   - If the dev decision is labeled per the predicate above, increment `runs_labeled` by 1.
   - Set `last_updated_at` to today's ISO date.
   - Commit the updated counter file alongside the build log on the same PR branch.

   **The counter is a usage indicator, not the eval data source.** Precision per severity is computed by the `braintrustdata/eval-action` GitHub Action, which runs `skills/panel-review/evals/precision.eval.ts` on every PR. That eval reads (a) synthetic baseline fixtures and (b) the `panel-review-labeled` Dataset, scores both with per-severity precision scorers, and braintrust posts the result to the PR as a comment with regression detection vs prior runs.

   Then ExitWorktree (`action: "remove"`). Then prompt the dev: *"Review used {total_tokens} tokens. Retro items written to `panel-review-pr-{N}.md`. Want to tackle them now?"* Dev decides; the skill ends here either way.

## Versioning

The skill version is the `version` field in this file's YAML frontmatter (currently `0.1.0`). It is the single source of truth. The agent reads it at the start of each run and includes it in every `logTrace` metadata as `skill_version`. The posted PR comment footer also reads it (no hardcoded `v0.1` literal).

**When to bump the version:** when the agent's behavior changes in a way that invalidates prior labeled traces. Concretely:
- Bump on: agent prompt changes, severity rubric changes, phase structure changes, cull mandate changes, anything that meaningfully alters what the agents produce.
- Do not bump on: typo fixes, comment edits, README rewording, test additions that do not change skill behavior.

**Why version matters:** when SKILL.md changes meaningfully, the old labeled traces are evaluating a different system. Tagging every trace with `skill_version` lets future eval analysis filter by version. The counter in `docs/eval-runs/panel-review.md` stays cumulative (it does NOT reset on bump) because the counter is "total work done"; per-version slicing is a property of the traces themselves, not the counter.

**Reading the version at runtime (agent):** the `version` field in this file's frontmatter (the YAML block at the very top of this SKILL.md, currently `version: 0.1.0`) is already loaded into your context when Claude Code invokes the skill — you are reading it right now. Extract the literal value at the start of the run, hold it in working memory, and pass that string into every `logTrace` line's `metadata.skill_version` field and into the posted comment footer. Do NOT shell out to `grep '^version:' SKILL.md`: the agent's working directory during a run is the consumer repo, not the toolkit, and there is no `SKILL.md` to grep there. Reading from your in-context system prompt is the only reliable source.

## Trace logging

Every real run accumulates traces in a temporary JSONL file at `/tmp/claude/panel-review-traces-pr-{N}.jsonl`. One line per agent call (fan-out × 3 + recheck × 1) plus one line for the dev gate. At Phase 6 cleanup, `npm run flush-traces -- <path>` reads the file, calls `logTrace` for each line, and flushes the braintrust buffer. The JSONL file is preserved on disk (not deleted) so you can inspect what was sent if a flush fails or you need to debug. `/tmp/` is cleared on system reboot, so the files are ephemeral but inspectable until then.

**Shape of each JSONL line:**

```json
{
  "name": "panel-review/<phase>/<model-or-tag>",
  "input": { ... payload sent to the agent or function ... },
  "output": { ... payload returned ... },
  "metadata": {
    "phase": "fan-out | recheck | dev-gate",
    "model": "opus | sonnet | haiku",
    "pr_number": 5,
    "repo": "owner/name",
    "head_sha": "abc123...",
    "total_tokens": 4500,
    "dev_decision": { "confirmed": ["F1"], "rejected": ["F3"], "dropped": ["F7"] }
  }
}
```

The `dev_decision` field is the **label** that makes the trace usable for evals. It is present only on the `dev-gate` trace. The eval threshold counts traces whose `dev_decision.confirmed.length >= 1 AND dev_decision.rejected.length >= 1`.

**Privacy:** the JSONL file lives in `/tmp/`, never the repo. The flush script prints only aggregate counts to stdout per the CI privacy rule. Trace payloads flow only to the configured braintrust project (private). If `BRAINTRUST_API_KEY` is unset, `logTrace` no-ops and nothing leaves the machine.

## Severity rubric

| Level | Meaning | Where it shows up |
|-------|---------|-------------------|
| `blocker` | An ACTUAL bad bug. Will cause a crash, vulnerability, data loss, regression, or wrong production behavior. Reserve for the top of the severity scale (think "would page someone at 2am"). Style issues, naming, comment quality, em dashes, hypothetical edge cases, refactor preferences NEVER qualify, no matter how strongly the agent feels. | Public PR comment (Shape B, `--request-changes`), build log, chat |
| `question` | Genuinely unsure it's correct AND wrong-ness would change runtime behavior. Not for refactor preferences or style. | Chat (surfaced to dev for action), build log; NOT in public comment unless dev opts in |
| `nit` | Small style, polish, or refactor suggestion. Doesn't change correctness. Em dashes in agent-facing docs do not even qualify as nits; they are explicitly allowed (see CLAUDE.md). | Chat (surfaced to dev for action), build log; NOT in public comment unless dev opts in |

**Three exposure levels:**

1. **Build log** (always): every raw finding from every agent, the aggregated table, the recheck decisions, the polished comment, dev decision, retro. The full record.
2. **Chat / dev surface** (post-cull): the culled question + nit list the dev sees in-session so they can decide what to act on. Phase 4 (recheck and polish) is responsible for culling; see the Phase 4 mandate below.
3. **Public PR comment** (gated): blockers only by default. Dev may opt in per item to surface a specific question or nit publicly.

A finding's severity is **how bad it is if true**, not confidence. Confidence is handled in Phase 4 (the fresh-Sonnet recheck on `blocker`-level findings only).

**Why the strict question bar:** in the dogfood run that produced v0.1, agents under a looser rubric tagged refactor preferences (e.g. "use `ReturnType<typeof X>` instead of `Foo<true>`") as questions. That bucket became a noise bucket. The current bar is "genuinely unsure AND behavior-changing" so that questions stay a high-signal, dev-attention-worthy class.

## Posted comment format

The public PR comment is one of two shapes only. Questions and nits never appear in the public comment by default; they live in the build log unless the dev explicitly opts in to surfacing specific items.

### Shape A: approve (no outstanding blockers)

```markdown
## Panel review (3-agent fan-out)

**Verdict:** Looks good. No outstanding blockers.

### What we checked

- **Regression risk, security, bugs** (Opus and Sonnet, parallel): <one line per concrete area actually probed: e.g. error handling, async/promise correctness, lazy init state machines, schema validator edge cases>
- **Convention drift, naming, dead code, comment quality** (Haiku): <one line per concrete area actually probed>
- **Confidence and polish** (fresh-context Sonnet): blocker recheck and comment polish

### Summary

<one paragraph: how many blockers surfaced, how many fixed, how many false positives demoted, anything notable about the run>

Lower-severity items (questions, nits) are recorded in the build log for dev follow-up rather than posted here.

Build log: `docs/build-logs/panel-review-pr-{N}.md`

---
🤖 Sent by [Claude Code](https://claude.com/claude-code) via `panel-review` v{skill_version}.
```

### Shape B: request changes (one or more outstanding blockers)

```markdown
## Panel review (3-agent fan-out)

**Verdict:** Requesting changes. {N} confirmed blocker(s) outstanding.

### Confirmed blockers

- [`file.ts:42`] <finding>. <suggestion>.
- ...

### What we checked

- **Regression risk, security, bugs** (Opus and Sonnet, parallel): <concrete areas probed>
- **Convention drift, naming, dead code, comment quality** (Haiku): <concrete areas probed>
- **Confidence and polish** (fresh-context Sonnet): blocker recheck and comment polish

### Summary

<one paragraph contextualizing the blockers>

Lower-severity items (questions, nits) are recorded in the build log: `docs/build-logs/panel-review-pr-{N}.md`. Dev may opt in to surfacing specific items publicly.

---
🤖 Sent by [Claude Code](https://claude.com/claude-code) via `panel-review` v{skill_version}.
```

The "What we checked" section is required in both shapes and must be specific: list the concrete areas the agents actually probed in this run, not a generic restatement of the rubric. The dev gate (Phase 5) reviews this for accuracy before approval.

## Build log format

`<consumer-repo>/docs/build-logs/panel-review-pr-{N}.md`:

```markdown
---
pr_number: 5
repo: mollyretter/forward-deployed-engineer-toolkit
head_sha: <SHA>
reviewed_at: YYYY-MM-DD
verdict: approved | changes_requested | comment_only | rejected
posted: true | false
total_tokens: 11500
schema: forward-deployed-engineer-toolkit/panel-review/v1
---

# PR #5 panel review

## PR metadata

- Title: ...
- Author: ...
- Description: ...

## Panel findings (raw)

### Opus
...
### Sonnet
...
### Haiku
...

## Aggregated findings (deduped, max severity)

| ID | Severity | Location | Finding | Agents | Suggestion |
|----|----------|----------|---------|--------|------------|
| F1 | blocker | file.ts:42 | ... | Opus, Sonnet | ... |

## Confidence recheck (Sonnet)

- F1: confirmed
- F4: false-positive (demoted to question; reason: ...)

## Polished comment

<the markdown that was posted, verbatim>

## Dev decision

- Verdict: approved | edited | rejected
- Posted: true | false (reason if false: ...)

## Token usage

| Phase | Agent | Tokens |
|-------|-------|--------|
| Fan-out | Opus | 4500 |
| Fan-out | Sonnet | 4000 |
| Fan-out | Haiku | 1200 |
| Recheck + polish | Sonnet | 1800 |
| **Total** | | **11500** |

## Retro

- [ ] Add a test for the regression case caught in F1
- [ ] Note the convention from F3 in CLAUDE.md
- [ ] Consider a lint rule for F7
```

The TypeScript schema and parser for the build log frontmatter live at `forward-deployed-engineer-toolkit/skills/panel-review/schema.ts`. Downstream tools (eval pipelines, retrospective dashboards) can install the package via git URL and import directly.

## Status

v0.1 (draft). Designed and cross-model reviewed against the design plan; first dogfood run on FDET PR #1 surfaced the Phase 4 cull mandate and the three-exposure-level model. Open questions for v0.2:
- Dedupe heuristic robustness (does `(location, finding-keyword)` actually merge similar findings, or do we need fuzzier matching?)
- Sonnet confidence-recheck false-positive rate over multiple runs
- Retro-prompt usefulness
- **Verification on cull**: should Phase 4 include code-level verification of surviving questions/nits (run a test, check the actual behavior) rather than reasoning only? Hypothesis from the dogfood run: a verification step would have further demoted some questions to nits or dropped them entirely. Holding off until we have more runs to know if this is worth the complexity.
