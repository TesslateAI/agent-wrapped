"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import posthog from "posthog-js"
import {
  initPostHog,
  installGlobalErrorHandlers,
  isPostHogEnabled,
} from "@/lib/analytics/posthog"
import {
  CookieConsentBanner,
  getConsentStatus,
} from "@/components/cookie-consent-banner"

/** Tracks Next.js route changes as PostHog pageviews. */
function usePageviewTracking(enabled: boolean) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!enabled || !isPostHogEnabled) return
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")
    posthog.capture("$pageview", { $current_url: url })
  }, [pathname, searchParams, enabled])
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false)
  const [consentGiven, setConsentGiven] = useState(false)

  // Initialize PostHog only if consent was already given (from storage)
  useEffect(() => {
    if (initialized.current) return
    const status = getConsentStatus()
    if (status === "accepted") {
      initialized.current = true
      setConsentGiven(true)
      initPostHog()
      installGlobalErrorHandlers()
    }
  }, [])

  const handleConsent = useCallback((accepted: boolean) => {
    if (accepted && !initialized.current) {
      initialized.current = true
      setConsentGiven(true)
      initPostHog()
      installGlobalErrorHandlers()
    }
  }, [])

  usePageviewTracking(consentGiven)

  return (
    <>
      {children}
      {isPostHogEnabled && <CookieConsentBanner onConsent={handleConsent} />}
    </>
  )
}
