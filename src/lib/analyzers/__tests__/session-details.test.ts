import { computeSessionDetails } from "../session-details"
import { createTestData, createMultiSessionData } from "./test-helpers"

describe("computeSessionDetails", () => {
  describe("per-session aggregates", () => {
    it("returns correct messageCount and userPromptCount", () => {
      const data = createTestData([
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
        { role: "user", content: "Fix the bug" },
        { role: "assistant", content: "Done" },
      ])

      const result = computeSessionDetails(data)
      expect(result.sessions).toHaveLength(1)
      expect(result.sessions[0].messageCount).toBe(4)
      expect(result.sessions[0].userPromptCount).toBe(2)
    })

    it("computes durationMinutes from startTime and endTime", () => {
      const data = createTestData(
        [{ role: "user", content: "hi" }],
        {
          startTime: "2026-03-01T10:00:00Z",
          endTime: "2026-03-01T10:45:00Z",
        }
      )

      const result = computeSessionDetails(data)
      expect(result.sessions[0].durationMinutes).toBe(45)
    })

    it("returns durationMinutes of 0 for invalid timestamps", () => {
      const data = createTestData(
        [{ role: "user", content: "hi" }],
        {
          startTime: "not-a-date",
          endTime: "also-not-a-date",
        }
      )

      const result = computeSessionDetails(data)
      expect(result.sessions[0].durationMinutes).toBe(0)
    })

    it("returns durationMinutes of 0 when end is before start", () => {
      const data = createTestData(
        [{ role: "user", content: "hi" }],
        {
          startTime: "2026-03-01T11:00:00Z",
          endTime: "2026-03-01T10:00:00Z",
        }
      )

      const result = computeSessionDetails(data)
      expect(result.sessions[0].durationMinutes).toBe(0)
    })

    it("preserves session metadata fields", () => {
      const data = createTestData(
        [{ role: "user", content: "hi" }],
        {
          sessionId: "my-session-id",
          project: "/my/project",
          gitBranch: "feat/new-thing",
          startTime: "2026-03-01T09:00:00Z",
          endTime: "2026-03-01T09:30:00Z",
        }
      )

      const s = computeSessionDetails(data).sessions[0]
      expect(s.id).toBe("my-session-id")
      expect(s.project).toBe("/my/project")
      expect(s.gitBranch).toBe("feat/new-thing")
      expect(s.startTime).toBe("2026-03-01T09:00:00Z")
      expect(s.endTime).toBe("2026-03-01T09:30:00Z")
    })

    it("collects user prompts in order", () => {
      const data = createTestData([
        { role: "user", content: "first prompt" },
        { role: "assistant", content: "response" },
        { role: "user", content: "second prompt" },
      ])

      const s = computeSessionDetails(data).sessions[0]
      expect(s.userPrompts).toEqual(["first prompt", "second prompt"])
    })
  })

  describe("prompt truncation", () => {
    it("truncates user prompts to 500 characters", () => {
      const longPrompt = "a".repeat(600)
      const data = createTestData([
        { role: "user", content: longPrompt },
      ])

      const s = computeSessionDetails(data).sessions[0]
      expect(s.userPrompts[0]).toHaveLength(500)
      expect(s.userPrompts[0]).toBe("a".repeat(500))
    })

    it("does not truncate prompts under 500 characters", () => {
      const shortPrompt = "short prompt"
      const data = createTestData([
        { role: "user", content: shortPrompt },
      ])

      const s = computeSessionDetails(data).sessions[0]
      expect(s.userPrompts[0]).toBe(shortPrompt)
    })

    it("truncates a prompt that is exactly 500 characters without modifying it", () => {
      const exactPrompt = "b".repeat(500)
      const data = createTestData([
        { role: "user", content: exactPrompt },
      ])

      const s = computeSessionDetails(data).sessions[0]
      expect(s.userPrompts[0]).toHaveLength(500)
    })
  })

  describe("prompt limit per session", () => {
    it("limits userPrompts array to 20 entries", () => {
      const messages = Array.from({ length: 25 }, (_, i) => ({
        role: "user" as const,
        content: `prompt ${i + 1}`,
      }))
      const data = createTestData(messages)

      const s = computeSessionDetails(data).sessions[0]
      expect(s.userPrompts).toHaveLength(20)
      expect(s.userPrompts[0]).toBe("prompt 1")
      expect(s.userPrompts[19]).toBe("prompt 20")
    })

    it("does not affect userPromptCount — it still reflects the actual total", () => {
      const messages = Array.from({ length: 25 }, (_, i) => ({
        role: "user" as const,
        content: `prompt ${i + 1}`,
      }))
      const data = createTestData(messages)

      const s = computeSessionDetails(data).sessions[0]
      expect(s.userPromptCount).toBe(25)
      expect(s.userPrompts).toHaveLength(20)
    })
  })

  describe("token counting", () => {
    it("sums input and output tokens across all messages", () => {
      const data = createTestData([
        {
          role: "user",
          content: "hello",
          tokenUsage: { inputTokens: 100, outputTokens: 0 },
        },
        {
          role: "assistant",
          content: "hi",
          tokenUsage: { inputTokens: 50, outputTokens: 200 },
        },
      ])

      const s = computeSessionDetails(data).sessions[0]
      expect(s.tokenCount).toBe(350)
    })

    it("returns 0 tokenCount when no messages have tokenUsage", () => {
      const data = createTestData([
        { role: "user", content: "hello" },
        { role: "assistant", content: "world" },
      ])

      const s = computeSessionDetails(data).sessions[0]
      expect(s.tokenCount).toBe(0)
    })

    it("handles partial tokenUsage — skips messages without it", () => {
      const data = createTestData([
        {
          role: "user",
          content: "hello",
          tokenUsage: { inputTokens: 10, outputTokens: 5 },
        },
        { role: "assistant", content: "no tokens here" },
      ])

      const s = computeSessionDetails(data).sessions[0]
      expect(s.tokenCount).toBe(15)
    })
  })

  describe("tool call counting and top tools", () => {
    it("counts total tool calls across all messages", () => {
      const data = createTestData([
        {
          role: "assistant",
          content: "working",
          toolCalls: [
            { id: "1", name: "Read", input: {} },
            { id: "2", name: "Edit", input: {} },
          ],
        },
        {
          role: "assistant",
          content: "more work",
          toolCalls: [
            { id: "3", name: "Read", input: {} },
          ],
        },
      ])

      const s = computeSessionDetails(data).sessions[0]
      expect(s.toolCallCount).toBe(3)
    })

    it("returns top 5 tools sorted by count descending", () => {
      const data = createTestData([
        {
          role: "assistant",
          content: "working",
          toolCalls: [
            { id: "1", name: "Read", input: {} },
            { id: "2", name: "Read", input: {} },
            { id: "3", name: "Read", input: {} },
            { id: "4", name: "Edit", input: {} },
            { id: "5", name: "Edit", input: {} },
            { id: "6", name: "Bash", input: {} },
            { id: "7", name: "Glob", input: {} },
            { id: "8", name: "Grep", input: {} },
            { id: "9", name: "Write", input: {} },
          ],
        },
      ])

      const s = computeSessionDetails(data).sessions[0]
      expect(s.topTools).toHaveLength(5)
      expect(s.topTools[0]).toEqual({ name: "Read", count: 3 })
      expect(s.topTools[1]).toEqual({ name: "Edit", count: 2 })
    })

    it("returns fewer than 5 top tools when fewer distinct tools used", () => {
      const data = createTestData([
        {
          role: "assistant",
          content: "working",
          toolCalls: [
            { id: "1", name: "Read", input: {} },
            { id: "2", name: "Edit", input: {} },
          ],
        },
      ])

      const s = computeSessionDetails(data).sessions[0]
      expect(s.topTools).toHaveLength(2)
    })

    it("returns 0 toolCallCount and empty topTools with no tool calls", () => {
      const data = createTestData([
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello" },
      ])

      const s = computeSessionDetails(data).sessions[0]
      expect(s.toolCallCount).toBe(0)
      expect(s.topTools).toEqual([])
    })
  })

  describe("error counting", () => {
    it("counts tool results with isError = true", () => {
      const data = createTestData([
        {
          role: "user",
          content: "run this",
          toolResults: [
            { toolCallId: "1", content: "success output", isError: false },
            { toolCallId: "2", content: "error output", isError: true },
          ],
        },
        {
          role: "assistant",
          content: "fixing it",
          toolResults: [
            { toolCallId: "3", content: "another error", isError: true },
          ],
        },
      ])

      const s = computeSessionDetails(data).sessions[0]
      expect(s.errorCount).toBe(2)
    })

    it("returns 0 errorCount when all tool results succeed", () => {
      const data = createTestData([
        {
          role: "user",
          content: "run this",
          toolResults: [
            { toolCallId: "1", content: "ok", isError: false },
          ],
        },
      ])

      const s = computeSessionDetails(data).sessions[0]
      expect(s.errorCount).toBe(0)
    })

    it("returns 0 errorCount when there are no tool results", () => {
      const data = createTestData([
        { role: "user", content: "hi" },
      ])

      const s = computeSessionDetails(data).sessions[0]
      expect(s.errorCount).toBe(0)
    })
  })

  describe("timeline grouped by date", () => {
    it("groups sessions by date from startTime", () => {
      const data = createMultiSessionData([
        {
          messages: [{ role: "user", content: "a" }],
          startTime: "2026-03-01T09:00:00Z",
          endTime: "2026-03-01T10:00:00Z",
        },
        {
          messages: [{ role: "user", content: "b" }],
          startTime: "2026-03-01T14:00:00Z",
          endTime: "2026-03-01T15:00:00Z",
        },
        {
          messages: [
            { role: "user", content: "c" },
            { role: "assistant", content: "d" },
          ],
          startTime: "2026-03-02T10:00:00Z",
          endTime: "2026-03-02T11:00:00Z",
        },
      ])

      const result = computeSessionDetails(data)
      expect(result.timeline).toHaveLength(2)

      const day1 = result.timeline.find((t) => t.date === "2026-03-01")
      expect(day1).toBeDefined()
      expect(day1!.sessionCount).toBe(2)
      expect(day1!.messageCount).toBe(2) // 1 + 1

      const day2 = result.timeline.find((t) => t.date === "2026-03-02")
      expect(day2).toBeDefined()
      expect(day2!.sessionCount).toBe(1)
      expect(day2!.messageCount).toBe(2)
    })

    it("returns timeline sorted chronologically", () => {
      const data = createMultiSessionData([
        {
          messages: [{ role: "user", content: "a" }],
          startTime: "2026-03-05T10:00:00Z",
          endTime: "2026-03-05T11:00:00Z",
        },
        {
          messages: [{ role: "user", content: "b" }],
          startTime: "2026-03-03T10:00:00Z",
          endTime: "2026-03-03T11:00:00Z",
        },
        {
          messages: [{ role: "user", content: "c" }],
          startTime: "2026-03-04T10:00:00Z",
          endTime: "2026-03-04T11:00:00Z",
        },
      ])

      const result = computeSessionDetails(data)
      const dates = result.timeline.map((t) => t.date)
      expect(dates).toEqual(["2026-03-03", "2026-03-04", "2026-03-05"])
    })

    it("returns empty timeline when there are no sessions", () => {
      const data: import("@/lib/types").TraceData = {
        source: "claude-code",
        sessions: [],
        metadata: {
          totalFiles: 0,
          earliestTimestamp: "",
          latestTimestamp: "",
          projectPaths: [],
        },
      }

      const result = computeSessionDetails(data)
      expect(result.sessions).toEqual([])
      expect(result.timeline).toEqual([])
    })
  })

  describe("empty sessions handling", () => {
    it("handles a session with no messages", () => {
      const data: import("@/lib/types").TraceData = {
        source: "claude-code",
        sessions: [
          {
            id: "empty-session",
            startTime: "2026-03-01T10:00:00Z",
            endTime: "2026-03-01T10:30:00Z",
            project: "/test/project",
            messages: [],
            cwd: "/test/project",
          },
        ],
        metadata: {
          totalFiles: 1,
          earliestTimestamp: "2026-03-01T10:00:00Z",
          latestTimestamp: "2026-03-01T10:30:00Z",
          projectPaths: ["/test/project"],
        },
      }

      const result = computeSessionDetails(data)
      const s = result.sessions[0]
      expect(s.messageCount).toBe(0)
      expect(s.userPromptCount).toBe(0)
      expect(s.tokenCount).toBe(0)
      expect(s.toolCallCount).toBe(0)
      expect(s.errorCount).toBe(0)
      expect(s.topTools).toEqual([])
      expect(s.userPrompts).toEqual([])
      expect(s.durationMinutes).toBe(30)
    })
  })
})
