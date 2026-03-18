<div align="center">

# Agent Wrapped

**See how you really code with AI.**

Upload your coding agent traces and get a cinematic, shareable breakdown of your prompts, patterns, personality — and a roast.

100% client-side. Your data never leaves your browser.

[![GitHub Stars](https://img.shields.io/github/stars/tesslateai/agent-wrapped?style=social)](https://github.com/tesslateai/agent-wrapped/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/tesslateai/agent-wrapped?style=social)](https://github.com/tesslateai/agent-wrapped/fork)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-0055FF?logo=framer&logoColor=white)](https://www.framer.com/motion/)

[Get Started](#quick-start) · [Features](#features) · [How It Works](#how-it-works) · [Contributing](#contributing)

</div>

---

<table>
<tr>
<td width="50%" valign="top">

<div align="center">

### Community

[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/TesslateAI)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/company/tesslate)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/WgXabcN2r2)

**Maintainer:** [sanjitverma@tesslate.com](mailto:sanjitverma@tesslate.com)

</div>

</td>
<td width="50%" valign="top">

<div align="center">

### Privacy First

All processing happens **in your browser**.

No accounts. No tracking. No data retention.

Your traces are analyzed locally and never sent to any server.

</div>

</td>
</tr>
</table>

---

## Features

### Cinematic Wrapped Story
A scroll-triggered, animated experience with confetti, score reveals, and shareable summary cards.

### Data-Dense Dashboard
Bento-grid analytics dashboard with 12+ tiles covering every aspect of your AI coding workflow.

### 10 Analyzer Modules

| Analyzer | What It Computes |
|----------|-----------------|
| **Raw Stats** | Sessions, messages, tokens, tool calls, coding time patterns, active days |
| **Vibe Scores** | 10 heuristic 0-100 scores: Chaos Energy, Debuginator, Ship It Factor, and more |
| **Prompt Personality** | Word frequency, prompt length style, question/command ratios |
| **AI Treatment** | Politeness tier (32 phrases), patience, gratitude (42 phrases), frustration (ratio-based: profanity via `better-profane-words`, caps, demanding phrases, terse corrections), assassination list risk |
| **Session Details** | Per-session aggregates, timeline, full message trace viewer |
| **Code Impact** | Languages detected, files touched, task type breakdown, error rate |
| **Cost Estimate** | Token cost with model-specific pricing for 20+ Claude model variants |
| **Productivity** | Cost/session, success rate, prompt-to-fix ratio, tool efficiency |
| **Engagement** | Session streaks, peak day, self-sufficiency trend, multi-tasking score |
| **Achievements** | Hours saved, usage percentile, 10 unlockable badges |

### Session Trace Viewer
Click any session to open a full trace log with:
- Color-coded messages (user, assistant, tool, error)
- Tool call/result inspection
- Filtering by role, errors, or search text
- Pagination for large sessions

### Achievement Badges
Unlock 10 badges based on your usage: 1K Club, Night Owl, Polyglot, Streak Master, Marathon Runner, Tool Wielder, Bug Squasher, Speed Demon, and more.

### Shareable Summary Card
Download your wrapped as a PNG image. Share on X, LinkedIn, Reddit, or copy to clipboard.

---

## How It Works

```
Upload → Parse → Analyze → Dashboard + Wrapped Story
```

1. **Upload** your `.claude/` folder or individual `.jsonl` trace files
2. **Parse** — the Claude Code JSONL parser normalizes raw traces into a common schema
3. **Analyze** — 10 analyzer modules compute 100+ metrics from your trace data
4. **View** — land on the bento-grid dashboard, or play the cinematic wrapped story

Everything runs in your browser. No server round-trips.

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/tesslateai/agent-wrapped.git
cd agent-wrapped

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and upload your traces.

### Finding Your Trace Files

Claude Code stores traces in a hidden `~/.claude/` directory:

**macOS:** Run `open ~/.claude/projects` in Terminal

**Windows:** Press `Win + R`, type `%USERPROFILE%\.claude`

**Linux:** Run `xdg-open ~/.claude` or press `Ctrl + H` in your file manager

Drag the `projects` folder (or any `.jsonl` files) into the upload dropzone.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Framer Motion |
| **UI Components** | shadcn/ui + Magic UI |
| **Fonts** | DM Sans + IBM Plex Mono (Google Fonts CDN) |
| **Image Export** | html-to-image |
| **Testing** | Jest + ts-jest |
| **State** | React Context |

### No Backend Required
- No API routes for trace processing
- No database
- No authentication
- No external services
- No environment variables needed to run

---

## Project Structure

```
src/
  app/
    page.tsx                    # Landing page
    upload/page.tsx             # Upload + file processing
    wrapped/
      page.tsx                  # Dashboard (bento grid + sessions)
      story/page.tsx            # Animated wrapped story
      summary/page.tsx          # Shareable summary card
  lib/
    types/                      # TypeScript interfaces
    parsers/                    # Trace file parsers
    analyzers/                  # 11 analysis modules
    store/                      # React Context state
    export/                     # Image capture + share
  components/
    dashboard/                  # 15 bento grid tiles
    wrapped/                    # Story scroll components
    upload/                     # File dropzone
    ui/                         # shadcn + Magic UI
docs/
  scoring-methodology.md        # How every metric is calculated
  changelog.md                  # All notable changes
  project_status.md             # Current phase + roadmap
```

---

## Supported Agents

| Agent | Status |
|-------|--------|
| **Claude Code** | Supported |
| Cursor | Coming soon |
| Aider | Coming soon |
| Continue | Coming soon |
| Codex | Coming soon |
| OpenClaw | Coming soon |

---

## Scripts

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run 187 tests
npm run test:watch   # Run tests in watch mode
```

---

## Contributing

We welcome contributions! Here's how:

1. **Fork** the repo
2. **Create a branch**: `git checkout -b feat/your-feature`
3. **Make changes** and add tests
4. **Run checks**: `npm run build && npm run test && npm run lint`
5. **Commit**: `git commit -m "feat: add your feature"`
6. **Push** and open a **Pull Request**

### Branch Naming
- `feat/` — new features
- `fix/` — bug fixes
- `chore/` — maintenance
- `docs/` — documentation
- `refactor/` — code restructuring

### Good First Issues
Look for issues labeled [`good first issue`](https://github.com/tesslateai/agent-wrapped/labels/good%20first%20issue).

---

## Documentation

| Document | Description |
|----------|------------|
| [`docs/scoring-methodology.md`](docs/scoring-methodology.md) | How every metric is calculated — formulas, thresholds, keyword lists |
| [`docs/changelog.md`](docs/changelog.md) | All notable changes (Keep a Changelog format) |
| [`docs/project_status.md`](docs/project_status.md) | Current phase, roadmap, decisions log |
| [`project_spec.md`](project_spec.md) | Full feature spec and phased roadmap |
| [`CLAUDE.md`](CLAUDE.md) | AI-assisted development guidance |

---

## Roadmap

**Shipped:**
- [x] Claude Code trace parser
- [x] 10 analyzer modules (raw stats, vibe scores, personality, treatment, sessions, code impact, cost, productivity, engagement, achievements)
- [x] Bento-grid dashboard with 12+ tiles
- [x] Animated wrapped story (9 sections)
- [x] Session trace viewer with filtering and pagination
- [x] Achievement badges system
- [x] Summary card export (PNG)
- [x] Share to X, LinkedIn, Reddit

**Coming Soon:**
- [ ] Cursor, Aider, Continue trace parsers
- [ ] Multi-tool comparison view
- [ ] Optional LLM-powered insights (user-provided API key)
- [ ] Community gallery of shared wraps
- [ ] Historical comparison (wrap vs. wrap over time)
- [ ] Browser extension to auto-export traces

---

## FAQ

<details>
<summary><b>Is my data sent to a server?</b></summary>

No. All processing happens in your browser using JavaScript. Your trace files are never uploaded, transmitted, or stored anywhere. When you close the tab, the data is gone.

</details>

<details>
<summary><b>Do I need an API key?</b></summary>

No. Agent Wrapped works fully offline with no API keys. Future phases may add optional LLM-powered insights using a user-provided key.

</details>

<details>
<summary><b>Which agents are supported?</b></summary>

Currently Claude Code (`.jsonl` traces from `~/.claude/`). Support for Cursor, Aider, Continue, and Codex is planned.

</details>

<details>
<summary><b>How are the vibe scores calculated?</b></summary>

Each of the 10 vibe scores uses keyword-based heuristics on your prompt text. See [`docs/scoring-methodology.md`](docs/scoring-methodology.md) for the exact formulas and thresholds.

</details>

<details>
<summary><b>How accurate is the cost estimate?</b></summary>

Cost is estimated using hardcoded public API pricing for 20+ Claude model variants. Pricing data is sourced from [Anthropic's official pricing page](https://docs.anthropic.com/en/docs/about-claude/models) as of March 18, 2026. If your traces use an unknown model, a conservative fallback rate is applied and marked as "(approximate)". If rates have changed since March 2026, please [open a GitHub issue](https://github.com/tesslateai/agent-wrapped/issues/new).

</details>

<details>
<summary><b>Can I use this commercially?</b></summary>

Yes. Apache 2.0 license allows commercial use, modification, and distribution.

</details>

---

## License

Agent Wrapped is licensed under the **Apache License 2.0**. See [LICENSE](LICENSE).

**What this means:**
- Commercial use allowed
- Modification and distribution allowed
- Patent grant included
- Provided "as is"

---

<div align="center">

**Built by [Tesslate](https://tesslate.com)**

### If you find this useful, give it a star!

[![Star on GitHub](https://img.shields.io/badge/Star%20on%20GitHub-⭐-yellow?style=for-the-badge&logo=github)](https://github.com/tesslateai/agent-wrapped)

[Star this repo](https://github.com/tesslateai/agent-wrapped) · [Fork it](https://github.com/tesslateai/agent-wrapped/fork) · [Share it](https://twitter.com/intent/tweet?text=Check%20out%20Agent%20Wrapped%20-%20Spotify%20Wrapped%20for%20your%20coding%20agent%20usage!%20100%25%20client-side.&url=https://github.com/tesslateai/agent-wrapped)

</div>
