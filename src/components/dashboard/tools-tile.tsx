"use client"

import { useState } from "react"
import { Tile } from "./tile"

interface ToolsTileProps {
  topTools: Array<{ name: string; count: number }>
  totalToolCalls: number
  errorRate: number
}

const COLLAPSED_COUNT = 10

export function ToolsTile({ topTools, totalToolCalls, errorRate }: ToolsTileProps) {
  const [showAll, setShowAll] = useState(false)

  if (topTools.length === 0) {
    return (
      <Tile title="Tool Usage">
        <p className="text-sm text-white/20">No tool calls recorded</p>
      </Tile>
    )
  }

  const visible = showAll ? topTools : topTools.slice(0, COLLAPSED_COUNT)
  const maxCount = Math.max(...topTools.map((t) => t.count), 1)

  return (
    <Tile title="Tool Usage">
      <div className="mb-4 space-y-2">
        {visible.map((tool) => (
          <div key={tool.name} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate text-xs text-white/60">{tool.name}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${(tool.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs tabular-nums text-white/40">{tool.count}</span>
          </div>
        ))}
        {topTools.length > COLLAPSED_COUNT && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-[11px] text-purple-400/60 hover:text-purple-400 transition-colors"
          >
            {showAll ? "Show less" : `+${topTools.length - COLLAPSED_COUNT} more`}
          </button>
        )}
      </div>

      <div className="flex gap-4 border-t border-white/[0.06] pt-3 text-xs text-white/40">
        <span>
          Total: <span className="font-medium text-white/60">{totalToolCalls.toLocaleString()}</span>
        </span>
        <span>
          Error rate: <span className="font-medium text-white/60">{(errorRate * 100).toFixed(1)}%</span>
        </span>
      </div>
    </Tile>
  )
}
