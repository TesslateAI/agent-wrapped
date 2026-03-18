"use client"

import { useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useWrapped } from "@/lib/store/wrapped-store"
import { captureElementAsImage } from "@/lib/export/image-export"
import { shareWrapped } from "@/lib/export/share"
import { NeonGradientCard } from "@/components/ui/neon-gradient-card"
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar"
import { NumberTicker } from "@/components/ui/number-ticker"
import { AuroraText } from "@/components/ui/aurora-text"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { BlurFade } from "@/components/ui/blur-fade"
import { getPersonalityProfile } from "@/lib/analyzers/personality-profiles"
import { Download, Share2, ArrowLeft, RotateCcw } from "lucide-react"
import Link from "next/link"

function getRiskEmoji(score: number): string {
  if (score >= 80) return "💀"
  if (score >= 60) return "😰"
  if (score >= 40) return "😅"
  if (score >= 20) return "😌"
  return "😇"
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function formatCost(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
  if (n >= 1) return `$${n.toFixed(2)}`
  return `$${(n * 100).toFixed(1)}¢`
}

export default function SummaryPage() {
  const router = useRouter()
  const { state, reset } = useWrapped()
  const { analysisResult } = state
  const cardRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return
    setIsExporting(true)
    setError(null)
    try {
      await captureElementAsImage(cardRef.current)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsExporting(false)
    }
  }, [])

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return
    setIsSharing(true)
    setError(null)
    try {
      await shareWrapped(cardRef.current)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSharing(false)
    }
  }, [])

  const handleStartOver = useCallback(() => {
    reset()
    router.push("/upload")
  }, [reset, router])

  if (!analysisResult) {
    if (typeof window !== "undefined") {
      router.push("/upload")
    }
    return null
  }

  const { rawStats, vibeScores, aiTreatment, achievements, engagementStats } = analysisResult
  const overallVibe = vibeScores.overallVibe
  const riskEmoji = getRiskEmoji(aiTreatment.assassinationListRisk.score)

  const personalityProfile = getPersonalityProfile(overallVibe.label)

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      {/* The Card -- captured for export */}
      <BlurFade delay={0.1} inView>
        <div
          ref={cardRef}
          id="summary-card"
          className="w-full max-w-md mx-auto"
        >
          <NeonGradientCard
            neonColors={{ firstColor: "#ff00aa", secondColor: "#00FFF1" }}
            borderSize={2}
            borderRadius={24}
            className="w-full"
          >
            <div className="flex flex-col items-center gap-4 py-5 px-3">
              {/* Branding */}
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-500">
                Agent Wrapped
              </p>

              {/* Vibe Label */}
              <div className="flex flex-col items-center gap-1">
                <h1 className="text-3xl font-black text-center leading-tight">
                  <AuroraText
                    colors={["#FF0080", "#7928CA", "#0070F3", "#38bdf8"]}
                    speed={1.5}
                    className="text-3xl font-black"
                  >
                    {overallVibe.label}
                  </AuroraText>
                </h1>

                {/* Personality tagline */}
                <p className="text-xs text-neutral-400 text-center font-medium tracking-wide">
                  {personalityProfile.tagline}
                </p>

                {/* Roast */}
                <p className="text-[11px] text-neutral-500 text-center italic leading-snug max-w-[280px] mt-0.5">
                  &ldquo;{personalityProfile.selectedRoast}&rdquo;
                </p>
              </div>

              {/* Overall Vibe Score Ring */}
              <div className="flex flex-col items-center gap-1">
                <AnimatedCircularProgressBar
                  value={overallVibe.value}
                  max={100}
                  min={0}
                  gaugePrimaryColor="#7928CA"
                  gaugeSecondaryColor="rgba(255, 255, 255, 0.1)"
                  className="size-24 text-xl"
                />
                <p className="text-xs text-neutral-400 mt-0.5">Overall Vibe Score</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-x-4 gap-y-3 w-full max-w-xs">
                <StatItem label="Sessions" value={rawStats.totalSessions} />
                <StatItem label="Messages" value={rawStats.totalMessages} />
                <StatItem label="Active Days" value={rawStats.activeDays} />
                <StatItem label="Tool Calls" value={rawStats.totalToolCalls} />
                <StatItem label="Streak" value={engagementStats.longestStreak} suffix="d" />
                <StatItem label="Hrs Saved" value={Math.round(achievements.hoursSaved)} />
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

              {/* AI Treatment & Risk */}
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-neutral-500">
                    AI Treatment
                  </span>
                  <span className="text-sm font-semibold text-purple-400">
                    {aiTreatment.politenessTier.tier}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-neutral-500">
                    Assassination Risk
                  </span>
                  <span className="text-sm font-semibold text-pink-400">
                    {riskEmoji} {aiTreatment.assassinationListRisk.label}
                  </span>
                </div>
              </div>

              {/* Date Range */}
              <p className="text-[11px] text-neutral-600 text-center">
                {formatDate(rawStats.dateRange.start)} &mdash;{" "}
                {formatDate(rawStats.dateRange.end)}
              </p>
            </div>
          </NeonGradientCard>
        </div>
      </BlurFade>

      {/* Actions -- NOT captured */}
      <BlurFade delay={0.4} inView>
        <div className="flex flex-col items-center gap-4 mt-10 w-full max-w-md">
          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <div className="flex gap-4 w-full justify-center">
            <ShimmerButton
              onClick={handleDownload}
              disabled={isExporting}
              background="rgba(121, 40, 202, 0.8)"
              shimmerColor="#ff00aa"
              className="flex items-center gap-2 text-sm font-medium px-6 py-3"
            >
              <Download className="size-4" />
              {isExporting ? "Exporting..." : "Download Image"}
            </ShimmerButton>

            <ShimmerButton
              onClick={handleShare}
              disabled={isSharing}
              background="rgba(0, 112, 243, 0.8)"
              shimmerColor="#00FFF1"
              className="flex items-center gap-2 text-sm font-medium px-6 py-3"
            >
              <Share2 className="size-4" />
              {isSharing ? "Sharing..." : "Share"}
            </ShimmerButton>
          </div>

          <div className="flex gap-6 mt-2">
            <Link
              href="/wrapped/story"
              className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-4" />
              View Full Report
            </Link>
            <button
              onClick={handleStartOver}
              className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="size-4" />
              Start Over
            </button>
          </div>
        </div>
      </BlurFade>
    </main>
  )
}

function StatItem({
  label,
  value,
  suffix,
}: {
  label: string
  value: number
  suffix?: string
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-xl font-bold text-white tabular-nums">
        <NumberTicker value={value} delay={0.3} className="text-xl font-bold" />
        {suffix && <span className="text-base font-semibold text-neutral-300">{suffix}</span>}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-neutral-500 mt-0.5">
        {label}
      </span>
    </div>
  )
}

function StatItemText({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-xl font-bold text-white tabular-nums">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-neutral-500 mt-0.5">
        {label}
      </span>
    </div>
  )
}
