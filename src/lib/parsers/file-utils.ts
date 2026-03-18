/**
 * File utility functions for reading and validating uploaded trace files.
 * All processing is client-side — no data leaves the browser.
 */

const ACCEPTED_EXTENSIONS = [".jsonl", ".json", ".zip"]
const TRACE_EXTENSIONS = [".jsonl"]
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

/**
 * Filter files from a directory to only include relevant Claude Code trace files.
 * Looks for .jsonl files in projects/ subdirectories (conversation logs).
 * Skips meta files, settings, and other non-trace files.
 */
export function filterTraceFiles(files: File[]): File[] {
  return files.filter((file) => {
    const path = file.webkitRelativePath || file.name
    const name = file.name.toLowerCase()

    // Must be a JSONL file
    if (!name.endsWith(".jsonl")) return false

    // Skip the global history.jsonl (it's just snapshots, not full conversations)
    if (name === "history.jsonl") return false

    // Skip subagent meta files
    if (name.endsWith(".meta.json")) return false

    // Prefer files inside projects/ directories (full conversation logs)
    // but also accept top-level .jsonl files
    const pathLower = path.toLowerCase()

    // Skip settings, cache, and other non-trace directories
    if (pathLower.includes("/cache/") || pathLower.includes("/backups/")) return false

    return true
  })
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
