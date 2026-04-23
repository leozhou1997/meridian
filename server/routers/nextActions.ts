import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createMeeting,
  createNextAction,
  deleteNextAction,
  getNextActions,
  getOverdueNextActions,
  getOrCreateDefaultTenant,
  updateNextAction,
} from "../db";
import { nextActions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const STATUS_VALUES = ["pending", "accepted", "rejected", "later", "in_progress", "done", "blocked"] as const;
const SOURCE_VALUES = ["manual", "ai_suggested"] as const;

// ─── Helper: auto-log action completion to timeline ──────────────────────────

async function logActionCompletion(actionId: number, tenantId: number) {
  // We need to fetch the action to get its text and dealId
  // Use a raw approach since we already have the db module
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return;

  const [action] = await db
    .select()
    .from(nextActions)
    .where(and(eq(nextActions.id, actionId), eq(nextActions.tenantId, tenantId)));

  if (!action) return;

  // Create a timeline entry for the completed action
  const dimensionLabel = action.dimensionKey
    ? {
        need_discovery: "需求确认",
        value_proposition: "价值论证",
        commercial_close: "商务突破",
        relationship_penetration: "关系渗透",
        tech_validation: "技术验证",
        competitive_defense: "竞争防御",
      }[action.dimensionKey] || action.dimensionKey
    : "";

  const summary = `[系统] 行动已完成${dimensionLabel ? ` · ${dimensionLabel}` : ""}\n\n✅ ${action.text}`;

  await createMeeting({
    dealId: action.dealId,
    tenantId,
    date: new Date(),
    type: "Internal Meeting",
    summary,
    duration: 0,
    keyParticipant: undefined,
  });
}

export const nextActionsRouter = router({
  listByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      return getNextActions(input.dealId, tenant.id);
    }),

  create: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      text: z.string().min(1),
      dueDate: z.string().or(z.date()).transform(d => d ? new Date(d) : undefined).optional(),
      priority: z.enum(["high", "medium", "low"]).default("medium"),
      stakeholderId: z.number().optional(),
      snapshotId: z.number().optional(),
      dimensionKey: z.string().optional(),
      status: z.enum(STATUS_VALUES).default("pending"),
      source: z.enum(SOURCE_VALUES).default("manual"),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const id = await createNextAction({ ...input, tenantId: tenant.id });
      const all = await getNextActions(input.dealId, tenant.id);
      return all.find(a => a.id === id)!;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(STATUS_VALUES),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const completed = input.status === "done";
      await updateNextAction(input.id, tenant.id, {
        status: input.status,
        completed,
      });

      // Auto-log to timeline when action is completed
      if (completed) {
        try {
          await logActionCompletion(input.id, tenant.id);
        } catch (e) {
          console.error("[Auto-log] Failed to log action completion:", e);
          // Don't fail the main operation
        }
      }

      return { success: true };
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.number(), completed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const status = input.completed ? "done" : "accepted";
      await updateNextAction(input.id, tenant.id, { completed: input.completed, status });

      // Auto-log to timeline when action is completed
      if (input.completed) {
        try {
          await logActionCompletion(input.id, tenant.id);
        } catch (e) {
          console.error("[Auto-log] Failed to log action completion:", e);
        }
      }

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await deleteNextAction(input.id, tenant.id);
      return { success: true };
    }),

  listOverdue: protectedProcedure
    .query(async ({ ctx }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      return getOverdueNextActions(tenant.id);
    }),
});
