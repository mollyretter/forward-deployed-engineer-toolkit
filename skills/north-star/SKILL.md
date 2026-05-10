---
name: north-star
description: Step 0 for going from 0 to 1 in any new project, business, or pivot. Conducts a structured 3-question self-interview, produces a 3-5 sentence paragraph artifact at docs/00-north-star.md plus a build log capturing the full session and consolidated positioning context for downstream skills. Drift-mode supported. Cross-model review required at lock. Designed to prevent identity drift during early-stage builds.
---

# /north-star — turn the founder's feelings and intentions on day 1 into a locked day-1 artifact

## When to use

At the very beginning of a new project, business, or pivot, before brand, scope, or implementation work. Or later, in **drift mode**, when the existing north-star isn't working anymore and the founder explicitly wants to revise.

Skip for: features (those use the project's `feature` skill if one exists), pure technical decisions (use ADRs directly), marketing campaigns (downstream).

## What it produces

Three artifacts:

1. **`<project>/docs/00-north-star.md`** — a short paragraph (3 to 5 sentences) capturing what / why / for-whom, the approach, and the philosophical posture. YAML frontmatter at the top makes the paragraph machine-readable for downstream apps. Real-world mission statements (Patagonia, Amazon) are 1 to 3 sentences; aim there. The 3-to-5-sentence count is the authoritative bar; line count is incidental.

2. **`<project>/docs/build-logs/north-star-v{N}.md`** — full session record: founder's verbatim answers to each interview question, scratch synthesis attempts, cross-model review findings, draft evolution v1 to vN with rejection reasons, and a consolidated **Positioning context for downstream skills** section.

3. (Optional) **1 to 3 foundational ADRs** in `<project>/docs/adrs/` for durable bright-line decisions surfaced during the interview that warrant separable, citable records.

Downstream skills (e.g. `feature`) read (1) and (2) at requirements-gathering time to check alignment before scoping new work.

## Hard rules

1. **Self-interview, not interrogation.** Capture the founder's literal language. Don't paraphrase, don't generate from templates, don't put words in their mouth.
2. **Pointed questions, not vague ones.** Each question elicits a *felt* answer, not an analytical one.
3. **No drift into brand, voice, pricing, scope, or marketing.** All downstream. If the founder veers, redirect with a script: *"That's worth holding onto, but for now I'm parking it. Right now I'm only after what / why / who and the deepest beliefs. We'll come back to that."* Park stray thoughts in build-log notes.
4. **Short artifact.** 3 to 5 sentences in the paragraph. Resist the urge to produce a polished document; polish comes through months of iteration.
5. **Read aloud or it doesn't ship.** The founder reads the paragraph aloud. If it sounds like them, lock. If not, edit.
6. **Founder edits the file directly once a draft exists.** Iterate the first draft conversationally in chat. The moment a working draft exists, open `docs/00-north-star.md` in their editor (`code <path>`, `$EDITOR <path>`, or whatever they use) and let them edit there. Quality jumps once the founder is in their own editor; chat-based list confirmations are explicitly forbidden.
7. **Positive commitments only in the artifact.** No "we don't" or "we are not for" framing in the paragraph; that reads judgy. Specific anti-patterns to avoid in synthesis:
   - Defensive hedging in the headline (e.g. *"...not get skinny"* — even if the founder said it, putting it in the headline turns the orientation into an argument with the customer's possible motivations)
   - "We don't do X" framing in beliefs (replace with positive commitments that imply the bright line)
   - "Who we are NOT for" as a section heading (use *"What to expect"* or fold into positioning context as expectation-setting)
   Bright lines and counter-personas live in the build log's positioning-context section.
8. **Locked-but-revisable.** Drift-mode re-run requires the founder to explicitly name what's drifted; old version is archived, not deleted.
9. **Ideal pace is one sitting, no hard cap.** Most runs land in one focused session. Some genuinely take two. There is no enforced limit; if a session is going long, take a break and resume rather than rushing.
10. **Stop-or-go is allowed.** If Q3 (founder-market fit) makes the founder realize they shouldn't be building this, surface that, don't push through to a locked artifact. *(This rule is designed but not yet exercised in real-world use.)*
11. **Cross-model review is required at lock; optional at any point during the run.** Mid-flight reviews (single different-model agent at any point the interviewer or founder wants a sanity check) caught real drift in the inaugural run. The pre-lock review is a fan-out across multiple models (Sonnet + Opus + Haiku) for confidence on the final paragraph. See Phase 4.
12. **Build log uses verbatim quotes for founder language.** When the interviewer's notes summarize what the founder said, mark it explicitly as a summary; the verbatim founder answers are the source of truth for downstream skills. Don't paraphrase silently.
13. **Founder overwhelm is a course-correction trigger.** If the founder says *"this is a lot,"* *"this is overwhelming,"* or similar, stop the current approach and find a smaller surface. Don't push through. The most common moment this fires is when the interviewer is presenting list-mode confirmations; the right correction is to skip lists and let the founder react to a draft instead.

## The 3 interview questions

Ask one at a time. Listen. Reflect back what you heard *in the founder's own words*. Move on only when they confirm.

**Q1 is generative; Q2 and Q3 are selective.** Q1 produces most of the raw material the artifact and positioning context will draw from. Q2 surfaces texture that wouldn't come up otherwise (community, room temperature). Q3 is a stop-or-go gate, not a generation question. Treat Q1's depth as the foundation; if Q1 is thin, the run is thin.

Synthesis happens *for* the founder in Phase 3, not by them in real time. Bright lines, counter-personas, and felt-experience details surface as side-effects of Q1 and Q2; the interviewer collects them into the build log's positioning-context section. There is no separate "bright lines confirm" question; that approach overwhelms founders with confirmation lists and was abandoned twice in the inaugural run.

1. **Brain dump** — *"Tell me everything about [project name]. What it is, who it's for, what you believe, what you're trying to avoid, what you've been thinking about. Don't try to organize it. Just talk."*

   Spend most of the session here. The founder dumps; the interviewer parses and asks natural follow-ups for any artifact dimension that's missing or thin (most often: the *why* and the *specific person*).

   **Listening cues** — flag in the build log as you hear them:
   - *Quote candidates*: phrases the founder uses that sound durable enough to land verbatim in the artifact (e.g. *"not 'get skinny', it's 'get stronger'"*). Mark them in your notes; preserving them through synthesis prevents drift.
   - *Structural ambiguity*: two things named together that could be one or two businesses (e.g. *"a gym AND a web app"*). Probe whether they're one project, or two projects with one as the center of gravity.
   - *Bright-line signals*: implicit "we never do X" statements that surface as side-effects. Capture them in the positioning context, don't ask about them again.

2. **Felt experience** — *"What does it feel like to be a customer? The texture, the room temperature, the community, the moment-to-moment quality. What experience are you trying to deliver beyond the literal service?"*

   Captures community, belonging, ambient quality, and what-being-there-is-like, material that does not surface in Q1 unless prompted.

   **Listening cues:**
   - *Founder-trait-as-design-input*: when the founder describes their own qualities (introvert, anxious, recovering from X) shaping a design choice, flag it. This is voice/tone material AND founder-market-fit material; surface it in both subsections of positioning context.

3. **Founder-market fit** — *"Why is this YOU and not someone else? Did you live through it? Do you have unfair access? If your answer doesn't convince you out loud, what does that tell you?"*

   Stop-or-go gut check. Ask clean, no pre-framing. The strongest answers are lived experience the founder is currently living through (per Hard rule 10).

If the founder says "I don't know" to any question, sit with them, don't move on. The not-knowing is data. The truest answer often comes after the silence.

## Phases

Six phases. The build log is populated throughout, append after each phase, not at the end.

1. **Detect mode.** Check if `docs/00-north-star.md` already exists. If yes and the founder hasn't named drift, exit (the artifact is locked). If yes and drift named, drift mode. If no, fresh-start. Open the build log and write the header (project, founder, date, mode, model running interview, model that will review).

2. **Interview.** Work through the 3 questions. Capture literal language in the build log. Append founder's verbatim answers, your reflections (clearly marked as summaries, not quotes, per Hard rule 12), and any "sat with it" moments. Note bright-line and counter-persona signals as they surface; they go into the positioning-context section, not into the artifact paragraph.

3. **Synthesize.** Draft v1 of the paragraph (3 to 5 sentences) using the founder's words; iterate it conversationally with the founder for the first version. Once the v1 draft sounds *roughly* right, **open `<project>/docs/00-north-star.md` in the founder's editor** (`code <path>`, `$EDITOR <path>`, etc.) and hand the editing experience over to them. Track the draft version (v1, v2, ..., vN) in the build log with the reason each version was rejected or evolved; this version history is how drift-prevention is shown.

4. **Cross-model review.** Two patterns:
   - **Mid-flight (optional, single model):** at any point during the run, the interviewer or founder may spawn a review agent on a different model (via the Task / Agent tool with `model="<other>"`) to check the work-so-far against the build log. Default pairing: if running on Sonnet, review on Opus; if on Opus, review on Sonnet; Haiku as a fallback for speed. The reviewer returns a punch list; the interviewer surfaces it in chat; the founder triages. Append the review verbatim AND an **"Items acted on"** block listing which items were addressed. The Items-acted-on block is the most navigable element of the build log; don't skip it.
   - **Pre-lock fan-out (required):** spawn three reviewers (Sonnet, Opus, Haiku) in parallel on the saved draft. Wait for all three. Compare findings; consensus issues are clear must-fix; single-agent catches are evaluated for severity. Append all three reviews verbatim plus a final Items-acted-on block.

5. **Propose ADRs (optional).** After the artifact locks, the interviewer reviews the bright-line signals collected in the positioning context and proposes 1 to 3 of them as candidate ADRs (e.g. *"ADR: AI in operational layer only, not customer-facing"*). The founder opts in per ADR; draft together if yes. ADRs are not required; many runs will produce zero. *(This phase is designed but ADR formalization was not exercised in the inaugural run.)*

6. **Lock.** Write `docs/00-north-star.md` with YAML frontmatter, paragraph body, and provenance line. Add the consolidated **Positioning context for downstream skills** section to the build log. In drift mode, archive prior version to `docs/north-star-archive/north-star-v{N}-YYYY-MM-DD.md` and add a `## Changelog` section to the new artifact body. The changelog lives in body markdown only; it is not a structured frontmatter field.

## Drift mode

*This mode is designed but not yet exercised in real-world use; the prompts will refine after the first drift run.*

Triggered when the founder explicitly says the locked north-star isn't working anymore. Replace Phase 2's prompts with these:

- *"Read me your current paragraph aloud. How does it land?"*
- *"What specifically feels off now? Be concrete: a decision you couldn't make, a person you wrongly turned away, a phrase that no longer matches what you do."*
- *"Is the what / why / who wrong, are the beliefs wrong, are the exclusions wrong, or is the founder-market fit wrong?"*

The founder is doing surgery, not creation. Be precise; preserve what still holds.

## Artifact format

`<project>/docs/00-north-star.md`:

```markdown
---
name: <Project Name>
founder: <Founder name(s)>
locked_at: YYYY-MM-DD
version: 1
schema: forward-deployed-engineer-toolkit/north-star/v1
paragraph: |
  <The paragraph as a YAML literal block, machine-readable.
  Identical content to body below.>
---

# <Project Name> — North Star

<3 to 5 sentence paragraph, human-readable.>

---

## Provenance

Produced by the `north-star` skill on YYYY-MM-DD. The full session is recorded at `docs/build-logs/north-star-v{N}.md`.

Re-running the skill on this project requires explicit founder say-so describing what's drifted.
```

The TypeScript schema and a working `parseNorthStar` parser live at `forward-deployed-engineer-toolkit/skills/north-star/schema.ts`. Downstream apps can install the package via git URL and import directly.

## Build log: positioning context section (write at lock time)

Before locking, the build log gets a final section consolidating everything from the interview that did not fit in the paragraph but is durable. Required subsections:

- **Specific client / user archetype** (founder's literal language)
- **Service structure** (operational; not in artifact)
- **Felt experience (full version)** — verbatim quotes from Q2
- **Bright lines and durable commitments** — operational/policy lines
- **Voice and tone** — how the founder describes the brand. Include any *founder-trait-as-design-input* surfaced in Q2 (e.g. "founder is X, so the experience is designed for Y").
- **Counter-personas — orientation, not gatekeeping.** Framed as redirects with no judgment toward the people they describe. The framing is structurally important; *don't* call this section "Who we are NOT for."
- **Live unknowns / open threads** — operational TBDs surfaced during the interview (e.g. "location form: rent vs sublease vs home studio") that downstream skills should know are unresolved. These aren't drift; they're known unknowns.
- **Founder-market fit** — pointer to the Q4 verbatim answer in the interview transcript. Q4 is load-bearing for the entire orientation; downstream skills need to find it without scanning the whole log.

Before assembling this section, do a final pass over all mid-flight review notes; signals flagged during the run sometimes don't make it into the section without explicit lookup.

This section is what downstream skills (`feature`, brand work, marketing) read when they need fuller context than the paragraph alone provides.

## After the skill

Done. The artifact is the touchstone; future plans, ADRs, and decisions cite or test against it. The skill's job ends here. Alignment with downstream work is the founder's job (or the project's `feature` skill if one exists, which should read `docs/00-north-star.md` and `docs/build-logs/north-star-v{N}.md` at requirements-gathering time).

## Status

v0.2.1 (draft). The hard rules and 3-question structure encode opinions formed during real-world use. Some elements (drift mode, optional ADRs, Hard rule 10 stop-or-go) are designed but not yet exercised in real-world use; first runs to test them will surface any necessary refinement. Expect further revision as the skill is run on more projects.
