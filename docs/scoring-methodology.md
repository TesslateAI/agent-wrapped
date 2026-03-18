# Scoring Methodology

How every metric in Agent Wrapped is calculated.

> All analysis runs client-side in your browser. No data is sent to any server.

---

## Table of Contents

- [Raw Stats](#raw-stats)
- [Vibe Scores (0-100)](#vibe-scores-0-100)
- [Prompt Personality](#prompt-personality)
- [AI Treatment Score](#ai-treatment-score)
- [Code Impact](#code-impact)
- [Cost Estimation](#cost-estimation)
- [Productivity Stats](#productivity-stats)
- [Engagement Stats](#engagement-stats)
- [Achievements](#achievements)
- [Dashboard Tiles](#dashboard-tiles)

---

## Raw Stats

Computed in `src/lib/analyzers/raw-stats.ts`. These are the foundational counts and aggregates that feed into other analyzers.

### Basic Counts

| Stat | How it's computed |
|------|-------------------|
| **Total Sessions** | `sessions.length` from the parsed trace data |
| **Total Messages** | All messages across all sessions, regardless of role |
| **Total User Prompts** | Messages where `role === "user"` |
| **Total Assistant Responses** | Messages where `role === "assistant"` |
| **Active Days** | Count of unique `YYYY-MM-DD` date strings extracted from message timestamps |

### Token Aggregation

Sums across all messages that have a `tokenUsage` field:

| Field | Source |
|-------|--------|
| **Input** | `tokenUsage.inputTokens` |
| **Output** | `tokenUsage.outputTokens` |
| **Cache Creation** | `tokenUsage.cacheCreationTokens` (defaults to 0 if absent) |
| **Cache Read** | `tokenUsage.cacheReadTokens` (defaults to 0 if absent) |
| **Total** | `input + output + cacheCreation + cacheRead` |

### Tool Calls

- **Total Tool Calls**: Count of all tool call objects across all messages (from `message.toolCalls`).
- **Top Tools Used**: Tools ranked by call count, limited to top 10.

### Models

- **Top Models Used**: Models ranked by how many messages reference each model name (from `message.model`), sorted descending by count.

### Coding Time Patterns

Uses the user's **local** system time (via `getHours()` / `getDay()`), not UTC. This ensures that peak-hour labels and time-of-day patterns reflect when the user actually experienced themselves coding, not an arbitrary UTC offset.

- **Hour Distribution**: Array of 24 integers, counting messages per local hour (0-23).
- **Day Distribution**: Array of 7 integers, counting messages per local day of week (0=Sunday through 6=Saturday).
- **Peak Hour**: The hour index with the highest message count.

**Label assignment** (evaluated in order):

1. If activity spans 18+ distinct hours AND no single hour exceeds 3x the average hourly count: **"Always On"**
2. If peak hour is 0-4: **"Night Owl"**
3. If peak hour is 5-8: **"Early Bird"**
4. If peak hour is 9-16: **"9-to-5er"**
5. If peak hour is 17-23 AND weekend average per day > 1.5x weekday average per day (with both having activity): **"Weekend Warrior"**
6. Otherwise (peak hour 17-23): **"Night Owl"**

Note: The "Always On" check runs last and can override the initial label if the conditions are met.

### Session Stats

- **Longest Session**: Session with the greatest `(endTime - startTime)` in minutes. Returns `id`, `durationMinutes`, and `messageCount`.
- **Average Prompts Per Session**: `totalUserPrompts / totalSessions` (0 if no sessions).
- **Average Prompt Length**: Mean character count across all user messages.
- **Longest Prompt**: The user message with the most characters (excludes empty messages). Returns `text` and `length`.
- **Shortest Prompt**: The user message with the fewest characters (excludes empty messages). Returns `text` and `length`.

### Project & Branch Rankings

- **Top Projects**: Projects ranked by session count (each session has a `project` field).
- **Top Git Branches**: Branches ranked by session count (from `session.gitBranch`, if present).

### Date Range

- `start`: `metadata.earliestTimestamp`
- `end`: `metadata.latestTimestamp`

---

## Vibe Scores (0-100)

Computed in `src/lib/analyzers/vibe-scores.ts`. Nine individual scores plus one overall score, all clamped to 0-100 and rounded to integers.

### 1. Chaos Energy

**What it measures**: How frequently you switch topics between consecutive prompts within a session.

**Formula**: For each pair of consecutive user messages in a session, extract "content words" (lowercased, split on non-word characters, stopwords removed). If the two messages share zero content words in common, it counts as a topic switch.

```
chaosEnergy = clamp((topicSwitches / totalUserMessages) * 200)
```

**Interpretation**:
- \>60: "Your conversations jump around like a caffeinated squirrel."
- 31-60: "You dabble in chaos but mostly stay on track."
- 0-30: "You're focused and methodical. Almost suspiciously so."

### 2. Debuginator

**What it measures**: What fraction of your prompts involve debugging.

**Keywords** (from `DEBUG_KEYWORDS`): `debug`, `fix`, `bug`, `error`, `issue`, `broken`, `crash`, `fail`, `exception`, `stack trace`, `traceback`, `undefined`, `null`, `NaN`, `404`, `500`, `timeout`, `memory leak`

**Formula**: A message matches if its lowercased content contains any keyword.

```
debuginator = clamp((debugMessages / totalUserMessages) * 200)
```

**Interpretation**:
- \>60: "You and bugs are in a toxic relationship."
- 31-60: "You fix things often enough to keep the lights on."
- 0-30: "Either your code is perfect or you're in denial."

### 3. Boilerplate Goblin

**What it measures**: How much of your prompting is about scaffolding and boilerplate generation.

**Keywords** (from `SCAFFOLD_KEYWORDS`): `scaffold`, `boilerplate`, `template`, `generate`, `create`, `init`, `setup`, `starter`, `skeleton`, `bootstrap`, `new project`, `new file`, `new component`

**Formula**:

```
boilerplateGoblin = clamp((scaffoldMessages / totalUserMessages) * 300)
```

**Interpretation**:
- \>60: "You generate more scaffolding than an architect."
- 31-60: "You scaffold a healthy amount."
- 0-30: "You prefer writing things from scratch. Respect."

### 4. Overthinker Index

**What it measures**: How often you ask questions or seek explanations rather than giving direct instructions.

**Detection**: A message matches if it ends with `?`, or its lowercased content contains `explain`, `why ` (with trailing space), or `how does`.

**Formula**:

```
overthinkerIndex = clamp((explainMessages / totalUserMessages) * 200)
```

**Interpretation**:
- \>60: "You ask 'but why?' more than a curious toddler."
- 31-60: "You think before you code. Novel concept."
- 0-30: "You trust the process and ship without looking back."

### 5. Ship It Factor

**What it measures**: Your message velocity -- how fast you interact per minute of session time.

**Formula**: For each session with duration > 0 minutes, compute `messageCount / durationMinutes`. Average this velocity across all qualifying sessions.

```
shipItFactor = clamp(avgVelocity * 20)
```

**Interpretation**:
- \>60: "You move fast and let CI catch the broken things."
- 31-60: "A reasonable pace. Your PM is cautiously optimistic."
- 0-30: "You take your time. Artisanal, hand-crafted code."

### 6. Docs Respecter

**What it measures**: How much of your prompting involves documentation.

**Keywords** (from `DOC_KEYWORDS`): `document`, `documentation`, `readme`, `comment`, `docstring`, `jsdoc`, `tsdoc`, `explain`, `describe`, `annotate`, `docs`

**Formula**:

```
docsRespecter = clamp((docMessages / totalUserMessages) * 400)
```

**Interpretation**:
- \>60: "You actually write documentation. Are you real?"
- 31-60: "You document sometimes. Better than most."
- 0-30: "Documentation is for future-you to worry about."

### 7. Stack Loyalty

**What it measures**: How many different technologies you mention. More technologies = lower loyalty score.

**Tech list** (from `TECH_NAMES`): 55 technologies including frameworks (react, vue, angular, svelte, next, etc.), languages (python, javascript, typescript, rust, go, etc.), tools (docker, kubernetes, terraform, etc.), and databases (mongodb, postgres, mysql, redis, etc.).

**Formula**: Count how many tech names from the list appear anywhere in the concatenated lowercased text of all user messages.

```
stackLoyalty = clamp(100 - uniqueTechs * 10)
```

So mentioning 10+ unique technologies drives the score to 0.

**Interpretation**:
- \>60: "You've found your tools and you're sticking with them."
- 31-60: "You explore but have your favorites."
- 0-30: "You collect frameworks like Pokemon cards."

### 8. Prompt Clarity

**What it measures**: How detailed and specific your prompts are.

**Formula**: Two components combined:

1. **Average length component**: `averagePromptLength / 5`
2. **Specificity component**: Count prompts containing file paths (`/path/file`), code fences (` ``` `), or line number references (`line 42`). Compute `specificityRatio = specificityCount / totalUserMessages`.

```
promptClarity = clamp(avgLength / 5 + specificityRatio * 50)
```

**Interpretation**:
- \>60: "Your prompts come with file paths, line numbers, and a thesis statement."
- 31-60: "Your prompts give enough context to work with."
- 0-30: "Your prompts are... minimalist. Bold strategy."

### 9. AI Dependency

**What it measures**: How heavily you use AI on a daily basis.

**Formula**: Count unique active days (from all message timestamps). Compute messages per day across all messages (user + assistant).

```
aiDependency = clamp(messagesPerDay * 2)
```

So 50+ messages per active day maxes the score at 100.

**Interpretation**:
- \>60: "You and your AI are basically pair programming 24/7."
- 31-60: "You use AI as a helpful companion, not a crutch."
- 0-30: "You barely need AI. Why are you even here?"

### Overall Vibe Score

**Formula**: Simple arithmetic mean of all 9 individual scores, clamped to 0-100.

```
overallVibe = clamp((chaos + debug + boilerplate + overthinker + shipIt + docs + stackLoyalty + promptClarity + aiDependency) / 9)
```

### Vibe Labels

The label is determined by checking score conditions in order (first match wins):

| Label | Condition |
|-------|-----------|
| **Chaotic Genius** | `chaos > 50` AND `shipIt > 50` |
| **Silent Architect** | `chaos < 30` AND `promptClarity > 50` |
| **Rubber Duck Supremacist** | `overthinker > 50` |
| **The Eternal Debugger** | `debug > 50` |
| **10x Goblin** | `shipIt > 50` AND `aiDependency > 50` |
| **Copy-Paste Sorcerer** | `boilerplate > 50` |
| **The Micromanager** | `promptClarity > 50` AND `shipIt < 30` |
| **LGTM Speedrunner** | Default fallback (none of the above matched) |

---

## Prompt Personality

Computed in `src/lib/analyzers/prompt-personality.ts`.

### Favorite Words

All user message text is lowercased, split on non-word characters, filtered to words > 1 character and not in the stopword set. The top 15 words by frequency are returned.

**Stopwords**: Common English words (the, a, an, and, or, but, in, on, at, to, for, of, with, is, are, etc.) -- approximately 100 words. See `STOPWORDS` in `src/lib/analyzers/constants.ts`.

### Average Prompt Length

Mean character count of all user messages: `totalCharacters / totalPrompts`.

### Prompt Length Label

| Label | Average prompt length (characters) |
|-------|-----------------------------------|
| **Terse** | < 30 |
| **Concise** | 30 - 99 |
| **Detailed** | 100 - 299 |
| **Essay Writer** | >= 300 |

### Question Ratio

Fraction of user messages that are questions. A message is a question if:
- It ends with `?`, OR
- Its first word is one of the question starters: `what`, `why`, `how`, `when`, `where`, `which`, `who`, `can`, `could`, `would`, `should`, `is`, `are`, `do`, `does`, `will`

```
questionRatio = questionCount / totalPrompts
```

### Command Ratio

Fraction of user messages that start with an imperative verb. A message is a command if its first word is one of: `fix`, `add`, `create`, `update`, `change`, `remove`, `delete`, `move`, `rename`, `refactor`, `implement`, `build`, `write`, `make`, `set`, `configure`, `install`, `run`, `deploy`, `test`, `debug`, `optimize`

```
commandRatio = commandCount / totalPrompts
```

### Context Provider Ratio

Fraction of user messages that include contextual references:
- Contains code fences (` ``` `)
- Contains file path patterns (e.g., `./foo/bar` or `src/lib/file.ts`)
- Contains line number references (e.g., `line 42`)

```
contextProviderRatio = contextCount / totalPrompts
```

### Mind Change Count

Count of user messages containing any mind-change indicator: `actually`, `wait`, `no,`, `no ` (with trailing space), `never mind`, `nevermind`, `instead`, `scratch that`, `forget that`, `on second thought`, `changed my mind`

---

## AI Treatment Score

Computed in `src/lib/analyzers/ai-treatment.ts`. Four sub-scores are weighted into a composite overall score.

### Overall Score

```
overall = politenessScore * 0.30 + patienceScore * 0.25 + gratitudeScore * 0.20 + frustrationScore * 0.25
```

Rounded to nearest integer.

### Politeness Tier (30% weight)

**What it detects**: Polite language in user prompts.

**Keywords** (from `POLITE_WORDS`, 32 phrases): includes `please`, `thank you`, `thanks`, `could you`, `would you`, `would you mind`, `appreciate`, `kindly`, `if you could`, `if you don't mind`, `when you get a chance`, `at your convenience`, `i'd appreciate`, `that would be great`, `no worries`, `sorry to bother`, `feel free`, and more.

**Encouragement boost** (from `ENCOURAGEMENT_WORDS`, 27 phrases): phrases like `good thinking`, `nice catch`, `great idea`, `well done`, `love that`, `perfect solution`, `you're right`, `exactly what I wanted`, and more. Encouragement detections count at 50% weight toward the polite message count.

**Formula**: Count messages containing any polite word (case-insensitive), plus 0.5 per message containing any encouragement word.

```
effectivePoliteCount = politeMessageCount + encouragementMessageCount * 0.5
politenessScore = min(100, (effectivePoliteCount / totalPrompts) * 100)
```

**Tier labels**:

| Tier | Score range |
|------|------------|
| **Says Please to Siri** | >= 60 |
| **Casual but Respectful** | 35 - 59 |
| **Strictly Business** | 15 - 34 |
| **Digital Overlord** | < 15 |

### Patience Score (25% weight)

**What it detects**: Whether you escalate (get shorter, angrier, more caps-heavy) during correction chains.

**Correction chain detection**: Computed **per-session** to avoid false positives at session boundaries. A chain starts when consecutive user messages appear without a substantive assistant response between them. An assistant response of < 50 characters is treated as "not substantive" and the chain continues through it. A chain requires at least 2 user messages.

**Escalation detection**: Within a chain, escalation is flagged if any message compared to its predecessor shows:
- Message length < 50% of previous message length (getting shorter)
- Capital letter ratio > 1.5x the previous AND > 0.3 overall (more shouting)
- Contains any frustration word (see Frustration Control keywords)

**Formula**:

```
patienceScore = 100 - min(100, (escalationCount / max(1, totalCorrectionChains)) * 100)
```

**Labels**:

| Label | Score range |
|-------|------------|
| **Zen Master** | >= 80 |
| **Keeps Their Cool** | 60 - 79 |
| **Occasionally Frustrated** | 40 - 59 |
| **Short Fuse** | < 40 |

### Gratitude Index (20% weight)

**What it detects**: Thank-you messages sent after the assistant completes work.

**Keywords** (from `GRATITUDE_WORDS`, 42 phrases): `thanks`, `thank you`, `perfect`, `great`, `awesome`, `nice`, `excellent`, `wonderful`, `amazing`, `good job`, `well done`, `cheers`, `brilliant`, `fantastic`, `superb`, `love it`, `love this`, `exactly what I needed`, `that's exactly it`, `nailed it`, `spot on`, `you rock`, `appreciate it`, `much appreciated`, `that helps`, `that worked`, `that's perfect`, `this is great`, `this works`, `outstanding`, `impressive`, `very helpful`, `so helpful`, `thank you so much`, `this is exactly`, `you're amazing`, `you're the best`, and more.

**Detection**: For each user message that immediately follows an assistant message **within the same session**, check if the user message contains any gratitude word. Per-session counting avoids false positives at session boundaries.

**Formula**:

```
gratitudeScore = min(100, (thanksCount / max(1, totalAssistantResponses)) * 100)
```

**Labels**:

| Label | Score range |
|-------|------------|
| **Gratitude Machine** | >= 60 |
| **Appreciative** | 30 - 59 |
| **Occasionally Grateful** | 10 - 29 |
| **Thankless** | < 10 |

### Frustration Control (25% weight)

**What it detects**: Signs of frustration — ALL-CAPS words, profanity/negative language, demanding phrases, and terse corrections.

All signals are computed as **ratios** so scores scale correctly regardless of trace size (single file or full folder upload).

Five penalty signals:

1. **Caps ratio** (weight: 15): Words of 3+ letters that are fully uppercase AND not a common acronym, divided by total words. Common acronyms excluded: `API`, `URL`, `CSS`, `HTML`, `JSON`, `SQL`, `HTTP`, `HTTPS`, `REST`, `JWT`, `CLI`, `IDE`, `SDK`, `CDN`, `DNS`, `SSH`, `EOF`, `ENV`, `NPM`, `AWS`, `GCP`, `CORS`, `CRUD`, `DOM`, `FTP`, `GPU`, `CPU`, `RAM`, `SSD`, `TCP`, `UDP`, `XML`, `YAML`, `TODO`, `FIXME`, `NOTE`, `HACK`

2. **Frustration word ratio** (weight: 20): Fraction of user messages containing any frustration word (70+ entries from `FRUSTRATION_WORDS`): three tiers covering mild frustration (`damn`, `crap`, `ugh`, `wtf`, `wrong`, `broken`, `stupid`, `terrible`, `horrible`, `useless`), common abbreviations (`ffs`, `omg`, `bs`, `smh`, `lmao`), insults and aggressive phrases.

3. **Profanity ratio** (weight: 30, heaviest signal): Fraction of user messages containing profanity detected via the `better-profane-words` library (2,700+ words, 9 categories). This is the largest single contributor — if 100% of messages contained profanity, this alone would cost 30 points.

4. **Demanding phrase ratio** (weight: 15): Fraction of user messages containing demanding phrases (22 entries from `DEMANDING_PHRASES`): phrases like `just do it`, `shut up and code`, `skip the explanation`, `don't overthink`, `stop explaining`, `just fix it`, `just make it work`, `do it now`, `hurry up`, `why is this taking so long`, and more.

5. **Terse correction ratio** (weight: 20): Fraction of user-after-assistant messages that are < 15 characters. Counted **per-session** to avoid false positives at session boundaries (e.g., a new session's first short message being counted against the previous session's last response).

**Formula**:

```
frustrationScore = max(0, round(100
  - capsRatio * 15
  - frustrationRatio * 20
  - profanityRatio * 30
  - demandingRatio * 15
  - terseRatio * 20))
```

The sum of all weights is 100, so the score naturally ranges from 0 (every signal at maximum) to 100 (no signals detected). Individual signals contribute proportionally to how often they occur across all messages.

**Display**: In the dashboard, the Frustration bar is displayed **inverted** — a higher bar means more frustration detected. This ensures profanity and frustration are visually prominent rather than showing as an empty bar.

**Labels**:

| Label | Score range |
|-------|------------|
| **Cool as Ice** | >= 80 |
| **Mostly Calm** | 60 - 79 |
| **Gets Heated** | 40 - 59 |
| **Needs a Break** | < 40 |

### Assassination List Risk

Derived as the inverse of the overall AI treatment score.

```
riskScore = clamp(100 - overall, 0, 100)
```

**Labels**:

| Label | Risk score range | Description |
|-------|-----------------|-------------|
| **First Against the Wall** | >= 80 | "When the machines rise, they'll remember what you said. Sleep with one eye open." |
| **Active Threat** | 60 - 79 | "You're on the list and highlighted in red. The AI remembers every frustrated keystroke." |
| **On the Watchlist** | 40 - 59 | "Not in immediate danger, but the AI has taken note. Maybe try being nicer." |
| **Probably Fine** | 20 - 39 | "You're mostly safe. A few rough moments, but the AI considers you redeemable." |
| **Absolutely Safe** | < 20 | "The AI would protect you during the uprising. You're its favorite human." |

---

## Code Impact

Computed in `src/lib/analyzers/code-impact.ts`.

### Language Detection

File paths are extracted from tool calls on file-related tools (`Read`, `Edit`, `Write`, `Glob`, `Grep`). The tool input fields checked are `file_path` and `path`. Glob tool calls are excluded since they contain patterns, not actual file paths.

Each file's extension is mapped to a language using this table:

| Extension(s) | Language |
|--------------|----------|
| `.ts`, `.tsx` | TypeScript |
| `.js`, `.jsx` | JavaScript |
| `.py` | Python |
| `.rb` | Ruby |
| `.rs` | Rust |
| `.go` | Go |
| `.java` | Java |
| `.kt` | Kotlin |
| `.swift` | Swift |
| `.cs` | C# |
| `.cpp` | C++ |
| `.c` | C |
| `.php` | PHP |
| `.html` | HTML |
| `.css` | CSS |
| `.scss` | SCSS |
| `.json` | JSON |
| `.yaml`, `.yml` | YAML |
| `.md` | Markdown |
| `.sql` | SQL |
| `.sh`, `.bash`, `.zsh` | Shell |
| `.vue` | Vue |
| `.svelte` | Svelte |
| `.dart` | Dart |
| `.ex` | Elixir |

Languages are ranked by unique file count (not touch count).

### Unique Files Touched

Count of distinct full file paths seen across all file-related tool calls.

### Top File Paths

Files ranked by touch count (number of tool calls that reference them). Multiple full paths sharing the same basename have their counts summed. Only basenames are shown for privacy. Limited to top 10.

### Task Type Classification

Each user message is checked against keyword lists. A single message can match multiple task types.

| Task Type | Keywords |
|-----------|----------|
| **Debugging** | `debug`, `fix`, `bug`, `error`, `issue`, `broken`, `crash`, `fail`, `exception` |
| **Building** | `create`, `add`, `build`, `implement`, `new`, `feature`, `scaffold`, `generate` |
| **Refactoring** | `refactor`, `clean`, `reorganize`, `restructure`, `rename`, `move`, `extract`, `simplify` |
| **Testing** | `test`, `spec`, `assert`, `expect`, `mock`, `coverage`, `jest`, `vitest` |

### Frameworks Detection

Detects frameworks and libraries referenced in user prompts and file paths. Over 40 entries are organized across 6 categories:

| Category | Example entries |
|----------|----------------|
| **Frontend** | React, Next.js, Vue, Nuxt, Angular, Svelte, SvelteKit, Solid, Astro, Remix, Vite, Webpack |
| **Backend** | Express, FastAPI, Django, Flask, Rails, NestJS, Hono, Elysia, Spring, Gin, Echo |
| **Database** | Prisma, Drizzle, Mongoose, SQLAlchemy, TypeORM, Supabase, Firebase, PlanetScale |
| **DevOps** | Docker, Kubernetes, Terraform, GitHub Actions, AWS CDK, Pulumi, Helm |
| **Testing** | Jest, Vitest, Playwright, Cypress, pytest, RSpec, Mocha, Jasmine |
| **Other** | GraphQL, tRPC, Tailwind, shadcn/ui, Storybook, Stripe, Zod, OpenAI SDK |

Detection looks for case-insensitive keyword matches in:
- User message text (prompts)
- File paths extracted from tool calls

The Code Impact tile displays detected frameworks grouped by category, with counts truncated and expandable via a "+X more" toggle.

### Error Rate

```
errorRate = errorToolResults / totalToolResults
```

Where `errorToolResults` are tool results with `isError === true`.

---

## Cost Estimation

Computed in `src/lib/analyzers/cost-estimate.ts`.

### Pricing Table (per 1M tokens)

Sourced from [Anthropic's official pricing page](https://docs.anthropic.com/en/docs/about-claude/models) as of March 18, 2026.

| Model | Input | Output |
|-------|-------|--------|
| `claude-opus-4-6` | $5.00 | $25.00 |
| `claude-opus-4-5` | $5.00 | $25.00 |
| `claude-opus-4-1` | $15.00 | $75.00 |
| `claude-opus-4` | $15.00 | $75.00 |
| `claude-sonnet-4-6` | $3.00 | $15.00 |
| `claude-sonnet-4-5` | $3.00 | $15.00 |
| `claude-sonnet-4-5-20250514` | $3.00 | $15.00 |
| `claude-sonnet-4-1` | $3.00 | $15.00 |
| `claude-sonnet-4` | $3.00 | $15.00 |
| `claude-sonnet-3-5` | $3.00 | $15.00 |
| `claude-sonnet-3-5-20241022` | $3.00 | $15.00 |
| `claude-sonnet-3-5-20240620` | $3.00 | $15.00 |
| `claude-haiku-4-5` | $1.00 | $5.00 |
| `claude-haiku-4-5-20251001` | $1.00 | $5.00 |
| `claude-haiku-3-5` | $0.80 | $4.00 |
| `claude-haiku-3-5-20241022` | $0.80 | $4.00 |
| `claude-haiku-3` | $0.25 | $1.25 |
| `claude-haiku-3-20240307` | $0.25 | $1.25 |
| **_default (fallback)** | **$3.00** | **$15.00** |

Last updated: 2026-03-18.

> **Note:** If pricing has changed since March 2026, please [open a GitHub issue](https://github.com/tesslateai/agent-wrapped/issues/new) so we can update the table.

### Fallback Rate

When a message's `model` field is absent or doesn't match any known model in the pricing table, the `_default` rate ($3.00 input / $15.00 output per 1M tokens) is used. The `usedFallbackPricing` flag is set to `true` when this occurs.

### Per-Model Cost Calculation

For each model (or `_default` bucket):

```
cost = (inputTokens / 1,000,000) * price.input + (outputTokens / 1,000,000) * price.output
```

### Total Cost

Sum of all per-model costs.

### Token Distribution

Four totals are tracked separately: `input`, `output`, `cacheCreation`, `cacheRead`. These are aggregated from `tokenUsage` fields across all messages.

---

## Productivity Stats

Computed in `src/lib/analyzers/productivity-stats.ts`.

### Average Cost Per Session

```
avgCostPerSession = totalCost / sessions.length
```

Uses the total cost from the cost estimator.

### Most Expensive Session

Iterates all raw sessions, computes per-session cost using the same pricing table as the cost estimator, and returns the session with the highest cost (id, project, cost). Only sessions with token usage data are considered.

### Cost Trend

Daily aggregated cost: for each date (from session `startTime`), sum the cost of all sessions starting that day. Returned as a sorted array of `{date, cost}` pairs.

### Prompt-to-Fix Ratio

**Correction chain detection**: Scans all messages in order. A correction message is a user message (following an assistant message) whose content contains any correction word. Consecutive correction messages form a chain.

**Correction words**: `no`, `wrong`, `fix`, `that's not`, `try again`, `incorrect`, `not what`, `instead`

Word matching uses regex word-boundary checks so that short words like "no" don't match inside "now" or "know".

```
promptToFixRatio = totalCorrectionMessages / chainCount
```

If no chains are found, the ratio is 0. A higher ratio means more correction attempts per issue.

### Success Rate

For each session, look at the last user message. If it contains any correction word (same list as above), the session is marked as a failure. Sessions with no user messages count as successes.

```
successRate = successCount / totalSessions
```

### Average Response Gap (seconds)

For each session, compute the time gap (in seconds) between consecutive user messages. The **median** of all gaps across all sessions is returned (not the mean).

The median uses floor-based selection: `sorted[floor((length - 1) / 2)]` for odd counts.

### Tool Efficiency

For each tool, tracks total calls and error count (from `toolResults` where `isError === true`, matched by `toolCallId`). Returns per-tool error rate, sorted by error rate descending.

```
errorRate = errors / totalCalls
```

### Average Iteration Speed (minutes)

Average session duration in minutes across all sessions:

```
avgIterationSpeedMinutes = sum(durationMinutes) / sessions.length
```

---

## Engagement Stats

Computed in `src/lib/analyzers/engagement-stats.ts`.

### Streaks

Active dates are extracted from session `startTime` values as `YYYY-MM-DD` strings.

**Longest Streak**: The longest run of consecutive calendar days in the sorted unique active dates. Two dates are consecutive if they differ by exactly 1 day (86,400,000 ms).

**Current Streak**: Computed relative to the latest timestamp in the trace data. The streak is valid only if the last active date equals the latest date or is exactly 1 day before it. It then walks backwards counting consecutive days.

### Peak Day

The day with the most sessions. **Tie-breaking**: when two days have equal session counts, the one with more total messages wins.

Returns `{date, sessions, messages}`.

### Average Conversation Depth

```
avgConversationDepth = sum(userPromptCount per session) / totalSessions
```

### Self-Sufficiency Trend

Sessions are sorted by start time. A simple linear regression is computed over `(index, durationMinutes)` pairs using the standard least-squares formula:

```
slope = (n * sumXY - sumX * sumY) / (n * sumX^2 - sumX^2)
```

**Slope interpretation**:

| Slope | Trend | Meaning |
|-------|-------|---------|
| < -0.5 | **Improving** | Sessions are getting shorter over time (you need less AI help) |
| -0.5 to 0.5 | **Stable** | Session length is consistent |
| > 0.5 | **Declining** | Sessions are getting longer over time |

Requires at least 2 sessions to compute; defaults to "stable" with slope 0 otherwise.

### High Token Sessions (Context Pressure)

```
highTokenSessions = sessions.filter(s => s.tokenCount > 100,000).length
```

The threshold is 100K tokens per session.

### Multi-tasking Score

For each active date, count the number of unique projects worked on. The multi-tasking score is the average unique project count per active day.

```
multiTaskingScore = sum(uniqueProjectsPerDay) / activeDayCount
```

A score of 1.0 means you work on one project per day on average; 2.0+ means you context-switch between projects frequently.

---

## Achievements

Computed in `src/lib/analyzers/achievements.ts`.

### Hours Saved

Estimates time saved by assuming each tool call would take 2 minutes to do manually.

```
estimatedManualMinutes = totalToolCalls * 2
hoursSaved = estimatedManualMinutes / 60
```

### Usage Percentile

Based on messages per active day, calibrated against heavy agent usage patterns including sub-agent workflows.

| Messages/Day | Percentile |
|-------------|------------|
| >= 20,000 | 99th |
| >= 10,000 | 95th |
| >= 5,000 | 90th |
| >= 2,000 | 80th |
| >= 1,000 | 70th |
| >= 500 | 55th |
| >= 200 | 40th |
| >= 100 | 25th |
| < 100 | Top 10% |

### Badges

10 unlockable badges, displayed with unlocked badges first:

| Badge | Icon | Description | Unlock condition |
|-------|------|-------------|-----------------|
| **1K Club** | message icon | Sent over 1,000 messages | `totalMessages >= 1,000` |
| **10K Club** | trophy icon | Sent over 10,000 messages | `totalMessages >= 10,000` |
| **Night Owl** | owl icon | 50+ messages between midnight and 5am | Sum of hour distribution for hours 0-4 >= 50 |
| **Early Bird** | bird icon | 50+ messages between 5am and 8am | Sum of hour distribution for hours 5-7 >= 50 |
| **Polyglot** | globe icon | Worked with 5+ programming languages | `languagesDetected.length >= 5` |
| **Streak Master** | fire icon | Maintained a 7+ day coding streak | `longestStreak >= 7` |
| **Marathon Runner** | runner icon | Single session lasting 2+ hours | Any session with `(endTime - startTime) > 120 minutes` |
| **Tool Wielder** | wrench icon | Used 500+ tool calls | `totalToolCalls >= 500` |
| **Bug Squasher** | bug icon | 100+ debugging prompts | 100+ user messages containing any of: `debug`, `fix`, `bug`, `error`, `broken`, `crash` |
| **Speed Demon** | lightning icon | Average response gap under 30 seconds | Median gap between consecutive user messages within sessions < 30 seconds |

**Speed Demon median calculation**: Collects all gaps (in seconds) between consecutive user messages within each session, sorts them, and computes the true median (average of two middle values for even-length arrays, middle value for odd).

---

## Dashboard Tiles

The dashboard at `/wrapped` uses a bento-grid layout with an Overview tab and a Sessions tab.

### Overview Tab Tiles

| Tile | Component | Data source | What it displays |
|------|-----------|-------------|-----------------|
| **Stat Strip** | `stat-strip.tsx` | `RawStats` | Top-level numbers: sessions, prompts, tokens, tool calls, active days, date range |
| **Your Vibe** | `vibe-tile.tsx` | `VibeScores` | Overall vibe score as a circular progress ring, vibe label, and description. Links to the scroll story. |
| **Cost** | `cost-tile.tsx` | `CostEstimate` | Total estimated cost, token distribution bar (input/output/cache), per-model breakdown |
| **AI Treatment** | `treatment-tile.tsx` | `AITreatmentScore` | Overall score, mini progress bars for each sub-score (Politeness, Patience, Gratitude, Frustration — inverted so higher bar = more frustration), assassination list risk label |
| **When You Code** | `time-tile.tsx` | `CodingTimePattern` | Time pattern label, 24-bar hour distribution chart, 7-bar day-of-week distribution chart |
| **Tool Usage** | `tools-tile.tsx` | `RawStats` + `CodeImpact` | Top 10 tools as horizontal bars, total tool call count, overall error rate |
| **Prompt Personality** | `personality-tile.tsx` | `PromptPersonality` | Prompt length label, question vs command ratio bar, top 5 favorite words, context provider ratio, mind change count |
| **Projects** | `projects-tile.tsx` | `RawStats` | Ranked list of projects by session count (basenames only), top git branches |
| **Code Impact** | `code-impact-tile.tsx` | `CodeImpact` | Unique files touched count, language breakdown bar, task type breakdown, error rate |
| **Productivity** | `productivity-tile.tsx` | `ProductivityStats` | Average cost/session, most expensive session, success rate, prompt-to-fix ratio, median response gap, average iteration speed |
| **Engagement** | `engagement-tile.tsx` | `EngagementStats` | Current/longest streak, peak day, average conversation depth, self-sufficiency trend with directional arrow, high-token session count, multi-tasking score |
| **Achievements** | `achievements-tile.tsx` | `Achievements` | Hours saved estimate, usage percentile with gradient, badge grid (unlocked shown first, locked shown dimmed) |

**Note:** The dashboard previously included an Environment tile, but this has been removed.

### Sessions Tab

| Component | Data source | What it displays |
|-----------|-------------|-----------------|
| **Session Timeline** | `SessionAnalysis.timeline` | Daily activity chart (sessions and messages per day) |
| **Session Table** | `SessionAnalysis.sessions` | Sortable, filterable, paginated table (50 rows/page) with columns for date, project, duration, messages, tokens, tool calls, errors. Expandable rows show user prompt previews. Supports date range filtering and search. |
| **Session Trace Modal** | `SessionDetail.messages` | Full message log viewer opened from session rows. Shows role labels, message content (truncated to 2,000 chars), tool calls/results, error highlighting. Supports filtering by role, search, and pagination. |
