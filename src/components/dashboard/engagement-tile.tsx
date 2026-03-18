"use client"

import type { EngagementStats } from "@/lib/types"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Tile } from "./tile"

interface EngagementTileProps {
  engagementStats: EngagementStats
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch {
    return dateStr
  }
}

function trendConfig(trend: EngagementStats["selfSufficiencyTrend"]) {
  switch (trend) {
    case "improving":
      return { arrow: "\u2193", color: "text-emerald-400", label: "improving" }
    case "stable":
      return { arrow: "\u2192", color: "text-white/40", label: "stable" }
    case "declining":
      return { arrow: "\u2191", color: "text-red-400", label: "declining" }
  }
}

export function EngagementTile({ engagementStats }: EngagementTileProps) {
  const {
    longestStreak,
    currentStreak,
    peakDay,
    avgConversationDepth,
    selfSufficiencyTrend,
    selfSufficiencySlope,
    highTokenSessions,
    totalSessions,
    multiTaskingScore,
  } = engagementStats

  const trend = trendConfig(selfSufficiencyTrend)
  const tokenPressurePct = totalSessions > 0 ? (highTokenSessions / totalSessions) * 100 : 0
  const tokenPressureColor = tokenPressurePct > 20 ? "text-red-400" : "text-white/90"

  return (
    <Tile title="Engagement">
      <div className="space-y-3">
        {/* Streaks */}
        <div className="flex gap-6">
          <div>
            <p className="text-[11px] text-white/25">Current Streak</p>
            <p className="text-lg font-bold text-white/90">
              <NumberTicker value={currentStreak} className="text-lg font-bold text-white/90" /> days
              {currentStreak > 0 && <span className="ml-1">{"\uD83D\uDD25"}</span>}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-white/25">Longest Streak</p>
            <p className="text-lg font-bold text-white/90">
              <NumberTicker value={longestStreak} className="text-lg font-bold text-white/90" /> days
            </p>
          </div>
        </div>

        {/* Peak Day */}
        <div className="border-t border-white/[0.06] pt-3">
          <p className="text-[11px] text-white/25">Peak Day</p>
          <p className="text-sm text-white/90">
            <span className="font-semibold">{formatDate(peakDay.date)}</span>
            <span className="ml-2 text-white/40">
              {peakDay.sessions} {peakDay.sessions === 1 ? "session" : "sessions"}, {peakDay.messages} messages
            </span>
          </p>
        </div>

        {/* Conversation Depth */}
        <Row label="Conversation Depth">
          <span className="text-sm text-white/90">
            <NumberTicker value={avgConversationDepth} decimalPlaces={1} className="text-sm font-semibold text-white/90" /> messages avg
          </span>
        </Row>

        {/* Self-Sufficiency */}
        <div className="border-t border-white/[0.06] pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Self-Sufficiency</span>
            <span className={`text-sm font-semibold ${trend.color}`}>
              {trend.arrow} {trend.label}
              <span className="ml-1 text-xs text-white/20">({selfSufficiencySlope >= 0 ? "+" : ""}{selfSufficiencySlope.toFixed(2)})</span>
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-white/15">
            Are your sessions getting shorter over time? Improving = you need less AI help per task.
          </p>
        </div>

        {/* Context Pressure */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Context Pressure</span>
            <span className={`text-sm font-semibold ${tokenPressureColor}`}>
              {highTokenSessions} of {totalSessions} sessions
              <span className="ml-1 text-xs text-white/40">({tokenPressurePct.toFixed(0)}%)</span>
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-white/15">
            Sessions that used over 100K tokens — likely hitting context window limits.
          </p>
        </div>

        {/* Multi-tasking */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Multi-tasking</span>
            <span className="text-sm text-white/90">
              <NumberTicker value={multiTaskingScore} decimalPlaces={1} className="text-sm font-semibold text-white/90" /> projects/day
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-white/15">
            How many different projects you bounce between on an average active day.
          </p>
        </div>
      </div>
    </Tile>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/40">{label}</span>
      {children}
    </div>
  )
}
