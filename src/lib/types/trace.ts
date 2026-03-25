// === Claude Code Raw Format ===
export interface ClaudeCodeContentBlock {
  type: "text" | "thinking" | "tool_use" | "tool_result"
  text?: string
  thinking?: string
  signature?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string | Array<{ type: string; text?: string }>
  is_error?: boolean
}

export interface ClaudeCodeRawMessage {
  uuid: string
  timestamp: string
  type: "user" | "assistant" | "progress" | "file-history-snapshot" | "system"
  message?: {
    role: "user" | "assistant"
    content: string | ClaudeCodeContentBlock[]
    model?: string
    usage?: {
      input_tokens: number
      output_tokens: number
      cache_creation_input_tokens?: number
      cache_read_input_tokens?: number
    }
    stop_reason?: string | null
  }
  sessionId: string
  cwd: string
  project: string
  gitBranch?: string
  version?: string
  promptId?: string
  isSidechain?: boolean
  agentId?: string
  userType?: string
}

// === Normalized Schema (parser output / analyzer input) ===
export type TraceSource = "claude-code" | "tesslate-studio" | "cursor" | "aider" | "continue" | "unknown"

export interface TraceData {
  source: TraceSource
  sessions: Session[]
  metadata: TraceMetadata
}

export interface TraceMetadata {
  totalFiles: number
  earliestTimestamp: string
  latestTimestamp: string
  projectPaths: string[]
}

export interface Session {
  id: string
  startTime: string
  endTime: string
  project: string
  gitBranch?: string
  messages: Message[]
  cwd: string
}

export interface Message {
  id: string
  timestamp: string
  role: "user" | "assistant" | "system" | "tool"
  content: string
  rawContent?: unknown
  model?: string
  tokenUsage?: TokenUsage
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  isSidechain?: boolean
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheCreationTokens?: number
  cacheReadTokens?: number
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResult {
  toolCallId: string
  content: string
  isError: boolean
}
