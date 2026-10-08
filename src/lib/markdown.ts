import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/**
 * Light sanitizer for ADR documents. Content is the author's own markdown,
 * but a pasted document should still never be able to run script or wire up
 * event handlers when rendered in the preview pane.
 */
function sanitize(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi,
      '$1="#"',
    );
}

/** Renders markdown to sanitized HTML for the live preview pane. */
export function renderMarkdown(source: string): string {
  if (!source.trim()) return "";
  const raw = marked.parse(source, { async: false }) as string;
  return sanitize(raw);
}
