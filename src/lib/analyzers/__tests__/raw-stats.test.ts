import { computeRawStats } from "../raw-stats"
import { createTestData, createMultiSessionData } from "./test-helpers"

describe("computeRawStats", () => {
  it("computes basic counts correctly", () => {
    const data = createTestData([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
      { role: "user", content: "Fix the bug" },
      { role: "assistant", content: "Done" },
    ])

    const stats = computeRawStats(data)
    expect(stats.totalSessions).toBe(1)
    expect(stats.totalMessages).toBe(4)
    expect(stats.totalUserPrompts).toBe(2)
    expect(stats.totalAssistantResponses).toBe(2)
  })

  it("aggregates token usage", () => {
    const data = createTestData([
      {
        role: "user",
        content: "Hello",
        tokenUsage: { inputTokens: 100, outputTokens: 0 },
      },
      {
        role: "assistant",
        content: "Hi",
        tokenUsage: { inputTokens: 50, outputTokens: 200 },
      },
    ])

    const stats = computeRawStats(data)
    expect(stats.totalTokensUsed.input).toBe(150)
    expect(stats.totalTokensUsed.output).toBe(200)
    expect(stats.totalTokensUsed.total).toBe(350)
  })

  it("counts tool calls and ranks them", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "Using tools",
        toolCalls: [
          { id: "1", name: "Read", input: {} },
          { id: "2", name: "Read", input: {} },
          { id: "3", name: "Edit", input: {} },
        ],
      },
    ])

    const stats = computeRawStats(data)
    expect(stats.totalToolCalls).toBe(3)
    expect(stats.topToolsUsed[0]).toEqual({ name: "Read", count: 2 })
    expect(stats.topToolsUsed[1]).toEqual({ name: "Edit", count: 1 })
  })

  it("tracks models used", () => {
    const data = createTestData([
      { role: "assistant", content: "Hi", model: "claude-3-opus" },
      { role: "assistant", content: "Hi", model: "claude-3-opus" },
      { role: "assistant", content: "Hi", model: "claude-3-sonnet" },
    ])

    const stats = computeRawStats(data)
    expect(stats.topModelsUsed[0]).toEqual({
      model: "claude-3-opus",
      count: 2,
    })
  })

  it("computes prompt length stats", () => {
    const data = createTestData([
      { role: "user", content: "Hi" },
      { role: "user", content: "This is a much longer prompt message" },
    ])

    const stats = computeRawStats(data)
    expect(stats.averagePromptLength).toBe(19) // (2 + 36) / 2
    expect(stats.longestPrompt.length).toBe(36)
    expect(stats.shortestPrompt.length).toBe(2)
  })

  it("handles empty data", () => {
    const data = createTestData([])
    const stats = computeRawStats(data)
    expect(stats.totalMessages).toBe(0)
    expect(stats.totalUserPrompts).toBe(0)
    expect(stats.averagePromptsPerSession).toBe(0)
    expect(stats.longestPrompt).toEqual({ text: "", length: 0 })
    expect(stats.shortestPrompt).toEqual({ text: "", length: 0 })
  })

  it("computes session duration for longestSession", () => {
    const data = createMultiSessionData([
      {
        messages: [{ role: "user", content: "a" }],
        startTime: "2026-03-01T10:00:00Z",
        endTime: "2026-03-01T10:30:00Z",
      },
      {
        messages: [{ role: "user", content: "b" }],
        startTime: "2026-03-01T11:00:00Z",
        endTime: "2026-03-01T13:00:00Z",
      },
    ])

    const stats = computeRawStats(data)
    expect(stats.longestSession.durationMinutes).toBe(120)
    expect(stats.longestSession.id).toBe("session-1")
  })

  it("computes coding time pattern label", () => {
    // Use local-time timestamps (no Z suffix) so getHours() returns the expected hour
    // All messages at 2am local → Night Owl
    const nightData = createTestData([
      { role: "user", content: "a", timestamp: "2026-03-01T02:00:00" },
      { role: "user", content: "b", timestamp: "2026-03-01T02:30:00" },
      { role: "user", content: "c", timestamp: "2026-03-01T03:00:00" },
    ])
    expect(computeRawStats(nightData).codingTimePatterns.label).toBe(
      "Night Owl"
    )

    // All messages at 10am local → 9-to-5er
    const dayData = createTestData([
      { role: "user", content: "a", timestamp: "2026-03-01T10:00:00" },
      { role: "user", content: "b", timestamp: "2026-03-01T10:30:00" },
    ])
    expect(computeRawStats(dayData).codingTimePatterns.label).toBe("9-to-5er")
  })

  it("counts active days from message timestamps", () => {
    const data = createTestData([
      { role: "user", content: "a", timestamp: "2026-03-01T10:00:00Z" },
      { role: "user", content: "b", timestamp: "2026-03-01T14:00:00Z" },
      { role: "user", content: "c", timestamp: "2026-03-02T10:00:00Z" },
    ])

    const stats = computeRawStats(data)
    expect(stats.activeDays).toBe(2)
  })

  it("counts top projects and git branches", () => {
    const data = createMultiSessionData([
      {
        messages: [{ role: "user", content: "a" }],
        project: "/project-a",
        gitBranch: "main",
      },
      {
        messages: [{ role: "user", content: "b" }],
        project: "/project-a",
        gitBranch: "feat/new",
      },
      {
        messages: [{ role: "user", content: "c" }],
        project: "/project-b",
        gitBranch: "main",
      },
    ])

    const stats = computeRawStats(data)
    expect(stats.topProjects[0]).toEqual({
      project: "/project-a",
      sessionCount: 2,
    })
    expect(stats.topGitBranches[0]).toEqual({ branch: "main", count: 2 })
  })

  it("sets date range from metadata", () => {
    const data = createTestData([{ role: "user", content: "hi" }])
    const stats = computeRawStats(data)
    expect(stats.dateRange.start).toBe("2026-03-01T10:00:00Z")
    expect(stats.dateRange.end).toBe("2026-03-01T11:00:00Z")
  })
})
