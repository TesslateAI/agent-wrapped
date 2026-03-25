import { readFileSync } from "fs"
import { join } from "path"
import { parseTesslateStudioFiles } from "../tesslate-studio"

function createMockFile(content: string, name: string): File {
  return new File([content], name, { type: "application/json" })
}

const FIXTURE_PATH = join(__dirname, "fixtures", "sample-tesslate-export.json")
const fixtureContent = readFileSync(FIXTURE_PATH, "utf-8")

describe("parseTesslateStudioFiles", () => {
  it("parses fixture into correct number of sessions", async () => {
    const file = createMockFile(fixtureContent, "export.json")
    const result = await parseTesslateStudioFiles([file])

    expect(result.source).toBe("tesslate-studio")
    expect(result.sessions).toHaveLength(2)
  })

  it("maps chats to sessions with correct metadata", async () => {
    const file = createMockFile(fixtureContent, "export.json")
    const result = await parseTesslateStudioFiles([file])

    const session1 = result.sessions[0]
    expect(session1.id).toBe("chat-001")
    expect(session1.project).toBe("Test Project")
    expect(session1.startTime).toBe("2026-03-22T10:00:00.000000+00:00")
  })

  it("maps messages correctly with roles", async () => {
    const file = createMockFile(fixtureContent, "export.json")
    const result = await parseTesslateStudioFiles([file])

    const session1 = result.sessions[0]
    expect(session1.messages).toHaveLength(3)
    expect(session1.messages[0].role).toBe("user")
    expect(session1.messages[0].content).toBe("install shadcn please")
    expect(session1.messages[1].role).toBe("assistant")
    expect(session1.messages[2].role).toBe("user")
    expect(session1.messages[2].content).toBe("thanks, that looks great!")
  })

  it("expands agent steps into tool calls and results", async () => {
    const file = createMockFile(fixtureContent, "export.json")
    const result = await parseTesslateStudioFiles([file])

    // Chat-001 assistant message should have 2 tool calls from 2 steps
    const assistantMsg = result.sessions[0].messages[1]
    expect(assistantMsg.toolCalls).toHaveLength(2)
    expect(assistantMsg.toolCalls![0].name).toBe("bash_exec")
    expect(assistantMsg.toolCalls![1].name).toBe("read_file")

    expect(assistantMsg.toolResults).toHaveLength(2)
    expect(assistantMsg.toolResults![0].isError).toBe(false)
    expect(assistantMsg.toolResults![1].isError).toBe(false)
  })

  it("marks failed tool results as errors", async () => {
    const file = createMockFile(fixtureContent, "export.json")
    const result = await parseTesslateStudioFiles([file])

    // Chat-002 assistant message has a failing bash_exec at step_index 2
    const assistantMsg = result.sessions[1].messages[1]
    expect(assistantMsg.toolCalls).toHaveLength(3)
    expect(assistantMsg.toolResults).toHaveLength(3)

    // The last tool result should be an error
    const lastResult = assistantMsg.toolResults![2]
    expect(lastResult.isError).toBe(true)
    expect(lastResult.content).toContain("Test failed")
  })

  it("correlates usage logs with assistant messages for token data", async () => {
    const file = createMockFile(fixtureContent, "export.json")
    const result = await parseTesslateStudioFiles([file])

    // First assistant message should have usage log correlated
    const msg1 = result.sessions[0].messages[1]
    expect(msg1.tokenUsage).toBeDefined()
    expect(msg1.tokenUsage!.inputTokens).toBe(1500)
    expect(msg1.tokenUsage!.outputTokens).toBe(200)
  })

  it("normalizes model names (strips builtin/ prefix)", async () => {
    const file = createMockFile(fixtureContent, "export.json")
    const result = await parseTesslateStudioFiles([file])

    // First usage log has "builtin/claude-sonnet-4.6" — should be normalized
    const msg1 = result.sessions[0].messages[1]
    expect(msg1.model).toBe("claude-sonnet-4-6")
  })

  it("populates metadata correctly", async () => {
    const file = createMockFile(fixtureContent, "export.json")
    const result = await parseTesslateStudioFiles([file])

    expect(result.metadata.totalFiles).toBe(1)
    expect(result.metadata.projectPaths).toContain("Test Project")
    expect(result.metadata.earliestTimestamp).toBeTruthy()
    expect(result.metadata.latestTimestamp).toBeTruthy()
  })

  it("handles empty messages gracefully", async () => {
    const emptyExport = JSON.stringify({
      exported_at: "2026-03-22T21:50:35.671961+00:00",
      project: {
        id: "proj-empty",
        name: "Empty",
        slug: "empty",
        owner_id: "user-001",
        created_at: "2026-03-22T10:00:00.000000+00:00",
        updated_at: "2026-03-22T10:00:00.000000+00:00",
      },
      chats: [],
      messages: [],
      agent_steps: [],
      usage_logs: [],
    })
    const file = createMockFile(emptyExport, "empty.json")
    const result = await parseTesslateStudioFiles([file])

    expect(result.source).toBe("tesslate-studio")
    expect(result.sessions).toHaveLength(0)
  })

  it("handles multi-project (full dump) format with projects array", async () => {
    const parsed = JSON.parse(fixtureContent)
    // Convert single-project to multi-project format
    const multiProject = {
      ...parsed,
      projects: [parsed.project],
      export_type: "full_production_dump",
    }
    delete multiProject.project

    const file = createMockFile(JSON.stringify(multiProject), "full-dump.json")
    const result = await parseTesslateStudioFiles([file])

    expect(result.source).toBe("tesslate-studio")
    expect(result.sessions).toHaveLength(2)
    expect(result.sessions[0].project).toBe("Test Project")
  })
})
