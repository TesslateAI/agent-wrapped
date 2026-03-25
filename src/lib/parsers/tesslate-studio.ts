/**
 * Parser for Tesslate Studio trace exports.
 *
 * Converts Tesslate's relational JSON format (projects, chats, messages,
 * agent_steps, usage_logs) into the normalized TraceData schema used by analyzers.
 */

import type { TraceData, Session, Message, ToolCall, ToolResult } from "@/lib/types"
import type {
  TesslateExport,
  TesslateProject,
  TesslateChat,
  TesslateMessage,
  TesslateAgentStep,
  TesslateUsageLog,
} from "@/lib/types/tesslate"
import { readFileAsText } from "./file-utils"

/**
 * Normalize a Tesslate model name for pricing lookup.
 * Strips "builtin/" prefix and converts dots to hyphens in version segments.
 * e.g. "builtin/claude-sonnet-4.6" → "claude-sonnet-4-6"
 */
function normalizeModelName(model: string): string {
  let normalized = model.replace(/^builtin\//, "")
  // Convert version dots to hyphens: "claude-sonnet-4.6" → "claude-sonnet-4-6"
  normalized = normalized.replace(/(\d+)\.(\d+)/g, "$1-$2")
  return normalized
}

/**
 * Parse Tesslate Studio JSON export files into normalized TraceData.
 */
export async function parseTesslateStudioFiles(files: File[]): Promise<TraceData> {
  // Read and parse all JSON files
  const exports: TesslateExport[] = []
  for (const file of files) {
    const text = await readFileAsText(file)
    try {
      exports.push(JSON.parse(text) as TesslateExport)
    } catch {
      console.warn(`Skipping invalid JSON file: ${file.name}`)
    }
  }

  if (exports.length === 0) {
    throw new Error("No valid Tesslate Studio trace files found")
  }

  // Merge data across files, deduplicating by id
  const projectMap = new Map<string, TesslateProject>()
  const chatMap = new Map<string, TesslateChat>()
  const messageMap = new Map<string, TesslateMessage>()
  const stepMap = new Map<string, TesslateAgentStep>()
  const usageLogMap = new Map<string, TesslateUsageLog>()

  for (const exp of exports) {
    // Handle both "project" (single) and "projects" (array) formats
    const projects = exp.projects ?? (exp.project ? [exp.project] : [])
    for (const p of projects) projectMap.set(p.id, p)
    for (const c of exp.chats) chatMap.set(c.id, c)
    for (const m of exp.messages) messageMap.set(m.id, m)
    for (const s of exp.agent_steps) stepMap.set(s.id, s)
    for (const u of exp.usage_logs) usageLogMap.set(u.id, u)
  }

  // Build lookup indices
  const messagesByChat = new Map<string, TesslateMessage[]>()
  for (const msg of messageMap.values()) {
    const list = messagesByChat.get(msg.chat_id) ?? []
    list.push(msg)
    messagesByChat.set(msg.chat_id, list)
  }
  // Sort messages within each chat by timestamp
  for (const [chatId, msgs] of messagesByChat) {
    msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    messagesByChat.set(chatId, msgs)
  }

  const stepsByMessage = new Map<string, TesslateAgentStep[]>()
  for (const step of stepMap.values()) {
    const list = stepsByMessage.get(step.message_id) ?? []
    list.push(step)
    stepsByMessage.set(step.message_id, list)
  }
  // Sort steps by step_index
  for (const [msgId, steps] of stepsByMessage) {
    steps.sort((a, b) => a.step_index - b.step_index)
    stepsByMessage.set(msgId, steps)
  }

  // Group usage logs by project_id, sorted by timestamp
  const usageLogsByProject = new Map<string, TesslateUsageLog[]>()
  for (const log of usageLogMap.values()) {
    const key = log.project_id ?? "__no_project__"
    const list = usageLogsByProject.get(key) ?? []
    list.push(log)
    usageLogsByProject.set(key, list)
  }
  for (const [key, logs] of usageLogsByProject) {
    logs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    usageLogsByProject.set(key, logs)
  }

  // Convert chats to sessions
  const sessions: Session[] = []
  const allTimestamps: number[] = []
  const projectPaths = new Set<string>()

  for (const chat of chatMap.values()) {
    const project = projectMap.get(chat.project_id)
    const chatMessages = messagesByChat.get(chat.id) ?? []

    if (chatMessages.length === 0) continue

    const projectName = project?.name ?? chat.project_id
    projectPaths.add(projectName)

    // Get usage logs for this chat's project to correlate with assistant messages
    const projectLogs = usageLogsByProject.get(chat.project_id) ?? []
    // Filter to logs within this chat's time window (with some buffer)
    const chatStart = new Date(chat.created_at).getTime() - 5000
    const chatEnd = new Date(chat.updated_at).getTime() + 5000
    const chatLogs = projectLogs.filter((log) => {
      const t = new Date(log.created_at).getTime()
      return t >= chatStart && t <= chatEnd
    })
    // Track which logs have been claimed
    const claimedLogs = new Set<string>()

    const messages: Message[] = chatMessages.map((msg) => {
      const ts = new Date(msg.created_at).getTime()
      allTimestamps.push(ts)

      const toolCalls: ToolCall[] = []
      const toolResults: ToolResult[] = []

      // Expand agent steps into tool calls/results for assistant messages
      if (msg.role === "assistant") {
        const steps = stepsByMessage.get(msg.id) ?? []
        for (const step of steps) {
          for (const tc of step.step_data.tool_calls) {
            const callId = `${step.id}-${tc.name}-${toolCalls.length}`
            toolCalls.push({
              id: callId,
              name: tc.name,
              input: tc.parameters,
            })

            const resultContent = tc.result.success
              ? JSON.stringify(tc.result.result ?? {})
              : tc.result.error ?? JSON.stringify(tc.result.result ?? {})

            toolResults.push({
              toolCallId: callId,
              content: resultContent,
              isError: !tc.result.success,
            })
          }
        }
      }

      // Correlate usage logs with assistant messages
      let model: string | undefined
      let tokenUsage: Message["tokenUsage"] | undefined

      if (msg.role === "assistant") {
        // Find closest unclaimed usage log within a 60-second window
        const msgTime = new Date(msg.created_at).getTime()
        let bestLog: TesslateUsageLog | null = null
        let bestDelta = Infinity

        for (const log of chatLogs) {
          if (claimedLogs.has(log.id)) continue
          const delta = Math.abs(new Date(log.created_at).getTime() - msgTime)
          if (delta < 60_000 && delta < bestDelta) {
            bestDelta = delta
            bestLog = log
          }
        }

        if (bestLog) {
          claimedLogs.add(bestLog.id)
          model = normalizeModelName(bestLog.model)
          tokenUsage = {
            inputTokens: bestLog.tokens_input,
            outputTokens: bestLog.tokens_output,
          }
        }

        // If no single log matched, try to aggregate all unclaimed logs in the chat window
        // that fall between this message and the next message
        if (!tokenUsage && chatLogs.length > 0) {
          const remainingLogs = chatLogs.filter((l) => !claimedLogs.has(l.id))
          if (remainingLogs.length > 0) {
            // For the first unclaimed log, use it
            const log = remainingLogs[0]
            claimedLogs.add(log.id)
            model = normalizeModelName(log.model)
            tokenUsage = {
              inputTokens: log.tokens_input,
              outputTokens: log.tokens_output,
            }
          }
        }
      }

      // Build content: include agent thought and response_text from steps
      let content = msg.content
      if (msg.role === "assistant") {
        const steps = stepsByMessage.get(msg.id) ?? []
        const stepTexts: string[] = []
        for (const step of steps) {
          if (step.step_data.thought) {
            stepTexts.push(step.step_data.thought)
          }
          if (step.step_data.response_text && step.step_data.response_text !== msg.content) {
            stepTexts.push(step.step_data.response_text)
          }
        }
        if (stepTexts.length > 0 && !content) {
          content = stepTexts.join("\n")
        }
      }

      return {
        id: msg.id,
        timestamp: msg.created_at,
        role: msg.role,
        content,
        model,
        tokenUsage,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        toolResults: toolResults.length > 0 ? toolResults : undefined,
      }
    })

    const startTime = chatMessages[0].created_at
    const endTime = chatMessages[chatMessages.length - 1].updated_at ?? chatMessages[chatMessages.length - 1].created_at

    sessions.push({
      id: chat.id,
      startTime,
      endTime,
      project: projectName,
      messages,
      cwd: project?.slug ?? "",
    })
  }

  // Sort sessions by start time
  sessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  // Compute metadata
  const earliest = allTimestamps.length > 0 ? new Date(Math.min(...allTimestamps)).toISOString() : ""
  const latest = allTimestamps.length > 0 ? new Date(Math.max(...allTimestamps)).toISOString() : ""

  return {
    source: "tesslate-studio",
    sessions,
    metadata: {
      totalFiles: files.length,
      earliestTimestamp: earliest,
      latestTimestamp: latest,
      projectPaths: Array.from(projectPaths),
    },
  }
}
