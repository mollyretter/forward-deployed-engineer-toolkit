# `north-star` — establish the deepest WHY before anything else

> Step 0 for any new project, business, or pivot. Conversation-driven, produces a locked typed paragraph artifact (3–5 sentences) plus a build log capturing the full session for downstream skills.

## What this skill does

A structured self-interview at the start of a new project. Three open questions, no list-mode confirmations, no multi-section structured documents. The interviewer parses what the founder says, drafts a tight paragraph, and the founder edits the file directly until it sounds like them.

The shape exists because of a specific failure mode: starting to build before identity is locked tends to produce drift, scope creep, and "what is this thing actually for" rework. The locked paragraph is the touchstone every downstream decision can cite or test against.

## Output

Three artifacts:

1. **`<project>/docs/00-north-star.md`** — a 3–5 sentence paragraph with YAML frontmatter for machine-readability. ~25 lines.
2. **`<project>/docs/build-logs/north-star-v{N}.md`** — full session record including a *Positioning context for downstream skills* section that captures everything durable that didn't fit in the paragraph.
3. (Optional) 1–3 foundational ADRs in `<project>/docs/adrs/` for durable decisions worth separable records.

## How to invoke

Inside Claude Code:

```
/north-star
```

The skill auto-detects fresh-start vs. drift mode based on whether `<project>/docs/00-north-star.md` already exists.

## Consuming the artifact downstream

The TypeScript schema in [`./schema.ts`](./schema.ts) lets any app parse the locked paragraph:

```typescript
import { NorthStar, parseNorthStar } from "@forward-deployed-engineer-toolkit/north-star";

const ns: NorthStar = parseNorthStar(fs.readFileSync("docs/00-north-star.md", "utf8"));
// → render <Mission paragraph={ns.paragraph} /> on a /why page
```

The downstream skill in the same project (e.g. `feature`) can read both the artifact and the build log's positioning-context section at requirements-gathering time, to check alignment before scoping new work.

## Hard rules

The skill's design encodes opinions (full list in [SKILL.md](./SKILL.md)). Headlines:

1. Self-interview, not interrogation. Founder's literal language only.
2. Pointed open questions; no multiple choice for substantive prompts.
3. No drift into brand, voice, pricing, scope, or marketing during the session.
4. Short artifact (~25 lines). Polish comes through months of iteration.
5. Read aloud or it doesn't ship.
6. Founder edits the file directly; chat is for asking and review-summarizing only, never list-mode confirmations.
7. Positive commitments only in the artifact; exclusions live in the build log's positioning-context section.
8. Cross-model review required pre-lock. Optional at any phase boundary.
9. No em dashes.
10. Re-running requires explicit founder say-so describing what's drifted.

## Status

v0.2 (draft). The hard rules and 3-question structure encode opinions formed during real-world use; expect further revision as the skill is run on more projects.
