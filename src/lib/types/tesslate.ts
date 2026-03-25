// === Tesslate Studio Raw Export Format ===

export interface TesslateExport {
  exported_at: string
  export_type?: string
  // Full dump uses "projects" (array), single-project export uses "project" (object)
  projects?: TesslateProject[]
  project?: TesslateProject
  chats: TesslateChat[]
  messages: TesslateMessage[]
  agent_steps: TesslateAgentStep[]
  usage_logs: TesslateUsageLog[]
  agent_command_logs?: unknown[]
  shell_sessions?: unknown[]
}

export interface TesslateProject {
  id: string
  name: string
  slug: string
  description?: string | null
  owner_id: string
  has_git_repo?: boolean
  git_remote_url?: string | null
  deploy_type?: string
  environment_status?: string
  last_activity?: string | null
  created_at: string
  updated_at: string
}

export interface TesslateChat {
  id: string
  user_id: string
  project_id: string
  created_at: string
  title: string | null
  origin: string
  status: string
  updated_at: string
}

export interface TesslateMessage {
  id: string
  chat_id: string
  role: "user" | "assistant"
  content: string
  message_metadata: TesslateMessageMetadata | null
  created_at: string
  updated_at: string
}

export interface TesslateMessageMetadata {
  agent_mode?: boolean
  agent_type?: string
  iterations?: number
  tool_calls_made?: number
  completion_reason?: string
  session_id?: string | null
  executed_by?: string
  task_id?: string
  trajectory_path?: string | null
  steps_table?: boolean
}

export interface TesslateAgentStep {
  id: string
  message_id: string
  chat_id: string
  step_index: number
  step_data: TesslateStepData
  created_at: string
}

export interface TesslateStepData {
  iteration: number
  thought: string | null
  tool_calls: TesslateToolCall[]
  response_text: string
  is_complete: boolean
  timestamp: string
}

export interface TesslateToolCall {
  name: string
  parameters: Record<string, unknown>
  result: TesslateToolResult
}

export interface TesslateToolResult {
  success: boolean
  tool: string
  result?: Record<string, unknown>
  error?: string
}

export interface TesslateUsageLog {
  id: string
  user_id: string
  agent_id: string
  project_id: string | null
  model: string
  tokens_input: number
  tokens_output: number
  cost_input: number
  cost_output: number
  cost_total: number
  creator_id?: string | null
  creator_revenue?: number
  platform_revenue?: number
  billed_status: string
  invoice_id?: string | null
  billed_at?: string | null
  request_id?: string | null
  created_at: string
  is_byok: boolean
}
