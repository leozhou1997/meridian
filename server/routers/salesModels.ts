import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getSalesModels,
  getSalesModelById,
  createSalesModel,
  updateSalesModel,
  deleteSalesModel,
  updateDealSalesModel,
  getOrCreateDefaultTenant,
} from "../db";

// ─── Built-in Sales Models ──────────────────────────────────────────────────

export const BUILT_IN_MODELS: Record<string, {
  name: string;
  description: string;
  dimensions: Array<{ key: string; label: string; description: string }>;
}> = {
  meddic: {
    name: "MEDDIC",
    description: "Enterprise sales qualification framework focusing on Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, and Champion.",
    dimensions: [
      { key: "metrics", label: "Metrics", description: "What are the quantifiable business outcomes the customer expects? What KPIs will they use to measure success?" },
      { key: "economic_buyer", label: "Economic Buyer", description: "Who has the final authority and budget sign-off? Have we engaged them directly?" },
      { key: "decision_criteria", label: "Decision Criteria", description: "What technical, business, and political criteria will drive the decision? How do we rank vs. alternatives?" },
      { key: "decision_process", label: "Decision Process", description: "What are the steps, timeline, and approvals required to close? Who is involved at each stage?" },
      { key: "identify_pain", label: "Identify Pain", description: "What is the customer's core pain? Is it urgent enough to drive action? What happens if they do nothing?" },
      { key: "champion", label: "Champion", description: "Who inside the account is actively selling on our behalf? Do they have power and influence? Are they coaching us?" },
    ],
  },
  bant: {
    name: "BANT",
    description: "Classic qualification framework assessing Budget, Authority, Need, and Timeline.",
    dimensions: [
      { key: "budget", label: "Budget", description: "Has budget been allocated? What is the expected investment range? Is there a procurement process?" },
      { key: "authority", label: "Authority", description: "Who is the decision maker? Do we have direct access? What is the approval chain?" },
      { key: "need", label: "Need", description: "What is the business problem? How critical is it? What is the cost of inaction?" },
      { key: "timeline", label: "Timeline", description: "When do they need a solution? What is driving the urgency? Are there hard deadlines?" },
    ],
  },
  spiced: {
    name: "SPICED",
    description: "Modern sales framework: Situation, Pain, Impact, Critical Event, and Decision.",
    dimensions: [
      { key: "situation", label: "Situation", description: "What is the customer's current state? What tools/processes do they use today? What has changed recently?" },
      { key: "pain", label: "Pain", description: "What specific problems are they facing? How does it affect their daily work and business outcomes?" },
      { key: "impact", label: "Impact", description: "What is the quantifiable business impact of the pain? Revenue lost, time wasted, risk exposure?" },
      { key: "critical_event", label: "Critical Event", description: "What event or deadline is creating urgency? Board meeting, contract renewal, regulatory change?" },
      { key: "decision", label: "Decision", description: "How will they decide? Who is involved? What criteria matter most? What is the process and timeline?" },
    ],
  },
  meddicc: {
    name: "MEDDICC",
    description: "Extended MEDDIC with Competition dimension for highly competitive enterprise deals.",
    dimensions: [
      { key: "metrics", label: "Metrics", description: "Quantifiable outcomes the customer expects. What KPIs will measure success?" },
      { key: "economic_buyer", label: "Economic Buyer", description: "Who has final budget authority? Have we engaged them?" },
      { key: "decision_criteria", label: "Decision Criteria", description: "Technical, business, and political criteria driving the decision." },
      { key: "decision_process", label: "Decision Process", description: "Steps, timeline, and approvals required to close." },
      { key: "identify_pain", label: "Identify Pain", description: "Core pain, urgency, and cost of inaction." },
      { key: "champion", label: "Champion", description: "Internal advocate with power and influence actively selling for us." },
      { key: "competition", label: "Competition", description: "Who are we competing against? What is their positioning? How do we differentiate?" },
    ],
  },
};

export function getModelDimensions(salesModel: string, customModelDimensions?: Array<{ key: string; label: string; description: string }>) {
  if (salesModel === "custom" && customModelDimensions) {
    return customModelDimensions;
  }
  return BUILT_IN_MODELS[salesModel]?.dimensions ?? BUILT_IN_MODELS.meddic.dimensions;
}

export function getModelName(salesModel: string, customModelName?: string) {
  if (salesModel === "custom" && customModelName) return customModelName;
  return BUILT_IN_MODELS[salesModel]?.name ?? "MEDDIC";
}

export const salesModelRouter = router({
  // List built-in models + user's custom models
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
    const customModels = await getSalesModels(tenant.id);

    const builtIn = Object.entries(BUILT_IN_MODELS).map(([key, model]) => ({
      id: null as number | null,
      key,
      name: model.name,
      description: model.description,
      dimensions: model.dimensions,
      isBuiltIn: true,
    }));

    const custom = customModels.map(m => ({
      id: m.id,
      key: "custom",
      name: m.name,
      description: m.description ?? "",
      dimensions: m.dimensions,
      isBuiltIn: false,
    }));

    return [...builtIn, ...custom];
  }),

  // Get a specific model's details
  get: protectedProcedure
    .input(z.object({ modelKey: z.string(), customModelId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      if (input.modelKey !== "custom") {
        const model = BUILT_IN_MODELS[input.modelKey];
        if (!model) return null;
        return { key: input.modelKey, ...model, isBuiltIn: true };
      }
      if (!input.customModelId) return null;
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const model = await getSalesModelById(input.customModelId, tenant.id);
      if (!model) return null;
      return { key: "custom", name: model.name, description: model.description ?? "", dimensions: model.dimensions, isBuiltIn: false };
    }),

  // Create a custom sales model
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      dimensions: z.array(z.object({
        key: z.string(),
        label: z.string(),
        description: z.string(),
      })).min(2).max(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const id = await createSalesModel({
        tenantId: tenant.id,
        name: input.name,
        description: input.description,
        dimensions: input.dimensions,
        isBuiltIn: false,
      });
      return { id };
    }),

  // Update a custom sales model
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      dimensions: z.array(z.object({
        key: z.string(),
        label: z.string(),
        description: z.string(),
      })).min(2).max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const { id, ...data } = input;
      await updateSalesModel(id, tenant.id, data);
      return { success: true };
    }),

  // Delete a custom sales model
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await deleteSalesModel(input.id, tenant.id);
      return { success: true };
    }),

  // Switch a deal's sales model
  setDealModel: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      salesModel: z.string(),
      customModelId: z.number().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await updateDealSalesModel(input.dealId, tenant.id, input.salesModel, input.customModelId);
      return { success: true };
    }),
});
