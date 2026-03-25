import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createAiLog,
  getActivePrompt,
  getAiLogs,
  getAllPrompts,
  getOrCreateDefaultTenant,
  getPromptsByFeature,
  createPromptTemplate,
  updatePromptTemplate,
  setActivePrompt,
  rateAiLog,
} from "../db";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o";

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<{ content: string; tokensUsed: number; latencyMs: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const start = Date.now();
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${err}`);
  }

  const data = await response.json() as any;
  return {
    content: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens ?? 0,
    latencyMs: Date.now() - start,
  };
}

const DEFAULT_BRIEF_SYSTEM_PROMPT = `You are an expert enterprise sales coach. Generate a concise, actionable pre-meeting brief for a sales representative.

The brief should include:
1. **Who They Are** - Quick summary of the stakeholder's role and background
2. **What They Care About** - Their likely priorities and pain points based on their title and context
3. **Relationship Status** - Current sentiment and engagement level
4. **Talking Points** - 3-5 specific, personalized talking points based on the context provided
5. **Watch Out For** - Key risks or sensitivities to be aware of
6. **Suggested Ask** - The specific next step or commitment to pursue in this meeting

Be direct, specific, and actionable. Avoid generic advice. Format with clear headers.`;

const DEFAULT_SIGNAL_SYSTEM_PROMPT = `You are an expert at analyzing sales conversations and extracting meaningful signals about stakeholder behavior, interests, and buying intent.

Extract personal and professional signals from the provided meeting transcript or notes. Focus on:
- Personal interests or hobbies mentioned
- Professional priorities or concerns
- Decision-making style indicators
- Relationship-building opportunities
- Buying signals or objections

Return a JSON array of signals with format: [{"emoji": "🎯", "text": "Signal description", "aiExtracted": true}]
Return ONLY the JSON array, no other text.`;

export const aiRouter = router({
  // Generate a pre-meeting brief for a stakeholder
  generateBrief: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      stakeholderName: z.string(),
      stakeholderTitle: z.string().optional(),
      stakeholderRole: z.string(),
      sentiment: z.string(),
      engagement: z.string(),
      keyInsights: z.string().optional(),
      personalNotes: z.string().optional(),
      personalSignals: z.array(z.object({ text: z.string(), emoji: z.string() })).optional(),
      dealName: z.string(),
      dealStage: z.string(),
      dealValue: z.number(),
      companyInfo: z.string().optional(),
      lastMeetingSummary: z.string().optional(),
      openActions: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      // Get active prompt or use default
      const activePrompt = await getActivePrompt("brief_generation");
      const systemPrompt = activePrompt?.systemPrompt ?? DEFAULT_BRIEF_SYSTEM_PROMPT;

      const userPrompt = `Generate a pre-meeting brief for this stakeholder:

**Stakeholder:** ${input.stakeholderName}
**Title:** ${input.stakeholderTitle ?? "Unknown"}
**Role in Deal:** ${input.stakeholderRole}
**Sentiment:** ${input.sentiment}
**Engagement Level:** ${input.engagement}

**Deal Context:**
- Deal: ${input.dealName}
- Company: (see below)
- Stage: ${input.dealStage}
- Value: $${input.dealValue.toLocaleString()}
${input.companyInfo ? `- Company Info: ${input.companyInfo}` : ""}

**What We Know About Them:**
${input.keyInsights ? `Key Insights: ${input.keyInsights}` : ""}
${input.personalNotes ? `Personal Notes: ${input.personalNotes}` : ""}
${input.personalSignals?.length ? `Signals: ${input.personalSignals.map(s => `${s.emoji} ${s.text}`).join(", ")}` : ""}

**Last Meeting:** ${input.lastMeetingSummary ?? "No recent meeting on record"}

**Open Actions for this stakeholder:**
${input.openActions?.length ? input.openActions.map(a => `- ${a}`).join("\n") : "None"}`;

      const { content, tokensUsed, latencyMs } = await callOpenAI(systemPrompt, userPrompt);

      // Log to database for dataset accumulation
      await createAiLog({
        tenantId: tenant.id,
        userId: ctx.user.id,
        feature: "brief_generation",
        promptVersion: activePrompt?.version ?? "default-v1",
        inputContext: input as any,
        systemPrompt,
        userPrompt,
        rawOutput: content,
        modelUsed: OPENAI_MODEL,
        tokensUsed,
        latencyMs,
      });

      return { brief: content, tokensUsed, latencyMs };
    }),

  // Extract signals from meeting transcript
  extractSignals: protectedProcedure
    .input(z.object({
      stakeholderId: z.number(),
      transcript: z.string(),
      stakeholderName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      const activePrompt = await getActivePrompt("signal_extraction");
      const systemPrompt = activePrompt?.systemPrompt ?? DEFAULT_SIGNAL_SYSTEM_PROMPT;

      const userPrompt = `Extract signals from this meeting content about ${input.stakeholderName}:

${input.transcript}`;

      const { content, tokensUsed, latencyMs } = await callOpenAI(systemPrompt, userPrompt);

      let signals: Array<{ emoji: string; text: string; aiExtracted: boolean }> = [];
      try {
        const parsed = JSON.parse(content);
        signals = Array.isArray(parsed) ? parsed : [];
      } catch {
        // If JSON parse fails, return empty
        signals = [];
      }

      await createAiLog({
        tenantId: tenant.id,
        userId: ctx.user.id,
        feature: "signal_extraction",
        promptVersion: activePrompt?.version ?? "default-v1",
        inputContext: { stakeholderId: input.stakeholderId, transcriptLength: input.transcript.length } as any,
        systemPrompt,
        userPrompt,
        rawOutput: content,
        parsedOutput: signals as any,
        modelUsed: OPENAI_MODEL,
        tokensUsed,
        latencyMs,
      });

      return { signals, tokensUsed };
    }),

  // Test a prompt in the playground
  testPrompt: protectedProcedure
    .input(z.object({
      systemPrompt: z.string(),
      userPrompt: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const { content, tokensUsed, latencyMs } = await callOpenAI(input.systemPrompt, input.userPrompt);

      await createAiLog({
        tenantId: tenant.id,
        userId: ctx.user.id,
        feature: "playground_test",
        systemPrompt: input.systemPrompt,
        userPrompt: input.userPrompt,
        rawOutput: content,
        modelUsed: OPENAI_MODEL,
        tokensUsed,
        latencyMs,
      });

      return { output: content, tokensUsed, latencyMs };
    }),

  // Get AI logs (for admin playground)
  getLogs: protectedProcedure
    .input(z.object({ feature: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      return getAiLogs(tenant.id, input.feature);
    }),

  // Rate an AI log (good/bad/edited)
  rateLog: protectedProcedure
    .input(z.object({
      id: z.number(),
      rating: z.enum(["good", "bad", "edited"]),
      editedOutput: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      await rateAiLog(input.id, tenant.id, input.rating, input.editedOutput);
      return { success: true };
    }),

  // Prompt template management
  getPrompts: protectedProcedure
    .input(z.object({ feature: z.string().optional() }))
    .query(async ({ ctx }) => {
      return getAllPrompts();
    }),

  createPrompt: protectedProcedure
    .input(z.object({
      feature: z.string(),
      version: z.string(),
      systemPrompt: z.string(),
      userPromptTemplate: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await createPromptTemplate({ ...input, createdBy: ctx.user.id, isActive: false });
      return { id };
    }),

  updatePrompt: protectedProcedure
    .input(z.object({
      id: z.number(),
      systemPrompt: z.string().optional(),
      userPromptTemplate: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updatePromptTemplate(id, data);
      return { success: true };
    }),

  setActivePrompt: protectedProcedure
    .input(z.object({ id: z.number(), feature: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await setActivePrompt(input.id, input.feature);
      return { success: true };
    }),

  // Generate structured deal insights (whatsHappening, keyRisks, structured whatsNext with rationale)
  generateDealInsight: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      dealName: z.string(),
      dealStage: z.string(),
      dealValue: z.number(),
      confidenceScore: z.number(),
      companyInfo: z.string().optional(),
      stakeholders: z.array(z.object({
        name: z.string(),
        title: z.string().optional().nullable(),
        role: z.string(),
        sentiment: z.string(),
        engagement: z.string(),
      })).optional(),
      recentInteractions: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      const systemPrompt = `You are Meridian, an expert B2B sales intelligence AI. Analyze the deal context and generate structured insights.

Return ONLY a valid JSON object with this exact structure:
{
  "whatsHappening": "2-3 sentence narrative of the current deal situation, referencing specific stakeholders by name",
  "keyRisks": ["Risk 1 description mentioning specific stakeholder or issue", "Risk 2", "Risk 3"],
  "whatsNext": [
    {
      "action": "Specific action the AE should take (1 sentence, imperative)",
      "rationale": "Why this action matters strategically — 1-2 sentences coaching the AE on the reasoning"
    }
  ]
}

Guidelines:
- Reference stakeholders by name and title in your analysis
- whatsNext should have 2-4 specific, actionable items
- rationale should coach the AE, not just repeat the action
- Be specific to this deal, not generic sales advice
- Return ONLY the JSON, no markdown, no explanation`;

      const stakeholderSummary = input.stakeholders?.map(s =>
        `- ${s.name} (${s.title ?? s.role}): ${s.sentiment} sentiment, ${s.engagement} engagement`
      ).join("\n") ?? "No stakeholders on record";

      const userPrompt = `Deal: ${input.dealName}
Stage: ${input.dealStage} | Value: $${input.dealValue.toLocaleString()} | Confidence: ${input.confidenceScore}%
${input.companyInfo ? `Company Context: ${input.companyInfo}` : ""}

Stakeholders:
${stakeholderSummary}

${input.recentInteractions ? `Recent Interactions:\n${input.recentInteractions}` : ""}`;

      const { content, tokensUsed, latencyMs } = await callOpenAI(systemPrompt, userPrompt);

      let insights: {
        whatsHappening: string;
        keyRisks: string[];
        whatsNext: Array<{ action: string; rationale: string }>;
      } | null = null;

      try {
        const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        insights = JSON.parse(cleaned);
      } catch {
        // Fallback: return raw content as whatsHappening
        insights = {
          whatsHappening: content,
          keyRisks: [],
          whatsNext: [],
        };
      }

      await createAiLog({
        tenantId: tenant.id,
        userId: ctx.user.id,
        feature: "deal_insight_generation",
        promptVersion: "v1",
        inputContext: { dealId: input.dealId } as any,
        systemPrompt,
        userPrompt,
        rawOutput: content,
        parsedOutput: insights as any,
        modelUsed: OPENAI_MODEL,
        tokensUsed,
        latencyMs,
      });

      return { insights, tokensUsed, latencyMs };
    }),

  // Inline contextual chat — user corrects or asks about deal insights
  chatWithDeal: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      dealName: z.string(),
      dealStage: z.string(),
      dealValue: z.number(),
      confidenceScore: z.number(),
      companyInfo: z.string().optional(),
      currentWhatsHappening: z.string().optional(),
      currentKeyRisks: z.array(z.string()).optional(),
      currentWhatsNext: z.string().optional(),
      stakeholders: z.array(z.object({
        name: z.string(),
        title: z.string().optional().nullable(),
        role: z.string(),
        sentiment: z.string(),
        engagement: z.string(),
      })).optional(),
      userMessage: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      const systemPrompt = `You are Meridian, an expert AI sales intelligence assistant. You help sales representatives understand and navigate complex B2B deals.

You have access to the current deal context and the AI-generated insights. The user may:
1. Correct an incorrect insight ("CFO is actually engaged, I met with him last week")
2. Add new information that changes the picture ("Budget was approved yesterday")
3. Ask why you made a certain assessment ("Why do you say the CFO is not engaged?")
4. Ask for deeper analysis ("What's the biggest risk right now?")

When the user provides new information or corrections, update your understanding and provide a revised assessment.
When answering questions, be specific to this deal's context.

Always respond in a conversational but professional tone. Be concise — 2-4 sentences for analysis, bullet points for lists.
If the user's input changes the deal situation significantly, end your response with a JSON block (wrapped in \`\`\`json ... \`\`\`) containing updated insights:
{
  "updatedInsights": {
    "whatsHappening": "...",
    "keyRisks": ["risk1", "risk2"],
    "whatsNext": "..."
  }
}
Only include the JSON block if the insights actually need updating. Otherwise just answer conversationally.`;

      const stakeholderSummary = input.stakeholders?.map(s =>
        `- ${s.name} (${s.title ?? s.role}): ${s.sentiment} sentiment, ${s.engagement} engagement`
      ).join("\n") ?? "No stakeholders on record";

      const userPrompt = `Deal: ${input.dealName}
Stage: ${input.dealStage} | Value: $${input.dealValue.toLocaleString()} | Confidence: ${input.confidenceScore}%
${input.companyInfo ? `Company: ${input.companyInfo}` : ""}

Stakeholders:
${stakeholderSummary}

Current AI Insights:
What's Happening: ${input.currentWhatsHappening ?? "Not set"}
Key Risks: ${input.currentKeyRisks?.join("; ") ?? "None"}
What's Next: ${input.currentWhatsNext ?? "Not set"}

User says: ${input.userMessage}`;

      const { content, tokensUsed, latencyMs } = await callOpenAI(systemPrompt, userPrompt);

      // Parse optional updated insights from response
      let updatedInsights: { whatsHappening?: string; keyRisks?: string[]; whatsNext?: string } | null = null;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.updatedInsights) updatedInsights = parsed.updatedInsights;
        } catch { /* ignore parse errors */ }
      }

      // Strip the JSON block from the displayed response
      const displayResponse = content.replace(/```json[\s\S]*?```/g, "").trim();

      await createAiLog({
        tenantId: tenant.id,
        userId: ctx.user.id,
        feature: "deal_chat",
        promptVersion: "v1",
        inputContext: { dealId: input.dealId, userMessage: input.userMessage } as any,
        systemPrompt,
        userPrompt,
        rawOutput: content,
        modelUsed: OPENAI_MODEL,
        tokensUsed,
        latencyMs,
      });

      return { response: displayResponse, updatedInsights, tokensUsed };
    }),
});
