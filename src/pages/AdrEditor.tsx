import { AppHeader } from "@/components/AppHeader";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import {
  ADR_STATUSES,
  formatAdrNumber,
  parseAdrMeta,
  setStatusInMarkdown,
  type AdrStatus,
} from "@/lib/adr";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Check,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

type SaveState = "saved" | "saving" | "dirty" | "error";

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Saving…
      </span>
    );
  }
  if (state === "dirty") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Unsaved changes
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-rose-600">
        <span className="size-1.5 rounded-full bg-rose-500" />
        Save failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Check className="size-3.5 text-emerald-600" />
      Saved
    </span>
  );
}

export default function AdrEditorPage() {
  const { projectId = "", adrId = "" } = useParams<{
    projectId: string;
    adrId: string;
  }>();
  const project = useQuery(api.projects.get, { projectId });
  const adr = useQuery(api.adrs.get, { adrId });
  const saveAdr = useMutation(api.adrs.save);
  const removeAdr = useMutation(api.adrs.remove);
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const contentRef = useRef(content);
  contentRef.current = content;
  /** Last content known to be persisted; null until the ADR has loaded. */
  const savedRef = useRef<string | null>(null);

  // Seed the editor once with the loaded file; afterwards the local buffer
  // owns the text so typing is never clobbered by query updates.
  useEffect(() => {
    if (adr && !initialized) {
      setContent(adr.content);
      savedRef.current = adr.content;
      setInitialized(true);
    }
  }, [adr, initialized]);

  const persist = useCallback(async () => {
    const value = contentRef.current;
    if (savedRef.current === null || savedRef.current === value) return;
    setSaveState("saving");
    try {
      await saveAdr({ adrId: adrId as Id<"adrs">, content: value });
      savedRef.current = value;
      // The user may have kept typing while the save was in flight.
      setSaveState(contentRef.current === value ? "saved" : "dirty");
    } catch (error) {
      console.error(error);
      setSaveState("error");
      toast.error("Couldn't save your changes — check your connection.");
    }
  }, [adrId, saveAdr]);

  // Debounced autosave whenever the buffer diverges from the saved copy.
  useEffect(() => {
    if (!initialized || content === savedRef.current) return;
    setSaveState("dirty");
    const timer = window.setTimeout(() => void persist(), 900);
    return () => window.clearTimeout(timer);
  }, [content, initialized, persist]);

  // Flush pending edits when leaving the page.
  useEffect(
    () => () => {
      void persist();
    },
    [persist],
  );

  // ⌘/Ctrl+S saves immediately.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void persist();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [persist]);

  const meta = useMemo(() => parseAdrMeta(content), [content]);
  const title = meta.title || adr?.title || "Untitled ADR";
  const status: AdrStatus = meta.status || adr?.status || "Proposed";
  const isDirty = saveState === "dirty" || saveState === "error";

  const handleStatusChange = (value: string) => {
    setContent(setStatusInMarkdown(content, value as AdrStatus));
  };

  const handleDelete = async () => {
    if (!adr) return;
    setDeleting(true);
    try {
      await removeAdr({ adrId: adr._id });
      toast.success(`${formatAdrNumber(adr.number)} deleted`);
      navigate(`/dashboard/${projectId}`);
    } catch (error) {
      console.error(error);
      setDeleting(false);
      toast.error(
        error instanceof Error ? error.message : "Could not delete the ADR",
      );
    }
  };

  const loading = adr === undefined || project === undefined;
  const notFound = adr === null || project === null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        context={
          project ? (
            <span className="truncate font-medium">{project.name}</span>
          ) : undefined
        }
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(`/dashboard/${projectId}`)}
          className="mb-4 inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All ADRs
        </button>

        {loading && (
          <div className="flex-1 space-y-4">
            <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
            <div className="h-[540px] animate-pulse rounded-xl border border-border/60 bg-card" />
          </div>
        )}

        {notFound && (
          <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <h1 className="text-lg font-medium tracking-tight">
              Decision record not found
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              It may have been deleted, or the link is wrong.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={() => navigate(`/dashboard/${projectId}`)}
            >
              Back to ADRs
            </Button>
          </div>
        )}

        {adr && initialized && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-border/70 bg-muted px-2 py-1 font-mono text-[11px] font-medium text-muted-foreground">
                    {formatAdrNumber(adr.number)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {meta.date ?? adr.date}
                    {(meta.scope ?? adr.scope) && (
                      <>
                        {" · "}
                        <span className="font-mono">
                          {meta.scope ?? adr.scope}
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  {title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger
                    className="h-9 w-[150px] text-sm"
                    aria-label="ADR status"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADR_STATUSES.map((option) => (
                      <SelectItem key={option} value={option}>
                        <StatusBadge status={option} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <SaveIndicator state={saveState} />

                <Button
                  type="button"
                  size="sm"
                  className="h-9"
                  disabled={!isDirty}
                  onClick={() => void persist()}
                >
                  Save
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">More actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="size-4" />
                      Delete ADR
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <MarkdownEditor
              value={content}
              onChange={setContent}
              className="mt-5 min-h-[540px] flex-1"
            />
          </>
        )}
      </main>

      {adr && deleteOpen && (
        <AlertDialog
          open
          onOpenChange={(open) => !open && setDeleteOpen(false)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {formatAdrNumber(adr.number)}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                “{adr.title}” will be permanently removed from this project.
                This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={deleting} onClick={handleDelete}>
                {deleting && <Loader2 className="size-4 animate-spin" />}
                Delete ADR
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
