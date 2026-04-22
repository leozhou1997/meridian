import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getStakeholderNeeds,
  createStakeholderNeed,
  updateStakeholderNeed,
  deleteStakeholderNeed,
  bulkCreateStakeholderNeeds,
  deleteStakeholderNeedsByDeal,
  getOrCreateDefaultTenant,
  getDealById,
  getStakeholders,
  getMeetings,
  getNextActions,
  getStrategyNotes,
  ensureDealDimensions,
} from "../db";
import { invokeLLM } from "../_core/llm";
import { buildSellerContext } from "./sellerContext";

const NEED_TYPE = ["organizational", "professional", "personal"] as const;
const NEED_STATUS = ["unmet", "in_progress", "satisfied", "blocked"] as const;
const NEED_PRIORITY = ["critical", "important", "nice_to_have"] as const;

export const stakeholderNeedsRouter = router({
  /** List all needs for a deal */
  listByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      return getStakeholderNeeds(input.dealId, tenant.id);
    }),

  /** Create a single need */
  create: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      stakeholderId: z.number(),
      needType: z.enum(NEED_TYPE),
      title: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(NEED_STATUS).default("unmet"),
      dimensionKey: z.string().optional(),
      priority: z.enum(NEED_PRIORITY).default("important"),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const id = await createStakeholderNeed({
        ...input,
        tenantId: tenant.id,
        aiGenerated: false,
      });
      return { id, success: true };
    }),

  /** Update a need */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      needType: z.enum(NEED_TYPE).optional(),
      status: z.enum(NEED_STATUS).optional(),
      priority: z.enum(NEED_PRIORITY).optional(),
      dimensionKey: z.string().nullable().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const { id, ...data } = input;
      await updateStakeholderNeed(id, tenant.id, data);
      return { success: true };
    }),

  /** Delete a need */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await deleteStakeholderNeed(input.id, tenant.id);
      return { success: true };
    }),

  /** AI-generate needs for all stakeholders in a deal */
  aiGenerate: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      language: z.enum(["en", "zh"]).default("zh"),
      regenerate: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      const deal = await getDealById(input.dealId, tenant.id);
      if (!deal) throw new Error("Deal not found");

      // Fetch seller context from company profile + knowledge base documents
      const { contextBlock: needsSellerCtx } = await buildSellerContext(tenant.id);

      const stakeholderList = await getStakeholders(input.dealId, tenant.id);
      if (stakeholderList.length === 0) {
        return { success: false, error: "No stakeholders found for this deal" };
      }

      const meetings = await getMeetings(input.dealId, tenant.id);
      const existingActions = await getNextActions(input.dealId, tenant.id);
      const strategyNotes = await getStrategyNotes(input.dealId, tenant.id);
      const dimensions = await ensureDealDimensions(input.dealId, tenant.id);

      // If regenerate, clear existing AI-generated needs
      if (input.regenerate) {
        await deleteStakeholderNeedsByDeal(input.dealId, tenant.id);
      }

      const meetingsWithContent = meetings.filter(m => m.summary && String(m.summary).trim().length > 20);
      const meetingEvidence = meetingsWithContent.map((m, i) => {
        const dateStr = new Date(m.date).toISOString().split('T')[0];
        return `Meeting ${i + 1} (${m.type}, ${dateStr}${m.keyParticipant ? `, with ${m.keyParticipant}` : ''}):\n${m.summary}`;
      }).join('\n\n');

      const stakeholderSummary = stakeholderList.map(s =>
        `- [ID: ${s.id}] ${s.name} | ${s.title || 'Unknown'} | Role: ${s.role} | Sentiment: ${s.sentiment} | Engagement: ${s.engagement}${s.keyInsights ? ` | Insights: ${s.keyInsights}` : ''}`
      ).join('\n');

      // Build name-to-ID mapping for fallback resolution
      const nameToIdMap = new Map<string, number>();
      for (const s of stakeholderList) {
        nameToIdMap.set(s.name.toLowerCase().trim(), s.id);
        // Also map by first name + last name variations
        const parts = s.name.trim().split(/\s+/);
        if (parts.length >= 2) {
          nameToIdMap.set(parts[parts.length - 1].toLowerCase(), s.id); // last name
        }
      }

      const dimensionSummary = dimensions.map(d =>
        `- ${d.dimensionKey}: ${d.status}${d.aiSummary ? ` — ${d.aiSummary.slice(0, 100)}` : ''}`
      ).join('\n');

      const actionsSummary = existingActions.map(a =>
        `- [${a.status}] ${a.text}${a.stakeholderId ? ` (stakeholder #${a.stakeholderId})` : ''}${a.dimensionKey ? ` [${a.dimensionKey}]` : ''}`
      ).join('\n');

      const langInstruction = input.language === 'zh'
        ? '\n\nIMPORTANT: All output MUST be in Simplified Chinese (中文). Only proper nouns may remain in English.'
        : '';

      const systemPrompt = `You are Meridian, an elite B2B enterprise sales strategist specializing in complex deal analysis.${needsSellerCtx}

Your task: Analyze each stakeholder in this deal and identify their **needs** across three categories:

1. **Organizational Needs (组织需求)**: What their company/department needs from this deal — ROI, compliance, integration, efficiency gains, risk reduction
2. **Professional Needs (职业需求)**: What advances their career — demonstrating leadership, delivering results, gaining visibility, building their team
3. **Personal Needs (个人需求)**: Personal motivations — reducing workload, avoiding blame, maintaining reputation, job security, personal relationships

For each stakeholder, generate 2-4 needs total (not all categories are required — only include what's evidenced or strongly inferred).

Each need should:
- Have a concise title (max 30 chars)
- Have a brief description explaining the evidence and context
- Be linked to a relevant sales dimension if applicable
- Have a realistic status based on current deal progress
- Have a priority based on how critical it is to winning the deal

Be specific. Reference actual meeting evidence. Don't generate generic needs — every need should be grounded in this specific deal context.${langInstruction}

Return ONLY valid JSON:
{
  "stakeholders": [
    {
      "stakeholderId": 123,
      "needs": [
        {
          "needType": "organizational",
          "title": "Concise need title",
          "description": "Why this matters, evidence from meetings",
          "status": "unmet",
          "dimensionKey": "tech_validation",
          "priority": "critical"
        }
      ]
    }
  ]
}`;

      const userPrompt = `Deal: ${deal.company} — ${deal.name}
Stage: ${deal.stage} | Value: $${(deal.value || 0).toLocaleString()} | Confidence: ${deal.confidenceScore}%
Company Info: ${deal.companyInfo || 'N/A'}

Stakeholders:
${stakeholderSummary}

Sales Dimensions:
${dimensionSummary}

Existing Actions:
${actionsSummary || 'None'}

Strategy Notes:
${strategyNotes.map(n => `[${n.category}] ${n.content}`).join('\n') || 'None'}

=== MEETING EVIDENCE ===
${meetingEvidence || 'No meetings recorded yet.'}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const content = typeof rawContent === 'string' ? rawContent : '';


      let parsed: {
        stakeholders: Array<{
          stakeholderId: number | string;
          needs: Array<{
            needType: string;
            title: string;
            description?: string;
            status?: string;
            dimensionKey?: string;
            priority?: string;
          }>;
        }>;
      } | null = null;

      try {
        const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        return { success: false, error: 'Failed to parse AI response' };
      }

      if (!parsed?.stakeholders || !Array.isArray(parsed.stakeholders)) {
        return { success: false, error: 'Invalid AI response structure' };
      }

      // Validate stakeholder IDs exist
      const validStakeholderIds = new Set(stakeholderList.map(s => s.id));

      const needsToCreate: Array<{
        dealId: number;
        tenantId: number;
        stakeholderId: number;
        needType: "organizational" | "professional" | "personal";
        title: string;
        description?: string;
        status: "unmet" | "in_progress" | "satisfied" | "blocked";
        dimensionKey?: string;
        priority: "critical" | "important" | "nice_to_have";
        aiGenerated: boolean;
        sortOrder: number;
      }> = [];

      let sortCounter = 0;
      for (const sh of parsed.stakeholders) {
        // Resolve stakeholder ID: could be numeric ID or name string from AI
        let resolvedId: number | null = null;
        if (typeof sh.stakeholderId === 'number' && validStakeholderIds.has(sh.stakeholderId)) {
          resolvedId = sh.stakeholderId;
        } else if (typeof sh.stakeholderId === 'string') {
          // AI returned a name instead of ID — resolve via name mapping
          resolvedId = nameToIdMap.get((sh.stakeholderId as string).toLowerCase().trim()) ?? null;
        }
        if (resolvedId === null) continue;

        for (const need of sh.needs) {
          const validNeedTypes = ["organizational", "professional", "personal"] as const;
          const validStatuses = ["unmet", "in_progress", "satisfied", "blocked"] as const;
          const validPriorities = ["critical", "important", "nice_to_have"] as const;

          const needType = validNeedTypes.includes(need.needType as any)
            ? (need.needType as typeof validNeedTypes[number])
            : "organizational";
          const status = validStatuses.includes(need.status as any)
            ? (need.status as typeof validStatuses[number])
            : "unmet";
          const priority = validPriorities.includes(need.priority as any)
            ? (need.priority as typeof validPriorities[number])
            : "important";

          needsToCreate.push({
            dealId: input.dealId,
            tenantId: tenant.id,
            stakeholderId: resolvedId,
            needType,
            title: need.title.slice(0, 255),
            description: need.description,
            status,
            dimensionKey: need.dimensionKey,
            priority,
            aiGenerated: true,
            sortOrder: sortCounter++,
          });
        }
      }

      const ids = await bulkCreateStakeholderNeeds(needsToCreate);

      return {
        success: true,
        needsCreated: ids.length,
      };
    }),
});
