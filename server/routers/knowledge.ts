import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createKbDocument,
  deleteKbDocument,
  getKbDocuments,
  getOrCreateDefaultTenant,
  updateKbDocument,
} from "../db";

export const knowledgeRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
    return getKbDocuments(tenant.id);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      category: z.enum(["product", "playbook", "icp"]).default("product"),
      description: z.string().optional(),
      fileType: z.enum(["pdf", "doc", "md", "txt"]).default("md"),
      content: z.string().optional(),
      fileUrl: z.string().optional(),
      fileSize: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const id = await createKbDocument({ ...input, tenantId: tenant.id, uploadedBy: ctx.user.id });
      const all = await getKbDocuments(tenant.id);
      return all.find(d => d.id === id)!;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      content: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const { id, ...data } = input;
      await updateKbDocument(id, tenant.id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await deleteKbDocument(input.id, tenant.id);
      return { success: true };
    }),
});
