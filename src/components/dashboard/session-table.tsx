"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import type { SessionDetail, SessionTraceMessage } from "@/lib/types/analysis"

interface SessionTableProps {
  sessions: SessionDetail[]
}

type SortKey = keyof Pick<
  SessionDetail,
  "startTime" | "project" | "gitBranch" | "durationMinutes" | "messageCount" | "tokenCount" | "toolCallCount" | "errorCount"
>

type SortDirection = "asc" | "desc"

const PAGE_SIZE = 50

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function projectBasename(project: string): string {
  return project.split("/").pop() || project
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let idx = lowerText.indexOf(lowerQuery, lastIndex)

  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push(<span key={lastIndex}>{text.slice(lastIndex, idx)}</span>)
    }
    parts.push(
      <mark key={`m-${idx}`} className="bg-purple-500/30 text-white">
        {text.slice(idx, idx + query.length)}
      </mark>
    )
    lastIndex = idx + query.length
    idx = lowerText.indexOf(lowerQuery, lastIndex)
  }

  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? <>{parts}</> : text
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "startTime", label: "Date" },
  { key: "project", label: "Project" },
  { key: "gitBranch", label: "Branch" },
  { key: "durationMinutes", label: "Duration" },
  { key: "messageCount", label: "Messages" },
  { key: "tokenCount", label: "Tokens" },
  { key: "toolCallCount", label: "Tools" },
  { key: "errorCount", label: "Errors" },
]

export default function SessionTable({ sessions }: SessionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("startTime")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null)
  const [projectFilter, setProjectFilter] = useState("all")
  const [branchFilter, setBranchFilter] = useState("all")
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showDateFilter, setShowDateFilter] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [projectFilter, branchFilter, debouncedSearch, dateFrom, dateTo])

  // Compute date bounds for placeholders
  const dateBounds = useMemo(() => {
    if (sessions.length === 0) return { min: "", max: "" }
    const times = sessions.map((s) => new Date(s.startTime).getTime()).filter((t) => !isNaN(t))
    if (times.length === 0) return { min: "", max: "" }
    const min = new Date(Math.min(...times)).toISOString().slice(0, 10)
    const max = new Date(Math.max(...times)).toISOString().slice(0, 10)
    return { min, max }
  }, [sessions])

  const hasDateFilter = dateFrom !== "" || dateTo !== ""

  const uniqueProjects = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.project).filter((p) => p && p.trim() !== ""))).sort(),
    [sessions]
  )

  const uniqueBranches = useMemo(
    () =>
      Array.from(new Set(sessions.map((s) => s.gitBranch).filter((b): b is string => b !== undefined))).sort(),
    [sessions]
  )

  const hasBranches = uniqueBranches.length > 0

  const filtered = useMemo(() => {
    let result = sessions

    if (projectFilter !== "all") {
      result = result.filter((s) => s.project === projectFilter)
    }
    if (branchFilter !== "all") {
      result = result.filter((s) => s.gitBranch === branchFilter)
    }
    if (dateFrom) {
      const from = new Date(dateFrom + "T00:00:00").getTime()
      result = result.filter((s) => new Date(s.startTime).getTime() >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59").getTime()
      result = result.filter((s) => new Date(s.startTime).getTime() <= to)
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter((s) =>
        s.userPrompts.some((p) => p.toLowerCase().includes(q))
      )
    }

    return result
  }, [sessions, projectFilter, branchFilter, dateFrom, dateTo, debouncedSearch])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let aVal: string | number = a[sortKey] ?? ""
      let bVal: string | number = b[sortKey] ?? ""

      if (sortKey === "startTime") {
        aVal = new Date(aVal as string).getTime()
        bVal = new Date(bVal as string).getTime()
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        const cmp = aVal.localeCompare(bVal)
        return sortDirection === "asc" ? cmp : -cmp
      }
      const cmp = (aVal as number) - (bVal as number)
      return sortDirection === "asc" ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, sortDirection])

  const visible = sorted.slice(0, visibleCount)

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
      } else {
        setSortKey(key)
        setSortDirection("desc")
      }
    },
    [sortKey]
  )

  const openSession = useCallback((session: SessionDetail) => {
    setSelectedSession(session)
  }, [])

  const closeSession = useCallback(() => {
    setSelectedSession(null)
  }, [])

  if (sessions.length === 0) {
    return (
      <div className="text-center text-white/40 py-12">No sessions found</div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="max-w-[180px] truncate bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-purple-500/50"
        >
          <option value="all">All Projects</option>
          {uniqueProjects.map((p) => (
            <option key={p} value={p}>
              {projectBasename(p)}
            </option>
          ))}
        </select>

        {hasBranches && (
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="max-w-[180px] truncate bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-purple-500/50"
          >
            <option value="all">All Branches</option>
            {uniqueBranches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        )}

        {/* Date filter toggle */}
        <button
          onClick={() => setShowDateFilter((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors",
            hasDateFilter
              ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
              : "border-white/[0.08] bg-white/[0.05] text-white/50 hover:text-white/70"
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
          </svg>
          {hasDateFilter
            ? `${dateFrom || dateBounds.min} → ${dateTo || dateBounds.max}`
            : "Date Range"
          }
        </button>

        <input
          type="text"
          placeholder="Search prompts..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 min-w-[200px]"
        />
      </div>

      {/* Date range picker (expandable) */}
      {showDateFilter && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <span className="text-xs text-white/30">From</span>
          <DateInput
            value={dateFrom}
            placeholder={dateBounds.min || "YYYY-MM-DD"}
            min={dateBounds.min}
            max={dateTo || dateBounds.max}
            onChange={setDateFrom}
          />
          <span className="text-xs text-white/30">To</span>
          <DateInput
            value={dateTo}
            placeholder={dateBounds.max || "YYYY-MM-DD"}
            min={dateFrom || dateBounds.min}
            max={dateBounds.max}
            onChange={setDateTo}
          />
          {hasDateFilter && (
            <button
              onClick={() => { setDateFrom(""); setDateTo("") }}
              className="rounded-md px-2.5 py-1.5 text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
            >
              Clear
            </button>
          )}
          <span className="ml-auto text-[11px] text-white/15">
            Full range: {dateBounds.min ? new Date(dateBounds.min + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"} — {dateBounds.max ? new Date(dateBounds.max + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {COLUMNS.map((col) => {
                const isActive = sortKey === col.key
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left text-xs uppercase tracking-wider text-white/40 cursor-pointer hover:text-white/60 px-3 py-2 select-none transition-colors"
                    aria-sort={
                      isActive
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {isActive && (
                        <span className="text-purple-400">
                          {sortDirection === "asc" ? "\u2191" : "\u2193"}
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="text-center text-white/40 py-12"
                >
                  No sessions match your filters
                </td>
              </tr>
            ) : (
              visible.map((session) => (
                <tr
                  key={session.id}
                  onClick={() => openSession(session)}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2.5 text-white/70 whitespace-nowrap">
                    {formatDate(session.startTime)}
                  </td>
                  <td className="px-3 py-2.5 text-white/70">
                    {projectBasename(session.project)}
                  </td>
                  <td className="px-3 py-2.5 text-white/50">
                    {session.gitBranch ?? "\u2014"}
                  </td>
                  <td className="px-3 py-2.5 text-white/70">
                    {session.durationMinutes} min
                  </td>
                  <td className="px-3 py-2.5 text-white/70">{session.messageCount}</td>
                  <td className="px-3 py-2.5 text-white/70">
                    {formatTokens(session.tokenCount)}
                  </td>
                  <td className="px-3 py-2.5 text-white/70">{session.toolCallCount}</td>
                  <td
                    className={cn(
                      "px-3 py-2.5",
                      session.errorCount > 0 ? "text-red-400" : "text-white/70"
                    )}
                  >
                    {session.errorCount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-white/40 pt-2">
        <span>
          Showing {Math.min(visibleCount, sorted.length)} of {sorted.length}{" "}
          sessions
        </span>
        {visibleCount < sorted.length && (
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white/80 hover:bg-white/[0.08] transition-colors"
          >
            Show more
          </button>
        )}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionModal
          session={selectedSession}
          searchQuery={debouncedSearch}
          onClose={closeSession}
        />
      )}
    </div>
  )
}

function DateInput({
  value,
  placeholder,
  min,
  max,
  onChange,
}: {
  value: string
  placeholder: string
  min?: string
  max?: string
  onChange: (v: string) => void
}) {
  const dateRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const v = (e.target as HTMLInputElement).value
            if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
              const d = new Date(v)
              if (!isNaN(d.getTime())) onChange(d.toISOString().slice(0, 10))
            }
            ;(e.target as HTMLInputElement).blur()
          }
        }}
        onBlur={(e) => {
          const v = e.target.value
          if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
            const d = new Date(v)
            if (!isNaN(d.getTime())) onChange(d.toISOString().slice(0, 10))
          }
        }}
        className="rounded-md border border-white/[0.08] bg-white/[0.05] pl-2.5 pr-8 py-1.5 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 w-[140px] font-mono"
      />
      {/* Hidden date input — positioned to this specific field, not overlaid */}
      <input
        ref={dateRef}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="pointer-events-none absolute right-0 top-0 h-0 w-0 opacity-0 [color-scheme:dark]"
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => {
          try {
            dateRef.current?.showPicker()
          } catch {
            dateRef.current?.click()
          }
        }}
        className="absolute right-1.5 rounded p-0.5 text-white/25 hover:text-white/50 transition-colors"
        tabIndex={-1}
        aria-label="Open calendar"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
        </svg>
      </button>
    </div>
  )
}

type TraceFilter = "all" | "user" | "assistant" | "tool" | "errors"

const FILTER_OPTIONS: { value: TraceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "user", label: "User" },
  { value: "assistant", label: "Assistant" },
  { value: "tool", label: "Tools" },
  { value: "errors", label: "Errors" },
]

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  user: {
    label: "User Prompt",
    color: "text-blue-400",
    bg: "bg-blue-500/[0.06]",
    border: "border-blue-500/20",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  assistant: {
    label: "Assistant Response",
    color: "text-purple-400",
    bg: "bg-purple-500/[0.06]",
    border: "border-purple-500/20",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
      </svg>
    ),
  },
  tool: {
    label: "Tool Result",
    color: "text-teal-400",
    bg: "bg-teal-500/[0.06]",
    border: "border-teal-500/20",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  system: {
    label: "System",
    color: "text-yellow-400",
    bg: "bg-yellow-500/[0.06]",
    border: "border-yellow-500/20",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
      </svg>
    ),
  },
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })
}

function SessionModal({
  session,
  searchQuery,
  onClose,
}: {
  session: SessionDetail
  searchQuery: string
  onClose: () => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<TraceFilter>("all")
  const [traceSearch, setTraceSearch] = useState("")
  const [debouncedTraceSearch, setDebouncedTraceSearch] = useState("")
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const MESSAGES_PER_PAGE = 100

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTraceSearch(traceSearch), 300)
    return () => clearTimeout(timer)
  }, [traceSearch])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [onClose])

  const filteredMessages = useMemo(() => {
    let msgs = session.messages

    // Role filter
    if (filter === "user") msgs = msgs.filter((m) => m.role === "user")
    else if (filter === "assistant") msgs = msgs.filter((m) => m.role === "assistant")
    else if (filter === "tool") msgs = msgs.filter((m) => m.role === "tool" || (m.toolCalls && m.toolCalls.length > 0))
    else if (filter === "errors") msgs = msgs.filter((m) => m.toolResults?.some((r) => r.isError))

    // Search filter
    if (debouncedTraceSearch) {
      const q = debouncedTraceSearch.toLowerCase()
      msgs = msgs.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          m.toolCalls?.some((tc) => tc.name.toLowerCase().includes(q)) ||
          m.toolResults?.some((tr) => tr.content.toLowerCase().includes(q))
      )
    }

    return msgs
  }, [session.messages, filter, debouncedTraceSearch])

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [filter, debouncedTraceSearch])

  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / MESSAGES_PER_PAGE))
  const paginatedMessages = filteredMessages.slice(page * MESSAGES_PER_PAGE, (page + 1) * MESSAGES_PER_PAGE)
  const rangeStart = page * MESSAGES_PER_PAGE + 1
  const rangeEnd = Math.min((page + 1) * MESSAGES_PER_PAGE, filteredMessages.length)

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedMessages((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const activeSearch = debouncedTraceSearch || searchQuery

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white truncate">
                {projectBasename(session.project)}
              </h3>
              {session.gitBranch && (
                <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs text-white/40 font-mono">
                  {session.gitBranch}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-white/35">
              {formatDate(session.startTime)} &middot; {session.durationMinutes} min
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-5 gap-px border-b border-white/[0.06] bg-white/[0.02]">
          {[
            { label: "Messages", value: session.messageCount },
            { label: "Tokens", value: formatTokens(session.tokenCount) },
            { label: "Tool Calls", value: session.toolCallCount },
            { label: "Errors", value: session.errorCount, isError: session.errorCount > 0 },
            { label: "User Prompts", value: session.userPromptCount },
          ].map((s) => (
            <div key={s.label} className="bg-[#0a0a0a] px-3 py-2.5 text-center">
              <p className={cn("text-base font-bold", "isError" in s && s.isError ? "text-red-400" : "text-white/80")}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/25">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex gap-1">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === opt.value
                    ? "bg-white/[0.1] text-white"
                    : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]",
                  opt.value === "errors" && session.errorCount > 0 && filter !== "errors" && "text-red-400/60"
                )}
              >
                {opt.label}
                {opt.value === "errors" && session.errorCount > 0 && (
                  <span className="ml-1 text-red-400">({session.errorCount})</span>
                )}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={traceSearch}
              onChange={(e) => setTraceSearch(e.target.value)}
              placeholder="Search trace..."
              className="bg-transparent text-sm text-white/70 placeholder:text-white/20 focus:outline-none w-40"
            />
          </div>
        </div>

        {/* Pagination bar */}
        <div className="flex items-center justify-between px-4 py-1.5 text-[11px] border-b border-white/[0.03]">
          <span className="text-white/20">
            {filteredMessages.length === 0
              ? "No messages"
              : `${rangeStart}–${rangeEnd} of ${filteredMessages.length} messages`}
            {filteredMessages.length < session.messages.length && (
              <span className="text-white/15"> (filtered from {session.messages.length})</span>
            )}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="rounded p-1 text-white/30 hover:text-white/60 hover:bg-white/[0.04] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                aria-label="First page"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m11 17-5-5 5-5" /><path d="m18 17-5-5 5-5" />
                </svg>
              </button>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded p-1 text-white/30 hover:text-white/60 hover:bg-white/[0.04] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <span className="px-2 text-white/30 tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded p-1 text-white/30 hover:text-white/60 hover:bg-white/[0.04] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="rounded p-1 text-white/30 hover:text-white/60 hover:bg-white/[0.04] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                aria-label="Last page"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m13 17 5-5-5-5" /><path d="m6 17 5-5-5-5" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Trace log */}
        <div className="flex-1 overflow-y-auto">
          {paginatedMessages.length === 0 ? (
            <div className="py-16 text-center text-sm text-white/25">
              No messages match your filter
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {paginatedMessages.map((msg, idx) => (
                <TraceMessageRow
                  key={`${msg.id}-${page}-${idx}`}
                  message={msg}
                  searchQuery={activeSearch}
                  isCollapsed={collapsedMessages.has(msg.id)}
                  onToggleCollapse={() => toggleCollapse(msg.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Top tools footer */}
        {session.topTools.length > 0 && (
          <div className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-2.5 overflow-x-auto">
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-white/20">Top tools</span>
            {session.topTools.map((t) => (
              <span key={t.name} className="shrink-0 rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/40 font-mono">
                {t.name} <span className="text-white/20">{t.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TraceMessageRow({
  message,
  searchQuery,
  isCollapsed,
  onToggleCollapse,
}: {
  message: SessionTraceMessage
  searchQuery: string
  isCollapsed: boolean
  onToggleCollapse: () => void
}) {
  const config = ROLE_CONFIG[message.role] || ROLE_CONFIG.system
  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0
  const hasToolResults = message.toolResults && message.toolResults.length > 0
  const hasErrors = message.toolResults?.some((r) => r.isError)
  const isLong = message.content.length > 300

  return (
    <div className={cn("group", hasErrors && "bg-red-500/[0.03]")}>
      {/* Message header */}
      <div
        className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggleCollapse}
      >
        <span className={cn("shrink-0", config.color)}>{config.icon}</span>
        <span className={cn("text-xs font-semibold uppercase tracking-wider", config.color)}>
          {config.label}
        </span>
        {message.model && (
          <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-white/20">
            {message.model}
          </span>
        )}
        {hasToolCalls && (
          <span className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[10px] text-teal-400/70">
            {message.toolCalls!.length} tool call{message.toolCalls!.length !== 1 ? "s" : ""}
          </span>
        )}
        {hasErrors && (
          <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
            ERROR
          </span>
        )}
        {message.tokenUsage && (
          <span className="text-[10px] text-white/15">
            {(message.tokenUsage.inputTokens + message.tokenUsage.outputTokens).toLocaleString()} tok
          </span>
        )}
        <span className="ml-auto text-[10px] text-white/15 font-mono">
          {formatTime(message.timestamp)}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={cn("shrink-0 text-white/15 transition-transform", !isCollapsed && "rotate-180")}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      {/* Message body (collapsible) */}
      {!isCollapsed && (
        <div className="px-4 pb-3 pl-10">
          {/* Main content */}
          {message.content && (
            <div className={cn("rounded-lg px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap font-mono", config.bg, "border", config.border)}>
              <span className="text-white/50">
                {highlightText(
                  isLong ? message.content : message.content,
                  searchQuery
                )}
              </span>
            </div>
          )}

          {/* Tool calls */}
          {hasToolCalls && (
            <div className="mt-2 space-y-1.5">
              {message.toolCalls!.map((tc) => {
                const inputStr = formatToolInput(tc.input)
                return (
                  <div key={tc.id} className="rounded-lg border border-teal-500/10 bg-teal-500/[0.04] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-teal-400">{tc.name}</span>
                      <span className="text-[10px] font-mono text-white/15">{tc.id}</span>
                    </div>
                    {inputStr && (
                      <pre className="mt-1 text-[11px] text-white/30 font-mono overflow-x-auto max-h-24 overflow-y-auto">
                        {highlightText(inputStr, searchQuery)}
                      </pre>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Tool results */}
          {hasToolResults && (
            <div className="mt-2 space-y-1.5">
              {message.toolResults!.map((tr, i) => (
                <div
                  key={`${tr.toolCallId}-${i}`}
                  className={cn(
                    "rounded-lg border px-3 py-2",
                    tr.isError
                      ? "border-red-500/20 bg-red-500/[0.06]"
                      : "border-white/[0.04] bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {tr.isError ? (
                      <span className="text-xs font-semibold text-red-400">Error Output</span>
                    ) : (
                      <span className="text-xs font-semibold text-white/30">Tool Output</span>
                    )}
                    <span className="text-[10px] font-mono text-white/15">{tr.toolCallId}</span>
                  </div>
                  <pre className={cn(
                    "text-[11px] font-mono overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap",
                    tr.isError ? "text-red-300/60" : "text-white/30"
                  )}>
                    {highlightText(tr.content, searchQuery)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatToolInput(input: Record<string, unknown>): string {
  const entries = Object.entries(input)
  if (entries.length === 0) return ""
  if (entries.length === 1) {
    const [key, val] = entries[0]
    if (typeof val === "string") return `${key}: ${val}`
  }
  try {
    return JSON.stringify(input, null, 2)
  } catch {
    return String(input)
  }
}
