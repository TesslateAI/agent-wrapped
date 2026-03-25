/**
 * File utility functions for reading and validating uploaded trace files.
 * All processing is client-side — no data leaves the browser.
 */

const ACCEPTED_EXTENSIONS = [".jsonl", ".json", ".zip"]
const TRACE_EXTENSIONS = [".jsonl", ".json"]
const DEFAULT_MAX_BYTES = 100 * 1024 * 1024 // 100MB

/**
 * Read a File object as UTF-8 text using the FileReader API.
 */
export async function readFileAsText(file: File): Promise<string> {
  return file.text()
}

/**
 * Parse a JSONL string into an array of parsed objects.
 * Skips empty lines and malformed JSON (logs a warning, does not throw).
 */
export function parseJSONL(text: string): unknown[] {
  const results: unknown[] = []
  const lines = text.split("\n")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === "") continue

    try {
      results.push(JSON.parse(line))
    } catch {
      console.warn(`Skipping malformed JSON at line ${i + 1}`)
    }
  }

  return results
}

/**
 * Validate that a file has an accepted extension.
 */
export function validateFileType(file: File): boolean {
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

/**
 * Check if a file is a trace file we want to parse (JSONL conversation logs).
 */
export function isTraceFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return TRACE_EXTENSIONS.some((ext) => name.endsWith(ext))
}

/**
 * Validate that a file does not exceed the maximum allowed size.
 */
export function validateFileSize(
  file: File,
  maxBytes: number = DEFAULT_MAX_BYTES
): boolean {
  return file.size <= maxBytes
}

/**
 * Recursively read all files from a dropped directory using the
 * File System Access API (webkitGetAsEntry).
 */
export async function readDirectoryEntries(
  dataTransferItems: DataTransferItemList
): Promise<File[]> {
  const files: File[] = []

  const readEntry = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file(resolve, reject)
      })
      files.push(file)
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry
      const reader = dirEntry.createReader()
      let batch: FileSystemEntry[] = []
      // readEntries returns batches — keep reading until empty
      do {
        batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
          reader.readEntries(resolve, reject)
        })
        for (const child of batch) {
          await readEntry(child)
        }
      } while (batch.length > 0)
    }
  }

  const entries: FileSystemEntry[] = []
  for (let i = 0; i < dataTransferItems.length; i++) {
    const item = dataTransferItems[i]
    const entry = item.webkitGetAsEntry?.()
    if (entry) entries.push(entry)
  }

  await Promise.all(entries.map(readEntry))
  return files
}

// JSON files that are never trace files (common project config files)
const JSON_SKIP_LIST = new Set([
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "tsconfig.node.json",
  "tsconfig.app.json",
  "next.config.json",
  ".eslintrc.json",
  "composer.json",
  "manifest.json",
  "settings.json",
  "launch.json",
  "extensions.json",
])

/**
 * Filter files from a directory to only include relevant trace files.
 * Accepts .jsonl files (Claude Code) and .json files (Tesslate Studio).
 * Skips meta files, settings, and other non-trace files.
 */
export function filterTraceFiles(files: File[]): File[] {
  return files.filter((file) => {
    const path = file.webkitRelativePath || file.name
    const name = file.name.toLowerCase()

    // Must be a JSONL or JSON file
    if (!name.endsWith(".jsonl") && !name.endsWith(".json")) return false

    // Skip the global history.jsonl (it's just snapshots, not full conversations)
    if (name === "history.jsonl") return false

    // Skip subagent meta files
    if (name.endsWith(".meta.json")) return false

    // Skip known non-trace JSON config files
    if (JSON_SKIP_LIST.has(name)) return false

    const pathLower = path.toLowerCase()

    // Skip settings, cache, and other non-trace directories
    if (pathLower.includes("/cache/") || pathLower.includes("/backups/")) return false
    if (pathLower.includes("/node_modules/")) return false

    return true
  })
}

/**
 * Detect the trace format from file content.
 * Checks for Tesslate Studio signature keys in JSON files.
 */
export function detectTraceFormat(text: string): "claude-code" | "tesslate-studio" | "unknown" {
  // Try to parse as JSON first (Tesslate format)
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed === "object" && parsed !== null) {
      // Tesslate exports have "chats" + ("agent_steps" or "messages" + "usage_logs")
      const hasTesslateKeys =
        ("chats" in parsed && "agent_steps" in parsed) ||
        ("chats" in parsed && "messages" in parsed && "usage_logs" in parsed) ||
        ("project" in parsed && "messages" in parsed) ||
        ("projects" in parsed && "messages" in parsed)
      if (hasTesslateKeys) return "tesslate-studio"
    }
  } catch {
    // Not valid JSON — could be JSONL (Claude Code format)
  }

  // Check if it looks like JSONL (Claude Code)
  const firstLine = text.split("\n").find((l) => l.trim() !== "")
  if (firstLine) {
    try {
      const parsed = JSON.parse(firstLine)
      if (typeof parsed === "object" && parsed !== null && "sessionId" in parsed) {
        return "claude-code"
      }
    } catch {
      // Not JSONL either
    }
  }

  return "unknown"
}

/**
 * Extract metadata files from a directory upload for environment insights.
 * Returns categorized files: plugins, plans, todos, subagent metas.
 */
export function extractMetadataFiles(files: File[]): {
  pluginsFile: File | null
  planFiles: File[]
  todoFiles: File[]
  subagentMetas: File[]
} {
  let pluginsFile: File | null = null
  const planFiles: File[] = []
  const todoFiles: File[] = []
  const subagentMetas: File[] = []

  for (const file of files) {
    const path = (file.webkitRelativePath || file.name).toLowerCase()
    const name = file.name.toLowerCase()

    if (name === "installed_plugins.json" && path.includes("plugins")) {
      pluginsFile = file
    } else if (path.includes("/plans/") && name.endsWith(".md")) {
      planFiles.push(file)
    } else if (path.includes("/todos/") && name.endsWith(".json")) {
      todoFiles.push(file)
    } else if (name.endsWith(".meta.json") && path.includes("subagents")) {
      subagentMetas.push(file)
    }
  }

  return { pluginsFile, planFiles, todoFiles, subagentMetas }
}
