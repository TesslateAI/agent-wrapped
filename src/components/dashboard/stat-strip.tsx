"use client"

import type { RawStats } from "@/lib/types"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Tile } from "./tile"

function formatTokens(total: number): { value: number; suffix: string } {
  if (total >= 1_000_000) return { value: Math.round(total / 100_000) / 10, suffix: "M" }
  if (total >= 1_000) return { value: Math.round(total / 100) / 10, suffix: "K" }
  return { value: total, suffix: "" }
}

function formatDateRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }
  return `${fmt(start)} — ${fmt(end)}`
}

interface StatStripProps {
  rawStats: RawStats
}

function StatItem({ value, label, suffix, decimalPlaces = 0 }: { value: number; label: string; suffix?: string; decimalPlaces?: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-2xl font-bold text-white/90">
        <NumberTicker value={value} decimalPlaces={decimalPlaces} className="text-2xl font-bold text-white/90" />
        {suffix && <span className="text-lg text-white/60">{suffix}</span>}
      </div>
      <span className="text-xs uppercase tracking-wider text-white/40">{label}</span>
    </div>
  )
}

export function StatStrip({ rawStats }: StatStripProps) {
  const tokens = formatTokens(rawStats.totalTokensUsed.total)
  const dateRange = formatDateRange(rawStats.dateRange.start, rawStats.dateRange.end)

  return (
    <Tile title="At a Glance">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatItem value={rawStats.totalSessions} label="Sessions" />
        <StatItem value={rawStats.totalMessages} label="Messages" />
        <StatItem
          value={tokens.value}
          suffix={tokens.suffix}
          label="Tokens"
          decimalPlaces={tokens.suffix ? 1 : 0}
        />
        <StatItem value={rawStats.activeDays} label="Active Days" />
        <div className="col-span-2 flex flex-col items-center gap-1 sm:col-span-1">
          <span className="text-sm font-semibold text-white/90">{dateRange}</span>
          <span className="text-xs uppercase tracking-wider text-white/40">Date Range</span>
        </div>
      </div>
    </Tile>
  )
}
