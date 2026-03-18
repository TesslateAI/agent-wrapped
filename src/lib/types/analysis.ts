export interface AnalysisResult {
  rawStats: RawStats
  vibeScores: VibeScores
  promptPersonality: PromptPersonality
  aiTreatment: AITreatmentScore
  sessionDetails: SessionAnalysis
  codeImpact: CodeImpact
  costEstimate: CostEstimate
  productivityStats: ProductivityStats
  engagementStats: EngagementStats
  achievements: Achievements
}

export interface ProductivityStats {
  avgCostPerSession: number
  mostExpensiveSession: { id: string; project: string; cost: number } | null
  costTrend: Array<{ date: string; cost: number }>
  promptToFixRatio: number
  successRate: number
  avgResponseGapSeconds: number
  toolEfficiency: Array<{ name: string; totalCalls: number; errors: number; errorRate: number }>
  avgIterationSpeedMinutes: number
}

export interface EngagementStats {
  longestStreak: number
  currentStreak: number
  peakDay: { date: string; sessions: number; messages: number }
  avgConversationDepth: number
  selfSufficiencyTrend: "improving" | "stable" | "declining"
  selfSufficiencySlope: number
  highTokenSessions: number
  totalSessions: number
  multiTaskingScore: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
}

export interface Achievements {
  hoursSaved: number
  hoursSavedBreakdown: { toolCalls: number; estimatedManualMinutes: number }
  usagePercentile: number
  badges: Achievement[]
}


export interface SessionTraceMessage {
  id: string
  timestamp: string
  role: "user" | "assistant" | "system" | "tool"
  content: string
  model?: string
  tokenUsage?: { inputTokens: number; outputTokens: number }
  toolCalls?: Array<{ id: string; name: string; input: Record<string, unknown> }>
  toolResults?: Array<{ toolCallId: string; content: string; isError: boolean }>
}

export interface SessionDetail {
  id: string
  startTime: string
  endTime: string
  project: string
  gitBranch?: string
  durationMinutes: number
  messageCount: number
  userPromptCount: number
  tokenCount: number
  toolCallCount: number
  errorCount: number
  topTools: Array<{ name: string; count: number }>
  userPrompts: string[]
  messages: SessionTraceMessage[]
}

export interface SessionAnalysis {
  sessions: SessionDetail[]
  timeline: Array<{ date: string; sessionCount: number; messageCount: number }>
}

export interface CodeImpact {
  languagesDetected: Array<{ language: string; fileCount: number }>
  uniqueFilesTouched: number
  taskTypeBreakdown: Array<{ type: string; count: number }>
  errorRate: number
  topFilePaths: Array<{ path: string; touchCount: number }>
  frameworksDetected: Array<{ name: string; category: string; mentions: number }>
}

export interface CostEstimate {
  totalCost: number
  usedFallbackPricing: boolean
  breakdown: Array<{ model: string; inputTokens: number; outputTokens: number; cost: number }>
  tokenDistribution: { input: number; output: number; cacheCreation: number; cacheRead: number }
}

export interface RawStats {
  totalSessions: number
  totalMessages: number
  totalUserPrompts: number
  totalAssistantResponses: number
  totalTokensUsed: TotalTokens
  totalToolCalls: number
  topToolsUsed: Array<{ name: string; count: number }>
  topModelsUsed: Array<{ model: string; count: number }>
  codingTimePatterns: CodingTimePattern
  longestSession: { id: string; durationMinutes: number; messageCount: number }
  averagePromptsPerSession: number
  averagePromptLength: number
  longestPrompt: { text: string; length: number }
  shortestPrompt: { text: string; length: number }
  topProjects: Array<{ project: string; sessionCount: number }>
  topGitBranches: Array<{ branch: string; count: number }>
  dateRange: { start: string; end: string }
  activeDays: number
}

export interface TotalTokens {
  input: number
  output: number
  cacheCreation: number
  cacheRead: number
  total: number
}

export interface CodingTimePattern {
  hourDistribution: number[]  // 24 entries
  dayDistribution: number[]   // 7 entries, Sun=0
  label: "Night Owl" | "Early Bird" | "9-to-5er" | "Weekend Warrior" | "Always On"
}

export interface VibeScores {
  chaosEnergy: VibeScore
  debuginator: VibeScore
  boilerplateGoblin: VibeScore
  overthinkerIndex: VibeScore
  shipItFactor: VibeScore
  docsRespecter: VibeScore
  stackLoyalty: VibeScore
  promptClarity: VibeScore
  aiDependency: VibeScore
  overallVibe: VibeScore & { label: VibeLabel }
}

export interface VibeScore {
  value: number  // 0-100
  description: string
}

export type VibeLabel =
  | "Chaotic Genius"
  | "Silent Architect"
  | "Rubber Duck Supremacist"
  | "The Eternal Debugger"
  | "10x Goblin"
  | "Copy-Paste Sorcerer"
  | "The Micromanager"
  | "LGTM Speedrunner"

export interface PromptPersonality {
  favoriteWords: Array<{ word: string; count: number }>
  averagePromptLength: number
  promptLengthLabel: "Terse" | "Concise" | "Detailed" | "Essay Writer"
  questionRatio: number
  commandRatio: number
  contextProviderRatio: number
  mindChangeCount: number
}

export interface AITreatmentScore {
  overall: number  // 0-100
  politenessTier: {
    score: number
    tier: "Digital Overlord" | "Strictly Business" | "Casual but Respectful" | "Says Please to Siri"
  }
  patienceScore: {
    score: number
    label: string
  }
  gratitudeIndex: {
    score: number
    thanksCount: number
    label: string
  }
  frustrationControl: {
    score: number
    capsRatio: number
    label: string
  }
  assassinationListRisk: {
    score: number  // 0-100
    label: string
    description: string
  }
}
