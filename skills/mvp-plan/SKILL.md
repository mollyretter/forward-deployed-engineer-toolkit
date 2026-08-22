---
name: mvp-plan
version: 0.1.0
description: Turn a locked north star into a scoped, gated MVP plan. The riskiest assumption, the smallest product that tests it, numeric success metrics and kill criteria set by the founder, and phase gates that keep build work behind explicit approval. Runs after north-star locks; refuses to run without one.
---

# /mvp-plan — from locked identity to a scoped, gated MVP plan

## When to use

Immediately after `north-star` locks, before any design-system, mockup, architecture, or build work. Re-run only when the founder explicitly reopens scope (same one-way ratchet as north-star's drift rule).

Skip for: products without a locked north star (run `north-star` first — this skill refuses to proceed without `docs/00-north-star.md`), features on an existing product, pure technical decisions.

## What it produces

1. **`<project>/docs/002-mvp-plan.md`** — the MVP plan, whose spine is a CHECKLIST from idea to launch: every step as a checkbox — finalize features, market research, design guidance, actual design and screenshot approvals, architecture, build, money, launch — including steps already done at writing time (listed unchecked with a done-date annotation; the founder checks them off themselves when they review the list in the repo). Around the checklist: riskiest assumption, MVP scope in/out, success metrics and kill criteria in the founder's numbers, open-decisions table. Numbered-doc convention is inherited from the reference project — confirm the next free number in the target project's `docs/` folder rather than assuming `002` verbatim (the reference project reserved `001` for a still-undetermined doc between north-star and mvp-plan).
2. **`<project>/docs/build-logs/mvp-plan-v{N}.md`** — session record: founder's verbatim answers, draft evolution with rejection reasons, review findings and items acted on.
3. Counter increment in `<project>/docs/eval-runs/mvp-plan.md` (`runs_total`, and `runs_surgery` when Phase 1 detects surgery mode — mirrors north-star's `runs_total`/`runs_drift` split).

## Hard rules

1. **A locked north star is a precondition.** Read `docs/00-north-star.md` and the north-star build log's positioning context before the first question. If `docs/00-north-star.md` is missing, stop and say so. (North-star has no on-disk unlocked/draft state — the file's presence means it's locked.)
2. **The plan stays DRAFT until the founder flips it.** Writing the document is not approval. The header says DRAFT and names the founder as the only one who changes that. Never mark it approved yourself.
3. **Success metrics and kill criteria are the founder's numbers.** The skill may cite research-derived calibration ranges (with source) anywhere in the plan. It NEVER invents the founder's specific commit numbers for the success-metrics/kill-criteria section; those ship as labeled blanks until the founder gives them — blanks are honest, invented numbers are not.
4. **Kill criteria are written while emotionally neutral** — before build, before sunk cost. Present this as the reason the question is asked now, not later.
5. **Founder's verbatim language in the build log.** Same as north-star: quotes are quotes, summaries are marked as summaries. Ask consent before recording sensitive disclosures, and before fixing spelling in quoted text.
6. **No old rulings carried silently.** Decisions from prior plans or superseded products enter as inputs to re-decide at a named phase, never as standing authority.
7. **Review findings are triaged by the founder, never auto-applied.** Present a concise punch list; apply only what the founder picks.
8. **Cross-model review at lock is required** — a fan-out (Sonnet + Opus + Haiku) on the final draft with a must-fix-only mandate ("SHIP or FIX, don't relitigate settled style"); cap the punch list at 3 only when reviewers converge on 3 or fewer — surface all consensus must-fix items if there are more. Mid-flight single-model reviews are optional and founder-triggerable at any point.
9. **Every phase gate in the plan opens with a plain-language brief and the founder's explicit yes.** The plan encodes this; the skill models it in miniature by not handing off the draft until the founder has confirmed in chat that v1 reads right (Phase 4) — that confirmation is not the DRAFT-to-approved flip, which stays the founder's separate later act per Hard rule 2.
10. **The founder edits the file directly once a draft exists.** Iterate v1 conversationally; then open `docs/002-mvp-plan.md` in their editor and hand it over.

## The interview (one question at a time; reflect back in the founder's words; move on only when they confirm)

1. **The riskiest assumption.** *"If this product dies, what killed it? Not what could go wrong — the one assumption everything else rests on."* Test the answer against the research if a corpus exists (demand? acquisition? retention? willingness to pay? the tech?). The MVP is whatever tests THIS cheapest.
2. **The bar.** *"What number makes this a win, by when? Revenue, subscribers, whatever you actually care about. And what's the smallest version of that number that keeps you going?"* Calibrate everything downstream (scope, channel expectations, kill criteria) to the founder's bar, not to startup folklore.
3. **The kill line.** *"Decide now, while it's cheap: what result by what date means stop or change course? You're allowed to change this later — but write the calm version down today."* (Hard rule 4 is the why.)
4. **The cut.** Walk the candidate scope and force each item into: tests-the-riskiest-assumption, launch-blocking-plumbing (legal, billing, operator tooling — use a product-surface sweep if one exists in the research corpus, else run one), or explicitly-out-with-a-reason. The out-list is as load-bearing as the in-list; anchor each exclusion to an ADR or a decision, so future sessions don't helpfully add it back.
5. **The gates.** Propose phase gates shaped to the project (research picks → design system → mockups → architecture → content → build → money/launch is the reference shape); the founder reorders, merges, or renames. Each gate's exit condition is the founder's explicit yes.

## Phases

Six phases below. The build log is populated throughout — append after each phase, and after each interview question within Phase 3, not at the end.

1. **Detect mode.** `docs/002-mvp-plan.md` exists and the founder hasn't reopened scope → exit (it's theirs now). Exists and the founder reopened → surgery mode: preserve what holds, change what they name. *(Surgery mode is designed but not yet exercised; the first re-open run should refine this into a prompt script the way north-star's drift mode has one.)* Missing → fresh run. Open the build log with the header (project, founder, date, mode, models).
2. **Inputs check.** Read the north star, its build-log positioning context, ADRs, and the research corpus (decision brief first if one exists). Present the settled-vs-open check as a SHORT summary, a few lines each way, never a long two-column list: north-star hard rule 13's overwhelm trigger applies here, and the first dogfood run confirmed it (the founder's reaction to a 22-item list was to ask what to do with it, then abort). Note whether a sibling business-side plan or repo exists; if so, the draft must state the boundary explicitly (what this doc owns vs what lives there). List for the founder what the plan will treat as settled vs open; the founder corrects before the interview starts.
3. **Interview** (above). Capture verbatim; append to the build log after each question.
4. **Draft.** Assemble the plan: riskiest assumption → MVP scope in/out → metrics + kill criteria (the founder's, or labeled blanks) → the checklist (the gates rendered as checkboxes, done items included unchecked with date annotations) → open-decisions table (each row names the gate where it's decided) → provenance. Iterate v1 in chat, then hand the founder the file in their editor.
5. **Pre-lock fan-out** (required, hard rule 8). Punch list to the founder; items-acted-on recorded in the build log.
6. **Finish.** Write the final DRAFT artifact, update the counter, and say plainly: the plan exists, it is DRAFT, and flipping the header is the founder's act — typically after the gate-1 decisions land.

## Artifact format

```markdown
# 002 — MVP plan

**DRAFT — not approved.** The founder flips this to approved explicitly; until then it is a
proposal built from the founder's decisions to date and the research corpus.
<If the project has a sibling business-side plan/repo, state the boundary explicitly here:
what this doc owns vs what lives elsewhere.>

## What the MVP is
<the riskiest assumption, named; the smallest product that tests it; scope in/out>

## Success metrics and kill criteria (REQUIRED before build — founder's numbers)
<the founder's numbers, or labeled blanks they fill at approval>

## The checklist (idea → launch; the plan's spine)
<flat checkbox list grouped by gate; already-done items included, unchecked, annotated
"(done YYYY-MM-DD — check off at review)"; each gate's last item is the founder's
explicit yes for the next gate. The founder checks items off themselves — the skill never
pre-checks a box.>

## Open decisions this plan waits on
<table: decision | where it lands>

## Provenance
<date, inputs, skill version>
```

## Relationship to north-star

North-star owns identity (what / why / for whom / posture). Mvp-plan owns scope and sequence (what first, what proves it, what kills it). Neither skill edits the other's artifact. If the interview surfaces an identity problem, stop and send the founder back to north-star's drift mode rather than papering over it here.

## Status

v0.1.0 (draft). Reference output: the hand-written first instance for the reference project (2026-08-22; moved out of that repo so the dogfood run can't see it — the founder's practice records hold it for comparison), written before this skill existed; this skill encodes what that run needed. Trace logging deliberately omitted in v0.1 — north-star's npm trace wrappers were unavailable in its own dogfood run (missing script, sandbox guards); add tracing here only once the shared tooling actually works, and bless direct JSONL appends as the fallback when it lands.
