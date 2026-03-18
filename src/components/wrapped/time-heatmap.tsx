"use client"

import { useRef } from "react"
import { motion, useInView } from "motion/react"

interface TimeHeatmapProps {
  hourDistribution: number[]
  dayDistribution: number[]
  label: string
}

export function TimeHeatmap({ hourDistribution, label }: TimeHeatmapProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const maxHour = Math.max(...hourDistribution, 1)

  const hourLabels = Array.from({ length: 24 }, (_, i) => {
    if (i === 0) return "12a"
    if (i < 12) return `${i}a`
    if (i === 12) return "12p"
    return `${i - 12}p`
  })

  return (
    <div ref={ref} className="w-full max-w-2xl space-y-6">
      <h3 className="text-4xl md:text-6xl lg:text-8xl font-black text-center bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
        {label}
      </h3>
      <div className="flex items-end justify-center gap-[2px] md:gap-1 h-32 md:h-48 px-2">
        {hourDistribution.map((count, hour) => {
          const height = (count / maxHour) * 100
          const intensity = count / maxHour
          return (
            <div key={hour} className="flex flex-col items-center flex-1 h-full justify-end">
              <motion.div
                initial={{ height: 0 }}
                animate={isInView ? { height: `${height}%` } : { height: 0 }}
                transition={{ duration: 0.8, delay: hour * 0.03, ease: "easeOut" }}
                className="w-full rounded-t-sm min-h-[2px]"
                style={{
                  background: `linear-gradient(to top, rgba(168, 85, 247, ${0.2 + intensity * 0.8}), rgba(236, 72, 153, ${0.2 + intensity * 0.8}))`,
                }}
              />
              {hour % 3 === 0 && (
                <span className="text-[8px] md:text-[10px] text-muted-foreground mt-1 select-none">
                  {hourLabels[hour]}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-center text-sm text-muted-foreground">Activity by hour of day</p>
    </div>
  )
}
