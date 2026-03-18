import { readFileSync } from "fs"
import { join } from "path"
import { parseClaudeCodeFiles } from "../claude-code"

/**
 * Create a mock File object from a string (File API is available in Node 20+).
 */
function createMockFile(content: string, name: string): File {
  return new File([content], name, { type: "application/jsonl" })
}

const FIXTURE_PATH = join(__dirname, "fixtures", "sample-session.jsonl")
const fixtureContent = readFileSync(FIXTURE_PATH, "utf-8")

describe("parseClaudeCodeFiles", () => {
  it("parses the sample fixture into one session with correct message count", async () => {
    const file = createMockFile(fixtureContent, "session.jsonl")
    const result = await parseClaudeCodeFiles([file])

    expect(result.source).toBe("claude-code")
    expect(result.sessions).toHaveLength(1)

    const session = result.sessions[0]
    expect(session.id).toBe("session-abc-123")
    expect(session.messages).toHaveLength(8)
    expect(session.project).toBe("/Users/dev/myapp")
    expect(session.gitBranch).toBe("main")
  })

  it("extracts correct start and end times for a session", async () => {
    const file = createMockFile(fixtureContent, "session.jsonl")
    const result = await parseClaudeCodeFiles([file])

    const session = result.sessions[0]
    expect(session.startTime).toBe("2026-03-18T01:00:00.000Z")
    expect(session.endTime).toBe("2026-03-18T01:05:00.000Z")
  })

  it("extracts user message content as plain string", async () => {
    const file = createMockFile(fixtureContent, "session.jsonl")
    const result = await parseClaudeCodeFiles([file])

    const firstMsg = result.sessions[0].messages[0]
    expect(firstMsg.role).toBe("user")
    expect(firstMsg.content).toBe(
      "Can you help me fix this bug in the login function?"
    )
  })

  it("extracts tool calls from assistant messages", async () => {
    const file = createMockFile(fixtureContent, "session.jsonl")
    const result = await parseClaudeCodeFiles([file])

    // Message index 1 is the first assistant message with a tool_use
    const assistantMsg = result.sessions[0].messages[1]
    expect(assistantMsg.role).toBe("assistant")
    expect(assistantMsg.toolCalls).toBeDefined()
    expect(assistantMsg.toolCalls).toHaveLength(1)
    expect(assistantMsg.toolCalls![0].name).toBe("Read")
    expect(assistantMsg.toolCalls![0].id).toBe("tool-001")
    expect(assistantMsg.toolCalls![0].input).toEqual({
      file_path: "/Users/dev/myapp/src/auth/login.ts",
    })
  })

  it("extracts tool results from user messages and sets role to tool", async () => {
    const file = createMockFile(fixtureContent, "session.jsonl")
    const result = await parseClaudeCodeFiles([file])

    // Message index 2 is the first tool_result message
    const toolMsg = result.sessions[0].messages[2]
    expect(toolMsg.role).toBe("tool")
    expect(toolMsg.toolResults).toBeDefined()
    expect(toolMsg.toolResults).toHaveLength(1)
    expect(toolMsg.toolResults![0].toolCallId).toBe("tool-001")
    expect(toolMsg.toolResults![0].isError).toBe(false)
    expect(toolMsg.toolResults![0].content).toContain("export async function login")
  })

  it("extracts token usage from assistant messages", async () => {
    const file = createMockFile(fixtureContent, "session.jsonl")
    const result = await parseClaudeCodeFiles([file])

    const assistantMsg = result.sessions[0].messages[1]
    expect(assistantMsg.tokenUsage).toBeDefined()
    expect(assistantMsg.tokenUsage!.inputTokens).toBe(1200)
    expect(assistantMsg.tokenUsage!.outputTokens).toBe(350)
    expect(assistantMsg.tokenUsage!.cacheReadTokens).toBe(800)
  })

  it("flattens thinking + text blocks into content string", async () => {
    const file = createMockFile(fixtureContent, "session.jsonl")
    const result = await parseClaudeCodeFiles([file])

    const assistantMsg = result.sessions[0].messages[1]
    expect(assistantMsg.content).toContain(
      "The user wants help fixing a bug"
    )
    expect(assistantMsg.content).toContain(
      "I'll take a look at the login function"
    )
  })

  it("computes metadata correctly", async () => {
    const file = createMockFile(fixtureContent, "session.jsonl")
    const result = await parseClaudeCodeFiles([file])

    expect(result.metadata.totalFiles).toBe(1)
    expect(result.metadata.earliestTimestamp).toBe("2026-03-18T01:00:00.000Z")
    expect(result.metadata.latestTimestamp).toBe("2026-03-18T01:05:00.000Z")
    expect(result.metadata.projectPaths).toContain("/Users/dev/myapp")
  })

  it("skips malformed JSON lines without throwing", async () => {
    const contentWithBadLine =
      fixtureContent + "\nthis is not valid json\n" + '{"also": "incomplete'
    const file = createMockFile(contentWithBadLine, "bad.jsonl")

    const warnSpy = jest.spyOn(console, "warn").mockImplementation()
    const result = await parseClaudeCodeFiles([file])
    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0].messages).toHaveLength(8)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it("handles empty input (no files)", async () => {
    const result = await parseClaudeCodeFiles([])
    expect(result.source).toBe("claude-code")
    expect(result.sessions).toHaveLength(0)
    expect(result.metadata.totalFiles).toBe(0)
  })

  it("handles an empty file", async () => {
    const file = createMockFile("", "empty.jsonl")
    const result = await parseClaudeCodeFiles([file])
    expect(result.sessions).toHaveLength(0)
  })

  it("merges messages from multiple files with the same sessionId", async () => {
    // Split fixture: first 4 lines in file1, rest in file2
    const lines = fixtureContent.trim().split("\n")
    const file1 = createMockFile(lines.slice(0, 4).join("\n"), "part1.jsonl")
    const file2 = createMockFile(lines.slice(4).join("\n"), "part2.jsonl")

    const result = await parseClaudeCodeFiles([file1, file2])
    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0].messages).toHaveLength(8)
    expect(result.metadata.totalFiles).toBe(2)
  })

  it("creates separate sessions for different sessionIds", async () => {
    const session1Line = JSON.stringify({
      uuid: "s1-msg-001",
      timestamp: "2026-03-18T02:00:00.000Z",
      type: "user",
      message: { role: "user", content: "Hello from session 1" },
      sessionId: "session-1",
      cwd: "/project-a",
      project: "/project-a",
    })
    const session2Line = JSON.stringify({
      uuid: "s2-msg-001",
      timestamp: "2026-03-18T03:00:00.000Z",
      type: "user",
      message: { role: "user", content: "Hello from session 2" },
      sessionId: "session-2",
      cwd: "/project-b",
      project: "/project-b",
    })

    const file = createMockFile(
      `${session1Line}\n${session2Line}`,
      "multi.jsonl"
    )
    const result = await parseClaudeCodeFiles([file])

    expect(result.sessions).toHaveLength(2)
    expect(result.sessions[0].id).toBe("session-1")
    expect(result.sessions[1].id).toBe("session-2")
    expect(result.metadata.projectPaths).toEqual(
      expect.arrayContaining(["/project-a", "/project-b"])
    )
  })

  it("filters out non-user/assistant message types", async () => {
    const progressLine = JSON.stringify({
      uuid: "prog-001",
      timestamp: "2026-03-18T01:00:30.000Z",
      type: "progress",
      message: { role: "assistant", content: "Thinking..." },
      sessionId: "session-abc-123",
      cwd: "/Users/dev/myapp",
      project: "/Users/dev/myapp",
    })
    const contentWithProgress = fixtureContent + "\n" + progressLine
    const file = createMockFile(contentWithProgress, "with-progress.jsonl")

    const result = await parseClaudeCodeFiles([file])
    // The progress message should be excluded
    expect(result.sessions[0].messages).toHaveLength(8)
  })

  it("preserves model information on assistant messages", async () => {
    const file = createMockFile(fixtureContent, "session.jsonl")
    const result = await parseClaudeCodeFiles([file])

    const assistantMsg = result.sessions[0].messages[1]
    expect(assistantMsg.model).toBe("claude-sonnet-4-5-20250514")
  })
})
