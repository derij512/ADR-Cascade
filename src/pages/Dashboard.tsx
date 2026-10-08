import { AppHeader } from "@/components/AppHeader";
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
import { Textarea } from "@/components/ui/textarea";
import type { Doc } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  FileText,
  FolderOpen,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

type Project = Doc<"projects"> & { adrCount: number };

/** Create / edit dialog — mounted fresh per open so fields start empty. */
function ProjectDialog({
  project,
  onOpenChange,
}: {
  project: Doc<"projects"> | null;
  onOpenChange: (open: boolean) => void;
}) {
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [saving, setSaving] = useState(false);

  const isEdit = project !== null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      if (project) {
        await updateProject({
          projectId: project._id,
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast.success("Project updated");
      } else {
        await createProject({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast.success("Project created", {
          description: "Now add its first architecture decision record.",
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the project's name and description."
              : "A project groups the decision records of one system or codebase."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Payments Platform"
              autoFocus
              maxLength={120}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-description">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What does this system do?"
              rows={3}
              maxLength={400}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Confirmation for deleting a project and all of its ADRs. */
function DeleteProjectDialog({
  project,
  onOpenChange,
}: {
  project: Project;
  onOpenChange: (open: boolean) => void;
}) {
  const removeProject = useMutation(api.projects.remove);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await removeProject({ projectId: project._id });
      toast.success(`Deleted “${project.name}”`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Could not delete project",
      );
    }
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete “{project.name}”?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the project and its{" "}
            {project.adrCount}{" "}
            {project.adrCount === 1 ? "decision record" : "decision records"}.
            This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={deleting} onClick={handleDelete}>
            {deleting && <Loader2 className="size-4 animate-spin" />}
            Delete project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function Dashboard() {
  const projects = useQuery(api.projects.list);
  const navigate = useNavigate();

  const [dialog, setDialog] = useState<
    { kind: "form"; project: Doc<"projects"> | null } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const openCreate = () => setDialog({ kind: "form", project: null });
  const openEdit = (project: Doc<"projects">) =>
    setDialog({ kind: "form", project });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {/* Page heading */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Workspace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Projects
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            One project per system — every architecture decision recorded as a
            markdown ADR inside it.
          </p>
        </div>

        {/* Toolbar: new project button sits top-left */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button type="button" className="gap-2" onClick={openCreate}>
            <Plus className="size-4" />
            New project
          </Button>
          {projects && projects.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {projects.length}{" "}
              {projects.length === 1 ? "project" : "projects"}
            </span>
          )}
        </div>

        {/* Loading skeleton */}
        {projects === undefined && (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-xl border border-border/60 bg-card"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {projects?.length === 0 && (
          <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
              <FolderOpen className="size-5 text-muted-foreground" />
            </div>
            <h2 className="text-base font-medium tracking-tight">
              No projects yet
            </h2>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              Create your first project to start recording architecture
              decisions. Each ADR is a self-contained markdown file with
              auto-generated numbering and dates.
            </p>
            <Button type="button" className="mt-5 gap-2" onClick={openCreate}>
              <Plus className="size-4" />
              New project
            </Button>
          </div>
        )}

        {/* Project grid */}
        {projects && projects.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project._id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/dashboard/${project._id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter")
                    navigate(`/dashboard/${project._id}`);
                }}
                className="group flex cursor-pointer flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-ring/10 group-hover:text-ring">
                    <FolderOpen className="size-5" />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Project actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-40"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <DropdownMenuItem
                        onClick={() => navigate(`/dashboard/${project._id}`)}
                      >
                        <ArrowRight className="size-4" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(project)}>
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(project)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-medium tracking-tight">
                    {project.name}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {project.description || "No description."}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="size-3.5" />
                    {project.adrCount}{" "}
                    {project.adrCount === 1 ? "ADR" : "ADRs"}
                  </span>
                  <span>
                    Updated{" "}
                    {formatDistanceToNow(project.updatedAt, {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {dialog?.kind === "form" && (
        <ProjectDialog
          key={dialog.project?._id ?? "new"}
          project={dialog.project}
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
      {deleteTarget && (
        <DeleteProjectDialog
          key={deleteTarget._id}
          project={deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
