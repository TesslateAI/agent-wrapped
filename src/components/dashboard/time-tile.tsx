"use client"

import type { CodingTimePattern } from "@/lib/types"
import { Tile } from "./tile"

interface TimeTileProps {
  codingTimePatterns: CodingTimePattern
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// Color bands for time-of-day: night (blue), morning (teal), afternoon (amber), evening (purple)
function hourColor(hour: number, intensity: number): string {
  if (intensity === 0) return "rgba(255,255,255,0.04)"
  const alpha = 0.4 + intensity * 0.6
  if (hour < 5) return `rgba(99, 102, 241, ${alpha})`       // indigo — late night
  if (hour < 9) return `rgba(45, 212, 191, ${alpha})`       // teal — early morning
  if (hour < 12) return `rgba(52, 211, 153, ${alpha})`      // emerald — morning
  if (hour < 17) return `rgba(251, 191, 36, ${alpha})`      // amber — afternoon
  if (hour < 21) return `rgba(249, 115, 22, ${alpha})`      // orange — evening
  return `rgba(139, 92, 246, ${alpha})`                      // violet — night
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12a"
  if (hour < 12) return `${hour}a`
  if (hour === 12) return "12p"
  return `${hour - 12}p`
}

export function TimeTile({ codingTimePatterns }: TimeTileProps) {
  const { hourDistribution, dayDistribution, label } = codingTimePatterns

  const maxHour = Math.max(...hourDistribution, 1)
  const maxDay = Math.max(...dayDistribution, 1)
  const totalMessages = hourDistribution.reduce((a, b) => a + b, 0)

  // Find peak hour
  const peakHour = hourDistribution.indexOf(Math.max(...hourDistribution))

  return (
    <Tile title="When You Code">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-xl font-bold text-white/90">{label}</p>
        <p className="text-xs text-white/25">peak at {formatHourLabel(peakHour)}</p>
      </div>

      {/* Hour distribution — 24 bars with time-of-day colors */}
      <div className="mb-1 flex items-end gap-[2px]" style={{ height: 90 }}>
        {hourDistribution.map((count, hour) => {
          const pct = count / maxHour
          const isPeak = hour === peakHour && count > 0
          return (
            <div
              key={hour}
              className="group relative flex-1"
              style={{ height: "100%" }}
            >
              <div
                className="absolute bottom-0 w-full rounded-t-sm transition-all duration-500"
                style={{
                  height: `${Math.max(pct * 100, count > 0 ? 6 : 2)}%`,
                  backgroundColor: hourColor(hour, pct),
                  boxShadow: isPeak ? "0 0 8px rgba(255,255,255,0.15)" : "none",
                }}
              />
              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                <div className="whitespace-nowrap rounded bg-white/10 backdrop-blur-sm px-2 py-1 text-[10px] text-white/70">
                  {formatHourLabel(hour)}: {count.toLocaleString()}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Hour axis labels */}
      <div className="mb-5 flex text-[10px] text-white/25">
        <span className="flex-1">12a</span>
        <span className="flex-1 text-center">6a</span>
        <span className="flex-1 text-center">12p</span>
        <span className="flex-1 text-center">6p</span>
        <span className="text-right">11p</span>
      </div>

      {/* Color legend */}
      <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/30">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: "rgba(99,102,241,0.7)" }} />Night</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: "rgba(45,212,191,0.7)" }} />Early AM</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: "rgba(52,211,153,0.7)" }} />Morning</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: "rgba(251,191,36,0.7)" }} />Afternoon</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: "rgba(249,115,22,0.7)" }} />Evening</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: "rgba(139,92,246,0.7)" }} />Late Night</span>
      </div>

      {/* Day distribution — horizontal bars instead of dots */}
      <div className="border-t border-white/[0.06] pt-3">
        <p className="mb-2 text-[11px] text-white/20">Messages by day of week</p>
        <div className="space-y-1.5">
          {dayDistribution.map((count, day) => {
            const pct = count / maxDay
            return (
              <div key={day} className="flex items-center gap-2">
                <span className="w-7 shrink-0 text-[11px] text-white/30">{DAY_LABELS[day]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(pct * 100, count > 0 ? 3 : 0)}%`,
                      backgroundColor: `rgba(168, 85, 247, ${0.3 + pct * 0.7})`,
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-white/25">
                  {count.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Total */}
      <p className="mt-3 text-[11px] text-white/15">{totalMessages.toLocaleString()} total messages tracked</p>
    </Tile>
  )
}
