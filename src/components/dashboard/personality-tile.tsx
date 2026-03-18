"use client"

import { useState } from "react"
import type { PromptPersonality } from "@/lib/types"
import { Tile } from "./tile"

interface PersonalityTileProps {
  promptPersonality: PromptPersonality
}

export function PersonalityTile({ promptPersonality }: PersonalityTileProps) {
  const {
    promptLengthLabel,
    questionRatio,
    commandRatio,
    favoriteWords,
    contextProviderRatio,
    mindChangeCount,
  } = promptPersonality

  const [showAllWords, setShowAllWords] = useState(false)
  const visibleWords = showAllWords ? favoriteWords : favoriteWords.slice(0, 5)

  return (
    <Tile
      title="Prompt Personality"
      infoTitle="How Prompt Personality is Analyzed"
      infoContent={
        <>
          <p className="mb-3">Your prompt personality is derived from analyzing the text of all your user messages.</p>
          <p className="mb-2 text-white/40 font-semibold">Prompt Length Label</p>
          <table className="w-full text-xs mb-4">
            <thead><tr className="border-b border-white/[0.06]"><th className="text-left py-1 text-white/40">Label</th><th className="text-right py-1 text-white/40">Avg chars/prompt</th></tr></thead>
            <tbody className="text-white/50">
              <tr className="border-b border-white/[0.03]"><td className="py-1">Terse</td><td className="text-right">&lt; 30</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">Concise</td><td className="text-right">30 - 99</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1">Detailed</td><td className="text-right">100 - 299</td></tr>
              <tr><td className="py-1">Essay Writer</td><td className="text-right">300+</td></tr>
            </tbody>
          </table>
          <p className="mb-2 text-white/40 font-semibold">Other Metrics</p>
          <ul className="space-y-1 text-white/40">
            <li><strong className="text-white/60">Questions %</strong> — prompts ending with ? or starting with who/what/why/how/etc.</li>
            <li><strong className="text-white/60">Commands %</strong> — prompts starting with imperative verbs (fix, add, create, etc.)</li>
            <li><strong className="text-white/60">Favorite words</strong> — most frequent words after removing stopwords (the, a, is, etc.)</li>
            <li><strong className="text-white/60">Mind changes</strong> — prompts containing "actually", "wait", "never mind", "instead", etc.</li>
            <li><strong className="text-white/60">Context ratio</strong> — prompts containing code fences, file paths, or line numbers</li>
          </ul>
        </>
      }
    >
      <p className="mb-4 text-xl font-bold text-white/90">{promptLengthLabel}</p>

      {/* Question vs Command ratio bar */}
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs text-white/40">
          <span>Questions {(questionRatio * 100).toFixed(0)}%</span>
          <span>Commands {(commandRatio * 100).toFixed(0)}%</span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full">
          <div
            className="rounded-l-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-500"
            style={{ width: `${questionRatio * 100}%` }}
          />
          <div
            className="rounded-r-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
            style={{ width: `${commandRatio * 100}%` }}
          />
        </div>
      </div>

      {/* Favorite words */}
      {favoriteWords.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1.5 text-xs text-white/20">Favorite Words</h3>
          <div className="flex flex-wrap gap-1.5">
            {visibleWords.map((w) => (
              <span
                key={w.word}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-xs text-white/60"
              >
                {w.word}
                <span className="ml-1 text-white/20">{w.count}</span>
              </span>
            ))}
            {favoriteWords.length > 5 && (
              <button
                onClick={() => setShowAllWords((v) => !v)}
                className="text-[11px] text-purple-400/60 hover:text-purple-400 transition-colors"
              >
                {showAllWords ? "Show less" : `+${favoriteWords.length - 5} more`}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4 text-xs text-white/40">
        <span>
          Context: <span className="font-medium text-white/60">{(contextProviderRatio * 100).toFixed(0)}%</span>
        </span>
        <span>
          Mind changes: <span className="font-medium text-white/60">{mindChangeCount}</span>
        </span>
      </div>
    </Tile>
  )
}
