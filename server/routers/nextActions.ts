import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createNextAction,
  deleteNextAction,
  getNextActions,
  getOverdueNextActions,
  getOrCreateDefaultTenant,
  updateNextAction,
} from "../db";

const STATUS_VALUES = ["pending", "accepted", "rejected", "later", "in_progress", "done", "blocked"] as const;
const SOURCE_VALUES = ["manual", "ai_suggested"] as const;

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
      // Map status to completed boolean for backward compat
      const completed = input.status === "done";
      await updateNextAction(input.id, tenant.id, {
        status: input.status,
        completed,
      });
      return { success: true };
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.number(), completed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      // Sync status with completed toggle for backward compat
      const status = input.completed ? "done" : "accepted";
      await updateNextAction(input.id, tenant.id, { completed: input.completed, status });
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
