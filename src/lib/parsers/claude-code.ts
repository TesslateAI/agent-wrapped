/**
 * Parser for Claude Code JSONL trace files.
 *
 * Claude Code stores conversation history as JSONL files in ~/.claude/.
 * Each line is a JSON object with a type, sessionId, timestamp, and message payload.
 * This parser normalizes that format into the common TraceData schema.
 */

import type {
  TraceData,
  Session,
  Message,
  TokenUsage,
  ToolCall,
  ToolResult,
  ClaudeCodeRawMessage,
  ClaudeCodeContentBlock,
  TraceMetadata,
} from "@/lib/types"
import { readFileAsText, parseJSONL } from "./file-utils"

/**
 * Parse one or more Claude Code JSONL files into normalized TraceData.
 */
export async function parseClaudeCodeFiles(files: File[]): Promise<TraceData> {
  const allRawMessages: ClaudeCodeRawMessage[] = []

  for (const file of files) {
    const text = await readFileAsText(file)
    if (text.trim() === "") continue

    const parsed = parseJSONL(text)
    for (const obj of parsed) {
      if (isClaudeCodeRawMessage(obj)) {
        allRawMessages.push(obj)
      }
    }
  }

  // Filter to only user and assistant messages
  const relevantMessages = allRawMessages.filter(
    (msg) => msg.type === "user" || msg.type === "assistant"
  )

  // Group by sessionId
  const sessionMap = new Map<string, ClaudeCodeRawMessage[]>()
  for (const msg of relevantMessages) {
    const sid = msg.sessionId
    if (!sessionMap.has(sid)) {
      sessionMap.set(sid, [])
    }
    sessionMap.get(sid)!.push(msg)
  }

  // Build sessions
  const sessions: Session[] = []
  for (const [sessionId, rawMessages] of sessionMap) {
    // Sort by timestamp (missing timestamps sort to end)
    rawMessages.sort((a, b) => {
      if (!a.timestamp && !b.timestamp) return 0
      if (!a.timestamp) return 1
      if (!b.timestamp) return -1
      return a.timestamp.localeCompare(b.timestamp)
    })

    const messages: Message[] = rawMessages.map(normalizeMessage)

    const firstMsg = rawMessages[0]
    const lastMsg = rawMessages[rawMessages.length - 1]

    // project field is often missing — fall back to cwd, then to
    // the directory-encoded path from webkitRelativePath if available
    const project = firstMsg.project || firstMsg.cwd || ""

    sessions.push({
      id: sessionId,
      startTime: firstMsg.timestamp || "",
      endTime: lastMsg.timestamp || "",
      project,
      gitBranch: firstMsg.gitBranch,
      messages,
      cwd: firstMsg.cwd || "",
    })
  }

  // Sort sessions by startTime
  sessions.sort((a, b) => {
    if (!a.startTime && !b.startTime) return 0
    if (!a.startTime) return 1
    if (!b.startTime) return -1
    return a.startTime.localeCompare(b.startTime)
  })

  const metadata = computeMetadata(files.length, allRawMessages)

  return {
    source: "claude-code",
    sessions,
    metadata,
  }
}

/**
 * Minimal type guard for ClaudeCodeRawMessage.
 */
function isClaudeCodeRawMessage(obj: unknown): obj is ClaudeCodeRawMessage {
  if (typeof obj !== "object" || obj === null) return false
  const record = obj as Record<string, unknown>
  return (
    typeof record.uuid === "string" &&
    typeof record.type === "string" &&
    typeof record.sessionId === "string"
  )
}

/**
 * Normalize a raw Claude Code message into the common Message type.
 */
function normalizeMessage(raw: ClaudeCodeRawMessage): Message {
  const msg = raw.message
  const contentBlocks = msg?.content
  const toolCalls: ToolCall[] = []
  const toolResults: ToolResult[] = []
  let textParts: string[] = []

  if (contentBlocks === undefined || contentBlocks === null) {
    // No message content
  } else if (typeof contentBlocks === "string") {
    textParts.push(contentBlocks)
  } else if (Array.isArray(contentBlocks)) {
    for (const block of contentBlocks as ClaudeCodeContentBlock[]) {
      switch (block.type) {
        case "text":
          if (block.text) textParts.push(block.text)
          break
        case "thinking":
          if (block.thinking) textParts.push(block.thinking)
          break
        case "tool_use":
          if (block.id && block.name) {
            toolCalls.push({
              id: block.id,
              name: block.name,
              input: block.input || {},
            })
          }
          break
        case "tool_result":
          if (block.tool_use_id) {
            let resultContent = ""
            if (typeof block.content === "string") {
              resultContent = block.content
            } else if (Array.isArray(block.content)) {
              resultContent = block.content
                .map((c) => c.text || "")
                .join("\n")
            }
            toolResults.push({
              toolCallId: block.tool_use_id,
              content: resultContent,
              isError: block.is_error || false,
            })
          }
          break
      }
    }
  }

  // Determine role: if all content blocks are tool_results, role is "tool"
  let role: Message["role"] = msg?.role || "user"
  if (
    Array.isArray(contentBlocks) &&
    contentBlocks.length > 0 &&
    (contentBlocks as ClaudeCodeContentBlock[]).every(
      (b) => b.type === "tool_result"
    )
  ) {
    role = "tool"
  }

  const tokenUsage = mapTokenUsage(msg?.usage)

  return {
    id: raw.uuid,
    timestamp: raw.timestamp || "",
    role,
    content: textParts.join("\n"),
    rawContent: contentBlocks,
    model: msg?.model,
    tokenUsage,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    toolResults: toolResults.length > 0 ? toolResults : undefined,
    isSidechain: raw.isSidechain,
  }
}

/**
 * Map raw usage object to TokenUsage.
 */
function mapTokenUsage(
  usage:
    | {
        input_tokens: number
        output_tokens: number
        cache_creation_input_tokens?: number
        cache_read_input_tokens?: number
      }
    | undefined
): TokenUsage | undefined {
  if (!usage) return undefined
  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheCreationTokens: usage.cache_creation_input_tokens,
    cacheReadTokens: usage.cache_read_input_tokens,
  }
}

/**
 * Compute TraceMetadata from all raw messages.
 */
function computeMetadata(
  totalFiles: number,
  rawMessages: ClaudeCodeRawMessage[]
): TraceMetadata {
  const timestamps = rawMessages
    .map((m) => m.timestamp)
    .filter((t) => !!t)
    .sort()

  const projectPaths = [
    ...new Set(
      rawMessages
        .map((m) => m.project || m.cwd)
        .filter((p): p is string => !!p && p.trim() !== "")
    ),
  ]

  return {
    totalFiles,
    earliestTimestamp: timestamps[0] || "",
    latestTimestamp: timestamps[timestamps.length - 1] || "",
    projectPaths,
  }
}
