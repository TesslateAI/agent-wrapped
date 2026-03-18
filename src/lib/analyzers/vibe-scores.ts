import { TraceData, VibeScores, VibeLabel } from "@/lib/types"
import {
  DEBUG_KEYWORDS,
  SCAFFOLD_KEYWORDS,
  DOC_KEYWORDS,
  STOPWORDS,
  TECH_NAMES,
} from "./constants"

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

export function computeVibeScores(data: TraceData): VibeScores {
  const allMessages = data.sessions.flatMap((s) => s.messages)
  const userMessages = allMessages.filter((m) => m.role === "user")
  const totalUserMessages = userMessages.length

  if (totalUserMessages === 0) {
    return emptyVibeScores()
  }

  // --- Chaos Energy ---
  let topicSwitches = 0
  for (const session of data.sessions) {
    const sessionUserMsgs = session.messages.filter((m) => m.role === "user")
    for (let i = 1; i < sessionUserMsgs.length; i++) {
      const prevWords = getContentWords(sessionUserMsgs[i - 1].content)
      const currWords = getContentWords(sessionUserMsgs[i].content)
      const overlap = prevWords.filter((w) => currWords.includes(w))
      if (overlap.length === 0) {
        topicSwitches++
      }
    }
  }
  const chaosValue = clamp((topicSwitches / totalUserMessages) * 200)

  // --- Debuginator ---
  const debugMessages = userMessages.filter((m) =>
    containsAnyKeyword(m.content, DEBUG_KEYWORDS)
  ).length
  const debugValue = clamp((debugMessages / totalUserMessages) * 200)

  // --- Boilerplate Goblin ---
  const scaffoldMessages = userMessages.filter((m) =>
    containsAnyKeyword(m.content, SCAFFOLD_KEYWORDS)
  ).length
  const boilerplateValue = clamp(
    (scaffoldMessages / totalUserMessages) * 300
  )

  // --- Overthinker Index ---
  const explainMessages = userMessages.filter((m) => {
    const lower = m.content.toLowerCase()
    return (
      m.content.trim().endsWith("?") ||
      lower.includes("explain") ||
      lower.includes("why ") ||
      lower.includes("how does")
    )
  }).length
  const overthinkerValue = clamp(
    (explainMessages / totalUserMessages) * 200
  )

  // --- Ship It Factor ---
  let totalVelocity = 0
  let sessionCount = 0
  for (const session of data.sessions) {
    const start = new Date(session.startTime).getTime()
    const end = new Date(session.endTime).getTime()
    const durationMin = (end - start) / 60000
    if (durationMin > 0) {
      const msgCount = session.messages.length
      totalVelocity += msgCount / durationMin
      sessionCount++
    }
  }
  const avgVelocity = sessionCount > 0 ? totalVelocity / sessionCount : 0
  const shipItValue = clamp(avgVelocity * 20)

  // --- Docs Respecter ---
  const docMessages = userMessages.filter((m) =>
    containsAnyKeyword(m.content, DOC_KEYWORDS)
  ).length
  const docsValue = clamp((docMessages / totalUserMessages) * 400)

  // --- Stack Loyalty ---
  const allUserText = userMessages.map((m) => m.content.toLowerCase()).join(" ")
  const uniqueTechs = TECH_NAMES.filter((tech) =>
    allUserText.includes(tech.toLowerCase())
  ).length
  const stackLoyaltyValue = clamp(100 - uniqueTechs * 10)

  // --- Prompt Clarity ---
  const avgLength =
    userMessages.reduce((sum, m) => sum + m.content.length, 0) /
    totalUserMessages
  const specificityCount = userMessages.filter((m) => {
    const content = m.content
    return (
      /[/\\][\w.-]+/.test(content) || // file paths
      content.includes("```") || // code fences
      /line\s+\d+/i.test(content) // line numbers
    )
  }).length
  const specificityRatio = specificityCount / totalUserMessages
  const promptClarityValue = clamp(avgLength / 5 + specificityRatio * 50)

  // --- AI Dependency ---
  const uniqueDays = new Set<string>()
  for (const m of allMessages) {
    if (m.timestamp) {
      uniqueDays.add(m.timestamp.slice(0, 10))
    }
  }
  const activeDays = Math.max(1, uniqueDays.size)
  const messagesPerDay = allMessages.length / activeDays
  const aiDependencyValue = clamp(messagesPerDay * 2)

  // --- Overall Vibe ---
  const scores = {
    chaos: chaosValue,
    debug: debugValue,
    boilerplate: boilerplateValue,
    overthinker: overthinkerValue,
    shipIt: shipItValue,
    docs: docsValue,
    stackLoyalty: stackLoyaltyValue,
    promptClarity: promptClarityValue,
    aiDependency: aiDependencyValue,
  }

  const overallValue = clamp(
    (chaosValue +
      debugValue +
      boilerplateValue +
      overthinkerValue +
      shipItValue +
      docsValue +
      stackLoyaltyValue +
      promptClarityValue +
      aiDependencyValue) /
      9
  )

  const label = determineVibeLabel(scores)

  return {
    chaosEnergy: {
      value: Math.round(chaosValue),
      description: chaosValue > 60
        ? "Your conversations jump around like a caffeinated squirrel."
        : chaosValue > 30
        ? "You dabble in chaos but mostly stay on track."
        : "You're focused and methodical. Almost suspiciously so.",
    },
    debuginator: {
      value: Math.round(debugValue),
      description: debugValue > 60
        ? "You and bugs are in a toxic relationship."
        : debugValue > 30
        ? "You fix things often enough to keep the lights on."
        : "Either your code is perfect or you're in denial.",
    },
    boilerplateGoblin: {
      value: Math.round(boilerplateValue),
      description: boilerplateValue > 60
        ? "You generate more scaffolding than an architect."
        : boilerplateValue > 30
        ? "You scaffold a healthy amount."
        : "You prefer writing things from scratch. Respect.",
    },
    overthinkerIndex: {
      value: Math.round(overthinkerValue),
      description: overthinkerValue > 60
        ? "You ask 'but why?' more than a curious toddler."
        : overthinkerValue > 30
        ? "You think before you code. Novel concept."
        : "You trust the process and ship without looking back.",
    },
    shipItFactor: {
      value: Math.round(shipItValue),
      description: shipItValue > 60
        ? "You move fast and let CI catch the broken things."
        : shipItValue > 30
        ? "A reasonable pace. Your PM is cautiously optimistic."
        : "You take your time. Artisanal, hand-crafted code.",
    },
    docsRespecter: {
      value: Math.round(docsValue),
      description: docsValue > 60
        ? "You actually write documentation. Are you real?"
        : docsValue > 30
        ? "You document sometimes. Better than most."
        : "Documentation is for future-you to worry about.",
    },
    stackLoyalty: {
      value: Math.round(stackLoyaltyValue),
      description: stackLoyaltyValue > 60
        ? "You've found your tools and you're sticking with them."
        : stackLoyaltyValue > 30
        ? "You explore but have your favorites."
        : "You collect frameworks like Pokemon cards.",
    },
    promptClarity: {
      value: Math.round(promptClarityValue),
      description: promptClarityValue > 60
        ? "Your prompts come with file paths, line numbers, and a thesis statement."
        : promptClarityValue > 30
        ? "Your prompts give enough context to work with."
        : "Your prompts are... minimalist. Bold strategy.",
    },
    aiDependency: {
      value: Math.round(aiDependencyValue),
      description: aiDependencyValue > 60
        ? "You and your AI are basically pair programming 24/7."
        : aiDependencyValue > 30
        ? "You use AI as a helpful companion, not a crutch."
        : "You barely need AI. Why are you even here?",
    },
    overallVibe: {
      value: Math.round(overallValue),
      label,
      description: getVibeDescription(label),
    },
  }
}

function containsAnyKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw))
}

function getContentWords(content: string): string[] {
  return content
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 0 && !STOPWORDS.has(w))
}

function determineVibeLabel(scores: {
  chaos: number
  debug: number
  boilerplate: number
  overthinker: number
  shipIt: number
  docs: number
  stackLoyalty: number
  promptClarity: number
  aiDependency: number
}): VibeLabel {
  // Find dominant score
  if (scores.chaos > 50 && scores.shipIt > 50) return "Chaotic Genius"
  if (scores.chaos < 30 && scores.promptClarity > 50) return "Silent Architect"
  if (scores.overthinker > 50) return "Rubber Duck Supremacist"
  if (scores.debug > 50) return "The Eternal Debugger"
  if (scores.shipIt > 50 && scores.aiDependency > 50) return "10x Goblin"
  if (scores.boilerplate > 50) return "Copy-Paste Sorcerer"
  if (scores.promptClarity > 50 && scores.shipIt < 30) return "The Micromanager"
  return "LGTM Speedrunner"
}

function getVibeDescription(label: VibeLabel): string {
  switch (label) {
    case "Chaotic Genius":
      return "You jump between topics at light speed and somehow ship anyway. Unhinged but effective."
    case "Silent Architect":
      return "Methodical, clear, and focused. You know exactly what you want and communicate it precisely."
    case "Rubber Duck Supremacist":
      return "You use AI as your thinking partner, asking questions to understand, not just to get code."
    case "The Eternal Debugger":
      return "Your sessions are an endless war against bugs. You will win. Eventually."
    case "10x Goblin":
      return "You ship at breakneck speed with heavy AI assistance. The future is now."
    case "Copy-Paste Sorcerer":
      return "You conjure entire projects from scaffolding and templates. Why write when you can generate?"
    case "The Micromanager":
      return "Every prompt is detailed and precise, but you take your sweet time. Quality over speed."
    case "LGTM Speedrunner":
      return "You approve and move on. Speed is your love language."
  }
}

function emptyVibeScores(): VibeScores {
  const empty = { value: 0, description: "Not enough data to compute." }
  return {
    chaosEnergy: empty,
    debuginator: empty,
    boilerplateGoblin: empty,
    overthinkerIndex: empty,
    shipItFactor: empty,
    docsRespecter: empty,
    stackLoyalty: empty,
    promptClarity: empty,
    aiDependency: empty,
    overallVibe: { ...empty, label: "LGTM Speedrunner" as VibeLabel },
  }
}
