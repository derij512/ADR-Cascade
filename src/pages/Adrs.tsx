import { AppHeader } from "@/components/AppHeader";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Doc } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import {
  formatAdrNumber,
  slugifyScope,
  todayIsoDate,
  type AdrStatus,
} from "@/lib/adr";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

type SortKey = "number" | "title" | "date" | "status" | "updated";
type SortDir = "asc" | "desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "number", label: "ADR number" },
  { value: "title", label: "Title" },
  { value: "date", label: "Date" },
  { value: "status", label: "Status" },
  { value: "updated", label: "Last updated" },
];

const STATUS_ORDER: Record<AdrStatus, number> = {
  Proposed: 0,
  Accepted: 1,
  Deprecated: 2,
  Superseded: 3,
};

/** Asks for a name, then shows exactly what will be auto-generated. */
function NewAdrDialog({
  project,
  onOpenChange,
  onCreated,
}: {
  project: Doc<"projects">;
  onOpenChange: (open: boolean) => void;
  onCreated: (adrId: string) => void;
}) {
  const createAdr = useMutation(api.adrs.create);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const nextNumber = formatAdrNumber(project.adrCounter + 1);
  const today = todayIsoDate();
  const scope = slugifyScope(project.name);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const adrId = await createAdr({
        projectId: project._id,
        title: title.trim(),
        date: today,
      });
      toast.success(`${nextNumber} created`);
      onCreated(adrId);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Could not create the ADR",
      );
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New ADR</DialogTitle>
          <DialogDescription>
            Give the decision a short, descriptive name. The file is created
            from the ADR template with everything else prefilled.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="adr-title">Decision name</Label>
            <Input
              id="adr-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Adopt event sourcing for billing"
              autoFocus
              maxLength={200}
            />
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/40 p-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Auto-generated
            </p>
            <dl className="grid grid-cols-[5.5rem_1fr] items-center gap-x-3 gap-y-1.5 text-xs">
              <dt className="text-muted-foreground">Number</dt>
              <dd className="font-mono font-medium">{nextNumber}</dd>
              <dt className="text-muted-foreground">Date</dt>
              <dd className="font-mono">{today}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <StatusBadge status="Proposed" />
              </dd>
              <dt className="text-muted-foreground">Scope</dt>
              <dd className="truncate font-mono">{scope}</dd>
            </dl>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Create ADR
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAdrDialog({
  adr,
  onOpenChange,
}: {
  adr: Doc<"adrs">;
  onOpenChange: (open: boolean) => void;
}) {
  const removeAdr = useMutation(api.adrs.remove);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await removeAdr({ adrId: adr._id });
      toast.success(`${formatAdrNumber(adr.number)} deleted`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Could not delete the ADR",
      );
    }
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {formatAdrNumber(adr.number)}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            “{adr.title}” will be removed from this project. This can&apos;t
            be undone.
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
  );
}

export default function AdrListPage() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const project = useQuery(api.projects.get, { projectId });
  const adrs = useQuery(api.adrs.list, { projectId });
  const navigate = useNavigate();

  const [sortKey, setSortKey] = useState<SortKey>("number");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Doc<"adrs"> | null>(null);

  const sortedAdrs = useMemo(() => {
    if (!adrs) return null;
    const list = [...adrs];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "date":
          cmp = a.date.localeCompare(b.date);
          break;
        case "status":
          cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          break;
        case "updated":
          cmp = a.updatedAt - b.updatedAt;
          break;
        default:
          cmp = a.number - b.number;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [adrs, sortKey, sortDir]);

  // Still loading, or the id doesn't resolve to one of this user's projects.
  const notFound = project === null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        context={
          project ? (
            <span className="truncate font-medium">{project.name}</span>
          ) : undefined
        }
      />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All projects
        </button>

        {notFound ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <h1 className="text-lg font-medium tracking-tight">
              Project not found
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              It may have been deleted, or the link is wrong.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={() => navigate("/dashboard")}
            >
              Back to projects
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Decision records
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {project ? project.name : "…"}
              </h1>
              {project?.description && (
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
            </div>

            {/* Toolbar: New ADR top-left, sorting top-right */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                className="gap-2"
                disabled={!project}
                onClick={() => setNewDialogOpen(true)}
              >
                <Plus className="size-4" />
                New ADR
              </Button>

              <div className="flex items-center gap-2">
                <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                  Sort by
                </span>
                <Select
                  value={sortKey}
                  onValueChange={(value) => setSortKey(value as SortKey)}
                >
                  <SelectTrigger className="h-9 w-[150px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  title={sortDir === "asc" ? "Ascending" : "Descending"}
                  onClick={() =>
                    setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
                  }
                >
                  {sortDir === "asc" ? (
                    <ArrowUp className="size-4" />
                  ) : (
                    <ArrowDown className="size-4" />
                  )}
                  <span className="sr-only">
                    {sortDir === "asc"
                      ? "Sorted ascending — switch to descending"
                      : "Sorted descending — switch to ascending"}
                  </span>
                </Button>
              </div>
            </div>

            {/* Loading skeleton */}
            {sortedAdrs === null && (
              <div className="mt-5 grid gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[68px] animate-pulse rounded-xl border border-border/60 bg-card"
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {sortedAdrs?.length === 0 && (
              <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                  <FileText className="size-5 text-muted-foreground" />
                </div>
                <h2 className="text-base font-medium tracking-tight">
                  No decision records yet
                </h2>
                <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                  Create your first ADR — it gets a number, today&apos;s date,
                  status, scope and the full section template automatically.
                </p>
                <Button
                  type="button"
                  className="mt-5 gap-2"
                  onClick={() => setNewDialogOpen(true)}
                >
                  <Plus className="size-4" />
                  New ADR
                </Button>
              </div>
            )}

            {/* ADR rows */}
            {sortedAdrs && sortedAdrs.length > 0 && (
              <div className="mt-5 grid gap-3">
                {sortedAdrs.map((adr) => (
                  <div
                    key={adr._id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(`/dashboard/${projectId}/adr/${adr._id}`)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter")
                        navigate(`/dashboard/${projectId}/adr/${adr._id}`);
                    }}
                    className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5 text-left shadow-xs transition-all hover:-translate-y-px hover:border-ring/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:gap-4 sm:px-5"
                  >
                    <span className="hidden shrink-0 rounded-md border border-border/70 bg-muted px-2 py-1 font-mono text-[11px] font-medium text-muted-foreground transition-colors group-hover:border-ring/30 group-hover:text-foreground sm:inline-flex">
                      {formatAdrNumber(adr.number)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium tracking-tight">
                        {adr.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono sm:hidden">
                          {formatAdrNumber(adr.number)}
                        </span>
                        <span className="tabular-nums">{adr.date}</span>
                        {adr.scope && (
                          <>
                            <span className="size-0.5 rounded-full bg-muted-foreground/50" />
                            <span className="truncate font-mono text-[11px]">
                              {adr.scope}
                            </span>
                          </>
                        )}
                        <span className="hidden md:inline">
                          · edited{" "}
                          {formatDistanceToNow(adr.updatedAt, {
                            addSuffix: true,
                          })}
                        </span>
                      </p>
                    </div>

                    <StatusBadge
                      status={adr.status}
                      className="hidden sm:inline-flex"
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-muted-foreground opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">ADR actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-40"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/dashboard/${projectId}/adr/${adr._id}`)
                          }
                        >
                          <FileText className="size-4" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(adr)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {newDialogOpen && project && (
        <NewAdrDialog
          key={project._id}
          project={project}
          onOpenChange={(open) => !open && setNewDialogOpen(false)}
          onCreated={(adrId) =>
            navigate(`/dashboard/${projectId}/adr/${adrId}`)
          }
        />
      )}
      {deleteTarget && (
        <DeleteAdrDialog
          key={deleteTarget._id}
          adr={deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
