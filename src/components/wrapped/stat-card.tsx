"use client"

import { MagicCard } from "@/components/ui/magic-card"
import { NumberTicker } from "@/components/ui/number-ticker"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: number
  suffix?: string
  gradient?: string
  decimalPlaces?: number
}

export function StatCard({
  label,
  value,
  suffix,
  gradient = "from-purple-400 to-pink-500",
  decimalPlaces = 0,
}: StatCardProps) {
  return (
    <MagicCard className="rounded-xl" gradientFrom="#9E7AFF" gradientTo="#FE8BBB">
      <div className="p-6 flex flex-col items-center justify-center text-center">
        <div className={cn("text-4xl md:text-6xl font-bold bg-gradient-to-r bg-clip-text text-transparent", gradient)}>
          <NumberTicker value={value} decimalPlaces={decimalPlaces} className={cn("text-4xl md:text-6xl font-bold bg-gradient-to-r bg-clip-text text-transparent !text-transparent", gradient)} />
          {suffix && <span className="text-2xl md:text-3xl ml-1">{suffix}</span>}
        </div>
        <p className="text-sm text-muted-foreground mt-2">{label}</p>
      </div>
    </MagicCard>
  )
}
