import { computeCostEstimate } from "../cost-estimate"
import { createTestData } from "./test-helpers"

describe("computeCostEstimate", () => {
  it("calculates cost correctly for a known model (claude-sonnet-4-6)", () => {
    // claude-sonnet-4-6: input $3/1M, output $15/1M
    // 1,000,000 input tokens → $3.00
    // 1,000,000 output tokens → $15.00
    const data = createTestData([
      {
        role: "assistant",
        content: "response",
        model: "claude-sonnet-4-6",
        tokenUsage: { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      },
    ])

    const result = computeCostEstimate(data)
    expect(result.totalCost).toBeCloseTo(18.0)
    expect(result.usedFallbackPricing).toBe(false)
  })

  it("calculates cost correctly for claude-opus-4-6", () => {
    // claude-opus-4-6: input $5/1M, output $25/1M
    const data = createTestData([
      {
        role: "assistant",
        content: "response",
        model: "claude-opus-4-6",
        tokenUsage: { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      },
    ])

    const result = computeCostEstimate(data)
    expect(result.totalCost).toBeCloseTo(30.0)
    expect(result.usedFallbackPricing).toBe(false)
  })

  it("uses fallback pricing for unknown model", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "response",
        model: "some-unknown-model-v999",
        tokenUsage: { inputTokens: 1_000_000, outputTokens: 0 },
      },
    ])

    const result = computeCostEstimate(data)
    // fallback = _default: input $3/1M → $3
    expect(result.totalCost).toBeCloseTo(3.0)
    expect(result.usedFallbackPricing).toBe(true)
  })

  it("sets usedFallbackPricing true when any message uses unknown model", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "response",
        model: "claude-sonnet-4-6",
        tokenUsage: { inputTokens: 100_000, outputTokens: 100_000 },
      },
      {
        role: "assistant",
        content: "response",
        model: "gpt-4-unknown",
        tokenUsage: { inputTokens: 100_000, outputTokens: 0 },
      },
    ])

    const result = computeCostEstimate(data)
    expect(result.usedFallbackPricing).toBe(true)
  })

  it("usedFallbackPricing is false when all models are known", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "response",
        model: "claude-sonnet-4-6",
        tokenUsage: { inputTokens: 100_000, outputTokens: 100_000 },
      },
      {
        role: "assistant",
        content: "response",
        model: "claude-haiku-4-5",
        tokenUsage: { inputTokens: 100_000, outputTokens: 100_000 },
      },
    ])

    const result = computeCostEstimate(data)
    expect(result.usedFallbackPricing).toBe(false)
  })

  it("uses fallback pricing when message has no model set", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "response",
        tokenUsage: { inputTokens: 500_000, outputTokens: 0 },
        // no model field
      },
    ])

    const result = computeCostEstimate(data)
    expect(result.usedFallbackPricing).toBe(true)
  })

  it("computes tokenDistribution totals from all messages", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "r1",
        model: "claude-sonnet-4-6",
        tokenUsage: { inputTokens: 100, outputTokens: 200 },
      },
      {
        role: "assistant",
        content: "r2",
        model: "claude-sonnet-4-6",
        tokenUsage: { inputTokens: 300, outputTokens: 400 },
      },
    ])

    const result = computeCostEstimate(data)
    expect(result.tokenDistribution.input).toBe(400)
    expect(result.tokenDistribution.output).toBe(600)
    expect(result.tokenDistribution.cacheCreation).toBe(0)
    expect(result.tokenDistribution.cacheRead).toBe(0)
  })

  it("includes cacheCreation and cacheRead in tokenDistribution", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "r1",
        model: "claude-sonnet-4-6",
        tokenUsage: {
          inputTokens: 100,
          outputTokens: 50,
          cacheCreationTokens: 200,
          cacheReadTokens: 150,
        },
      },
    ])

    const result = computeCostEstimate(data)
    expect(result.tokenDistribution.cacheCreation).toBe(200)
    expect(result.tokenDistribution.cacheRead).toBe(150)
  })

  it("includes a breakdown entry per model", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "r1",
        model: "claude-sonnet-4-6",
        tokenUsage: { inputTokens: 100_000, outputTokens: 50_000 },
      },
      {
        role: "assistant",
        content: "r2",
        model: "claude-haiku-4-5",
        tokenUsage: { inputTokens: 200_000, outputTokens: 100_000 },
      },
    ])

    const result = computeCostEstimate(data)
    expect(result.breakdown).toHaveLength(2)
    const sonnetEntry = result.breakdown.find((b) => b.model === "claude-sonnet-4-6")
    const haikuEntry = result.breakdown.find((b) => b.model === "claude-haiku-4-5")
    expect(sonnetEntry).toBeDefined()
    expect(haikuEntry).toBeDefined()
  })

  it("aggregates tokens per model in breakdown", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "r1",
        model: "claude-sonnet-4-6",
        tokenUsage: { inputTokens: 100_000, outputTokens: 50_000 },
      },
      {
        role: "assistant",
        content: "r2",
        model: "claude-sonnet-4-6",
        tokenUsage: { inputTokens: 200_000, outputTokens: 100_000 },
      },
    ])

    const result = computeCostEstimate(data)
    expect(result.breakdown).toHaveLength(1)
    expect(result.breakdown[0].inputTokens).toBe(300_000)
    expect(result.breakdown[0].outputTokens).toBe(150_000)
  })

  it("returns zero cost and empty breakdown for empty trace data", () => {
    const data = createTestData([])

    const result = computeCostEstimate(data)
    expect(result.totalCost).toBe(0)
    expect(result.usedFallbackPricing).toBe(false)
    expect(result.breakdown).toEqual([])
    expect(result.tokenDistribution).toEqual({
      input: 0,
      output: 0,
      cacheCreation: 0,
      cacheRead: 0,
    })
  })

  it("skips messages with no tokenUsage", () => {
    const data = createTestData([
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi", model: "claude-sonnet-4-6" },
    ])

    const result = computeCostEstimate(data)
    expect(result.totalCost).toBe(0)
    expect(result.breakdown).toEqual([])
  })

  it("totalCost is sum of all breakdown costs", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "r1",
        model: "claude-sonnet-4-6",
        tokenUsage: { inputTokens: 1_000_000, outputTokens: 0 },
      },
      {
        role: "assistant",
        content: "r2",
        model: "claude-haiku-4-5",
        tokenUsage: { inputTokens: 1_000_000, outputTokens: 0 },
      },
    ])

    const result = computeCostEstimate(data)
    // sonnet input: $3.0, haiku input: $1.0
    expect(result.totalCost).toBeCloseTo(4.0)
    const breakdownSum = result.breakdown.reduce((acc, b) => acc + b.cost, 0)
    expect(result.totalCost).toBeCloseTo(breakdownSum)
  })
})
