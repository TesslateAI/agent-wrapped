import type { TraceData } from "@/lib/types/trace"
import type { ProductivityStats, SessionAnalysis, CostEstimate } from "@/lib/types/analysis"

// Prices per 1M tokens — kept in sync with cost-estimate.ts (last updated 2026-03)
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6": { input: 5.0, output: 25.0 },
  "claude-opus-4-5": { input: 5.0, output: 25.0 },
  "claude-opus-4-1": { input: 15.0, output: 75.0 },
  "claude-opus-4": { input: 15.0, output: 75.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
  "claude-sonnet-4-5-20250514": { input: 3.0, output: 15.0 },
  "claude-sonnet-4": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
  "claude-haiku-4-5-20251001": { input: 1.0, output: 5.0 },
  "claude-3-5-haiku": { input: 0.8, output: 4.0 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4.0 },
  _default: { input: 3.0, output: 15.0 },
}

const CORRECTION_WORDS = ["no", "wrong", "fix", "that's not", "try again", "incorrect", "not what", "instead"]
const POSITIVE_WORDS = ["thanks", "perfect", "works", "great", "awesome", "done", "looks good", "lgtm"]

function messageCost(messages: TraceData["sessions"][number]["messages"]): number {
  let cost = 0
  for (const msg of messages) {
    if (!msg.tokenUsage) continue
    const { inputTokens, outputTokens } = msg.tokenUsage
    const key = msg.model && msg.model in PRICING ? msg.model : "_default"
    const price = PRICING[key]
    cost += (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output
  }
  return cost
}

function hasTokens(messages: TraceData["sessions"][number]["messages"]): boolean {
  return messages.some((m) => !!m.tokenUsage)
}

function containsAny(text: string, words: string[]): boolean {
  const lower = text.toLowerCase()
  return words.some((w) => {
    // Use word-boundary matching so short words like "no" don't match inside
    // longer words like "now", "know", "note", etc.
    const regex = new RegExp(`(?<![a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z])`, "i")
    return regex.test(lower)
  })
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) / 2)]
}

export function computeProductivityStats(
  data: TraceData,
  sessionDetails: SessionAnalysis,
  costEstimate: CostEstimate,
): ProductivityStats {
  const sessions = sessionDetails.sessions

  // -------------------------------------------------------------------------
  // avgCostPerSession
  // -------------------------------------------------------------------------
  const avgCostPerSession =
    sessions.length === 0 ? 0 : costEstimate.totalCost / sessions.length

  // -------------------------------------------------------------------------
  // mostExpensiveSession
  // -------------------------------------------------------------------------
  let mostExpensiveSession: ProductivityStats["mostExpensiveSession"] = null
  {
    let maxCost = -Infinity
    for (const rawSession of data.sessions) {
      if (!hasTokens(rawSession.messages)) continue
      const cost = messageCost(rawSession.messages)
      if (cost > maxCost) {
        maxCost = cost
        mostExpensiveSession = {
          id: rawSession.id,
          project: rawSession.project,
          cost,
        }
      }
    }
    // If no session had token data the loop never ran and mostExpensiveSession stays null
    if (mostExpensiveSession !== null && maxCost < 0) {
      mostExpensiveSession = null
    }
  }

  // -------------------------------------------------------------------------
  // costTrend
  // -------------------------------------------------------------------------
  const costByDate = new Map<string, number>()
  for (const rawSession of data.sessions) {
    if (!hasTokens(rawSession.messages)) continue
    const date = rawSession.startTime.slice(0, 10)
    const cost = messageCost(rawSession.messages)
    costByDate.set(date, (costByDate.get(date) ?? 0) + cost)
  }
  const costTrend = Array.from(costByDate.entries())
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // -------------------------------------------------------------------------
  // promptToFixRatio
  // -------------------------------------------------------------------------
  let totalCorrectionMessages = 0
  let chainCount = 0
  {
    const allMessages = data.sessions.flatMap((s) => s.messages)
    let inChain = false
    for (let i = 1; i < allMessages.length; i++) {
      const msg = allMessages[i]
      const prev = allMessages[i - 1]
      if (msg.role !== "user") continue
      if (prev.role !== "assistant") continue
      const isCorrection = containsAny(msg.content, CORRECTION_WORDS)
      if (isCorrection) {
        totalCorrectionMessages++
        if (!inChain) {
          chainCount++
          inChain = true
        }
      } else {
        inChain = false
      }
    }
  }
  const promptToFixRatio = chainCount === 0 ? 0 : totalCorrectionMessages / chainCount

  // -------------------------------------------------------------------------
  // successRate
  // -------------------------------------------------------------------------
  let successCount = 0
  {
    for (const rawSession of data.sessions) {
      const userMessages = rawSession.messages.filter((m) => m.role === "user")
      if (userMessages.length === 0) {
        // No user messages → treat as success (neutral)
        successCount++
        continue
      }
      const lastUserMsg = userMessages[userMessages.length - 1]
      const isFailure = containsAny(lastUserMsg.content, CORRECTION_WORDS)
      if (!isFailure) {
        successCount++
      }
    }
  }
  const successRate =
    data.sessions.length === 0 ? 0 : successCount / data.sessions.length

  // -------------------------------------------------------------------------
  // avgResponseGapSeconds
  // -------------------------------------------------------------------------
  const allGaps: number[] = []
  for (const rawSession of data.sessions) {
    const userMessages = rawSession.messages.filter((m) => m.role === "user")
    for (let i = 1; i < userMessages.length; i++) {
      const tPrev = new Date(userMessages[i - 1].timestamp).getTime()
      const tCurr = new Date(userMessages[i].timestamp).getTime()
      if (!isNaN(tPrev) && !isNaN(tCurr)) {
        allGaps.push(Math.round((tCurr - tPrev) / 1000))
      }
    }
  }
  const avgResponseGapSeconds = median(allGaps)

  // -------------------------------------------------------------------------
  // toolEfficiency
  // -------------------------------------------------------------------------
  const toolStats = new Map<string, { totalCalls: number; errors: number }>()
  for (const rawSession of data.sessions) {
    for (const msg of rawSession.messages) {
      if (!msg.toolCalls || msg.toolCalls.length === 0) continue

      // Build a map from toolCallId → isError using toolResults on this message
      const resultMap = new Map<string, boolean>()
      for (const tr of msg.toolResults ?? []) {
        resultMap.set(tr.toolCallId, tr.isError)
      }

      for (const tc of msg.toolCalls) {
        const existing = toolStats.get(tc.name) ?? { totalCalls: 0, errors: 0 }
        const isError = resultMap.get(tc.id) === true
        toolStats.set(tc.name, {
          totalCalls: existing.totalCalls + 1,
          errors: existing.errors + (isError ? 1 : 0),
        })
      }
    }
  }
  const toolEfficiency = Array.from(toolStats.entries())
    .map(([name, stats]) => ({
      name,
      totalCalls: stats.totalCalls,
      errors: stats.errors,
      errorRate: stats.totalCalls === 0 ? 0 : stats.errors / stats.totalCalls,
    }))
    .sort((a, b) => b.errorRate - a.errorRate)

  // -------------------------------------------------------------------------
  // avgIterationSpeedMinutes
  // -------------------------------------------------------------------------
  const avgIterationSpeedMinutes =
    sessions.length === 0
      ? 0
      : sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / sessions.length

  return {
    avgCostPerSession,
    mostExpensiveSession,
    costTrend,
    promptToFixRatio,
    successRate,
    avgResponseGapSeconds,
    toolEfficiency,
    avgIterationSpeedMinutes,
  }
}
