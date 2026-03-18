import type { TraceData } from "@/lib/types/trace"
import type { EngagementStats, SessionAnalysis } from "@/lib/types/analysis"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract YYYY-MM-DD from an ISO timestamp string. Returns "" on invalid input. */
function toDateString(isoTimestamp: string): string {
  const d = isoTimestamp.slice(0, 10)
  return d.length === 10 ? d : ""
}

/**
 * Given a sorted array of unique YYYY-MM-DD strings, compute the longest run
 * of consecutive calendar days.
 */
function longestRunInSortedDates(dates: string[]): number {
  if (dates.length === 0) return 0
  let longest = 1
  let current = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]).getTime()
    const curr = new Date(dates[i]).getTime()
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }

  return longest
}

/**
 * Compute the streak of consecutive calendar days ending at `endDate`
 * (a YYYY-MM-DD string) from a sorted unique list of active dates.
 */
function currentRunEndingAt(sortedDates: string[], endDate: string): number {
  if (sortedDates.length === 0) return 0

  // Walk backwards from the end of the array
  let idx = sortedDates.length - 1

  // The last active date must be endDate (or the day before, handled by caller)
  if (sortedDates[idx] !== endDate) return 0

  let streak = 1
  while (idx > 0) {
    const prev = new Date(sortedDates[idx - 1]).getTime()
    const curr = new Date(sortedDates[idx]).getTime()
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      streak++
      idx--
    } else {
      break
    }
  }

  return streak
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function computeEngagementStats(
  data: TraceData,
  sessionDetails: SessionAnalysis,
): EngagementStats {
  const sessions = sessionDetails.sessions

  // ─── Unique sorted active dates ─────────────────────────────────────────
  const dateSet = new Set<string>()
  for (const s of sessions) {
    const d = toDateString(s.startTime)
    if (d) dateSet.add(d)
  }
  const sortedDates = Array.from(dateSet).sort()

  // ─── longestStreak ───────────────────────────────────────────────────────
  const longestStreak = longestRunInSortedDates(sortedDates)

  // ─── currentStreak ───────────────────────────────────────────────────────
  // The "present" is determined by the latest timestamp in the trace data.
  const latestDate = toDateString(data.metadata.latestTimestamp)
  const lastActiveDate = sortedDates[sortedDates.length - 1] ?? ""

  let currentStreak = 0
  if (lastActiveDate && latestDate) {
    const latestMs = new Date(latestDate).getTime()
    const lastMs = new Date(lastActiveDate).getTime()
    const diffDays = Math.round((latestMs - lastMs) / (1000 * 60 * 60 * 24))

    // Valid if last active day is the same day as latest, or exactly 1 day before
    if (diffDays === 0 || diffDays === 1) {
      currentStreak = currentRunEndingAt(sortedDates, lastActiveDate)
    }
  }

  // ─── peakDay ─────────────────────────────────────────────────────────────
  const dayMap = new Map<string, { sessions: number; messages: number }>()
  for (const s of sessions) {
    const d = toDateString(s.startTime)
    if (!d) continue
    const entry = dayMap.get(d) ?? { sessions: 0, messages: 0 }
    entry.sessions++
    entry.messages += s.messageCount
    dayMap.set(d, entry)
  }

  let peakDay: { date: string; sessions: number; messages: number } = {
    date: "",
    sessions: 0,
    messages: 0,
  }
  for (const [date, stats] of dayMap.entries()) {
    if (
      stats.sessions > peakDay.sessions ||
      (stats.sessions === peakDay.sessions && stats.messages > peakDay.messages)
    ) {
      peakDay = { date, ...stats }
    }
  }

  // ─── avgConversationDepth ────────────────────────────────────────────────
  const avgConversationDepth =
    sessions.length === 0
      ? 0
      : sessions.reduce((sum, s) => sum + s.userPromptCount, 0) / sessions.length

  // ─── selfSufficiencyTrend / selfSufficiencySlope ─────────────────────────
  // Sort sessions by startTime, extract (index, durationMinutes) pairs, and
  // compute simple linear regression slope.
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  let selfSufficiencySlope = 0
  let selfSufficiencyTrend: "improving" | "stable" | "declining" = "stable"

  if (sorted.length >= 2) {
    const n = sorted.length
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumX2 = 0

    for (let i = 0; i < n; i++) {
      const x = i
      const y = sorted[i].durationMinutes
      sumX += x
      sumY += y
      sumXY += x * y
      sumX2 += x * x
    }

    const denom = n * sumX2 - sumX * sumX
    selfSufficiencySlope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom

    if (Math.abs(selfSufficiencySlope) < 0.5) {
      selfSufficiencyTrend = "stable"
    } else if (selfSufficiencySlope < -0.5) {
      selfSufficiencyTrend = "improving"
    } else {
      selfSufficiencyTrend = "declining"
    }
  }

  // ─── highTokenSessions ───────────────────────────────────────────────────
  const highTokenSessions = sessions.filter((s) => s.tokenCount > 100_000).length

  // ─── totalSessions ───────────────────────────────────────────────────────
  const totalSessions = sessions.length

  // ─── multiTaskingScore ───────────────────────────────────────────────────
  // For each active date, count unique projects. Average across dates.
  const projectsByDay = new Map<string, Set<string>>()
  for (const s of sessions) {
    const d = toDateString(s.startTime)
    if (!d) continue
    const projectSet = projectsByDay.get(d) ?? new Set<string>()
    projectSet.add(s.project)
    projectsByDay.set(d, projectSet)
  }

  const multiTaskingScore =
    projectsByDay.size === 0
      ? 0
      : Array.from(projectsByDay.values()).reduce(
          (sum, set) => sum + set.size,
          0
        ) / projectsByDay.size

  return {
    longestStreak,
    currentStreak,
    peakDay,
    avgConversationDepth,
    selfSufficiencyTrend,
    selfSufficiencySlope,
    highTokenSessions,
    totalSessions,
    multiTaskingScore,
  }
}
