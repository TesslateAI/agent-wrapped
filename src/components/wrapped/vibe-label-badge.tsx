"use client"

import { AuroraText } from "@/components/ui/aurora-text"
import { NumberTicker } from "@/components/ui/number-ticker"

interface VibeLabelBadgeProps {
  label: string
  score: number
}

export function VibeLabelBadge({ label, score }: VibeLabelBadgeProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <p className="text-sm uppercase tracking-widest text-muted-foreground">Your Overall Vibe</p>
      <AuroraText
        className="text-4xl md:text-6xl lg:text-8xl font-black"
        colors={["#FF0080", "#7928CA", "#0070F3", "#38bdf8"]}
        speed={1.5}
      >
        {label}
      </AuroraText>
      <div className="flex items-baseline gap-2">
        <NumberTicker
          value={score}
          className="text-5xl md:text-7xl font-bold text-white"
        />
        <span className="text-2xl text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}
