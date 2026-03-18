# Changelog

All notable changes to Agent Wrapped will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- **Profanity detection via `better-profane-words`**: Replaced hardcoded profanity list with the `better-profane-words` npm package (2,700+ words across 9 categories, intensity scale 1-5).
- **Expanded polite words list**: Grew from 8 to 32 phrases in the Politeness Tier keyword list.
- **Expanded gratitude words list**: Grew from 12 to 42 phrases in the Gratitude Index keyword list.
- **Expanded frustration words list**: Grew from 10 to 70+ entries covering mild frustration, profanity, abbreviations, insults, and aggressive phrases.
- **Demanding phrases list**: New 22-entry list (e.g. "just do it", "shut up and code", "skip the explanation") factored into Frustration Control scoring.
- **Encouragement words list**: New 27-entry list (e.g. "good thinking", "nice catch") that boosts Politeness Tier at 50% weight.
- **Personality profiles depth**: 50 unique roasts and 50 unique compliments per vibe archetype (400 roasts + 400 compliments = 800 total), randomly selected on each page load.
- **Personality modal**: Clicking the vibe tile opens a full personality profile card showing roast, compliment, top 3 strengths, top 3 weaknesses, habits/quirks, improvement suggestions, full vibe score breakdown, and archetype as "a.k.a." subtitle under the vibe label.
- **Frameworks detection in Code Impact**: The Code Impact tile now detects 40+ frameworks and libraries across 6 categories (Frontend, Backend, Database, DevOps, Testing, Other) from prompts and file paths.
- **Info modals on dashboard tiles**: Five tiles (Vibe, Cost, Treatment, Personality, Achievements) now show an ℹ icon that opens an explanation modal rendered via React portal.
- **Clickable expand/collapse for truncated lists**: All "+X more" truncated lists (frameworks, favorite words, tools, error-prone tools, projects, branches) are now clickable to expand or collapse.
- **Pricing table updated**: Full 20+ Claude model variant pricing table (Opus 4.6/4.5/4.1/4, Sonnet family, Haiku 4.5/3.5/3) with March 2026 rates sourced from Anthropic's official pricing page
- **Usage percentile calibrated**: Thresholds now based on real data from Anthropic docs ($6/day avg, $12/day 90th pctile) and Faros AI telemetry (10K+ devs), using messages/day directly
- **Project field fallback**: Parser now falls back to `cwd` when `project` field is missing from session metadata
- **Scoring methodology doc**: Comprehensive documentation of all metric calculations, formulas, keyword lists, thresholds, and dashboard tile mappings (`docs/scoring-methodology.md`)
- Project spec (`project_spec.md`) defining full feature set and phased roadmap
- Environment variable template (`.env.example`)
- CLAUDE.md for AI-assisted development guidance
- Project documentation (`docs/changelog.md`, `docs/project_status.md`)
- **Project scaffolding**: Next.js 16 with App Router, TypeScript, Tailwind CSS v4, Framer Motion, shadcn/ui, Magic UI components
- **Core types**: TraceData schema, AnalysisResult interfaces, all supporting types (`src/lib/types/`)
- **Claude Code parser**: JSONL trace file parser with content block flattening, tool call extraction, multi-session support, malformed line tolerance (`src/lib/parsers/`)
- **Raw stats analyzer**: Session/message counts, token aggregation, tool ranking, coding time patterns, active days (`src/lib/analyzers/raw-stats.ts`)
- **Vibe coder scores**: 10 heuristic 0-100 scores (Chaos Energy, Debuginator, Boilerplate Goblin, etc.) with vibe label assignment (`src/lib/analyzers/vibe-scores.ts`)
- **Prompt personality analyzer**: Word frequency, prompt length classification, question/command ratios, mind-change detection (`src/lib/analyzers/prompt-personality.ts`)
- **AI treatment score**: Politeness tier, patience score, gratitude index, frustration control, assassination list risk (`src/lib/analyzers/ai-treatment.ts`)
- **Landing page**: Production-grade landing with cinematic hero, live preview card, how-it-works section, feature grid, vibe label marquee, counter strip, and dual CTAs
- **Upload page**: Drag-and-drop file dropzone with validation, processing indicators, full parse→analyze pipeline
- **Folder upload**: Drop your entire `.claude/` directory — the app recursively scans for `.jsonl` trace files automatically
- **Wrapped experience**: 9-section scroll-triggered animated report (intro with confetti, raw stats, time patterns, top tools, prompt personality, vibe scores, overall vibe reveal, AI treatment, summary CTA)
- **Summary card page**: Shareable card with NeonGradientCard, download as PNG via html-to-image, Web Share API support
- **State management**: React Context store for upload→parse→analyze→render pipeline
- **Tests**: 26 tests for parser and analyzer modules
- **Dashboard view**: Bento-grid dashboard at `/wrapped` with Overview and Sessions tabs
- **Session details analyzer**: Per-session aggregates, timeline, user prompt previews (`src/lib/analyzers/session-details.ts`)
- **Code impact analyzer**: Language detection, files touched, task type classification, error rate (`src/lib/analyzers/code-impact.ts`)
- **Cost estimator**: Token cost calculation with model-specific pricing and fallback rates (`src/lib/analyzers/cost-estimate.ts`)
- **Sessions table**: Sortable, filterable, paginated table with expandable row previews and search highlighting
- **Dashboard tiles**: 12 data tiles covering stats, vibe, cost, tools, time patterns, personality, projects, code impact, AI treatment, and session timeline
- **Tests**: 55 additional tests for new analyzers (81 total)
- **Productivity stats analyzer**: Cost per session, success rate, prompt-to-fix ratio, response gap, tool efficiency, iteration speed (`src/lib/analyzers/productivity-stats.ts`)
- **Engagement stats analyzer**: Session streaks, peak day, conversation depth, self-sufficiency trend, context window pressure, multi-tasking score (`src/lib/analyzers/engagement-stats.ts`)
- **Achievements analyzer**: Hours saved estimate, usage percentile, 10 unlockable badges (`src/lib/analyzers/achievements.ts`)
- **3 new dashboard tiles**: Productivity, Engagement, and Achievements tiles with full data visualization
- **Session trace modal**: Full message log viewer with role labels, tool call/result display, error highlighting, filtering, search, and pagination
- **Share menu**: Share button on dashboard with X, LinkedIn, Reddit, copy text, and summary card download
- **Date range filter**: Calendar + text input date filtering in sessions tab
- **Tests**: 103 additional tests for extended analyzers (184 total)

### Changed
- **Frustration scoring reworked to ratio-based formula**: All frustration signals (caps, frustration words, profanity, demanding phrases, terse corrections) are now computed as ratios instead of absolute counts. Each signal has a weight (caps: 15, frustration words: 20, profanity: 30, demanding: 15, terse: 20) that sums to 100. This ensures scores scale correctly with trace size — uploading a full folder no longer floors the score to 0.
- **Frustration bar displayed inverted**: The dashboard now shows "Frustration" (not "Frustration Ctrl") with an inverted bar — higher bar = more frustration detected, making profanity visually prominent instead of showing as an empty bar.
- **Per-session boundary fix for AI treatment**: Terse corrections, gratitude detection, and patience/correction chains are now computed per-session instead of across a flat array of all sessions. This prevents false positives at session boundaries (e.g., a new session's first short message being counted as a terse correction of the previous session's last response).
- **Usage percentile thresholds scaled up**: Recalibrated for heavy agent usage including sub-agents: <100 msgs/day = Top 10%, 20K+ msgs/day = Top 99%. Previous scale topped out at 1K msgs/day.
- **Time patterns use local timezone**: Switched from `getUTCHours()` to `getHours()` so coding time pattern charts (hour distribution, peak hour, time-of-day label) reflect the user's local timezone instead of UTC.
- **Project field fallback**: Parser now falls back to `cwd` when `project` field is missing from session metadata (moved from Added to document it as a behavioral change).
- Pricing table updated from 5 model entries to 20+ Claude model variants with March 2026 rates (Opus 4.6/4.5 reduced from $15/$75 to $5/$25 per MTok)
- Scroll story moved from `/wrapped` to `/wrapped/story` — dashboard is now the primary post-upload landing
- `/wrapped` is now a data-dense bento-grid dashboard with Overview and Sessions tabs
- Summary page "View Full Report" link now points to `/wrapped/story`
- Switched font from Geist to DM Sans (body/UI) and DM Mono (monospace)
- Landing page fully revamped — cinematic dark aesthetic with interactive preview card, parallax hero, trust signals, and feature breakdown
- Hero tagline changed from "Your year with AI, unwrapped" to "See how you really code with AI" — removed year/time framing since users can upload traces at any time
- Upload dropzone now has "Select Folder" and "Select Files" buttons side by side, and accepts folder drops that recursively scan for `.jsonl` trace files
- Upload page now includes platform-specific instructions (macOS, Windows, Linux) for locating the hidden `.claude/` directory
