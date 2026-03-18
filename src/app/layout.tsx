import type { Metadata } from "next";
import { Suspense } from "react";
import { WrappedProvider } from "@/lib/store/wrapped-store";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Wrapped",
  description: "See how you really code with AI. Upload your agent traces and get a visual breakdown of your prompts, patterns, and personality.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <WrappedProvider>
          <Suspense>
            <PostHogProvider>{children}</PostHogProvider>
          </Suspense>
        </WrappedProvider>
      </body>
    </html>
  );
}
