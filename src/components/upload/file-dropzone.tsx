"use client"

import { useCallback, useRef, useState, type DragEvent } from "react"
import { BorderBeam } from "@/components/ui/border-beam"
import { cn } from "@/lib/utils"
import { readDirectoryEntries, filterTraceFiles } from "@/lib/parsers/file-utils"

const ACCEPTED_TYPES = [".jsonl", ".json", ".zip"]
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateFile(file: File): string | null {
  const ext = "." + file.name.split(".").pop()?.toLowerCase()
  if (!ACCEPTED_TYPES.includes(ext)) {
    return `"${file.name}" is not a supported file type. Accepted: ${ACCEPTED_TYPES.join(", ")}`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}" exceeds the 100MB file size limit.`
  }
  return null
}

export function FileDropzone({ onFilesSelected }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const processDirectoryFiles = useCallback(
    (allFiles: File[]) => {
      const traceFiles = filterTraceFiles(allFiles)

      if (traceFiles.length === 0) {
        setErrors(["No trace files (.jsonl) found. Make sure you're uploading your .claude/ directory or individual .jsonl files."])
        setIsScanning(false)
        return
      }

      // Check sizes
      const oversized = traceFiles.filter((f) => f.size > MAX_FILE_SIZE)
      if (oversized.length > 0) {
        setErrors(oversized.map((f) => `"${f.name}" exceeds the 100MB file size limit.`))
      } else {
        setErrors([])
      }

      const validFiles = traceFiles.filter((f) => f.size <= MAX_FILE_SIZE)
      if (validFiles.length > 0) {
        setSelectedFiles(validFiles)
        setIsScanning(false)
        onFilesSelected(validFiles)
      }
    },
    [onFilesSelected]
  )

  const handleIndividualFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return

      const files = Array.from(fileList)
      const validationErrors: string[] = []
      const validFiles: File[] = []

      for (const file of files) {
        const error = validateFile(file)
        if (error) {
          validationErrors.push(error)
        } else {
          validFiles.push(file)
        }
      }

      setErrors(validationErrors)

      if (validFiles.length > 0) {
        setSelectedFiles(validFiles)
        onFilesSelected(validFiles)
      }
    },
    [onFilesSelected]
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      setErrors([])

      const items = e.dataTransfer.items
      if (!items || items.length === 0) return

      // Check if any dropped item is a directory
      let hasDirectory = false
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.()
        if (entry?.isDirectory) {
          hasDirectory = true
          break
        }
      }

      if (hasDirectory) {
        setIsScanning(true)
        try {
          const allFiles = await readDirectoryEntries(e.dataTransfer.items)
          processDirectoryFiles(allFiles)
        } catch {
          setErrors(["Failed to read directory. Try selecting individual files instead."])
          setIsScanning(false)
        }
      } else {
        handleIndividualFiles(e.dataTransfer.files)
      }
    },
    [handleIndividualFiles, processDirectoryFiles]
  )

  const handleFolderSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return
      setIsScanning(true)
      processDirectoryFiles(Array.from(files))
    },
    [processDirectoryFiles]
  )

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        role="button"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200",
          "bg-white/[0.02] hover:bg-white/[0.04]",
          isDragOver
            ? "border-purple-500 bg-purple-500/10 shadow-[0_0_30px_rgba(168,85,247,0.15)]"
            : "border-white/10 hover:border-white/20"
        )}
      >
        <BorderBeam
          size={80}
          duration={8}
          colorFrom="#a855f7"
          colorTo="#ec4899"
          borderWidth={2}
        />

        {/* Individual file picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jsonl,.json,.zip"
          multiple
          onChange={(e) => handleIndividualFiles(e.target.files)}
          className="hidden"
          aria-label="Upload trace files"
        />

        {/* Folder picker (hidden, triggered by button below) */}
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is not in React types
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFolderSelect}
          className="hidden"
          aria-label="Upload trace folder"
        />

        <div className="flex flex-col items-center gap-4">
          {isScanning ? (
            <>
              <div className="rounded-full bg-white/5 p-4">
                <svg
                  className="h-8 w-8 animate-spin text-purple-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-white/90">
                Scanning for trace files...
              </p>
            </>
          ) : (
            <>
              <div className="rounded-full bg-white/5 p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-400"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>

              <div>
                <p className="text-lg font-medium text-white/90">
                  {isDragOver ? "Drop it here" : "Drop a folder or .jsonl files here"}
                </p>
                <p className="mt-1 text-sm text-white/50">
                  or use the buttons below to browse
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    folderInputRef.current?.click()
                  }}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white/80"
                >
                  Select Folder
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white/80"
                >
                  Select Files
                </button>
              </div>

              <p className="text-xs text-white/30">
                We&apos;ll find all .jsonl trace files automatically
              </p>
            </>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((error, i) => (
            <p key={i} className="text-sm text-red-400">
              {error}
            </p>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-1">
          <p className="mb-2 text-xs font-medium text-white/40">
            Found {selectedFiles.length} trace file{selectedFiles.length !== 1 ? "s" : ""}
          </p>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {selectedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2 text-sm"
              >
                <span className="text-white/80 truncate mr-4">
                  {file.webkitRelativePath || file.name}
                </span>
                <span className="text-white/40 shrink-0">
                  {formatFileSize(file.size)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help section */}
      <div className="mt-8 rounded-xl border border-white/[0.04] bg-white/[0.015] p-5">
        <p className="mb-1 text-sm font-medium text-white/50">
          Where are my trace files?
        </p>
        <p className="mb-4 text-[13px] leading-relaxed text-white/30">
          Claude Code stores traces in a hidden <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-white/50">.claude/</code> folder in your home directory.
        </p>

        <div className="space-y-1">
          {/* macOS */}
          <details className="group rounded-lg border border-white/[0.04] bg-white/[0.01]">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-white/50 transition-colors hover:text-white/70">
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                  <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
                  <path d="M10 2c1 .5 2 2 2 5" />
                </svg>
                macOS
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <div className="px-4 pb-4">
              <ul className="space-y-2 text-[13px] text-white/30">
                <li className="flex gap-2">
                  <span className="shrink-0 text-white/20">1.</span>
                  <span>
                    Open Terminal and run{" "}
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-white/50">open ~/.claude/projects</code>{" "}
                    to open the traces folder in Finder
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-white/20">2.</span>
                  <span>
                    Select all the files/folders inside and <strong className="text-white/40">drag them into the box above</strong>
                  </span>
                </li>
              </ul>
              <p className="mt-3 text-[11px] text-white/20">
                Note: macOS hides folders starting with &ldquo;.&rdquo; and the file picker won&apos;t let you select them. Use drag-and-drop instead.
              </p>
            </div>
          </details>

          {/* Windows */}
          <details className="group rounded-lg border border-white/[0.04] bg-white/[0.01]">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-white/50 transition-colors hover:text-white/70">
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                  <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
                </svg>
                Windows
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <div className="px-4 pb-4">
              <ul className="space-y-2 text-[13px] text-white/30">
                <li className="flex gap-2">
                  <span className="shrink-0 text-white/20">1.</span>
                  <span>
                    <strong className="text-white/40">Quickest:</strong> Press{" "}
                    <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-white/50">Win + R</kbd>, type{" "}
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-white/50">%USERPROFILE%\.claude</code>{" "}
                    and press Enter
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-white/20">2.</span>
                  <span>
                    <strong className="text-white/40">File Explorer:</strong> Click <strong className="text-white/40">View &rarr; Show &rarr; Hidden items</strong>, then navigate to{" "}
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-white/50">C:\Users\YourName\.claude</code>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-white/20">3.</span>
                  <span>
                    Drag the <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-white/50">projects</code>{" "}
                    folder or any <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-white/50">.jsonl</code> files into the box above
                  </span>
                </li>
              </ul>
            </div>
          </details>

          {/* Linux */}
          <details className="group rounded-lg border border-white/[0.04] bg-white/[0.01]">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-white/50 transition-colors hover:text-white/70">
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                  <circle cx="12" cy="11" r="3" /><path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 14c0-3.87-3.13-7-7-7s-7 3.13-7 7c0 1.66.58 3.18 1.55 4.38L4 22h16l-2.55-3.62A6.96 6.96 0 0 0 19 14Z" />
                </svg>
                Linux
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <div className="px-4 pb-4">
              <ul className="space-y-2 text-[13px] text-white/30">
                <li className="flex gap-2">
                  <span className="shrink-0 text-white/20">1.</span>
                  <span>
                    Run{" "}
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-white/50">xdg-open ~/.claude</code>{" "}
                    or{" "}
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-white/50">nautilus ~/.claude</code>{" "}
                    in your terminal
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-white/20">2.</span>
                  <span>
                    In most file managers, press{" "}
                    <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-white/50">Ctrl + H</kbd>{" "}
                    to show hidden files
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-white/20">3.</span>
                  <span>
                    Drag the <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-white/50">projects</code>{" "}
                    folder or any <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-white/50">.jsonl</code> files into the box above
                  </span>
                </li>
              </ul>
            </div>
          </details>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-white/25">
        Your files are processed entirely in your browser. Nothing is uploaded to any server.
      </p>
    </div>
  )
}
