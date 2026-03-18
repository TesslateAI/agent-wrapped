"use client"

import { HyperText } from "@/components/ui/hyper-text"

interface ProcessingIndicatorProps {
  status: "parsing" | "analyzing"
}

const statusMessages: Record<ProcessingIndicatorProps["status"], string> = {
  parsing: "Reading your traces...",
  analyzing: "Crunching the numbers...",
}

export function ProcessingIndicator({ status }: ProcessingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-20">
      <HyperText
        as="h2"
        className="text-2xl font-bold text-white/90 md:text-3xl"
        duration={1200}
        animateOnHover={false}
      >
        {statusMessages[status]}
      </HyperText>

      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-purple-500 [animation-delay:0ms]" />
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-pink-500 [animation-delay:200ms]" />
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-purple-500 [animation-delay:400ms]" />
      </div>

      <p className="text-sm text-white/30">
        {status === "parsing"
          ? "Extracting sessions and messages..."
          : "Computing your vibe scores and personality..."}
      </p>
    </div>
  )
}
