import { detectTraceFormat } from "../file-utils"

describe("detectTraceFormat", () => {
  it("detects Tesslate Studio format with chats and agent_steps", () => {
    const content = JSON.stringify({
      exported_at: "2026-03-22T21:50:35.671961+00:00",
      chats: [],
      messages: [],
      agent_steps: [],
      usage_logs: [],
    })
    expect(detectTraceFormat(content)).toBe("tesslate-studio")
  })

  it("detects Tesslate Studio format with project key", () => {
    const content = JSON.stringify({
      exported_at: "2026-03-22T21:50:35.671961+00:00",
      project: { id: "proj-001", name: "Test" },
      messages: [],
    })
    expect(detectTraceFormat(content)).toBe("tesslate-studio")
  })

  it("detects Tesslate Studio format with projects array", () => {
    const content = JSON.stringify({
      exported_at: "2026-03-22T21:50:35.671961+00:00",
      projects: [{ id: "proj-001", name: "Test" }],
      messages: [],
    })
    expect(detectTraceFormat(content)).toBe("tesslate-studio")
  })

  it("detects Claude Code format from JSONL with sessionId", () => {
    const content = '{"uuid":"abc","sessionId":"session-1","type":"user","message":{"role":"user","content":"hello"}}\n'
    expect(detectTraceFormat(content)).toBe("claude-code")
  })

  it("returns unknown for unrecognized JSON", () => {
    const content = JSON.stringify({ foo: "bar", baz: 123 })
    expect(detectTraceFormat(content)).toBe("unknown")
  })

  it("returns unknown for non-JSON text", () => {
    expect(detectTraceFormat("this is not json at all")).toBe("unknown")
  })

  it("returns unknown for empty string", () => {
    expect(detectTraceFormat("")).toBe("unknown")
  })
})
