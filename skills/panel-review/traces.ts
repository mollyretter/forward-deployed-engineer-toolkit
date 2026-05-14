/**
 * Trace logging for the panel-review skill, backed by braintrust.
 *
 * Behavior:
 *   - If `BRAINTRUST_API_KEY` is unset: every call to `logTrace` is a silent
 *     no-op. The braintrust SDK is not initialized.
 *   - If `BRAINTRUST_API_KEY` is set: the logger initializes lazily on first
 *     call and traces are sent to the `fdet-panel-review` project. If SDK
 *     initialization or logging throws, a one-time warning is emitted to
 *     stderr and subsequent calls degrade to no-op for the rest of the
 *     process. The skill's primary work must never be blocked by a logging
 *     failure.
 *
 * Project name is hardcoded to `fdet-panel-review` for v0.1. Future versions
 * may take it from an env var or config file if a second skill needs
 * different routing.
 *
 * Call `flushTraces()` before process exit (for example at the end of a CI
 * smoke test) to ensure buffered traces are sent.
 */

import { initLogger, flush, type Logger } from "braintrust";

export const BRAINTRUST_PROJECT_NAME = "fdet-panel-review";

export type TraceMetadata = Record<string, string | number | boolean | null>;

export interface TraceInput {
  /** Logical name of the trace (e.g. `"panel-review/fan-out/opus"`). */
  name: string;
  /** The input the agent or function was called with. */
  input: unknown;
  /** The output the agent or function returned. */
  output: unknown;
  /** Free-form metadata tags. Useful for filtering and faceting in braintrust. */
  metadata?: TraceMetadata;
}

let logger: Logger<true> | null = null;
let initFailed = false;
let warnedOnce = false;

function warnOnce(msg: string): void {
  if (warnedOnce) return;
  warnedOnce = true;
  process.stderr.write(`[panel-review/traces] ${msg}\n`);
}

function getLogger(): Logger<true> | null {
  // Check `initFailed` first so a previously-broken logger can't be reused.
  if (initFailed) return null;
  if (logger) return logger;

  const apiKey = process.env.BRAINTRUST_API_KEY;
  if (!apiKey) return null;

  try {
    logger = initLogger({
      projectName: BRAINTRUST_PROJECT_NAME,
      apiKey,
    });
    return logger;
  } catch (err) {
    initFailed = true;
    warnOnce(`braintrust init failed (degrading to no-op): ${(err as Error).message}`);
    return null;
  }
}

/**
 * Log a single trace. No-op without `BRAINTRUST_API_KEY` or if SDK init failed.
 * Never throws; logging errors degrade silently after a one-time warning.
 *
 * The `log.log` call returns a Promise (or void in some SDK code paths); we
 * attach a `.catch` to absorb any async rejection so it does not surface as an
 * unhandledRejection. Sync throws are caught by the surrounding try.
 */
export function logTrace(trace: TraceInput): void {
  const log = getLogger();
  if (!log) return;

  // v0.1 intentionally does not set braintrust's `expected` or `scores`
  // fields. Real-run traces have no ground truth at log time; the dev
  // decision in the metadata is the eventual label. Automated eval scoring
  // is deferred until we have a real eval suite (PR #2 territory).
  try {
    const maybePromise: unknown = log.log({
      input: trace.input,
      output: trace.output,
      metadata: { trace_name: trace.name, ...(trace.metadata ?? {}) },
    });
    if (maybePromise && typeof (maybePromise as Promise<unknown>).then === "function") {
      (maybePromise as Promise<unknown>).catch((err: unknown) => {
        warnOnce(
          `braintrust log async failed (degrading to no-op): ${(err as Error).message}`,
        );
        logger = null;
        initFailed = true;
      });
    }
  } catch (err) {
    warnOnce(`braintrust log failed (degrading to no-op): ${(err as Error).message}`);
    logger = null;
    initFailed = true;
  }
}

/**
 * Flush any buffered traces. Call before process exit if you need to ensure
 * traces are sent (CI smoke tests, short-lived scripts).
 */
export async function flushTraces(): Promise<void> {
  // Guard `initFailed` too: a sync flushTraces call after a failed async
  // `log.log` would otherwise see `logger` still non-null (the `.catch`
  // microtask hasn't drained yet) and proceed to flush a known-broken logger.
  if (!logger || initFailed) return;
  try {
    await flush();
  } catch (err) {
    warnOnce(`braintrust flush failed: ${(err as Error).message}`);
  }
}

/** Test-only: reset internal state. Not part of the public package API. */
export function _resetForTests(): void {
  logger = null;
  initFailed = false;
  warnedOnce = false;
}
