import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Pencil,
  Quote,
  Strikethrough,
} from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ViewMode = "edit" | "split" | "preview";

/** A pending edit: the new document plus the slice it replaces. */
interface Edit {
  value: string;
  regionStart: number;
  regionEnd: number;
  replacement: string;
  start: number;
  end: number;
}

function makeEdit(
  value: string,
  s: number,
  e: number,
  replacement: string,
  start: number,
  end: number,
): Edit {
  return {
    value: value.slice(0, s) + replacement + value.slice(e),
    regionStart: s,
    regionEnd: e,
    replacement,
    start,
    end,
  };
}

/** Wraps the selection (or a placeholder, which gets selected) in delimiters. */
function opWrap(
  value: string,
  s: number,
  e: number,
  before: string,
  after: string,
  placeholder: string,
): Edit {
  const selected = value.slice(s, e);
  const body = selected || placeholder;
  const replacement = before + body + after;
  const start = s + before.length;
  return makeEdit(value, s, e, replacement, start, start + body.length);
}

/** Adds or removes a line prefix (##, >, -, 1.) across the selected lines. */
function opLinePrefix(value: string, s: number, e: number, prefix: string): Edit {
  const lineStart = value.lastIndexOf("\n", Math.max(s - 1, 0)) + 1;
  let lineEnd = value.indexOf("\n", e);
  if (lineEnd === -1) lineEnd = value.length;

  const lines = value.slice(lineStart, lineEnd).split("\n");
  const nonEmpty = lines.filter((l) => l.length > 0);
  const shouldRemove = nonEmpty.some((l) => l.startsWith(prefix));

  const nextLines = lines.map((l) => {
    if (shouldRemove) return l.startsWith(prefix) ? l.slice(prefix.length) : l;
    return l.length === 0 ? l : prefix + l;
  });
  const replacement = nextLines.join("\n");
  return makeEdit(
    value,
    lineStart,
    lineEnd,
    replacement,
    lineStart,
    lineStart + replacement.length,
  );
}

/** Inserts a block (code fence / rule) around the cursor on its own lines. */
function opBlock(value: string, s: number, e: number, block: string, caret: number): Edit {
  const atLineStart = s === 0 || value[s - 1] === "\n";
  const leading = atLineStart ? "" : "\n";
  const trailing = e === value.length || value[e] === "\n" ? "\n" : "\n\n";
  const replacement = leading + block + trailing;
  const start = s + leading.length + caret;
  return makeEdit(value, s, e, replacement, start, start);
}

/** Markdown link: keeps the selection as the label, caret lands in the URL. */
function opLink(value: string, s: number, e: number): Edit {
  const selected = value.slice(s, e);
  const replacement = `[${selected}]()`;
  const start = s + selected.length + 3;
  return makeEdit(value, s, e, replacement, start, start);
}

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:bg-accent hover:text-foreground"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

const MODES: { id: ViewMode; label: string; icon: ReactNode }[] = [
  { id: "edit", label: "Edit", icon: <Pencil className="size-3.5" /> },
  { id: "split", label: "Split", icon: null },
  { id: "preview", label: "Preview", icon: <Eye className="size-3.5" /> },
];

export function MarkdownEditor({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [mode, setMode] = useState<ViewMode>(() =>
    typeof window !== "undefined" && window.innerWidth >= 1024
      ? "split"
      : "edit",
  );

  // Debounce the preview so keystrokes never wait on markdown parsing, and
  // skip rendering entirely while the preview pane is hidden.
  const [previewValue, setPreviewValue] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewValue(value), 160);
    return () => window.clearTimeout(timer);
  }, [value]);

  const showPreview = mode !== "edit";
  const html = useMemo(
    () => (showPreview ? renderMarkdown(previewValue) : ""),
    [showPreview, previewValue],
  );
  const wordCount = useMemo(
    () => value.trim().split(/\s+/).filter(Boolean).length,
    [value],
  );

  const editWith = useCallback(
    (fn: (value: string, s: number, e: number) => Edit) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const edit = fn(ta.value, ta.selectionStart, ta.selectionEnd);
      ta.focus();
      let applied = false;
      try {
        ta.setSelectionRange(edit.regionStart, edit.regionEnd);
        applied = document.execCommand("insertText", false, edit.replacement);
      } catch {
        applied = false;
      }
      if (!applied || ta.value !== edit.value) ta.value = edit.value;
      // Keep React state in sync whether or not the browser fired an input event.
      onChangeRef.current(ta.value);
      ta.setSelectionRange(edit.start, edit.end);
    },
    [],
  );

  // Stable references so the memoized toolbar can skip re-renders while typing.
  const ops = useMemo(
    () => ({
      bold: () => editWith((v, s, e) => opWrap(v, s, e, "**", "**", "bold text")),
      italic: () => editWith((v, s, e) => opWrap(v, s, e, "_", "_", "italic text")),
      strike: () =>
        editWith((v, s, e) => opWrap(v, s, e, "~~", "~~", "strikethrough")),
      inlineCode: () => editWith((v, s, e) => opWrap(v, s, e, "`", "`", "code")),
      link: () => editWith((v, s, e) => opLink(v, s, e)),
      heading2: () => editWith((v, s, e) => opLinePrefix(v, s, e, "## ")),
      heading3: () => editWith((v, s, e) => opLinePrefix(v, s, e, "### ")),
      quote: () => editWith((v, s, e) => opLinePrefix(v, s, e, "> ")),
      bullet: () => editWith((v, s, e) => opLinePrefix(v, s, e, "- ")),
      ordered: () => editWith((v, s, e) => opLinePrefix(v, s, e, "1. ")),
      codeBlock: () => editWith((v, s, e) => opBlock(v, s, e, "```\n\n```", 4)),
      rule: () => editWith((v, s, e) => opBlock(v, s, e, "---", 4)),
    }),
    [editWith],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = event.metaKey || event.ctrlKey;
    if (!mod) return;
    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      ops.bold();
    } else if (key === "i") {
      event.preventDefault();
      ops.italic();
    } else if (key === "k") {
      event.preventDefault();
      ops.link();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs",
        className,
      )}
    >
      {/* Formatting toolbar (memoized — skipped while typing) */}
      <EditorToolbar ops={ops} mode={mode} onModeChange={setMode} />

      {/* Editor + live preview */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          mode === "split" && "md:flex-row",
        )}
      >
        {mode !== "preview" && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder="Write your decision record in markdown…"
            aria-label="ADR markdown source"
            className={cn(
              "adr-source min-h-[300px] flex-1 resize-none bg-transparent px-5 py-4 text-foreground outline-none placeholder:text-muted-foreground/70",
              mode === "split" &&
                "border-b border-border/70 md:border-b-0 md:border-r",
            )}
          />
        )}
        {mode !== "edit" && (
          <div className="min-h-[300px] flex-1 overflow-auto px-5 py-4 sm:px-7 sm:py-6">
            {value.trim() ? (
              <div
                className="adr-prose"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing to preview yet.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/70 bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>Markdown</span>
        <span className="tabular-nums">
          {wordCount} {wordCount === 1 ? "word" : "words"} ·{" "}
          {value.split("\n").length} lines
        </span>
      </div>
    </div>
  );
}

interface EditorOps {
  bold: () => void;
  italic: () => void;
  strike: () => void;
  inlineCode: () => void;
  link: () => void;
  heading2: () => void;
  heading3: () => void;
  quote: () => void;
  bullet: () => void;
  ordered: () => void;
  codeBlock: () => void;
  rule: () => void;
}

/** Static formatting bar — memoized so typing skips its ~12 buttons. */
const EditorToolbar = memo(function EditorToolbar({
  ops,
  mode,
  onModeChange,
}: {
  ops: EditorOps;
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border/70 bg-muted/40 px-2 py-1.5">
      <ToolButton label="Heading 2" onClick={ops.heading2}>
        <Heading2 className="size-4" />
      </ToolButton>
      <ToolButton label="Heading 3" onClick={ops.heading3}>
        <Heading3 className="size-4" />
      </ToolButton>
      <div className="mx-1 h-4 w-px bg-border" />
      <ToolButton label="Bold — ⌘B" onClick={ops.bold}>
        <Bold className="size-4" />
      </ToolButton>
      <ToolButton label="Italic — ⌘I" onClick={ops.italic}>
        <Italic className="size-4" />
      </ToolButton>
      <ToolButton label="Strikethrough" onClick={ops.strike}>
        <Strikethrough className="size-4" />
      </ToolButton>
      <ToolButton label="Inline code" onClick={ops.inlineCode}>
        <Code className="size-4" />
      </ToolButton>
      <div className="mx-1 h-4 w-px bg-border" />
      <ToolButton label="Bullet list" onClick={ops.bullet}>
        <List className="size-4" />
      </ToolButton>
      <ToolButton label="Numbered list" onClick={ops.ordered}>
        <ListOrdered className="size-4" />
      </ToolButton>
      <ToolButton label="Quote" onClick={ops.quote}>
        <Quote className="size-4" />
      </ToolButton>
      <ToolButton label="Code block" onClick={ops.codeBlock}>
        <span className="text-[11px] font-semibold leading-none">```</span>
      </ToolButton>
      <ToolButton label="Link — ⌘K" onClick={ops.link}>
        <Link className="size-4" />
      </ToolButton>
      <ToolButton label="Divider" onClick={ops.rule}>
        <Minus className="size-4" />
      </ToolButton>

      <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-border/70 bg-background p-0.5">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onModeChange(item.id)}
            className={cn(
              "flex h-6 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-colors",
              mode === item.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
});
