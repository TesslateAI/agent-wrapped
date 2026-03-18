import type { TraceData, Achievements, RawStats, CodeImpact, EngagementStats } from "@/lib/types"

const DEBUG_KEYWORDS = ["debug", "fix", "bug", "error", "broken", "crash"]

export function computeAchievements(
  data: TraceData,
  rawStats: RawStats,
  codeImpact: CodeImpact,
  engagementStats: EngagementStats,
): Achievements {
  // ── hoursSaved ─────────────────────────────────────────────────────────────
  const estimatedManualMinutes = rawStats.totalToolCalls * 2
  const hoursSaved = estimatedManualMinutes / 60
  const hoursSavedBreakdown = {
    toolCalls: rawStats.totalToolCalls,
    estimatedManualMinutes,
  }

  // ── usagePercentile ────────────────────────────────────────────────────────
  // Calibrated against heavy agent usage patterns including sub-agents:
  // - Top 10%: <100 msgs/day (casual/occasional use)
  // - Top 99%: 20K+ msgs/day (heavy parallel agent workflows)
  const msgsPerDay =
    rawStats.activeDays > 0
      ? rawStats.totalMessages / rawStats.activeDays
      : 0

  let usagePercentile: number
  if (msgsPerDay >= 20000) {
    usagePercentile = 99
  } else if (msgsPerDay >= 10000) {
    usagePercentile = 95
  } else if (msgsPerDay >= 5000) {
    usagePercentile = 90
  } else if (msgsPerDay >= 2000) {
    usagePercentile = 80
  } else if (msgsPerDay >= 1000) {
    usagePercentile = 70
  } else if (msgsPerDay >= 500) {
    usagePercentile = 55
  } else if (msgsPerDay >= 200) {
    usagePercentile = 40
  } else if (msgsPerDay >= 100) {
    usagePercentile = 25
  } else {
    usagePercentile = 10
  }

  // ── Badge helpers ──────────────────────────────────────────────────────────

  // night-owl: hours 0–4
  const hourDist = rawStats.codingTimePatterns.hourDistribution
  const nightOwlSum = hourDist[0] + hourDist[1] + hourDist[2] + hourDist[3] + hourDist[4]

  // early-bird: hours 5–7
  const earlyBirdSum = hourDist[5] + hourDist[6] + hourDist[7]

  // marathon-runner: any session with duration > 120 minutes
  const hasMarathonSession = data.sessions.some((session) => {
    const start = new Date(session.startTime).getTime()
    const end = new Date(session.endTime).getTime()
    const durationMinutes = (end - start) / 60000
    return durationMinutes > 120
  })

  // bug-squasher: count user messages containing debug keywords
  const debugKeywordsLower = DEBUG_KEYWORDS.map((k) => k.toLowerCase())
  let debugPromptCount = 0
  for (const session of data.sessions) {
    for (const message of session.messages) {
      if (message.role === "user") {
        const lower = message.content.toLowerCase()
        if (debugKeywordsLower.some((kw) => lower.includes(kw))) {
          debugPromptCount++
        }
      }
    }
  }

  // speed-demon: median gap between consecutive user messages across all sessions < 30s
  const speedDemonUnlocked = computeSpeedDemon(data)

  // ── Badge definitions ──────────────────────────────────────────────────────
  const badges = [
    {
      id: "1k-club",
      name: "1K Club",
      description: "Sent over 1,000 messages",
      icon: "💬",
      unlocked: rawStats.totalMessages >= 1000,
    },
    {
      id: "10k-club",
      name: "10K Club",
      description: "Sent over 10,000 messages",
      icon: "🏆",
      unlocked: rawStats.totalMessages >= 10000,
    },
    {
      id: "night-owl",
      name: "Night Owl",
      description: "50+ messages between midnight and 5am",
      icon: "🦉",
      unlocked: nightOwlSum >= 50,
    },
    {
      id: "early-bird",
      name: "Early Bird",
      description: "50+ messages between 5am and 8am",
      icon: "🐦",
      unlocked: earlyBirdSum >= 50,
    },
    {
      id: "polyglot",
      name: "Polyglot",
      description: "Worked with 5+ programming languages",
      icon: "🌍",
      unlocked: codeImpact.languagesDetected.length >= 5,
    },
    {
      id: "streak-master",
      name: "Streak Master",
      description: "Maintained a 7+ day coding streak",
      icon: "🔥",
      unlocked: engagementStats.longestStreak >= 7,
    },
    {
      id: "marathon-runner",
      name: "Marathon Runner",
      description: "Single session lasting 2+ hours",
      icon: "🏃",
      unlocked: hasMarathonSession,
    },
    {
      id: "tool-wielder",
      name: "Tool Wielder",
      description: "Used 500+ tool calls",
      icon: "🔧",
      unlocked: rawStats.totalToolCalls >= 500,
    },
    {
      id: "bug-squasher",
      name: "Bug Squasher",
      description: "100+ debugging prompts",
      icon: "🐛",
      unlocked: debugPromptCount >= 100,
    },
    {
      id: "speed-demon",
      name: "Speed Demon",
      description: "Average response gap under 30 seconds",
      icon: "⚡",
      unlocked: speedDemonUnlocked,
    },
  ]

  // Sort: unlocked first, then locked
  badges.sort((a, b) => {
    if (a.unlocked === b.unlocked) return 0
    return a.unlocked ? -1 : 1
  })

  return {
    hoursSaved,
    hoursSavedBreakdown,
    usagePercentile,
    badges,
  }
}

/**
 * Compute whether the speed-demon badge is unlocked.
 * Collect all gaps (in seconds) between consecutive user messages within each
 * session, take the median, and check if it's < 30.
 */
function computeSpeedDemon(data: TraceData): boolean {
  const gaps: number[] = []

  for (const session of data.sessions) {
    const userMessages = session.messages
      .filter((m) => m.role === "user" && m.timestamp)
      .map((m) => new Date(m.timestamp).getTime())
      .filter((t) => !isNaN(t))
      .sort((a, b) => a - b)

    for (let i = 1; i < userMessages.length; i++) {
      const gapSeconds = (userMessages[i] - userMessages[i - 1]) / 1000
      gaps.push(gapSeconds)
    }
  }

  if (gaps.length === 0) return false

  const sorted = [...gaps].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid]

  return median < 30
}
