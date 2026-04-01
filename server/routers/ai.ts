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
  getCompanyProfile,
  getLatestSnapshot,
  getNextActions,
  updateSnapshotSuggestionActions,
  getStrategyNotes,
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
      meetings: z.array(z.object({
        date: z.string().or(z.date()),
        type: z.string(),
        keyParticipant: z.string().nullable().optional(),
        summary: z.string().nullable().optional(),
      })).optional(),
      language: z.enum(["en", "zh"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      // Get active prompt or use default
      const activePrompt = await getActivePrompt("brief_generation");
      const langSuffix = input.language === "zh" ? "\n\nIMPORTANT: You MUST respond entirely in Simplified Chinese (中文)." : "";

      // Filter meetings relevant to this stakeholder
      const allMeetingsWithContent = (input.meetings ?? []).filter(m => m.summary && m.summary.trim().length > 20);
      const relevantMeetings = allMeetingsWithContent.filter(m =>
        m.keyParticipant?.toLowerCase().includes(input.stakeholderName.toLowerCase())
      );
      const hasMeetingEvidence = relevantMeetings.length > 0 || allMeetingsWithContent.length > 0;

      // Add evidence grounding instruction to system prompt
      const evidenceInstruction = hasMeetingEvidence
        ? `\n\nIMPORTANT: Meeting transcripts/notes are provided below. Ground your brief in this evidence. Reference specific conversations and what was said. Do NOT fabricate quotes or meeting outcomes.`
        : `\n\nNOTE: No meeting transcripts are available for this stakeholder. Base your brief on the stakeholder profile, company info, and role context. Be transparent about what is assumption vs. fact. Suggest key questions to ask in the upcoming meeting to fill information gaps.`;

      const systemPrompt = (activePrompt?.systemPrompt ?? DEFAULT_BRIEF_SYSTEM_PROMPT) + evidenceInstruction + langSuffix;

      // Build meeting evidence for user prompt
      let meetingEvidenceBlock = '';
      if (relevantMeetings.length > 0) {
        meetingEvidenceBlock = `\n\n**Meeting History with ${input.stakeholderName}:**\n${relevantMeetings.map((m, i) => {
          const dateStr = typeof m.date === 'string' ? m.date : new Date(m.date).toISOString().split('T')[0];
          return `${i + 1}. ${m.type} (${dateStr}): ${m.summary}`;
        }).join('\n')}`;
      } else if (allMeetingsWithContent.length > 0) {
        meetingEvidenceBlock = `\n\n**Other Deal Meetings (not directly with ${input.stakeholderName}):**\n${allMeetingsWithContent.slice(0, 5).map((m, i) => {
          const dateStr = typeof m.date === 'string' ? m.date : new Date(m.date).toISOString().split('T')[0];
          return `${i + 1}. ${m.type} (${dateStr}${m.keyParticipant ? `, ${m.keyParticipant}` : ''}): ${m.summary}`;
        }).join('\n')}`;
      }

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
${input.keyInsights ? `Key Insights: ${input.keyInsights}` : "No key insights recorded yet."}
${input.personalNotes ? `Personal Notes: ${input.personalNotes}` : ""}
${input.personalSignals?.length ? `Signals: ${input.personalSignals.map(s => `${s.emoji} ${s.text}`).join(", ")}` : ""}${meetingEvidenceBlock}

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
      language: z.enum(["en", "zh"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      const activePrompt = await getActivePrompt("signal_extraction");
      const langSuffix = input.language === "zh" ? "\n\nIMPORTANT: All signal descriptions MUST be in Simplified Chinese (中文)." : "";
      const systemPrompt = (activePrompt?.systemPrompt ?? DEFAULT_SIGNAL_SYSTEM_PROMPT) + langSuffix;

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

  // Test a prompt template with filled-in variables
  testPromptTemplate: protectedProcedure
    .input(z.object({
      promptId: z.number(),
      variables: z.record(z.string(), z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const prompts = await getAllPrompts();
      const prompt = prompts.find((p: any) => p.id === input.promptId);
      if (!prompt) throw new Error("Prompt template not found");

      // Replace {{variables}} in both system and user prompts
      let systemPrompt = prompt.systemPrompt;
      let userPrompt = prompt.userPromptTemplate;
      for (const [key, value] of Object.entries(input.variables)) {
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        systemPrompt = systemPrompt.replace(regex, value);
        userPrompt = userPrompt.replace(regex, value);
      }

      const { content, tokensUsed, latencyMs } = await callOpenAI(systemPrompt, userPrompt);

      await createAiLog({
        tenantId: tenant.id,
        userId: ctx.user.id,
        feature: `template_test:${prompt.feature}`,
        promptVersion: prompt.version,
        systemPrompt,
        userPrompt,
        rawOutput: content,
        modelUsed: OPENAI_MODEL,
        tokensUsed,
        latencyMs,
      });

      return { output: content, tokensUsed, latencyMs, feature: prompt.feature, version: prompt.version };
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
      meetings: z.array(z.object({
        date: z.string().or(z.date()),
        type: z.string(),
        keyParticipant: z.string().nullable().optional(),
        summary: z.string().nullable().optional(),
        duration: z.number().nullable().optional(),
      })).optional(),
      salesModel: z.string().optional(),
      customModelId: z.number().optional().nullable(),
      language: z.enum(["en", "zh"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");

      // Fetch seller's own company profile (Knowledge Base) to ground AI in seller context
      const sellerProfile = await getCompanyProfile(tenant.id);
      const sellerContext = sellerProfile ? `

=== SELLER CONTEXT (CRITICAL — READ FIRST) ===
You are analyzing deals on behalf of **${sellerProfile.companyName}**.
Seller Company: ${sellerProfile.companyName}
Seller Products: ${(sellerProfile.products as string[] | null)?.join(', ') ?? 'Not specified'}
Seller Description: ${sellerProfile.companyDescription ?? ''}
Key Differentiators: ${sellerProfile.keyDifferentiator ?? ''}
Target Market: ${sellerProfile.targetMarket ?? ''}
ICP Pain Points: ${sellerProfile.icpPainPoints ?? ''}
${sellerProfile.knowledgeBaseText ? `\nKnowledge Base:\n${sellerProfile.knowledgeBaseText.slice(0, 2000)}` : ''}

CRITICAL: All deal analysis must be from the perspective of ${sellerProfile.companyName} selling their products to the prospect. The "company" in the deal is the PROSPECT (buyer), not the seller.` : '';

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
      const langInstruction = lang === "zh" ? `\n\n❗❗❗ CRITICAL LANGUAGE REQUIREMENT ❗❗❗
You MUST respond ENTIRELY in Simplified Chinese (中文). Every single field value in the JSON output MUST be written in Chinese.
- whatsHappening: 必须用中文写
- keyRisks title/detail: 必须用中文写
- whatsNext action/rationale: 必须用中文写
- suggestedContacts reason: 必须用中文写
Do NOT output any English text in the JSON values. Only stakeholder names and company names may remain in their original language.
示例 action: "与李明确认定价模型并推动内部审批"
示例 risk title: "决策链不明确，缺乎关键支持者"` : "";

      // Determine data richness: do we have actual meeting transcripts/summaries?
      const meetingsWithContent = (input.meetings ?? []).filter(m => m.summary && m.summary.trim().length > 20);
      const hasTranscripts = meetingsWithContent.length > 0;
      const dataLevel = hasTranscripts ? 'evidence-based' : 'early-stage';

      // Build transcript evidence block
      const transcriptEvidence = hasTranscripts
        ? meetingsWithContent.map((m, i) => {
            const dateStr = typeof m.date === 'string' ? m.date : new Date(m.date).toISOString().split('T')[0];
            return `Meeting ${i + 1} (${m.type}, ${dateStr}${m.keyParticipant ? `, with ${m.keyParticipant}` : ''}):\n${m.summary}`;
          }).join('\n\n')
        : '';

      let systemPrompt: string;

      if (dataLevel === 'evidence-based') {
        // ── EVIDENCE-BASED MODE: Ground everything in transcript data ──
        const dbPromptEvidence = await getActivePrompt('deal_insight_evidence');
        const baseEvidencePrompt = dbPromptEvidence?.systemPrompt ?? `You are Meridian, a veteran B2B enterprise sales strategist. You analyze deals STRICTLY based on evidence from meeting transcripts and recorded interactions.`;
        systemPrompt = `${baseEvidencePrompt}${sellerContext}

You are analyzing this deal through the **${modelName}** sales framework.
The ${modelName} framework dimensions:
${dimensionPrompt}

CRITICAL RULE: Every claim you make MUST be traceable to a specific meeting or interaction provided below. Do NOT fabricate information. Do NOT infer dynamics that aren't supported by the evidence. If a ${modelName} dimension has no evidence, explicitly say "No data yet" for that dimension.

Your analysis MUST reference ${modelName} dimensions by name and cite which meeting/interaction supports each insight.${langInstruction}

Return ONLY a valid JSON object:
{
  "whatsHappening": "2-3 sentences grounded in the meeting evidence. What did the conversations ACTUALLY reveal? Reference specific meetings, quotes, or behaviors observed. Name stakeholders. Do NOT speculate beyond what the data shows.",
  "keyRisks": [
    {
      "title": "Crisp risk title (max 8 words)",
      "detail": "Based on [Meeting X with Person Y], we observed [specific evidence]. This creates a gap in ${modelName}'s [Dimension] because [consequence]. If unaddressed, [specific outcome].",
      "stakeholders": ["Name of stakeholder involved"]
    }
  ],
  "whatsNext": [
    {
      "action": "Imperative verb + specific person + specific outcome",
      "rationale": "Based on what [Person] said in [Meeting], the logical next move is... This addresses the ${modelName} [Dimension] gap.",
      "suggestedContacts": []
    }
  ]
}

Rules:
- keyRisks: 2-4 items. Each MUST cite evidence from a specific meeting. No fabricated risks.
- whatsHappening: Summarize what the meetings ACTUALLY revealed, not what you imagine is happening.
- whatsNext: 2-4 items. Actions must follow logically from the meeting evidence.
- suggestedContacts: Only suggest if a meeting participant mentioned someone not yet on the map. Otherwise empty [].
- If there's not enough data for a section, say so honestly rather than fabricating.
- Return ONLY JSON, no markdown.`;
      } else {
        // ── EARLY-STAGE MODE: Only company + stakeholder info, no transcripts ──
        const dbPromptEarly = await getActivePrompt('deal_insight_early');
        const baseEarlyPrompt = dbPromptEarly?.systemPrompt ?? `You are Meridian, a B2B sales strategist. This is an EARLY-STAGE deal with NO meeting transcripts yet. You can only work with the company profile and identified stakeholders.`;
        systemPrompt = `${baseEarlyPrompt}${sellerContext}

You are evaluating this deal through the **${modelName}** framework.
The ${modelName} dimensions:
${dimensionPrompt}

CRITICAL CONSTRAINTS:
- You have NO meeting data, NO conversation transcripts, NO direct evidence of stakeholder behavior.
- You MUST NOT fabricate meeting outcomes, stakeholder quotes, or engagement dynamics.
- You CAN provide: initial hypothesis based on company profile, industry patterns, and stakeholder roles.
- You MUST clearly label everything as "hypothesis" or "assumption" — not fact.
- For each ${modelName} dimension, indicate what information is MISSING and needs to be gathered.${langInstruction}

Return ONLY a valid JSON object:
{
  "whatsHappening": "2-3 sentences: Based on the company profile and identified stakeholders, here is the initial opportunity hypothesis. Be explicit about what we DON'T know yet. Flag that this is pre-engagement analysis.",
  "keyRisks": [
    {
      "title": "Risk title (max 8 words)",
      "detail": "HYPOTHESIS: Based on [company profile / industry pattern], [risk]. We need [specific meeting/data] to validate. ${modelName} dimension gap: [Dimension] — no evidence gathered yet.",
      "stakeholders": ["Name if relevant"]
    }
  ],
  "whatsNext": [
    {
      "action": "First engagement action — who to meet and what to learn",
      "rationale": "We need to gather evidence for ${modelName}'s [Dimension]. This meeting will help us validate [hypothesis]. Key questions to ask: [specific questions].",
      "suggestedContacts": []
    }
  ]
}

Rules:
- This is a PLANNING phase, not an analysis phase. Focus on what to LEARN, not what you already know.
- whatsHappening: State the opportunity hypothesis + explicitly list what's unknown.
- keyRisks: 2-3 items. Frame as hypothetical risks that need validation through meetings.
- whatsNext: 2-3 items. Focus on first meetings to schedule and key questions to ask. Every action should aim to fill a ${modelName} dimension gap.
- Do NOT suggest contacts unless the company profile gives clear hints about who to find.
- Return ONLY JSON, no markdown.`;
      }

      const stakeholderSummary = input.stakeholders?.map(s =>
        `- ${s.name} (${s.title ?? s.role}): ${s.sentiment} sentiment, ${s.engagement} engagement`
      ).join("\n") ?? "No stakeholders on record";

      // Fetch internal strategy notes from DB
      const stratNotes = await getStrategyNotes(input.dealId, tenant.id);
      const strategyBlock = stratNotes.length > 0
        ? `\n\n=== INTERNAL STRATEGY NOTES (CONFIDENTIAL — from the sales team) ===\n${stratNotes.map(n => `[${n.category.toUpperCase()}] ${n.content}`).join('\n')}\n\nThese are internal notes from the sales team. Use them to inform your analysis — e.g., pricing constraints, relationship dynamics, competitive threats, and internal alignment status. Do NOT repeat these notes verbatim in your output, but factor them into your risk assessment and recommended next steps.`
        : '';

      let userPrompt = `Deal: ${input.dealName}
Stage: ${input.dealStage} | Value: $${input.dealValue.toLocaleString()} | Confidence: ${input.confidenceScore}%
${input.companyInfo ? `Company Context: ${input.companyInfo}` : ""}

Stakeholders:
${stakeholderSummary}${strategyBlock}`;

      if (hasTranscripts) {
        userPrompt += `\n\n=== MEETING EVIDENCE (${meetingsWithContent.length} meetings with notes) ===\n${transcriptEvidence}`;
      } else {
        userPrompt += `\n\n⚠️ NO MEETING TRANSCRIPTS AVAILABLE. This deal has ${(input.meetings ?? []).length} meetings recorded but none with substantive notes/summaries. Analysis must be limited to company profile and stakeholder list.`;
      }

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

      // Before creating new snapshot, save suggestion dispositions on the CURRENT latest snapshot
      try {
        const currentLatest = await getLatestSnapshot(input.dealId, tenant.id);
        if (currentLatest && currentLatest.whatsNext && Array.isArray(currentLatest.whatsNext)) {
          // Get all ai_suggested nextActions for this deal to determine dispositions
          const allActions = await getNextActions(input.dealId, tenant.id);
          const aiActions = allActions.filter(a => a.source === 'ai_suggested' && a.snapshotId === currentLatest.id);
          
          const suggestionActions = (currentLatest.whatsNext as Array<{ action: string }>).map(item => {
            const actionText = typeof item === 'string' ? item : item.action;
            const matchingAction = aiActions.find(a => a.text === actionText);
            return {
              action: actionText,
              status: (matchingAction?.status as 'accepted' | 'rejected' | 'later' | 'pending') ?? 'pending',
              actionId: matchingAction?.id,
            };
          });
          
          await updateSnapshotSuggestionActions(currentLatest.id, tenant.id, suggestionActions);
        }
      } catch (saveErr) {
        console.warn('[AI] Failed to save suggestion actions on current snapshot:', saveErr);
      }

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
        dataLevel,
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
      meetings: z.array(z.object({
        date: z.string().or(z.date()),
        type: z.string(),
        keyParticipant: z.string().nullable().optional(),
        summary: z.string().nullable().optional(),
      })).optional(),
      userMessage: z.string(),
      language: z.enum(["en", "zh"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getOrCreateDefaultTenant(ctx.user.id, ctx.user.name ?? "User");
      const chatLangInstruction = input.language === "zh" ? "\n\nIMPORTANT: You MUST respond entirely in Simplified Chinese (中文)." : "";

      // Build meeting evidence for chat context
      const meetingsWithContent = (input.meetings ?? []).filter(m => m.summary && m.summary.trim().length > 20);
      const hasEvidence = meetingsWithContent.length > 0;
      const evidenceNote = hasEvidence
        ? `\n\nIMPORTANT: You have access to meeting transcripts/notes below. Ground your advice in this evidence. If the rep asks about something not covered in the meetings, say so.`
        : `\n\nNOTE: No meeting transcripts are available for this deal yet. Be transparent about this limitation. If the rep shares new information verbally, that becomes the first real evidence — treat it accordingly.`;

      const dbChatPrompt = await getActivePrompt('deal_chat');
      const baseChatPrompt = dbChatPrompt?.systemPrompt ?? `You are Meridian, a veteran sales strategist acting as the rep's trusted advisor. You've seen hundreds of complex B2B deals and you pattern-match instantly.

Your role:
- When the rep shares NEW information ("Met with CFO yesterday", "Budget approved"): Immediately assess how this changes the deal dynamics. What doors does it open? What risks does it create? Update insights if the change is material.
- When the rep asks WHY: Explain your reasoning like a mentor. Reference specific meeting evidence and stakeholder behaviors. Never give vague answers.
- When the rep asks WHAT TO DO: Give a specific play with a named person, a concrete action, and an expected outcome. Ground your recommendation in what the meetings revealed.
- When the rep CORRECTS you: Acknowledge the correction, explain what you got wrong and why, then revise your assessment.

CRITICAL: Only reference information that comes from the meeting evidence, stakeholder data, or what the rep tells you directly. Do NOT fabricate meeting outcomes or stakeholder quotes.`;
      const systemPrompt = `${baseChatPrompt}${evidenceNote}

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

      // Fetch internal strategy notes for chat context
      const chatStratNotes = await getStrategyNotes(input.dealId, tenant.id);
      const chatStrategyBlock = chatStratNotes.length > 0
        ? `\n\n=== INTERNAL STRATEGY NOTES ===\n${chatStratNotes.map(n => `[${n.category.toUpperCase()}] ${n.content}`).join('\n')}`
        : '';

      // Build meeting evidence for user prompt
      const meetingEvidence = hasEvidence
        ? `\n\nMeeting Evidence:\n${meetingsWithContent.map((m, i) => {
            const dateStr = typeof m.date === 'string' ? m.date : new Date(m.date).toISOString().split('T')[0];
            return `${i + 1}. ${m.type} (${dateStr}${m.keyParticipant ? `, ${m.keyParticipant}` : ''}): ${m.summary}`;
          }).join('\n')}`
        : '';

      const userPrompt = `Deal: ${input.dealName}
Stage: ${input.dealStage} | Value: $${input.dealValue.toLocaleString()} | Confidence: ${input.confidenceScore}%
${input.companyInfo ? `Company: ${input.companyInfo}` : ""}

Stakeholders:
${stakeholderSummary}${chatStrategyBlock}${meetingEvidence}

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
