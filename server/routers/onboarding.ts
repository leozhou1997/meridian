import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import {
  createDeal,
  createStakeholder,
  createSnapshot,
  getOrCreateDefaultTenant,
  getDealById,
} from "../db";

// ─── Analyze Company URL ─────────────────────────────────────────────────────

export const onboardingRouter = router({
  analyzeCompanyUrl: protectedProcedure
    .input(z.object({
      url: z.string().min(1),
      knowledgeBase: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      const systemPrompt = `You are an expert business analyst. Given a company website URL, analyze the company and extract key information.

Return ONLY a valid JSON object with this exact structure:
{
  "companyName": "Official company name",
  "description": "2-3 sentence description of what the company does",
  "industry": "Primary industry/sector",
  "products": ["Product/Service 1", "Product/Service 2"],
  "targetMarket": "Who their customers are",
  "headquarters": "City, Country",
  "estimatedSize": "Estimated company size (employees)",
  "keyDifferentiator": "What makes them unique"
}

Be specific and accurate based on the URL domain and any knowledge you have about the company. If the URL is for a well-known company, use your knowledge. For lesser-known companies, make reasonable inferences from the domain name and any context provided.

Return ONLY the JSON, no markdown, no explanation.`;

      const userPrompt = `Analyze this company: ${input.url}
${input.knowledgeBase ? `\nAdditional context from knowledge base:\n${input.knowledgeBase}` : ''}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const rawContent = response.choices[0].message.content || '';
      const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
      let analysis;
      try {
        const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        analysis = JSON.parse(cleaned);
      } catch {
        analysis = {
          companyName: input.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/.*/g, ''),
          description: 'Company information extracted from URL',
          industry: 'Unknown',
          products: [],
          targetMarket: 'Unknown',
        };
      }

      return {
        companyName: analysis.companyName || '',
        description: analysis.description || '',
        industry: analysis.industry || '',
        products: analysis.products || [],
        targetMarket: analysis.targetMarket || '',
        headquarters: analysis.headquarters || '',
        estimatedSize: analysis.estimatedSize || '',
        keyDifferentiator: analysis.keyDifferentiator || '',
      };
    }),

  // ─── Create Deal from URL Analysis + Auto-generate Stakeholder Map ─────────

  createDealFromUrl: protectedProcedure
    .input(z.object({
      companyUrl: z.string(),
      companyName: z.string(),
      companyDescription: z.string().optional(),
      industry: z.string().optional(),
      products: z.array(z.string()).optional(),
      targetMarket: z.string().optional(),
      salesProcess: z.object({
        stages: z.array(z.string()).optional(),
        avgDealSize: z.string().optional(),
        avgDealCycle: z.string().optional(),
        teamSize: z.string().optional(),
      }).optional(),
      icp: z.object({
        industries: z.string().optional(),
        companySize: z.string().optional(),
        titles: z.string().optional(),
        painPoints: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      // 1. Create the deal
      const companyInfo = [
        input.companyDescription,
        input.industry ? `Industry: ${input.industry}` : '',
        input.products?.length ? `Products: ${input.products.join(', ')}` : '',
        input.targetMarket ? `Target Market: ${input.targetMarket}` : '',
      ].filter(Boolean).join('\n');

      const dealId = await createDeal({
        tenantId: tenant.id,
        ownerId: ctx.user.id,
        name: `${input.companyName} - New Opportunity`,
        company: input.companyName,
        website: input.companyUrl,
        stage: 'Discovery',
        value: 0,
        confidenceScore: 30,
        daysInStage: 0,
        companyInfo,
      });

      // 2. Use AI to generate stakeholders for this company
      const stakeholderPrompt = `You are an expert B2B sales strategist. Given a target company, generate a realistic buying committee / stakeholder map.

Return ONLY a valid JSON array of 4-6 stakeholders with this structure:
[
  {
    "name": "Full Name (realistic for the company's region/culture)",
    "title": "Job Title",
    "role": "Champion|Decision Maker|Influencer|Blocker|User|Evaluator",
    "sentiment": "Positive|Neutral|Negative",
    "engagement": "High|Medium|Low",
    "keyInsights": "1-2 sentences about this person's likely priorities and concerns",
    "linkedIn": "https://linkedin.com/in/placeholder"
  }
]

Make the stakeholders realistic for the company type and industry. Include a mix of:
- A potential Champion (someone who would benefit most from the solution)
- A Decision Maker (C-level or VP who signs off)
- An Influencer (technical evaluator or domain expert)
- A potential Blocker (procurement, legal, or competing interest)
- 1-2 additional relevant stakeholders

Use culturally appropriate names based on the company's headquarters location.
Return ONLY the JSON array, no markdown, no explanation.`;

      const stakeholderUserPrompt = `Generate a buying committee for selling to:
Company: ${input.companyName}
Industry: ${input.industry || 'Unknown'}
Description: ${input.companyDescription || 'Unknown'}
Products: ${input.products?.join(', ') || 'Unknown'}
Target Market: ${input.targetMarket || 'Unknown'}
${input.icp?.titles ? `Key decision maker titles to consider: ${input.icp.titles}` : ''}
${input.icp?.painPoints ? `Customer pain points: ${input.icp.painPoints}` : ''}`;

      let stakeholderData: any[] = [];
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: stakeholderPrompt },
            { role: "user", content: stakeholderUserPrompt },
          ],
        });

        const rawStakeholderContent = response.choices[0].message.content || '[]';
        const stakeholderContent = typeof rawStakeholderContent === 'string' ? rawStakeholderContent : JSON.stringify(rawStakeholderContent);
        const cleaned = stakeholderContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        stakeholderData = JSON.parse(cleaned);
      } catch (err) {
        console.warn('[Onboarding] Failed to generate stakeholders:', err);
        // Fallback: create minimal stakeholders
        stakeholderData = [
          { name: "Contact Person", title: "Key Contact", role: "Champion", sentiment: "Neutral", engagement: "Medium", keyInsights: "Primary point of contact" },
        ];
      }

      // 3. Create stakeholders in DB with map positions
      const stageWidth = 250;
      const startX = 100;
      for (let i = 0; i < stakeholderData.length; i++) {
        const s = stakeholderData[i];
        const stageIndex = Math.min(i, 3); // Spread across 4 stages
        const yOffset = (i % 2 === 0) ? 0 : 180;

        await createStakeholder({
          dealId,
          tenantId: tenant.id,
          name: s.name,
          title: s.title,
          role: s.role || 'User',
          sentiment: s.sentiment || 'Neutral',
          engagement: s.engagement || 'Medium',
          keyInsights: s.keyInsights,
          linkedIn: s.linkedIn,
          mapX: startX + stageIndex * stageWidth + (Math.random() * 40 - 20),
          mapY: 120 + yOffset + (Math.random() * 40 - 20),
        });
      }

      // 4. Generate initial AI insights for the deal
      try {
        const insightPrompt = `You are Meridian, an expert B2B sales intelligence AI. Generate initial insights for a new deal.

Return ONLY a valid JSON object:
{
  "whatsHappening": "2-3 sentences about the initial deal dynamics and what the AE should know going in",
  "keyRisks": [
    {"title": "Risk title", "detail": "Why this is a risk", "stakeholders": []}
  ],
  "whatsNext": [
    {"action": "Specific first action", "rationale": "Why this matters", "suggestedContacts": []}
  ]
}

Return ONLY JSON, no markdown.`;

        const insightResponse = await invokeLLM({
          messages: [
            { role: "system", content: insightPrompt },
            { role: "user", content: `New deal with ${input.companyName} (${input.industry || 'Unknown industry'}). ${input.companyDescription || ''}. Stakeholders: ${stakeholderData.map(s => `${s.name} (${s.title})`).join(', ')}` },
          ],
        });

        const rawInsightContent = insightResponse.choices[0].message.content || '';
        const insightContent = typeof rawInsightContent === 'string' ? rawInsightContent : JSON.stringify(rawInsightContent);
        const cleanedInsight = insightContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const insights = JSON.parse(cleanedInsight);

        await createSnapshot({
          dealId,
          tenantId: tenant.id,
          date: new Date(),
          whatsHappening: insights.whatsHappening || '',
          keyRisks: insights.keyRisks || [],
          whatsNext: insights.whatsNext || [],
          confidenceScore: 30,
          confidenceChange: 0,
          aiGenerated: true,
        });
      } catch (err) {
        console.warn('[Onboarding] Failed to generate initial insights:', err);
      }

      return { dealId, stakeholderCount: stakeholderData.length };
    }),
});
