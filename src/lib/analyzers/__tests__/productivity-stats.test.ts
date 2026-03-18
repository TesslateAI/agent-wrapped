import { computeProductivityStats } from "../productivity-stats"
import { createTestData, createMultiSessionData } from "./test-helpers"
import type { SessionAnalysis, CostEstimate } from "@/lib/types"

// ---------------------------------------------------------------------------
// Helpers to build minimal SessionAnalysis and CostEstimate fixtures
// ---------------------------------------------------------------------------

function makeSessionAnalysis(
  sessions: Partial<SessionAnalysis["sessions"][number]>[]
): SessionAnalysis {
  return {
    sessions: sessions.map((s, i) => ({
      id: s.id ?? `session-${i}`,
      startTime: s.startTime ?? "2026-03-01T10:00:00Z",
      endTime: s.endTime ?? "2026-03-01T11:00:00Z",
      project: s.project ?? "/test/project",
      durationMinutes: s.durationMinutes ?? 60,
      messageCount: s.messageCount ?? 0,
      userPromptCount: s.userPromptCount ?? 0,
      tokenCount: s.tokenCount ?? 0,
      toolCallCount: s.toolCallCount ?? 0,
      errorCount: s.errorCount ?? 0,
      topTools: s.topTools ?? [],
      userPrompts: s.userPrompts ?? [],
      messages: s.messages ?? [],
    })),
    timeline: [],
  }
}

function makeCostEstimate(totalCost: number): CostEstimate {
  return {
    totalCost,
    usedFallbackPricing: false,
    breakdown: [],
    tokenDistribution: { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 },
  }
}

// ---------------------------------------------------------------------------
// avgCostPerSession
// ---------------------------------------------------------------------------

describe("computeProductivityStats — avgCostPerSession", () => {
  it("divides totalCost by number of sessions", () => {
    const data = createMultiSessionData([
      { messages: [{ role: "user", content: "hello" }] },
      { messages: [{ role: "user", content: "world" }] },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "s0" }, { id: "s1" }])
    const costEstimate = makeCostEstimate(4.0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.avgCostPerSession).toBeCloseTo(2.0)
  })

  it("returns 0 when there are no sessions", () => {
    const data = { source: "claude-code" as const, sessions: [], metadata: { totalFiles: 0, earliestTimestamp: "", latestTimestamp: "", projectPaths: [] } }
    const sessionAnalysis: SessionAnalysis = { sessions: [], timeline: [] }
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.avgCostPerSession).toBe(0)
  })

  it("returns 0 when totalCost is 0", () => {
    const data = createTestData([{ role: "user", content: "hi" }])
    const sessionAnalysis = makeSessionAnalysis([{ id: "s0" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.avgCostPerSession).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// mostExpensiveSession
// ---------------------------------------------------------------------------

describe("computeProductivityStats — mostExpensiveSession", () => {
  it("returns null when no sessions have token data", () => {
    const data = createMultiSessionData([
      { messages: [{ role: "user", content: "hi" }] },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "session-0" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.mostExpensiveSession).toBeNull()
  })

  it("picks the session with the highest token cost", () => {
    // session-0: 100k input sonnet = $0.30
    // session-1: 1M input sonnet = $3.00  ← most expensive
    const data = createMultiSessionData([
      {
        messages: [
          {
            role: "assistant",
            content: "r1",
            model: "claude-sonnet-4-6",
            tokenUsage: { inputTokens: 100_000, outputTokens: 0 },
          },
        ],
        project: "/project/a",
      },
      {
        messages: [
          {
            role: "assistant",
            content: "r2",
            model: "claude-sonnet-4-6",
            tokenUsage: { inputTokens: 1_000_000, outputTokens: 0 },
          },
        ],
        project: "/project/b",
      },
    ])
    const sessionAnalysis = makeSessionAnalysis([
      { id: "session-0", project: "/project/a" },
      { id: "session-1", project: "/project/b" },
    ])
    const costEstimate = makeCostEstimate(3.3)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.mostExpensiveSession).not.toBeNull()
    expect(result.mostExpensiveSession!.id).toBe("session-1")
    expect(result.mostExpensiveSession!.project).toBe("/project/b")
    expect(result.mostExpensiveSession!.cost).toBeCloseTo(3.0)
  })

  it("handles a single session with tokens", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "r",
        model: "claude-sonnet-4-6",
        tokenUsage: { inputTokens: 500_000, outputTokens: 100_000 },
      },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session", project: "/test/project" }])
    const costEstimate = makeCostEstimate(3.0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.mostExpensiveSession).not.toBeNull()
    expect(result.mostExpensiveSession!.id).toBe("test-session")
    // 500k input * $3/1M + 100k output * $15/1M = $1.50 + $1.50 = $3.00
    expect(result.mostExpensiveSession!.cost).toBeCloseTo(3.0)
  })
})

// ---------------------------------------------------------------------------
// costTrend
// ---------------------------------------------------------------------------

describe("computeProductivityStats — costTrend", () => {
  it("returns empty array when no sessions have token data", () => {
    const data = createTestData([{ role: "user", content: "hi" }])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.costTrend).toEqual([])
  })

  it("groups session costs by date and sums them", () => {
    // Two sessions on the same date, one on a different date
    const data = createMultiSessionData([
      {
        messages: [
          {
            role: "assistant",
            content: "r",
            model: "claude-sonnet-4-6",
            tokenUsage: { inputTokens: 1_000_000, outputTokens: 0 },
          },
        ],
        startTime: "2026-03-01T10:00:00Z",
        endTime:   "2026-03-01T11:00:00Z",
      },
      {
        messages: [
          {
            role: "assistant",
            content: "r",
            model: "claude-sonnet-4-6",
            tokenUsage: { inputTokens: 1_000_000, outputTokens: 0 },
          },
        ],
        startTime: "2026-03-01T14:00:00Z",
        endTime:   "2026-03-01T15:00:00Z",
      },
      {
        messages: [
          {
            role: "assistant",
            content: "r",
            model: "claude-sonnet-4-6",
            tokenUsage: { inputTokens: 1_000_000, outputTokens: 0 },
          },
        ],
        startTime: "2026-03-02T10:00:00Z",
        endTime:   "2026-03-02T11:00:00Z",
      },
    ])
    const sessionAnalysis = makeSessionAnalysis([
      { id: "session-0", startTime: "2026-03-01T10:00:00Z" },
      { id: "session-1", startTime: "2026-03-01T14:00:00Z" },
      { id: "session-2", startTime: "2026-03-02T10:00:00Z" },
    ])
    const costEstimate = makeCostEstimate(9.0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.costTrend).toHaveLength(2)
    expect(result.costTrend[0].date).toBe("2026-03-01")
    expect(result.costTrend[0].cost).toBeCloseTo(6.0) // 2 sessions × $3
    expect(result.costTrend[1].date).toBe("2026-03-02")
    expect(result.costTrend[1].cost).toBeCloseTo(3.0) // 1 session × $3
  })

  it("is sorted chronologically", () => {
    const data = createMultiSessionData([
      {
        messages: [
          { role: "assistant", content: "r", model: "claude-sonnet-4-6", tokenUsage: { inputTokens: 100_000, outputTokens: 0 } },
        ],
        startTime: "2026-03-05T10:00:00Z",
        endTime:   "2026-03-05T11:00:00Z",
      },
      {
        messages: [
          { role: "assistant", content: "r", model: "claude-sonnet-4-6", tokenUsage: { inputTokens: 100_000, outputTokens: 0 } },
        ],
        startTime: "2026-03-03T10:00:00Z",
        endTime:   "2026-03-03T11:00:00Z",
      },
    ])
    const sessionAnalysis = makeSessionAnalysis([
      { id: "session-0", startTime: "2026-03-05T10:00:00Z" },
      { id: "session-1", startTime: "2026-03-03T10:00:00Z" },
    ])
    const costEstimate = makeCostEstimate(0.6)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.costTrend[0].date).toBe("2026-03-03")
    expect(result.costTrend[1].date).toBe("2026-03-05")
  })
})

// ---------------------------------------------------------------------------
// promptToFixRatio
// ---------------------------------------------------------------------------

describe("computeProductivityStats — promptToFixRatio", () => {
  it("returns 0 when there are no correction chains", () => {
    const data = createTestData([
      { role: "user", content: "write a function" },
      { role: "assistant", content: "here you go" },
      { role: "user", content: "thanks" },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.promptToFixRatio).toBe(0)
  })

  it("detects a single correction chain and computes ratio", () => {
    // 1 chain with 2 correction messages → ratio = 2/1 = 2
    const data = createTestData([
      { role: "user", content: "write a function" },
      { role: "assistant", content: "here you go" },
      { role: "user", content: "no that's wrong" },    // correction 1
      { role: "assistant", content: "how about this" },
      { role: "user", content: "fix the indentation" },  // correction 2 (same chain)
      { role: "assistant", content: "fixed" },
      { role: "user", content: "thanks" },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    // 2 correction messages / 1 chain = 2
    expect(result.promptToFixRatio).toBe(2)
  })

  it("counts distinct correction chains correctly", () => {
    // Chain 1: 1 correction, Chain 2: 1 correction → ratio = 2/2 = 1
    const data = createTestData([
      { role: "user", content: "write a function" },
      { role: "assistant", content: "here" },
      { role: "user", content: "no that's wrong" },       // chain 1 correction
      { role: "assistant", content: "ok here" },
      { role: "user", content: "looks good, now add tests" }, // breaks chain (positive/neutral)
      { role: "assistant", content: "sure" },
      { role: "user", content: "wrong approach" },         // chain 2 correction
      { role: "assistant", content: "got it" },
      { role: "user", content: "perfect" },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.promptToFixRatio).toBeCloseTo(1)
  })

  it("recognises all correction keywords", () => {
    const correctionKeywords = ["wrong", "fix", "that's not", "try again", "incorrect", "not what", "instead"]
    for (const kw of correctionKeywords) {
      const data = createTestData([
        { role: "user", content: "do something" },
        { role: "assistant", content: "done" },
        { role: "user", content: `${kw} please redo` },
        { role: "assistant", content: "ok" },
      ])
      const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
      const costEstimate = makeCostEstimate(0)

      const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
      expect(result.promptToFixRatio).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// successRate
// ---------------------------------------------------------------------------

describe("computeProductivityStats — successRate", () => {
  it("returns 1 when all sessions end positively", () => {
    const data = createMultiSessionData([
      {
        messages: [
          { role: "user", content: "write a function" },
          { role: "assistant", content: "here" },
          { role: "user", content: "thanks, works great" },
        ],
      },
      {
        messages: [
          { role: "user", content: "add a test" },
          { role: "assistant", content: "done" },
          { role: "user", content: "perfect, lgtm" },
        ],
      },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "session-0" }, { id: "session-1" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.successRate).toBe(1)
  })

  it("returns 0 when all sessions end with corrections", () => {
    const data = createMultiSessionData([
      {
        messages: [
          { role: "user", content: "write a function" },
          { role: "assistant", content: "here" },
          { role: "user", content: "no that's wrong" },
        ],
      },
      {
        messages: [
          { role: "user", content: "add a test" },
          { role: "assistant", content: "done" },
          { role: "user", content: "incorrect" },
        ],
      },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "session-0" }, { id: "session-1" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.successRate).toBe(0)
  })

  it("counts neutral last messages as successes", () => {
    const data = createTestData([
      { role: "user", content: "do something" },
      { role: "assistant", content: "done" },
      { role: "user", content: "ok" },  // neutral
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.successRate).toBe(1)
  })

  it("returns 0 for empty sessions", () => {
    const data = { source: "claude-code" as const, sessions: [], metadata: { totalFiles: 0, earliestTimestamp: "", latestTimestamp: "", projectPaths: [] } }
    const sessionAnalysis: SessionAnalysis = { sessions: [], timeline: [] }
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.successRate).toBe(0)
  })

  it("handles session with no user messages as success (neutral)", () => {
    const data = createTestData([
      { role: "assistant", content: "starting up" },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.successRate).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// avgResponseGapSeconds
// ---------------------------------------------------------------------------

describe("computeProductivityStats — avgResponseGapSeconds", () => {
  it("returns 0 when there are no sessions", () => {
    const data = { source: "claude-code" as const, sessions: [], metadata: { totalFiles: 0, earliestTimestamp: "", latestTimestamp: "", projectPaths: [] } }
    const sessionAnalysis: SessionAnalysis = { sessions: [], timeline: [] }
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.avgResponseGapSeconds).toBe(0)
  })

  it("returns 0 when a session has only one user message", () => {
    const data = createTestData([
      { role: "user", content: "hi", timestamp: "2026-03-01T10:00:00Z" },
      { role: "assistant", content: "hello", timestamp: "2026-03-01T10:00:30Z" },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.avgResponseGapSeconds).toBe(0)
  })

  it("computes median gap between consecutive user messages", () => {
    // gaps: 120s, 60s, 180s  → sorted: 60, 120, 180  → median = 120
    const data = createTestData([
      { role: "user",      content: "msg1", timestamp: "2026-03-01T10:00:00Z" },
      { role: "assistant", content: "r1",   timestamp: "2026-03-01T10:00:30Z" },
      { role: "user",      content: "msg2", timestamp: "2026-03-01T10:02:00Z" }, // +120s
      { role: "assistant", content: "r2",   timestamp: "2026-03-01T10:02:30Z" },
      { role: "user",      content: "msg3", timestamp: "2026-03-01T10:03:00Z" }, // +60s
      { role: "assistant", content: "r3",   timestamp: "2026-03-01T10:03:30Z" },
      { role: "user",      content: "msg4", timestamp: "2026-03-01T10:06:00Z" }, // +180s
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.avgResponseGapSeconds).toBe(120)
  })

  it("handles even number of gaps by using lower median", () => {
    // gaps: 60s, 120s → sorted: 60, 120 → median index floor((2-1)/2)=0 → 60
    const data = createTestData([
      { role: "user",      content: "msg1", timestamp: "2026-03-01T10:00:00Z" },
      { role: "assistant", content: "r1",   timestamp: "2026-03-01T10:00:30Z" },
      { role: "user",      content: "msg2", timestamp: "2026-03-01T10:01:00Z" }, // +60s
      { role: "assistant", content: "r2",   timestamp: "2026-03-01T10:01:30Z" },
      { role: "user",      content: "msg3", timestamp: "2026-03-01T10:03:00Z" }, // +120s
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.avgResponseGapSeconds).toBe(60)
  })
})

// ---------------------------------------------------------------------------
// toolEfficiency
// ---------------------------------------------------------------------------

describe("computeProductivityStats — toolEfficiency", () => {
  it("returns empty array when no messages have tool calls", () => {
    const data = createTestData([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.toolEfficiency).toEqual([])
  })

  it("counts calls and errors per tool correctly", () => {
    // 2 calls to "read_file": 1 error, 1 success
    // 1 call to "write_file": 0 errors
    const data = createTestData([
      {
        role: "assistant",
        content: "using tools",
        toolCalls: [
          { id: "tc1", name: "read_file", input: {} },
          { id: "tc2", name: "read_file", input: {} },
          { id: "tc3", name: "write_file", input: {} },
        ],
        toolResults: [
          { toolCallId: "tc1", content: "file contents", isError: false },
          { toolCallId: "tc2", content: "error: not found", isError: true },
          { toolCallId: "tc3", content: "written", isError: false },
        ],
      },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    const readFile = result.toolEfficiency.find((t) => t.name === "read_file")
    const writeFile = result.toolEfficiency.find((t) => t.name === "write_file")

    expect(readFile).toBeDefined()
    expect(readFile!.totalCalls).toBe(2)
    expect(readFile!.errors).toBe(1)
    expect(readFile!.errorRate).toBeCloseTo(0.5)

    expect(writeFile).toBeDefined()
    expect(writeFile!.totalCalls).toBe(1)
    expect(writeFile!.errors).toBe(0)
    expect(writeFile!.errorRate).toBe(0)
  })

  it("handles tool calls with no matching tool results (no errors counted)", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "calling tool",
        toolCalls: [
          { id: "tc1", name: "bash", input: {} },
        ],
        // no toolResults
      },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.toolEfficiency).toHaveLength(1)
    expect(result.toolEfficiency[0].name).toBe("bash")
    expect(result.toolEfficiency[0].totalCalls).toBe(1)
    expect(result.toolEfficiency[0].errors).toBe(0)
    expect(result.toolEfficiency[0].errorRate).toBe(0)
  })

  it("sorts tools by error rate descending", () => {
    // tool_a: 1/1 = 1.0 error rate, tool_b: 0/1 = 0 error rate
    const data = createTestData([
      {
        role: "assistant",
        content: "tools",
        toolCalls: [
          { id: "tc1", name: "tool_a", input: {} },
          { id: "tc2", name: "tool_b", input: {} },
        ],
        toolResults: [
          { toolCallId: "tc1", content: "err", isError: true },
          { toolCallId: "tc2", content: "ok", isError: false },
        ],
      },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.toolEfficiency[0].name).toBe("tool_a")
    expect(result.toolEfficiency[1].name).toBe("tool_b")
  })

  it("aggregates tool calls across multiple sessions", () => {
    const data = createMultiSessionData([
      {
        messages: [
          {
            role: "assistant",
            content: "t",
            toolCalls: [{ id: "tc1", name: "bash", input: {} }],
            toolResults: [{ toolCallId: "tc1", content: "ok", isError: false }],
          },
        ],
      },
      {
        messages: [
          {
            role: "assistant",
            content: "t",
            toolCalls: [{ id: "tc2", name: "bash", input: {} }],
            toolResults: [{ toolCallId: "tc2", content: "err", isError: true }],
          },
        ],
      },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "session-0" }, { id: "session-1" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    const bash = result.toolEfficiency.find((t) => t.name === "bash")
    expect(bash!.totalCalls).toBe(2)
    expect(bash!.errors).toBe(1)
    expect(bash!.errorRate).toBeCloseTo(0.5)
  })
})

// ---------------------------------------------------------------------------
// avgIterationSpeedMinutes
// ---------------------------------------------------------------------------

describe("computeProductivityStats — avgIterationSpeedMinutes", () => {
  it("returns 0 when there are no sessions", () => {
    const data = { source: "claude-code" as const, sessions: [], metadata: { totalFiles: 0, earliestTimestamp: "", latestTimestamp: "", projectPaths: [] } }
    const sessionAnalysis: SessionAnalysis = { sessions: [], timeline: [] }
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.avgIterationSpeedMinutes).toBe(0)
  })

  it("computes mean of session durationMinutes", () => {
    const sessionAnalysis = makeSessionAnalysis([
      { id: "s0", durationMinutes: 10 },
      { id: "s1", durationMinutes: 30 },
      { id: "s2", durationMinutes: 20 },
    ])
    const data = createMultiSessionData([
      { messages: [] },
      { messages: [] },
      { messages: [] },
    ])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.avgIterationSpeedMinutes).toBeCloseTo(20)
  })

  it("returns exact value for a single session", () => {
    const sessionAnalysis = makeSessionAnalysis([{ id: "s0", durationMinutes: 45 }])
    const data = createTestData([])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.avgIterationSpeedMinutes).toBe(45)
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("computeProductivityStats — edge cases", () => {
  it("handles fully empty trace data without throwing", () => {
    const data = { source: "claude-code" as const, sessions: [], metadata: { totalFiles: 0, earliestTimestamp: "", latestTimestamp: "", projectPaths: [] } }
    const sessionAnalysis: SessionAnalysis = { sessions: [], timeline: [] }
    const costEstimate = makeCostEstimate(0)

    expect(() => computeProductivityStats(data, sessionAnalysis, costEstimate)).not.toThrow()
    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.avgCostPerSession).toBe(0)
    expect(result.mostExpensiveSession).toBeNull()
    expect(result.costTrend).toEqual([])
    expect(result.promptToFixRatio).toBe(0)
    expect(result.successRate).toBe(0)
    expect(result.avgResponseGapSeconds).toBe(0)
    expect(result.toolEfficiency).toEqual([])
    expect(result.avgIterationSpeedMinutes).toBe(0)
  })

  it("handles sessions with messages but no tokens", () => {
    const data = createTestData([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ])
    const sessionAnalysis = makeSessionAnalysis([{ id: "test-session" }])
    const costEstimate = makeCostEstimate(0)

    const result = computeProductivityStats(data, sessionAnalysis, costEstimate)
    expect(result.mostExpensiveSession).toBeNull()
    expect(result.costTrend).toEqual([])
  })
})
