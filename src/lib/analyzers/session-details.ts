import type { TraceData } from "@/lib/types/trace"
import type { SessionDetail, SessionAnalysis, SessionTraceMessage } from "@/lib/types/analysis"

const MAX_PROMPT_LENGTH = 500
const MAX_PROMPTS_PER_SESSION = 20
const MAX_CONTENT_LENGTH = 2000
// No message cap — pagination handled in the UI
const MAX_TOOL_RESULT_LENGTH = 1000

export function computeSessionDetails(data: TraceData): SessionAnalysis {
  const sessions: SessionDetail[] = data.sessions.map((session) => {
    const userMessages = session.messages.filter((m) => m.role === "user")
    const allToolCalls = session.messages.flatMap((m) => m.toolCalls ?? [])
    const allToolResults = session.messages.flatMap((m) => m.toolResults ?? [])

    const tokenCount = session.messages.reduce((sum, m) => {
      if (!m.tokenUsage) return sum
      return sum + m.tokenUsage.inputTokens + m.tokenUsage.outputTokens
    }, 0)

    const toolCounts = new Map<string, number>()
    for (const tc of allToolCalls) {
      toolCounts.set(tc.name, (toolCounts.get(tc.name) ?? 0) + 1)
    }
    const topTools = Array.from(toolCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const start = new Date(session.startTime).getTime()
    const end = new Date(session.endTime).getTime()
    const durationMinutes =
      isNaN(start) || isNaN(end)
        ? 0
        : Math.max(0, Math.round((end - start) / 60000))

    const userPrompts = userMessages
      .slice(0, MAX_PROMPTS_PER_SESSION)
      .map((m) => m.content.slice(0, MAX_PROMPT_LENGTH))

    // Build full message trace for the modal viewer
    const messages: SessionTraceMessage[] = session.messages
      .map((m) => ({
        id: m.id,
        timestamp: m.timestamp,
        role: m.role,
        content: m.content.slice(0, MAX_CONTENT_LENGTH),
        model: m.model,
        tokenUsage: m.tokenUsage
          ? { inputTokens: m.tokenUsage.inputTokens, outputTokens: m.tokenUsage.outputTokens }
          : undefined,
        toolCalls: m.toolCalls?.map((tc) => ({
          id: tc.id,
          name: tc.name,
          input: tc.input,
        })),
        toolResults: m.toolResults?.map((tr) => ({
          toolCallId: tr.toolCallId,
          content: tr.content.slice(0, MAX_TOOL_RESULT_LENGTH),
          isError: tr.isError,
        })),
      }))

    return {
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      project: session.project,
      gitBranch: session.gitBranch,
      durationMinutes,
      messageCount: session.messages.length,
      userPromptCount: userMessages.length,
      tokenCount,
      toolCallCount: allToolCalls.length,
      errorCount: allToolResults.filter((r) => r.isError).length,
      topTools,
      userPrompts,
      messages,
    }
  })

  const dateMap = new Map<string, { sessionCount: number; messageCount: number }>()
  for (const session of data.sessions) {
    const date = session.startTime.slice(0, 10)
    if (!date || date.length !== 10) continue
    const entry = dateMap.get(date) ?? { sessionCount: 0, messageCount: 0 }
    entry.sessionCount++
    entry.messageCount += session.messages.length
    dateMap.set(date, entry)
  }
  const timeline = Array.from(dateMap.entries())
    .map(([date, d]) => ({ date, ...d }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return { sessions, timeline }
}
