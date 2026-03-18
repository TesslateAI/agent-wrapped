# Dashboard & Expanded Analytics — Design Spec

## Context

Agent Wrapped Phase 1 shipped with a scroll-based "wrapped story" experience. Users want two modes: the cinematic story for entertainment/sharing, and a data-dense dashboard for productivity insights. This spec adds a bento-grid dashboard as the primary post-upload view, a sessions deep-dive tab, and new analysis modules (cost tracking, code impact, session details).

## Route Structure

| Route | Purpose |
|-------|---------|
| `/wrapped` | Dashboard — bento grid (Overview tab) + Sessions tab. Primary post-upload landing. |
| `/wrapped/story` | Scroll story — the existing 9-section cinematic wrapped experience, moved here. |
| `/wrapped/summary` | Shareable card — unchanged. |

After upload: parse → analyze → redirect to `/wrapped` (dashboard).

"Play Your Wrapped" button on dashboard launches `/wrapped/story`.

## Dashboard: Overview Tab (Bento Grid)

Dark theme, dense data tiles. All stats from analysis result displayed at a glance.

### Row 1 — Hero Stats Strip
Compact horizontal row of big numbers:
- Total Sessions
- Total Messages
- Total Tokens (formatted K/M)
- Active Days
- Date Range (earliest–latest)

### Row 2 — Three Medium Tiles

**Vibe Card (tall, left)**
- Overall vibe score as AnimatedCircularProgressBar
- Archetype label (e.g. "Chaotic Genius")
- "Play Your Wrapped" ShimmerButton — launches `/wrapped/story`

**Cost & Tokens (wide, center)**
- Token breakdown: input / output / cache creation / cache read
- Estimated cost (USD) based on model-specific pricing
- Horizontal stacked bar showing token distribution
- Per-model cost breakdown if multiple models used

**AI Treatment (right)**
- Overall treatment score (0-100)
- Assassination risk label
- 4 compact horizontal bars: Politeness, Patience, Gratitude, Frustration Control

### Row 3 — Three Medium Tiles

**Coding Patterns (left)**
- Hour-of-day bar chart (24 bars)
- Coding time label (Night Owl, Early Bird, etc.)
- Day-of-week distribution as small dots/bars

**Top Tools (center)**
- Top 10 tools as horizontal bar chart
- Total tool calls count
- Error rate percentage

**Prompt Personality (right)**
- Prompt length label (Terse / Concise / Detailed / Essay Writer)
- Question vs Command ratio as split bar
- Top 5 favorite words as tags
- Context provider ratio
- Mind change count

### Row 4 — Two Wide Tiles

**Projects & Branches (left)**
- Top projects ranked by session count
- Top git branches ranked by usage
- File count per project (if derivable)

**Code Impact (right)**
- Languages detected (from file extensions in tool calls)
- Unique files touched count
- Task type breakdown: debugging / building / refactoring / testing (keyword heuristics)
- Error rate in tool calls

### Row 5 — Session Timeline (full width)
- Activity sparkline or calendar heatmap showing sessions per day across the date range
- Links to Sessions tab for deep-dives

## Dashboard: Sessions Tab

Sortable, filterable table of all sessions.

### Table Columns
| Column | Source |
|--------|--------|
| Date/Time | `session.startTime` |
| Project | `session.project` |
| Branch | `session.gitBranch` |
| Duration | `endTime - startTime` in minutes |
| Messages | `session.messages.length` |
| Tokens | Sum of all `message.tokenUsage` |
| Tools | Count of all `toolCalls` |
| Errors | Count of `toolResults` where `isError === true` |

### Interactions
- **Click row to expand** — shows user prompts from that session as a scrollable preview
- **Sort** by any column (click header)
- **Filter** by project, date range, or branch (filter bar above table)
- **Search** across user prompt content

### Privacy
- Expanded session view only shows user prompts, not full trace content
- No raw assistant responses displayed (they may contain file contents)
- Content is sanitized/escaped before rendering (existing security policy)

## New Analyzers

### `src/lib/analyzers/session-details.ts`

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
  userPrompts: string[]  // for session preview (sanitized)
}

export interface SessionAnalysis {
  sessions: SessionDetail[]
  timeline: Array<{ date: string; sessionCount: number; messageCount: number }>
}

export function computeSessionDetails(data: TraceData): SessionAnalysis
```

Computes per-session aggregates from existing TraceData. Groups sessions by date for the timeline sparkline.

### `src/lib/analyzers/code-impact.ts`

```typescript
export interface CodeImpact {
  languagesDetected: Array<{ language: string; fileCount: number }>
  uniqueFilesTouched: number
  taskTypeBreakdown: Array<{ type: string; count: number }>
  errorRate: number  // 0-1, failed tool results / total tool results
  topFilePaths: Array<{ path: string; touchCount: number }>
}

export function computeCodeImpact(data: TraceData): CodeImpact
```

Extracts file paths from tool call inputs (Read, Edit, Write, Glob, Grep tool names). Detects languages from file extensions. Categorizes task types from user prompt keywords (debug/fix → "Debugging", create/add/build → "Building", refactor/clean → "Refactoring", test → "Testing").

### `src/lib/analyzers/cost-estimate.ts`

```typescript
export interface CostEstimate {
  totalCost: number  // USD
  breakdown: Array<{ model: string; inputTokens: number; outputTokens: number; cost: number }>
  tokenDistribution: { input: number; output: number; cacheCreation: number; cacheRead: number }
}

export function computeCostEstimate(data: TraceData): CostEstimate
```

Uses hardcoded pricing table for known Claude models. Calculates cost from token counts per model. If model is unknown, uses a default rate.

### Updated `src/lib/analyzers/index.ts`

```typescript
export interface AnalysisResult {
  rawStats: RawStats
  vibeScores: VibeScores
  promptPersonality: PromptPersonality
  aiTreatment: AITreatmentScore
  sessionDetails: SessionAnalysis    // NEW
  codeImpact: CodeImpact             // NEW
  costEstimate: CostEstimate         // NEW
}
```

## New Types

Add to `src/lib/types/analysis.ts`:
- `SessionDetail`, `SessionAnalysis`
- `CodeImpact`
- `CostEstimate`

## UI Components

### Dashboard Components (`src/components/dashboard/`)
- `bento-grid.tsx` — CSS grid layout for the dashboard tiles
- `stat-strip.tsx` — horizontal row of hero stat numbers
- `vibe-tile.tsx` — vibe score ring + label + "Play Your Wrapped" button
- `cost-tile.tsx` — token breakdown + cost estimate
- `treatment-tile.tsx` — compact AI treatment meters
- `time-tile.tsx` — hour/day distribution chart
- `tools-tile.tsx` — top tools bar chart
- `personality-tile.tsx` — prompt personality summary
- `projects-tile.tsx` — projects & branches ranking
- `code-impact-tile.tsx` — languages, files, task types
- `session-timeline.tsx` — activity sparkline/calendar
- `session-table.tsx` — sortable/filterable sessions table
- `dashboard-tabs.tsx` — Overview / Sessions tab switcher

### Reused Components
- `stat-card.tsx`, `score-ring.tsx`, `treatment-meter.tsx` from wrapped components
- NumberTicker, AnimatedCircularProgressBar, MagicCard from Magic UI
- Existing shadcn: Card, Badge, Tabs, Separator, Progress

## Page Changes

### `src/app/wrapped/page.tsx` (rewrite)
Currently the scroll story. Becomes the dashboard:
- Tab bar: Overview | Sessions
- Overview: bento grid with all tiles
- Sessions: session table component
- "Play Your Wrapped" button prominent in the vibe tile

### `src/app/wrapped/story/page.tsx` (new)
The existing scroll story content moves here. Same 9 sections, same animations. Back link to `/wrapped` (dashboard).

### `src/app/wrapped/layout.tsx` (update)
Guard remains (redirect to /upload if no data). Now wraps both dashboard and story routes.

## File Manifest

```
src/
  lib/
    types/
      analysis.ts                    # Add SessionDetail, SessionAnalysis, CodeImpact, CostEstimate
    analyzers/
      session-details.ts             # NEW — per-session aggregates + timeline
      code-impact.ts                 # NEW — languages, files, task types, error rate
      cost-estimate.ts               # NEW — token cost calculation
      index.ts                       # Update to include new analyzers
  components/
    dashboard/
      bento-grid.tsx                 # Grid layout container
      stat-strip.tsx                 # Hero stats row
      vibe-tile.tsx                  # Vibe score + "Play" CTA
      cost-tile.tsx                  # Token/cost breakdown
      treatment-tile.tsx             # AI treatment compact view
      time-tile.tsx                  # Coding time chart
      tools-tile.tsx                 # Top tools chart
      personality-tile.tsx           # Prompt personality summary
      projects-tile.tsx              # Projects & branches
      code-impact-tile.tsx           # Code impact stats
      session-timeline.tsx           # Activity over time
      session-table.tsx              # Sessions deep-dive table
      dashboard-tabs.tsx             # Tab switcher
  app/
    wrapped/
      page.tsx                       # REWRITE — dashboard (bento + sessions)
      story/
        page.tsx                     # NEW — scroll story moved here
      layout.tsx                     # UPDATE — wraps dashboard + story
      summary/
        page.tsx                     # Unchanged
```

## Empty & Edge States

Every tile must handle missing data gracefully. No tile should crash or show NaN/$0.00 misleadingly.

| Tile | Empty Condition | Behavior |
|------|----------------|----------|
| Cost & Tokens | No `tokenUsage` on any message | Show "Token data unavailable" with muted text. Hide cost estimate. |
| Top Tools | Zero tool calls | Show "No tool calls recorded" placeholder |
| Code Impact | Zero tool calls with file paths | Show "No file operations detected" |
| Projects & Branches | No `gitBranch` on any session | Show projects only, hide branches section |
| Session Timeline | Single day of data | Show a single bar, no sparkline |
| Sessions Table | Zero sessions | Show "No sessions found" with link back to upload |
| Expanded Session Row | Session has zero user prompts | Show "No user prompts in this session" |
| Any duration calc | Invalid/missing timestamps | Show "—" instead of NaN/negative |

## Performance

**Target**: Analyze up to 2,000 sessions / 50,000 messages without freezing the UI.

- **Sessions table**: Render max 50 rows at a time. Use simple pagination (not virtual scrolling) to avoid new dependencies. "Show more" button loads next 50.
- **Search**: Debounce input by 300ms. Plain string `includes()` matching — no regex, no `innerHTML` highlighting. Highlight matches with `<mark>` via React (safe).
- **Session prompts**: Truncate each stored prompt to 500 chars max in `SessionDetail.userPrompts`. Limit to first 20 prompts per session.
- **Analyzer passes**: All 7 analyzers run sequentially on the main thread for MVP. If analysis exceeds 3 seconds, show progress indicator. Web Workers deferred to Phase 3.

## Navigation

**Tab state**: Reflected via query param `?tab=sessions`. Default is overview. Browser back/forward navigates between tabs. Timeline "deep-dive" links set `?tab=sessions`.

**Story navigation**: `/wrapped/story` has a persistent "Back to Dashboard" link in the top-left corner (visible throughout scroll). Story always starts from the beginning.

**Summary navigation**: Summary page links back to `/wrapped` (dashboard), not the story.

**Route guards**: All `/wrapped/*` routes share the layout guard — redirect to `/upload` if no `analysisResult`.

## Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| `< 640px` (mobile) | Single column, all tiles stack vertically. Stats strip wraps to 2x3 grid. |
| `640-1024px` (tablet) | 2 columns. Row 2/3 tiles become 2-per-row. Row 4/5 full width. |
| `> 1024px` (desktop) | Full bento layout as specified (3 cols for rows 2-3, 2 cols for row 4). |

## Accessibility

- All chart bars/rings have `aria-label` with exact values (e.g. "Chaos Energy: 73 out of 100")
- Sessions table: sortable headers use `aria-sort`, rows use `aria-expanded` for expand/collapse
- All tiles have heading structure (`h2` for tile titles) for screen reader navigation
- `prefers-reduced-motion`: dashboard NumberTickers show final value immediately, no animation on progress bars
- Charts use labels alongside colors (not color-only encoding)

## Cost Estimator Pricing

Hardcoded pricing table with `lastUpdated` date in a comment. Default fallback rate: `$3.00 / 1M input, $15.00 / 1M output` (conservative mid-range estimate). Display note on cost tile: "Estimated based on public API pricing" in muted text. If all tokens used the fallback rate, show "(approximate)" next to the total.

```typescript
const PRICING: Record<string, { input: number; output: number }> = {
  // Prices per 1M tokens, last updated 2025-05
  "claude-opus-4-6":      { input: 15.00, output: 75.00 },
  "claude-sonnet-4-6":    { input: 3.00,  output: 15.00 },
  "claude-haiku-4-5":     { input: 0.80,  output: 4.00 },
  // Fallback for unknown models
  _default:                { input: 3.00,  output: 15.00 },
}
```

## Data Ownership

Dashboard tiles pull from existing analyzers where data already exists. New analyzers only compute genuinely new data.

| Data | Source | Used By |
|------|--------|---------|
| Top tools, tool count | `rawStats.topToolsUsed` | Tools tile |
| Top projects, branches | `rawStats.topProjects`, `rawStats.topGitBranches` | Projects tile |
| Time patterns | `rawStats.codingTimePatterns` | Time tile |
| Token totals | `rawStats.totalTokensUsed` | Stats strip |
| Error rate (global) | `codeImpact.errorRate` | Tools tile, Code Impact tile |
| Per-session aggregates | `sessionDetails.sessions` | Sessions table |
| Timeline | `sessionDetails.timeline` | Session timeline |
| Cost | `costEstimate` | Cost tile |
| Languages, files, tasks | `codeImpact` | Code Impact tile |

No duplication — each data point has one canonical source.

## Security

- Session search uses safe `String.includes()` — no regex, no `eval`, no `innerHTML`
- Search match highlighting uses React `<mark>` elements, not `dangerouslySetInnerHTML`
- File paths in `topFilePaths` are basename-only (strip directory path) to avoid leaking full paths in screenshots
- All rendered content goes through React's default escaping

## Docs Updates
- `docs/changelog.md` — add dashboard, new analyzers, route restructure
- `docs/project_status.md` — check off "Full personality insights + archetype system", add dashboard tasks
- `CLAUDE.md` — update architecture section with dashboard route, new analyzers

## Verification
1. `npm run build` — no errors
2. `npm run test` — all existing + new analyzer tests pass
3. Upload traces → lands on dashboard with all tiles populated
4. Click "Play Your Wrapped" → story plays at `/wrapped/story`
5. Sessions tab → table loads, rows expandable, sortable, filterable
6. Summary card → still accessible from both dashboard and story
7. Mobile responsive — bento grid collapses to single column
8. Empty states — upload a minimal trace (1 session, no tools) and verify no crashes/NaN
9. Cost tile — verify pricing displays with "(approximate)" note when fallback rate used
10. Accessibility — tab through sessions table with keyboard, verify aria attributes
