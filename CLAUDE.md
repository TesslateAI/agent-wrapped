# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Agent Wrapped — a web app where users upload coding agent traces and get a visual, animated, shareable breakdown of their AI coding tool usage. See `project_spec.md` for full details.

## Important Documents

| Document | Purpose |
|----------|---------|
| `project_spec.md` | Full feature spec, analysis sections, output requirements, phased roadmap |
| `docs/changelog.md` | All notable changes, follows Keep a Changelog format |
| `docs/project_status.md` | Current phase, task checklist, milestones, decisions log |
| `.env.example` | Environment variable template — copy to `.env.local` |

## Tech Stack

- **Next.js** (App Router) with React
- **Tailwind CSS** for styling
- **Framer Motion** for scroll-triggered animations and score reveals
- **TypeScript** throughout

## Build & Dev Commands

```bash
npm install          # install dependencies
npm run dev          # start dev server at localhost:3000
npm run build        # production build
npm run lint         # run ESLint
npm run test         # run tests
npm run test -- --watch path/to/file  # run single test file in watch mode
```

## Architecture

### Core Pipeline

Upload → Parse → Analyze → Render

1. **Parsers** (`src/lib/parsers/`) — one parser per agent type (Claude Code, Cursor, Aider, Continue). Each parser normalizes raw trace files into a common `TraceData` schema.
2. **Analyzers** (`src/lib/analyzers/`) — 7 analyzer modules compute stats, scores, and insights from normalized trace data:
   - `raw-stats.ts` — session/message counts, token aggregation, tool ranking, coding time patterns
   - `vibe-scores.ts` — 10 heuristic 0-100 scores with archetype label assignment
   - `prompt-personality.ts` — word frequency, prompt style, question/command ratios
   - `ai-treatment.ts` — politeness, patience, gratitude, frustration, assassination risk
   - `session-details.ts` — per-session aggregates, timeline, user prompt previews
   - `code-impact.ts` — language detection, files touched, task type classification, error rate
   - `cost-estimate.ts` — token cost calculation with model-specific pricing
3. **Dashboard** (`src/app/wrapped/page.tsx`) — bento-grid dashboard with Overview (11 data tiles) and Sessions (sortable/filterable table) tabs. Primary post-upload landing.
4. **Wrapped Story** (`src/app/wrapped/story/page.tsx`) — 9-section scroll-triggered animated experience. Launched from dashboard via "Play Your Wrapped" button.
5. **Summary Card** (`src/app/wrapped/summary/page.tsx`) — shareable screenshot card with download/share.

### Key Design Decisions

- **All processing is client-side.** No trace data leaves the browser. There are no API routes for trace processing.
- **Single HTML export** is a goal — the wrapped report should be exportable as a self-contained HTML file with all CSS/JS inlined.
- **Privacy first** — no accounts, no tracking, no data retention. This is a core principle, not a nice-to-have.

### AI Treatment Scoring

The friendliness/treatment score uses keyword and pattern matching (no LLM). Four sub-scores weighted into a composite:
- Politeness Tier (30%) — polite word ratio per prompt
- Patience Score (25%) — escalation detection across correction chains (per-session)
- Gratitude Index (20%) — thank-yous after agent completes work (per-session)
- Frustration (25%) — ratio-based: caps (15), frustration words (20), profanity (30), demanding phrases (15), terse corrections (20). All signals are ratios so scores scale with trace size. Displayed inverted in the UI (higher bar = more frustration detected).

### Vibe Coder Scores

Ten 0–100 scores computed via heuristics from trace data (Chaos Energy, Debuginator, Boilerplate Goblin, etc.). The Overall Vibe Score maps to a label like "Chaotic Genius" or "Rubber Duck Supremacist".

## Design System

The UI is bold, dark, animated, and built to be screenshotted.

- **Theme**: Dark background (#0a0a0a or similar near-black), vivid gradient accents
- **Colors**: Purple-to-pink, teal-to-blue, orange-to-yellow gradient pairs. High saturation, high contrast against dark backgrounds
- **Typography**: Large, punchy headings (bold/black weight). Oversized stat numbers. Clean sans-serif body text
- **Layout**: Card-based with depth (subtle shadows, border glows). Sections feel like story slides/chapters with full-viewport height
- **Animation**: Scroll-triggered reveals via Framer Motion. Circular progress rings animate on entry for scores. Numbers count up. Cards fade/slide in
- **Summary Card**: Final screen is a single "your vibe in one screen" card — optimized for screenshot sharing with a download/share button
- **Responsive**: Must look great on both desktop and mobile
- **Accessibility**: Respect `prefers-reduced-motion`, maintain sufficient contrast ratios on all text

## Security Policies

### Data Privacy (Critical)

- **Zero server-side processing of trace data.** All parsing and analysis runs in the browser via JavaScript. No trace content is ever sent to a backend, API, or third-party service.
- **No data persistence.** Trace data lives only in browser memory during the session. Nothing is written to localStorage, IndexedDB, cookies, or any storage mechanism. When the user closes the tab, the data is gone.
- **No analytics on trace content.** If analytics are added (e.g. PostHog), they must only track anonymous usage events (page views, button clicks). Never log, capture, or transmit any content from uploaded traces.
- **No accounts or authentication.** No user data is collected, stored, or associated with sessions.

### File Upload Security

- **Validate file types** before processing. Only accept expected formats (JSON, JSONL, Markdown, ZIP).
- **Enforce file size limits** client-side to prevent memory exhaustion in the browser (recommend max 100MB).
- **Sanitize all parsed content** before rendering to DOM — any trace content displayed in the UI must be escaped to prevent XSS from malicious trace files.
- **ZIP handling**: When extracting ZIP uploads, validate paths to prevent zip-slip (path traversal). Reject entries with `..` segments or absolute paths.
- **Never use `eval()`, `innerHTML` with raw trace content, or `dangerouslySetInnerHTML`** with unescaped user data.

### Dependencies & Supply Chain

- Keep dependencies minimal. This app should have a small dependency footprint.
- Audit dependencies before adding — prefer well-maintained packages with small attack surfaces.
- Lock dependency versions via `package-lock.json` (committed to repo).
- No CDN-loaded scripts in production — everything is bundled and self-contained.

### Optional LLM Integration (Future)

- If LLM-powered insights are added, the API key must be **user-provided and stored only in browser memory** (never persisted).
- Clearly disclose to the user that trace content will be sent to the LLM provider when they opt in.
- Provide the full wrapped experience without any LLM calls — LLM is enhancement only.

### Content Security

- The share/export feature generates a static HTML file. Ensure exported HTML does not contain executable scripts that could run in unintended contexts.
- Summary card images should be generated client-side (e.g. `html-to-canvas`). If server-side OG image generation is added, ensure it does not accept or render arbitrary user content.

## Repository Etiquette

### Branching

- `main` is the production branch — always keep it in a deployable state.
- Create feature branches off `main` with descriptive names: `feat/claude-parser`, `fix/score-overflow`, `chore/update-deps`.
- Use prefixes: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`.

### Commits

- Write clear, concise commit messages. Lead with what changed and why.
- One logical change per commit — don't bundle unrelated changes.
- Keep commits small and reviewable.

### Pull Requests

- PRs should target `main`.
- Include a summary of changes and a test plan.
- Update `docs/changelog.md` with notable changes under `[Unreleased]`.
- Update `docs/project_status.md` task checklist when completing milestones.

### Code Quality

- All code must pass `npm run lint` and `npm run build` before merging.
- Write tests for parsers and analyzers — these are the core logic and must be reliable.
- UI components should be tested for critical interactions but don't need exhaustive coverage.

### Documentation

- Update `project_spec.md` if scope or requirements change.
- Log significant architectural decisions in `docs/project_status.md` decisions log.
- Update the files in the docs folder after major milestone and major additions  to the project
- Keep `CLAUDE.md` current — if you change the architecture, update it here.

## Environment

Copy `.env.example` to `.env.local`. The app runs fully without any API keys — keys are only needed for optional LLM-powered insights (future phase).
