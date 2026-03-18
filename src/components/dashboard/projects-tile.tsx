"use client"

import { useState } from "react"
import { Tile } from "./tile"

interface ProjectsTileProps {
  topProjects: Array<{ project: string; sessionCount: number }>
  topGitBranches: Array<{ branch: string; count: number }>
}

function basename(path: string): string {
  const segments = path.split("/").filter(Boolean)
  return segments[segments.length - 1] || path
}

const COLLAPSED_PROJECTS = 6
const COLLAPSED_BRANCHES = 5

export function ProjectsTile({ topProjects, topGitBranches }: ProjectsTileProps) {
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [showAllBranches, setShowAllBranches] = useState(false)

  const visibleProjects = showAllProjects ? topProjects : topProjects.slice(0, COLLAPSED_PROJECTS)
  const hiddenProjects = topProjects.length - COLLAPSED_PROJECTS
  const visibleBranches = showAllBranches ? topGitBranches : topGitBranches.slice(0, COLLAPSED_BRANCHES)
  const hiddenBranches = topGitBranches.length - COLLAPSED_BRANCHES

  return (
    <Tile title="Projects">
      {topProjects.length === 0 ? (
        <p className="text-sm text-white/20">No project data</p>
      ) : (
        <div className="mb-4 space-y-2">
          {visibleProjects.map((p, i) => (
            <div key={p.project} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-white/20 shrink-0">{i + 1}</span>
                <span className="truncate text-sm text-white/80">{basename(p.project)}</span>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-white/40">
                {p.sessionCount} {p.sessionCount === 1 ? "session" : "sessions"}
              </span>
            </div>
          ))}
          {hiddenProjects > 0 && (
            <button
              onClick={() => setShowAllProjects((v) => !v)}
              className="text-[11px] text-purple-400/60 hover:text-purple-400 transition-colors"
            >
              {showAllProjects ? "Show less" : `+${hiddenProjects} more`}
            </button>
          )}
        </div>
      )}

      {visibleBranches.length > 0 && (
        <div className="border-t border-white/[0.06] pt-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/20">Top Branches</h3>
          <div className="space-y-1">
            {visibleBranches.map((b) => (
              <div key={b.branch} className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-white/60">{b.branch}</span>
                <span className="shrink-0 text-xs tabular-nums text-white/40">{b.count}</span>
              </div>
            ))}
            {hiddenBranches > 0 && (
              <button
                onClick={() => setShowAllBranches((v) => !v)}
                className="text-[11px] text-purple-400/60 hover:text-purple-400 transition-colors"
              >
                {showAllBranches ? "Show less" : `+${hiddenBranches} more`}
              </button>
            )}
          </div>
        </div>
      )}
    </Tile>
  )
}
