"use client"

import { useRef } from "react"
import { motion, useInView } from "motion/react"
import { cn } from "@/lib/utils"

interface TreatmentMeterProps {
  label: string
  score: number
  tier: string
  gradient?: string
}

export function TreatmentMeter({
  label,
  score,
  tier,
  gradient,
}: TreatmentMeterProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  // Gradient from red (low) to yellow (mid) to green (high)
  const barColor = gradient ?? (
    score < 33
      ? "from-red-500 to-orange-500"
      : score < 66
        ? "from-orange-400 to-yellow-400"
        : "from-green-400 to-emerald-500"
  )

  return (
    <div ref={ref} className="w-full max-w-lg space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="text-xs text-muted-foreground">{tier}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${score}%` } : { width: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          className={cn("h-full rounded-full bg-gradient-to-r", barColor)}
        />
      </div>
      <div className="text-right">
        <span className="text-xs text-muted-foreground">{score}/100</span>
      </div>
    </div>
  )
}
