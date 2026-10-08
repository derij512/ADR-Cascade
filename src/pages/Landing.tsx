import { StatusBadge } from "@/components/StatusBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { renderMarkdown } from "@/lib/markdown";
import { buildAdrMarkdown } from "@/lib/adr";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  FolderOpen,
  GitBranch,
  Mail,
  Pencil,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const HERO_DOC = `# ADR-003: Move session storage to Redis

**Date:** 2026-10-07
**Status:** Accepted
**Scope:** platform

## Context

Sessions were served from the app server's memory, which broke every time we rolled a second instance.

## Decision

Store sessions in a managed Redis cluster with a 24h TTL and keep the app servers stateless.

## Consequences

- **(+) Benefits** — rolling deploys stop dropping users
- **(-) Costs** — one more stateful dependency to operate
`;

const FEATURES = [
  {
    icon: FolderOpen,
    title: "Projects first",
    body: "Group decision records by system or codebase. Every project gets its own numbered sequence and its own ADR list.",
  },
  {
    icon: Pencil,
    title: "Rich markdown editor",
    body: "A formatting toolbar, ⌘B/⌘I/⌘K shortcuts and a live split preview — the file stays plain markdown underneath.",
  },
  {
    icon: Sparkles,
    title: "Auto-generated scaffolding",
    body: "Number, date, status, scope and every section are prefilled the moment you name the decision. You write the prose.",
  },
  {
    icon: ArrowUpDown,
    title: "Sorting with direction",
    body: "Order the list by number, title, date, status or last edit — ascending or descending, in one click.",
  },
  {
    icon: GitBranch,
    title: "Lifecycle status",
    body: "Proposed, Accepted, Deprecated and Superseded — switching status rewrites the file header for you.",
  },
  {
    icon: Mail,
    title: "Simple email sign-in",
    body: "Passwordless codes sent to your inbox. No passwords, no setup — your workspace follows you in.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Create a project",
    body: "One project per system — payments platform, exchange layer, ML pipeline. It takes a name and, optionally, a line of description.",
  },
  {
    number: "02",
    title: "Name the decision",
    body: "Type a short title. ADR-001, today's date, Proposed status, scope and the full section template are generated for you.",
  },
  {
    number: "03",
    title: "Write and evolve",
    body: "Draft in the editor with live preview, autosave as you go, and flip the status when the decision is accepted or superseded.",
  },
];

export default function Landing() {
  const heroHtml = useMemo(() => renderMarkdown(HERO_DOC), []);

  const template = useMemo(
    () =>
      buildAdrMarkdown({
        number: 7,
        title: "Adopt event sourcing for the ledger",
        status: "Proposed",
        date: "2026-10-07",
        scope: "payments-platform",
      }),
    [],
  );
  const templateLines = template.split("\n").slice(0, 16);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background text-foreground"
    >
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5">
            <img
              src="/assets/Gradient_Arch_Folder_Emblem.png"
              alt="ADR Cascade"
              width={30}
              height={30}
              className="rounded-[8px] shadow-sm"
            />
            <span className="text-sm font-semibold tracking-tight">
              ADR Cascade
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#template"
              className="transition-colors hover:text-foreground"
            >
              Template
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/auth"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:opacity-90"
            >
              Start free
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section id="top" className="relative overflow-hidden px-4 pt-20 pb-16 sm:px-6 sm:pt-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklab, var(--ring) 9%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--ring) 9%, transparent) 1px, transparent 1px)",
            backgroundSize: "46px 46px",
            maskImage:
              "radial-gradient(ellipse 75% 60% at 50% 0%, black 25%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 60% at 50% 0%, black 25%, transparent 100%)",
          }}
        />

        <div className="mx-auto w-full max-w-4xl text-center">
          <motion.a
            href="#template"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-xs transition-colors hover:border-ring/40 hover:text-foreground"
          >
            <span className="size-1.5 rounded-full bg-ring" />
            <span className="font-mono">ADR-001</span>
            <span className="text-border">→</span>
            <span className="font-mono">ADR-∞</span>
            <span className="hidden sm:inline">
              · your decisions, in order
            </span>
          </motion.a>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
          >
            Every architecture
            <br className="hidden sm:block" /> decision,{" "}
            <span className="text-ring">on the record.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg"
          >
            ADR Cascade keeps your project&apos;s Architecture Decision Records
            as clean markdown files — auto-numbered, sorted your way, and edited
            in a rich editor with live preview.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              to="/auth"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90"
            >
              Start your first ADR
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex h-11 items-center rounded-lg border border-border/80 bg-card px-6 text-sm font-medium transition-colors hover:border-ring/40 hover:text-ring"
            >
              See how it works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
          >
            {(["Proposed", "Accepted", "Deprecated", "Superseded"] as const).map(
              (status) => (
                <StatusBadge key={status} status={status} />
              ),
            )}
          </motion.div>
        </div>

        {/* Product mockup */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mx-auto mt-14 w-full max-w-5xl"
        >
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_24px_60px_-24px_oklch(0.2_0.02_250_/_0.28)]">
            {/* Window chrome */}
            <div className="flex items-center gap-3 border-b border-border/70 bg-muted/40 px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
              </div>
              <div className="flex-1 truncate rounded-md bg-background px-3 py-1 text-center font-mono text-[11px] text-muted-foreground">
                adr-cascade.app / payments-platform / ADR-003
              </div>
              <span className="hidden rounded-md border border-border/70 bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
                Split
              </span>
            </div>

            <div className="grid md:grid-cols-2">
              {/* Source pane */}
              <pre className="adr-source hidden max-h-[380px] overflow-auto border-r border-border/70 bg-muted/20 px-5 py-4 text-left text-[12.5px] leading-relaxed text-muted-foreground md:block">
                {HERO_DOC}
              </pre>

              {/* Rendered pane */}
              <div className="max-h-[380px] overflow-auto px-5 py-4 sm:px-7">
                <div
                  className="adr-prose"
                  dangerouslySetInnerHTML={{ __html: heroHtml }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section id="features" className="scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-ring">
              Features
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Built for how decisions actually get recorded
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              No wikis to maintain, no folders to babysit — just structured
              records that stay consistent because the boring parts are
              generated.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: index * 0.05 }}
                className="group rounded-xl border border-border/70 bg-card p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-md"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-ring/10 group-hover:text-ring">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="text-[15px] font-medium tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Template / auto-generate ────────────────────────── */}
      <section
        id="template"
        className="scroll-mt-24 border-y border-border/60 bg-muted/30 px-4 py-20 sm:px-6"
      >
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div {...fadeUp}>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-ring">
              Auto-generate
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              A template that writes its own header
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Name the decision and the file appears fully formed: the
              identifier, today&apos;s date, the proposed status, a scope
              derived from your project, and every section with guidance in
              place. You fill in the thinking.
            </p>

            <ul className="mt-7 grid gap-3.5">
              {[
                {
                  label: "Sequence number",
                  value: "ADR-007",
                },
                {
                  label: "Date",
                  value: "2026-10-07",
                },
                {
                  label: "Status",
                  value: "Proposed",
                },
                {
                  label: "Scope",
                  value: "payments-platform",
                },
                {
                  label: "Sections",
                  value: "Context · Decision · Alternatives · Consequences",
                },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ring/10 text-ring">
                    <Check className="size-3" />
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="truncate rounded-md border border-border/70 bg-card px-2 py-0.5 font-mono text-[11px] font-medium">
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div {...fadeUp}>
            <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs">
              <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-4 py-2">
                <span className="font-mono text-[11px] text-muted-foreground">
                  ADR-007.md
                </span>
                <span className="rounded-full bg-ring/10 px-2 py-0.5 text-[10px] font-medium text-ring">
                  4 fields auto-filled
                </span>
              </div>
              <pre className="adr-source overflow-auto px-5 py-4 text-[12.5px] leading-relaxed">
                {templateLines.map((line, index) => (
                  <div
                    key={index}
                    className={
                      index <= 4
                        ? "text-ring"
                        : line.startsWith("#")
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                    }
                  >
                    {line || " "}
                  </div>
                ))}
              </pre>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how" className="scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-ring">
              How it works
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Three steps from blank page to decision log
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.number}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: index * 0.07 }}
                className="relative rounded-xl border border-border/70 bg-card p-6 shadow-xs"
              >
                <span className="font-mono text-xs font-semibold text-ring">
                  {step.number}
                </span>
                <h3 className="mt-3 text-[15px] font-medium tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:px-6">
        <motion.div
          {...fadeUp}
          className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-10"
        >
          <h2 className="mx-auto max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Start your decision log before the next big refactor
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-primary-foreground/70">
            Sign in with your email, create a project, and file your first ADR
            in under a minute.
          </p>
          <Link
            to="/auth"
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-background px-7 text-sm font-medium text-foreground shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Get started
            <ArrowRight className="size-4" />
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-border/60 px-4 py-8 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/Gradient_Arch_Folder_Emblem.png"
              alt="ADR Cascade"
              width={22}
              height={22}
              className="rounded-md"
            />
            <span className="text-sm font-medium tracking-tight">
              ADR Cascade
            </span>
            <span className="text-xs text-muted-foreground">
              © 2026 · Architecture decision records, organized
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#template" className="transition-colors hover:text-foreground">
              Template
            </a>
            <Link to="/auth" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </motion.div>
  );
}
