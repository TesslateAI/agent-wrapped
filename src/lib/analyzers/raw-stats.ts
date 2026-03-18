import { TraceData, RawStats, CodingTimePattern } from "@/lib/types"

export function computeRawStats(data: TraceData): RawStats {
  const { sessions, metadata } = data

  // Basic counts
  const totalSessions = sessions.length
  const allMessages = sessions.flatMap((s) => s.messages)
  const totalMessages = allMessages.length
  const userMessages = allMessages.filter(
    (m) => m.role === "user"
  )
  const assistantMessages = allMessages.filter((m) => m.role === "assistant")
  const totalUserPrompts = userMessages.length
  const totalAssistantResponses = assistantMessages.length

  // Token aggregation
  const totalTokensUsed = allMessages.reduce(
    (acc, m) => {
      if (m.tokenUsage) {
        acc.input += m.tokenUsage.inputTokens
        acc.output += m.tokenUsage.outputTokens
        acc.cacheCreation += m.tokenUsage.cacheCreationTokens ?? 0
        acc.cacheRead += m.tokenUsage.cacheReadTokens ?? 0
      }
      return acc
    },
    { input: 0, output: 0, cacheCreation: 0, cacheRead: 0, total: 0 }
  )
  totalTokensUsed.total =
    totalTokensUsed.input +
    totalTokensUsed.output +
    totalTokensUsed.cacheCreation +
    totalTokensUsed.cacheRead

  // Tool calls
  const allToolCalls = allMessages.flatMap((m) => m.toolCalls ?? [])
  const totalToolCalls = allToolCalls.length

  const toolCounts = new Map<string, number>()
  for (const tc of allToolCalls) {
    toolCounts.set(tc.name, (toolCounts.get(tc.name) ?? 0) + 1)
  }
  const topToolsUsed = Array.from(toolCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Models
  const modelCounts = new Map<string, number>()
  for (const m of allMessages) {
    if (m.model) {
      modelCounts.set(m.model, (modelCounts.get(m.model) ?? 0) + 1)
    }
  }
  const topModelsUsed = Array.from(modelCounts.entries())
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)

  // Coding time patterns
  const codingTimePatterns = computeCodingTimePatterns(allMessages)

  // Longest session
  const sessionDurations = sessions.map((s) => {
    const start = new Date(s.startTime).getTime()
    const end = new Date(s.endTime).getTime()
    const durationMinutes = Math.max(0, (end - start) / 60000)
    return { id: s.id, durationMinutes, messageCount: s.messages.length }
  })
  const longestSession = sessionDurations.reduce(
    (best, s) => (s.durationMinutes > best.durationMinutes ? s : best),
    { id: "", durationMinutes: 0, messageCount: 0 }
  )

  // Prompt stats
  const averagePromptsPerSession =
    totalSessions > 0 ? totalUserPrompts / totalSessions : 0
  const promptLengths = userMessages.map((m) => m.content.length)
  const averagePromptLength =
    promptLengths.length > 0
      ? promptLengths.reduce((a, b) => a + b, 0) / promptLengths.length
      : 0

  const nonEmptyUserMessages = userMessages.filter(
    (m) => m.content.length > 0
  )
  const longestPrompt =
    nonEmptyUserMessages.length > 0
      ? nonEmptyUserMessages.reduce(
          (best, m) =>
            m.content.length > best.length
              ? { text: m.content, length: m.content.length }
              : best,
          { text: "", length: 0 }
        )
      : { text: "", length: 0 }

  const shortestPrompt =
    nonEmptyUserMessages.length > 0
      ? nonEmptyUserMessages.reduce(
          (best, m) =>
            m.content.length < best.length
              ? { text: m.content, length: m.content.length }
              : best,
          {
            text: nonEmptyUserMessages[0].content,
            length: nonEmptyUserMessages[0].content.length,
          }
        )
      : { text: "", length: 0 }

  // Projects
  const projectCounts = new Map<string, number>()
  for (const s of sessions) {
    projectCounts.set(s.project, (projectCounts.get(s.project) ?? 0) + 1)
  }
  const topProjects = Array.from(projectCounts.entries())
    .map(([project, sessionCount]) => ({ project, sessionCount }))
    .sort((a, b) => b.sessionCount - a.sessionCount)

  // Git branches
  const branchCounts = new Map<string, number>()
  for (const s of sessions) {
    if (s.gitBranch) {
      branchCounts.set(s.gitBranch, (branchCounts.get(s.gitBranch) ?? 0) + 1)
    }
  }
  const topGitBranches = Array.from(branchCounts.entries())
    .map(([branch, count]) => ({ branch, count }))
    .sort((a, b) => b.count - a.count)

  // Date range
  const dateRange = {
    start: metadata.earliestTimestamp,
    end: metadata.latestTimestamp,
  }

  // Active days
  const uniqueDays = new Set<string>()
  for (const m of allMessages) {
    if (m.timestamp) {
      const date = m.timestamp.slice(0, 10) // YYYY-MM-DD
      uniqueDays.add(date)
    }
  }
  const activeDays = uniqueDays.size

  return {
    totalSessions,
    totalMessages,
    totalUserPrompts,
    totalAssistantResponses,
    totalTokensUsed,
    totalToolCalls,
    topToolsUsed,
    topModelsUsed,
    codingTimePatterns,
    longestSession,
    averagePromptsPerSession,
    averagePromptLength,
    longestPrompt,
    shortestPrompt,
    topProjects,
    topGitBranches,
    dateRange,
    activeDays,
  }
}

function computeCodingTimePatterns(
  messages: { timestamp: string }[]
): CodingTimePattern {
  const hourDistribution = new Array(24).fill(0)
  const dayDistribution = new Array(7).fill(0)

  for (const m of messages) {
    if (!m.timestamp) continue
    const d = new Date(m.timestamp)
    if (isNaN(d.getTime())) continue
    hourDistribution[d.getHours()] += 1
    dayDistribution[d.getDay()] += 1
  }

  // Find peak hour
  const peakHour = hourDistribution.indexOf(
    Math.max(...hourDistribution)
  )

  // Check weekend bias
  const weekdayTotal =
    dayDistribution[1] +
    dayDistribution[2] +
    dayDistribution[3] +
    dayDistribution[4] +
    dayDistribution[5]
  const weekendTotal = dayDistribution[0] + dayDistribution[6]
  // Weekend warrior: weekend average > weekday average
  const weekdayAvg = weekdayTotal / 5
  const weekendAvg = weekendTotal / 2

  // Determine label
  let label: CodingTimePattern["label"]

  if (peakHour >= 0 && peakHour < 5) {
    label = "Night Owl"
  } else if (peakHour >= 5 && peakHour < 9) {
    label = "Early Bird"
  } else if (peakHour >= 9 && peakHour < 17) {
    label = "9-to-5er"
  } else if (weekendAvg > weekdayAvg * 1.5 && weekendTotal > 0 && weekdayTotal > 0) {
    label = "Weekend Warrior"
  } else {
    // 17-24 = Night Owl
    label = "Night Owl"
  }

  // Check if fairly even (all hours have activity within similar range) → Always On
  const totalMsgs = hourDistribution.reduce((a: number, b: number) => a + b, 0)
  if (totalMsgs > 0) {
    const activeHours = hourDistribution.filter((h: number) => h > 0).length
    if (activeHours >= 18) {
      // Activity in 18+ hours suggests "Always On"
      const maxHour = Math.max(...hourDistribution)
      const avgHour = totalMsgs / 24
      // If no single hour dominates heavily
      if (maxHour < avgHour * 3) {
        label = "Always On"
      }
    }
  }

  return { hourDistribution, dayDistribution, label }
}
