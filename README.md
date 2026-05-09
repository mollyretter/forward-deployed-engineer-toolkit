# Forward Deployed Engineer Toolkit

A growing collection of opinionated tools for shipping AI into real-world domains. Each tool ships in two shapes: a Claude Code skill, and an importable schema or library, so the same artifacts can be produced by an agent and consumed by an app.

## Contents

### Skills

| Skill | Status | Purpose |
|---|---|---|
| [`north-star`](./skills/north-star/) | building | Establishes a project's mission and gut-check questions before brand or implementation work. Conversation-driven; produces a typed, downstream-renderable artifact. |

## Design principles

- **Dual-shaped tools.** Every entry exposes both an agent-facing surface (a skill) and an app-facing surface (a schema or library). The same artifact can be produced inside Claude Code and consumed by a downstream application.
- **Opinionated, not configurable.** Each tool encodes a specific point of view and refuses to be a do-it-all framework.
- **Markdown + frontmatter as the lingua franca.** Artifacts are human-readable markdown with typed YAML frontmatter, parseable by any consumer.

## License

MIT. See [LICENSE](./LICENSE).
