---
name: north-star
description: Step 0 for going from 0 to 1 in any new project, business, or pivot. Conducts a structured 3-question self-interview, produces a 3–5 sentence paragraph artifact at docs/00-north-star.md plus a build log capturing the full session and consolidated positioning context for downstream skills. Drift-mode aware. Cross-model review required pre-lock. Designed to prevent identity drift during early-stage builds.
---

# /north-star — turn the founder's feelings and intentions on day 1 into a locked day-1 artifact

## When to use

At the very beginning of a new project, business, or pivot — before brand, scope, or implementation work. Or later, in **drift mode**, when the existing north-star isn't working anymore and the founder explicitly wants to revise.

Skip for: features (those use the project's `feature` skill if one exists), pure technical decisions (use ADRs directly), marketing campaigns (downstream).

## What it produces

Three artifacts:

1. **`<project>/docs/00-north-star.md`** — a short paragraph (3–5 sentences) capturing what / why / for-whom, the approach, and the philosophical posture. YAML frontmatter at the top makes the paragraph machine-readable for downstream apps. ~25 lines total. Real-world mission statements (Patagonia, Amazon) are 1–3 sentences; aim there.

2. **`<project>/docs/build-logs/north-star-v{N}.md`** — full session record: founder's verbatim answers to each interview question, scratch synthesis attempts, cross-model review findings, draft evolution, and a consolidated **Positioning context for downstream skills** section that captures everything durable that didn't fit in the paragraph (felt experience details, bright lines, operational commitments, voice/tone, counter-personas).

3. (Optional) **1–3 foundational ADRs** in `<project>/docs/adrs/` for durable decisions surfaced during the interview that warrant separable, citable records.

Downstream skills (e.g. `feature`) read (1) and (2) at requirements-gathering time to check alignment before scoping new work.

## Hard rules

1. **Self-interview, not interrogation.** Capture the founder's literal language. Don't paraphrase, don't generate from templates, don't put words in their mouth.
2. **Pointed questions, not vague ones.** Each question elicits a *felt* answer, not an analytical one.
3. **No drift into brand, voice, pricing, scope, or marketing.** All downstream. Park stray thoughts in build-log notes.
4. **Short artifact.** ~25 lines (3–5 sentences) is the bar. Resist the urge to produce a polished document; polish comes through months of iteration.
5. **Read aloud or it doesn't ship.** The founder reads the paragraph aloud. If it sounds like them, lock. If not, edit.
6. **Founder edits the file directly.** Once a draft exists, open `docs/00-north-star.md` in the founder's editor (e.g. `code <path>`). They edit there. Chat is for question-asking and review-summarizing only, not for list-mode confirmations.
7. **Positive commitments only in the artifact.** No "we don't / we are not for" framing in the paragraph; that reads judgy. Bright lines and counter-personas live in the build log's positioning-context section as expectation-setting.
8. **Locked-but-revisable.** Drift-mode re-run requires the founder to explicitly name what's drifted; old version is archived, not deleted.
9. **One sitting if possible, two max.** Three sittings means the questions are wrong, not the founder.
10. **Stop-or-go is allowed.** If Q3 (founder-market fit) makes the founder realize they shouldn't be building this, surface that; don't push through to a locked artifact.
11. **Cross-model review is required pre-lock** (Phase 4). Optional at any phase boundary if the interviewer or founder wants a sanity check; mid-flight reviews catch drift early.
12. **No em dashes** in the artifact. Periods, commas, semicolons.

## The 3 interview questions

Ask one at a time. Listen. Reflect back what you heard *in the founder's own words*. Move on only when they confirm.

Synthesis happens *for* the founder in Phase 3, not by them in real time. Bright lines, counter-personas, and felt-experience details surface as side-effects of Q1 and Q2; the interviewer collects them into the build log's positioning-context section. There is no separate "bright lines" or "counter-personas" question; that approach overwhelms founders with confirmation lists.

1. **Brain dump** — *"Tell me everything about [project name]. What it is, who it's for, what you believe, what you're trying to avoid, what you've been thinking about. Don't try to organize it. Just talk."* This is the most important question. The founder dumps; the interviewer parses and asks natural follow-ups for any artifact dimension that's missing or thin (most often: the *why* and the *specific person*). Spend most of the session here.

2. **Felt experience** — *"What does it feel like to be a customer? The texture, the room temperature, the community, the moment-to-moment quality. What experience are you trying to deliver beyond the literal service?"* Captures community, belonging, ambient quality, and what-being-there-is-like — material that does not surface in Q1 unless prompted.

3. **Founder-market fit** — *"Why is this YOU and not someone else? Did you live through it? Do you have unfair access? If your answer doesn't convince you out loud, what does that tell you?"* Stop-or-go gut check. Ask clean, no pre-framing.

If the founder says "I don't know" to any question, sit with them — don't move on. The not-knowing is data. The truest answer often comes after the silence.

## Phases

Six phases. The build log is populated throughout — append after each phase, not at the end.

1. **Detect mode.** Check if `docs/00-north-star.md` already exists. If yes and the founder hasn't named drift → exit (the artifact is locked). If yes and drift named → drift mode. If no → fresh-start. Open the build log and write the header (project, founder, date, mode, model running interview, model that will review).

2. **Interview.** Work through the 3 questions. Capture literal language in the build log. Append founder's verbatim answers, your reflections, and any "sat with it" moments. Note bright-line and counter-persona signals as they surface; they go into the positioning-context section, not into the artifact paragraph.

3. **Synthesize.** Draft the paragraph (3–5 sentences) using the founder's words. Open `<project>/docs/00-north-star.md` in their editor (`code <path>`). The founder reads it aloud and edits directly. Iterate until it sounds like them. Do not present chat lists for confirmation.

4. **Cross-model review (required).** Spawn an agent on a *different* model than the one running the interview. Hand it: SKILL.md (so it knows what the skill is supposed to do), the build log (full session context), and the current draft. Ask it to flag (a) drift from literal language, (b) missed signals, (c) interviewer drift, (d) voice check, (e) lockable verdict. Return the punch list to the founder; they decide what to act on. Optional mid-flight reviews at any phase boundary work the same way.

5. **Optional ADRs.** Prompt: *"Some decisions surfaced felt durable enough to capture as standalone ADRs. Want to formalize 1–3?"* Founder opts in per ADR; draft together if yes.

6. **Lock.** Write `docs/00-north-star.md` with YAML frontmatter + paragraph body + provenance line. Add the consolidated **Positioning context for downstream skills** section to the build log. In drift mode, archive prior version to `docs/north-star-archive/north-star-v{N}-YYYY-MM-DD.md` and add a `## Changelog` section to the new artifact.

## Drift mode

Triggered when the founder explicitly says the locked north-star isn't working anymore. Different prompts for Phase 2:

- *"Read me your current paragraph aloud. How does it land?"*
- *"What specifically feels off now? Be concrete: a decision you couldn't make, a person you wrongly turned away, a phrase that no longer matches what you do."*
- *"Is the what/why/who wrong, are the beliefs wrong, are the exclusions wrong, or is the founder-market fit wrong?"*

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

<3–5 sentence paragraph, human-readable.>

---

## Provenance

Produced by the `north-star` skill on YYYY-MM-DD. The full session — interview answers, cross-model reviews, draft evolution, and consolidated positioning context for downstream skills — is recorded at `docs/build-logs/north-star-v{N}.md`.

Re-running the skill on this project requires explicit founder say-so describing what's drifted.
```

The TypeScript schema for the frontmatter lives at `forward-deployed-engineer-toolkit/skills/north-star/schema.ts`. Downstream apps can import it.

## Build log: positioning context section (write at lock time)

Before locking, the build log gets a final section consolidating everything from the interview that did not fit in the paragraph but is durable. Suggested subsections:

- **Specific client/user archetype** (founder's literal language)
- **Service / product structure** (operational; not in artifact)
- **Felt experience (full version)** — verbatim quotes from Q2
- **Bright lines and durable commitments** — operational/policy lines
- **Voice and tone** — how the founder describes the brand
- **Counter-personas** — orientation, not gatekeeping; framed as redirects with no judgment

This section is what downstream skills (`feature`, brand work, marketing) read when they need fuller context than the paragraph alone provides.

## After the skill

Done. The artifact is the touchstone; future plans, ADRs, and decisions cite or test against it. The skill's job ends here. Alignment with downstream work is the founder's job (or the project's `feature` skill if one exists, which should read `docs/00-north-star.md` and `docs/build-logs/north-star-v{N}.md` at requirements-gathering time).

## Status

v0.2 (draft). The hard rules and 3-question structure encode opinions formed during real-world use; expect further revision as the skill is run on more projects.
