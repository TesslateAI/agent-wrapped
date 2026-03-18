"use client"

import type { Achievements } from "@/lib/types"
import { NumberTicker } from "@/components/ui/number-ticker"
import { cn } from "@/lib/utils"
import { Tile } from "./tile"

interface AchievementsTileProps {
  achievements: Achievements
}

function percentileGradient(percentile: number): string {
  // Higher percentile (lower number) = more vibrant purple
  if (percentile <= 5) return "from-purple-400 to-pink-400"
  if (percentile <= 15) return "from-purple-400 to-purple-300"
  if (percentile <= 30) return "from-purple-500 to-purple-400"
  return "from-purple-600 to-purple-500"
}

export function AchievementsTile({ achievements }: AchievementsTileProps) {
  const { hoursSaved, hoursSavedBreakdown, usagePercentile, badges } = achievements

  const unlockedBadges = badges.filter((b) => b.unlocked)
  const lockedBadges = badges.filter((b) => !b.unlocked)

  return (
    <Tile
      title="Achievements"
      infoTitle="How Achievements Work"
      infoContent={
        <>
          <p className="mb-3 text-white/40 font-semibold">Hours Saved</p>
          <p className="mb-3">Each tool call (Read, Edit, Bash, etc.) saves an estimated 2 minutes of manual work. Formula: <code className="bg-white/[0.06] px-1 rounded text-white/60">(total tool calls x 2) / 60 = hours</code></p>

          <p className="mb-3 text-white/40 font-semibold">Usage Percentile</p>
          <p className="mb-2">Based on your messages per active day, calibrated against heavy agent usage patterns including sub-agents:</p>
          <table className="w-full text-xs mb-4">
            <thead><tr className="border-b border-white/[0.06]"><th className="text-left py-1 text-white/40">Messages/Day</th><th className="text-right py-1 text-white/40">Percentile</th></tr></thead>
            <tbody className="text-white/50">
              <tr className="border-b border-white/[0.03]"><td className="py-1">20,000+</td><td className="text-right">Top 99%</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">10,000-19,999</td><td className="text-right">Top 95%</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">5,000-9,999</td><td className="text-right">Top 90%</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">2,000-4,999</td><td className="text-right">Top 80%</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">1,000-1,999</td><td className="text-right">Top 70%</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">500-999</td><td className="text-right">Top 55%</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">200-499</td><td className="text-right">Top 40%</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">100-199</td><td className="text-right">Top 25%</td></tr>
              <tr><td className="py-1">&lt;100</td><td className="text-right">Top 10%</td></tr>
            </tbody>
          </table>

          <p className="mb-3 text-white/40 font-semibold">Badge Unlock Conditions</p>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/[0.06]"><th className="text-left py-1 text-white/40">Badge</th><th className="text-left py-1 text-white/40">How to Unlock</th></tr></thead>
            <tbody className="text-white/50">
              <tr className="border-b border-white/[0.03]"><td className="py-1">💬 1K Club</td><td>1,000+ total messages</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">🏆 10K Club</td><td>10,000+ total messages</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">🦉 Night Owl</td><td>50+ messages between midnight and 5am</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">🐦 Early Bird</td><td>50+ messages between 5am and 8am</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">🌍 Polyglot</td><td>5+ programming languages detected</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">🔥 Streak Master</td><td>7+ consecutive days of usage</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">🏃 Marathon Runner</td><td>Single session lasting 2+ hours</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">🔧 Tool Wielder</td><td>500+ tool calls</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">🐛 Bug Squasher</td><td>100+ prompts with debug/fix/error keywords</td></tr>
              <tr><td className="py-1">⚡ Speed Demon</td><td>Median response gap under 30 seconds</td></tr>
            </tbody>
          </table>
        </>
      }
    >
      <div className="space-y-5">
        {/* Hours Saved */}
        <div>
          <div className="flex items-baseline gap-1">
            <NumberTicker value={hoursSaved} decimalPlaces={1} className="text-3xl font-bold text-white/90" />
          </div>
          <p className="text-xs text-white/40">
            hours of manual work saved
          </p>
          <p className="text-[11px] text-white/20">
            based on {hoursSavedBreakdown.toolCalls.toLocaleString()} tool calls
          </p>
        </div>

        {/* Usage Percentile */}
        <div className="border-t border-white/[0.06] pt-4">
          <p className="mb-1 text-[11px] text-white/25">Usage Percentile</p>
          <span
            className={cn(
              "inline-block bg-gradient-to-r bg-clip-text text-3xl font-black text-transparent",
              percentileGradient(usagePercentile)
            )}
          >
            Top {usagePercentile}%
          </span>
        </div>

        {/* Badges Grid */}
        {badges.length > 0 && (
          <div className="border-t border-white/[0.06] pt-4">
            <p className="mb-2 text-[11px] text-white/25">
              Badges ({unlockedBadges.length}/{badges.length} unlocked)
            </p>
            <div className="flex flex-wrap gap-2">
              {unlockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5"
                  title={badge.description}
                >
                  <span className="text-sm">{badge.icon}</span>
                  <span className="text-xs font-medium text-white/90">{badge.name}</span>
                </div>
              ))}
              {lockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/[0.08] px-2.5 py-1.5 opacity-30"
                  title={badge.description}
                >
                  <span className="text-sm grayscale">{badge.icon}</span>
                  <span className="text-xs text-white/20">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Tile>
  )
}
