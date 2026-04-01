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
    description: "企业级销售资格评估框架，聚焦量化指标、经济决策人、决策标准、决策流程、痛点识别和内部支持者六大维度。",
    dimensions: [
      { key: "metrics", label: "Metrics 量化指标", description: "客户期望的可量化业务成果是什么？他们用什么KPI来衡量成功？" },
      { key: "economic_buyer", label: "Economic Buyer 经济决策人", description: "谁拥有最终的预算审批权？我们是否已经直接接触到这个人？" },
      { key: "decision_criteria", label: "Decision Criteria 决策标准", description: "驱动决策的技术、业务和政治标准是什么？我们与竞争对手相比如何？" },
      { key: "decision_process", label: "Decision Process 决策流程", description: "成交需要哪些步骤、时间线和审批？每个阶段谁参与？" },
      { key: "identify_pain", label: "Identify Pain 痛点识别", description: "客户的核心痛点是什么？是否紧迫到足以推动行动？如果不解决会怎样？" },
      { key: "champion", label: "Champion 关键支持者", description: "客户内部谁在积极为我们推动？此人是否有足够的权力和影响力？是否在指导我们？" },
    ],
  },
  bant: {
    name: "BANT",
    description: "经典销售资格评估框架，评估预算、决策权、需求和时间线四个维度。",
    dimensions: [
      { key: "budget", label: "Budget 预算", description: "是否已分配预算？预期投资范围是多少？是否有采购流程？" },
      { key: "authority", label: "Authority 决策权", description: "谁是决策者？我们是否能直接接触？审批链是怎样的？" },
      { key: "need", label: "Need 需求", description: "业务问题是什么？有多关键？不行动的代价是什么？" },
      { key: "timeline", label: "Timeline 时间线", description: "他们什么时候需要解决方案？什么在驱动紧迫性？是否有硬性截止日期？" },
    ],
  },
  spiced: {
    name: "SPICED",
    description: "现代销售框架：评估现状、痛点、影响、关键事件和决策五个维度。",
    dimensions: [
      { key: "situation", label: "Situation 现状", description: "客户当前状态如何？目前使用什么工具/流程？最近有什么变化？" },
      { key: "pain", label: "Pain 痛点", description: "他们面临什么具体问题？如何影响日常工作和业务成果？" },
      { key: "impact", label: "Impact 影响", description: "痛点的可量化业务影响是什么？收入损失、时间浪费、风险暴露？" },
      { key: "critical_event", label: "Critical Event 关键事件", description: "什么事件或截止日期在制造紧迫感？董事会、合同续签、监管变化？" },
      { key: "decision", label: "Decision 决策", description: "他们如何决策？谁参与？什么标准最重要？流程和时间线是怎样的？" },
    ],
  },
  meddicc: {
    name: "MEDDICC",
    description: "MEDDIC的扩展版本，增加竞争维度，适用于高度竞争的企业级交易。",
    dimensions: [
      { key: "metrics", label: "Metrics 量化指标", description: "客户期望的可量化成果。用什么KPI衡量成功？" },
      { key: "economic_buyer", label: "Economic Buyer 经济决策人", description: "谁拥有最终预算审批权？我们是否已接触？" },
      { key: "decision_criteria", label: "Decision Criteria 决策标准", description: "驱动决策的技术、业务和政治标准。" },
      { key: "decision_process", label: "Decision Process 决策流程", description: "成交所需的步骤、时间线和审批流程。" },
      { key: "identify_pain", label: "Identify Pain 痛点识别", description: "核心痛点、紧迫性和不行动的代价。" },
      { key: "champion", label: "Champion 关键支持者", description: "内部拥有权力和影响力、积极为我们推动的支持者。" },
      { key: "competition", label: "Competition 竞争分析", description: "我们在与谁竞争？对手的定位是什么？我们如何差异化？" },
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
