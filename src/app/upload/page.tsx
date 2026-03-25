"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useWrapped } from "@/lib/store/wrapped-store"
import { parseFiles } from "@/lib/parsers"
import { analyzeTraces } from "@/lib/analyzers"
import { FileDropzone } from "@/components/upload/file-dropzone"
import { ProcessingIndicator } from "@/components/upload/processing-indicator"
import { BlurFade } from "@/components/ui/blur-fade"
import { TextAnimate } from "@/components/ui/text-animate"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import {
  trackFileUploaded,
  trackParsingStarted,
  trackParsingCompleted,
  trackParsingFailed,
  trackAnalysisCompleted,
  trackUploadReset,
  trackError,
} from "@/lib/analytics/posthog"

export default function UploadPage() {
  const router = useRouter()
  const { state, setFiles, setStatus, setTraceData, setAnalysisResult, setError, reset } = useWrapped()

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      setFiles(files)

      const totalSize = files.reduce((sum, f) => sum + f.size, 0)
      trackFileUploaded({
        agent_type: "auto_detect",
        file_count: files.length,
        total_size_bytes: totalSize,
      })

      try {
        setStatus("parsing")
        trackParsingStarted({ agent_type: "auto_detect" })
        const parseStart = performance.now()
        const traceData = await parseFiles(files)
        const agentType = traceData.source === "tesslate-studio" ? "tesslate_studio" : "claude_code"
        setTraceData(traceData)
        trackParsingCompleted({
          agent_type: agentType,
          duration_ms: Math.round(performance.now() - parseStart),
        })

        setStatus("analyzing")
        const result = analyzeTraces(traceData)

        if (result.rawStats.totalMessages === 0) {
          setError("Not enough data to generate your Wrapped. The uploaded files don't contain any conversation messages.")
          return
        }

        setAnalysisResult(result)
        trackAnalysisCompleted({
          agent_type: agentType,
          session_count: result.rawStats.totalSessions,
          message_count: result.rawStats.totalMessages,
        })

        router.push("/wrapped")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to process files"
        setError(message)
        trackParsingFailed({ agent_type: "auto_detect", error_type: message })
        trackError({
          error_type: "parsing_error",
          error_message: message,
          component: "UploadPage",
        })
      }
    },
    [setFiles, setStatus, setTraceData, setAnalysisResult, setError, router]
  )

  const handleRetry = useCallback(() => {
    trackUploadReset()
    reset()
  }, [reset])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 py-16">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to home
        </Link>

        <BlurFade delay={0.1}>
          <TextAnimate
            as="h1"
            by="word"
            animation="blurInUp"
            className="text-4xl font-bold tracking-tight text-white md:text-5xl"
            startOnView={false}
          >
            Upload Your Agent Traces
          </TextAnimate>
        </BlurFade>

        <BlurFade delay={0.25}>
          <p className="mt-4 mb-8 text-lg text-white/50">
            Drop your trace files or select them below
          </p>
        </BlurFade>

        {state.status === "idle" && (
          <BlurFade delay={0.4}>
            <FileDropzone onFilesSelected={handleFilesSelected} />
          </BlurFade>
        )}

        {state.status === "uploading" && (
          <ProcessingIndicator status="parsing" />
        )}

        {state.status === "parsing" && (
          <ProcessingIndicator status="parsing" />
        )}

        {state.status === "analyzing" && (
          <ProcessingIndicator status="analyzing" />
        )}

        {state.status === "error" && (
          <BlurFade delay={0}>
            <div className="flex flex-col items-center gap-6 py-16 text-center">
              <div className="rounded-full bg-red-500/10 p-4">
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
                  className="text-red-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>

              <div>
                <p className="text-lg font-medium text-white/90">
                  Something went wrong
                </p>
                <p className="mt-2 text-sm text-red-400">
                  {state.error ?? "An unexpected error occurred while processing your files."}
                </p>
              </div>

              <ShimmerButton
                onClick={handleRetry}
                shimmerColor="#a855f7"
                background="rgba(168, 85, 247, 0.15)"
              >
                <span className="text-sm font-medium text-white">Try Again</span>
              </ShimmerButton>
            </div>
          </BlurFade>
        )}
      </div>
    </main>
  )
}
