"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useInView } from "motion/react"
import { cn } from "@/lib/utils"

interface ScrollSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
  onInView?: () => void
}

export function ScrollSection({ children, className, delay = 0, onInView }: ScrollSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const firedRef = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    if (isInView && onInView && !firedRef.current) {
      firedRef.current = true
      onInView()
    }
  }, [isInView, onInView])

  if (prefersReducedMotion) {
    return (
      <div
        className={cn(
          "min-h-screen flex flex-col items-center justify-center px-4 py-16 relative",
          className
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={cn(
        "min-h-screen flex flex-col items-center justify-center px-4 py-16 relative",
        className
      )}
    >
      {children}
    </motion.div>
  )
}
