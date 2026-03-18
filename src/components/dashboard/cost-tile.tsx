"use client"

import type { CostEstimate } from "@/lib/types"
import { cn } from "@/lib/utils"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Tile } from "./tile"

interface CostTileProps {
  costEstimate: CostEstimate
}

const TOKEN_COLORS: Record<string, string> = {
  input: "#3b82f6",
  output: "#a855f7",
  cacheCreation: "#f97316",
  cacheRead: "#2dd4bf",
}

const TOKEN_LABELS: Record<string, string> = {
  input: "Input",
  output: "Output",
  cacheCreation: "Cache Write",
  cacheRead: "Cache Read",
}

const costInfo = (
  <>
    <p className="mb-3">Cost is estimated by multiplying your token usage by the public API pricing for each Claude model.</p>
    <p className="mb-3 text-white/40 font-semibold">Pricing Table (per 1M tokens)</p>
    <table className="w-full text-xs mb-4">
      <thead><tr className="border-b border-white/[0.06]"><th className="text-left py-1.5 text-white/40">Model</th><th className="text-right py-1.5 text-white/40">Input</th><th className="text-right py-1.5 text-white/40">Output</th></tr></thead>
      <tbody className="text-white/50">
        <tr className="border-b border-white/[0.03]"><td className="py-1">Opus 4.6 / 4.5</td><td className="text-right">$5.00</td><td className="text-right">$25.00</td></tr>
        <tr className="border-b border-white/[0.03]"><td className="py-1">Opus 4.1 / 4</td><td className="text-right">$15.00</td><td className="text-right">$75.00</td></tr>
        <tr className="border-b border-white/[0.03]"><td className="py-1">Sonnet (all)</td><td className="text-right">$3.00</td><td className="text-right">$15.00</td></tr>
        <tr className="border-b border-white/[0.03]"><td className="py-1">Haiku 4.5</td><td className="text-right">$1.00</td><td className="text-right">$5.00</td></tr>
        <tr className="border-b border-white/[0.03]"><td className="py-1">Haiku 3.5</td><td className="text-right">$0.80</td><td className="text-right">$4.00</td></tr>
        <tr><td className="py-1">Haiku 3</td><td className="text-right">$0.25</td><td className="text-right">$1.25</td></tr>
      </tbody>
    </table>
    <p className="mb-2"><strong className="text-white/60">Formula:</strong> (input tokens / 1M) x input price + (output tokens / 1M) x output price</p>
    <p className="mb-2"><strong className="text-white/60">Unknown models</strong> use a fallback rate of $3/$15 (Sonnet-equivalent) and are marked "(approximate)".</p>
    <p className="text-white/30 text-xs">Pricing as of March 18, 2026. Source: docs.anthropic.com</p>
  </>
)

export function CostTile({ costEstimate }: CostTileProps) {
  const { totalCost, usedFallbackPricing, tokenDistribution, breakdown } = costEstimate

  const tokenTotal = tokenDistribution.input + tokenDistribution.output + tokenDistribution.cacheCreation + tokenDistribution.cacheRead
  const noData = totalCost === 0 && tokenTotal === 0

  if (noData) {
    return (
      <Tile title="Cost Estimate" infoContent={costInfo}>
        <p className="text-sm text-white/20">Token data unavailable</p>
      </Tile>
    )
  }

  const segments = (["input", "output", "cacheCreation", "cacheRead"] as const).filter(
    (key) => tokenDistribution[key] > 0
  )

  return (
    <Tile title="Cost Estimate" infoTitle="How Cost is Estimated" infoContent={costInfo}>
      <div className="mb-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white/90">$</span>
        <NumberTicker value={totalCost} decimalPlaces={2} className="text-3xl font-bold text-white/90" />
        {usedFallbackPricing && (
          <span className="ml-1 text-xs text-white/20">(approximate)</span>
        )}
      </div>

      {/* Token distribution bar */}
      {tokenTotal > 0 && (
        <div className="mb-3">
          <div className="mb-2 flex h-3 overflow-hidden rounded-full">
            {segments.map((key) => (
              <div
                key={key}
                className="transition-all duration-500"
                style={{
                  width: `${(tokenDistribution[key] / tokenTotal) * 100}%`,
                  backgroundColor: TOKEN_COLORS[key],
                }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {segments.map((key) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-white/40">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: TOKEN_COLORS[key] }}
                />
                <span>{TOKEN_LABELS[key]}</span>
                <span className="text-white/20">
                  {((tokenDistribution[key] / tokenTotal) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-model breakdown */}
      {breakdown.length > 1 && (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/20">Per Model</h3>
          <div className="space-y-1">
            {breakdown.map((item) => (
              <div key={item.model} className={cn("flex items-center justify-between text-xs")}>
                <span className="truncate text-white/40">{item.model}</span>
                <span className="text-white/60">${item.cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Tile>
  )
}
