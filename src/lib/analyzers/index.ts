import { TraceData, AnalysisResult } from "@/lib/types"
import { computeRawStats } from "./raw-stats"
import { computeVibeScores } from "./vibe-scores"
import { computePromptPersonality } from "./prompt-personality"
import { computeAITreatment } from "./ai-treatment"
import { computeSessionDetails } from "./session-details"
import { computeCodeImpact } from "./code-impact"
import { computeCostEstimate } from "./cost-estimate"
import { computeProductivityStats } from "./productivity-stats"
import { computeEngagementStats } from "./engagement-stats"
import { computeAchievements } from "./achievements"

export function analyzeTraces(data: TraceData): AnalysisResult {
  const rawStats = computeRawStats(data)
  const vibeScores = computeVibeScores(data)
  const promptPersonality = computePromptPersonality(data)
  const aiTreatment = computeAITreatment(data)
  const sessionDetails = computeSessionDetails(data)
  const codeImpact = computeCodeImpact(data)
  const costEstimate = computeCostEstimate(data)
  const engagementStats = computeEngagementStats(data, sessionDetails)
  const productivityStats = computeProductivityStats(data, sessionDetails, costEstimate)
  const achievements = computeAchievements(data, rawStats, codeImpact, engagementStats)

  return {
    rawStats,
    vibeScores,
    promptPersonality,
    aiTreatment,
    sessionDetails,
    codeImpact,
    costEstimate,
    productivityStats,
    engagementStats,
    achievements,
  }
}

export { computeRawStats } from "./raw-stats"
export { computeVibeScores } from "./vibe-scores"
export { computePromptPersonality } from "./prompt-personality"
export { computeAITreatment } from "./ai-treatment"
export { computeSessionDetails } from "./session-details"
export { computeCodeImpact } from "./code-impact"
export { computeCostEstimate } from "./cost-estimate"
export { computeProductivityStats } from "./productivity-stats"
export { computeEngagementStats } from "./engagement-stats"
export { computeAchievements } from "./achievements"
