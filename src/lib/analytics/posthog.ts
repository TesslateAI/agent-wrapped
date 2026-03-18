import posthog from "posthog-js"

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"

/** Whether PostHog is configured. When false every tracking call is a no-op. */
export const isPostHogEnabled = Boolean(POSTHOG_KEY)

/** Initialise PostHog. Safe to call multiple times — only the first call takes effect. */
export function initPostHog() {
  if (!isPostHogEnabled || typeof window === "undefined") return

  posthog.init(POSTHOG_KEY!, {
    api_host: POSTHOG_HOST,
    // Privacy: memory-only, no localStorage / cookies
    persistence: "memory",
    // Disable session recording
    disable_session_recording: true,
    // Disable automatic pageview — we fire our own via the Next.js router
    capture_pageview: false,
    // Disable autocapture to keep events intentional
    autocapture: false,
    // Mask all text in error traces for safety
    mask_all_text: true,
  })
}

// ---------------------------------------------------------------------------
// Typed event helpers
// ---------------------------------------------------------------------------

export function trackFileUploaded(props: {
  agent_type: string
  file_count: number
  total_size_bytes: number
}) {
  posthog.capture("file_uploaded", props)
}

export function trackParsingStarted(props: { agent_type: string }) {
  posthog.capture("parsing_started", props)
}

export function trackParsingCompleted(props: {
  agent_type: string
  duration_ms: number
}) {
  posthog.capture("parsing_completed", props)
}

export function trackParsingFailed(props: {
  agent_type: string
  error_type: string
}) {
  posthog.capture("parsing_failed", props)
}

export function trackAnalysisCompleted(props: {
  agent_type: string
  session_count: number
  message_count: number
}) {
  posthog.capture("analysis_completed", props)
}

export function trackDashboardViewed(props: { tab: string }) {
  posthog.capture("dashboard_viewed", props)
}

export function trackStoryStarted() {
  posthog.capture("story_started")
}

export function trackStorySectionViewed(props: {
  section_index: number
  section_name: string
}) {
  posthog.capture("story_section_viewed", props)
}

export function trackStoryCompleted() {
  posthog.capture("story_completed")
}

export function trackSummaryViewed() {
  posthog.capture("summary_viewed")
}

export function trackSummaryDownloaded(props: { format: string }) {
  posthog.capture("summary_downloaded", props)
}

export function trackSummaryShared(props: { method: string }) {
  posthog.capture("summary_shared", props)
}

export function trackExportHtml() {
  posthog.capture("export_html")
}

export function trackUploadReset() {
  posthog.capture("upload_reset")
}

// ---------------------------------------------------------------------------
// Error tracking
// ---------------------------------------------------------------------------

export function trackError(props: {
  error_type: string
  error_message: string
  component?: string
  context?: Record<string, string | number | boolean>
}) {
  posthog.capture("client_error", {
    error_type: props.error_type,
    error_message: props.error_message,
    component: props.component,
    ...props.context,
  })
}

/** Install a global unhandled-error + unhandled-rejection listener. */
export function installGlobalErrorHandlers() {
  if (typeof window === "undefined" || !isPostHogEnabled) return

  window.addEventListener("error", (event) => {
    trackError({
      error_type: "unhandled_error",
      error_message: event.message,
      context: {
        filename: event.filename ?? "unknown",
        lineno: event.lineno ?? 0,
        colno: event.colno ?? 0,
      },
    })
  })

  window.addEventListener("unhandledrejection", (event) => {
    const message =
      event.reason instanceof Error
        ? event.reason.message
        : String(event.reason)
    trackError({
      error_type: "unhandled_rejection",
      error_message: message,
    })
  })
}
