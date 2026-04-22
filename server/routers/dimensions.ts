import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getDealDimensions,
  ensureDealDimensions,
  updateDealDimension,
  bulkUpdateDealDimensions,
  getNextActionsByDimension,
  getOrCreateDefaultTenant,
  getDealById,
  getStakeholders,
  getMeetings,
  getNextActions,
  getStrategyNotes,
  createNextAction,
} from "../db";
import { invokeLLM } from "../_core/llm";

const DIMENSION_STATUS = ["not_started", "in_progress", "completed", "blocked"] as const;

export const dimensionsRouter = router({
  /** Get all dimensions for a deal (auto-creates defaults if none exist) */
  listByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      return ensureDealDimensions(input.dealId, tenant.id);
    }),

  /** Update a single dimension's status/notes */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(DIMENSION_STATUS).optional(),
      notes: z.string().optional(),
      aiSummary: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const { id, ...data } = input;
      await updateDealDimension(id, tenant.id, data);
      return { success: true };
    }),

  /** Bulk update dimensions (used by AI generation) */
  bulkUpdate: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      dimensions: z.array(z.object({
        dimensionKey: z.string(),
        status: z.string(),
        aiSummary: z.string().optional(),
        notes: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await bulkUpdateDealDimensions(input.dealId, tenant.id, input.dimensions);
      return { success: true };
    }),

  /** Get action items for a specific dimension */
  getActions: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      dimensionKey: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      return getNextActionsByDimension(input.dealId, tenant.id, input.dimensionKey);
    }),

  /** AI-generate Decision Map: assess all 6 dimensions + create action items */
  generateMap: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      language: z.enum(["en", "zh"]).default("zh"),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      // Gather all deal context
      const deal = await getDealById(input.dealId, tenant.id);
      if (!deal) throw new Error("Deal not found");

      const stakeholders = await getStakeholders(input.dealId, tenant.id);
      const meetings = await getMeetings(input.dealId, tenant.id);
      const existingActions = await getNextActions(input.dealId, tenant.id);
      const strategyNotes = await getStrategyNotes(input.dealId, tenant.id);

      // Check for evidence
      const meetingsWithContent = meetings.filter(m => m.summary && String(m.summary).trim().length > 20);
      if (meetingsWithContent.length === 0) {
        return {
          success: false,
          error: input.language === 'zh'
            ? '暂无足够的销售记录来生成 Decision Map。请先在交易室中上传会议记录、微信截图或邮件等销售跟进内容。'
            : 'Not enough sales records to generate Decision Map. Please upload meeting notes first.',
        };
      }

      const meetingEvidence = meetingsWithContent.map((m, i) => {
        const dateStr = new Date(m.date).toISOString().split('T')[0];
        return `Meeting ${i + 1} (${m.type}, ${dateStr}${m.keyParticipant ? `, with ${m.keyParticipant}` : ''}):\n${m.summary}`;
      }).join('\n\n');

      const stakeholderSummary = stakeholders.map(s =>
        `- ${s.name} | ${s.title || 'Unknown'} | Role: ${s.role} | Sentiment: ${s.sentiment} | Engagement: ${s.engagement}`
      ).join('\n');

      const strategyBlock = strategyNotes.length > 0
        ? `\n\nInternal Strategy Notes:\n${strategyNotes.map(n => `[${n.category}] ${n.content}`).join('\n')}`
        : '';

      const langInstruction = input.language === 'zh'
        ? '\n\nIMPORTANT: All output MUST be in Simplified Chinese (中文). Only proper nouns (names, company names) may remain in English.'
        : '';

      const systemPrompt = `You are Meridian, an elite B2B enterprise sales strategist. You analyze complex deals through 6 Decision Dimensions to create a penetration roadmap.

The 6 Decision Dimensions:
1. tech_validation (技术验证): Has the prospect validated our technical solution? POC status, technical champion engagement, integration concerns.
2. commercial_breakthrough (商务突破): Commercial terms progress. Pricing discussions, contract negotiations, procurement engagement.
3. executive_engagement (高层推动): Executive sponsor identification and engagement. C-level access, strategic alignment.
4. competitive_defense (竞对防御): Competitive landscape awareness. Incumbent displacement strategy, differentiation positioning.
5. budget_advancement (预算推进): Budget allocation and approval progress. Funding source, fiscal year timing, approval chain.
6. case_support (案例支撑): Reference cases and proof points. Similar industry wins, ROI evidence, customer testimonials.

For each dimension, assess:
- Status: "not_started" (no evidence), "in_progress" (active engagement), "completed" (dimension secured), "blocked" (obstacle identified)
- Summary: 1-2 sentences grounded in meeting evidence
- Actions: 1-2 specific next steps for this dimension

CRITICAL: Every assessment MUST be grounded in meeting evidence. Do NOT fabricate. If no evidence exists for a dimension, mark it "not_started" and suggest discovery actions.${langInstruction}

Return ONLY valid JSON:
{
  "dimensions": [
    {
      "dimensionKey": "tech_validation",
      "status": "in_progress",
      "aiSummary": "Evidence-based summary...",
      "actions": [
        { "text": "Specific action with named person", "priority": "high", "status": "pending" }
      ]
    }
  ],
  "quickInsights": [
    "Insight 1 grounded in evidence",
    "Insight 2",
    "Insight 3"
  ]
}`;

      const userPrompt = `Deal: ${deal.company} — ${deal.name}
Stage: ${deal.stage} | Value: $${(deal.value || 0).toLocaleString()} | Confidence: ${deal.confidenceScore}%
${deal.companyInfo ? `Company: ${deal.companyInfo}` : ''}

Stakeholders (${stakeholders.length}):
${stakeholderSummary}${strategyBlock}

Existing Actions (${existingActions.length}):
${existingActions.map(a => `- [${a.status}] ${a.text}${a.dimensionKey ? ` (${a.dimensionKey})` : ''}`).join('\n')}

=== MEETING EVIDENCE (${meetingsWithContent.length} meetings) ===
${meetingEvidence}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const content = typeof rawContent === 'string' ? rawContent : '';

      let parsed: {
        dimensions: Array<{
          dimensionKey: string;
          status: string;
          aiSummary: string;
          actions?: Array<{ text: string; priority?: string; status?: string }>;
        }>;
        quickInsights?: string[];
      } | null = null;

      try {
        const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        return { success: false, error: 'Failed to parse AI response' };
      }

      if (!parsed?.dimensions) {
        return { success: false, error: 'Invalid AI response structure' };
      }

      // Update dimensions in DB
      await bulkUpdateDealDimensions(
        input.dealId,
        tenant.id,
        parsed.dimensions.map(d => ({
          dimensionKey: d.dimensionKey,
          status: d.status,
          aiSummary: d.aiSummary,
        }))
      );

      // Create new action items from AI suggestions
      let actionsCreated = 0;
      for (const dim of parsed.dimensions) {
        if (dim.actions) {
          for (const action of dim.actions) {
            await createNextAction({
              dealId: input.dealId,
              tenantId: tenant.id,
              text: action.text,
              priority: (action.priority as any) || 'medium',
              source: 'ai_suggested',
              status: (action.status as any) || 'pending',
              dimensionKey: dim.dimensionKey,
            });
            actionsCreated++;
          }
        }
      }

      return {
        success: true,
        dimensionsUpdated: parsed.dimensions.length,
        actionsCreated,
        quickInsights: parsed.quickInsights || [],
      };
    }),
});
