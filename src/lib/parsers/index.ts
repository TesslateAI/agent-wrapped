/**
 * Parser entry point.
 *
 * Validates uploaded files and dispatches to the appropriate format-specific parser.
 * Supports Claude Code (JSONL) and Tesslate Studio (JSON) trace formats.
 */

import type { TraceData } from "@/lib/types"
import { parseClaudeCodeFiles } from "./claude-code"
import { parseTesslateStudioFiles } from "./tesslate-studio"
import { validateFileType, validateFileSize, isTraceFile, readFileAsText, detectTraceFormat } from "./file-utils"

/**
 * Parse uploaded trace files into normalized TraceData.
 *
 * Validates file type and size, then auto-detects the trace format
 * based on file content and routes to the appropriate parser.
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

  // Auto-detect format from the first file's content
  const firstFileText = await readFileAsText(traceFiles[0])
  const format = detectTraceFormat(firstFileText)

  switch (format) {
    case "tesslate-studio":
      return parseTesslateStudioFiles(traceFiles)
    case "claude-code":
      return parseClaudeCodeFiles(traceFiles)
    default: {
      // Fallback: try Claude Code parser for .jsonl files, Tesslate for .json
      const name = traceFiles[0].name.toLowerCase()
      if (name.endsWith(".jsonl")) {
        return parseClaudeCodeFiles(traceFiles)
      } else if (name.endsWith(".json")) {
        return parseTesslateStudioFiles(traceFiles)
      }
      throw new Error("Unrecognized trace file format. Please upload Claude Code (.jsonl) or Tesslate Studio (.json) trace files.")
    }
  }
}

export { parseClaudeCodeFiles } from "./claude-code"
export { parseTesslateStudioFiles } from "./tesslate-studio"
export {
  readFileAsText,
  parseJSONL,
  validateFileType,
  validateFileSize,
  isTraceFile,
  readDirectoryEntries,
  filterTraceFiles,
  detectTraceFormat,
} from "./file-utils"
