# `@forward-deployed-engineer-toolkit/mvp-plan`

> The second link in the 0-to-1 chain, immediately after `north-star` locks. Turns a locked identity into a scoped, gated MVP plan whose spine is an idea-to-launch checklist, with success metrics and kill criteria that only the founder supplies.

## What this skill does

A short scoping interview built on pre-build research consensus: name the riskiest assumption, set the founder's bar, write the kill line while it is cheap, cut scope against that assumption, and shape phase gates that keep build work behind explicit approval. The artifact stays DRAFT until the founder flips it; the skill never marks it approved.

## Output

1. **`<project>/docs/002-mvp-plan.md`**: the plan, checklist-spined (already-done items included, unchecked, date-annotated; the founder checks boxes themselves), with riskiest assumption, scope in/out, the founder's numbers or labeled blanks, and an open-decisions table.
2. **`<project>/docs/build-logs/mvp-plan-v{N}.md`**: session record with the founder's verbatim answers and draft evolution.
3. Counter increment in `<project>/docs/eval-runs/mvp-plan.md`.

## How to invoke

Inside Claude Code:

```
/mvp-plan
```

The skill refuses to run without a locked `docs/00-north-star.md`. If `docs/002-mvp-plan.md` already exists and the founder has not explicitly reopened scope, the run exits.

## The 5 interview questions (headlines; full prompts in SKILL.md)

1. **The riskiest assumption.** If this product dies, what killed it?
2. **The bar.** What number makes this a win, by when?
3. **The kill line.** Written now, while it is cheap and calm.
4. **The cut.** Every scope item is tests-the-assumption, launch-blocking plumbing, or out with a reason anchored to a decision.
5. **The gates.** Phase gates shaped to the project; each exit condition is the founder's explicit yes.

## Hard rules (headlines; full text in SKILL.md)

1. A locked north star is a precondition
2. The plan stays DRAFT until the founder flips it
3. Success metrics and kill criteria are the founder's numbers; blanks are honest, invented numbers are not
4. Kill criteria are written while emotionally neutral
5. Founder's verbatim language in the build log
6. No old rulings carried silently
7. Review findings are triaged by the founder, never auto-applied
8. Cross-model review at lock (Sonnet, Opus, Haiku fan-out, must-fix-only mandate)
9. Every phase gate opens with a plain-language brief and the founder's explicit yes
10. The founder edits the file directly once a draft exists

## Consuming the artifact downstream

v0.1 ships markdown only; no TypeScript schema yet. The checklist section is plain GitHub-flavored task-list markdown, so any consumer that parses task lists can read completion state. A typed frontmatter schema follows once the artifact shape survives more real runs.

## Status

v0.1.0 (draft). Encodes what the hand-written first instance needed, plus the first dogfood run's lessons (short settled-vs-open summaries, never confirmation lists). Surgery mode is designed but unexercised. Trace logging deliberately omitted until the shared tooling works.
