# Dashboard & Expanded Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bento-grid dashboard as the primary post-upload view with cost tracking, code impact analysis, and session deep-dives, while moving the existing scroll story to `/wrapped/story`.

**Architecture:** Three new analyzer modules (session-details, code-impact, cost-estimate) extend the existing analysis pipeline. The current `/wrapped` scroll story moves to `/wrapped/story`. A new dashboard page at `/wrapped` presents all analytics in a dense bento grid with an Overview tab and a Sessions tab.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, shadcn/ui (Tabs, Card, Badge), Magic UI (NumberTicker, AnimatedCircularProgressBar, ShimmerButton)

**Spec:** `docs/superpowers/specs/2026-03-18-dashboard-and-expanded-analytics-design.md`

---

### Task 1: Add New Types to analysis.ts

**Files:**
- Modify: `src/lib/types/analysis.ts`

- [ ] **Step 1: Add SessionDetail, SessionAnalysis, CodeImpact, CostEstimate types**

Append to the end of `src/lib/types/analysis.ts`:

```typescript
export interface SessionDetail {
  id: string
  startTime: string
  endTime: string
  project: string
  gitBranch?: string
  durationMinutes: number
  messageCount: number
  userPromptCount: number
  tokenCount: number
  toolCallCount: number
  errorCount: number
  topTools: Array<{ name: string; count: number }>
  userPrompts: string[] // truncated to 500 chars, max 20 per session
}

export interface SessionAnalysis {
  sessions: SessionDetail[]
  timeline: Array<{ date: string; sessionCount: number; messageCount: number }>
}

export interface CodeImpact {
  languagesDetected: Array<{ language: string; fileCount: number }>
  uniqueFilesTouched: number
  taskTypeBreakdown: Array<{ type: string; count: number }>
  errorRate: number // 0-1
  topFilePaths: Array<{ path: string; touchCount: number }>
}

export interface CostEstimate {
  totalCost: number // USD
  usedFallbackPricing: boolean
  breakdown: Array<{ model: string; inputTokens: number; outputTokens: number; cost: number }>
  tokenDistribution: { input: number; output: number; cacheCreation: number; cacheRead: number }
}
```

- [ ] **Step 2: Update AnalysisResult interface**

In the same file, update `AnalysisResult` to include the new fields:

```typescript
export interface AnalysisResult {
  rawStats: RawStats
  vibeScores: VibeScores
  promptPersonality: PromptPersonality
  aiTreatment: AITreatmentScore
  sessionDetails: SessionAnalysis
  codeImpact: CodeImpact
  costEstimate: CostEstimate
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build fails because analyzers/index.ts doesn't return the new fields yet. That's fine — we'll fix in Task 4.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types/analysis.ts
git commit -m "feat: add SessionAnalysis, CodeImpact, CostEstimate types"
```

---

### Task 2: Session Details Analyzer

**Files:**
- Create: `src/lib/analyzers/session-details.ts`
- Create: `src/lib/analyzers/__tests__/session-details.test.ts`

- [ ] **Step 1: Write tests**

Create `src/lib/analyzers/__tests__/session-details.test.ts`:

```typescript
import { computeSessionDetails } from "../session-details"
import { createTestData } from "./test-helpers"

describe("computeSessionDetails", () => {
  it("computes per-session aggregates", () => {
    const data = createTestData([
      { role: "user", content: "fix the bug", timestamp: "2026-03-01T10:00:00Z" },
      { role: "assistant", content: "sure", timestamp: "2026-03-01T10:05:00Z" },
      { role: "user", content: "thanks", timestamp: "2026-03-01T10:10:00Z" },
    ])
    const result = computeSessionDetails(data)
    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0].messageCount).toBe(3)
    expect(result.sessions[0].userPromptCount).toBe(2)
    expect(result.sessions[0].durationMinutes).toBe(10)
    expect(result.sessions[0].userPrompts).toEqual(["fix the bug", "thanks"])
  })

  it("truncates prompts to 500 chars", () => {
    const longPrompt = "a".repeat(1000)
    const data = createTestData([
      { role: "user", content: longPrompt, timestamp: "2026-03-01T10:00:00Z" },
    ])
    const result = computeSessionDetails(data)
    expect(result.sessions[0].userPrompts[0]).toHaveLength(500)
  })

  it("limits to 20 prompts per session", () => {
    const messages = Array.from({ length: 30 }, (_, i) => ({
      role: "user" as const,
      content: `prompt ${i}`,
      timestamp: new Date(2026, 2, 1, 10, i).toISOString(),
    }))
    const data = createTestData(messages)
    const result = computeSessionDetails(data)
    expect(result.sessions[0].userPrompts).toHaveLength(20)
  })

  it("computes timeline grouped by date", () => {
    const data = {
      source: "claude-code" as const,
      sessions: [
        {
          id: "s1", startTime: "2026-03-01T10:00:00Z", endTime: "2026-03-01T11:00:00Z",
          project: "/p", messages: [], cwd: "/p",
        },
        {
          id: "s2", startTime: "2026-03-01T14:00:00Z", endTime: "2026-03-01T15:00:00Z",
          project: "/p", messages: [], cwd: "/p",
        },
        {
          id: "s3", startTime: "2026-03-02T10:00:00Z", endTime: "2026-03-02T11:00:00Z",
          project: "/p", messages: [], cwd: "/p",
        },
      ],
      metadata: { totalFiles: 1, earliestTimestamp: "2026-03-01T10:00:00Z", latestTimestamp: "2026-03-02T11:00:00Z", projectPaths: ["/p"] },
    }
    const result = computeSessionDetails(data)
    expect(result.timeline).toHaveLength(2)
    expect(result.timeline[0]).toEqual({ date: "2026-03-01", sessionCount: 2, messageCount: 0 })
    expect(result.timeline[1]).toEqual({ date: "2026-03-02", sessionCount: 1, messageCount: 0 })
  })

  it("counts tool calls and errors", () => {
    const data = createTestData([
      {
        role: "user", content: "do something", timestamp: "2026-03-01T10:00:00Z",
        toolCalls: [{ id: "t1", name: "Bash", input: {} }, { id: "t2", name: "Read", input: {} }],
        toolResults: [{ toolCallId: "t1", content: "ok", isError: false }, { toolCallId: "t2", content: "fail", isError: true }],
      },
    ])
    const result = computeSessionDetails(data)
    expect(result.sessions[0].toolCallCount).toBe(2)
    expect(result.sessions[0].errorCount).toBe(1)
  })

  it("handles empty sessions", () => {
    const data = {
      source: "claude-code" as const,
      sessions: [],
      metadata: { totalFiles: 0, earliestTimestamp: "", latestTimestamp: "", projectPaths: [] },
    }
    const result = computeSessionDetails(data)
    expect(result.sessions).toHaveLength(0)
    expect(result.timeline).toHaveLength(0)
  })
})
```

Update `src/lib/analyzers/__tests__/test-helpers.ts` — add optional `toolCalls` and `toolResults` to the message type in `createTestData` if not already present.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/analyzers/__tests__/session-details.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement session-details.ts**

Create `src/lib/analyzers/session-details.ts`:

```typescript
import type { TraceData, SessionDetail, SessionAnalysis } from "@/lib/types"

const MAX_PROMPT_LENGTH = 500
const MAX_PROMPTS_PER_SESSION = 20

export function computeSessionDetails(data: TraceData): SessionAnalysis {
  const sessions: SessionDetail[] = data.sessions.map((session) => {
    const userMessages = session.messages.filter((m) => m.role === "user")
    const allToolCalls = session.messages.flatMap((m) => m.toolCalls ?? [])
    const allToolResults = session.messages.flatMap((m) => m.toolResults ?? [])

    const tokenCount = session.messages.reduce((sum, m) => {
      if (!m.tokenUsage) return sum
      return sum + m.tokenUsage.inputTokens + m.tokenUsage.outputTokens
    }, 0)

    // Count tools by name
    const toolCounts = new Map<string, number>()
    for (const tc of allToolCalls) {
      toolCounts.set(tc.name, (toolCounts.get(tc.name) ?? 0) + 1)
    }
    const topTools = Array.from(toolCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const start = new Date(session.startTime).getTime()
    const end = new Date(session.endTime).getTime()
    const durationMinutes = isNaN(start) || isNaN(end) ? 0 : Math.max(0, Math.round((end - start) / 60000))

    const userPrompts = userMessages
      .slice(0, MAX_PROMPTS_PER_SESSION)
      .map((m) => m.content.slice(0, MAX_PROMPT_LENGTH))

    return {
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      project: session.project,
      gitBranch: session.gitBranch,
      durationMinutes,
      messageCount: session.messages.length,
      userPromptCount: userMessages.length,
      tokenCount,
      toolCallCount: allToolCalls.length,
      errorCount: allToolResults.filter((r) => r.isError).length,
      topTools,
      userPrompts,
    }
  })

  // Build timeline grouped by date
  const dateMap = new Map<string, { sessionCount: number; messageCount: number }>()
  for (const session of data.sessions) {
    const date = session.startTime.slice(0, 10) // YYYY-MM-DD
    if (!date || date.length !== 10) continue
    const entry = dateMap.get(date) ?? { sessionCount: 0, messageCount: 0 }
    entry.sessionCount++
    entry.messageCount += session.messages.length
    dateMap.set(date, entry)
  }
  const timeline = Array.from(dateMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return { sessions, timeline }
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- src/lib/analyzers/__tests__/session-details.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/analyzers/session-details.ts src/lib/analyzers/__tests__/session-details.test.ts
git commit -m "feat: add session details analyzer"
```

---

### Task 3: Code Impact and Cost Estimate Analyzers

**Files:**
- Create: `src/lib/analyzers/code-impact.ts`
- Create: `src/lib/analyzers/cost-estimate.ts`
- Create: `src/lib/analyzers/__tests__/code-impact.test.ts`
- Create: `src/lib/analyzers/__tests__/cost-estimate.test.ts`

- [ ] **Step 1: Write code-impact tests**

Create `src/lib/analyzers/__tests__/code-impact.test.ts` with tests for:
- Extracting file paths from tool call inputs (Read/Edit/Write/Glob/Grep tools)
- Language detection from file extensions (.ts → TypeScript, .py → Python, etc.)
- Task type classification from user prompt keywords
- Error rate calculation (failed / total tool results)
- File path basename extraction (strips directory)
- Empty data handling (zero tool calls)

- [ ] **Step 2: Write cost-estimate tests**

Create `src/lib/analyzers/__tests__/cost-estimate.test.ts` with tests for:
- Cost calculation with known model (claude-sonnet-4-6)
- Fallback pricing for unknown model
- `usedFallbackPricing` flag set correctly
- Token distribution aggregation
- Empty data (no token usage)

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test -- src/lib/analyzers/__tests__/code-impact.test.ts src/lib/analyzers/__tests__/cost-estimate.test.ts`
Expected: FAIL

- [ ] **Step 4: Implement code-impact.ts**

Create `src/lib/analyzers/code-impact.ts`. Key logic:
- Iterate all messages, collect `toolCalls` where `name` is "Read", "Edit", "Write", "Glob", or "Grep"
- Extract `file_path` or `path` or `pattern` from `input` object
- Map file extensions to language names using a lookup table
- Count unique files (basename only)
- Classify task types from user prompt keywords using constants from `constants.ts`
- Compute error rate from all `toolResults`

Add to `src/lib/analyzers/constants.ts`:
```typescript
export const FILE_TOOL_NAMES = ["Read", "Edit", "Write", "Glob", "Grep"]

export const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "TypeScript", ".tsx": "TypeScript", ".js": "JavaScript", ".jsx": "JavaScript",
  ".py": "Python", ".rb": "Ruby", ".rs": "Rust", ".go": "Go", ".java": "Java",
  ".kt": "Kotlin", ".swift": "Swift", ".cs": "C#", ".cpp": "C++", ".c": "C",
  ".php": "PHP", ".html": "HTML", ".css": "CSS", ".scss": "SCSS",
  ".json": "JSON", ".yaml": "YAML", ".yml": "YAML", ".md": "Markdown",
  ".sql": "SQL", ".sh": "Shell", ".bash": "Shell", ".zsh": "Shell",
  ".vue": "Vue", ".svelte": "Svelte", ".dart": "Dart", ".ex": "Elixir",
}

export const TASK_TYPE_KEYWORDS: Record<string, string[]> = {
  "Debugging": ["debug", "fix", "bug", "error", "issue", "broken", "crash", "fail", "exception"],
  "Building": ["create", "add", "build", "implement", "new", "feature", "scaffold", "generate"],
  "Refactoring": ["refactor", "clean", "reorganize", "restructure", "rename", "move", "extract", "simplify"],
  "Testing": ["test", "spec", "assert", "expect", "mock", "coverage", "jest", "vitest"],
}
```

- [ ] **Step 5: Implement cost-estimate.ts**

Create `src/lib/analyzers/cost-estimate.ts`. Key logic:
- Hardcoded `PRICING` table (from spec)
- Iterate all messages with `tokenUsage` and `model`
- Group by model, sum input/output tokens
- Calculate cost per model: `(inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output`
- Set `usedFallbackPricing = true` if any model used `_default` pricing
- Compute `tokenDistribution` totals

- [ ] **Step 6: Run tests**

Run: `npm run test -- src/lib/analyzers/__tests__/code-impact.test.ts src/lib/analyzers/__tests__/cost-estimate.test.ts`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/analyzers/code-impact.ts src/lib/analyzers/cost-estimate.ts src/lib/analyzers/__tests__/ src/lib/analyzers/constants.ts
git commit -m "feat: add code impact and cost estimate analyzers"
```

---

### Task 4: Wire New Analyzers into Pipeline

**Files:**
- Modify: `src/lib/analyzers/index.ts`

- [ ] **Step 1: Update analyzeTraces to include new analyzers**

```typescript
import { TraceData, AnalysisResult } from "@/lib/types"
import { computeRawStats } from "./raw-stats"
import { computeVibeScores } from "./vibe-scores"
import { computePromptPersonality } from "./prompt-personality"
import { computeAITreatment } from "./ai-treatment"
import { computeSessionDetails } from "./session-details"
import { computeCodeImpact } from "./code-impact"
import { computeCostEstimate } from "./cost-estimate"

export function analyzeTraces(data: TraceData): AnalysisResult {
  return {
    rawStats: computeRawStats(data),
    vibeScores: computeVibeScores(data),
    promptPersonality: computePromptPersonality(data),
    aiTreatment: computeAITreatment(data),
    sessionDetails: computeSessionDetails(data),
    codeImpact: computeCodeImpact(data),
    costEstimate: computeCostEstimate(data),
  }
}
```

Add exports for new analyzers.

- [ ] **Step 2: Run build and all tests**

Run: `npm run build && npm run test`
Expected: Build passes, all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/analyzers/index.ts
git commit -m "feat: wire session-details, code-impact, cost-estimate into analysis pipeline"
```

---

### Task 5: Move Scroll Story to /wrapped/story

**Files:**
- Create: `src/app/wrapped/story/page.tsx`
- Modify: `src/app/wrapped/page.tsx` (will be replaced in Task 7)

- [ ] **Step 1: Copy current wrapped page to story route**

Copy the entire contents of `src/app/wrapped/page.tsx` to `src/app/wrapped/story/page.tsx`.

- [ ] **Step 2: Add "Back to Dashboard" link to the story page**

At the top of the story page (before the first ScrollSection), add a persistent back link:

```tsx
<Link
  href="/wrapped"
  className="fixed top-6 left-6 z-50 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/60 backdrop-blur-sm transition-colors hover:text-white"
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
  Dashboard
</Link>
```

- [ ] **Step 3: Update summary page links**

In `src/app/wrapped/summary/page.tsx`, update the "View Full Report" link to point to `/wrapped` (dashboard) instead of `/wrapped`.
Update "Start Over" to still go to `/upload`.
No functional change needed if links already point to `/wrapped`.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Both `/wrapped` and `/wrapped/story` routes compile.

- [ ] **Step 5: Commit**

```bash
git add src/app/wrapped/story/page.tsx
git commit -m "feat: move scroll story to /wrapped/story with back-to-dashboard link"
```

---

### Task 6: Build Dashboard Tile Components

**Files:**
- Create: `src/components/dashboard/tile.tsx`
- Create: `src/components/dashboard/stat-strip.tsx`
- Create: `src/components/dashboard/vibe-tile.tsx`
- Create: `src/components/dashboard/cost-tile.tsx`
- Create: `src/components/dashboard/treatment-tile.tsx`
- Create: `src/components/dashboard/time-tile.tsx`
- Create: `src/components/dashboard/tools-tile.tsx`
- Create: `src/components/dashboard/personality-tile.tsx`
- Create: `src/components/dashboard/projects-tile.tsx`
- Create: `src/components/dashboard/code-impact-tile.tsx`
- Create: `src/components/dashboard/session-timeline.tsx`

All components are "use client", receive typed props from `AnalysisResult` sub-objects, and render in the dark theme.

- [ ] **Step 1: Create base tile wrapper**

`src/components/dashboard/tile.tsx` — a reusable card container:
```tsx
"use client"
import { cn } from "@/lib/utils"

interface TileProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function Tile({ title, children, className }: TileProps) {
  return (
    <div className={cn("rounded-xl border border-white/[0.06] bg-white/[0.02] p-5", className)}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">{title}</h2>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create stat-strip.tsx**

Horizontal row of 5 big stats (Total Sessions, Messages, Tokens, Active Days, Date Range). Uses NumberTicker for animated counts. Responsive: wraps to 2x3 on mobile.

- [ ] **Step 3: Create vibe-tile.tsx**

Shows overall vibe score ring (AnimatedCircularProgressBar), archetype label, and "Play Your Wrapped" ShimmerButton linking to `/wrapped/story`. Tall tile.

- [ ] **Step 4: Create cost-tile.tsx**

Token distribution as stacked horizontal bar. Cost estimate in USD. Per-model breakdown list. Shows "(approximate)" if `usedFallbackPricing`. Shows "Token data unavailable" if totalCost is 0 and no token data.

- [ ] **Step 5: Create treatment-tile.tsx**

Compact version of AI treatment: overall score, assassination risk label, 4 mini horizontal bars for sub-scores.

- [ ] **Step 6: Create time-tile.tsx**

Hour-of-day bar chart (24 bars, purple gradient intensity). Day-of-week dots below. Coding time label displayed prominently.

- [ ] **Step 7: Create tools-tile.tsx**

Top 10 tools as horizontal bars with counts. Total tool calls number. Error rate percentage from `codeImpact.errorRate`. Shows "No tool calls recorded" if empty.

- [ ] **Step 8: Create personality-tile.tsx**

Prompt length label, question/command split bar, top 5 words as tags, context provider ratio, mind change count.

- [ ] **Step 9: Create projects-tile.tsx**

Top projects ranked with session counts. Top git branches. Hides branches section if none exist.

- [ ] **Step 10: Create code-impact-tile.tsx**

Languages as colored tags with file counts. Unique files touched. Task type breakdown as small bars. Shows "No file operations detected" if empty.

- [ ] **Step 11: Create session-timeline.tsx**

Horizontal bar chart showing sessions per day. Each bar height proportional to session count. Click anywhere links to `?tab=sessions`. Shows single bar if only one day of data.

- [ ] **Step 12: Verify build**

Run: `npm run build`
Expected: All components compile (not yet rendered in a page).

- [ ] **Step 13: Commit**

```bash
git add src/components/dashboard/
git commit -m "feat: add all dashboard tile components"
```

---

### Task 7: Build Session Table Component

**Files:**
- Create: `src/components/dashboard/session-table.tsx`

- [ ] **Step 1: Create session-table.tsx**

A client component that receives `SessionDetail[]` and renders:
- Filter bar: project dropdown, branch dropdown, search input (debounced 300ms)
- Sortable table headers (Date, Project, Branch, Duration, Messages, Tokens, Tools, Errors)
- Paginated rows (50 per page, "Show more" button)
- Expandable rows showing user prompts preview (max-h-60 with overflow-y-auto)
- Click row to toggle expansion (multiple can be open)
- Empty state: "No sessions found"
- Sort state and filter state managed with `useState`
- Search uses `String.includes()` on user prompts, highlights with `<mark>`
- All content rendered via React (no innerHTML)
- Accessible: `aria-sort` on headers, `aria-expanded` on rows

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/session-table.tsx
git commit -m "feat: add sortable, filterable, paginated sessions table"
```

---

### Task 8: Build Dashboard Page

**Files:**
- Rewrite: `src/app/wrapped/page.tsx`

- [ ] **Step 1: Rewrite wrapped/page.tsx as dashboard**

Replace the scroll story with the dashboard. Key structure:

```tsx
"use client"

import { useSearchParams } from "next/navigation"
import { useWrapped } from "@/lib/store/wrapped-store"
// ... import all tile components, Tabs from shadcn

export default function DashboardPage() {
  const { state } = useWrapped()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") ?? "overview"
  const result = state.analysisResult
  if (!result) return null

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 md:px-8">
      {/* Tab switcher */}
      {/* If overview: bento grid with all tiles */}
      {/* If sessions: session table */}
    </main>
  )
}
```

Overview tab layout uses CSS grid:
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for rows 2-3
- `grid-cols-1 lg:grid-cols-2` for row 4
- Full width for rows 1 and 5

Tab switching via `router.push` with `?tab=` query param to support browser back/forward.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `/wrapped` route compiles as dashboard.

- [ ] **Step 3: Verify all routes exist**

Run: `npm run build` and check output shows:
```
/wrapped
/wrapped/story
/wrapped/summary
```

- [ ] **Step 4: Commit**

```bash
git add src/app/wrapped/page.tsx
git commit -m "feat: rewrite /wrapped as bento-grid dashboard with overview and sessions tabs"
```

---

### Task 9: Update Docs and Polish

**Files:**
- Modify: `docs/changelog.md`
- Modify: `docs/project_status.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update changelog.md**

Add under `[Unreleased]`:
```markdown
### Added
- **Dashboard view**: Bento-grid dashboard at `/wrapped` with Overview and Sessions tabs
- **Session details analyzer**: Per-session aggregates, timeline, user prompt previews
- **Code impact analyzer**: Language detection, files touched, task type classification, error rate
- **Cost estimator**: Token cost calculation with model-specific pricing and fallback rates
- **Sessions table**: Sortable, filterable, paginated table with expandable row previews
- **Dashboard tiles**: 11 data tiles covering stats, vibe, cost, tools, time patterns, personality, projects, code impact, AI treatment, and session timeline

### Changed
- Scroll story moved from `/wrapped` to `/wrapped/story`
- `/wrapped` is now the dashboard (primary post-upload landing)
- Summary page links back to dashboard instead of story
```

- [ ] **Step 2: Update project_status.md**

Check off "Full personality insights + archetype system". Add dashboard milestone as complete.

- [ ] **Step 3: Update CLAUDE.md**

Update the Architecture section to mention the dashboard route and 7 analyzer modules (was 4).

- [ ] **Step 4: Run final verification**

```bash
npm run build && npm run test
```

Expected: Build passes, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add docs/ CLAUDE.md
git commit -m "docs: update changelog, project status, and architecture for dashboard"
```

---

### Task 10: End-to-End Verification

- [ ] **Step 1: Start dev server and test full flow**

Run: `npm run dev`

1. Go to localhost:3000 → landing page
2. Click "Upload Your Traces" → upload page
3. Upload JSONL files (run `open ~/.claude/projects` in terminal, drag files)
4. Verify redirect to `/wrapped` (dashboard, not story)
5. Verify all tiles render with data (no NaN, no crashes)
6. Click "Play Your Wrapped" → `/wrapped/story` with scroll experience
7. Verify "Dashboard" back link in top-left of story
8. Navigate to summary → verify download works
9. Switch to Sessions tab → verify table renders, sort, filter, expand
10. Test mobile viewport (Chrome DevTools) → verify single column layout

- [ ] **Step 2: Test empty states**

Upload a minimal trace file (1 session, 1 message, no tool calls). Verify:
- Tools tile shows "No tool calls recorded"
- Code Impact shows "No file operations detected"
- Cost tile handles gracefully
- Sessions table shows 1 row
