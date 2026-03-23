"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { AuroraText } from "@/components/ui/aurora-text";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BlurFade } from "@/components/ui/blur-fade";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BorderBeam } from "@/components/ui/border-beam";
import { TextAnimate } from "@/components/ui/text-animate";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";

const VIBE_LABELS = [
  "Chaotic Genius",
  "Silent Architect",
  "Rubber Duck Supremacist",
  "The Eternal Debugger",
  "10x Goblin",
  "Copy-Paste Sorcerer",
  "LGTM Speedrunner",
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Upload your traces",
    description:
      "Drop your .claude/ directory files. JSONL, JSON, or ZIP. We read everything locally.",
  },
  {
    step: "02",
    title: "We crunch the numbers",
    description:
      "Prompt personality, vibe scores, AI treatment analysis — all computed in your browser.",
  },
  {
    step: "03",
    title: "Get your wrapped",
    description:
      "A cinematic, scrollable, screenshot-worthy breakdown of how you code with AI.",
  },
];

const SCORE_PREVIEWS = [
  { name: "Chaos Energy", value: 73, primary: "#f472b6", secondary: "#1a0a12" },
  { name: "Debuginator", value: 58, primary: "#818cf8", secondary: "#0a0a1a" },
  { name: "Ship It Factor", value: 91, primary: "#34d399", secondary: "#0a1a12" },
  { name: "AI Dependency", value: 84, primary: "#fb923c", secondary: "#1a120a" },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);

  return (
    <main className="relative bg-[#050505] selection:bg-purple-500/30 selection:text-white">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[40%] top-[10%] h-[600px] w-[600px] rounded-full bg-purple-600/[0.04] blur-[120px]" />
        <div className="absolute -right-[30%] top-[40%] h-[500px] w-[500px] rounded-full bg-blue-600/[0.04] blur-[120px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[400px] w-[400px] rounded-full bg-pink-600/[0.03] blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 md:px-12">
        <BlurFade delay={0.05}>
          <span className="flex items-center gap-2 text-sm font-semibold tracking-widest text-white/60 uppercase">
            <svg
              className="h-4 w-5"
              viewBox="0 0 161.9 126.66"
              fill="currentColor"
            >
              <path d="m13.45,46.48h54.06c10.21,0,16.68-10.94,11.77-19.89l-9.19-16.75c-2.36-4.3-6.87-6.97-11.77-6.97H22.41c-4.95,0-9.5,2.73-11.84,7.09L1.61,26.71c-4.79,8.95,1.69,19.77,11.84,19.77Z" />
              <path d="m61.05,119.93l26.95-46.86c5.09-8.85-1.17-19.91-11.37-20.12l-19.11-.38c-4.9-.1-9.47,2.48-11.91,6.73l-17.89,31.12c-2.47,4.29-2.37,9.6.25,13.8l10.05,16.13c5.37,8.61,17.98,8.39,23.04-.41Z" />
              <path d="m148.46,0h-54.06c-10.21,0-16.68,10.94-11.77,19.89l9.19,16.75c2.36,4.3,6.87,6.97,11.77,6.97h35.9c4.95,0,9.5-2.73,11.84-7.09l8.97-16.75C165.08,10.82,158.6,0,148.46,0Z" />
            </svg>
            Agent Wrapped
          </span>
        </BlurFade>
        <BlurFade delay={0.1}>
          <div className="flex items-center gap-3">
            <a
              href="https://studio.tesslate.com/import?repo=https://github.com/tesslateai/agent-wrapped"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-sm font-medium text-white/70 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              <svg
                className="h-3.5 w-4"
                viewBox="0 0 161.9 126.66"
                fill="currentColor"
              >
                <path d="m13.45,46.48h54.06c10.21,0,16.68-10.94,11.77-19.89l-9.19-16.75c-2.36-4.3-6.87-6.97-11.77-6.97H22.41c-4.95,0-9.5,2.73-11.84,7.09L1.61,26.71c-4.79,8.95,1.69,19.77,11.84,19.77Z" />
                <path d="m61.05,119.93l26.95-46.86c5.09-8.85-1.17-19.91-11.37-20.12l-19.11-.38c-4.9-.1-9.47,2.48-11.91,6.73l-17.89,31.12c-2.47,4.29-2.37,9.6.25,13.8l10.05,16.13c5.37,8.61,17.98,8.39,23.04-.41Z" />
                <path d="m148.46,0h-54.06c-10.21,0-16.68,10.94-11.77,19.89l9.19,16.75c2.36,4.3,6.87,6.97,11.77,6.97h35.9c4.95,0,9.5-2.73,11.84-7.09l8.97-16.75C165.08,10.82,158.6,0,148.46,0Z" />
              </svg>
              Edit with Studio
            </a>
            <Link
              href="/upload"
              className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-sm font-medium text-white/70 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              Get Started
            </Link>
          </div>
        </BlurFade>
      </nav>

      {/* ─── HERO ─── */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 flex min-h-[92vh] flex-col items-center justify-center px-6"
      >
        {/* Overline */}
        <BlurFade delay={0.15}>
          <div className="mb-6 flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium tracking-wide text-white/50">
              Now supporting Claude Code traces
            </span>
          </div>
        </BlurFade>

        {/* Main heading */}
        <BlurFade delay={0.25}>
          <h1 className="max-w-4xl text-center text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] font-bold tracking-tight">
            <span className="text-white">See how you </span>
            <AuroraText
              colors={["#c084fc", "#f472b6", "#818cf8", "#38bdf8"]}
              speed={1.2}
            >
              really
            </AuroraText>
            <br />
            <span className="text-white/40">code with AI.</span>
          </h1>
        </BlurFade>

        {/* Subheading */}
        <BlurFade delay={0.4}>
          <p className="mt-6 max-w-xl text-center text-lg leading-relaxed text-white/35 md:text-xl">
            Drop your agent traces and get a visual breakdown of your
            prompts, patterns, personality — and a roast.
          </p>
        </BlurFade>

        {/* CTA row */}
        <BlurFade delay={0.55}>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
            <Link href="/upload">
              <ShimmerButton
                shimmerColor="rgba(192, 132, 252, 0.6)"
                shimmerSize="0.08em"
                shimmerDuration="2.5s"
                background="linear-gradient(135deg, rgba(147, 51, 234, 0.25) 0%, rgba(126, 34, 206, 0.15) 100%)"
                borderRadius="12px"
                className="group relative px-8 py-4 text-base font-semibold"
              >
                <span className="relative z-10 flex items-center gap-2 text-white">
                  Upload Your Traces
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <path
                      d="M6 3L11 8L6 13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </ShimmerButton>
            </Link>
            <span className="text-sm text-white/25">No signup required</span>
          </div>
        </BlurFade>

        {/* Trust signals */}
        <BlurFade delay={0.7}>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] text-white/25">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              100% client-side
            </span>
            <span className="hidden h-3 w-px bg-white/10 sm:block" />
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
              Your data never leaves your browser
            </span>
            <span className="hidden h-3 w-px bg-white/10 sm:block" />
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
              </svg>
              No accounts, no tracking
            </span>
          </div>
        </BlurFade>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.15}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </motion.div>
      </motion.section>

      {/* ─── PREVIEW CARD ─── */}
      <section className="relative z-10 px-6 pb-32 pt-8">
        <BlurFade delay={0.1} inView>
          <div className="mx-auto max-w-3xl">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-px">
              <BorderBeam
                size={200}
                duration={8}
                colorFrom="#c084fc"
                colorTo="#f472b6"
                borderWidth={1}
              />
              <div className="rounded-[15px] bg-[#0a0a0a] p-6 sm:p-10">
                {/* Mock wrapped header */}
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium tracking-widest text-white/25 uppercase">
                      Your Vibe
                    </p>
                    <TextAnimate
                      as="h3"
                      by="character"
                      animation="blurIn"
                      className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl"
                      once
                    >
                      Chaotic Genius
                    </TextAnimate>
                  </div>
                  <AnimatedCircularProgressBar
                    value={78}
                    max={100}
                    gaugePrimaryColor="#c084fc"
                    gaugeSecondaryColor="#1a0a2e"
                    className="size-20 text-lg"
                  />
                </div>

                {/* Score grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {SCORE_PREVIEWS.map((score) => (
                    <div
                      key={score.name}
                      className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4"
                    >
                      <p className="text-[11px] font-medium tracking-wide text-white/30 uppercase">
                        {score.name}
                      </p>
                      <p className="mt-1.5 text-2xl font-bold tabular-nums text-white">
                        <NumberTicker value={score.value} delay={0.3} />
                      </p>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: score.primary }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${score.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mock bottom stats */}
                <div className="mt-6 flex items-center justify-between border-t border-white/[0.04] pt-5">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[11px] text-white/20">Sessions</p>
                      <p className="text-sm font-semibold text-white/60">142</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/20">Prompts</p>
                      <p className="text-sm font-semibold text-white/60">1,847</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/20">AI Treatment</p>
                      <p className="text-sm font-semibold text-emerald-400/70">
                        Probably Fine
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] text-white/15">
                    agent-wrapped.dev
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-white/20">
              ^ This is what yours could look like
            </p>
          </div>
        </BlurFade>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative z-10 px-6 py-28">
        <div className="mx-auto max-w-4xl">
          <BlurFade delay={0.1} inView>
            <p className="mb-3 text-center text-xs font-medium tracking-[0.2em] text-white/25 uppercase">
              How it works
            </p>
            <h2 className="text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
              Three steps. Zero friction.
            </h2>
          </BlurFade>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => (
              <BlurFade key={item.step} delay={0.15 + i * 0.1} inView>
                <div className="group relative rounded-xl border border-white/[0.04] bg-white/[0.015] p-6 transition-colors hover:border-white/[0.08] hover:bg-white/[0.025]">
                  <span className="text-3xl font-black tabular-nums text-white/[0.06]">
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-white/90">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/35">
                    {item.description}
                  </p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT YOU GET ─── */}
      <section className="relative z-10 px-6 py-28">
        <div className="mx-auto max-w-5xl">
          <BlurFade delay={0.1} inView>
            <p className="mb-3 text-center text-xs font-medium tracking-[0.2em] text-white/25 uppercase">
              What you get
            </p>
            <h2 className="text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
              More than just stats.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-base text-white/30">
              A full personality breakdown of how you use AI coding tools —
              the good, the bad, and the roast-worthy.
            </p>
          </BlurFade>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Raw Stats",
                desc: "Sessions, messages, tokens, tool calls, coding time patterns, active days",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="m7 16 4-8 4 4 4-12" />
                  </svg>
                ),
                accent: "from-purple-500/20 to-purple-500/0",
              },
              {
                title: "Vibe Scores",
                desc: "Chaos Energy, Debuginator, Ship It Factor, AI Dependency — 10 scores, 0-100",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
                  </svg>
                ),
                accent: "from-pink-500/20 to-pink-500/0",
              },
              {
                title: "Prompt Personality",
                desc: "Your favorite words, prompt length style, question vs command ratio",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14,2 14,8 20,8" />
                  </svg>
                ),
                accent: "from-blue-500/20 to-blue-500/0",
              },
              {
                title: "AI Treatment Score",
                desc: "Politeness tier, patience score, gratitude index — are the robots coming for you?",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="10" x="3" y="11" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" x2="8" y1="16" y2="16" /><line x1="16" x2="16" y1="16" y2="16" />
                  </svg>
                ),
                accent: "from-emerald-500/20 to-emerald-500/0",
              },
              {
                title: "The Vibe Label",
                desc: '"Chaotic Genius", "Rubber Duck Supremacist", "LGTM Speedrunner" — which one are you?',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5.8 11.3 2 22l10.7-3.79M4 3h.01M22 8h.01M15 2h.01M22 20h.01M22 2l-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
                  </svg>
                ),
                accent: "from-orange-500/20 to-orange-500/0",
              },
              {
                title: "Shareable Card",
                desc: "Download a screenshot-ready summary card. Share your wrap. Flex on your friends.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16,6 12,2 8,6" /><line x1="12" x2="12" y1="2" y2="15" />
                  </svg>
                ),
                accent: "from-cyan-500/20 to-cyan-500/0",
              },
            ].map((feature, i) => (
              <BlurFade key={feature.title} delay={0.1 + i * 0.07} inView>
                <div className="group relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 transition-colors hover:border-white/[0.08]">
                  <div
                    className={`absolute inset-0 bg-gradient-to-b ${feature.accent} opacity-0 transition-opacity group-hover:opacity-100`}
                  />
                  <div className="relative">
                    <div className="mb-3 text-white/30">{feature.icon}</div>
                    <h3 className="text-[15px] font-semibold text-white/80">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-white/30">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF / VIBE LABELS ─── */}
      <section className="relative z-10 overflow-hidden py-24">
        <BlurFade delay={0.1} inView>
          <div className="relative flex flex-col items-center gap-6">
            <p className="text-xs font-medium tracking-[0.2em] text-white/20 uppercase">
              Which vibe are you?
            </p>
            {/* Scrolling label marquee */}
            <div className="relative w-full overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#050505]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#050505]" />
              <div className="flex w-max animate-[marquee_25s_linear_infinite]">
                {[...VIBE_LABELS, ...VIBE_LABELS, ...VIBE_LABELS, ...VIBE_LABELS].map((label, i) => (
                  <span
                    key={`${label}-${i}`}
                    className="mx-2 whitespace-nowrap rounded-full border border-white/[0.06] bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-white/40"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </BlurFade>
      </section>


      {/* ─── FINAL CTA ─── */}
      <section className="relative z-10 flex flex-col items-center px-6 py-32">
        <BlurFade delay={0.1} inView>
          <h2 className="max-w-lg text-center text-3xl font-bold tracking-tight text-white md:text-5xl">
            Ready to get{" "}
            <AuroraText
              colors={["#c084fc", "#f472b6", "#818cf8"]}
              speed={1.5}
            >
              wrapped
            </AuroraText>
            ?
          </h2>
        </BlurFade>

        <BlurFade delay={0.25} inView>
          <p className="mt-4 max-w-md text-center text-base text-white/30">
            Upload your traces anytime. No signup. No data leaves your machine.
          </p>
        </BlurFade>

        <BlurFade delay={0.4} inView>
          <Link href="/upload" className="mt-8">
            <ShimmerButton
              shimmerColor="rgba(192, 132, 252, 0.6)"
              shimmerSize="0.08em"
              shimmerDuration="2.5s"
              background="linear-gradient(135deg, rgba(147, 51, 234, 0.25) 0%, rgba(126, 34, 206, 0.15) 100%)"
              borderRadius="12px"
              className="px-10 py-4 text-base font-semibold"
            >
              <span className="text-white">Get Your Wrapped</span>
            </ShimmerButton>
          </Link>
        </BlurFade>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-white/[0.04] px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-xs text-white/20">
            Agent Wrapped — open source, privacy-first
          </span>
          <div className="flex items-center gap-6 text-xs text-white/15">
            <span>Currently supports Claude Code</span>
            <span className="text-white/8">|</span>
            <span>More agents coming soon</span>
            <span className="text-white/8">|</span>
            <Link
              href="/privacy"
              className="text-white/25 transition-colors hover:text-white/50"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
