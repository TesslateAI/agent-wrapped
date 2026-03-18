import type { TraceData, CostEstimate } from "@/lib/types"

// Prices per 1M tokens (base input / output), last updated 2026-03
// Source: https://docs.anthropic.com/en/docs/about-claude/models#model-comparison-table
const PRICING: Record<string, { input: number; output: number }> = {
  // Opus family
  "claude-opus-4-6":              { input: 5.0,   output: 25.0 },
  "claude-opus-4-5":              { input: 5.0,   output: 25.0 },
  "claude-opus-4-1":              { input: 15.0,  output: 75.0 },
  "claude-opus-4":                { input: 15.0,  output: 75.0 },
  "claude-3-opus":                { input: 15.0,  output: 75.0 },
  "claude-3-opus-20240229":       { input: 15.0,  output: 75.0 },
  // Sonnet family
  "claude-sonnet-4-6":            { input: 3.0,   output: 15.0 },
  "claude-sonnet-4-5":            { input: 3.0,   output: 15.0 },
  "claude-sonnet-4-5-20250514":   { input: 3.0,   output: 15.0 },
  "claude-sonnet-4":              { input: 3.0,   output: 15.0 },
  "claude-3-7-sonnet":            { input: 3.0,   output: 15.0 },
  "claude-3-5-sonnet":            { input: 3.0,   output: 15.0 },
  "claude-3-5-sonnet-20241022":   { input: 3.0,   output: 15.0 },
  "claude-3-5-sonnet-20240620":   { input: 3.0,   output: 15.0 },
  // Haiku family
  "claude-haiku-4-5":             { input: 1.0,   output: 5.0 },
  "claude-haiku-4-5-20251001":    { input: 1.0,   output: 5.0 },
  "claude-3-5-haiku":             { input: 0.8,   output: 4.0 },
  "claude-3-5-haiku-20241022":    { input: 0.8,   output: 4.0 },
  "claude-3-haiku":               { input: 0.25,  output: 1.25 },
  "claude-3-haiku-20240307":      { input: 0.25,  output: 1.25 },
  // Fallback for unknown models
  _default:                       { input: 3.0,   output: 15.0 },
}

export function computeCostEstimate(data: TraceData): CostEstimate {
  const allMessages = data.sessions.flatMap((s) => s.messages)

  // Accumulate per-model token usage
  const modelTokens = new Map<string, { inputTokens: number; outputTokens: number }>()
  let usedFallbackPricing = false

  // Token distribution totals
  const tokenDistribution = { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 }

  for (const message of allMessages) {
    if (!message.tokenUsage) continue

    const { inputTokens, outputTokens, cacheCreationTokens = 0, cacheReadTokens = 0 } =
      message.tokenUsage

    // Determine the breakdown key: use the model name if it has known pricing, otherwise "_default"
    const model = message.model
    const breakdownKey = model && model in PRICING ? model : "_default"
    if (breakdownKey === "_default") {
      usedFallbackPricing = true
    }

    const existing = modelTokens.get(breakdownKey) ?? { inputTokens: 0, outputTokens: 0 }
    modelTokens.set(breakdownKey, {
      inputTokens: existing.inputTokens + inputTokens,
      outputTokens: existing.outputTokens + outputTokens,
    })

    // Accumulate token distribution
    tokenDistribution.input += inputTokens
    tokenDistribution.output += outputTokens
    tokenDistribution.cacheCreation += cacheCreationTokens
    tokenDistribution.cacheRead += cacheReadTokens
  }

  // Build breakdown and compute total cost
  const breakdown = Array.from(modelTokens.entries()).map(([model, tokens]) => {
    const price = PRICING[model] ?? PRICING._default
    const cost =
      (tokens.inputTokens / 1_000_000) * price.input +
      (tokens.outputTokens / 1_000_000) * price.output
    return {
      model,
      inputTokens: tokens.inputTokens,
      outputTokens: tokens.outputTokens,
      cost,
    }
  })

  const totalCost = breakdown.reduce((acc, b) => acc + b.cost, 0)

  return {
    totalCost,
    usedFallbackPricing,
    breakdown,
    tokenDistribution,
  }
}
