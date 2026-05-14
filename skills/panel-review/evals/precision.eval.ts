/**
 * Panel-review precision eval.
 *
 * Run by the `braintrustdata/eval-action` GitHub Action on every PR. Scores
 * how often the panel's `blocker` / `question` / `nit` calls match the dev's
 * decisions across two data sources:
 *
 *   1. **Synthetic fixtures** baked into this file. Provide an immediate
 *      regression signal: the scorers exercise themselves even with zero
 *      accumulated real data.
 *   2. **Real labeled traces** from the `panel-review-labeled` Dataset in
 *      braintrust. The dataset is populated by `scripts/promote-to-dataset.ts`
 *      at the end of every labeled /panel-review run.
 *
 * Precision is computed per severity:
 *   precision_at_<severity> = confirmed / (confirmed + rejected)
 *   where confirmed and rejected are counted only for findings whose recorded
 *   severity matches <severity>. Findings in `dropped` are excluded from
 *   precision math (the dev neither confirmed nor explicitly rejected them).
 *
 * If the eval has no test cases of a given severity, the scorer returns null
 * (no signal, not 0%).
 *
 * Bracketing: braintrust's regression detection compares this experiment's
 * scores against prior experiments in the same project and posts a comment
 * to the PR.
 */

import { Eval, initDataset } from "braintrust";

const PROJECT_NAME = "fdet-panel-review";
const DATASET_NAME = "panel-review-labeled";

interface Finding {
  id: string;
  severity: "blocker" | "question" | "nit";
  finding: string;
  suggestion?: string;
  location?: string;
}

interface PanelReviewCase {
  findings: Finding[];
}

interface DevDecision {
  confirmed?: string[];
  rejected?: string[];
  dropped?: string[];
}

const SYNTHETIC_FIXTURES: Array<{
  input: PanelReviewCase;
  expected: DevDecision;
  metadata: Record<string, unknown>;
}> = [
  {
    input: {
      findings: [
        { id: "F1", severity: "blocker", finding: "User input concatenated into SQL string", location: "db.ts:42" },
      ],
    },
    expected: { confirmed: ["F1"], rejected: [], dropped: [] },
    metadata: { source: "synthetic", scenario: "real-sql-injection-confirmed" },
  },
  {
    input: {
      findings: [
        { id: "F1", severity: "blocker", finding: "Unawaited promise might leak memory", location: "x.ts:10" },
      ],
    },
    expected: { confirmed: [], rejected: ["F1"], dropped: [] },
    metadata: { source: "synthetic", scenario: "false-positive-blocker" },
  },
  {
    input: {
      findings: [
        { id: "F1", severity: "blocker", finding: "Missing null check on response", location: "a.ts:1" },
        { id: "F2", severity: "blocker", finding: "Redundant blocker call that is actually fine", location: "a.ts:5" },
        { id: "F3", severity: "nit", finding: "Comment could be clearer", location: "a.ts:9" },
      ],
    },
    expected: { confirmed: ["F1"], rejected: ["F2"], dropped: ["F3"] },
    metadata: { source: "synthetic", scenario: "mixed-1-confirmed-1-rejected-1-dropped" },
  },
  {
    input: {
      findings: [
        { id: "F1", severity: "blocker", finding: "Logic error in retry counter", location: "y.ts:7" },
        { id: "F2", severity: "question", finding: "Are these two functions intended to be different?", location: "z.ts:1" },
      ],
    },
    expected: { confirmed: ["F1", "F2"], rejected: [], dropped: [] },
    metadata: { source: "synthetic", scenario: "all-confirmed-perfect-precision" },
  },
  {
    input: {
      findings: [
        { id: "F1", severity: "nit", finding: "Could use ReturnType<typeof X> here", location: "t.ts:3" },
      ],
    },
    expected: { confirmed: [], rejected: ["F1"], dropped: [] },
    metadata: { source: "synthetic", scenario: "nit-false-positive" },
  },
];

function precisionAt(severity: "blocker" | "question" | "nit") {
  // Named function so braintrust's scorer naming picks up the severity label.
  const name = `precision_at_${severity}`;
  const scorer = ({ input, expected }: { input: PanelReviewCase; expected: DevDecision; output: PanelReviewCase }) => {
    const findings = input?.findings ?? [];
    const idsAtSeverity = new Set(findings.filter((f) => f.severity === severity).map((f) => f.id));
    const tp = (expected?.confirmed ?? []).filter((id) => idsAtSeverity.has(id)).length;
    const fp = (expected?.rejected ?? []).filter((id) => idsAtSeverity.has(id)).length;
    if (tp + fp === 0) return null;
    return { name, score: tp / (tp + fp) };
  };
  Object.defineProperty(scorer, "name", { value: name });
  return scorer;
}

Eval(PROJECT_NAME, {
  experimentName: "panel-review-precision",
  data: async () => {
    const cases: Array<{ input: PanelReviewCase; expected: DevDecision; metadata: Record<string, unknown> }> = [];

    // 1. Synthetic baseline (always present).
    for (const fixture of SYNTHETIC_FIXTURES) {
      cases.push({
        input: fixture.input as PanelReviewCase,
        expected: fixture.expected as DevDecision,
        metadata: { ...fixture.metadata },
      });
    }

    // 2. Real labeled traces from the Dataset (if it exists and has data).
    try {
      const dataset = initDataset(PROJECT_NAME, { dataset: DATASET_NAME });
      for await (const record of dataset) {
        cases.push({
          input: record.input as PanelReviewCase,
          expected: (record.expected ?? {}) as DevDecision,
          metadata: { ...(record.metadata ?? {}), source: "real" },
        });
      }
    } catch {
      // Dataset does not exist yet or is unreachable; synthetic fixtures alone.
      // SDK error message intentionally NOT echoed: this runs in public GitHub
      // Actions logs and SDK errors may contain API response bodies (auth
      // details, 429 payloads). CLAUDE.md privacy rule: aggregate/sanitized
      // status only.
      console.warn(`Note: Dataset "${DATASET_NAME}" unavailable; running on synthetic fixtures only.`);
    }

    return cases;
  },
  task: (input: PanelReviewCase) => input,
  scores: [
    precisionAt("blocker"),
    precisionAt("question"),
    precisionAt("nit"),
  ],
});
