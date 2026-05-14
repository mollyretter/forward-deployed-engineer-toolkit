import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockLogFn = vi.fn();
const mockInitLogger = vi.fn();
const mockFlush = vi.fn();

vi.mock("braintrust", () => ({
  initLogger: (...args: unknown[]) => mockInitLogger(...args),
  flush: (...args: unknown[]) => mockFlush(...args),
}));

import {
  logTrace,
  flushTraces,
  _resetForTests,
  BRAINTRUST_PROJECT_NAME,
} from "./traces";

const sampleTrace = {
  name: "panel-review/fan-out/opus",
  input: { diff: "+ some code" },
  output: { findings: [] },
};

describe("logTrace", () => {
  const originalKey = process.env.BRAINTRUST_API_KEY;

  beforeEach(() => {
    _resetForTests();
    mockLogFn.mockReset();
    mockInitLogger.mockReset().mockReturnValue({ log: mockLogFn });
    mockFlush.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.BRAINTRUST_API_KEY;
    } else {
      process.env.BRAINTRUST_API_KEY = originalKey;
    }
  });

  it("is a silent no-op when BRAINTRUST_API_KEY is unset", () => {
    delete process.env.BRAINTRUST_API_KEY;
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    expect(() => logTrace(sampleTrace)).not.toThrow();
    expect(writeSpy).not.toHaveBeenCalled();
    expect(mockInitLogger).not.toHaveBeenCalled();
    expect(mockLogFn).not.toHaveBeenCalled();
    writeSpy.mockRestore();
  });

  it("initializes the logger lazily on first call when key is set", () => {
    process.env.BRAINTRUST_API_KEY = "fake-key-for-test";
    logTrace(sampleTrace);
    expect(mockInitLogger).toHaveBeenCalledTimes(1);
    expect(mockInitLogger).toHaveBeenCalledWith({
      projectName: BRAINTRUST_PROJECT_NAME,
      apiKey: "fake-key-for-test",
    });
    expect(mockLogFn).toHaveBeenCalledTimes(1);
  });

  it("does not re-initialize on subsequent calls", () => {
    process.env.BRAINTRUST_API_KEY = "fake-key-for-test";
    logTrace(sampleTrace);
    logTrace(sampleTrace);
    logTrace(sampleTrace);
    expect(mockInitLogger).toHaveBeenCalledTimes(1);
    expect(mockLogFn).toHaveBeenCalledTimes(3);
  });

  it("logs with trace_name merged into metadata", () => {
    process.env.BRAINTRUST_API_KEY = "fake-key-for-test";
    logTrace({
      ...sampleTrace,
      metadata: { agent: "opus", phase: "fan-out" },
    });
    expect(mockLogFn).toHaveBeenCalledWith({
      input: sampleTrace.input,
      output: sampleTrace.output,
      metadata: {
        trace_name: "panel-review/fan-out/opus",
        agent: "opus",
        phase: "fan-out",
      },
    });
  });

  it("warns once and degrades to no-op when initLogger throws", () => {
    process.env.BRAINTRUST_API_KEY = "fake-key-for-test";
    mockInitLogger.mockImplementation(() => {
      throw new Error("init exploded");
    });
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    logTrace(sampleTrace);
    logTrace(sampleTrace);
    logTrace(sampleTrace);

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const callArg = writeSpy.mock.calls[0][0] as string;
    expect(callArg).toContain("braintrust init failed");
    expect(mockLogFn).not.toHaveBeenCalled();
    writeSpy.mockRestore();
  });

  it("warns once and degrades to no-op when logger.log throws", () => {
    process.env.BRAINTRUST_API_KEY = "fake-key-for-test";
    mockLogFn.mockImplementation(() => {
      throw new Error("log exploded");
    });
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    logTrace(sampleTrace);
    logTrace(sampleTrace);
    logTrace(sampleTrace);

    // Warn once.
    expect(writeSpy).toHaveBeenCalledTimes(1);
    const callArg = writeSpy.mock.calls[0][0] as string;
    expect(callArg).toContain("braintrust log failed");
    // Critical: log.log must NOT be called again after the first throw.
    // The broken logger gets nulled and subsequent getLogger() returns null.
    expect(mockLogFn).toHaveBeenCalledTimes(1);
    writeSpy.mockRestore();
  });

  it("handles an async rejection from log.log without crashing or re-calling", async () => {
    // Regression test for the panel-review blocker: if log.log returns a
    // rejected Promise, the rejection must not surface as an unhandledRejection,
    // and subsequent calls must not re-invoke the broken logger.
    process.env.BRAINTRUST_API_KEY = "fake-key-for-test";
    mockLogFn.mockReturnValue(Promise.reject(new Error("async log boom")));
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    logTrace(sampleTrace);
    // Yield to the microtask queue so the .catch handler runs.
    await new Promise((resolve) => setImmediate(resolve));

    logTrace(sampleTrace);
    logTrace(sampleTrace);

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const callArg = writeSpy.mock.calls[0][0] as string;
    expect(callArg).toContain("braintrust log async failed");
    // log.log invoked exactly once: first call sees logger set, subsequent
    // calls see initFailed=true and short-circuit.
    expect(mockLogFn).toHaveBeenCalledTimes(1);
    writeSpy.mockRestore();
  });
});

describe("flushTraces", () => {
  const originalKey = process.env.BRAINTRUST_API_KEY;

  beforeEach(() => {
    _resetForTests();
    mockLogFn.mockReset();
    mockFlush.mockReset().mockResolvedValue(undefined);
    mockInitLogger.mockReset().mockReturnValue({ log: mockLogFn });
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.BRAINTRUST_API_KEY;
    } else {
      process.env.BRAINTRUST_API_KEY = originalKey;
    }
  });

  it("is a no-op when logger was never initialized", async () => {
    delete process.env.BRAINTRUST_API_KEY;
    await flushTraces();
    expect(mockFlush).not.toHaveBeenCalled();
  });

  it("calls braintrust.flush when the logger has been initialized", async () => {
    process.env.BRAINTRUST_API_KEY = "fake-key-for-test";
    logTrace(sampleTrace);
    await flushTraces();
    expect(mockFlush).toHaveBeenCalledTimes(1);
  });

  it("short-circuits after a logged async failure before the .catch microtask drains", async () => {
    // Regression for the F3 race: a sync flushTraces call after a logTrace
    // whose .catch hasn't fired must NOT proceed to flush(). The async log
    // failure sets initFailed=true and nullifies logger inside a microtask;
    // if flushTraces only checks !logger, the microtask-not-drained window
    // would call flush() on a logger whose last write failed.
    process.env.BRAINTRUST_API_KEY = "fake-key-for-test";
    mockLogFn.mockReturnValue(Promise.reject(new Error("async log boom")));
    const writeSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    logTrace(sampleTrace);
    // Drain microtasks so the .catch fires and sets initFailed=true.
    await new Promise((resolve) => setImmediate(resolve));

    // Now flushTraces must short-circuit even though we don't directly null
    // logger here — the .catch already set initFailed=true.
    await flushTraces();
    expect(mockFlush).not.toHaveBeenCalled();

    writeSpy.mockRestore();
  });
});
