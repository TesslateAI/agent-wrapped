import type { TraceData, CodeImpact } from "@/lib/types"
import { FILE_TOOL_NAMES, EXTENSION_TO_LANGUAGE, TASK_TYPE_KEYWORDS, FRAMEWORK_CATEGORIES } from "./constants"

function getBasename(filePath: string): string {
  return filePath.split("/").pop() || filePath
}

function getExtension(filePath: string): string {
  const base = getBasename(filePath)
  const dotIndex = base.lastIndexOf(".")
  return dotIndex >= 0 ? base.slice(dotIndex) : ""
}

function extractFilePath(toolName: string, input: Record<string, unknown>): string | null {
  // file_path is used by Read, Edit, Write
  if (typeof input.file_path === "string" && input.file_path.length > 0) {
    return input.file_path
  }
  // path is used by Grep
  if (typeof input.path === "string" && input.path.length > 0) {
    return input.path
  }
  // pattern is used by Glob — skip these since they're glob patterns, not file paths
  // We only count actual file paths for uniqueFilesTouched / language detection
  if (toolName === "Glob") {
    return null
  }
  return null
}

export function computeCodeImpact(data: TraceData): CodeImpact {
  const allMessages = data.sessions.flatMap((s) => s.messages)

  // Collect file path touch counts (full path → count, for ranking)
  const filePathCounts = new Map<string, number>()

  for (const message of allMessages) {
    for (const tc of message.toolCalls ?? []) {
      if (!FILE_TOOL_NAMES.includes(tc.name)) continue
      const filePath = extractFilePath(tc.name, tc.input)
      if (!filePath) continue
      filePathCounts.set(filePath, (filePathCounts.get(filePath) ?? 0) + 1)
    }
  }

  // Unique files touched (by full path)
  const uniqueFilesTouched = filePathCounts.size

  // Language detection — count unique files per language
  const languageCounts = new Map<string, Set<string>>()
  for (const [filePath] of filePathCounts) {
    const ext = getExtension(filePath)
    const language = EXTENSION_TO_LANGUAGE[ext]
    if (language) {
      if (!languageCounts.has(language)) {
        languageCounts.set(language, new Set())
      }
      languageCounts.get(language)!.add(filePath)
    }
  }
  const languagesDetected = Array.from(languageCounts.entries())
    .map(([language, files]) => ({ language, fileCount: files.size }))
    .sort((a, b) => b.fileCount - a.fileCount)

  // Top file paths — by touch count, using basename only
  // When multiple full paths share the same basename, we sum their counts
  const basenameCountMap = new Map<string, number>()
  for (const [fullPath, count] of filePathCounts) {
    const base = getBasename(fullPath)
    basenameCountMap.set(base, (basenameCountMap.get(base) ?? 0) + count)
  }
  const topFilePaths = Array.from(basenameCountMap.entries())
    .map(([path, touchCount]) => ({ path, touchCount }))
    .sort((a, b) => b.touchCount - a.touchCount)
    .slice(0, 10)

  // Task type classification from user messages
  const taskTypeCounts = new Map<string, number>()
  const userMessages = allMessages.filter((m) => m.role === "user")
  for (const message of userMessages) {
    const lower = message.content.toLowerCase()
    for (const [taskType, keywords] of Object.entries(TASK_TYPE_KEYWORDS)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        taskTypeCounts.set(taskType, (taskTypeCounts.get(taskType) ?? 0) + 1)
      }
    }
  }
  const taskTypeBreakdown = Array.from(taskTypeCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  // Error rate: isError=true tool results / total tool results
  const allToolResults = allMessages.flatMap((m) => m.toolResults ?? [])
  const totalResults = allToolResults.length
  const errorCount = allToolResults.filter((r) => r.isError).length
  const errorRate = totalResults > 0 ? errorCount / totalResults : 0

  // Framework/library detection from user prompts, file paths, and tool call content
  const frameworkMentions = new Map<string, { category: string; count: number }>()
  // Build a searchable corpus from user prompts + file paths
  const corpus = userMessages.map((m) => m.content.toLowerCase()).join(" ")
    + " " + Array.from(filePathCounts.keys()).join(" ").toLowerCase()

  for (const [category, frameworks] of Object.entries(FRAMEWORK_CATEGORIES)) {
    for (const [name, keywords] of Object.entries(frameworks)) {
      let mentions = 0
      for (const kw of keywords) {
        // Count occurrences in corpus
        let idx = 0
        let pos = corpus.indexOf(kw, idx)
        while (pos !== -1) {
          mentions++
          idx = pos + kw.length
          pos = corpus.indexOf(kw, idx)
        }
      }
      if (mentions > 0) {
        frameworkMentions.set(name, { category, count: mentions })
      }
    }
  }
  const frameworksDetected = Array.from(frameworkMentions.entries())
    .map(([name, { category, count }]) => ({ name, category, mentions: count }))
    .sort((a, b) => b.mentions - a.mentions)

  return {
    languagesDetected,
    uniqueFilesTouched,
    taskTypeBreakdown,
    errorRate,
    topFilePaths,
    frameworksDetected,
  }
}
