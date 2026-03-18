import { TraceData, Message } from "@/lib/types"

interface TestMessage {
  role: string
  content: string
  timestamp?: string
  model?: string
  tokenUsage?: { inputTokens: number; outputTokens: number }
  toolCalls?: Array<{ id: string; name: string; input: Record<string, unknown> }>
  toolResults?: Array<{ toolCallId: string; content: string; isError: boolean }>
}

export function createTestData(
  messages: TestMessage[],
  options?: {
    project?: string
    gitBranch?: string
    startTime?: string
    endTime?: string
    sessionId?: string
  }
): TraceData {
  const startTime = options?.startTime ?? "2026-03-01T10:00:00Z"
  const endTime = options?.endTime ?? "2026-03-01T11:00:00Z"

  return {
    source: "claude-code",
    sessions: [
      {
        id: options?.sessionId ?? "test-session",
        startTime,
        endTime,
        project: options?.project ?? "/test/project",
        gitBranch: options?.gitBranch,
        messages: messages.map((m, i) => ({
          id: `msg-${i}`,
          timestamp:
            m.timestamp ?? new Date(2026, 2, 1, 10, i).toISOString(),
          role: m.role as Message["role"],
          content: m.content,
          model: m.model,
          tokenUsage: m.tokenUsage,
          toolCalls: m.toolCalls,
          toolResults: m.toolResults,
        })),
        cwd: "/test/project",
      },
    ],
    metadata: {
      totalFiles: 1,
      earliestTimestamp: startTime,
      latestTimestamp: endTime,
      projectPaths: [options?.project ?? "/test/project"],
    },
  }
}

export function createMultiSessionData(
  sessionsData: Array<{
    messages: TestMessage[]
    project?: string
    gitBranch?: string
    startTime?: string
    endTime?: string
  }>
): TraceData {
  const sessions = sessionsData.map((sd, si) => ({
    id: `session-${si}`,
    startTime: sd.startTime ?? "2026-03-01T10:00:00Z",
    endTime: sd.endTime ?? "2026-03-01T11:00:00Z",
    project: sd.project ?? "/test/project",
    gitBranch: sd.gitBranch,
    messages: sd.messages.map((m, i) => ({
      id: `s${si}-msg-${i}`,
      timestamp:
        m.timestamp ?? new Date(2026, 2, 1 + si, 10, i).toISOString(),
      role: m.role as Message["role"],
      content: m.content,
      model: m.model,
      tokenUsage: m.tokenUsage,
      toolCalls: m.toolCalls,
      toolResults: m.toolResults,
    })),
    cwd: sd.project ?? "/test/project",
  }))

  const allTimestamps = sessions.flatMap((s) =>
    s.messages.map((m) => m.timestamp)
  )

  return {
    source: "claude-code",
    sessions,
    metadata: {
      totalFiles: sessionsData.length,
      earliestTimestamp:
        allTimestamps.sort()[0] ?? "2026-03-01T10:00:00Z",
      latestTimestamp:
        allTimestamps.sort().reverse()[0] ?? "2026-03-01T11:00:00Z",
      projectPaths: [
        ...new Set(sessionsData.map((s) => s.project ?? "/test/project")),
      ],
    },
  }
}
