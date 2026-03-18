"use client"

import { useState } from "react"
import Link from "next/link"
import { createPortal } from "react-dom"
import type { VibeScores } from "@/lib/types"
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { Tile } from "./tile"
import { getPersonalityProfile } from "@/lib/analyzers/personality-profiles"

interface VibeTileProps {
  vibeScores: VibeScores
}

export function VibeTile({ vibeScores }: VibeTileProps) {
  const { overallVibe } = vibeScores
  const [showPersonality, setShowPersonality] = useState(false)
  const profile = getPersonalityProfile(overallVibe.label)

  return (
    <Tile
      title="Your Vibe"
      className="flex flex-col items-center text-center"
      infoTitle="How Your Vibe Score Works"
      infoContent={
        <>
          <p className="mb-3">Your Overall Vibe Score (0-100) is a weighted average of 10 individual scores, each computed from your prompt patterns:</p>
          <table className="w-full text-xs mb-4">
            <thead><tr className="border-b border-white/[0.06]"><th className="text-left py-1.5 text-white/40">Score</th><th className="text-left py-1.5 text-white/40">What It Measures</th></tr></thead>
            <tbody className="text-white/50">
              <tr className="border-b border-white/[0.03]"><td className="py-1.5">Chaos Energy</td><td>Topic switching between consecutive prompts</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1.5">Debuginator</td><td>Frequency of debug/fix/error keywords in prompts</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1.5">Boilerplate Goblin</td><td>Scaffolding/template/generate keyword frequency</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1.5">Overthinker Index</td><td>Questions and &quot;explain&quot;/&quot;why&quot; prompts ratio</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1.5">Ship It Factor</td><td>Session velocity (messages per minute)</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1.5">Docs Respecter</td><td>Documentation-related keyword frequency</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1.5">Stack Loyalty</td><td>Inverse of tech/framework name variety</td></tr>
              <tr className="border-b border-white/[0.03]"><td className="py-1.5">Prompt Clarity</td><td>Prompt length + specificity markers (file paths, code fences)</td></tr>
              <tr><td className="py-1.5">AI Dependency</td><td>Messages per active day</td></tr>
            </tbody>
          </table>
          <p className="mb-2 text-white/40 font-semibold">Vibe Labels</p>
          <p className="mb-1">Your label is assigned based on which scores dominate:</p>
          <ul className="space-y-1 text-white/40">
            <li><strong className="text-white/60">Chaotic Genius</strong> — High chaos + high ship it</li>
            <li><strong className="text-white/60">Silent Architect</strong> — Low chaos + high clarity</li>
            <li><strong className="text-white/60">Rubber Duck Supremacist</strong> — High overthinker</li>
            <li><strong className="text-white/60">The Eternal Debugger</strong> — High debuginator</li>
            <li><strong className="text-white/60">10x Goblin</strong> — High ship it + high AI dependency</li>
            <li><strong className="text-white/60">Copy-Paste Sorcerer</strong> — High boilerplate goblin</li>
            <li><strong className="text-white/60">The Micromanager</strong> — High clarity + low ship it</li>
            <li><strong className="text-white/60">LGTM Speedrunner</strong> — High ship it + low overthinker</li>
          </ul>
        </>
      }
    >
      {/* Clickable area for personality modal */}
      <button
        onClick={() => setShowPersonality(true)}
        className="group flex flex-col items-center transition-transform hover:scale-[1.02]"
      >
        <AnimatedCircularProgressBar
          value={overallVibe.value}
          max={100}
          gaugePrimaryColor="#a855f7"
          gaugeSecondaryColor="#1a0a2e"
          className="mb-4"
        />
        <h3 className="mb-1 text-xl font-bold text-white/90">{overallVibe.label}</h3>
        <p className="mt-1 mb-1 text-sm text-white/40">{profile.tagline}</p>
        <p className="text-[11px] text-purple-400/50 group-hover:text-purple-400/80 transition-colors">
          Click to see your full personality profile
        </p>
      </button>

      {/* Play Your Wrapped button — separate, not inside the clickable area */}
      <div className="mt-4">
        <Link href="/wrapped/story">
          <ShimmerButton
            shimmerColor="#a855f7"
            background="rgba(168, 85, 247, 0.15)"
            className="text-sm font-semibold"
          >
            Play Your Wrapped
          </ShimmerButton>
        </Link>
      </div>

      {/* Personality Modal */}
      {showPersonality && (
        <PersonalityModal
          profile={profile}
          vibeScores={vibeScores}
          onClose={() => setShowPersonality(false)}
        />
      )}
    </Tile>
  )
}

function PersonalityModal({
  profile,
  vibeScores,
  onClose,
}: {
  profile: ReturnType<typeof getPersonalityProfile>
  vibeScores: VibeScores
  onClose: () => void
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-[3vh]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-2xl max-h-[94vh] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="border-b border-white/[0.06] px-6 py-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-white">{vibeScores.overallVibe.label}</h2>
          <p className="text-xs text-white/25 mt-0.5">a.k.a. {profile.archetype}</p>
          <p className="mt-1 text-sm text-white/40 italic">&ldquo;{profile.tagline}&rdquo;</p>
          <p className="mt-2 text-3xl font-black text-purple-400">{vibeScores.overallVibe.value}<span className="text-lg text-purple-400/50">/100</span></p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* The Roast */}
          <Section title="The Roast" icon="🔥">
            <p className="text-white/70 italic leading-relaxed">&ldquo;{profile.selectedRoast}&rdquo;</p>
          </Section>

          {/* The Compliment */}
          <Section title="The Compliment" icon="💜">
            <p className="text-white/70 italic leading-relaxed">&ldquo;{profile.selectedCompliment}&rdquo;</p>
          </Section>

          {/* Strengths */}
          <Section title="Top 3 Strengths" icon="💪">
            <ul className="space-y-2">
              {profile.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/60">
                  <span className="shrink-0 text-emerald-400/70">{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ul>
          </Section>

          {/* Weaknesses */}
          <Section title="Top 3 Blind Spots" icon="👀">
            <ul className="space-y-2">
              {profile.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/60">
                  <span className="shrink-0 text-red-400/70">{i + 1}.</span>
                  {w}
                </li>
              ))}
            </ul>
          </Section>

          {/* Habits & Quirks */}
          <Section title="Habits & Quirks" icon="🎯">
            <ul className="space-y-1.5">
              {profile.habits.map((h, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/50">
                  <span className="shrink-0 text-white/20">•</span>
                  {h}
                </li>
              ))}
            </ul>
          </Section>

          {/* Things to Improve */}
          <Section title="Things to Improve" icon="📈">
            <ul className="space-y-2">
              {profile.improvements.map((imp, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/60">
                  <span className="shrink-0 text-yellow-400/70">→</span>
                  {imp}
                </li>
              ))}
            </ul>
          </Section>

          {/* Vibe Score Breakdown */}
          <Section title="Your Score Breakdown" icon="📊">
            <div className="grid grid-cols-2 gap-2">
              {([
                ["Chaos Energy", vibeScores.chaosEnergy],
                ["Debuginator", vibeScores.debuginator],
                ["Boilerplate Goblin", vibeScores.boilerplateGoblin],
                ["Overthinker Index", vibeScores.overthinkerIndex],
                ["Ship It Factor", vibeScores.shipItFactor],
                ["Docs Respecter", vibeScores.docsRespecter],
                ["Stack Loyalty", vibeScores.stackLoyalty],
                ["Prompt Clarity", vibeScores.promptClarity],
                ["AI Dependency", vibeScores.aiDependency],
              ] as const).map(([name, score]) => (
                <div key={name} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2">
                  <span className="text-xs text-white/40">{name}</span>
                  <span className="text-sm font-bold text-white/70">{score.value}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/80">
        <span>{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}
