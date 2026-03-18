"use client"

import { useState } from "react"
import type { CodeImpact } from "@/lib/types"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Tile } from "./tile"

interface CodeImpactTileProps {
  codeImpact: CodeImpact
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3572a5",
  Rust: "#dea584",
  Go: "#00add8",
  Ruby: "#cc342d",
  Java: "#b07219",
  CSS: "#563d7c",
  HTML: "#e34c26",
  JSON: "#292929",
  Markdown: "#083fa1",
}

function langColor(lang: string): string {
  return LANG_COLORS[lang] || "#6b7280"
}

export function CodeImpactTile({ codeImpact }: CodeImpactTileProps) {
  const { languagesDetected, uniqueFilesTouched, taskTypeBreakdown, errorRate, frameworksDetected } = codeImpact
  const [showAllFrameworks, setShowAllFrameworks] = useState(false)

  if (uniqueFilesTouched === 0) {
    return (
      <Tile title="Code Impact">
        <p className="text-sm text-white/20">No file operations detected</p>
      </Tile>
    )
  }

  const maxTask = Math.max(...taskTypeBreakdown.map((t) => t.count), 1)

  return (
    <Tile title="Code Impact">
      {/* Languages */}
      {languagesDetected.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[11px] text-white/25">Languages by unique files touched</p>
          <div className="flex flex-wrap gap-1.5">
            {languagesDetected.map((l) => (
              <span
                key={l.language}
                className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-xs text-white/60"
              >
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: langColor(l.language) }}
                />
                {l.language}
                <span className="text-white/20">{l.fileCount} {l.fileCount === 1 ? "file" : "files"}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Unique files */}
      <div className="mb-4 flex items-baseline gap-1">
        <NumberTicker value={uniqueFilesTouched} className="text-2xl font-bold text-white/90" />
        <span className="text-xs text-white/40">unique files touched across all sessions</span>
      </div>

      {/* Task type breakdown */}
      {taskTypeBreakdown.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[11px] text-white/25">Prompts by task type (a prompt can match multiple)</p>
          <div className="space-y-1.5">
            {taskTypeBreakdown.map((task) => (
              <div key={task.type} className="flex items-center gap-2">
                <span className="w-20 shrink-0 truncate text-xs text-white/40">{task.type}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${(task.count / maxTask) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs tabular-nums text-white/20">{task.count} prompts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frameworks & Libraries */}
      {frameworksDetected.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[11px] text-white/25">Frameworks & libraries detected from prompts and file paths</p>
          <div className="flex flex-wrap gap-1.5">
            {(showAllFrameworks ? frameworksDetected : frameworksDetected.slice(0, 12)).map((f) => (
              <span
                key={f.name}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-xs text-white/60"
              >
                {f.name}
                <span className="ml-1 text-white/20">{f.mentions}</span>
              </span>
            ))}
            {frameworksDetected.length > 12 && (
              <button
                onClick={() => setShowAllFrameworks((v) => !v)}
                className="text-[11px] text-purple-400/60 hover:text-purple-400 transition-colors"
              >
                {showAllFrameworks ? "Show less" : `+${frameworksDetected.length - 12} more`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error rate */}
      <div className="text-xs text-white/40">
        Tool error rate: <span className="font-medium text-white/60">{(errorRate * 100).toFixed(1)}%</span>
        <span className="text-white/15 ml-1">of tool calls returned errors</span>
      </div>
    </Tile>
  )
}
