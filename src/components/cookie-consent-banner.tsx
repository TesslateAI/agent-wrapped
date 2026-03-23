"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"

const CONSENT_KEY = "cookie-consent"

export type ConsentStatus = "accepted" | "declined" | null

export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") return null
  const value = localStorage.getItem(CONSENT_KEY)
  if (value === "accepted" || value === "declined") return value
  return null
}

function setConsentStatus(status: "accepted" | "declined") {
  localStorage.setItem(CONSENT_KEY, status)
}

export function CookieConsentBanner({
  onConsent,
}: {
  onConsent: (accepted: boolean) => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const status = getConsentStatus()
    if (status === null) {
      setVisible(true)
    } else {
      onConsent(status === "accepted")
    }
  }, [onConsent])

  function handleAccept() {
    setConsentStatus("accepted")
    setVisible(false)
    onConsent(true)
  }

  function handleDecline() {
    setConsentStatus("declined")
    setVisible(false)
    onConsent(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
        >
          <div className="mx-auto flex max-w-2xl flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#111111]/95 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:gap-6 sm:p-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80">
                We use cookies for anonymous analytics
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/35">
                We use PostHog to track anonymous usage events (page views,
                button clicks) to improve the experience. No trace data is ever
                collected. Read our{" "}
                <Link
                  href="/privacy"
                  className="text-purple-400 underline decoration-purple-400/30 underline-offset-2 hover:text-purple-300"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <button
                onClick={handleDecline}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/50 transition-colors hover:border-white/[0.12] hover:text-white/70"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
