// Shared helpers for ADR markdown: template generation, metadata parsing and
// status rewriting. Used by both the Convex backend (on create/save) and the
// frontend (to render live metadata while editing). Plain TypeScript only.

export const ADR_STATUSES = [
  "Proposed",
  "Accepted",
  "Deprecated",
  "Superseded",
] as const;

export type AdrStatus = (typeof ADR_STATUSES)[number];

/** Pads a number into the ADR-001 style identifier used in titles and lists. */
export function formatAdrNumber(number: number): string {
  return `ADR-${String(number).padStart(3, "0")}`;
}

/** Today's date as YYYY-MM-DD in the viewer's local timezone. */
export function todayIsoDate(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Derives the auto-suggested **Scope:** value from a project name. */
export function slugifyScope(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "general";
}

export interface AdrMeta {
  title: string;
  status: AdrStatus;
  date: string;
  scope?: string;
}

/**
 * Builds a fresh ADR file. Everything a new record can know is prefilled:
 * number, date, status and scope — only the prose is left for the author.
 */
export function buildAdrMarkdown(meta: AdrMeta & { number: number }): string {
  const { number, title, status, date, scope } = meta;
  const statusLine =
    status === "Superseded" ? "Superseded by ADR-XXX" : status;

  return [
    `# ${formatAdrNumber(number)}: ${title}`,
    "",
    `**Date:** ${date}`,
    `**Status:** ${statusLine}`,
    `**Scope:** ${scope ?? slugifyScope(title)}`,
    "",
    "## Context",
    "",
    "_What problem or constraint forced this decision? (2-4 sentences)_",
    "",
    "## Decision",
    "",
    "_What did we choose? Be specific. (1-3 sentences)_",
    "",
    "## Alternatives considered",
    "",
    "- **Option A:** _why it was rejected_",
    "- **Option B:** _why it was rejected_",
    "",
    "## Consequences",
    "",
    "- **(+) Benefits** — _what this buys us_",
    "- **(-) Costs, risks, new constraints** — _what this commits us to_",
    "- **Follow-up work** — _spikes, tickets, migrations, if any_",
    "",
    "## Notes (optional)",
    "",
    "_Links to related ADRs, code paths, issues, or benchmarks._",
    "",
  ].join("\n");
}

function parseStatus(raw: string): AdrStatus | null {
  const value = raw.trim().toLowerCase();
  if (value.startsWith("superseded")) return "Superseded";
  if (value.startsWith("accepted")) return "Accepted";
  if (value.startsWith("deprecated")) return "Deprecated";
  if (value.startsWith("proposed")) return "Proposed";
  return null;
}

export interface ParsedAdrMeta {
  title?: string;
  status?: AdrStatus;
  date?: string;
  scope?: string;
}

/**
 * Reads the structured fields back out of the markdown header. Anything that
 * is missing or malformed is simply omitted so callers can keep the previous
 * value — the file itself stays the source of truth.
 */
export function parseAdrMeta(content: string): ParsedAdrMeta {
  const meta: ParsedAdrMeta = {};

  const heading = content.match(/^#\s+(?:ADR-\d+\s*:\s*)?(.+)$/m);
  if (heading) {
    const title = heading[1].replace(/\s*#+\s*$/, "").trim();
    if (title) meta.title = title.slice(0, 200);
  }

  const date = content.match(/\*\*Date:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  if (date) meta.date = date[1];

  const status = content.match(/\*\*Status:\*\*\s*([^\n]+)/);
  if (status) {
    const parsed = parseStatus(status[1]);
    if (parsed) meta.status = parsed;
  }

  const scope = content.match(/\*\*Scope:\*\*\s*([^\n]+)/);
  if (scope) {
    const value = scope[1].trim();
    // Skip the "(e.g. ...)" placeholder form — it is not a real scope yet.
    if (value && !value.toLowerCase().startsWith("(e.g")) {
      meta.scope = value.slice(0, 80);
    }
  }

  return meta;
}

/**
 * Rewrites the **Status:** line in place (used by the editor's status select).
 * Keeps the rest of the document untouched so editing stays markdown-native.
 */
export function setStatusInMarkdown(
  content: string,
  status: AdrStatus,
): string {
  const line =
    status === "Superseded"
      ? "**Status:** Superseded by ADR-XXX"
      : `**Status:** ${status}`;

  if (/\*\*Status:\*\*[^\n]*/.test(content)) {
    return content.replace(/\*\*Status:\*\*[^\n]*/, line);
  }

  // No status line yet: insert one right below the title heading.
  const lines = content.split("\n");
  const index = lines.findIndex((l) => l.startsWith("# "));
  if (index === -1) return `${line}\n\n${content}`;
  lines.splice(index + 1, 0, "", line);
  return lines.join("\n");
}
