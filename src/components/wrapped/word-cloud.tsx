"use client"

import { TextAnimate } from "@/components/ui/text-animate"

interface WordCloudProps {
  words: Array<{ word: string; count: number }>
}

const sizeClasses = [
  "text-3xl font-bold",
  "text-2xl font-bold",
  "text-xl font-semibold",
  "text-lg font-semibold",
  "text-base font-medium",
  "text-sm",
]

const colorClasses = [
  "text-purple-400",
  "text-pink-400",
  "text-violet-400",
  "text-fuchsia-400",
  "text-indigo-400",
  "text-rose-400",
  "text-purple-300",
  "text-pink-300",
]

export function WordCloud({ words }: WordCloudProps) {
  if (words.length === 0) return null

  const maxCount = words[0]?.count ?? 1

  function getSizeClass(count: number): string {
    const ratio = count / maxCount
    if (ratio > 0.8) return sizeClasses[0]
    if (ratio > 0.6) return sizeClasses[1]
    if (ratio > 0.4) return sizeClasses[2]
    if (ratio > 0.25) return sizeClasses[3]
    if (ratio > 0.1) return sizeClasses[4]
    return sizeClasses[5]
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 max-w-2xl mx-auto">
      {words.slice(0, 15).map((w, i) => (
        <TextAnimate
          key={w.word}
          animation="blurInUp"
          by="text"
          delay={i * 0.08}
          once
          as="span"
          className={`${getSizeClass(w.count)} ${colorClasses[i % colorClasses.length]} inline-block`}
        >
          {w.word}
        </TextAnimate>
      ))}
    </div>
  )
}
