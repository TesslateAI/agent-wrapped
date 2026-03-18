"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWrapped } from "@/lib/store/wrapped-store"

export default function WrappedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { state } = useWrapped()
  const router = useRouter()

  useEffect(() => {
    if (!state.analysisResult) {
      router.push("/upload")
    }
  }, [state.analysisResult, router])

  if (!state.analysisResult) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen scroll-smooth">
      {children}
    </div>
  )
}
