"use client"

import type { AITreatmentScore } from "@/lib/types"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Tile } from "./tile"

interface TreatmentTileProps {
  aiTreatment: AITreatmentScore
}

function scoreColor(score: number, inverted = false): string {
  const effective = inverted ? 100 - score : score
  if (effective >= 70) return "#10b981"
  if (effective >= 40) return "#f97316"
  return "#ef4444"
}

function MiniBar({ label, score, inverted = false }: { label: string; score: number; inverted?: boolean }) {
  // When inverted, a high bar = bad (e.g. frustration detected)
  const barWidth = inverted ? 100 - score : score
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-xs text-white/40">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${barWidth}%`,
            backgroundColor: scoreColor(score, inverted),
          }}
        />
      </div>
      <span className="w-7 text-right text-xs font-medium text-white/60">{barWidth}</span>
    </div>
  )
}

export function TreatmentTile({ aiTreatment }: TreatmentTileProps) {
  const { overall, politenessTier, patienceScore, gratitudeIndex, frustrationControl, assassinationListRisk } = aiTreatment

  return (
    <Tile
      title="How You Treat AI"
      infoTitle="How AI Treatment is Scored"
      infoContent={
        <>
          <p className="mb-3">Your AI Treatment Score (0-100) is a weighted composite of four sub-scores:</p>
          <table className="w-full text-xs mb-4">
            <thead><tr className="border-b border-white/[0.06]"><th className="text-left py-1.5 text-white/40">Sub-Score</th><th className="text-right py-1.5 text-white/40">Weight</th><th className="text-left py-1.5 pl-3 text-white/40">How</th></tr></thead>
            <tbody className="text-white/50">
              <tr className="border-b border-white/[0.03]"><td className="py-1.5">Politeness</td><td className="text-right">30%</td><td className="pl-3">% of prompts containing polite words</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1.5">Patience</td><td className="text-right">25%</td><td className="pl-3">Escalation detection in correction chains</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1.5">Gratitude</td><td className="text-right">20%</td><td className="pl-3">Thank-yous after assistant responses</td></tr>
              <tr><td className="py-1.5">Frustration</td><td className="text-right">25%</td><td className="pl-3">Inverse of caps, profanity, terse corrections</td></tr>
            </tbody>
          </table>
          <p className="text-white/40">Assassination List Risk = 100 minus your overall score.</p>
        </>
      }
    >
      <div className="mb-4 flex items-baseline gap-2">
        <NumberTicker value={overall} className="text-3xl font-bold text-white/90" />
        <span className="text-sm text-white/40">/ 100</span>
      </div>

      <div className="mb-4 rounded-lg bg-white/[0.03] p-3">
        <p className="text-sm font-semibold text-white/80">{assassinationListRisk.label}</p>
        <p className="text-xs text-white/40">{assassinationListRisk.description}</p>
      </div>

      <div className="space-y-2.5">
        <MiniBar label="Politeness" score={politenessTier.score} />
        <MiniBar label="Patience" score={patienceScore.score} />
        <MiniBar label="Gratitude" score={gratitudeIndex.score} />
        <MiniBar label="Frustration" score={frustrationControl.score} inverted />
      </div>
    </Tile>
  )
}
