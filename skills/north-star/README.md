# `@forward-deployed-engineer-toolkit/north-star`

> Step 0 for any new project, business, or pivot. Conversation-driven, produces a locked 3-to-5-sentence paragraph artifact plus a build log capturing the full session for downstream skills.

## What this skill does

A structured self-interview at the start of a new project. Three open questions, no list-mode confirmations, no multi-section structured documents. The interviewer parses what the founder says, drafts a tight paragraph, and the founder edits the file directly until it sounds like them.

## Output

Three artifacts:

1. **`<project>/docs/00-north-star.md`** — a 3-to-5 sentence paragraph with typed YAML frontmatter (paragraph itself is plain text; the *frontmatter is what's typed*). Around 20-30 lines.
2. **`<project>/docs/build-logs/north-star-v{N}.md`** — full session record including a *Positioning context for downstream skills* section consolidating everything durable that didn't fit in the paragraph.
3. (Optional) 1-3 foundational ADRs in `<project>/docs/adrs/` for bright-line decisions worth separable records.

## How to invoke

Inside Claude Code:

```
/north-star
```

The skill checks whether `<project>/docs/00-north-star.md` already exists; if it does, the run exits unless the founder explicitly invokes drift mode. Drift mode is supported but not auto-detected; the founder declares it.

## The 3 interview questions

1. **Brain dump** — *"Tell me everything about [project name]. What it is, who it's for, what you believe, what you're trying to avoid. Don't try to organize it. Just talk."* (Spend most of the session here. Q1 is generative; Q2 and Q3 are selective.)
2. **Felt experience** — *"What does it feel like to be a customer? Texture, room temperature, community, moment-to-moment quality."*
3. **Founder-market fit** — *"Why is this YOU and not someone else? Did you live through it? If your answer doesn't convince you out loud, what does that tell you?"*

Full prompts, listening cues, and synthesis guidance in [SKILL.md](./SKILL.md).

## Hard rules (headlines; full text in SKILL.md)

1. Self-interview, not interrogation; founder's literal language only
2. Pointed questions, not vague ones
3. No drift into brand, voice, pricing, scope, or marketing during the session
4. Short artifact: 3-5 sentences in the paragraph
5. Read aloud or it doesn't ship
6. Founder edits the file directly once a draft exists; chat is for asking and reviewing only, never list-mode confirmations
7. Positive commitments only in the artifact; exclusions live in the build log's positioning-context section
8. Locked-but-revisable; drift-mode re-run requires founder to explicitly name what's drifted
9. Ideal pace is one sitting, no hard cap
10. Stop-or-go is allowed; if Q3 surfaces "I shouldn't be building this," surface it
11. Cross-model review: optional mid-flight (single different model), required at lock (3-model fan-out across Sonnet, Opus, Haiku)
12. Build log uses verbatim founder quotes; mark interviewer summaries explicitly
13. Founder overwhelm is a course-correction trigger; stop the current approach and find a smaller surface

## Consuming the artifact downstream

The schema and parser are exported from this package:

```typescript
import { parseNorthStar, type NorthStar } from "@forward-deployed-engineer-toolkit/north-star";
import { readFileSync } from "node:fs";

const ns: NorthStar = parseNorthStar(
  readFileSync("docs/00-north-star.md", "utf-8"),
);
// → ns.paragraph: the locked paragraph
// → ns.locked_at: "2026-05-09"
// → render <Mission paragraph={ns.paragraph} /> on a /why page
```

`parseNorthStar` throws on missing frontmatter or invalid shape; wrap in try/catch or pre-validate with `validateNorthStar` if your code path needs to handle malformed files gracefully.

### Installing this package

While the repo is private (or until published to npm), install via git URL:

```bash
npm install github:mollyretter/forward-deployed-engineer-toolkit
```

The package exports TypeScript directly (`schema.ts`); modern bundlers (Vite, Next.js, esbuild) consume it natively. No build step.

## Status

v0.2.1 (draft). The hard rules and 3-question structure encode opinions formed during real-world use. Some elements (drift mode, optional ADRs in Phase 5, Hard rule 10 stop-or-go) are designed but not yet exercised in real-world use; first runs to test them will surface any necessary refinement. Expect further revision as the skill is run on more projects.
