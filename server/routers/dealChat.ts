import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getDealChatMessages,
  createDealChatMessage,
  getOrCreateDefaultTenant,
  getDealById,
  getStakeholders,
  getDealDimensions,
  getNextActions,
  getMeetings,
} from "../db";
import { invokeLLM } from "../_core/llm";
import { buildSellerContext } from "./sellerContext";

export const dealChatRouter = router({
  /** Get chat history for a deal */
  list: protectedProcedure
    .input(z.object({ dealId: z.number(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      return getDealChatMessages(input.dealId, tenant.id, input.limit);
    }),

  /** Send a message and get AI response */
  send: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      message: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      // Save user message
      const userMsgId = await createDealChatMessage({
        dealId: input.dealId,
        tenantId: tenant.id,
        userId: ctx.user.id,
        role: "user",
        content: input.message,
      });

      // Gather deal context for AI
      const deal = await getDealById(input.dealId, tenant.id);
      const stakeholders = await getStakeholders(input.dealId, tenant.id);
      const dimensions = await getDealDimensions(input.dealId, tenant.id);
      const actions = await getNextActions(input.dealId, tenant.id);
      const meetings = await getMeetings(input.dealId, tenant.id);

      // Fetch seller context from company profile + knowledge base documents
      const { contextBlock: chatSellerCtx } = await buildSellerContext(tenant.id);

      const contextStr = buildDealContext(deal, stakeholders, dimensions, actions, meetings);

      // Call LLM
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `你是子午线AI销售军师，专门帮助大客户销售团队分析复杂交易、制定渗透策略。

你的核心能力：
1. 基于交易的六个决策维度（技术验证、商务突破、高层推动、竞对防御、预算推进、案例支撑）分析交易局势
2. 识别关键决策人的态度和影响力，制定多线程渗透路径
3. 发现交易卡点，给出具体可执行的下一步行动

回答风格：
- 像一个经验丰富的销售VP在指导下属，直接、具体、可操作
- 用中文回答，关键术语可以用英文
- 给出的建议必须基于已有的交易数据，不要编造信息
- 如果数据不足，明确说明需要补充什么信息
- 回答要结构化，使用标题和要点
${chatSellerCtx}

当前交易上下文：
${contextStr}`,
          },
          { role: "user", content: input.message },
        ],
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const aiContent = typeof rawContent === 'string' ? rawContent : "抱歉，暂时无法生成回复。";

      // Save AI response
      const aiMsgId = await createDealChatMessage({
        dealId: input.dealId,
        tenantId: tenant.id,
        userId: ctx.user.id,
        role: "assistant",
        content: aiContent,
      });

      return {
        userMessage: { id: userMsgId, role: "user" as const, content: input.message },
        aiMessage: { id: aiMsgId, role: "assistant" as const, content: aiContent },
      };
    }),
});

function buildDealContext(
  deal: any,
  stakeholders: any[],
  dimensions: any[],
  actions: any[],
  meetings: any[],
): string {
  const parts: string[] = [];

  if (deal) {
    parts.push(`## 交易信息
- 客户: ${deal.company}
- 交易名称: ${deal.name}
- 阶段: ${deal.stage}
- 金额: ¥${(deal.value || 0).toLocaleString()}
- 信心指数: ${deal.confidenceScore}%
- 当前阶段天数: ${deal.daysInStage}天`);
  }

  if (stakeholders.length > 0) {
    parts.push(`## 决策人 (${stakeholders.length}人)
${stakeholders.map(s => `- ${s.name} | ${s.title || '未知职位'} | 角色:${s.role} | 态度:${s.sentiment} | 参与度:${s.engagement}`).join('\n')}`);
  }

  if (dimensions.length > 0) {
    const dimLabels: Record<string, string> = {
      tech_validation: "技术验证",
      commercial_breakthrough: "商务突破",
      executive_engagement: "高层推动",
      competitive_defense: "竞对防御",
      budget_advancement: "预算推进",
      case_support: "案例支撑",
    };
    parts.push(`## 决策维度状态
${dimensions.map(d => `- ${dimLabels[d.dimensionKey] || d.dimensionKey}: ${d.status}${d.aiSummary ? ` — ${d.aiSummary}` : ''}`).join('\n')}`);
  }

  if (actions.length > 0) {
    parts.push(`## 待办动作 (${actions.length}项)
${actions.map(a => `- [${a.status === 'done' ? '✓' : a.status === 'blocked' ? '✗' : a.status === 'in_progress' ? '▶' : ' '}] ${a.text}${a.dimensionKey ? ` (${a.dimensionKey})` : ''}`).join('\n')}`);
  }

  if (meetings.length > 0) {
    const recentMeetings = meetings.slice(0, 10);
    parts.push(`## 最近会议记录 (${recentMeetings.length}条)
${recentMeetings.map(m => `- ${new Date(m.date).toLocaleDateString('zh-CN')} | ${m.type} | ${m.keyParticipant || ''} | ${m.summary || '无摘要'}`).join('\n')}`);
  }

  return parts.join('\n\n');
}
