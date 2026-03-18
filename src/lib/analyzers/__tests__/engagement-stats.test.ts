import { computeEngagementStats } from "../engagement-stats"
import type { SessionAnalysis, SessionDetail } from "@/lib/types/analysis"
import type { TraceData } from "@/lib/types/trace"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(
  overrides: Partial<SessionDetail> & { startTime: string }
): SessionDetail {
  return {
    id: overrides.id ?? `session-${Math.random()}`,
    startTime: overrides.startTime,
    endTime: overrides.endTime ?? overrides.startTime,
    project: overrides.project ?? "/test/project",
    durationMinutes: overrides.durationMinutes ?? 30,
    messageCount: overrides.messageCount ?? 4,
    userPromptCount: overrides.userPromptCount ?? 2,
    tokenCount: overrides.tokenCount ?? 0,
    toolCallCount: overrides.toolCallCount ?? 0,
    errorCount: overrides.errorCount ?? 0,
    topTools: overrides.topTools ?? [],
    userPrompts: overrides.userPrompts ?? [],
    messages: overrides.messages ?? [],
  }
}

function makeSessionAnalysis(sessions: SessionDetail[]): SessionAnalysis {
  return {
    sessions,
    timeline: [],
  }
}

function makeTraceData(latestTimestamp: string): TraceData {
  return {
    source: "claude-code",
    sessions: [],
    metadata: {
      totalFiles: 0,
      earliestTimestamp: "2026-01-01T00:00:00Z",
      latestTimestamp,
      projectPaths: [],
    },
  }
}

// ---------------------------------------------------------------------------
// longestStreak
// ---------------------------------------------------------------------------

describe("computeEngagementStats – longestStreak", () => {
  it("returns 0 for empty sessions", () => {
    const result = computeEngagementStats(
      makeTraceData("2026-03-10T10:00:00Z"),
      makeSessionAnalysis([])
    )
    expect(result.longestStreak).toBe(0)
  })

  it("returns 1 for a single session", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z" }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-01T10:00:00Z"),
      sa
    )
    expect(result.longestStreak).toBe(1)
  })

  it("returns 1 when all sessions are on the same day", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T09:00:00Z" }),
      makeSession({ startTime: "2026-03-01T14:00:00Z" }),
      makeSession({ startTime: "2026-03-01T20:00:00Z" }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-01T20:00:00Z"),
      sa
    )
    expect(result.longestStreak).toBe(1)
  })

  it("counts 3 consecutive days as streak of 3", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z" }),
      makeSession({ startTime: "2026-03-02T10:00:00Z" }),
      makeSession({ startTime: "2026-03-03T10:00:00Z" }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-03T10:00:00Z"),
      sa
    )
    expect(result.longestStreak).toBe(3)
  })

  it("picks the longer run when there are two streaks with a gap", () => {
    // 3 consecutive days, then a gap, then 2 consecutive → longest = 3
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z" }),
      makeSession({ startTime: "2026-03-02T10:00:00Z" }),
      makeSession({ startTime: "2026-03-03T10:00:00Z" }),
      // gap on 2026-03-04
      makeSession({ startTime: "2026-03-05T10:00:00Z" }),
      makeSession({ startTime: "2026-03-06T10:00:00Z" }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-06T10:00:00Z"),
      sa
    )
    expect(result.longestStreak).toBe(3)
  })

  it("de-duplicates dates from multiple sessions on the same day", () => {
    // Two sessions on day 1, one on day 2 – streak should be 2
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T09:00:00Z" }),
      makeSession({ startTime: "2026-03-01T18:00:00Z" }),
      makeSession({ startTime: "2026-03-02T10:00:00Z" }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-02T10:00:00Z"),
      sa
    )
    expect(result.longestStreak).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// currentStreak
// ---------------------------------------------------------------------------

describe("computeEngagementStats – currentStreak", () => {
  it("returns 0 when the most recent active date is not today or yesterday", () => {
    // latestTimestamp is 2026-03-10 but last session date is 2026-03-06
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-05T10:00:00Z" }),
      makeSession({ startTime: "2026-03-06T10:00:00Z" }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-10T10:00:00Z"),
      sa
    )
    expect(result.currentStreak).toBe(0)
  })

  it("counts a streak ending at the most recent date", () => {
    // sessions on 03-04, 03-05, 03-06 and latest is 2026-03-06 → streak = 3
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-04T10:00:00Z" }),
      makeSession({ startTime: "2026-03-05T10:00:00Z" }),
      makeSession({ startTime: "2026-03-06T10:00:00Z" }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-06T23:59:59Z"),
      sa
    )
    expect(result.currentStreak).toBe(3)
  })

  it("handles a streak that is shorter than the overall longest streak", () => {
    // longest = 3 (Mar 01-03), but last active was 03-06 (standalone after gap)
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z" }),
      makeSession({ startTime: "2026-03-02T10:00:00Z" }),
      makeSession({ startTime: "2026-03-03T10:00:00Z" }),
      // gap
      makeSession({ startTime: "2026-03-06T10:00:00Z" }),
    ])
    // latestTimestamp = 2026-03-06 so current streak = 1
    const result = computeEngagementStats(
      makeTraceData("2026-03-06T23:59:59Z"),
      sa
    )
    expect(result.longestStreak).toBe(3)
    expect(result.currentStreak).toBe(1)
  })

  it("returns 0 for empty sessions", () => {
    const result = computeEngagementStats(
      makeTraceData("2026-03-10T10:00:00Z"),
      makeSessionAnalysis([])
    )
    expect(result.currentStreak).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// peakDay
// ---------------------------------------------------------------------------

describe("computeEngagementStats – peakDay", () => {
  it("returns empty strings for zero sessions", () => {
    const result = computeEngagementStats(
      makeTraceData("2026-03-10T10:00:00Z"),
      makeSessionAnalysis([])
    )
    expect(result.peakDay).toEqual({ date: "", sessions: 0, messages: 0 })
  })

  it("identifies the day with the most sessions", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z", messageCount: 5 }),
      makeSession({ startTime: "2026-03-01T14:00:00Z", messageCount: 3 }),
      makeSession({ startTime: "2026-03-02T10:00:00Z", messageCount: 10 }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-02T10:00:00Z"),
      sa
    )
    // 2026-03-01 has 2 sessions, 2026-03-02 has 1 → peak is 2026-03-01
    expect(result.peakDay.date).toBe("2026-03-01")
    expect(result.peakDay.sessions).toBe(2)
    expect(result.peakDay.messages).toBe(8)
  })

  it("breaks ties on session count by total messages", () => {
    // Two days with 1 session each; day 2 has more messages
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z", messageCount: 4 }),
      makeSession({ startTime: "2026-03-02T10:00:00Z", messageCount: 10 }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-02T10:00:00Z"),
      sa
    )
    expect(result.peakDay.date).toBe("2026-03-02")
    expect(result.peakDay.messages).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// avgConversationDepth
// ---------------------------------------------------------------------------

describe("computeEngagementStats – avgConversationDepth", () => {
  it("returns 0 for empty sessions", () => {
    const result = computeEngagementStats(
      makeTraceData("2026-03-10T10:00:00Z"),
      makeSessionAnalysis([])
    )
    expect(result.avgConversationDepth).toBe(0)
  })

  it("averages userPromptCount across sessions", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z", userPromptCount: 4 }),
      makeSession({ startTime: "2026-03-02T10:00:00Z", userPromptCount: 2 }),
      makeSession({ startTime: "2026-03-03T10:00:00Z", userPromptCount: 6 }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-03T10:00:00Z"),
      sa
    )
    // (4 + 2 + 6) / 3 = 4
    expect(result.avgConversationDepth).toBe(4)
  })

  it("handles a single session correctly", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z", userPromptCount: 7 }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-01T10:00:00Z"),
      sa
    )
    expect(result.avgConversationDepth).toBe(7)
  })
})

// ---------------------------------------------------------------------------
// selfSufficiencyTrend and selfSufficiencySlope
// ---------------------------------------------------------------------------

describe("computeEngagementStats – selfSufficiencyTrend", () => {
  it("returns 'stable' for empty sessions", () => {
    const result = computeEngagementStats(
      makeTraceData("2026-03-10T10:00:00Z"),
      makeSessionAnalysis([])
    )
    expect(result.selfSufficiencyTrend).toBe("stable")
    expect(result.selfSufficiencySlope).toBe(0)
  })

  it("returns 'stable' for a single session (slope not computable)", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z", durationMinutes: 30 }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-01T10:00:00Z"),
      sa
    )
    expect(result.selfSufficiencyTrend).toBe("stable")
  })

  it("returns 'improving' when session durations are sharply decreasing", () => {
    // Sessions sorted by startTime with steeply falling durations
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z", durationMinutes: 100 }),
      makeSession({ startTime: "2026-03-02T10:00:00Z", durationMinutes: 70 }),
      makeSession({ startTime: "2026-03-03T10:00:00Z", durationMinutes: 40 }),
      makeSession({ startTime: "2026-03-04T10:00:00Z", durationMinutes: 10 }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-04T10:00:00Z"),
      sa
    )
    expect(result.selfSufficiencyTrend).toBe("improving")
    expect(result.selfSufficiencySlope).toBeLessThan(-0.5)
  })

  it("returns 'declining' when session durations are sharply increasing", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z", durationMinutes: 10 }),
      makeSession({ startTime: "2026-03-02T10:00:00Z", durationMinutes: 40 }),
      makeSession({ startTime: "2026-03-03T10:00:00Z", durationMinutes: 70 }),
      makeSession({ startTime: "2026-03-04T10:00:00Z", durationMinutes: 100 }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-04T10:00:00Z"),
      sa
    )
    expect(result.selfSufficiencyTrend).toBe("declining")
    expect(result.selfSufficiencySlope).toBeGreaterThan(0.5)
  })

  it("returns 'stable' when durations are flat (slope near 0)", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z", durationMinutes: 30 }),
      makeSession({ startTime: "2026-03-02T10:00:00Z", durationMinutes: 30 }),
      makeSession({ startTime: "2026-03-03T10:00:00Z", durationMinutes: 30 }),
      makeSession({ startTime: "2026-03-04T10:00:00Z", durationMinutes: 30 }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-04T10:00:00Z"),
      sa
    )
    expect(result.selfSufficiencyTrend).toBe("stable")
    expect(result.selfSufficiencySlope).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// highTokenSessions
// ---------------------------------------------------------------------------

describe("computeEngagementStats – highTokenSessions", () => {
  it("returns 0 when no sessions exceed 100,000 tokens", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z", tokenCount: 50_000 }),
      makeSession({ startTime: "2026-03-02T10:00:00Z", tokenCount: 99_999 }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-02T10:00:00Z"),
      sa
    )
    expect(result.highTokenSessions).toBe(0)
  })

  it("counts sessions with tokenCount > 100,000", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z", tokenCount: 100_001 }),
      makeSession({ startTime: "2026-03-02T10:00:00Z", tokenCount: 200_000 }),
      makeSession({ startTime: "2026-03-03T10:00:00Z", tokenCount: 50_000 }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-03T10:00:00Z"),
      sa
    )
    expect(result.highTokenSessions).toBe(2)
  })

  it("does not count a session at exactly 100,000 tokens", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z", tokenCount: 100_000 }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-01T10:00:00Z"),
      sa
    )
    expect(result.highTokenSessions).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// totalSessions
// ---------------------------------------------------------------------------

describe("computeEngagementStats – totalSessions", () => {
  it("mirrors sessionDetails.sessions.length", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z" }),
      makeSession({ startTime: "2026-03-02T10:00:00Z" }),
      makeSession({ startTime: "2026-03-03T10:00:00Z" }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-03T10:00:00Z"),
      sa
    )
    expect(result.totalSessions).toBe(3)
  })

  it("returns 0 for empty sessions", () => {
    const result = computeEngagementStats(
      makeTraceData("2026-03-10T10:00:00Z"),
      makeSessionAnalysis([])
    )
    expect(result.totalSessions).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// multiTaskingScore
// ---------------------------------------------------------------------------

describe("computeEngagementStats – multiTaskingScore", () => {
  it("returns 0 for empty sessions", () => {
    const result = computeEngagementStats(
      makeTraceData("2026-03-10T10:00:00Z"),
      makeSessionAnalysis([])
    )
    expect(result.multiTaskingScore).toBe(0)
  })

  it("returns 1 when all sessions are in the same project", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z", project: "/proj/a" }),
      makeSession({ startTime: "2026-03-01T14:00:00Z", project: "/proj/a" }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-01T14:00:00Z"),
      sa
    )
    expect(result.multiTaskingScore).toBe(1)
  })

  it("averages unique projects per active day across multiple days", () => {
    // Day 1: projects A and B (2 unique), Day 2: project C only (1 unique)
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T09:00:00Z", project: "/proj/a" }),
      makeSession({ startTime: "2026-03-01T14:00:00Z", project: "/proj/b" }),
      makeSession({ startTime: "2026-03-02T10:00:00Z", project: "/proj/c" }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-02T10:00:00Z"),
      sa
    )
    // avg(2, 1) = 1.5
    expect(result.multiTaskingScore).toBe(1.5)
  })

  it("counts distinct projects per day, not total sessions", () => {
    // Day 1: 3 sessions in same project → still 1 unique project
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T08:00:00Z", project: "/proj/a" }),
      makeSession({ startTime: "2026-03-01T12:00:00Z", project: "/proj/a" }),
      makeSession({ startTime: "2026-03-01T18:00:00Z", project: "/proj/a" }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-01T18:00:00Z"),
      sa
    )
    expect(result.multiTaskingScore).toBe(1)
  })

  it("handles a single session with a unique project", () => {
    const sa = makeSessionAnalysis([
      makeSession({ startTime: "2026-03-01T10:00:00Z", project: "/proj/x" }),
    ])
    const result = computeEngagementStats(
      makeTraceData("2026-03-01T10:00:00Z"),
      sa
    )
    expect(result.multiTaskingScore).toBe(1)
  })
})
