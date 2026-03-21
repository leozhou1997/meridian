import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createNextAction,
  deleteNextAction,
  getNextActions,
  getOrCreateDefaultTenant,
  updateNextAction,
} from "../db";

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
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const id = await createNextAction({ ...input, tenantId: tenant.id });
      const all = await getNextActions(input.dealId, tenant.id);
      return all.find(a => a.id === id)!;
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.number(), completed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await updateNextAction(input.id, tenant.id, { completed: input.completed });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await deleteNextAction(input.id, tenant.id);
      return { success: true };
    }),
});
