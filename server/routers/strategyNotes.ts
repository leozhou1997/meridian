import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createStrategyNote,
  deleteStrategyNote,
  getOrCreateDefaultTenant,
  getStrategyNotes,
  updateStrategyNote,
} from "../db";

const STRATEGY_CATEGORIES = [
  "pricing", "relationship", "competitive", "internal", "other",
] as const;

export const strategyNotesRouter = router({
  listByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      return getStrategyNotes(input.dealId, tenant.id);
    }),

  create: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      title: z.string().optional(),
      category: z.enum(STRATEGY_CATEGORIES).default("other"),
      content: z.string().default(""),
      date: z.string().or(z.date()).transform(d => new Date(d)).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const id = await createStrategyNote({
        dealId: input.dealId,
        tenantId: tenant.id,
        title: input.title,
        category: input.category,
        content: input.content,
        date: input.date,
      });
      const all = await getStrategyNotes(input.dealId, tenant.id);
      return all.find(n => n.id === id)!;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      category: z.enum(STRATEGY_CATEGORIES).optional(),
      content: z.string().min(1).optional(),
      date: z.string().or(z.date()).transform(d => new Date(d)).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const { id, ...rest } = input;
      await updateStrategyNote(id, tenant.id, rest);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await deleteStrategyNote(input.id, tenant.id);
      return { success: true };
    }),
});
