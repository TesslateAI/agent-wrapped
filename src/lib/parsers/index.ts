/**
 * Parser entry point.
 *
 * Validates uploaded files and dispatches to the appropriate format-specific parser.
 * For the MVP, only Claude Code JSONL is supported.
 */

import type { TraceData } from "@/lib/types"
import { parseClaudeCodeFiles } from "./claude-code"
import { validateFileType, validateFileSize, isTraceFile } from "./file-utils"

/**
 * Parse uploaded trace files into normalized TraceData.
 *
 * Validates file type and size before parsing. Currently assumes Claude Code
 * format — future versions will auto-detect based on file contents.
 */
export async function parseFiles(files: File[]): Promise<TraceData> {
  if (files.length === 0) {
    throw new Error("No files provided")
  }

  // If files came from a directory drop, they're already filtered to trace files.
  // For individually selected files, validate type and size.
  const traceFiles: File[] = []

  for (const file of files) {
    if (isTraceFile(file)) {
      // Already a known trace file (from directory scan)
      if (!validateFileSize(file)) {
        throw new Error(`File too large: ${file.name} (max 100MB)`)
      }
      traceFiles.push(file)
    } else if (validateFileType(file)) {
      // Individual file with accepted extension
      if (!validateFileSize(file)) {
        throw new Error(`File too large: ${file.name} (max 100MB)`)
      }
      traceFiles.push(file)
    } else {
      throw new Error(`Unsupported file type: ${file.name}`)
    }
  }

  if (traceFiles.length === 0) {
    throw new Error("No valid trace files found")
  }

  return parseClaudeCodeFiles(traceFiles)
}

export { parseClaudeCodeFiles } from "./claude-code"
export {
  readFileAsText,
  parseJSONL,
  validateFileType,
  validateFileSize,
  isTraceFile,
  readDirectoryEntries,
  filterTraceFiles,
} from "./file-utils"
