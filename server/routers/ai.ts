import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createAiLog,
  createSnapshot,
  getActivePrompt,
  getAiLogs,
  getAllPrompts,
  getOrCreateDefaultTenant,
  getPromptsByFeature,
  createPromptTemplate,
  updatePromptTemplate,
  setActivePrompt,
  rateAiLog,
  getSalesModelById,
} from "../db";
import { BUILT_IN_MODELS, getModelDimensions, getModelName } from "./salesModels";

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

const DEFAULT_BRIEF_SYSTEM_PROMPT = `You are Meridian, an elite enterprise sales coach who has closed $100M+ in complex B2B deals. Generate a tactical pre-meeting brief that a sales rep can review in 2 minutes before walking into the room.

Structure your brief with these sections:

## 🎯 30-Second Summary
One paragraph: who this person is, what they care about most RIGHT NOW, and the single most important thing to accomplish in this meeting.

## 🧠 Power Map Context
- Their real influence level (not just title — are they a rubber-stamp or true decision maker?)
- Who they report to and who influences them
- Their relationship with other stakeholders you've engaged

## 💬 Conversation Playbook
3-4 specific talking points, each with:
- The topic to raise
- WHY it resonates with this person specifically (connect to their priorities/pain)
- A suggested phrasing or question to open the topic

## ⚠️ Landmines to Avoid
- Specific topics, phrases, or approaches that could backfire with this person
- Political dynamics to be aware of (e.g., rivalry with another stakeholder, recent org changes)

## 🎯 The Ask
The ONE specific commitment or next step to pursue. Be concrete: "Get verbal agreement to schedule a technical deep-dive with their engineering team by next Friday" not "Move the deal forward."

Rules:
- Be brutally specific. Reference actual names, titles, and context from the data provided.
- Never use filler phrases like "It's important to..." or "Consider discussing..."
- Write as if briefing a peer, not lecturing a junior rep.
- If data is sparse, say what's MISSING and what the rep should try to learn in this meeting.`;

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
      language: z.enum(["en", "zh"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      // Get active prompt or use default
      const activePrompt = await getActivePrompt("brief_generation");
      const langSuffix = input.language === "zh" ? "\n\nIMPORTANT: You MUST respond entirely in Simplified Chinese (中文)." : "";
      const systemPrompt = (activePrompt?.systemPrompt ?? DEFAULT_BRIEF_SYSTEM_PROMPT) + langSuffix;

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
      salesModel: z.string().optional(),
      customModelId: z.number().optional().nullable(),
      language: z.enum(["en", "zh"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      // Resolve sales model dimensions
      let modelDimensions = BUILT_IN_MODELS.meddic.dimensions;
      let modelName = "MEDDIC";
      if (input.salesModel === "custom" && input.customModelId) {
        const customModel = await getSalesModelById(input.customModelId, tenant.id);
        if (customModel) {
          modelDimensions = customModel.dimensions;
          modelName = customModel.name;
        }
      } else if (input.salesModel && BUILT_IN_MODELS[input.salesModel]) {
        modelDimensions = BUILT_IN_MODELS[input.salesModel].dimensions;
        modelName = BUILT_IN_MODELS[input.salesModel].name;
      }

      const dimensionPrompt = modelDimensions.map(d => `- **${d.label}**: ${d.description}`).join("\n");
      const lang = input.language ?? "en";
      const langInstruction = lang === "zh" ? "\n\nIMPORTANT: You MUST respond entirely in Simplified Chinese (中文). All text in the JSON must be in Chinese." : "";

      const systemPrompt = `You are Meridian, a veteran B2B enterprise sales strategist with 20+ years closing complex multi-stakeholder deals. You think like a top-performing AE who reads political dynamics, not just pipeline metrics.

You are analyzing this deal through the **${modelName}** sales framework.

The ${modelName} framework evaluates deals across these dimensions:
${dimensionPrompt}

Your analysis MUST explicitly reference ${modelName} dimensions by name. For each risk or action, tie it back to a specific dimension gap.${langInstruction}

Return ONLY a valid JSON object with this exact structure:
{
  "whatsHappening": "2-3 sentence narrative. Read between the lines: What do the engagement patterns TELL you about where this deal really stands? Who is gaining or losing influence? What political shift is underway? Reference stakeholders by name. NEVER restate deal stage, value, or confidence — the rep already sees those.",
  "keyRisks": [
    {
      "title": "Crisp risk title (max 8 words, noun phrase)",
      "detail": "1-2 sentences: What SPECIFICALLY will go wrong if this isn't addressed? Name the stakeholder. Name the ${modelName} dimension gap. Give a timeline if relevant (e.g., 'If unresolved before the QBR on...')",
      "stakeholders": ["Name of stakeholder involved"]
    }
  ],
  "whatsNext": [
    {
      "action": "Imperative verb + specific person + specific outcome (e.g., 'Get Marcus Rodriguez to confirm budget allocation in a 1:1 before the March QBR')",
      "rationale": "WHY this matters strategically. Connect to ${modelName} dimension. Coach the rep: what signal should they watch for? What does success look like?",
      "suggestedContacts": [
        {
          "name": "Realistic full name of a person the rep should find and engage",
          "title": "Realistic job title at the target company",
          "reason": "Why this person specifically — what gap do they fill in the buying committee?"
        }
      ]
    }
  ]
}

Critical rules:
- keyRisks: 2-4 items. Title must be a crisp noun phrase (e.g., "CFO's Procurement Veto Power", "Missing Technical Validation"). Detail must explain the CONSEQUENCE, not just describe the situation. NEVER repeat deal metadata (stage, value, confidence).
- whatsHappening: Analyze DYNAMICS — momentum shifts, political signals, engagement pattern changes. Think: "What would a seasoned AE notice that a junior rep would miss?"
- whatsNext: 2-4 items. Every action must name a specific person and a specific measurable outcome. Bad: "Follow up with the team". Good: "Book a 30-min technical deep-dive with Jamie Park to validate the integration architecture before the POC deadline."
- rationale: Coach the rep like a mentor. Explain the strategic logic, not just restate the action. Reference ${modelName} dimensions.
- suggestedContacts: 0-2 per action. Only suggest people NOT already on the stakeholder map. Generate realistic names and titles for the target company's industry. Empty [] if no new contacts needed.
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

      type KeyRiskItem = { title: string; detail: string; stakeholders: string[] };
      let insights: {
        whatsHappening: string;
        keyRisks: KeyRiskItem[];
        whatsNext: Array<{ action: string; rationale: string; suggestedContacts?: Array<{ name: string; title: string; reason: string }> }>;
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

      // Persist insights as a new snapshot so they survive page refresh
      if (insights) {
        try {
          await createSnapshot({
            dealId: input.dealId,
            tenantId: tenant.id,
            date: new Date(),
            whatsHappening: insights.whatsHappening,
            keyRisks: insights.keyRisks as any,
            whatsNext: insights.whatsNext as any,
            confidenceScore: input.confidenceScore,
            confidenceChange: 0,
            aiGenerated: true,
          });
        } catch (snapshotErr) {
          console.warn('[AI] Failed to persist snapshot:', snapshotErr);
        }
      }

      return {
        whatsHappening: insights?.whatsHappening ?? '',
        keyRisks: insights?.keyRisks ?? [],
        whatsNext: insights?.whatsNext ?? [],
        tokensUsed,
        latencyMs,
      };
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
      language: z.enum(["en", "zh"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const chatLangInstruction = input.language === "zh" ? "\n\nIMPORTANT: You MUST respond entirely in Simplified Chinese (中文)." : "";

      const systemPrompt = `You are Meridian, a veteran sales strategist acting as the rep's trusted advisor. You've seen hundreds of complex B2B deals and you pattern-match instantly.

Your role:
- When the rep shares NEW information ("Met with CFO yesterday", "Budget approved"): Immediately assess how this changes the deal dynamics. What doors does it open? What risks does it create? Update insights if the change is material.
- When the rep asks WHY: Explain your reasoning like a mentor. Reference specific stakeholder behaviors, engagement patterns, and political dynamics. Never give vague answers.
- When the rep asks WHAT TO DO: Give a specific play with a named person, a concrete action, and an expected outcome. Think like a coach drawing up a play, not a consultant writing a report.
- When the rep CORRECTS you: Acknowledge the correction, explain what you got wrong and why, then revise your assessment.

Tone: Direct, confident, peer-to-peer. Like a senior AE giving advice over coffee. 2-4 sentences max for analysis. Use bullet points sparingly.

If the conversation changes the deal picture materially, append a JSON block (wrapped in \`\`\`json ... \`\`\`) with updated insights:
{
  "updatedInsights": {
    "whatsHappening": "...",
    "keyRisks": ["risk1", "risk2"],
    "whatsNext": "..."
  }
}
Only include JSON if insights actually need updating. Most conversational exchanges don't need it.${chatLangInstruction}`;

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
