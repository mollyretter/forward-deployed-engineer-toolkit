# Working in this repo

Notes for agents (Claude Code) collaborating on `forward-deployed-engineer-toolkit`. Project-level guidance; user-level writing preferences live in user memory.

## Commit and PR conventions

- One gitmoji per commit (unicode preferred, e.g. ✨, ♻️, 🐛, 📋). Do not double up emoji and text code.
- PRs go through `gh pr review` with explicit dev approval before any review comment posts publicly.

## Skill conventions

- Each skill ships in two shapes: a Claude Code skill (`SKILL.md`) and an importable schema/library (`schema.ts` plus tests).
- New skills should follow the directory shape of `skills/north-star/` (the prior art).
- `validate-skills.mjs` and `vitest` run in CI on every PR; both must be green before merge.

## Privacy: CI stdout is public, braintrust is private

This repo is public. GitHub Actions logs are public. Braintrust traces are private. Anything any CI script prints to stdout or stderr is durably public.

**Rules for CI scripts that touch braintrust data:**

- Eval scripts, telemetry scripts, and threshold-check scripts may print **only aggregate numbers** (counts, precision, recall, percentages, averages). Never:
  - PR diff content, even partial
  - Agent prompts or responses, even partial
  - Finding text, location strings that reference real files, or suggestion text
  - Dev decision content (the labels themselves, beyond aggregate counts)
  - Any field of a logged trace beyond the trace ID
- If a script needs to indicate which traces it processed, print trace IDs only. Anyone with braintrust access can look up the content; anyone without it sees only opaque identifiers.
- On API errors: print a sanitized error message (e.g. `braintrust API error: status 429`), never the request or response bodies.
- When in doubt, do not print. Add a comment explaining why a field is intentionally redacted so future maintainers do not "fix" it.

This rule applies to every script under `scripts/` and every workflow under `.github/workflows/`. Skill files (`SKILL.md`) repeat the rule for the agent's benefit during interactive runs, but the canonical statement is here.
