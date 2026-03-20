"use client"

import { Suspense, useState, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useWrapped } from "@/lib/store/wrapped-store"
import { BlurFade } from "@/components/ui/blur-fade"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { captureElementAsImage, captureElementAsBlob } from "@/lib/export/image-export"
import { StatStrip } from "@/components/dashboard/stat-strip"
import { VibeTile } from "@/components/dashboard/vibe-tile"
import { CostTile } from "@/components/dashboard/cost-tile"
import { TreatmentTile } from "@/components/dashboard/treatment-tile"
import { TimeTile } from "@/components/dashboard/time-tile"
import { ToolsTile } from "@/components/dashboard/tools-tile"
import { PersonalityTile } from "@/components/dashboard/personality-tile"
import { ProjectsTile } from "@/components/dashboard/projects-tile"
import { CodeImpactTile } from "@/components/dashboard/code-impact-tile"
import { SessionTimeline } from "@/components/dashboard/session-timeline"
import SessionTable from "@/components/dashboard/session-table"
import { ProductivityTile } from "@/components/dashboard/productivity-tile"
import { EngagementTile } from "@/components/dashboard/engagement-tile"
import { AchievementsTile } from "@/components/dashboard/achievements-tile"
import type { AnalysisResult } from "@/lib/types/analysis"
import {
  trackDashboardViewed,
  trackSummaryShared,
  trackUploadReset,
} from "@/lib/analytics/posthog"

function OverviewGrid({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-6">
      {/* Row 1: Stat Strip — full width */}
      <BlurFade delay={0.05} inView>
        <StatStrip rawStats={result.rawStats} />
      </BlurFade>

      {/* Row 2: Vibe | Cost | Treatment */}
      <BlurFade delay={0.15} inView>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <VibeTile vibeScores={result.vibeScores} />
          <CostTile costEstimate={result.costEstimate} />
          <TreatmentTile aiTreatment={result.aiTreatment} />
        </div>
      </BlurFade>

      {/* Row 3: Tools | Time | Personality */}
      <BlurFade delay={0.25} inView>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ToolsTile
            topTools={result.rawStats.topToolsUsed}
            totalToolCalls={result.rawStats.totalToolCalls}
            errorRate={result.codeImpact.errorRate}
          />
          <TimeTile codingTimePatterns={result.rawStats.codingTimePatterns} />
          <PersonalityTile promptPersonality={result.promptPersonality} />
        </div>
      </BlurFade>

      {/* Row 4: Projects | Code Impact */}
      <BlurFade delay={0.35} inView>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProjectsTile
            topProjects={result.rawStats.topProjects}
            topGitBranches={result.rawStats.topGitBranches}
          />
          <div className="self-start">
            <CodeImpactTile codeImpact={result.codeImpact} />
          </div>
        </div>
      </BlurFade>

      {/* Row 5: Productivity | Engagement | Achievements */}
      <BlurFade delay={0.45} inView>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProductivityTile productivityStats={result.productivityStats} />
          <EngagementTile engagementStats={result.engagementStats} />
          <AchievementsTile achievements={result.achievements} />
        </div>
      </BlurFade>

      {/* Row 6: Session Timeline — full width (bottom) */}
      <BlurFade delay={0.55} inView>
        <SessionTimeline timeline={result.sessionDetails.timeline} />
      </BlurFade>
    </div>
  )
}

function ShareDropdown({
  showShareMenu,
  setShowShareMenu,
  shareMenuRef,
  handleViewSummary,
  handleShareTo,
  handleCopyText,
  shareStatus,
}: {
  showShareMenu: boolean
  setShowShareMenu: (v: boolean | ((prev: boolean) => boolean)) => void
  shareMenuRef: React.RefObject<HTMLDivElement | null>
  handleViewSummary: () => void
  handleShareTo: (platform: string) => void
  handleCopyText: () => void
  shareStatus: "idle" | "generating" | "done"
}) {
  if (!showShareMenu) return null
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
      <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-white/[0.08] bg-[#111] shadow-2xl">
        <div className="px-4 pt-3 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/25">Get your card</p>
        </div>
        <button
          onClick={handleViewSummary}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white/70 transition-colors hover:bg-white/[0.04]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-purple-400">
            <rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          <div>
            <span className="text-white/70">View Summary Card</span>
            <p className="text-[11px] text-white/25">Download or share as image</p>
          </div>
        </button>

        <div className="border-t border-white/[0.06] mx-3" />

        <div className="px-4 pt-3 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/25">Share your vibe</p>
          <p className="text-[10px] text-white/15 mt-0.5">Opens with text — attach your downloaded card image</p>
        </div>

        <button onClick={() => handleShareTo("twitter")} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/60 transition-colors hover:bg-white/[0.04]">
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24" className="shrink-0"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
          Post on X
        </button>

        <button onClick={() => handleShareTo("linkedin")} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/60 transition-colors hover:bg-white/[0.04]">
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24" className="shrink-0"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" /></svg>
          Share on LinkedIn
        </button>

        <button onClick={() => handleShareTo("reddit")} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/60 transition-colors hover:bg-white/[0.04]">
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24" className="shrink-0"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
          Share on Reddit
        </button>

        <div className="border-t border-white/[0.06] mx-3 mt-1" />

        <button onClick={handleCopyText} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white/50 transition-colors hover:bg-white/[0.04]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
          {shareStatus === "done" ? (
            <span className="text-emerald-400">Copied!</span>
          ) : (
            "Copy vibe text"
          )}
        </button>
      </div>
    </>
  )
}

function DashboardContent() {
  const { state, reset } = useWrapped()
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") === "sessions" ? "sessions" : "overview"
  const result = state.analysisResult
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [shareStatus, setShareStatus] = useState<"idle" | "generating" | "done">("idle")
  const shareMenuRef = useRef<HTMLDivElement>(null)

  if (!result) return null

  const handleTabChange = (tab: "overview" | "sessions") => {
    trackDashboardViewed({ tab })
    setShowMobileMenu(false)
    router.push(tab === "sessions" ? "/wrapped?tab=sessions" : "/wrapped")
  }

  const handleNewUpload = () => {
    trackUploadReset()
    setShowMobileMenu(false)
    reset()
    router.push("/upload")
  }

  const shareText = `Check out my Agent Wrapped! I'm a "${result.vibeScores.overallVibe.label}" with a vibe score of ${result.vibeScores.overallVibe.value}/100 🎯`

  const handleViewSummary = useCallback(() => {
    setShowShareMenu(false)
    setShowMobileMenu(false)
    router.push("/wrapped/summary")
  }, [router])

  const handleCopyText = useCallback(async () => {
    setShowShareMenu(false)
    trackSummaryShared({ method: "copy_text" })
    try {
      await navigator.clipboard.writeText(shareText)
      setShareStatus("done")
      setTimeout(() => setShareStatus("idle"), 2000)
    } catch { /* ignore */ }
  }, [shareText])

  const handleShareTo = useCallback((platform: string) => {
    setShowShareMenu(false)
    trackSummaryShared({ method: platform })
    const text = encodeURIComponent(shareText)
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      linkedin: `https://www.linkedin.com/feed/?shareActive=true&text=${text}`,
      reddit: `https://www.reddit.com/submit?title=${text}`,
    }
    const target = urls[platform]
    if (target) window.open(target, "_blank", "noopener,noreferrer,width=600,height=500")
  }, [shareText])

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>

          {/* Desktop nav — hidden on small screens */}
          <div className="hidden md:flex items-center gap-3">
            <DashboardTabs activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Share button with dropdown */}
            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setShowShareMenu((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-sm text-purple-300 transition-colors hover:border-purple-500/30 hover:bg-purple-500/15"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" />
                </svg>
                Share
              </button>

              <ShareDropdown
                showShareMenu={showShareMenu}
                setShowShareMenu={setShowShareMenu}
                shareMenuRef={shareMenuRef}
                handleViewSummary={handleViewSummary}
                handleShareTo={handleShareTo}
                handleCopyText={handleCopyText}
                shareStatus={shareStatus}
              />
            </div>

            <button
              onClick={handleNewUpload}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white/50 transition-colors hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white/80"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              New Upload
            </button>

            <a
              href="https://studio.tesslate.com/import?repo=https://github.com/tesslateai/agent-wrapped"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white/50 transition-colors hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white/80"
            >
              <svg
                className="h-3.5 w-4"
                viewBox="0 0 161.9 126.66"
                fill="currentColor"
              >
                <path d="m13.45,46.48h54.06c10.21,0,16.68-10.94,11.77-19.89l-9.19-16.75c-2.36-4.3-6.87-6.97-11.77-6.97H22.41c-4.95,0-9.5,2.73-11.84,7.09L1.61,26.71c-4.79,8.95,1.69,19.77,11.84,19.77Z" />
                <path d="m61.05,119.93l26.95-46.86c5.09-8.85-1.17-19.91-11.37-20.12l-19.11-.38c-4.9-.1-9.47,2.48-11.91,6.73l-17.89,31.12c-2.47,4.29-2.37,9.6.25,13.8l10.05,16.13c5.37,8.61,17.98,8.39,23.04-.41Z" />
                <path d="m148.46,0h-54.06c-10.21,0-16.68,10.94-11.77,19.89l9.19,16.75c2.36,4.3,6.87,6.97,11.77,6.97h35.9c4.95,0,9.5-2.73,11.84-7.09l8.97-16.75C165.08,10.82,158.6,0,148.46,0Z" />
              </svg>
              Edit with Studio
            </a>
          </div>

          {/* Mobile hamburger — visible on small screens */}
          <div className="relative md:hidden">
            <button
              onClick={() => { setShowMobileMenu((v) => !v); setShowShareMenu(false) }}
              className="flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 text-white/60 transition-colors hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white/80"
            >
              {showMobileMenu ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              )}
            </button>

            {showMobileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-[#111] shadow-2xl">
                  {/* Tab items */}
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/25">View</p>
                  </div>
                  <button
                    onClick={() => handleTabChange("overview")}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.04] ${activeTab === "overview" ? "text-purple-400" : "text-white/60"}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Overview
                    {activeTab === "overview" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-500" />}
                  </button>
                  <button
                    onClick={() => handleTabChange("sessions")}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.04] ${activeTab === "sessions" ? "text-purple-400" : "text-white/60"}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    Sessions
                    {activeTab === "sessions" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-500" />}
                  </button>

                  <div className="border-t border-white/[0.06] mx-3 my-1" />

                  {/* Actions */}
                  <div className="px-3 pt-2 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/25">Actions</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu((v) => !v)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-purple-300 transition-colors hover:bg-white/[0.04]"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" />
                      </svg>
                      Share
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`ml-auto shrink-0 transition-transform ${showShareMenu ? "rotate-180" : ""}`}>
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>

                    {showShareMenu && (
                      <div className="border-t border-white/[0.06] mx-3">
                        <button onClick={handleViewSummary} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/60 transition-colors hover:bg-white/[0.04]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-purple-400">
                            <rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                          Summary Card
                        </button>
                        <button onClick={() => handleShareTo("twitter")} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/60 transition-colors hover:bg-white/[0.04]">
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="shrink-0"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                          Post on X
                        </button>
                        <button onClick={() => handleShareTo("linkedin")} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/60 transition-colors hover:bg-white/[0.04]">
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="shrink-0"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" /></svg>
                          LinkedIn
                        </button>
                        <button onClick={() => handleShareTo("reddit")} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/60 transition-colors hover:bg-white/[0.04]">
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="shrink-0"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
                          Reddit
                        </button>
                        <button onClick={handleCopyText} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/50 transition-colors hover:bg-white/[0.04]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                          {shareStatus === "done" ? <span className="text-emerald-400">Copied!</span> : "Copy text"}
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleNewUpload}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white/60 transition-colors hover:bg-white/[0.04]"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    New Upload
                  </button>

                  <a
                    href="https://studio.tesslate.com/import?repo=https://github.com/tesslateai/agent-wrapped"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white/60 transition-colors hover:bg-white/[0.04]"
                  >
                    <svg
                      className="h-3.5 w-4 shrink-0"
                      viewBox="0 0 161.9 126.66"
                      fill="currentColor"
                    >
                      <path d="m13.45,46.48h54.06c10.21,0,16.68-10.94,11.77-19.89l-9.19-16.75c-2.36-4.3-6.87-6.97-11.77-6.97H22.41c-4.95,0-9.5,2.73-11.84,7.09L1.61,26.71c-4.79,8.95,1.69,19.77,11.84,19.77Z" />
                      <path d="m61.05,119.93l26.95-46.86c5.09-8.85-1.17-19.91-11.37-20.12l-19.11-.38c-4.9-.1-9.47,2.48-11.91,6.73l-17.89,31.12c-2.47,4.29-2.37,9.6.25,13.8l10.05,16.13c5.37,8.61,17.98,8.39,23.04-.41Z" />
                      <path d="m148.46,0h-54.06c-10.21,0-16.68,10.94-11.77,19.89l9.19,16.75c2.36,4.3,6.87,6.97,11.77,6.97h35.9c4.95,0,9.5-2.73,11.84-7.09l8.97-16.75C165.08,10.82,158.6,0,148.46,0Z" />
                    </svg>
                    Edit with Studio
                  </a>

                  <div className="h-1" />
                </div>
              </>
            )}
          </div>
        </div>

        {activeTab === "overview" ? (
          <OverviewGrid result={result} />
        ) : (
          <SessionTable sessions={result.sessionDetails.sessions} />
        )}
      </div>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}
