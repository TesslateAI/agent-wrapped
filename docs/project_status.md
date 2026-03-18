# Project Status

> Last updated: 2026-03-18

## Current Phase: Phase 2 — Expand (in progress)

### Phase 1 Scope (Complete)
- [x] Project scaffolding (Next.js + Tailwind + Framer Motion + TypeScript)
- [x] Claude Code trace parser
- [x] Raw stats analyzer
- [x] Vibe coder scores (simplified heuristics)
- [x] Prompt personality analyzer
- [x] AI treatment score (politeness, patience, gratitude, assassination list risk)
- [x] Animated wrapped report (dark theme, cinematic scroll experience)
- [x] Share/download summary card
- [x] Landing page with upload flow
- [x] Dashboard view (bento grid + sessions table)
- [x] Session details analyzer
- [x] Code impact analyzer (languages, files, task types)
- [x] Cost estimator (token pricing)
- [x] Productivity stats analyzer (cost/session, success rate, prompt-to-fix, tool efficiency)
- [x] Engagement stats analyzer (streaks, peak day, self-sufficiency trend, multi-tasking)
- [x] Achievements system (hours saved, percentile, 10 unlockable badges)
- [x] Session trace modal (full message viewer with filtering and pagination)
- [x] Share menu (X, LinkedIn, Reddit, clipboard, summary card)
- [x] Date range filter for sessions table

### Phase 2 — Expand
- [x] Full personality insights + archetype system
- [x] Scoring methodology documentation (`docs/scoring-methodology.md`)
- [x] Updated pricing table with 20+ Claude model variants (March 2026 rates)
- [x] Calibrated usage percentile thresholds against real Anthropic/Faros AI data
- [x] Project field fallback to cwd for sessions missing project metadata
- [x] Profanity detection upgraded to `better-profane-words` (2,700+ words, intensity-weighted quadratic penalties)
- [x] AI Treatment keyword lists significantly expanded (polite: 8→32, gratitude: 12→42, frustration: 10→70+, new demanding phrases + encouragement lists)
- [x] Personality profiles: 50 roasts + 50 compliments per archetype (800 total), randomly selected per page load
- [x] Personality modal with full archetype profile (roast, compliment, strengths, weaknesses, quirks, improvements, score breakdown)
- [x] Frameworks detection in Code Impact tile (40+ frameworks across 6 categories)
- [x] Info modals on 5 dashboard tiles (Vibe, Cost, Treatment, Personality, Achievements) via React portal
- [x] Clickable expand/collapse for all "+X more" truncated lists
- [x] Time patterns switched to local timezone (getHours instead of getUTCHours)
- [ ] Cursor trace parser
- [ ] Aider trace parser
- [ ] Continue trace parser
- [ ] OpenClaw trace parser
- [ ] Multi-tool comparison view
- [ ] Richer animations and transitions

### Phase 3 — Polish (not started)
- [ ] Optional LLM-powered insights (user-provided API key)
- [ ] Community gallery of shared wraps
- [ ] Historical comparison (wrap vs. wrap over time)
- [ ] Browser extension to auto-export traces

## Milestones

| Milestone | Status | Target |
|-----------|--------|--------|
| Repo setup + spec | Complete | — |
| Scaffolding + dev environment | Complete | — |
| Core parsing + analysis engine | Complete | — |
| Wrapped UI + animations | Complete | — |
| Share card + export | Complete | — |
| Dashboard + expanded analytics | Complete | — |
| Phase 1 launch | Ready for Testing | — |

## Known Blockers

_None currently._

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-18 | All processing client-side | Privacy-first — no trace data leaves the browser |
| 2026-03-18 | AI treatment score in Phase 1 | Core to the fun/shareable aspect of the product |
| 2026-03-18 | Keyword matching for AI treatment (no LLM) | Must work without API keys, keeps it fast and private |
| 2026-03-18 | UTC timestamps for time pattern analysis | Original decision: ensures consistent results regardless of user timezone during analysis |
| 2026-03-18 | Switched time patterns to local timezone (getHours) | UTC hours produced misleading peak-hour labels for users not in UTC; local time is more meaningful and matches user expectation |
| 2026-03-18 | `better-profane-words` for profanity detection | 2,700+ word coverage with intensity metadata for comprehensive detection |
| 2026-03-18 | Ratio-based frustration scoring | Absolute count penalties floored frustration to 0 with large trace uploads, masking profanity. All signals now use ratios (profanity weight: 30, frustration words: 20, terse: 20, caps: 15, demanding: 15) so scores scale proportionally with trace size |
| 2026-03-18 | Per-session boundary fix for AI treatment | Flatmapping sessions caused cross-session false positives (new session openers counted as terse corrections). Terse corrections, gratitude, and patience chains now computed per-session |
| 2026-03-18 | Frustration bar displayed inverted | "Frustration Ctrl: 0" looked like "no frustration detected" to users. Renamed to "Frustration" and inverted display so profanity fills the bar instead of emptying it |
| 2026-03-18 | Personality profiles randomly selected per page load | 50 roasts + 50 compliments per archetype gives replayability and avoids deterministic results feeling stale |
| 2026-03-18 | Personality modal rendered via React portal | Avoids z-index and overflow clipping issues when mounting modal from within bento grid tiles |
| 2026-03-18 | Hero copy removes year/time references | Users can upload traces at any time — tying the headline to "your year" felt misleading and limited |
| 2026-03-18 | React Context for state management | Sufficient for MVP single-page flow, no external lib needed |
| 2026-03-18 | shadcn + Magic UI component library | Rich animation ecosystem (number-ticker, aurora-text, confetti) for Wrapped-style experience |
| 2026-03-18 | Dashboard-first, story as "Play" button | Dashboard serves productivity insights; story serves entertainment/sharing. Users land on dashboard after upload. |
| 2026-03-18 | Hardcoded pricing with fallback rate | Cost estimates use public API pricing with conservative fallback for unknown models |
| 2026-03-18 | Session table pagination (50 rows) | Avoids DOM performance issues with large trace files without adding virtual scrolling dependency |
| 2026-03-18 | Pricing calibrated to March 2026 Anthropic rates | Opus 4.6/4.5 dropped to $5/$25, Haiku 4.5 adjusted to $1/$5. Source: https://docs.anthropic.com/en/docs/about-claude/models |
| 2026-03-18 | Usage percentile scaled for heavy agent usage | Recalibrated: <100 msgs/day = Top 10%, 20K+ msgs/day = Top 99%. Previous scale (1K = 99th) was too low for sub-agent workflows |
