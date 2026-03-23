"use client";

import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";

export default function PrivacyPolicy() {
  return (
    <main className="relative min-h-screen bg-[#050505] selection:bg-purple-500/30 selection:text-white">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[40%] top-[10%] h-[600px] w-[600px] rounded-full bg-purple-600/[0.04] blur-[120px]" />
        <div className="absolute -right-[30%] top-[40%] h-[500px] w-[500px] rounded-full bg-blue-600/[0.04] blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 md:px-12">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-widest text-white/60 uppercase transition-colors hover:text-white/80"
        >
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
        </Link>
      </nav>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-8">
        <BlurFade delay={0.1}>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-white/30">
            Last updated: March 22, 2026
          </p>
        </BlurFade>

        <BlurFade delay={0.2}>
          <div className="mt-12 space-y-12 text-[15px] leading-relaxed text-white/60">
            {/* Overview */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white/90">
                Overview
              </h2>
              <p>
                Agent Wrapped (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
                &ldquo;our&rdquo;) is an open-source, privacy-first web
                application that lets you upload coding agent trace files and
                receive a visual breakdown of your AI coding tool usage. This
                Privacy Policy explains what data we collect, what we do not
                collect, how data is processed, and your rights regarding that
                data.
              </p>
            </section>

            {/* Trace Data */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white/90">
                1. Your Agent Trace Data
              </h2>
              <p className="mb-3">
                <strong className="text-white/80">
                  Your trace data never leaves your browser.
                </strong>{" "}
                All parsing and analysis of your uploaded agent traces is
                performed entirely client-side using JavaScript running in your
                web browser. Specifically:
              </p>
              <ul className="list-inside list-disc space-y-2 pl-2">
                <li>
                  Trace files are read into browser memory only. They are{" "}
                  <strong className="text-white/80">never uploaded</strong> to
                  any server, API, or third-party service.
                </li>
                <li>
                  Trace data is{" "}
                  <strong className="text-white/80">never stored</strong> in
                  cookies, localStorage, IndexedDB, or any other persistent
                  browser storage mechanism.
                </li>
                <li>
                  When you close or navigate away from the page, all trace data
                  is permanently discarded from memory.
                </li>
                <li>
                  No trace content — including file names, prompts, code
                  snippets, conversation history, or any other data from your
                  traces — is ever transmitted, logged, or collected by us.
                </li>
                <li>
                  This applies regardless of whether you accept or decline
                  analytics cookies. Your trace data is private in all cases.
                </li>
              </ul>
            </section>

            {/* Analytics */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white/90">
                2. Analytics (PostHog)
              </h2>
              <p className="mb-3">
                If you consent to analytics cookies, we use{" "}
                <strong className="text-white/80">PostHog</strong> to collect
                anonymous usage data that helps us understand how people use the
                application and improve the experience. PostHog is configured in
                privacy-preserving mode:
              </p>

              <h3 className="mb-2 mt-6 text-base font-semibold text-white/80">
                What we track
              </h3>
              <ul className="list-inside list-disc space-y-2 pl-2">
                <li>
                  <strong className="text-white/80">Page views</strong> — which
                  pages you visit (e.g. home, upload, dashboard, story).
                </li>
                <li>
                  <strong className="text-white/80">Feature usage events</strong>{" "}
                  — anonymous counts of actions like &ldquo;file uploaded&rdquo;,
                  &ldquo;parsing started&rdquo;, &ldquo;story started&rdquo;,
                  &ldquo;summary downloaded&rdquo;. These events include metadata
                  such as agent type (e.g. &ldquo;claude&rdquo;), file count,
                  approximate file size, and session/message counts — but{" "}
                  <strong className="text-white/80">
                    never the content of your traces or prompts
                  </strong>
                  .
                </li>
                <li>
                  <strong className="text-white/80">Error events</strong> —
                  JavaScript error type and message to help us identify and fix
                  bugs. Error text is masked and no trace content is included.
                </li>
              </ul>

              <h3 className="mb-2 mt-6 text-base font-semibold text-white/80">
                What we do NOT track
              </h3>
              <ul className="list-inside list-disc space-y-2 pl-2">
                <li>
                  Any content from your uploaded traces (prompts, code, file
                  paths, conversation history).
                </li>
                <li>Session recordings or screen captures.</li>
                <li>
                  Autocaptured clicks, form inputs, or DOM interactions — all
                  autocapture is disabled.
                </li>
                <li>
                  Personal information such as your name, email address, IP
                  address (PostHog is configured not to store IP addresses), or
                  location.
                </li>
              </ul>

              <h3 className="mb-2 mt-6 text-base font-semibold text-white/80">
                Where analytics data is stored
              </h3>
              <p>
                Analytics data is sent to PostHog&apos;s US-based cloud
                infrastructure (
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-white/50">
                  us.i.posthog.com
                </code>
                ). PostHog processes this data under their{" "}
                <a
                  href="https://posthog.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 underline decoration-purple-400/30 underline-offset-2 transition-colors hover:text-purple-300"
                >
                  privacy policy
                </a>
                . No analytics data is stored on our own servers.
              </p>

              <h3 className="mb-2 mt-6 text-base font-semibold text-white/80">
                In-browser persistence
              </h3>
              <p>
                PostHog is configured with{" "}
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-white/50">
                  persistence: &ldquo;memory&rdquo;
                </code>{" "}
                — it does not set any cookies or write to localStorage for
                tracking purposes. The only localStorage value we set is your
                cookie consent preference (
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-white/50">
                  cookie-consent
                </code>
                : &ldquo;accepted&rdquo; or &ldquo;declined&rdquo;) so we
                don&apos;t ask you again on every visit.
              </p>
            </section>

            {/* Declining Cookies */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white/90">
                3. If You Decline Analytics
              </h2>
              <p>
                If you decline cookies via the consent banner, PostHog is{" "}
                <strong className="text-white/80">
                  never loaded or initialized
                </strong>
                . No analytics scripts will run, no events will be tracked, and
                no data will be sent to PostHog or any other third party. The
                application functions identically — you get the full experience
                with zero data collection. The only data stored locally is your
                consent preference in localStorage so the banner does not
                reappear.
              </p>
            </section>

            {/* No Accounts */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white/90">
                4. No Accounts or Personal Data
              </h2>
              <p>
                Agent Wrapped does not require or offer user accounts. We do not
                collect, store, or process any personally identifiable
                information (PII) such as names, email addresses, passwords, or
                payment information. There is no login, no registration, and no
                user profiles.
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white/90">
                5. Third-Party Services
              </h2>
              <p className="mb-3">
                The only third-party service used is:
              </p>
              <ul className="list-inside list-disc space-y-2 pl-2">
                <li>
                  <strong className="text-white/80">PostHog</strong> — anonymous
                  analytics (only if you consent). See{" "}
                  <a
                    href="https://posthog.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 underline decoration-purple-400/30 underline-offset-2 transition-colors hover:text-purple-300"
                  >
                    PostHog&apos;s Privacy Policy
                  </a>
                  .
                </li>
              </ul>
              <p className="mt-3">
                We do not use any other analytics platforms, advertising
                networks, social media trackers, or data brokers.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white/90">
                6. Data Sharing and Disclosure
              </h2>
              <p>
                We do not sell, rent, trade, or otherwise disclose any user data
                to third parties. Since we do not collect trace data or personal
                information, there is nothing to share. Anonymous analytics data
                processed by PostHog is used solely for product improvement and
                is not shared with any other parties.
              </p>
            </section>

            {/* Children */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white/90">
                7. Children&apos;s Privacy
              </h2>
              <p>
                Agent Wrapped is not directed at children under the age of 13
                (or the applicable age of digital consent in your jurisdiction).
                We do not knowingly collect data from children.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white/90">
                8. Your Rights
              </h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-inside list-disc space-y-2 pl-2">
                <li>
                  <strong className="text-white/80">Decline analytics</strong>{" "}
                  — click &ldquo;Decline&rdquo; on the cookie consent banner.
                  PostHog will not be loaded.
                </li>
                <li>
                  <strong className="text-white/80">
                    Withdraw consent at any time
                  </strong>{" "}
                  — clear your browser&apos;s localStorage for this site (or
                  clear all site data in your browser settings) and refresh the
                  page. The consent banner will reappear.
                </li>
                <li>
                  <strong className="text-white/80">
                    Request deletion of analytics data
                  </strong>{" "}
                  — since analytics events are anonymous and not linked to an
                  identifiable user, we cannot look up or delete specific
                  records. However, because no PII is collected, these records
                  cannot be tied back to you.
                </li>
              </ul>
            </section>

            {/* Open Source */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white/90">
                9. Open Source Transparency
              </h2>
              <p>
                Agent Wrapped is open source. You can inspect the full source
                code to verify our privacy practices, including the PostHog
                configuration, event tracking calls, and client-side processing
                logic. We believe transparency is the strongest privacy
                guarantee.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white/90">
                10. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. Changes
                will be reflected by updating the &ldquo;Last updated&rdquo;
                date at the top of this page. We encourage you to review this
                page periodically. Continued use of the application after
                changes constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white/90">
                11. Contact
              </h2>
              <p>
                If you have questions about this Privacy Policy or our data
                practices, please open an issue on our{" "}
                <a
                  href="https://github.com/TesslateAI/agent-wrapped"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 underline decoration-purple-400/30 underline-offset-2 transition-colors hover:text-purple-300"
                >
                  GitHub repository
                </a>
                .
              </p>
            </section>
          </div>
        </BlurFade>

        {/* Back link */}
        <BlurFade delay={0.3}>
          <div className="mt-16 border-t border-white/[0.06] pt-8">
            <Link
              href="/"
              className="text-sm text-white/30 transition-colors hover:text-white/60"
            >
              &larr; Back to Agent Wrapped
            </Link>
          </div>
        </BlurFade>
      </div>
    </main>
  );
}
