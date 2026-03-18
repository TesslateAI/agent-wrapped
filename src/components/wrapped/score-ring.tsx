"use client"

import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar"

interface ScoreRingProps {
  score: number
  label: string
  description: string
  gaugePrimaryColor?: string
  gaugeSecondaryColor?: string
}

export function ScoreRing({
  score,
  label,
  description,
  gaugePrimaryColor = "#9E7AFF",
  gaugeSecondaryColor = "#1a1a2e",
}: ScoreRingProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <AnimatedCircularProgressBar
        value={score}
        max={100}
        gaugePrimaryColor={gaugePrimaryColor}
        gaugeSecondaryColor={gaugeSecondaryColor}
        className="size-32 md:size-40"
      />
      <h3 className="text-lg font-bold text-white">{label}</h3>
      <p className="text-xs text-muted-foreground text-center max-w-[180px]">{description}</p>
    </div>
  )
}
