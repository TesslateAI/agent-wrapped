"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import posthog from "posthog-js"
import {
  initPostHog,
  installGlobalErrorHandlers,
  isPostHogEnabled,
} from "@/lib/analytics/posthog"

/** Tracks Next.js route changes as PostHog pageviews. */
function usePageviewTracking() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isPostHogEnabled) return
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")
    posthog.capture("$pageview", { $current_url: url })
  }, [pathname, searchParams])
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    initPostHog()
    installGlobalErrorHandlers()
  }, [])

  usePageviewTracking()

  return <>{children}</>
}
