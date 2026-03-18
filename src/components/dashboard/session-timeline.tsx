"use client"

import { useState } from "react"
import { Tile } from "./tile"

interface SessionTimelineProps {
  timeline: Array<{ date: string; sessionCount: number; messageCount: number }>
}

export function SessionTimeline({ timeline }: SessionTimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (timeline.length === 0) {
    return (
      <Tile title="Activity Timeline">
        <p className="text-sm text-white/20">No session data</p>
      </Tile>
    )
  }

  const maxSessions = Math.max(...timeline.map((d) => d.sessionCount), 1)

  return (
    <Tile title="Activity Timeline">
      <div className="relative mb-2 flex items-end gap-[2px]" style={{ height: 100 }}>
        {timeline.map((day, i) => {
          const pct = day.sessionCount / maxSessions
          const isHovered = hoveredIndex === i
          return (
            <div
              key={day.date}
              className="group relative flex-1 cursor-pointer"
              style={{ height: "100%" }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="absolute bottom-0 w-full rounded-t-sm transition-all duration-300"
                style={{
                  height: `${Math.max(pct * 100, 6)}%`,
                  backgroundColor: isHovered
                    ? "rgba(168, 85, 247, 1)"
                    : `rgba(168, 85, 247, ${0.3 + pct * 0.7})`,
                }}
              />
              {isHovered && (
                <div className="absolute -top-14 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/[0.1] bg-[#1a1a1a] px-2.5 py-1.5 text-xs shadow-lg">
                  <p className="font-medium text-white/80">{day.date}</p>
                  <p className="text-white/40">
                    {day.sessionCount} {day.sessionCount === 1 ? "session" : "sessions"} &middot; {day.messageCount} msgs
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-white/20">View all sessions</p>
    </Tile>
  )
}
