import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import {
  createCompanyProfile,
  updateCompanyProfile,
  getCompanyProfile,
  createDeal,
  createStakeholder,
  createSnapshot,
  getOrCreateDefaultTenant,
  createKbDocument,
  getActivePrompt,
} from "../db";

// ─── Analyze Company URL (for onboarding — YOUR company) ────────────────────

export const onboardingRouter = router({
  // Get existing company profile for the current user's tenant
  getCompanyProfile: protectedProcedure.query(async ({ ctx }) => {
    const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
    const profile = await getCompanyProfile(tenant.id);
    return profile ?? null;
  }),

  // Step 1: Analyze YOUR company URL and extract info
  analyzeCompanyUrl: protectedProcedure
    .input(z.object({
      url: z.string().min(1),
      knowledgeBase: z.string().optional(),
      language: z.enum(["en", "zh"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const langSuffix = input.language === "zh" ? "\n\nIMPORTANT: All text values in the JSON response MUST be in Simplified Chinese (中文)." : "";

      const dbPrompt = await getActivePrompt('company_analysis');
      const systemPrompt = dbPrompt?.systemPrompt ?? `You are an expert business analyst specializing in B2B company profiling. Given a company website URL, produce a detailed, specific analysis that a sales team can immediately use.

CRITICAL RULES:
- Be SPECIFIC, not generic. Instead of "provides solutions", say exactly WHAT they sell.
- Use concrete numbers where possible (revenue, employee count, founding year).
- Name actual products/services, not categories.
- Describe the business model clearly: what they sell, to whom, how they make money.
- If the company is in manufacturing/industrial, specify what materials/products they handle.

Return ONLY a valid JSON object with this exact structure:
{
  "companyName": "Official company name (include legal entity if known, e.g. Inc., Ltd., GmbH)",
  "description": "3-4 sentences: What does this company actually DO? What is their core business? How do they make money? Be concrete — e.g. 'Doctor Scrap operates an online B2B marketplace for industrial scrap metal trading, connecting sellers of ferrous and non-ferrous scrap with buyers across Asia. Their platform provides real-time pricing, logistics coordination, and quality verification for scrap materials including copper, aluminum, steel, and e-waste.' NOT 'Doctor Scrap is a company that provides solutions in the recycling space.'",
  "industry": "Specific sub-industry (e.g. 'Industrial Scrap Metal Trading & Recycling' not just 'Recycling')",
  "products": ["Name each specific product/service — e.g. 'Scrap Metal B2B Marketplace', 'Real-time Scrap Price Index', 'Logistics & Quality Inspection Service'"],
  "targetMarket": "Be specific about customer types — e.g. 'Steel mills, smelters, auto parts manufacturers, and electronics recyclers in China and Southeast Asia' not just 'businesses'",
  "headquarters": "City, Country",
  "estimatedSize": "Be specific if known — e.g. '50-200 employees, Series B funded' or '500+ employees, publicly traded'",
  "keyDifferentiator": "What specifically makes them different from competitors? Name the competitive advantage."
}

Return ONLY the JSON, no markdown, no explanation.`;

      const userPrompt = `Analyze this company in detail: ${input.url}

IMPORTANT: Be extremely specific about what this company does. A reader should understand their exact business after reading your analysis. Avoid vague phrases like "provides solutions" or "offers services" — instead describe the actual products, materials, or transactions involved.
${input.knowledgeBase ? `\nAdditional context provided by the user:\n${input.knowledgeBase}` : ''}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt + langSuffix },
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

  // Save company profile (onboarding complete)
  saveCompanyProfile: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1),
      companyWebsite: z.string().optional(),
      companyDescription: z.string().optional(),
      industry: z.string().optional(),
      products: z.array(z.string()).optional(),
      targetMarket: z.string().optional(),
      headquarters: z.string().optional(),
      estimatedSize: z.string().optional(),
      keyDifferentiator: z.string().optional(),
      salesStages: z.array(z.string()).optional(),
      avgDealSize: z.string().optional(),
      avgDealCycle: z.string().optional(),
      salesTeamSize: z.string().optional(),
      icpIndustries: z.string().optional(),
      icpCompanySize: z.string().optional(),
      icpTitles: z.string().optional(),
      icpPainPoints: z.string().optional(),
      knowledgeBaseText: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const existing = await getCompanyProfile(tenant.id);

      const profileData = {
        tenantId: tenant.id,
        userId: ctx.user.id,
        companyName: input.companyName,
        companyWebsite: input.companyWebsite ?? null,
        companyDescription: input.companyDescription ?? null,
        industry: input.industry ?? null,
        products: input.products ?? null,
        targetMarket: input.targetMarket ?? null,
        headquarters: input.headquarters ?? null,
        estimatedSize: input.estimatedSize ?? null,
        keyDifferentiator: input.keyDifferentiator ?? null,
        salesStages: input.salesStages ?? null,
        avgDealSize: input.avgDealSize ?? null,
        avgDealCycle: input.avgDealCycle ?? null,
        salesTeamSize: input.salesTeamSize ?? null,
        icpIndustries: input.icpIndustries ?? null,
        icpCompanySize: input.icpCompanySize ?? null,
        icpTitles: input.icpTitles ?? null,
        icpPainPoints: input.icpPainPoints ?? null,
        knowledgeBaseText: input.knowledgeBaseText ?? null,
        onboardingCompleted: true,
      };

      if (existing) {
        await updateCompanyProfile(existing.id, tenant.id, profileData);
        return { profileId: existing.id };
      } else {
        const profileId = await createCompanyProfile(profileData);
        return { profileId };
      }
    }),

  // ─── Create Deal from Target Customer URL (separate from onboarding) ──────

  createDealFromUrl: protectedProcedure
    .input(z.object({
      targetCompanyUrl: z.string(),
      targetCompanyName: z.string(),
      targetCompanyDescription: z.string().optional(),
      targetIndustry: z.string().optional(),
      targetProducts: z.array(z.string()).optional(),
      targetMarket: z.string().optional(),
      targetHeadquarters: z.string().optional(),
      language: z.enum(["en", "zh"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const langSuffix = input.language === "zh" ? "\n\nIMPORTANT: All text values in the JSON response MUST be in Simplified Chinese (中文). Use Chinese for names of Chinese stakeholders, insights, risks, and action items." : "";

      // Load company profile for context
      const companyProfile = await getCompanyProfile(tenant.id);

      // 1. Create the deal
      const companyInfo = [
        input.targetCompanyDescription,
        input.targetIndustry ? `Industry: ${input.targetIndustry}` : '',
        input.targetProducts?.length ? `Products: ${input.targetProducts.join(', ')}` : '',
        input.targetMarket ? `Target Market: ${input.targetMarket}` : '',
      ].filter(Boolean).join('\n');

      const dealId = await createDeal({
        tenantId: tenant.id,
        ownerId: ctx.user.id,
        name: input.targetCompanyName,
        company: input.targetCompanyName,
        website: input.targetCompanyUrl,
        stage: 'Discovery',
        value: 0,
        confidenceScore: 30,
        daysInStage: 0,
        companyInfo,
      });

      // 2. Build context from company profile for AI
      const sellerContext = companyProfile ? `
SELLER CONTEXT (our company):
- Company: ${companyProfile.companyName}
- Industry: ${companyProfile.industry || 'Unknown'}
- Products: ${companyProfile.products?.join(', ') || 'Unknown'}
- Target Market: ${companyProfile.targetMarket || 'Unknown'}
- Key Differentiator: ${companyProfile.keyDifferentiator || 'Unknown'}
- ICP Industries: ${companyProfile.icpIndustries || 'Unknown'}
- ICP Titles: ${companyProfile.icpTitles || 'Unknown'}
- ICP Pain Points: ${companyProfile.icpPainPoints || 'Unknown'}
${companyProfile.knowledgeBaseText ? `- Knowledge Base: ${companyProfile.knowledgeBaseText.substring(0, 2000)}` : ''}
` : '';

      // 3. Use AI to generate stakeholders
      const dbStakeholderPrompt = await getActivePrompt('stakeholder_generation');
      const stakeholderPrompt = dbStakeholderPrompt?.systemPrompt ?? `You are an expert B2B sales strategist who has mapped buying committees at Fortune 500 companies. Generate a realistic buying committee for a complex enterprise deal.`;
      const fullStakeholderPrompt = `${stakeholderPrompt}

${sellerContext}

Return ONLY a valid JSON array of 4-6 stakeholders with this structure:
[
  {
    "name": "Full Name (culturally appropriate for the company's region)",
    "title": "Exact Job Title (e.g., 'VP of Supply Chain Operations' not just 'VP')",
    "role": "Champion|Decision Maker|Influencer|Blocker|User|Evaluator",
    "sentiment": "Positive|Neutral|Negative",
    "engagement": "High|Medium|Low",
    "keyInsights": "1-2 sentences: What does this person care about MOST in their role? What metric are they measured on? How does the seller's product specifically help or threaten their agenda?",
    "linkedIn": "https://linkedin.com/in/placeholder"
  }
]

CRITICAL RULES for realistic stakeholder generation:
1. **Titles must be specific and realistic**: Use real enterprise titles like "Senior Director of IT Infrastructure", "VP of Procurement & Strategic Sourcing", "Chief Digital Officer", "Head of Enterprise Architecture". NEVER use generic titles like "Manager" or "Director" without a domain.
2. **Role assignment must reflect organizational reality**:
   - Champion: The person whose daily pain the product solves. Usually a director/VP-level operator, NOT the C-suite.
   - Decision Maker: The person who controls budget. Usually CFO, CTO, or a SVP. Must have signing authority.
   - Influencer: Technical evaluator or domain expert who shapes the decision. Often a senior engineer, architect, or analyst.
   - Blocker: Someone with veto power or competing interests. Procurement, legal, or a rival internal project owner.
   - Evaluator: Hands-on user who will test/validate the product.
3. **Sentiment should vary realistically**: Not everyone starts Positive. Blockers are typically Neutral or Negative. Decision Makers are often Neutral until ROI is proven.
4. **Names must be culturally appropriate**: Chinese companies → Chinese names, Japanese → Japanese, etc.
5. **keyInsights must be specific**: Reference the seller's actual product and the stakeholder's specific concerns. Bad: "Cares about efficiency". Good: "Measured on reducing scrap processing turnaround from 72h to 24h; the seller's real-time pricing platform directly addresses this KPI."

Return ONLY the JSON array, no markdown, no explanation.${langSuffix}`;

      const stakeholderUserPrompt = `Generate a buying committee for selling to:
Company: ${input.targetCompanyName}
Industry: ${input.targetIndustry || 'Unknown'}
Description: ${input.targetCompanyDescription || 'Unknown'}
Headquarters: ${input.targetHeadquarters || 'Unknown'}
Products/Services they offer: ${input.targetProducts?.join(', ') || 'Unknown'}

Think about: Who in this company would be involved in evaluating and purchasing the seller's product? Consider the typical org structure for a company in this industry and of this size.`;

      let stakeholderData: any[] = [];
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: fullStakeholderPrompt },
            { role: "user", content: stakeholderUserPrompt },
          ],
        });

        const rawContent = response.choices[0].message.content || '[]';
        const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
        const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        stakeholderData = JSON.parse(cleaned);
      } catch (err) {
        console.warn('[Onboarding] Failed to generate stakeholders:', err);
        stakeholderData = [
          { name: "Contact Person", title: "Key Contact", role: "Champion", sentiment: "Neutral", engagement: "Medium", keyInsights: "Primary point of contact" },
        ];
      }

      // 4. Create stakeholders in DB with map positions
      const stageWidth = 250;
      const startX = 100;
      for (let i = 0; i < stakeholderData.length; i++) {
        const s = stakeholderData[i];
        const stageIndex = Math.min(i, 3);
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

      // 5. Generate initial AI insights
      try {
        const dbInsightPrompt = await getActivePrompt('initial_deal_insight');
        const baseInsightPrompt = dbInsightPrompt?.systemPrompt ?? `You are Meridian, a veteran B2B sales strategist. Generate initial deal intelligence for a brand-new opportunity. This is Day 1 — the rep just added this deal and needs a clear opening strategy.`;
        const insightPrompt = `${baseInsightPrompt}

${sellerContext}

Return ONLY a valid JSON object:
{
  "whatsHappening": "2-3 sentences: What is the strategic opportunity here? How does the seller's product specifically address this company's likely pain points? What makes this deal worth pursuing? Be specific about the value connection.",
  "keyRisks": [
    {"title": "Crisp risk title (max 8 words)", "detail": "What could derail this deal early? Think: competitive incumbents, budget cycles, organizational resistance, missing champion. Be specific to this company and industry.", "stakeholders": ["Name if relevant"]}
  ],
  "whatsNext": [
    {"action": "Specific Day 1 action with a named person (e.g., 'Request a 30-min intro call with [Champion Name] to validate the pain hypothesis')", "rationale": "Why this is the right first move. What will the rep learn? What door does it open?", "suggestedContacts": [{"name": "Realistic name", "title": "Realistic title", "reason": "Why engage this person first"}]}
  ]
}

Rules:
- keyRisks: 2-3 items. Focus on EARLY-STAGE risks: no champion identified, unclear budget authority, competitive displacement, wrong entry point.
- whatsNext: 2-3 items. These are OPENING MOVES, not mid-deal tactics. Focus on: validating the opportunity, finding the champion, understanding the buying process.
- Reference stakeholder names from the buying committee when possible.
- Return ONLY JSON, no markdown.${langSuffix}`;

        const insightResponse = await invokeLLM({
          messages: [
            { role: "system", content: insightPrompt },
            { role: "user", content: `New deal with ${input.targetCompanyName} (${input.targetIndustry || 'Unknown industry'}). ${input.targetCompanyDescription || ''}.

Buying committee identified so far:
${stakeholderData.map((s: any) => `- ${s.name} (${s.title}) — Role: ${s.role}, Sentiment: ${s.sentiment}, Engagement: ${s.engagement}`).join('\n')}` },
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

  // ─── Analyze Target Company URL (for deal creation) ───────────────────────

  analyzeTargetCompany: protectedProcedure
    .input(z.object({
      url: z.string().min(1),
      language: z.enum(["en", "zh"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const langSuffix = input.language === "zh" ? "\n\nIMPORTANT: All text values in the JSON response MUST be in Simplified Chinese (中文)." : "";
      const companyProfile = await getCompanyProfile(tenant.id);

      const sellerContext = companyProfile ? `
You are analyzing a potential customer for this seller:
- Seller Company: ${companyProfile.companyName}
- Seller Products: ${companyProfile.products?.join(', ') || 'Unknown'}
- Seller Target Market: ${companyProfile.targetMarket || 'Unknown'}
- Seller ICP: ${companyProfile.icpIndustries || 'Unknown'}

Identify how the target company connects to the seller's offerings.
` : '';

      const dbTargetPrompt = await getActivePrompt('target_company_analysis');
      const systemPrompt = dbTargetPrompt?.systemPrompt ?? `You are an expert B2B sales intelligence analyst. Given a target company URL, produce a detailed analysis that helps a sales team understand this prospect and plan their approach.`;
      const fullSystemPrompt = `${systemPrompt}
${sellerContext}

CRITICAL RULES:
- Be SPECIFIC, not generic. Describe exactly what this company does, sells, and how they operate.
- Name actual products, services, and business activities.
- For the sellerAngle: identify a CONCRETE pain point or opportunity, not a vague "could benefit from our solution".

Return ONLY a valid JSON object with this exact structure:
{
  "companyName": "Official company name",
  "description": "3-4 sentences describing exactly what this company does, their core business model, and how they make money. Be concrete and specific.",
  "industry": "Specific sub-industry (e.g. 'Automotive Manufacturing' not just 'Manufacturing')",
  "products": ["Name each specific product/service the company offers"],
  "targetMarket": "Specific customer types and geographies",
  "headquarters": "City, Country",
  "estimatedSize": "Employee count and funding stage if known",
  "keyDifferentiator": "Their specific competitive advantage",
  "sellerAngle": "A specific, actionable insight about how the seller could help this company. Reference a concrete business need, not a generic benefit. E.g. 'Stellantis generates 2M+ tons of manufacturing scrap annually across 30 plants. Doctor Scrap could provide real-time scrap pricing and marketplace access to optimize their scrap metal revenue by 15-20%.' NOT 'Could benefit from improved recycling solutions.'"
}

Return ONLY the JSON, no markdown, no explanation.${langSuffix}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: fullSystemPrompt },
          { role: "user", content: `Analyze this target company in detail: ${input.url}\n\nBe extremely specific about what this company does. A reader should understand their exact business, products, and market position after reading your analysis.` },
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
        sellerAngle: analysis.sellerAngle || '',
      };
    }),
});
