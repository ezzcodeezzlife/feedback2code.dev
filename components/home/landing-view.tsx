"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import Button, { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import EmbedSnippetCopy from "@/components/repo/embed-snippet-copy";
import {
  Github,
  MessageSquare,
  GitPullRequest,
  Bot,
  Globe,
  Zap,
  Shield,
  Code,
  ArrowRight,
  Terminal,
  Clock3,
  Mail,
  ChevronDown,
  Check,
  Sparkles,
  Cpu,
  Eye,
  MousePointerClick,
} from "lucide-react";
import { useState } from "react";

function StaggerChild({
  children,
  delay,
  className,
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-slide-up ${className ?? ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[.2em] text-accent mb-4 text-center">
      [ {children} ]
    </p>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-center max-w-3xl mx-auto">
      {children}
    </h2>
  );
}

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border bg-surface transition-colors hover:border-border-bright">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left cursor-pointer"
      >
        <span className="text-sm font-bold text-foreground">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 -mt-1">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

const EXAMPLE_EMBED = `<script src="https://www.feedback2code.dev/widget/your_unique_widget_id" async></script>`;

const MOCK_FEEDBACKS = [
  {
    id: "1",
    body: "The signup button doesn't work on mobile — it overlaps with the nav bar on small screens.",
    status: "MERGED" as const,
    time: "2h ago",
    prUrl: "#",
  },
  {
    id: "2",
    body: "Dark mode colors are hard to read on the pricing page. The contrast ratio is too low.",
    status: "WAITING_FOR_REVIEW" as const,
    time: "5h ago",
    prUrl: "#",
  },
  {
    id: "3",
    body: "Add a loading spinner when the dashboard data is fetching. Right now it just shows a blank screen.",
    status: "CODING" as const,
    time: "12m ago",
    prUrl: null,
  },
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case "MERGED":
      return "border-accent/40 bg-accent/10 text-accent";
    case "WAITING_FOR_REVIEW":
      return "border-border-bright text-foreground";
    case "CODING":
      return "border-border text-muted-foreground";
    case "FAILED":
      return "border-red-900/50 bg-red-950/30 text-red-400";
    default:
      return "border-border text-muted-foreground";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "MERGED":
      return "Merged";
    case "WAITING_FOR_REVIEW":
      return "Awaiting review";
    case "CODING":
      return "Coding";
    case "FAILED":
      return "Failed";
    default:
      return status;
  }
}

export default function LandingView() {
  const [widgetPreviewTab, setWidgetPreviewTab] = useState<"submit" | "history">(
    "submit",
  );
  const [widgetPreviewText, setWidgetPreviewText] = useState("");
  const [widgetPreviewSent, setWidgetPreviewSent] = useState(false);

  return (
    <div className="flex flex-col">
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.06)_0%,transparent_70%)]" />
        <div className="hero-grid-bg absolute inset-0 opacity-[0.04]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <StaggerChild delay={0}>
            <div className="inline-flex items-center gap-2 border border-border-bright px-3 py-1.5 text-xs uppercase tracking-widest text-muted-foreground mb-8">
              <Sparkles className="h-3 w-3 text-accent" />
              AI-powered feedback automation
            </div>
          </StaggerChild>

          <StaggerChild delay={100}>
            <h1 className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Turn feedback
              <br />
              <span className="text-accent">into code.</span>
            </h1>
          </StaggerChild>

          <StaggerChild delay={200}>
            <p className="mt-6 max-w-xl text-center text-base sm:text-lg leading-relaxed text-muted-foreground">
              Embed a widget on your site. Users leave feedback. An AI agent
              reads your codebase, implements changes, and opens a Pull Request
              — automatically.
            </p>
          </StaggerChild>

          <StaggerChild delay={300}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={() => signIn("github", { callbackUrl: "/" })}
                size="lg"
                className="cursor-pointer text-sm px-8"
              >
                <Github className="h-4 w-4" />
                Start for free
              </Button>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 border border-border-bright bg-transparent px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-foreground transition-all hover:border-accent hover:text-accent"
              >
                See how it works
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </StaggerChild>

          <StaggerChild delay={400} className="mt-6">
            <p className="text-xs text-muted">
              Free tier · No credit card required · GitHub login
            </p>
          </StaggerChild>
        </div>
      </section>

      {/* ─── STATS STRIP ──────────────────────────────────────── */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {[
            { value: "1 line", label: "of code to embed" },
            { value: "< 3 min", label: "setup time" },
            { value: "Auto PRs", label: "from feedback to code" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center px-6 py-8"
            >
              <span className="text-2xl sm:text-3xl font-bold text-accent">
                {stat.value}
              </span>
              <span className="mt-1 text-xs uppercase tracking-widest text-muted">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="border-b border-border py-20 sm:py-28"
      >
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionLabel>How it works</SectionLabel>
          <SectionHeading>
            From feedback to Pull Request in three steps
          </SectionHeading>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-0">
            {[
              {
                step: "01",
                icon: Code,
                title: "Embed the widget",
                description:
                  "Add a single script tag to your site. The feedback widget appears for your visitors — fully styled, dark/light mode aware.",
              },
              {
                step: "02",
                icon: MessageSquare,
                title: "Users leave feedback",
                description:
                  "Users describe what's broken, confusing, or could be improved. Feedback is sent to your dashboard in real time.",
              },
              {
                step: "03",
                icon: GitPullRequest,
                title: "AI agent opens a PR",
                description:
                  "An AI coding agent spins up in a secure sandbox, clones your repo, implements changes, and opens a Pull Request on GitHub.",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="relative border border-border bg-surface p-8 group hover:border-border-bright transition-colors"
                style={{
                  marginLeft: i > 0 ? "-1px" : undefined,
                  marginTop: "-1px",
                }}
              >
                <div className="absolute left-0 top-0 h-full w-[3px] bg-transparent transition-colors duration-200 group-hover:bg-accent" />
                <span className="text-4xl font-bold text-accent/20">
                  {item.step}
                </span>
                <div className="mt-4 flex items-center gap-2">
                  <item.icon className="h-5 w-5 text-accent" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Connector arrows for desktop */}
          <div className="hidden md:flex items-center justify-center gap-2 mt-8">
            <span className="text-xs text-muted uppercase tracking-widest">
              feedback submitted
            </span>
            <ArrowRight className="h-4 w-4 text-accent" />
            <span className="text-xs text-muted uppercase tracking-widest">
              agent starts coding
            </span>
            <ArrowRight className="h-4 w-4 text-accent" />
            <span className="text-xs text-muted uppercase tracking-widest">
              PR ready for review
            </span>
          </div>
        </div>
      </section>

      {/* ─── WIDGET PREVIEW ───────────────────────────────────── */}
      <section className="border-b border-border bg-surface/50 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionLabel>The widget</SectionLabel>
          <SectionHeading>
            Beautiful. Unobtrusive. Ready to go.
          </SectionHeading>
          <p className="mt-4 text-center text-sm text-muted-foreground max-w-lg mx-auto">
            The widget uses a polished built-in terminal aesthetic, supports
            dark and light mode, and shows submission history to your visitors.
          </p>

          <div className="mt-14">
            <div className="mx-auto w-full max-w-5xl overflow-hidden border border-border-bright bg-background shadow-2xl shadow-black/50">
              <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent/90" />
                  <span className="h-2.5 w-2.5 rounded-full bg-border-bright" />
                  <span className="h-2.5 w-2.5 rounded-full bg-border" />
                </div>
                <div className="flex-1 border border-border bg-background px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted">
                  https://acme.example/dashboard
                </div>
              </div>

              <div className="relative min-h-[560px] bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.12),transparent_32%),linear-gradient(180deg,#111111_0%,#0a0a0a_100%)]">
                <div className="px-8 py-10 sm:px-10">
                  <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                      Product site
                    </div>
                    <div className="max-w-2xl space-y-5">
                      <div className="h-3 w-28 bg-accent/70" />
                      <div className="space-y-3">
                        <div className="h-10 max-w-xl bg-foreground/95" />
                        <div className="h-10 max-w-lg bg-foreground/80" />
                      </div>
                      <div className="space-y-3">
                        <div className="h-3.5 max-w-2xl bg-muted/40" />
                        <div className="h-3.5 max-w-xl bg-muted/30" />
                        <div className="h-3.5 max-w-lg bg-muted/20" />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="border border-border bg-surface/70 p-4">
                        <div className="h-3 w-16 bg-accent/70" />
                        <div className="mt-4 h-7 w-20 bg-foreground/90" />
                        <div className="mt-3 h-2.5 w-24 bg-muted/30" />
                      </div>
                      <div className="border border-border bg-surface/70 p-4">
                        <div className="h-3 w-20 bg-accent/50" />
                        <div className="mt-4 h-7 w-24 bg-foreground/85" />
                        <div className="mt-3 h-2.5 w-28 bg-muted/25" />
                      </div>
                      <div className="border border-border bg-surface/70 p-4">
                        <div className="h-3 w-14 bg-accent/40" />
                        <div className="mt-4 h-7 w-16 bg-foreground/80" />
                        <div className="mt-3 h-2.5 w-20 bg-muted/20" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="absolute bottom-6 right-6 w-[min(440px,calc(100%-3rem))] border border-border-bright bg-background shadow-2xl shadow-black/60">
                  <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <span className="text-sm font-bold uppercase tracking-widest text-accent">
                      Feedback
                    </span>
                    <span className="text-xl text-muted cursor-default">&times;</span>
                  </div>

                  <div className="flex border-b border-border">
                    <button
                      type="button"
                      onClick={() => {
                        setWidgetPreviewTab("submit");
                        setWidgetPreviewSent(false);
                      }}
                      className={`flex-1 px-4 py-3 text-center text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                        widgetPreviewTab === "submit"
                          ? "border-b-2 border-accent text-accent"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => setWidgetPreviewTab("history")}
                      className={`flex-1 px-4 py-3 text-center text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                        widgetPreviewTab === "history"
                          ? "border-b-2 border-accent text-accent"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      History (3)
                    </button>
                  </div>

                  {widgetPreviewTab === "submit" ? (
                    widgetPreviewSent ? (
                      <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
                        <div className="flex h-14 w-14 items-center justify-center border border-accent text-accent">
                          <Check className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-base font-bold text-foreground">
                            Feedback received
                          </p>
                          <p className="text-sm leading-relaxed text-muted">
                            Thanks. Your feedback has been sent for review.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setWidgetPreviewSent(false);
                            setWidgetPreviewText("");
                          }}
                          className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:border-border-bright hover:text-foreground cursor-pointer"
                        >
                          Send more
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="border-b border-border px-6 py-5">
                          <textarea
                            value={widgetPreviewText}
                            onChange={(event) => setWidgetPreviewText(event.target.value)}
                            placeholder="What&apos;s broken, confusing, or could be improved?"
                            className="min-h-[132px] w-full resize-none border-0 bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted"
                          />
                        </div>

                        <div className="flex items-center justify-between px-6 py-4">
                          <span className="text-xs text-muted">
                            {widgetPreviewText.length} / 2000
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!widgetPreviewText.trim()) return;
                              setWidgetPreviewSent(true);
                              setWidgetPreviewText("");
                            }}
                            className="inline-flex items-center gap-2 bg-accent px-5 py-2 text-xs font-bold uppercase tracking-wider text-black transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!widgetPreviewText.trim()}
                          >
                            Send <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </>
                    )
                  ) : (
                    <div className="divide-y divide-border">
                      <div className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="border border-accent/40 bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                            Merged
                          </span>
                          <span className="text-xs text-muted">2h ago</span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-muted">
                          Fixed the signup button overlap on smaller screens.
                        </p>
                      </div>

                      <div className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="border border-border-bright px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-foreground">
                            Awaiting review
                          </span>
                          <span className="text-xs text-muted">5h ago</span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-muted">
                          Dark mode contrast could be improved on the pricing cards.
                        </p>
                      </div>

                      <div className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                            Coding
                          </span>
                          <span className="text-xs text-muted">12m ago</span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-muted">
                          Adding a loading state for dashboard data fetches.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ────────────────────────────────────── */}
      <section className="border-b border-border bg-surface/50 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionLabel>Features</SectionLabel>
          <SectionHeading>
            Everything you need. Nothing you don&apos;t.
          </SectionHeading>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {[
              {
                icon: Bot,
                title: "AI Coding Agent",
                description:
                  "Powered by E2B sandboxes, the agent clones your repo, understands the codebase, and writes production-ready changes.",
              },
              {
                icon: Shield,
                title: "Domain Authorization",
                description:
                  "Only domains you authorize can submit feedback. No spam, no abuse. Full control over who can interact with the widget.",
              },
              {
                icon: Mail,
                title: "Email Notifications",
                description:
                  "Get notified when a PR is created from feedback. Toggle per-repo. Never miss an automated change.",
              },
              {
                icon: Terminal,
                title: "Custom Agent Instructions",
                description:
                  "Tell the agent to \"always use TailwindCSS\" or \"follow our API conventions.\" Instructions are included in every prompt.",
              },
              {
                icon: Zap,
                title: "Fast Sandbox Execution",
                description:
                  "E2B sandboxes spin up in milliseconds. The agent runs in a secure, isolated microVM with full Linux capabilities.",
              },
              {
                icon: Eye,
                title: "Feedback Dashboard",
                description:
                  "Track every submission, see agent status in real-time: Coding → Waiting for Review → Merged. Full history at a glance.",
              },
            ].map((feature) => (
              <Card
                key={feature.title}
                className="border-0 bg-background p-8 hover:bg-surface-raised transition-colors"
              >
                <feature.icon className="h-5 w-5 text-accent mb-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DASHBOARD PREVIEW ────────────────────────────────── */}
      <section className="border-b border-border bg-surface/50 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionLabel>Dashboard</SectionLabel>
          <SectionHeading>
            Every submission, tracked and visible
          </SectionHeading>
          <p className="mt-4 text-center text-sm text-muted-foreground max-w-lg mx-auto">
            See real-time status for every feedback — from the moment it&apos;s
            submitted to the moment the PR is merged.
          </p>

          <div className="mt-14 border border-border bg-background">
            {/* Mock dashboard header */}
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-accent" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  Submitted Feedback
                </span>
                <span className="text-xs text-accent border border-accent px-1.5 py-0.5 ml-1">
                  3
                </span>
              </div>
              <span className="text-xs text-muted uppercase tracking-widest">
                acme / web-app
              </span>
            </div>

            {/* Mock feedback items */}
            <div className="divide-y divide-border">
              {MOCK_FEEDBACKS.map((f) => (
                <div
                  key={f.id}
                  className="px-6 py-4 hover:bg-surface-raised/50 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <Clock3 className="h-3 w-3 text-accent" />
                      {f.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] uppercase tracking-wider px-2 py-0.5 border ${statusBadgeClass(f.status)}`}
                      >
                        {statusLabel(f.status)}
                      </span>
                      {f.prUrl && (
                        <span className="text-[11px] uppercase tracking-wider bg-accent text-black px-2 py-0.5 font-medium">
                          View PR
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── EMBED CODE SECTION ───────────────────────────────── */}
      <section className="border-b border-border py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionLabel>Get started</SectionLabel>
          <SectionHeading>One line. That&apos;s it.</SectionHeading>
          <p className="mt-4 text-center text-sm text-muted-foreground max-w-lg mx-auto">
            We generate a unique widget id for your site, then give you a script tag to paste into your HTML. The feedback widget appears automatically.
          </p>

          <div className="mt-10 w-full min-w-0 max-w-3xl mx-auto">
            <EmbedSnippetCopy
              code={EXAMPLE_EMBED}
              copyable={false}
              selectable={false}
              centered
            />
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Zap, text: "Loads async, zero performance hit" },
              {
                icon: Globe,
                text: "Works with any framework or static site",
              },
              {
                icon: MousePointerClick,
                text: "No npm install needed",
              },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <item.icon className="h-4 w-4 text-accent shrink-0" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*
      ─── REPO CARD PREVIEW / [ Project overview ] ─────────────────
      <section className="border-b border-border py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionLabel>Project overview</SectionLabel>
          <SectionHeading>
            All your repos. One dashboard.
          </SectionHeading>
          <p className="mt-4 text-center text-sm text-muted-foreground max-w-lg mx-auto">
            Connect your GitHub repos in seconds. See feedback counts, agent
            status, and latest submissions across all your projects.
          </p>

          <div className="mt-14 max-w-3xl mx-auto">
            <div className="group relative flex flex-col border border-border bg-surface transition-all duration-200 hover:border-border-bright">
              <div className="absolute left-0 top-0 h-full w-[3px] bg-accent" />

              <div className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <GitBranch className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-sm text-muted">acme</span>
                    <span className="text-muted shrink-0">/</span>
                    <span className="text-sm font-bold text-foreground">
                      web-app
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ExternalLink className="h-3.5 w-3.5" />
                    GitHub
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  The main marketing website and web application for Acme Inc.
                </p>
              </div>

              <div className="grid grid-cols-2 border-t border-border">
                <div className="p-6 pr-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-4 w-4 text-accent" />
                    <p className="text-xs font-bold uppercase tracking-wider">
                      Repository
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#3178c6] shrink-0" />
                      TypeScript
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-foreground shrink-0" />
                      1.2k stars
                    </div>
                  </div>
                </div>

                <div className="p-6 pl-5 border-l border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-accent" />
                    <p className="text-xs font-bold uppercase tracking-wider">
                      Feedback
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>47 submissions</div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 text-[11px] uppercase tracking-wider border border-accent/40 bg-accent/10 text-accent">
                        Merged
                      </span>
                      <span className="text-xs text-muted">2h ago</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted border-l-2 border-accent/30 pl-3">
                      Fix signup button overflow on mobile viewports
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <Clock3 className="h-3.5 w-3.5 text-accent" />
                  Updated 2h ago
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                  Configure
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* ─── USE CASES ────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface/50 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionLabel>Use cases</SectionLabel>
          <SectionHeading>Built for teams who ship fast</SectionHeading>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {[
              {
                title: "SaaS Products",
                description:
                  "Let your users report bugs and request features directly from your app. Each submission turns into a reviewable PR.",
                icon: Globe,
              },
              {
                title: "Documentation Sites",
                description:
                  "Users spot outdated docs or unclear instructions. Feedback becomes a PR that updates the content.",
                icon: Code,
              },
              {
                title: "Internal Tools",
                description:
                  "Team members report issues without filing tickets. The AI agent handles the fix, you review and merge.",
                icon: Terminal,
              },
              {
                title: "Freelancers & Agencies",
                description:
                  "Give clients a feedback button. They describe what to change, and you get a ready-made PR to review.",
                icon: Sparkles,
              },
            ].map((uc) => (
              <Card key={uc.title} className="p-6 hover:border-border-bright transition-colors">
                <uc.icon className="h-5 w-5 text-accent mb-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  {uc.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {uc.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PIPELINE VISUALIZATION ───────────────────────────── */}
      <section className="border-b border-border py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionLabel>Under the hood</SectionLabel>
          <SectionHeading>
            A full coding pipeline, not just a chatbot
          </SectionHeading>
          <p className="mt-4 text-center text-sm text-muted-foreground max-w-xl mx-auto">
            Each feedback submission triggers a complete development pipeline
            running in an isolated cloud sandbox.
          </p>

          <div className="mt-14 border border-border bg-surface">
            {/* Terminal header */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="ml-2 text-xs text-muted uppercase tracking-wider">
                feedback2code pipeline
              </span>
            </div>

            {/* Pipeline steps */}
            <div className="p-6 sm:p-8 space-y-0">
              {[
                {
                  prefix: "$",
                  cmd: "feedback received",
                  detail:
                    '"The signup button doesn\'t work on mobile"',
                  accent: false,
                },
                {
                  prefix: "→",
                  cmd: "spinning up E2B sandbox",
                  detail: "secure microVM · full Linux · 80ms cold start",
                  accent: true,
                },
                {
                  prefix: "→",
                  cmd: "cloning repository",
                  detail:
                    "github.com/acme/web-app → /home/user/feedback-repo",
                  accent: true,
                },
                {
                  prefix: "→",
                  cmd: "AI agent analyzing codebase",
                  detail:
                    "reading project structure, finding relevant files...",
                  accent: true,
                },
                {
                  prefix: "→",
                  cmd: "implementing changes",
                  detail:
                    "components/SignupButton.tsx — fixing mobile overflow",
                  accent: true,
                },
                {
                  prefix: "→",
                  cmd: "committing & pushing",
                  detail: "branch: feedback/f2c-a1b2c3d4 · 1 file changed",
                  accent: true,
                },
                {
                  prefix: "✓",
                  cmd: "Pull Request opened",
                  detail: '#42 "Feedback: Fix signup button on mobile"',
                  accent: false,
                },
              ].map((line, i) => (
                <div
                  key={i}
                  className="flex gap-3 py-2 items-start"
                >
                  <span
                    className={`shrink-0 w-4 text-center font-bold ${
                      line.prefix === "✓"
                        ? "text-green-400"
                        : line.accent
                          ? "text-accent"
                          : "text-muted"
                    }`}
                  >
                    {line.prefix}
                  </span>
                  <div className="min-w-0">
                    <span
                      className={`text-sm font-bold ${
                        line.prefix === "✓"
                          ? "text-green-400"
                          : "text-foreground"
                      }`}
                    >
                      {line.cmd}
                    </span>
                    <span className="block text-xs text-muted mt-0.5 truncate">
                      {line.detail}
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 py-2 items-center">
                <span className="shrink-0 w-4 text-center text-accent font-bold">
                  _
                </span>
                <span className="text-sm text-muted animate-blink">▌</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TECH STACK / TRUST ───────────────────────────────── */}
      <section className="border-b border-border py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionLabel>Powered by</SectionLabel>
          <SectionHeading>Enterprise-grade infrastructure</SectionHeading>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {[
              {
                name: "E2B Sandboxes",
                detail: "Secure, isolated microVMs for code execution",
                icon: Cpu,
              },
              {
                name: "GitHub App",
                detail: "Native integration, fine-grained permissions",
                icon: Github,
              },
              {
                name: "AI Agent",
                detail: "Full codebase understanding",
                icon: Bot,
              },
              {
                name: "Stripe Billing",
                detail: "Simple, transparent Free, Pro, and Enterprise plans",
                icon: Shield,
              },
            ].map((tech) => (
              <div
                key={tech.name}
                className="bg-background p-8 flex flex-col items-center text-center"
              >
                <tech.icon className="h-6 w-6 text-accent mb-3" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  {tech.name}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {tech.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface/50 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionLabel>Pricing</SectionLabel>
          <SectionHeading>Start free. Scale when ready.</SectionHeading>
          <p className="mt-4 text-center text-sm text-muted-foreground max-w-md mx-auto">
            No hidden fees. No usage surprises. Upgrade when you need more.
          </p>

          <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Free tier */}
            <div className="border border-border bg-background p-8 flex flex-col">
              <span className="text-xs uppercase tracking-widest text-muted mb-2">
                Free
              </span>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-foreground">$0</span>
                <span className="text-sm text-muted">/ month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Perfect for trying out feedback2code on personal projects.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground mb-8 flex-1">
                {[
                  "10 feedbacks per 30-day window",
                  "AI agent with sandbox execution",
                  "Automatic Pull Requests",
                  "Email notifications",
                  "Unlimited repositories",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => signIn("github", { callbackUrl: "/" })}
                variant="outline"
                className="w-full cursor-pointer"
              >
                <Github className="h-4 w-4" />
                Get started
              </Button>
            </div>

            {/* Pro tier */}
            <div className="relative border border-accent bg-background p-8 flex flex-col">
              <div className="absolute -top-px left-0 right-0 h-[3px] bg-accent" />
              <span className="text-xs uppercase tracking-widest text-accent mb-2">
                Pro
              </span>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-foreground">$20</span>
                <span className="text-sm text-muted">/ month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                For teams and production apps with active user bases.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground mb-8 flex-1">
                {(
                  [
                    { text: "100 feedbacks per 30-day window" },
                    { text: "Everything in Free" },
                    { text: "Priority sandbox execution" },
                    { text: "Custom agent instructions" },
                    { text: "Page path context tracking" },
                    { text: "Advanced dashboard analytics" },
                    { text: "Choose AI Agent model", comingSoon: true },
                  ] as const
                ).map((f) => (
                  <li key={f.text} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{f.text}</span>
                      {"comingSoon" in f && f.comingSoon ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm">
                          Coming soon
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => signIn("github", { callbackUrl: "/" })}
                className="w-full cursor-pointer"
              >
                <Github className="h-4 w-4" />
                Start with Pro
              </Button>
            </div>

            {/* Enterprise tier */}
            <div className="border border-border bg-background p-8 flex flex-col">
              <span className="text-xs uppercase tracking-widest text-muted mb-2">
                Enterprise
              </span>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-foreground">Custom</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                For organizations that need unlimited scale, compliance support, and a
                tailored setup.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground mb-8 flex-1">
                {(
                  [
                    { text: "Unlimited feedbacks" },
                    { text: "Everything in Pro" },
                    { text: "Priority sandbox execution" },
                    { text: "Custom agent instructions & advanced analytics" },
                    { text: "Data Processing Agreement (DPA)" },
                    { text: "GDPR-aligned handling & subprocessor transparency" },
                    {
                      text: "Security questionnaires, reviews & custom enterprise terms",
                    },
                    { text: "Choose AI Agent model", comingSoon: true },
                  ] as const
                ).map((f) => (
                  <li key={f.text} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{f.text}</span>
                      {"comingSoon" in f && f.comingSoon ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm">
                          Coming soon
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href="mailto:hello@feedback2code.dev?subject=Enterprise%20plan%20inquiry"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full cursor-pointer",
                )}
              >
                <Mail className="h-4 w-4" />
                Contact us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="border-b border-border py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionLabel>FAQ</SectionLabel>
          <SectionHeading>Questions? Answers.</SectionHeading>

          <div className="mt-14 max-w-3xl mx-auto space-y-px">
            <FAQItem
              question="Does the sandbox have internet access?"
              answer="No. It stays off the public internet, so there is no web browsing or arbitrary outbound access."
            />
            <FAQItem
              question="Which model does the agent use?"
              answer="Right now the coding agent runs on MiniMax-M2.5. Model selection will be configurable on higher tiers later."
            />
            <FAQItem
              question="What happens if the agent makes a bad change?"
              answer="Nothing ships without your approval. The agent does not have direct git access to push straight to production. Every change becomes a Pull Request on GitHub that you review and merge (or close). You always have the final say. The agent also follows your custom instructions if you provide them."
            />
            <FAQItem
              question="Which languages and frameworks are supported?"
              answer="If it runs on Linux, it works. The sandbox supports JavaScript, TypeScript, Python, Ruby, Go, Rust, and more. It can install packages, use browsers, and run terminal commands just like a real developer would."
            />
            <FAQItem
              question="Can I customize the widget appearance?"
              answer="The widget auto-detects light and dark mode. It uses a monospace terminal aesthetic that works well with most sites. Custom theming options are coming soon."
            />
            <FAQItem
              question="Can I use this for private repositories?"
              answer="Yes! The GitHub App integration supports both public and private repositories. Just grant access during the installation flow."
            />
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.08)_0%,transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-6 text-center">
          <p className="text-xs uppercase tracking-[.2em] text-accent mb-6">
            [ Ready? ]
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Stop triaging feedback.
            <br />
            <span className="text-accent">Start shipping fixes.</span>
          </h2>
          <p className="mt-6 text-base text-muted-foreground max-w-md mx-auto">
            Set up in under 3 minutes. Your first automated PR is one feedback
            submission away.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => signIn("github", { callbackUrl: "/" })}
              size="lg"
              className="cursor-pointer text-sm px-8"
            >
              <Github className="h-4 w-4" />
              Get started for free
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted">
            Free forever for small projects · No credit card required
          </p>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              feedback2code
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
            <Link
              href="/legal"
              className="text-xs text-muted hover:text-accent transition-colors"
            >
              Legal &amp; Contact
            </Link>
            <p className="text-xs text-muted">
              &copy; {new Date().getFullYear()} feedback2code. Turn user feedback
              into code changes — automatically.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
