"use client"

import { cn } from "@/lib/utils"

interface DashboardTabsProps {
  activeTab: "overview" | "sessions"
  onTabChange: (tab: "overview" | "sessions") => void
}

const TABS: Array<{ key: "overview" | "sessions"; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "sessions", label: "Sessions" },
]

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <div className="flex gap-1 border-b border-white/[0.06]">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "relative px-4 py-2 text-sm font-medium transition-colors",
            activeTab === tab.key
              ? "text-white/90"
              : "text-white/40 hover:text-white/60"
          )}
        >
          {tab.label}
          {activeTab === tab.key && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-purple-500" />
          )}
        </button>
      ))}
    </div>
  )
}
