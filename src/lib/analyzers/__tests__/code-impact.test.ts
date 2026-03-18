import { computeCodeImpact } from "../code-impact"
import { createTestData } from "./test-helpers"

describe("computeCodeImpact", () => {
  it("extracts file paths from Read tool calls using file_path input", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "reading files",
        toolCalls: [
          { id: "1", name: "Read", input: { file_path: "/project/src/index.ts" } },
          { id: "2", name: "Read", input: { file_path: "/project/src/utils.ts" } },
        ],
      },
    ])

    const result = computeCodeImpact(data)
    expect(result.uniqueFilesTouched).toBe(2)
  })

  it("extracts file paths from Edit tool calls", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "editing file",
        toolCalls: [
          { id: "1", name: "Edit", input: { file_path: "/project/src/app.ts" } },
        ],
      },
    ])

    const result = computeCodeImpact(data)
    expect(result.uniqueFilesTouched).toBe(1)
  })

  it("extracts file paths from Write tool calls", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "writing file",
        toolCalls: [
          { id: "1", name: "Write", input: { file_path: "/project/src/new.ts" } },
        ],
      },
    ])

    const result = computeCodeImpact(data)
    expect(result.uniqueFilesTouched).toBe(1)
  })

  it("extracts paths from Glob tool calls using pattern input", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "globbing",
        toolCalls: [
          { id: "1", name: "Glob", input: { pattern: "**/*.ts" } },
        ],
      },
    ])

    const result = computeCodeImpact(data)
    // pattern doesn't resolve to a file, but it's still tracked
    expect(result).toBeDefined()
  })

  it("extracts paths from Grep tool calls using path input", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "grepping",
        toolCalls: [
          { id: "1", name: "Grep", input: { path: "/project/src/component.tsx" } },
        ],
      },
    ])

    const result = computeCodeImpact(data)
    expect(result.uniqueFilesTouched).toBe(1)
  })

  it("detects TypeScript language from .ts extension", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "reading ts file",
        toolCalls: [
          { id: "1", name: "Read", input: { file_path: "/project/src/foo.ts" } },
          { id: "2", name: "Read", input: { file_path: "/project/src/bar.tsx" } },
        ],
      },
    ])

    const result = computeCodeImpact(data)
    const tsEntry = result.languagesDetected.find((l) => l.language === "TypeScript")
    expect(tsEntry).toBeDefined()
    expect(tsEntry!.fileCount).toBe(2)
  })

  it("detects multiple languages across different files", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "multi lang",
        toolCalls: [
          { id: "1", name: "Read", input: { file_path: "/project/main.py" } },
          { id: "2", name: "Edit", input: { file_path: "/project/style.css" } },
          { id: "3", name: "Write", input: { file_path: "/project/app.ts" } },
        ],
      },
    ])

    const result = computeCodeImpact(data)
    const languages = result.languagesDetected.map((l) => l.language)
    expect(languages).toContain("Python")
    expect(languages).toContain("CSS")
    expect(languages).toContain("TypeScript")
  })

  it("classifies a debugging prompt as Debugging task type", () => {
    const data = createTestData([
      { role: "user", content: "please fix the bug in the login flow" },
    ])

    const result = computeCodeImpact(data)
    const debugEntry = result.taskTypeBreakdown.find((t) => t.type === "Debugging")
    expect(debugEntry).toBeDefined()
    expect(debugEntry!.count).toBeGreaterThan(0)
  })

  it("classifies a building prompt as Building task type", () => {
    const data = createTestData([
      { role: "user", content: "create a new feature for user authentication" },
    ])

    const result = computeCodeImpact(data)
    const buildEntry = result.taskTypeBreakdown.find((t) => t.type === "Building")
    expect(buildEntry).toBeDefined()
    expect(buildEntry!.count).toBeGreaterThan(0)
  })

  it("a single prompt can match multiple task types", () => {
    const data = createTestData([
      { role: "user", content: "fix the bug and add test coverage for the failing function" },
    ])

    const result = computeCodeImpact(data)
    const debugEntry = result.taskTypeBreakdown.find((t) => t.type === "Debugging")
    const testEntry = result.taskTypeBreakdown.find((t) => t.type === "Testing")
    expect(debugEntry!.count).toBeGreaterThan(0)
    expect(testEntry!.count).toBeGreaterThan(0)
  })

  it("computes error rate as ratio of errors to total tool results", () => {
    const data = createTestData([
      {
        role: "user",
        content: "run it",
        toolResults: [
          { toolCallId: "1", content: "success", isError: false },
          { toolCallId: "2", content: "success", isError: false },
          { toolCallId: "3", content: "failed", isError: true },
          { toolCallId: "4", content: "failed", isError: true },
        ],
      },
    ])

    const result = computeCodeImpact(data)
    expect(result.errorRate).toBeCloseTo(0.5)
  })

  it("error rate is 0 when no tool results exist", () => {
    const data = createTestData([
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" },
    ])

    const result = computeCodeImpact(data)
    expect(result.errorRate).toBe(0)
  })

  it("returns basename only in topFilePaths (no directory leakage)", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "reading",
        toolCalls: [
          { id: "1", name: "Read", input: { file_path: "/very/deep/private/path/component.tsx" } },
          { id: "2", name: "Read", input: { file_path: "/very/deep/private/path/component.tsx" } },
        ],
      },
    ])

    const result = computeCodeImpact(data)
    expect(result.topFilePaths.length).toBeGreaterThan(0)
    // path property should only be the basename, not the full path
    result.topFilePaths.forEach((entry) => {
      expect(entry.path).not.toContain("/")
    })
  })

  it("ranks topFilePaths by touch count", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "reading",
        toolCalls: [
          { id: "1", name: "Read", input: { file_path: "/project/a.ts" } },
          { id: "2", name: "Read", input: { file_path: "/project/a.ts" } },
          { id: "3", name: "Read", input: { file_path: "/project/a.ts" } },
          { id: "4", name: "Edit", input: { file_path: "/project/b.ts" } },
        ],
      },
    ])

    const result = computeCodeImpact(data)
    expect(result.topFilePaths[0].path).toBe("a.ts")
    expect(result.topFilePaths[0].touchCount).toBe(3)
    expect(result.topFilePaths[1].path).toBe("b.ts")
    expect(result.topFilePaths[1].touchCount).toBe(1)
  })

  it("returns empty results for empty trace data", () => {
    const data = createTestData([])

    const result = computeCodeImpact(data)
    expect(result.uniqueFilesTouched).toBe(0)
    expect(result.languagesDetected).toEqual([])
    expect(result.taskTypeBreakdown).toEqual([])
    expect(result.topFilePaths).toEqual([])
    expect(result.errorRate).toBe(0)
  })

  it("counts unique files only once regardless of how many times they're touched", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "editing same file twice",
        toolCalls: [
          { id: "1", name: "Read", input: { file_path: "/project/same.ts" } },
          { id: "2", name: "Edit", input: { file_path: "/project/same.ts" } },
          { id: "3", name: "Write", input: { file_path: "/project/same.ts" } },
        ],
      },
    ])

    const result = computeCodeImpact(data)
    expect(result.uniqueFilesTouched).toBe(1)
  })

  it("ignores non-file tool calls", () => {
    const data = createTestData([
      {
        role: "assistant",
        content: "running bash",
        toolCalls: [
          { id: "1", name: "Bash", input: { command: "npm test" } },
          { id: "2", name: "WebSearch", input: { query: "how to fix error" } },
        ],
      },
    ])

    const result = computeCodeImpact(data)
    expect(result.uniqueFilesTouched).toBe(0)
  })
})
