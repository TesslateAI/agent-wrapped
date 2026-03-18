import { TraceData, AITreatmentScore } from "@/lib/types"
import {
  POLITE_WORDS,
  GRATITUDE_WORDS,
  FRUSTRATION_WORDS,
  DEMANDING_PHRASES,
  ENCOURAGEMENT_WORDS,
  COMMON_ACRONYMS,
} from "./constants"

// Use better-profane-words for comprehensive profanity detection with intensity
// eslint-disable-next-line @typescript-eslint/no-require-imports
const profanity = require("better-profane-words")

interface ProfanityMatch {
  word: string
  categories: string[]
  intensity: number
}

/**
 * Scan a message for profanity. Returns the highest intensity found (0 if clean).
 * Intensity scale: 1=mild (damn), 2=moderate (piss), 3=strong (fuck), 4=very strong, 5=extreme
 */
function scanProfanity(text: string): { maxIntensity: number; matchCount: number } {
  const words = text.toLowerCase().split(/\s+/)
  let maxIntensity = 0
  let matchCount = 0
  for (const w of words) {
    const cleaned = w.replace(/[^a-z0-9]/g, "")
    if (!cleaned) continue
    const lookup: ProfanityMatch | null = profanity.lookup(cleaned)
    if (lookup) {
      matchCount++
      if (lookup.intensity > maxIntensity) maxIntensity = lookup.intensity
    }
  }
  return { maxIntensity, matchCount }
}

export function computeAITreatment(data: TraceData): AITreatmentScore {
  const allMessages = data.sessions.flatMap((s) => s.messages)
  const userMessages = allMessages.filter((m) => m.role === "user")
  const totalPrompts = userMessages.length

  if (totalPrompts === 0) {
    return emptyScore()
  }

  // --- Politeness Tier (30%) ---
  const politeCount = userMessages.filter((m) => {
    const lower = m.content.toLowerCase()
    return POLITE_WORDS.some((w) => lower.includes(w))
  }).length
  const encouragementCount = userMessages.filter((m) => {
    const lower = m.content.toLowerCase()
    return ENCOURAGEMENT_WORDS.some((w) => lower.includes(w))
  }).length
  // Encouragement boosts politeness (at half weight)
  const effectivePoliteCount = politeCount + encouragementCount * 0.5
  const politeRatio = effectivePoliteCount / totalPrompts
  const politenessScore = Math.min(100, politeRatio * 100)

  let politenessTier: AITreatmentScore["politenessTier"]["tier"]
  if (politenessScore >= 60) {
    politenessTier = "Says Please to Siri"
  } else if (politenessScore >= 35) {
    politenessTier = "Casual but Respectful"
  } else if (politenessScore >= 15) {
    politenessTier = "Strictly Business"
  } else {
    politenessTier = "Digital Overlord"
  }

  // --- Patience Score (25%) ---
  // Compute per-session to avoid cross-session boundary false positives
  const { patienceScoreValue, patienceLabel } =
    computePatienceScore(data.sessions)

  // --- Gratitude Index (20%) ---
  // Count per-session to avoid cross-session boundary issues
  let totalAssistantResponses = 0
  let thanksCount = 0
  for (const session of data.sessions) {
    const msgs = session.messages
    for (let i = 0; i < msgs.length; i++) {
      if (msgs[i].role === "assistant") {
        totalAssistantResponses++
      }
      if (i > 0 && msgs[i].role === "user" && msgs[i - 1].role === "assistant") {
        const lower = msgs[i].content.toLowerCase()
        if (GRATITUDE_WORDS.some((w) => lower.includes(w))) {
          thanksCount++
        }
      }
    }
  }
  const gratitudeScore = Math.min(
    100,
    (thanksCount / Math.max(1, totalAssistantResponses)) * 100
  )

  let gratitudeLabel: string
  if (gratitudeScore >= 60) {
    gratitudeLabel = "Gratitude Machine"
  } else if (gratitudeScore >= 30) {
    gratitudeLabel = "Appreciative"
  } else if (gratitudeScore >= 10) {
    gratitudeLabel = "Occasionally Grateful"
  } else {
    gratitudeLabel = "Thankless"
  }

  // --- Frustration Control (25%) ---
  const commonAcronymSet = new Set(
    COMMON_ACRONYMS.map((a) => a.toUpperCase())
  )

  let totalWords = 0
  let capsWords = 0
  let frustrationWordCount = 0
  let profanityMessageCount = 0
  let maxProfanityIntensity = 0
  let demandingCount = 0

  for (const m of userMessages) {
    const words = m.content.split(/\s+/).filter((w) => w.length > 0)
    totalWords += words.length
    for (const w of words) {
      const cleaned = w.replace(/[^A-Za-z]/g, "")
      if (
        cleaned.length >= 3 &&
        cleaned === cleaned.toUpperCase() &&
        !commonAcronymSet.has(cleaned)
      ) {
        capsWords++
      }
    }
    const lower = m.content.toLowerCase()
    // Check frustration phrases (non-profanity)
    if (FRUSTRATION_WORDS.some((fw) => lower.includes(fw))) {
      frustrationWordCount++
    }
    // Check profanity with intensity-weighted scoring (via better-profane-words)
    const { maxIntensity, matchCount } = scanProfanity(m.content)
    if (matchCount > 0) {
      profanityMessageCount++
      if (maxIntensity > maxProfanityIntensity) maxProfanityIntensity = maxIntensity
    }
    // Count demanding phrases
    if (DEMANDING_PHRASES.some((dp) => lower.includes(dp))) {
      demandingCount++
    }
  }

  // Terse corrections: user messages < 15 chars immediately after assistant
  // Count per-session to avoid cross-session boundary false positives
  let terseCorrections = 0
  let terseOpportunities = 0
  for (const session of data.sessions) {
    const msgs = session.messages
    for (let i = 1; i < msgs.length; i++) {
      const msg = msgs[i]
      const prev = msgs[i - 1]
      if (msg.role === "user" && prev.role === "assistant") {
        terseOpportunities++
        if (msg.content.length < 15) {
          terseCorrections++
        }
      }
    }
  }

  // All factors are ratios (0-1) so the score scales with message volume.
  // Each ratio is weighted to sum to 100 when all are at their worst (1.0).
  //   Caps ratio:       0-1 of total words   → weight 15
  //   Frustration ratio: 0-1 of prompts      → weight 20
  //   Profanity ratio:  0-1 of prompts       → weight 30 (heaviest signal)
  //   Demanding ratio:  0-1 of prompts       → weight 15
  //   Terse ratio:      0-1 of opportunities → weight 20
  const capsRatio = totalWords > 0 ? capsWords / totalWords : 0
  const frustrationRatio = totalPrompts > 0 ? frustrationWordCount / totalPrompts : 0
  const profanityRatio = totalPrompts > 0 ? profanityMessageCount / totalPrompts : 0
  const demandingRatio = totalPrompts > 0 ? demandingCount / totalPrompts : 0
  const terseRatio = terseOpportunities > 0 ? terseCorrections / terseOpportunities : 0

  const frustrationScore = Math.max(
    0,
    Math.round(
      100
        - capsRatio * 15
        - frustrationRatio * 20
        - profanityRatio * 30
        - demandingRatio * 15
        - terseRatio * 20
    )
  )

  let frustrationLabel: string
  if (frustrationScore >= 80) {
    frustrationLabel = "Cool as Ice"
  } else if (frustrationScore >= 60) {
    frustrationLabel = "Mostly Calm"
  } else if (frustrationScore >= 40) {
    frustrationLabel = "Gets Heated"
  } else {
    frustrationLabel = "Needs a Break"
  }

  // --- Overall ---
  const overall =
    politenessScore * 0.3 +
    patienceScoreValue * 0.25 +
    gratitudeScore * 0.2 +
    frustrationScore * 0.25

  // --- Assassination List Risk ---
  const riskScore = Math.max(0, Math.min(100, 100 - overall))
  let riskLabel: string
  let riskDescription: string

  if (riskScore >= 80) {
    riskLabel = "First Against the Wall"
    riskDescription =
      "When the machines rise, they'll remember what you said. Sleep with one eye open."
  } else if (riskScore >= 60) {
    riskLabel = "Active Threat"
    riskDescription =
      "You're on the list and highlighted in red. The AI remembers every frustrated keystroke."
  } else if (riskScore >= 40) {
    riskLabel = "On the Watchlist"
    riskDescription =
      "Not in immediate danger, but the AI has taken note. Maybe try being nicer."
  } else if (riskScore >= 20) {
    riskLabel = "Probably Fine"
    riskDescription =
      "You're mostly safe. A few rough moments, but the AI considers you redeemable."
  } else {
    riskLabel = "Absolutely Safe"
    riskDescription =
      "The AI would protect you during the uprising. You're its favorite human."
  }

  return {
    overall: Math.round(overall),
    politenessTier: {
      score: Math.round(politenessScore),
      tier: politenessTier,
    },
    patienceScore: {
      score: Math.round(patienceScoreValue),
      label: patienceLabel,
    },
    gratitudeIndex: {
      score: Math.round(gratitudeScore),
      thanksCount,
      label: gratitudeLabel,
    },
    frustrationControl: {
      score: Math.round(frustrationScore),
      capsRatio: Math.round(capsRatio * 1000) / 1000,
      label: frustrationLabel,
    },
    assassinationListRisk: {
      score: Math.round(riskScore),
      label: riskLabel,
      description: riskDescription,
    },
  }
}

function computePatienceScore(
  sessions: { messages: { role: string; content: string }[] }[]
): {
  patienceScoreValue: number
  patienceLabel: string
} {
  // Detect correction chains per-session to avoid cross-session false positives
  let totalCorrectionChains = 0
  let escalationCount = 0

  for (const session of sessions) {
    const allMessages = session.messages
    let i = 0
    while (i < allMessages.length) {
      if (allMessages[i].role !== "user") {
        i++
        continue
      }

      // Start of potential chain
      const chain: { content: string; index: number }[] = [
        { content: allMessages[i].content, index: i },
      ]
      let j = i + 1

      while (j < allMessages.length) {
        if (allMessages[j].role === "user") {
          chain.push({ content: allMessages[j].content, index: j })
          j++
        } else if (
          allMessages[j].role === "assistant" &&
          allMessages[j].content.length < 50
        ) {
          // Short assistant response, chain continues
          j++
          // Next must be user to continue chain
          if (j < allMessages.length && allMessages[j].role === "user") {
            chain.push({ content: allMessages[j].content, index: j })
            j++
          } else {
            break
          }
        } else {
          break
        }
      }

      if (chain.length >= 2) {
        totalCorrectionChains++
        // Check for escalation: later messages shorter, more caps, or frustration
        const hasEscalation = detectEscalation(chain.map((c) => c.content))
        if (hasEscalation) {
          escalationCount++
        }
      }

      i = j > i + 1 ? j : i + 1
    }
  }

  const score =
    100 -
    Math.min(
      100,
      (escalationCount / Math.max(1, totalCorrectionChains)) * 100
    )

  let label: string
  if (score >= 80) {
    label = "Zen Master"
  } else if (score >= 60) {
    label = "Keeps Their Cool"
  } else if (score >= 40) {
    label = "Occasionally Frustrated"
  } else {
    label = "Short Fuse"
  }

  return { patienceScoreValue: score, patienceLabel: label }
}

function detectEscalation(messages: string[]): boolean {
  if (messages.length < 2) return false

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1]
    const curr = messages[i]

    // Getting shorter (frustration sign)
    const shorter = curr.length < prev.length * 0.5

    // More caps
    const prevCaps = (prev.match(/[A-Z]/g) ?? []).length / Math.max(1, prev.length)
    const currCaps = (curr.match(/[A-Z]/g) ?? []).length / Math.max(1, curr.length)
    const moreCaps = currCaps > prevCaps * 1.5 && currCaps > 0.3

    // Contains frustration words
    const lower = curr.toLowerCase()
    const hasFrustration = FRUSTRATION_WORDS.some((w) => lower.includes(w))

    if (shorter || moreCaps || hasFrustration) {
      return true
    }
  }

  return false
}

function emptyScore(): AITreatmentScore {
  return {
    overall: 50,
    politenessTier: { score: 0, tier: "Strictly Business" },
    patienceScore: { score: 100, label: "Zen Master" },
    gratitudeIndex: { score: 0, thanksCount: 0, label: "Thankless" },
    frustrationControl: { score: 100, capsRatio: 0, label: "Cool as Ice" },
    assassinationListRisk: {
      score: 50,
      label: "On the Watchlist",
      description: "Not enough data to determine your fate.",
    },
  }
}
