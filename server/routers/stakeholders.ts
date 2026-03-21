import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createStakeholder,
  deleteStakeholder,
  getAllStakeholdersForTenant,
  getOrCreateDefaultTenant,
  getStakeholders,
  updateStakeholder,
} from "../db";

export const stakeholdersRouter = router({
  listByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      return getStakeholders(input.dealId, tenant.id);
    }),

  listAll: protectedProcedure.query(async ({ ctx }) => {
    const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
    return getAllStakeholdersForTenant(tenant.id);
  }),

  create: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      name: z.string().min(1),
      title: z.string().optional(),
      role: z.enum(["Champion", "Decision Maker", "Influencer", "Blocker", "User", "Evaluator"]).default("User"),
      sentiment: z.enum(["Positive", "Neutral", "Negative"]).default("Neutral"),
      engagement: z.enum(["High", "Medium", "Low"]).default("Medium"),
      email: z.string().optional(),
      linkedIn: z.string().optional(),
      keyInsights: z.string().optional(),
      personalNotes: z.string().optional(),
      mapX: z.number().optional(),
      mapY: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const id = await createStakeholder({ ...input, tenantId: tenant.id });
      const all = await getStakeholders(input.dealId, tenant.id);
      return all.find(s => s.id === id)!;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      title: z.string().optional(),
      role: z.enum(["Champion", "Decision Maker", "Influencer", "Blocker", "User", "Evaluator"]).optional(),
      sentiment: z.enum(["Positive", "Neutral", "Negative"]).optional(),
      engagement: z.enum(["High", "Medium", "Low"]).optional(),
      email: z.string().optional(),
      linkedIn: z.string().optional(),
      keyInsights: z.string().optional(),
      personalNotes: z.string().optional(),
      personalSignals: z.array(z.object({
        id: z.string(),
        text: z.string(),
        emoji: z.string(),
        source: z.string().optional(),
        aiExtracted: z.boolean(),
      })).optional(),
      mapX: z.number().optional(),
      mapY: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const { id, ...data } = input;
      await updateStakeholder(id, tenant.id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await deleteStakeholder(input.id, tenant.id);
      return { success: true };
    }),
});
