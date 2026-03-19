"use client"

import { useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useWrapped } from "@/lib/store/wrapped-store"
import { ScrollProgress } from "@/components/ui/scroll-progress"
import { Confetti, type ConfettiRef } from "@/components/ui/confetti"
import { AuroraText } from "@/components/ui/aurora-text"
import { BlurFade } from "@/components/ui/blur-fade"
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list"
import { TextAnimate } from "@/components/ui/text-animate"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { BorderBeam } from "@/components/ui/border-beam"
import { ScrollSection } from "@/components/wrapped/scroll-section"
import { StatCard } from "@/components/wrapped/stat-card"
import { ScoreRing } from "@/components/wrapped/score-ring"
import { VibeLabelBadge } from "@/components/wrapped/vibe-label-badge"
import { TreatmentMeter } from "@/components/wrapped/treatment-meter"
import { TimeHeatmap } from "@/components/wrapped/time-heatmap"
import { WordCloud } from "@/components/wrapped/word-cloud"
import { getPersonalityProfile } from "@/lib/analyzers/personality-profiles"
import {
  trackStoryStarted,
  trackStorySectionViewed,
  trackStoryCompleted,
} from "@/lib/analytics/posthog"

function formatTokens(total: number): { value: number; suffix: string } {
  if (total >= 1_000_000) {
    return { value: Math.round(total / 100_000) / 10, suffix: "M" }
  }
  if (total >= 1_000) {
    return { value: Math.round(total / 100) / 10, suffix: "K" }
  }
  return { value: total, suffix: "" }
}

export default function WrappedStoryPage() {
  const { state } = useWrapped()
  const confettiRef = useRef<ConfettiRef>(null)

  const result = state.analysisResult

  useEffect(() => {
    if (!result) return
    const timer = setTimeout(() => {
      confettiRef.current?.fire({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.4, x: 0.5 },
      })
    }, 800)
    return () => clearTimeout(timer)
  }, [result])

  if (!result) return null

  const { rawStats, vibeScores, promptPersonality, aiTreatment, productivityStats, engagementStats, achievements, costEstimate } = result
  const tokens = formatTokens(rawStats.totalTokensUsed.total)
  const profile = getPersonalityProfile(vibeScores.overallVibe.label)

  const SECTION_NAMES = [
    "intro", "raw_stats", "your_impact", "time_patterns", "top_tools",
    "prompt_personality", "vibe_scores", "vibe_reveal", "roast_compliment",
    "ai_treatment", "achievements", "summary_cta",
  ] as const

  const trackSection = useCallback((index: number) => {
    trackStorySectionViewed({
      section_index: index,
      section_name: SECTION_NAMES[index],
    })
    if (index === 0) trackStoryStarted()
    if (index === SECTION_NAMES.length - 1) trackStoryCompleted()
  }, [])

  return (
    <main className="relative">
      {/* Back to Dashboard */}
      <Link
        href="/wrapped"
        className="fixed top-6 left-6 z-50 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/60 backdrop-blur-sm transition-colors hover:text-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Dashboard
      </Link>

      {/* Scroll progress bar */}
      <ScrollProgress className="h-1" />

      {/* Confetti canvas */}
      <Confetti
        ref={confettiRef}
        className="fixed inset-0 z-[100] pointer-events-none size-full"
        manualstart
      />

      {/* === Section 1: Intro === */}
      <ScrollSection onInView={() => trackSection(0)}>
        <BlurFade delay={0.2} inView>
          <div className="flex flex-col items-center gap-6 text-center">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              It&apos;s time
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black">
              <AuroraText
                colors={["#FF0080", "#7928CA", "#0070F3", "#38bdf8"]}
                speed={1.5}
              >
                Your Agent Wrapped is Ready
              </AuroraText>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Scroll down to discover how you&apos;ve been coding with AI
            </p>
            <div className="animate-bounce mt-8 text-muted-foreground">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
          </div>
        </BlurFade>
      </ScrollSection>

      {/* === Section 2: Raw Stats === */}
      <ScrollSection onInView={() => trackSection(1)}>
        <div className="w-full max-w-4xl space-y-8">
          <BlurFade delay={0.1} inView>
            <h2 className="text-4xl md:text-6xl lg:text-8xl font-black text-center bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              By the Numbers
            </h2>
          </BlurFade>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            <StatCard
              label="Total Sessions"
              value={rawStats.totalSessions}
              gradient="from-purple-400 to-pink-500"
            />
            <StatCard
              label="Total Messages"
              value={rawStats.totalMessages}
              gradient="from-purple-500 to-pink-400"
            />
            <StatCard
              label="Total Tokens"
              value={tokens.value}
              suffix={tokens.suffix}
              gradient="from-violet-400 to-fuchsia-500"
              decimalPlaces={tokens.suffix === "M" ? 1 : 0}
            />
            <StatCard
              label="Tool Calls"
              value={rawStats.totalToolCalls}
              gradient="from-pink-400 to-rose-500"
            />
            <StatCard
              label="Active Days"
              value={rawStats.activeDays}
              gradient="from-fuchsia-400 to-purple-500"
            />
            <StatCard
              label="Avg Prompts / Session"
              value={Math.round(rawStats.averagePromptsPerSession)}
              gradient="from-purple-300 to-pink-400"
            />
          </div>
        </div>
      </ScrollSection>

      {/* === Section 2.5: Your Impact === */}
      <ScrollSection onInView={() => trackSection(2)}>
        <div className="w-full max-w-4xl space-y-8">
          <BlurFade delay={0.1} inView>
            <h2 className="text-4xl md:text-6xl font-black text-center bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Your Impact
            </h2>
          </BlurFade>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            <StatCard
              label="Hours Saved"
              value={Math.round(achievements.hoursSaved)}
              gradient="from-emerald-400 to-teal-500"
            />
            <StatCard
              label="Estimated Cost"
              value={Math.round(costEstimate.totalCost)}
              suffix="$"
              gradient="from-teal-400 to-cyan-500"
            />
            <StatCard
              label="Longest Streak"
              value={engagementStats.longestStreak}
              suffix=" days"
              gradient="from-cyan-400 to-blue-500"
            />
            <StatCard
              label="Success Rate"
              value={Math.round(productivityStats.successRate * 100)}
              suffix="%"
              gradient="from-blue-400 to-indigo-500"
            />
            <StatCard
              label="Usage Percentile"
              value={achievements.usagePercentile}
              suffix="%"
              gradient="from-indigo-400 to-purple-500"
            />
            <StatCard
              label="Frameworks Used"
              value={result.codeImpact.frameworksDetected.length}
              gradient="from-purple-400 to-violet-500"
            />
          </div>
        </div>
      </ScrollSection>

      {/* === Section 3: Time Patterns === */}
      <ScrollSection onInView={() => trackSection(3)}>
        <div className="w-full flex flex-col items-center gap-8">
          <BlurFade delay={0.1} inView>
            <p className="text-sm uppercase tracking-widest text-muted-foreground text-center mb-4">
              When You Code
            </p>
          </BlurFade>
          <TimeHeatmap
            hourDistribution={rawStats.codingTimePatterns.hourDistribution}
            dayDistribution={rawStats.codingTimePatterns.dayDistribution}
            label={rawStats.codingTimePatterns.label}
          />
        </div>
      </ScrollSection>

      {/* === Section 4: Top Tools === */}
      <ScrollSection onInView={() => trackSection(4)}>
        <div className="w-full max-w-lg space-y-8">
          <BlurFade delay={0.1} inView>
            <h2 className="text-4xl md:text-6xl font-black text-center bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Your Favorite Tools
            </h2>
          </BlurFade>
          <AnimatedList delay={600} className="w-full">
            {rawStats.topToolsUsed.slice(0, 5).map((tool, i) => (
              <AnimatedListItem key={tool.name}>
                <div className="flex items-center justify-between w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-orange-400">#{i + 1}</span>
                    <span className="font-medium text-white">{tool.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {tool.count.toLocaleString()} calls
                  </span>
                </div>
              </AnimatedListItem>
            ))}
          </AnimatedList>
        </div>
      </ScrollSection>

      {/* === Section 5: Prompt Personality === */}
      <ScrollSection onInView={() => trackSection(5)}>
        <div className="w-full max-w-4xl space-y-8">
          <BlurFade delay={0.1} inView>
            <h2 className="text-4xl md:text-6xl font-black text-center bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
              How You Prompt
            </h2>
          </BlurFade>

          <div className="space-y-8">
            <WordCloud words={promptPersonality.favoriteWords} />

            <div className="flex flex-col items-center gap-3 mt-4 mb-6">
              <p className="text-sm text-muted-foreground">You are a</p>
              <h3 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {promptPersonality.promptLengthLabel}
              </h3>
              <p className="text-sm text-muted-foreground">
                Changed your mind {promptPersonality.mindChangeCount} time{promptPersonality.mindChangeCount !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                label="Questions Asked"
                value={Math.round(promptPersonality.questionRatio * 100)}
                suffix="%"
                gradient="from-purple-400 to-pink-400"
              />
              <StatCard
                label="Commands Given"
                value={Math.round(promptPersonality.commandRatio * 100)}
                suffix="%"
                gradient="from-fuchsia-400 to-violet-500"
              />
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* === Section 6: Vibe Scores Grid === */}
      <ScrollSection onInView={() => trackSection(6)}>
        <div className="w-full max-w-5xl space-y-8">
          <BlurFade delay={0.1} inView>
            <h2 className="text-4xl md:text-6xl font-black text-center bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              Your Vibe Scores
            </h2>
          </BlurFade>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            <ScoreRing
              score={vibeScores.chaosEnergy.value}
              label="Chaos Energy"
              description={vibeScores.chaosEnergy.description}
              gaugePrimaryColor="#8B5CF6"
              gaugeSecondaryColor="#1a1a2e"
            />
            <ScoreRing
              score={vibeScores.debuginator.value}
              label="Debuginator"
              description={vibeScores.debuginator.description}
              gaugePrimaryColor="#06B6D4"
              gaugeSecondaryColor="#1a1a2e"
            />
            <ScoreRing
              score={vibeScores.boilerplateGoblin.value}
              label="Boilerplate Goblin"
              description={vibeScores.boilerplateGoblin.description}
              gaugePrimaryColor="#F59E0B"
              gaugeSecondaryColor="#1a1a2e"
            />
            <ScoreRing
              score={vibeScores.overthinkerIndex.value}
              label="Overthinker Index"
              description={vibeScores.overthinkerIndex.description}
              gaugePrimaryColor="#EC4899"
              gaugeSecondaryColor="#1a1a2e"
            />
            <ScoreRing
              score={vibeScores.shipItFactor.value}
              label="Ship It Factor"
              description={vibeScores.shipItFactor.description}
              gaugePrimaryColor="#10B981"
              gaugeSecondaryColor="#1a1a2e"
            />
            <ScoreRing
              score={vibeScores.docsRespecter.value}
              label="Docs Respecter"
              description={vibeScores.docsRespecter.description}
              gaugePrimaryColor="#3B82F6"
              gaugeSecondaryColor="#1a1a2e"
            />
            <ScoreRing
              score={vibeScores.stackLoyalty.value}
              label="Stack Loyalty"
              description={vibeScores.stackLoyalty.description}
              gaugePrimaryColor="#A855F7"
              gaugeSecondaryColor="#1a1a2e"
            />
            <ScoreRing
              score={vibeScores.promptClarity.value}
              label="Prompt Clarity"
              description={vibeScores.promptClarity.description}
              gaugePrimaryColor="#14B8A6"
              gaugeSecondaryColor="#1a1a2e"
            />
            <ScoreRing
              score={vibeScores.aiDependency.value}
              label="AI Dependency"
              description={vibeScores.aiDependency.description}
              gaugePrimaryColor="#F97316"
              gaugeSecondaryColor="#1a1a2e"
            />
          </div>
        </div>
      </ScrollSection>

      {/* === Section 7: Overall Vibe Reveal === */}
      <ScrollSection onInView={() => trackSection(7)}>
        <div className="relative w-full flex flex-col items-center justify-center">
          <BlurFade delay={0.3} inView>
            <VibeLabelBadge
              label={vibeScores.overallVibe.label}
              score={vibeScores.overallVibe.value}
            />
          </BlurFade>
          <BlurFade delay={0.8} inView>
            <p className="text-sm text-muted-foreground text-center mt-6 max-w-md">
              {vibeScores.overallVibe.description}
            </p>
          </BlurFade>
        </div>
      </ScrollSection>

      {/* === Section 7.5: The Roast & Compliment === */}
      <ScrollSection onInView={() => trackSection(8)}>
        <div className="w-full max-w-2xl space-y-12">
          <BlurFade delay={0.2} inView>
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">The Roast</p>
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
                <p className="text-lg md:text-2xl font-medium text-white/80 italic leading-relaxed">
                  &ldquo;{profile.selectedRoast}&rdquo;
                </p>
                <p className="mt-4 text-3xl">🔥</p>
              </div>
            </div>
          </BlurFade>
          <BlurFade delay={0.6} inView>
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">The Compliment</p>
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-8">
                <p className="text-lg md:text-2xl font-medium text-white/80 italic leading-relaxed">
                  &ldquo;{profile.selectedCompliment}&rdquo;
                </p>
                <p className="mt-4 text-3xl">💜</p>
              </div>
            </div>
          </BlurFade>
        </div>
      </ScrollSection>

      {/* === Section 8: AI Treatment === */}
      <ScrollSection onInView={() => trackSection(9)}>
        <div className="w-full max-w-2xl space-y-8">
          <BlurFade delay={0.1} inView>
            <h2 className="text-4xl md:text-6xl font-black text-center bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              How You Treat Your AI
            </h2>
          </BlurFade>

          <div className="space-y-6">
            <TreatmentMeter
              label="Politeness"
              score={aiTreatment.politenessTier.score}
              tier={aiTreatment.politenessTier.tier}
            />
            <TreatmentMeter
              label="Patience"
              score={aiTreatment.patienceScore.score}
              tier={aiTreatment.patienceScore.label}
            />
            <TreatmentMeter
              label="Gratitude"
              score={aiTreatment.gratitudeIndex.score}
              tier={aiTreatment.gratitudeIndex.label}
            />
            <TreatmentMeter
              label="Frustration Control"
              score={aiTreatment.frustrationControl.score}
              tier={aiTreatment.frustrationControl.label}
            />
          </div>

          {/* Assassination List Risk */}
          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              AI Assassination List Risk
            </p>
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8 w-full">
              <BorderBeam
                size={80}
                duration={8}
                colorFrom="#ef4444"
                colorTo="#f97316"
              />
              <p className="text-5xl md:text-7xl font-black text-red-400">
                {aiTreatment.assassinationListRisk.score}
                <span className="text-2xl md:text-3xl text-red-400/50">/100</span>
              </p>
              <h3 className="text-2xl md:text-4xl font-black mt-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                {aiTreatment.assassinationListRisk.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto">
                {aiTreatment.assassinationListRisk.description}
              </p>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* === Section 8.5: Achievements === */}
      <ScrollSection onInView={() => trackSection(10)}>
        <div className="w-full max-w-3xl space-y-8">
          <BlurFade delay={0.1} inView>
            <h2 className="text-4xl md:text-6xl font-black text-center bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Achievements Unlocked
            </h2>
          </BlurFade>
          <BlurFade delay={0.3} inView>
            <div className="flex flex-wrap justify-center gap-4">
              {achievements.badges.filter(b => b.unlocked).map((badge) => (
                <div key={badge.id} className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 w-28">
                  <span className="text-3xl">{badge.icon}</span>
                  <span className="text-xs font-semibold text-white/80 text-center">{badge.name}</span>
                </div>
              ))}
            </div>
          </BlurFade>
          {achievements.badges.filter(b => !b.unlocked).length > 0 && (
            <BlurFade delay={0.5} inView>
              <p className="text-center text-sm text-muted-foreground">
                {achievements.badges.filter(b => !b.unlocked).length} more to unlock
              </p>
            </BlurFade>
          )}
        </div>
      </ScrollSection>

      {/* === Section 9: Summary CTA === */}
      <ScrollSection onInView={() => trackSection(11)}>
        <div className="flex flex-col items-center gap-8 text-center">
          <BlurFade delay={0.2} inView>
            <h2 className="text-4xl md:text-6xl font-black text-white">
              See Your Summary Card
            </h2>
            <p className="text-muted-foreground mt-2">
              Get a shareable screenshot of your coding vibe
            </p>
          </BlurFade>
          <BlurFade delay={0.5} inView>
            <Link href="/wrapped/summary">
              <ShimmerButton
                shimmerColor="#A97CF8"
                background="linear-gradient(135deg, #7928CA 0%, #FF0080 100%)"
                className="text-lg px-10 py-4 font-bold"
              >
                View Summary Card
              </ShimmerButton>
            </Link>
          </BlurFade>
          <BlurFade delay={0.7} inView>
            <Link
              href="/upload"
              className="text-sm text-muted-foreground hover:text-white transition-colors underline underline-offset-4"
            >
              or start over
            </Link>
          </BlurFade>
        </div>
      </ScrollSection>
    </main>
  )
}
