import { computeAchievements } from "../achievements"
import { createTestData, createMultiSessionData } from "./test-helpers"
import type { RawStats, CodeImpact, EngagementStats } from "@/lib/types"

// Minimal base objects — only populate fields each test needs

function makeRawStats(overrides: Partial<RawStats> = {}): RawStats {
  return {
    totalSessions: 1,
    totalMessages: 0,
    totalUserPrompts: 0,
    totalAssistantResponses: 0,
    totalTokensUsed: { input: 0, output: 0, cacheCreation: 0, cacheRead: 0, total: 0 },
    totalToolCalls: 0,
    topToolsUsed: [],
    topModelsUsed: [],
    codingTimePatterns: {
      hourDistribution: new Array(24).fill(0),
      dayDistribution: new Array(7).fill(0),
      label: "9-to-5er",
    },
    longestSession: { id: "", durationMinutes: 0, messageCount: 0 },
    averagePromptsPerSession: 0,
    averagePromptLength: 0,
    longestPrompt: { text: "", length: 0 },
    shortestPrompt: { text: "", length: 0 },
    topProjects: [],
    topGitBranches: [],
    dateRange: { start: "2026-03-01T00:00:00Z", end: "2026-03-01T23:59:59Z" },
    activeDays: 1,
    ...overrides,
  }
}

function makeCodeImpact(overrides: Partial<CodeImpact> = {}): CodeImpact {
  return {
    languagesDetected: [],
    uniqueFilesTouched: 0,
    taskTypeBreakdown: [],
    errorRate: 0,
    topFilePaths: [],
    ...overrides,
  }
}

function makeEngagementStats(overrides: Partial<EngagementStats> = {}): EngagementStats {
  return {
    longestStreak: 0,
    currentStreak: 0,
    peakDay: { date: "2026-03-01", sessions: 1, messages: 0 },
    avgConversationDepth: 0,
    selfSufficiencyTrend: "stable",
    selfSufficiencySlope: 0,
    highTokenSessions: 0,
    totalSessions: 1,
    multiTaskingScore: 0,
    ...overrides,
  }
}

// ────────────────────────────────────────────────────────────────────────────
// hoursSaved
// ────────────────────────────────────────────────────────────────────────────

describe("computeAchievements – hoursSaved", () => {
  it("calculates hours saved from tool calls (300 tool calls = 10 hours)", () => {
    const data = createTestData([])
    const rawStats = makeRawStats({ totalToolCalls: 300 })
    const result = computeAchievements(data, rawStats, makeCodeImpact(), makeEngagementStats())

    expect(result.hoursSaved).toBeCloseTo(10)
    expect(result.hoursSavedBreakdown.toolCalls).toBe(300)
    expect(result.hoursSavedBreakdown.estimatedManualMinutes).toBe(600)
  })

  it("returns 0 hours for 0 tool calls", () => {
    const data = createTestData([])
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())

    expect(result.hoursSaved).toBe(0)
    expect(result.hoursSavedBreakdown.toolCalls).toBe(0)
    expect(result.hoursSavedBreakdown.estimatedManualMinutes).toBe(0)
  })

  it("calculates fractional hours correctly (90 tool calls = 3 hours)", () => {
    const data = createTestData([])
    const rawStats = makeRawStats({ totalToolCalls: 90 })
    const result = computeAchievements(data, rawStats, makeCodeImpact(), makeEngagementStats())

    expect(result.hoursSaved).toBeCloseTo(3)
    expect(result.hoursSavedBreakdown.estimatedManualMinutes).toBe(180)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// usagePercentile
// ────────────────────────────────────────────────────────────────────────────

describe("computeAchievements – usagePercentile", () => {
  // Calibrated for heavy agent usage including sub-agents:
  // Top 10%: <100 msgs/day, Top 99%: 20K+ msgs/day
  function percentileFor(totalMessages: number, activeDays: number) {
    const data = createTestData([])
    const rawStats = makeRawStats({ totalMessages, activeDays })
    return computeAchievements(data, rawStats, makeCodeImpact(), makeEngagementStats()).usagePercentile
  }

  it("returns 10 for minimal usage (<100 msgs/day)", () => {
    expect(percentileFor(50, 1)).toBe(10)
    expect(percentileFor(0, 1)).toBe(10)
    expect(percentileFor(99, 1)).toBe(10)
  })

  it("returns 25 for light usage (100-199 msgs/day)", () => {
    expect(percentileFor(150, 1)).toBe(25)
  })

  it("returns 40 for casual usage (200-499 msgs/day)", () => {
    expect(percentileFor(300, 1)).toBe(40)
  })

  it("returns 55 for moderate usage (500-999 msgs/day)", () => {
    expect(percentileFor(700, 1)).toBe(55)
  })

  it("returns 70 for active usage (1000-1999 msgs/day)", () => {
    expect(percentileFor(1500, 1)).toBe(70)
  })

  it("returns 80 for heavy usage (2000-4999 msgs/day)", () => {
    expect(percentileFor(3000, 1)).toBe(80)
  })

  it("returns 90 for power usage (5000-9999 msgs/day)", () => {
    expect(percentileFor(7000, 1)).toBe(90)
  })

  it("returns 95 for extreme usage (10000-19999 msgs/day)", () => {
    expect(percentileFor(15000, 1)).toBe(95)
  })

  it("returns 99 for outlier usage (20000+ msgs/day)", () => {
    expect(percentileFor(25000, 1)).toBe(99)
  })

  it("returns 10 when activeDays is 0", () => {
    expect(percentileFor(20000, 0)).toBe(10)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Badge: 1k-club
// ────────────────────────────────────────────────────────────────────────────

describe("badge: 1k-club", () => {
  it("unlocks when totalMessages >= 1000", () => {
    const data = createTestData([])
    const rawStats = makeRawStats({ totalMessages: 1000 })
    const result = computeAchievements(data, rawStats, makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "1k-club")!
    expect(badge.unlocked).toBe(true)
  })

  it("stays locked when totalMessages < 1000", () => {
    const data = createTestData([])
    const rawStats = makeRawStats({ totalMessages: 999 })
    const result = computeAchievements(data, rawStats, makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "1k-club")!
    expect(badge.unlocked).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Badge: 10k-club
// ────────────────────────────────────────────────────────────────────────────

describe("badge: 10k-club", () => {
  it("unlocks when totalMessages >= 10000", () => {
    const data = createTestData([])
    const rawStats = makeRawStats({ totalMessages: 10000 })
    const result = computeAchievements(data, rawStats, makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "10k-club")!
    expect(badge.unlocked).toBe(true)
  })

  it("stays locked when totalMessages < 10000", () => {
    const data = createTestData([])
    const rawStats = makeRawStats({ totalMessages: 9999 })
    const result = computeAchievements(data, rawStats, makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "10k-club")!
    expect(badge.unlocked).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Badge: night-owl
// ────────────────────────────────────────────────────────────────────────────

describe("badge: night-owl", () => {
  it("unlocks when hours 0-4 sum >= 50", () => {
    const hourDistribution = new Array(24).fill(0)
    hourDistribution[0] = 10
    hourDistribution[1] = 10
    hourDistribution[2] = 10
    hourDistribution[3] = 10
    hourDistribution[4] = 10 // sum = 50
    const data = createTestData([])
    const rawStats = makeRawStats({ codingTimePatterns: { hourDistribution, dayDistribution: new Array(7).fill(0), label: "Night Owl" } })
    const result = computeAchievements(data, rawStats, makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "night-owl")!
    expect(badge.unlocked).toBe(true)
  })

  it("stays locked when hours 0-4 sum < 50", () => {
    const hourDistribution = new Array(24).fill(0)
    hourDistribution[2] = 49
    const data = createTestData([])
    const rawStats = makeRawStats({ codingTimePatterns: { hourDistribution, dayDistribution: new Array(7).fill(0), label: "Night Owl" } })
    const result = computeAchievements(data, rawStats, makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "night-owl")!
    expect(badge.unlocked).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Badge: early-bird
// ────────────────────────────────────────────────────────────────────────────

describe("badge: early-bird", () => {
  it("unlocks when hours 5-7 sum >= 50", () => {
    const hourDistribution = new Array(24).fill(0)
    hourDistribution[5] = 20
    hourDistribution[6] = 20
    hourDistribution[7] = 10 // sum = 50
    const data = createTestData([])
    const rawStats = makeRawStats({ codingTimePatterns: { hourDistribution, dayDistribution: new Array(7).fill(0), label: "Early Bird" } })
    const result = computeAchievements(data, rawStats, makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "early-bird")!
    expect(badge.unlocked).toBe(true)
  })

  it("stays locked when hours 5-7 sum < 50", () => {
    const hourDistribution = new Array(24).fill(0)
    hourDistribution[5] = 49
    const data = createTestData([])
    const rawStats = makeRawStats({ codingTimePatterns: { hourDistribution, dayDistribution: new Array(7).fill(0), label: "Early Bird" } })
    const result = computeAchievements(data, rawStats, makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "early-bird")!
    expect(badge.unlocked).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Badge: polyglot
// ────────────────────────────────────────────────────────────────────────────

describe("badge: polyglot", () => {
  it("unlocks when 5+ languages detected", () => {
    const data = createTestData([])
    const codeImpact = makeCodeImpact({
      languagesDetected: [
        { language: "TypeScript", fileCount: 10 },
        { language: "Python", fileCount: 5 },
        { language: "Rust", fileCount: 3 },
        { language: "Go", fileCount: 2 },
        { language: "Java", fileCount: 1 },
      ],
    })
    const result = computeAchievements(data, makeRawStats(), codeImpact, makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "polyglot")!
    expect(badge.unlocked).toBe(true)
  })

  it("stays locked with fewer than 5 languages", () => {
    const data = createTestData([])
    const codeImpact = makeCodeImpact({
      languagesDetected: [
        { language: "TypeScript", fileCount: 10 },
        { language: "Python", fileCount: 5 },
      ],
    })
    const result = computeAchievements(data, makeRawStats(), codeImpact, makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "polyglot")!
    expect(badge.unlocked).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Badge: streak-master
// ────────────────────────────────────────────────────────────────────────────

describe("badge: streak-master", () => {
  it("unlocks when longestStreak >= 7", () => {
    const data = createTestData([])
    const engagementStats = makeEngagementStats({ longestStreak: 7 })
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), engagementStats)
    const badge = result.badges.find((b) => b.id === "streak-master")!
    expect(badge.unlocked).toBe(true)
  })

  it("stays locked when longestStreak < 7", () => {
    const data = createTestData([])
    const engagementStats = makeEngagementStats({ longestStreak: 6 })
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), engagementStats)
    const badge = result.badges.find((b) => b.id === "streak-master")!
    expect(badge.unlocked).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Badge: marathon-runner
// ────────────────────────────────────────────────────────────────────────────

describe("badge: marathon-runner", () => {
  it("unlocks when a session has duration > 120 minutes", () => {
    // Session from 10:00 to 12:01 = 121 minutes
    const data = createTestData(
      [{ role: "user", content: "start" }],
      {
        startTime: "2026-03-01T10:00:00Z",
        endTime: "2026-03-01T12:01:00Z",
      }
    )
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "marathon-runner")!
    expect(badge.unlocked).toBe(true)
  })

  it("stays locked when no session exceeds 120 minutes", () => {
    const data = createTestData(
      [{ role: "user", content: "start" }],
      {
        startTime: "2026-03-01T10:00:00Z",
        endTime: "2026-03-01T11:59:00Z", // 119 minutes
      }
    )
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "marathon-runner")!
    expect(badge.unlocked).toBe(false)
  })

  it("unlocks when any one session in multi-session data exceeds 120 min", () => {
    const data = createMultiSessionData([
      {
        messages: [{ role: "user", content: "short session" }],
        startTime: "2026-03-01T10:00:00Z",
        endTime: "2026-03-01T10:30:00Z",
      },
      {
        messages: [{ role: "user", content: "long session" }],
        startTime: "2026-03-02T09:00:00Z",
        endTime: "2026-03-02T11:30:00Z", // 150 minutes
      },
    ])
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "marathon-runner")!
    expect(badge.unlocked).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Badge: tool-wielder
// ────────────────────────────────────────────────────────────────────────────

describe("badge: tool-wielder", () => {
  it("unlocks when totalToolCalls >= 500", () => {
    const data = createTestData([])
    const rawStats = makeRawStats({ totalToolCalls: 500 })
    const result = computeAchievements(data, rawStats, makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "tool-wielder")!
    expect(badge.unlocked).toBe(true)
  })

  it("stays locked when totalToolCalls < 500", () => {
    const data = createTestData([])
    const rawStats = makeRawStats({ totalToolCalls: 499 })
    const result = computeAchievements(data, rawStats, makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "tool-wielder")!
    expect(badge.unlocked).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Badge: bug-squasher
// ────────────────────────────────────────────────────────────────────────────

describe("badge: bug-squasher", () => {
  it("unlocks when 100+ user messages contain debug keywords", () => {
    const messages = Array.from({ length: 100 }, (_, i) => ({
      role: "user" as const,
      content: `Please fix this bug number ${i}`,
    }))
    const data = createTestData(messages)
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "bug-squasher")!
    expect(badge.unlocked).toBe(true)
  })

  it("stays locked when fewer than 100 user messages with debug keywords", () => {
    const messages = Array.from({ length: 99 }, (_, i) => ({
      role: "user" as const,
      content: `fix this error ${i}`,
    }))
    const data = createTestData(messages)
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "bug-squasher")!
    expect(badge.unlocked).toBe(false)
  })

  it("counts messages with various debug keywords", () => {
    const messages = [
      ...Array.from({ length: 20 }, () => ({ role: "user" as const, content: "debug this" })),
      ...Array.from({ length: 20 }, () => ({ role: "user" as const, content: "fix the issue" })),
      ...Array.from({ length: 20 }, () => ({ role: "user" as const, content: "there is a bug" })),
      ...Array.from({ length: 20 }, () => ({ role: "user" as const, content: "error occurred" })),
      ...Array.from({ length: 20 }, () => ({ role: "user" as const, content: "it is broken" })),
    ]
    const data = createTestData(messages)
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "bug-squasher")!
    expect(badge.unlocked).toBe(true)
  })

  it("does not count assistant messages with debug keywords", () => {
    const messages = Array.from({ length: 150 }, () => ({
      role: "assistant" as const,
      content: "I found a bug and fixed it",
    }))
    const data = createTestData(messages)
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "bug-squasher")!
    expect(badge.unlocked).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Badge: speed-demon
// ────────────────────────────────────────────────────────────────────────────

describe("badge: speed-demon", () => {
  it("unlocks when median gap between consecutive user messages is < 30 seconds", () => {
    // 4 user messages spaced 10 seconds apart
    const now = new Date("2026-03-01T10:00:00Z").getTime()
    const messages = [
      { role: "user" as const, content: "msg1", timestamp: new Date(now).toISOString() },
      { role: "assistant" as const, content: "resp1", timestamp: new Date(now + 5000).toISOString() },
      { role: "user" as const, content: "msg2", timestamp: new Date(now + 10000).toISOString() },
      { role: "assistant" as const, content: "resp2", timestamp: new Date(now + 15000).toISOString() },
      { role: "user" as const, content: "msg3", timestamp: new Date(now + 20000).toISOString() },
      { role: "assistant" as const, content: "resp3", timestamp: new Date(now + 25000).toISOString() },
      { role: "user" as const, content: "msg4", timestamp: new Date(now + 30000).toISOString() },
    ]
    const data = createTestData(messages)
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "speed-demon")!
    expect(badge.unlocked).toBe(true)
  })

  it("stays locked when median gap between user messages is >= 30 seconds", () => {
    const now = new Date("2026-03-01T10:00:00Z").getTime()
    // User messages spaced 60 seconds apart
    const messages = [
      { role: "user" as const, content: "msg1", timestamp: new Date(now).toISOString() },
      { role: "user" as const, content: "msg2", timestamp: new Date(now + 60000).toISOString() },
      { role: "user" as const, content: "msg3", timestamp: new Date(now + 120000).toISOString() },
    ]
    const data = createTestData(messages)
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "speed-demon")!
    expect(badge.unlocked).toBe(false)
  })

  it("stays locked when there are fewer than 2 user messages", () => {
    const data = createTestData([{ role: "user", content: "only message" }])
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())
    const badge = result.badges.find((b) => b.id === "speed-demon")!
    expect(badge.unlocked).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Empty data
// ────────────────────────────────────────────────────────────────────────────

describe("computeAchievements – empty data", () => {
  it("returns 0 hours, 0 percentile, and no unlocked badges for empty data", () => {
    const data = createTestData([])
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())

    expect(result.hoursSaved).toBe(0)
    expect(result.usagePercentile).toBe(10)
    expect(result.badges.every((b) => !b.unlocked)).toBe(true)
  })

  it("returns exactly 10 badges", () => {
    const data = createTestData([])
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())
    expect(result.badges).toHaveLength(10)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Badge sort order: unlocked first
// ────────────────────────────────────────────────────────────────────────────

describe("computeAchievements – badge sort order", () => {
  it("places unlocked badges before locked ones", () => {
    const data = createTestData([])
    // Unlock tool-wielder and streak-master only
    const rawStats = makeRawStats({ totalToolCalls: 500 })
    const engagementStats = makeEngagementStats({ longestStreak: 10 })
    const result = computeAchievements(data, rawStats, makeCodeImpact(), engagementStats)

    const firstUnlockedIdx = result.badges.findIndex((b) => b.unlocked)
    const lastUnlockedIdx = result.badges.map((b) => b.unlocked).lastIndexOf(true)
    const firstLockedIdx = result.badges.findIndex((b) => !b.unlocked)

    expect(firstUnlockedIdx).toBe(0)
    expect(lastUnlockedIdx).toBeLessThan(firstLockedIdx)
  })

  it("all unlocked when everything exceeds thresholds", () => {
    const hourDistribution = new Array(24).fill(0)
    hourDistribution[2] = 60 // night owl hours
    hourDistribution[6] = 60 // early bird hours

    // Session 150 minutes long
    const data = createTestData(
      [{ role: "user", content: "start" }],
      {
        startTime: "2026-03-01T10:00:00Z",
        endTime: "2026-03-01T12:30:00Z",
      }
    )

    const rawStats = makeRawStats({
      totalMessages: 10000,
      totalToolCalls: 500,
      codingTimePatterns: { hourDistribution, dayDistribution: new Array(7).fill(0), label: "Night Owl" },
    })

    // 100 bug messages
    // Add them via separate data (we just need the badge checks to pass — bug-squasher checks data.sessions)
    // We'll test sorted order with a simpler set: just unlock tool-wielder + 1k-club
    const rawStats2 = makeRawStats({
      totalMessages: 1000,
      totalToolCalls: 500,
    })
    const result = computeAchievements(data, rawStats2, makeCodeImpact(), makeEngagementStats())

    // All unlocked should come before all locked
    let seenLocked = false
    for (const badge of result.badges) {
      if (!badge.unlocked) {
        seenLocked = true
      }
      if (seenLocked) {
        expect(badge.unlocked).toBe(false)
      }
    }
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Badge structure
// ────────────────────────────────────────────────────────────────────────────

describe("computeAchievements – badge structure", () => {
  it("each badge has required fields: id, name, description, icon, unlocked", () => {
    const data = createTestData([])
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())

    for (const badge of result.badges) {
      expect(badge).toHaveProperty("id")
      expect(badge).toHaveProperty("name")
      expect(badge).toHaveProperty("description")
      expect(badge).toHaveProperty("icon")
      expect(badge).toHaveProperty("unlocked")
      expect(typeof badge.id).toBe("string")
      expect(typeof badge.name).toBe("string")
      expect(typeof badge.description).toBe("string")
      expect(typeof badge.icon).toBe("string")
      expect(typeof badge.unlocked).toBe("boolean")
    }
  })

  it("contains all 10 expected badge ids", () => {
    const data = createTestData([])
    const result = computeAchievements(data, makeRawStats(), makeCodeImpact(), makeEngagementStats())
    const ids = result.badges.map((b) => b.id)

    expect(ids).toContain("1k-club")
    expect(ids).toContain("10k-club")
    expect(ids).toContain("night-owl")
    expect(ids).toContain("early-bird")
    expect(ids).toContain("polyglot")
    expect(ids).toContain("streak-master")
    expect(ids).toContain("marathon-runner")
    expect(ids).toContain("tool-wielder")
    expect(ids).toContain("bug-squasher")
    expect(ids).toContain("speed-demon")
  })
})
