import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createDeal,
  deleteDeal,
  getDealById,
  getDeals,
  getOrCreateDefaultTenant,
  updateDeal,
} from "../db";

export const dealsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
    return getDeals(tenant.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const deal = await getDealById(input.id, tenant.id);
      if (!deal) throw new Error("Deal not found");
      return deal;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      company: z.string().min(1),
      stage: z.enum(["Discovery", "Demo", "Technical Evaluation", "POC", "Negotiation", "Closed Won", "Closed Lost"]).default("Discovery"),
      value: z.number().default(0),
      website: z.string().optional(),
      companyInfo: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const id = await createDeal({
        ...input,
        tenantId: tenant.id,
        ownerId: ctx.user.id,
        confidenceScore: 50,
        daysInStage: 0,
      });
      return getDealById(id, tenant.id);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      company: z.string().optional(),
      stage: z.enum(["Discovery", "Demo", "Technical Evaluation", "POC", "Negotiation", "Closed Won", "Closed Lost"]).optional(),
      value: z.number().optional(),
      confidenceScore: z.number().min(0).max(100).optional(),
      riskOneLiner: z.string().optional(),
      companyInfo: z.string().optional(),
      lastActivity: z.string().optional(),
      daysInStage: z.number().optional(),
      buyingStages: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const { id, ...data } = input;
      await updateDeal(id, tenant.id, data);
      return getDealById(id, tenant.id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await deleteDeal(input.id, tenant.id);
      return { success: true };
    }),
});
