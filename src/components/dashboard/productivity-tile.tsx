"use client"

import { useState } from "react"
import type { ProductivityStats } from "@/lib/types"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Tile } from "./tile"

interface ProductivityTileProps {
  productivityStats: ProductivityStats
}

function formatResponseGap(seconds: number): string {
  if (seconds === 0) return "—"
  if (seconds < 60) return `${Math.round(seconds)}s`
  return `${(seconds / 60).toFixed(1)}m`
}

function successRateColor(rate: number): string {
  if (rate >= 80) return "text-emerald-400"
  if (rate >= 50) return "text-yellow-400"
  return "text-red-400"
}

export function ProductivityTile({ productivityStats }: ProductivityTileProps) {
  const {
    avgCostPerSession,
    mostExpensiveSession,
    successRate,
    promptToFixRatio,
    avgResponseGapSeconds,
    avgIterationSpeedMinutes,
    toolEfficiency,
    costTrend,
  } = productivityStats

  const [showAllTools, setShowAllTools] = useState(false)
  const errorProneTools = [...toolEfficiency]
    .filter((t) => t.errors > 0)
    .sort((a, b) => b.errorRate - a.errorRate)
  const visibleTools = showAllTools ? errorProneTools : errorProneTools.slice(0, 3)

  const recentCosts = costTrend.slice(-14)
  const maxCost = Math.max(...recentCosts.map((c) => c.cost), 0.01)

  return (
    <Tile title="Productivity">
      <div className="space-y-3">
        {/* Avg Cost/Session */}
        <Row label="Avg Cost/Session">
          <span className="text-white/90">
            $<NumberTicker value={avgCostPerSession} decimalPlaces={2} className="text-sm font-semibold text-white/90" />
          </span>
        </Row>

        {/* Most Expensive Session */}
        <Row label="Most Expensive Session">
          {mostExpensiveSession ? (
            <span className="text-sm text-white/90">
              <span className="text-white/60">{basename(mostExpensiveSession.project)}</span>
              {" "}
              <span className="font-semibold">${mostExpensiveSession.cost.toFixed(2)}</span>
            </span>
          ) : (
            <span className="text-sm text-white/20">—</span>
          )}
        </Row>

        {/* Success Rate */}
        <Row label="Success Rate">
          <span className={`text-sm font-semibold ${successRateColor(successRate * 100)}`}>
            <NumberTicker value={successRate * 100} decimalPlaces={1} className={`text-sm font-semibold ${successRateColor(successRate * 100)}`} />%
          </span>
        </Row>

        {/* Prompt-to-Fix Ratio */}
        <Row label="Prompt-to-Fix Ratio">
          {promptToFixRatio > 0 ? (
            <span className="text-sm text-white/90">
              <NumberTicker value={promptToFixRatio} decimalPlaces={1} className="text-sm font-semibold text-white/90" /> prompts per fix
            </span>
          ) : (
            <span className="text-sm text-white/20">—</span>
          )}
        </Row>

        {/* Avg Response Gap */}
        <Row label="Avg Response Gap">
          <span className="text-sm font-semibold text-white/90">{formatResponseGap(avgResponseGapSeconds)}</span>
        </Row>

        {/* Iteration Speed */}
        <Row label="Iteration Speed">
          <span className="text-sm text-white/90">
            <NumberTicker value={avgIterationSpeedMinutes} decimalPlaces={0} className="text-sm font-semibold text-white/90" /> min avg session
          </span>
        </Row>

        {/* Tool Efficiency */}
        <div className="border-t border-white/[0.06] pt-3">
          <p className="mb-2 text-[11px] text-white/25">Most Error-Prone Tools</p>
          {visibleTools.length > 0 ? (
            <div className="space-y-1.5">
              {visibleTools.map((tool) => (
                <div key={tool.name} className="flex items-center justify-between">
                  <span className="truncate text-xs text-white/60">{tool.name}</span>
                  <span className="ml-2 shrink-0 text-xs tabular-nums text-red-400/80">
                    {(tool.errorRate * 100).toFixed(1)}% errors
                  </span>
                </div>
              ))}
              {errorProneTools.length > 3 && (
                <button
                  onClick={() => setShowAllTools((v) => !v)}
                  className="text-[11px] text-purple-400/60 hover:text-purple-400 transition-colors"
                >
                  {showAllTools ? "Show less" : `+${errorProneTools.length - 3} more`}
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-white/20">No tool data</p>
          )}
        </div>

        {/* Cost Trend */}
        {recentCosts.length > 0 && (
          <div className="border-t border-white/[0.06] pt-3">
            <p className="mb-2 text-[11px] text-white/25">Cost Trend (recent)</p>
            <div className="flex items-end gap-px" style={{ height: 32 }}>
              {recentCosts.map((entry, i) => (
                <div
                  key={entry.date + i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-purple-600 to-purple-400"
                  style={{
                    height: `${Math.max((entry.cost / maxCost) * 100, 4)}%`,
                  }}
                  title={`${entry.date}: $${entry.cost.toFixed(2)}`}
                />
              ))}
            </div>
          </div>
        )}
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

function basename(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/")
  return parts[parts.length - 1] || path
}
