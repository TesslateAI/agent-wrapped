# Extended Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 15 new analytics stats across 3 new analyzer modules (productivity, engagement, achievements) with corresponding dashboard tiles.

**Architecture:** Three new analyzers compute stats from existing `TraceData` and `SessionDetail[]`. Each produces a typed result added to `AnalysisResult`. Three new dashboard tiles display the results. The existing cost-estimate analyzer is extended with per-session costs.

**Tech Stack:** TypeScript analyzers, React dashboard tiles, NumberTicker/progress bars for display

---

## New Stats by Analyzer

### Productivity Analyzer (`productivity-stats.ts`)
1. **Cost per session** — avg cost, most expensive session, cost trend by date
2. **Prompt-to-fix ratio** — avg back-and-forth messages per correction chain
3. **Success rate** — % of sessions where last user message is not a correction/error
4. **Avg response time gap** — median time between consecutive user prompts (seconds)
5. **Tool efficiency** — per-tool error rate, tools ranked by reliability
6. **Iteration speed** — avg session duration in minutes

### Engagement Analyzer (`engagement-stats.ts`)
7. **Session streaks** — longest consecutive-day streak, current streak
8. **Peak productivity day** — single day with most sessions/messages
9. **Conversation depth** — avg messages before topic switch
10. **Self-sufficiency trend** — are sessions getting shorter over time? (slope)
11. **Context window pressure** — sessions where tokens exceeded a high threshold
12. **Multi-tasking score** — avg unique projects per active day

### Achievements Analyzer (`achievements.ts`)
13. **Hours saved estimate** — based on tool call volume × estimated manual time
14. **Ranking percentile** — percentile based on usage intensity (self-referential, no external data)
15. **Achievement badges** — unlockable badges based on thresholds

---

## File Manifest

```
src/lib/types/analysis.ts           — Add ProductivityStats, EngagementStats, Achievements types
src/lib/analyzers/productivity-stats.ts  — NEW: stats 1-6
src/lib/analyzers/engagement-stats.ts    — NEW: stats 7-12
src/lib/analyzers/achievements.ts        — NEW: stats 13-15
src/lib/analyzers/index.ts               — Wire 3 new analyzers
src/lib/analyzers/__tests__/productivity-stats.test.ts
src/lib/analyzers/__tests__/engagement-stats.test.ts
src/lib/analyzers/__tests__/achievements.test.ts
src/components/dashboard/productivity-tile.tsx  — NEW: dashboard tile
src/components/dashboard/engagement-tile.tsx    — NEW: dashboard tile
src/components/dashboard/achievements-tile.tsx  — NEW: dashboard tile
src/app/wrapped/page.tsx                 — Add 3 new tiles to bento grid
```

---

### Task 1: Add New Types

**Files:**
- Modify: `src/lib/types/analysis.ts`

- [ ] **Step 1: Add ProductivityStats interface**

```typescript
export interface ProductivityStats {
  avgCostPerSession: number
  mostExpensiveSession: { id: string; project: string; cost: number } | null
  costTrend: Array<{ date: string; cost: number }>
  promptToFixRatio: number // avg back-and-forth per correction chain
  successRate: number // 0-1
  avgResponseGapSeconds: number // median time between user prompts
  toolEfficiency: Array<{ name: string; totalCalls: number; errors: number; errorRate: number }>
  avgIterationSpeedMinutes: number
}
```

- [ ] **Step 2: Add EngagementStats interface**

```typescript
export interface EngagementStats {
  longestStreak: number // consecutive days
  currentStreak: number
  peakDay: { date: string; sessions: number; messages: number }
  avgConversationDepth: number // avg messages before topic switch
  selfSufficiencyTrend: "improving" | "stable" | "declining" // based on session duration slope
  selfSufficiencySlope: number // negative = improving (shorter sessions)
  highTokenSessions: number // sessions exceeding 100K tokens
  totalSessions: number // for percentage calc
  multiTaskingScore: number // avg unique projects per active day
}
```

- [ ] **Step 3: Add Achievements interface**

```typescript
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string // emoji
  unlocked: boolean
}

export interface Achievements {
  hoursSaved: number
  hoursSavedBreakdown: { toolCalls: number; estimatedManualMinutes: number }
  usagePercentile: number // 0-100, self-referential intensity score
  badges: Achievement[]
}
```

- [ ] **Step 4: Update AnalysisResult**

```typescript
export interface AnalysisResult {
  rawStats: RawStats
  vibeScores: VibeScores
  promptPersonality: PromptPersonality
  aiTreatment: AITreatmentScore
  sessionDetails: SessionAnalysis
  codeImpact: CodeImpact
  costEstimate: CostEstimate
  productivityStats: ProductivityStats   // NEW
  engagementStats: EngagementStats       // NEW
  achievements: Achievements             // NEW
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/types/analysis.ts
git commit -m "feat: add ProductivityStats, EngagementStats, Achievements types"
```

---

### Task 2: Productivity Stats Analyzer

**Files:**
- Create: `src/lib/analyzers/productivity-stats.ts`
- Create: `src/lib/analyzers/__tests__/productivity-stats.test.ts`

- [ ] **Step 1: Write tests**

Tests covering:
- `avgCostPerSession`: total cost / session count
- `mostExpensiveSession`: session with highest token count × pricing
- `costTrend`: costs grouped by date, sorted chronologically
- `promptToFixRatio`: detect correction chains (consecutive user messages with short/frustrated content after an assistant response), compute avg chain length
- `successRate`: % of sessions where the last user message does NOT contain correction keywords ("no", "wrong", "fix", "that's not", "try again")
- `avgResponseGapSeconds`: median gap between consecutive user message timestamps within sessions
- `toolEfficiency`: per-tool error rates from all toolResults
- `avgIterationSpeedMinutes`: mean session duration
- Empty data edge cases

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/analyzers/__tests__/productivity-stats.test.ts`

- [ ] **Step 3: Implement productivity-stats.ts**

Key logic:
- Import `PRICING` lookup from `cost-estimate.ts` (export it first) or duplicate the pricing table
- `costTrend`: for each session, compute its cost from token usage, group by date
- `promptToFixRatio`: scan for patterns where user sends multiple messages in a row (correction chain). A chain starts when a user message follows an assistant message and contains correction indicators. Chain length = consecutive user corrections. Ratio = total chain messages / total chains.
- `successRate`: look at last user message in each session, check if it contains positive words ("thanks", "perfect", "works", "great") vs negative ("wrong", "no", "fix", "broken"). Sessions ending positively or neutrally = success.
- `avgResponseGapSeconds`: collect all gaps between consecutive user messages within each session, take the median
- `toolEfficiency`: iterate all messages, group toolResults by their corresponding toolCall name, compute per-tool error rate
- `avgIterationSpeedMinutes`: mean of all session durations

- [ ] **Step 4: Run tests**

Run: `npm run test -- src/lib/analyzers/__tests__/productivity-stats.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/analyzers/productivity-stats.ts src/lib/analyzers/__tests__/productivity-stats.test.ts
git commit -m "feat: add productivity stats analyzer"
```

---

### Task 3: Engagement Stats Analyzer

**Files:**
- Create: `src/lib/analyzers/engagement-stats.ts`
- Create: `src/lib/analyzers/__tests__/engagement-stats.test.ts`

- [ ] **Step 1: Write tests**

Tests covering:
- `longestStreak`: consecutive calendar days with at least 1 session (3 days = streak of 3)
- `currentStreak`: streak ending on the most recent active day (0 if last active day was not yesterday/today)
- `peakDay`: day with the most sessions, tie-break by messages
- `avgConversationDepth`: avg number of user messages per session (proxy for depth)
- `selfSufficiencyTrend`: compute linear regression slope of session durations over time. Negative slope = "improving", near-zero = "stable", positive = "declining"
- `highTokenSessions`: count sessions where tokenCount > 100,000
- `multiTaskingScore`: for each active day, count unique projects used, average across days
- Empty data, single session, all-same-day edge cases

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement engagement-stats.ts**

Key logic:
- Streaks: sort unique active dates, walk forward counting consecutive days (diff === 1 day). Track longest and current (ending at max date).
- `peakDay`: group sessions by date, find max by session count then message count
- `selfSufficiencyTrend`: sessions sorted by startTime, extract (index, durationMinutes) pairs, compute simple linear regression slope. Classify: |slope| < 0.5 = "stable", slope < -0.5 = "improving", slope > 0.5 = "declining"
- `highTokenSessions`: count from sessionDetails where tokenCount > 100_000
- `multiTaskingScore`: group sessions by date, count unique projects per date, average

- [ ] **Step 4: Run tests**

- [ ] **Step 5: Commit**

```bash
git add src/lib/analyzers/engagement-stats.ts src/lib/analyzers/__tests__/engagement-stats.test.ts
git commit -m "feat: add engagement stats analyzer"
```

---

### Task 4: Achievements Analyzer

**Files:**
- Create: `src/lib/analyzers/achievements.ts`
- Create: `src/lib/analyzers/__tests__/achievements.test.ts`

- [ ] **Step 1: Write tests**

Tests covering:
- `hoursSaved`: (total tool calls × 2 minutes estimated manual time) / 60 = hours
- `usagePercentile`: score based on messages per active day, mapped to a percentile curve
- Badges unlock correctly at thresholds:
  - "1K Club" — 1000+ total messages
  - "10K Club" — 10000+ total messages
  - "Night Owl" — 50+ messages between midnight-5am
  - "Early Bird" — 50+ messages between 5am-8am
  - "Polyglot" — 5+ languages detected
  - "Streak Master" — 7+ day streak
  - "Marathon Runner" — session lasting 120+ minutes
  - "Tool Wielder" — 500+ tool calls
  - "Bug Squasher" — 100+ debugging-type prompts
  - "Speed Demon" — avg response gap < 30 seconds
- Edge case: no data = no badges unlocked, hoursSaved=0, percentile=0

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement achievements.ts**

Key logic:
- `hoursSaved`: `(totalToolCalls * 2) / 60` — each tool call saves ~2 minutes of manual work
- `usagePercentile`: compute an intensity score = `totalMessages / activeDays`. Map to percentile: 0-5 → 10th, 5-15 → 30th, 15-30 → 50th, 30-60 → 70th, 60-100 → 85th, 100+ → 95th. This is self-referential (no external data), just gives a fun number.
- `badges`: define all badges as an array with `check(data)` functions. Each returns `{ ...badge, unlocked: check(data) }`.

The function takes `TraceData`, `RawStats`, `CodeImpact`, `EngagementStats`, and `CodingTimePattern` as inputs so it can reference computed stats.

```typescript
export function computeAchievements(
  data: TraceData,
  rawStats: RawStats,
  codeImpact: CodeImpact,
  engagementStats: EngagementStats,
): Achievements
```

- [ ] **Step 4: Run tests**

- [ ] **Step 5: Commit**

```bash
git add src/lib/analyzers/achievements.ts src/lib/analyzers/__tests__/achievements.test.ts
git commit -m "feat: add achievements analyzer with badges and hours saved"
```

---

### Task 5: Wire Analyzers into Pipeline

**Files:**
- Modify: `src/lib/analyzers/index.ts`

- [ ] **Step 1: Update analyzeTraces**

```typescript
import { computeProductivityStats } from "./productivity-stats"
import { computeEngagementStats } from "./engagement-stats"
import { computeAchievements } from "./achievements"

export function analyzeTraces(data: TraceData): AnalysisResult {
  const rawStats = computeRawStats(data)
  const vibeScores = computeVibeScores(data)
  const promptPersonality = computePromptPersonality(data)
  const aiTreatment = computeAITreatment(data)
  const sessionDetails = computeSessionDetails(data)
  const codeImpact = computeCodeImpact(data)
  const costEstimate = computeCostEstimate(data)
  const engagementStats = computeEngagementStats(data, sessionDetails)
  const productivityStats = computeProductivityStats(data, sessionDetails, costEstimate)
  const achievements = computeAchievements(data, rawStats, codeImpact, engagementStats)

  return {
    rawStats, vibeScores, promptPersonality, aiTreatment,
    sessionDetails, codeImpact, costEstimate,
    productivityStats, engagementStats, achievements,
  }
}
```

Note: some analyzers depend on others' output. `productivityStats` needs `sessionDetails` and `costEstimate`. `engagementStats` needs `sessionDetails`. `achievements` needs `rawStats`, `codeImpact`, and `engagementStats`.

- [ ] **Step 2: Run build and all tests**

Run: `npm run build && npm run test`

- [ ] **Step 3: Commit**

```bash
git add src/lib/analyzers/index.ts
git commit -m "feat: wire productivity, engagement, achievements into analysis pipeline"
```

---

### Task 6: Dashboard Tiles

**Files:**
- Create: `src/components/dashboard/productivity-tile.tsx`
- Create: `src/components/dashboard/engagement-tile.tsx`
- Create: `src/components/dashboard/achievements-tile.tsx`

- [ ] **Step 1: Create productivity-tile.tsx**

Props: `productivityStats: ProductivityStats`

Display:
- Avg cost per session: `$X.XX`
- Most expensive session: project name + cost
- Success rate: as percentage with color (green >80%, yellow 50-80%, red <50%)
- Prompt-to-fix ratio: "X.X prompts per fix"
- Avg response gap: formatted as "Xs" or "X min"
- Iteration speed: "X min avg session"
- Tool efficiency: top 3 most error-prone tools with error rate %
- Cost trend: small sparkline or mini bar chart showing cost by date

Use `Tile` wrapper. Handle empty states (no cost data, no sessions).

- [ ] **Step 2: Create engagement-tile.tsx**

Props: `engagementStats: EngagementStats`

Display:
- Streak: "X days" current streak, "X days" longest streak (with fire emoji for active streak)
- Peak day: date + session count + message count
- Self-sufficiency trend: arrow up/down/flat with label ("improving"/"stable"/"declining") and color
- Conversation depth: "X messages avg"
- High-token sessions: "X sessions" with warning color if high %
- Multi-tasking score: "X.X projects/day"

- [ ] **Step 3: Create achievements-tile.tsx**

Props: `achievements: Achievements`

Display:
- Hours saved: large number with "hours of manual work saved" label
- Usage percentile: "Top X%" with progress ring or badge
- Badges grid: emoji + name for each badge. Unlocked = bright, locked = dim/grayed with lock icon. Wrap in a flex grid.

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/
git commit -m "feat: add productivity, engagement, and achievements dashboard tiles"
```

---

### Task 7: Add Tiles to Dashboard Page

**Files:**
- Modify: `src/app/wrapped/page.tsx`

- [ ] **Step 1: Import new tiles and add to OverviewGrid**

Add a new Row 6 (after Session Timeline) with the 3 new tiles:

```tsx
{/* Row 6: Productivity | Engagement | Achievements */}
<BlurFade delay={0.55} inView>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <ProductivityTile productivityStats={result.productivityStats} />
    <EngagementTile engagementStats={result.engagementStats} />
    <AchievementsTile achievements={result.achievements} />
  </div>
</BlurFade>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Run all tests**

Run: `npm run test`

- [ ] **Step 4: Commit**

```bash
git add src/app/wrapped/page.tsx
git commit -m "feat: add productivity, engagement, achievements tiles to dashboard"
```

---

### Task 8: Update Docs

**Files:**
- Modify: `docs/changelog.md`
- Modify: `docs/project_status.md`

- [ ] **Step 1: Update changelog**

Add under `[Unreleased]` → Added:
```
- **Productivity stats**: Cost per session, success rate, prompt-to-fix ratio, response gap, tool efficiency, iteration speed
- **Engagement stats**: Session streaks, peak day, conversation depth, self-sufficiency trend, context window pressure, multi-tasking score
- **Achievements**: Hours saved estimate, usage percentile, 10 unlockable badges
```

- [ ] **Step 2: Update project status**

Add the 3 new analyzers to Phase 1 scope as completed items.

- [ ] **Step 3: Run final verification**

Run: `npm run build && npm run test`

- [ ] **Step 4: Commit**

```bash
git add docs/
git commit -m "docs: add extended stats to changelog and project status"
```
