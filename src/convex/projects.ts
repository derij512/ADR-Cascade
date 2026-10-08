import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { type Doc, type Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not authenticated");
  return userId;
}

async function getOwnedProject(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
) {
  const project = await ctx.db.get(projectId);
  if (!project) throw new Error("Project not found");
  if (project.userId !== userId) throw new Error("Not authorized");
  return project;
}

/**
 * ADR count for a project. New projects carry a denormalized counter, so this
 * is a plain field read; projects created before the counter existed fall back
 * to a one-off indexed scan so counts stay correct either way.
 */
async function countAdrs(
  ctx: QueryCtx | MutationCtx,
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
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const result = [];
    for (const project of projects) {
      result.push({
        ...project,
        adrCount: await countAdrs(ctx, project),
      });
    }

    // Most recently edited project first.
    result.sort((a, b) => b.updatedAt - a.updatedAt);
    return result;
  },
});

export const get = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUserId(ctx);
    const id = ctx.db.normalizeId("projects", projectId);
    if (!id) return null;
    const project = await ctx.db.get(id);
    if (!project || project.userId !== userId) return null;
    return project;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { name, description }) => {
    const userId = await requireUserId(ctx);
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Project name is required");
    const now = Date.now();
    return await ctx.db.insert("projects", {
      userId,
      name: trimmed.slice(0, 120),
      description: description?.trim() || undefined,
      adrCounter: 0,
      adrCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, name, description }) => {
    const userId = await requireUserId(ctx);
    await getOwnedProject(ctx, projectId, userId);
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Project name is required");
    await ctx.db.patch(projectId, {
      name: trimmed.slice(0, 120),
      description: description?.trim() || undefined,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUserId(ctx);
    await getOwnedProject(ctx, projectId, userId);

    const adrs = await ctx.db
      .query("adrs")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const adr of adrs) await ctx.db.delete(adr._id);

    await ctx.db.delete(projectId);
  },
});
