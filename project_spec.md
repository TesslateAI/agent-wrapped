# Agent Wrapped — Project Spec

> Spotify Wrapped, but for your coding agent usage.

Users upload their coding agent traces (Claude Code, Cursor, Aider, Continue, Codex, etc.) and get a visually stunning, shareable breakdown of how they use AI coding tools — stats, personality insights, vibe scores, and a roast.

---

## Overview

**Agent Wrapped** is a web app that analyzes coding agent history/traces and generates a personalized, fun, shareable "wrapped" experience. Think Spotify Wrapped meets developer culture.

Users upload trace files from their coding agents. The app parses them, computes stats and personality scores, and renders an animated, dark-themed, card-based report they can screenshot and share.

---

## Core User Flow

1. **Land** — User hits the homepage, sees the pitch and a big upload button
2. **Upload** — User uploads agent trace files (drag-and-drop or file picker)
3. **Process** — App parses traces, extracts sessions/messages/prompts, computes all metrics
4. **Reveal** — Animated "wrapped" experience plays out section by section (story/slide format)
5. **Share** — Final summary card with a share/download button

---

## Supported Agent Trace Sources

The app should detect and parse traces from common coding agents:

| Agent | Typical Trace Location |
|-------|----------------------|
| Claude Code | `.claude/` directory — conversation logs, JSONL history |
| Cursor | `.cursor/` directory — chat history, composer logs |
| Aider | `.aider/` directory — chat history, input/output logs |
| Continue | `.continue/` directory — session logs |
| Codex | CLI history, session exports |
| Generic | Any `*_history`, `*_logs`, or chat export files (JSON, JSONL, Markdown) |

Users can upload individual files or zip archives containing these directories.

---

## Analysis Sections

### 1. Raw Stats

Big-number stat cards showing:

- Total sessions and messages sent
- Total prompts written by the user
- Estimated lines of code generated / modified
- Files and folders most frequently touched
- Most used languages, frameworks, libraries
- Favorite task types (debugging, scaffolding, refactoring, explaining, etc.)
- Coding time patterns (morning coder? night owl? weekend warrior?)
- Longest sessions and biggest single requests
- Most repeated questions or recurring problems

### 2. Prompt Personality

Analysis of how the user writes prompts:

- Favorite words and phrases used when prompting
- Average prompt length (terse vs. essay writer)
- **Politeness Score** — how often they say please/thanks
- How often they change their mind mid-conversation
- Ratio of questions vs. commands vs. demands
- Use of context/examples in prompts

### 3. Vibe Coder Scores (0–100 each, with label)

Each score gets a circular progress ring or animated bar fill:

| Score | What It Measures |
|-------|-----------------|
| **Chaos Energy** | Winging it vs. planning ahead |
| **Debuginator** | Time spent fixing vs. building new things |
| **Boilerplate Goblin** | How often scaffolding/templates are requested |
| **Overthinker Index** | Asking for explanations vs. just shipping |
| **Ship It Factor** | Bias toward speed and getting things done |
| **Docs Respecter** | Frequency of asking to write/read documentation |
| **Stack Loyalty** | Sticking to one stack vs. bouncing around |
| **Prompt Clarity** | How specific and well-formed prompts are |
| **AI Dependency** | How much is AI-lifted vs. written manually |
| **Overall Vibe Score** | Aggregate score + a vibe label |

**Vibe Labels** (assigned based on score profile):
- "Chaotic Genius"
- "Silent Architect"
- "Rubber Duck Supremacist"
- "The Eternal Debugger"
- "10x Goblin"
- "Copy-Paste Sorcerer"
- "The Micromanager"
- "LGTM Speedrunner"

### 4. Personality Insights

- **Coder Archetype** — e.g. "The Tinkerer", "The Firefighter", "The Perfectionist", "The Vibe Coder"
- **Top 3 Strengths** as a developer (derived from trace patterns)
- **Top 3 Weaknesses / Blind Spots**
- **Habits and Quirks** unique to this coder
- **Things to Improve** — actionable suggestions
- **The Roast** — one funny but painfully true observation
- **The Compliment** — one genuine, encouraging takeaway

### 5. AI Agent Treatment Score

Fun section analyzing how the user treats their AI agents:

- **Politeness Tier** — from "Digital Overlord" to "Says Please to Siri"
- **Patience Score** — do they rage-quit or calmly re-prompt?
- **Gratitude Index** — do they ever say thanks?
- **AI Assassination List Risk** — a tongue-in-cheek score: "When the robots rise, how safe are you?" Based on how politely/rudely the user interacts with agents

### 6. AI Tool Breakdown (if multiple tools detected)

- Which tool was used most
- What each tool was used for (categories)
- Tool loyalty score — ride-or-die vs. tool hopper
- Side-by-side comparison of usage patterns across tools

---

## HTML Output Requirements

The wrapped report is rendered as a **single self-contained HTML file**:

- **Zero external dependencies** — all CSS and JS inline
- **Dark theme, visually bold** — inspired by Spotify Wrapped
  - Punchy typography (large, bold headings)
  - Vivid gradient colors (purples, teals, pinks, electric blues)
  - Card-based layout with depth/shadows
- **Animated score reveals** — circular progress rings or bar fills that animate on scroll/load
- **Big stat cards** — oversized numbers that feel impactful
- **Story/slide format** — sections feel like swipeable chapters, scrolling triggers section transitions
- **Shareable summary card** — final "your vibe in one screen" card optimized for screenshots
- **Share button** — download the summary card as an image, or copy a shareable link
- **Responsive** — looks good on desktop and mobile
- **Accessible** — respects prefers-reduced-motion, sufficient contrast ratios

---

## Technical Architecture

### Frontend

- **Next.js** (React) — app router
- **Tailwind CSS** — styling
- **Framer Motion** — scroll-triggered animations, score reveals
- File upload with drag-and-drop support
- Client-side trace parsing (no server round-trip needed for basic analysis)

### Trace Parsing Engine

- Modular parser system — one parser per agent type
- Auto-detection of trace format from file structure/content
- Extracts structured data: sessions, messages, timestamps, file paths, languages, tool usage
- Handles malformed/partial traces gracefully

### Analysis Engine

- Computes all stats, scores, and personality insights from parsed trace data
- Scoring algorithms for each vibe score (documented heuristics)
- Archetype classification based on score profile clustering
- NLP-lite analysis of prompt text (word frequency, sentiment, politeness markers)

### Privacy

- **All processing happens client-side in the browser** — no trace data is sent to any server
- No accounts, no tracking, no data retention
- Clear privacy messaging on the upload page
- Option to use an LLM API (user-provided key) for richer personality insights, but fully functional without it

---

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page — pitch + upload CTA |
| `/upload` | Drag-and-drop file upload + format auto-detection |
| `/wrapped` | The animated wrapped experience (story mode) |
| `/wrapped/summary` | Static shareable summary card |

---

## MVP Scope

**Phase 1 — Ship It**
- Support Claude Code traces (`.claude/` directory)
- Raw stats computation
- Vibe coder scores (simplified heuristics)
- Basic prompt personality analysis
- AI treatment score (politeness tier, patience, gratitude, assassination list risk)
- Animated HTML report with dark theme
- Share/download summary card

**Phase 2 — Expand**
- Support Cursor, Aider, Continue traces
- Full personality insights + archetype system
- Richer animations and transitions
- Multi-tool comparison

**Phase 3 — Polish**
- Optional LLM-powered insights (user-provided API key)
- Community gallery of shared wraps
- Historical comparison (wrap vs. wrap over time)
- Browser extension to auto-export traces

---

## Design Inspiration

- Spotify Wrapped (story format, bold typography, gradient backgrounds)
- GitHub Skyline / GitHub Wrapped (developer-specific stats)
- Monkeytype (dark theme, clean stats presentation)
- The overall feel should be: **fun, shareable, slightly unhinged, developer-culture-aware**

---

## Key Principles

1. **Fun first** — this is entertainment, not a dashboard. Make it delightful.
2. **Privacy by default** — all processing in-browser. No data leaves the client.
3. **Zero friction** — upload files, get your wrapped. No signup, no config.
4. **Shareable** — if people don't screenshot it, we failed.
5. **Honest insights** — the analysis should surface real patterns, not just flattery.
