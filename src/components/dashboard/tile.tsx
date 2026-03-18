"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { InfoModal } from "./info-modal"

interface TileProps {
  title: string
  children: React.ReactNode
  className?: string
  infoTitle?: string
  infoContent?: React.ReactNode
}

export function Tile({ title, children, className, infoTitle, infoContent }: TileProps) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className={cn("rounded-xl border border-white/[0.06] bg-white/[0.02] p-5", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">{title}</h2>
        {infoContent && (
          <button
            onClick={() => setShowInfo(true)}
            className="rounded-full p-1 text-white/20 transition-colors hover:bg-white/[0.05] hover:text-white/50"
            aria-label={`How ${title} is calculated`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
          </button>
        )}
      </div>
      {children}
      {showInfo && (
        <InfoModal title={infoTitle ?? `How ${title} is calculated`} onClose={() => setShowInfo(false)}>
          {infoContent}
        </InfoModal>
      )}
    </div>
  )
}
