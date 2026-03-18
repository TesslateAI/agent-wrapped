import { TraceData, PromptPersonality } from "@/lib/types"
import {
  STOPWORDS,
  QUESTION_STARTERS,
  IMPERATIVE_VERBS,
  MIND_CHANGE_WORDS,
} from "./constants"

export function computePromptPersonality(data: TraceData): PromptPersonality {
  const allMessages = data.sessions.flatMap((s) => s.messages)
  const userMessages = allMessages.filter((m) => m.role === "user")
  const totalPrompts = userMessages.length

  if (totalPrompts === 0) {
    return {
      favoriteWords: [],
      averagePromptLength: 0,
      promptLengthLabel: "Terse",
      questionRatio: 0,
      commandRatio: 0,
      contextProviderRatio: 0,
      mindChangeCount: 0,
    }
  }

  // Favorite words
  const wordFreq = new Map<string, number>()
  for (const m of userMessages) {
    const words = m.content
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    for (const w of words) {
      wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1)
    }
  }
  const favoriteWords = Array.from(wordFreq.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  // Average prompt length
  const totalLength = userMessages.reduce(
    (sum, m) => sum + m.content.length,
    0
  )
  const averagePromptLength = totalLength / totalPrompts

  // Prompt length label
  let promptLengthLabel: PromptPersonality["promptLengthLabel"]
  if (averagePromptLength < 30) {
    promptLengthLabel = "Terse"
  } else if (averagePromptLength < 100) {
    promptLengthLabel = "Concise"
  } else if (averagePromptLength < 300) {
    promptLengthLabel = "Detailed"
  } else {
    promptLengthLabel = "Essay Writer"
  }

  // Question ratio
  const questionCount = userMessages.filter((m) => {
    const trimmed = m.content.trim()
    if (trimmed.endsWith("?")) return true
    const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase()
    return firstWord ? QUESTION_STARTERS.includes(firstWord) : false
  }).length
  const questionRatio = questionCount / totalPrompts

  // Command ratio
  const commandCount = userMessages.filter((m) => {
    const firstWord = m.content.trim().split(/\s+/)[0]?.toLowerCase()
    return firstWord ? IMPERATIVE_VERBS.includes(firstWord) : false
  }).length
  const commandRatio = commandCount / totalPrompts

  // Context provider ratio
  const contextCount = userMessages.filter((m) => {
    const content = m.content
    return (
      content.includes("```") ||
      /[./][\w-]+[./][\w.-]+/.test(content) || // file paths like ./foo/bar or src/lib/file.ts
      /line\s+\d+/i.test(content)
    )
  }).length
  const contextProviderRatio = contextCount / totalPrompts

  // Mind change count
  const mindChangeCount = userMessages.filter((m) => {
    const lower = m.content.toLowerCase()
    return MIND_CHANGE_WORDS.some((w) => lower.includes(w))
  }).length

  return {
    favoriteWords,
    averagePromptLength,
    promptLengthLabel,
    questionRatio,
    commandRatio,
    contextProviderRatio,
    mindChangeCount,
  }
}
