import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// Lifecycle of an ADR, mirrored from the markdown **Status:** line.
export const ADR_STATUSES = [
  "Proposed",
  "Accepted",
  "Deprecated",
  "Superseded",
] as const;

export const adrStatusValidator = v.union(
  v.literal("Proposed"),
  v.literal("Accepted"),
  v.literal("Deprecated"),
  v.literal("Superseded"),
);
export type AdrStatus = Infer<typeof adrStatusValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // A project groups the ADRs of one codebase / system.
    projects: defineTable({
      userId: v.id("users"),
      name: v.string(),
      description: v.optional(v.string()),
      // Monotonic counter used to auto-number new ADRs (ADR-001, ADR-002, ...).
      adrCounter: v.number(),
      // Denormalized ADR count so listing projects never scans ADR documents.
      adrCount: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_user", ["userId"]),

    // An ADR is a single markdown file. The structured fields below are kept
    // in sync with the markdown header so lists can sort and filter by them.
    adrs: defineTable({
      projectId: v.id("projects"),
      number: v.number(),
      title: v.string(),
      status: adrStatusValidator,
      scope: v.optional(v.string()),
      date: v.string(), // YYYY-MM-DD, taken from the markdown **Date:** line
      content: v.string(), // the full markdown file
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_project", ["projectId"])
  },
  {
    schemaValidation: false,
  },
);

export default schema;
