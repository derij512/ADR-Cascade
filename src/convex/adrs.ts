import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { type Doc, type Id } from "./_generated/dataModel";
import {
  buildAdrMarkdown,
  parseAdrMeta,
  slugifyScope,
  todayIsoDate,
} from "../lib/adr";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";

async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not authenticated");
  return userId;
}

/** Loads a project and asserts the caller owns it. */
async function requireOwnedProject(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
) {
  const project = await ctx.db.get(projectId);
  if (!project) throw new Error("Project not found");
  if (project.userId !== userId) throw new Error("Not authorized");
  return project;
}

async function requireOwnedAdr(
  ctx: QueryCtx | MutationCtx,
  adrId: Id<"adrs">,
  userId: Id<"users">,
) {
  const adr = await ctx.db.get(adrId);
  if (!adr) throw new Error("ADR not found");
  await requireOwnedProject(ctx, adr.projectId, userId);
  return adr;
}

/** Denormalized count with a fallback for projects from before the counter. */
async function currentAdrCount(
  ctx: MutationCtx | QueryCtx,
  project: Doc<"projects">,
): Promise<number> {
  if (typeof project.adrCount === "number") return project.adrCount;
  const adrs = await ctx.db
    .query("adrs")
    .withIndex("by_project", (q) => q.eq("projectId", project._id))
    .collect();
  return adrs.length;
}

export const list = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUserId(ctx);
    const id = ctx.db.normalizeId("projects", projectId);
    if (!id) return [];
    await requireOwnedProject(ctx, id, userId);
    const adrs = await ctx.db
      .query("adrs")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();
    // Canonical order: ADR number ascending; the UI re-sorts as asked.
    return adrs.sort((a, b) => a.number - b.number);
  },
});

export const get = query({
  args: { adrId: v.string() },
  handler: async (ctx, { adrId }) => {
    const userId = await requireUserId(ctx);
    const id = ctx.db.normalizeId("adrs", adrId);
    if (!id) return null;
    const adr = await ctx.db.get(id);
    if (!adr) return null;
    const project = await ctx.db.get(adr.projectId);
    if (!project || project.userId !== userId) return null;
    return adr;
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    // Sent by the client so the prefilled date matches the author's today.
    date: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, title, date }) => {
    const userId = await requireUserId(ctx);
    const project = await requireOwnedProject(ctx, projectId, userId);

    const trimmed = title.trim().replace(/\s+/g, " ");
    if (!trimmed) throw new Error("ADR name is required");
    if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("Invalid date");
    }

    const number = project.adrCounter + 1;
    await ctx.db.patch(projectId, {
      adrCounter: number,
      adrCount: (await currentAdrCount(ctx, project)) + 1,
    });

    const now = Date.now();
    const isoDate = date ?? todayIsoDate();
    const scope = slugifyScope(project.name);

    return await ctx.db.insert("adrs", {
      projectId,
      number,
      title: trimmed.slice(0, 200),
      status: "Proposed",
      scope,
      date: isoDate,
      content: buildAdrMarkdown({
        number,
        title: trimmed.slice(0, 200),
        status: "Proposed",
        date: isoDate,
        scope,
      }),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const save = mutation({
  args: {
    adrId: v.id("adrs"),
    content: v.string(),
  },
  handler: async (ctx, { adrId, content }) => {
    const userId = await requireUserId(ctx);
    const adr = await requireOwnedAdr(ctx, adrId, userId);
    if (content.length > 400_000) throw new Error("ADR is too large");

    // The markdown file is the source of truth: mirror its header fields
    // back into the record so lists can sort and filter by them.
    const meta = parseAdrMeta(content);
    await ctx.db.patch(adrId, {
      content,
      title: meta.title ?? adr.title,
      status: meta.status ?? adr.status,
      date: meta.date ?? adr.date,
      scope: meta.scope ?? adr.scope,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { adrId: v.id("adrs") },
  handler: async (ctx, { adrId }) => {
    const userId = await requireUserId(ctx);
    const adr = await requireOwnedAdr(ctx, adrId, userId);
    const project = await ctx.db.get(adr.projectId);
    if (project) {
      const count = await currentAdrCount(ctx, project);
      await ctx.db.patch(adr.projectId, { adrCount: Math.max(0, count - 1) });
    }
    await ctx.db.delete(adrId);
  },
});
