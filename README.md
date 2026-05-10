# Forward Deployed Engineer Toolkit

A growing collection of opinionated tools for shipping AI into real-world domains. Each tool ships in two shapes: a Claude Code skill, and an importable schema or library, so the same artifacts can be produced by an agent and consumed by an app.

## Contents

### Skills

| Skill | Status | Purpose |
|---|---|---|
| [`north-star`](./skills/north-star/) | v0.2 (draft) | Establishes a project's mission and gut-check before brand or implementation work. Conversation-driven; produces a 3-5 sentence paragraph artifact with typed YAML frontmatter. |

## Design principles

- **Dual-shaped tools.** Every entry exposes both an agent-facing surface (a skill) and an app-facing surface (a schema or library). The same artifact can be produced inside Claude Code and consumed by a downstream application.
- **Opinionated, not configurable.** Each tool encodes a specific point of view and refuses to be a do-it-all framework.
- **Markdown plus YAML frontmatter as the lingua franca.** Artifacts are human-readable markdown with typed YAML frontmatter, parseable by any consumer.

## Contributing

Changes go through pull requests. Direct pushes to `main` are not allowed.

**Workflow:**

1. Cut a branch from `main`.
2. Make changes; run `npm test` and `npm run validate:skills` locally before pushing.
3. Open a PR.
4. **Run a Claude Code review on the PR before merging.** Use the `/review` skill (or equivalent automated reviewer) to surface drift, missing tests, design issues, and style violations before a human reviewer looks at it.
5. Wait for CI to pass: skill-shape validator and unit tests must both be green.
6. Address review findings.
7. Merge.

Branch protection on `main` enforces these rules at the GitHub layer (PR required, CI must pass, no force-pushes, no direct commits).

### Skill-shape validation

`scripts/validate-skills.mjs` runs in CI on every PR. For each directory under `skills/` it checks:

- A `SKILL.md` exists and starts with valid YAML frontmatter
- Required frontmatter fields are present and non-empty: `name`, `description`
- `name` matches the directory name
- `description` contains no em dashes (style preference; em dashes interrupt scannability and are hard to read aloud)
- A sibling `README.md` exists

Run it locally with `npm run validate:skills`.

### Unit tests

`npm test` runs vitest on every `*.test.ts` file. Each skill that ships a TypeScript schema (`schema.ts`) should also ship `schema.test.ts` with at minimum: validator accepts a fully-shaped object, validator rejects each missing or wrong-typed field, parser behaves as documented (throws if it's a stub, parses correctly otherwise).

Tests are deliberately *less intense than evaluators*. They catch structural and type-level drift, not the semantic quality of a skill's outputs. Semantic quality is checked by the cross-model review that's built into each skill's lock phase, plus eventual full evals once a skill produces enough artifacts to graded against a dataset.

## License

MIT. See [LICENSE](./LICENSE).
