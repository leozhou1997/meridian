import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createSnapshot,
  getOrCreateDefaultTenant,
  getSnapshots,
  getSnapshotCountsByTenant,
  updateSnapshotSuggestionActions,
} from "../db";

export const snapshotsRouter = router({
  countsByDeal: protectedProcedure
    .query(async ({ ctx }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      return getSnapshotCountsByTenant(tenant.id);
    }),

  listByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      return getSnapshots(input.dealId, tenant.id);
    }),

  create: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      date: z.date(),
      whatsHappening: z.string().optional(),
      whatsNext: z.union([z.string(), z.array(z.string())]).optional(),
      keyRisks: z.array(z.string()).optional(),
      confidenceScore: z.number().min(0).max(100),
      confidenceChange: z.number().default(0),
      interactionType: z.string().optional(),
      keyParticipant: z.string().optional(),
      aiGenerated: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      // Normalize whatsNext to string[] for DB storage
      const whatsNext = typeof input.whatsNext === 'string'
        ? [input.whatsNext]
        : input.whatsNext;
      const id = await createSnapshot({ ...input, whatsNext: whatsNext as any, tenantId: tenant.id });
      return { id };
    }),

  // Save user's disposition of AI suggestions for a snapshot
  saveSuggestionActions: protectedProcedure
    .input(z.object({
      snapshotId: z.number(),
      suggestionActions: z.array(z.object({
        action: z.string(),
        status: z.enum(['accepted', 'rejected', 'later', 'pending']),
        actionId: z.number().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await updateSnapshotSuggestionActions(input.snapshotId, tenant.id, input.suggestionActions);
      return { success: true };
    }),
});
