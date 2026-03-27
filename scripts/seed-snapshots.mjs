/**
 * Seed AI snapshots for the 4 demo deals.
 * Calls OpenAI directly (server-side), then inserts snapshots into DB.
 * Run: node scripts/seed-snapshots.mjs
 */
import { createConnection } from "mysql2/promise";
import { config } from "dotenv";

config({ path: ".env" });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
if (!DATABASE_URL) throw new Error("DATABASE_URL not set");

async function callOpenAI(systemPrompt, userPrompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

const SELLER_CONTEXT = `
=== SELLER CONTEXT (CRITICAL — READ FIRST) ===
You are analyzing deals on behalf of **Meridian**.
Seller Company: Meridian
Seller Products: Meridian Sales Intelligence Platform, AI Deal Analysis, Stakeholder Map, Meeting Transcript Intelligence, Sales Playbook Builder
Seller Description: Meridian is an AI-powered B2B sales intelligence platform that helps enterprise sales teams manage complex, multi-stakeholder deals.
Key Differentiators: Meridian is the only sales intelligence tool that grounds every AI insight in the seller's own knowledge base, playbook, and historical deal data. It specializes in complex enterprise deals with multi-stakeholder dynamics.
Target Market: Enterprise and mid-market B2B sales teams running complex multi-stakeholder deals (6-18 month cycles, $50K–$2M ACV).
ICP Pain Points: Lack of visibility into complex multi-stakeholder deals; inability to track relationship dynamics across buying committee; losing deals due to champion departure or political shifts.

CRITICAL: All deal analysis must be from the perspective of Meridian selling their platform to the prospect. The "company" in the deal is the PROSPECT (buyer), not the seller.`;

const SYSTEM_PROMPT = `You are Meridian, a veteran B2B enterprise sales strategist. You analyze deals STRICTLY based on evidence from meeting transcripts and recorded interactions.${SELLER_CONTEXT}

You are analyzing this deal through the **MEDDIC** sales framework.
MEDDIC dimensions:
- **Metrics**: Quantifiable business impact and ROI the customer expects
- **Economic Buyer**: The person with budget authority and final sign-off
- **Decision Criteria**: The criteria the customer uses to evaluate vendors
- **Decision Process**: The steps and timeline to reach a decision
- **Identify Pain**: The specific business problem driving urgency
- **Champion**: The internal advocate who will sell for you internally

CRITICAL RULE: Every claim MUST be traceable to a specific meeting. Do NOT fabricate. If a dimension has no evidence, say "No data yet."

Return ONLY a valid JSON object:
{
  "whatsHappening": "2-3 sentences grounded in meeting evidence. Reference specific meetings and stakeholders.",
  "keyRisks": [
    {
      "title": "Risk title (max 8 words)",
      "detail": "Based on [Meeting X with Person Y], we observed [specific evidence]. MEDDIC gap: [Dimension]. If unaddressed, [outcome].",
      "stakeholders": ["Name"]
    }
  ],
  "whatsNext": [
    {
      "action": "Specific action with person and outcome",
      "rationale": "Based on [Meeting/Person], this addresses MEDDIC [Dimension] gap.",
      "suggestedContacts": []
    }
  ]
}
Rules: keyRisks 2-4 items, whatsNext 2-4 items. Return ONLY JSON.`;

const deals = [
  {
    id: 1,
    name: "Acme Corp — Enterprise Sales Intelligence",
    stage: "Technical Evaluation",
    value: 240000,
    confidence: 68,
    companyInfo: "Acme Corp is a Fortune 500 enterprise software company with 8,000 employees. Their sales org has 120 AEs managing complex enterprise deals averaging $500K ACV and 9-month cycles.",
    stakeholders: [
      { name: "Jennifer Walsh", title: "VP of Sales", role: "Champion", sentiment: "Positive", engagement: "High" },
      { name: "David Park", title: "CTO", role: "Decision Maker", sentiment: "Neutral", engagement: "Medium" },
      { name: "Rachel Torres", title: "Director of RevOps", role: "Influencer", sentiment: "Positive", engagement: "High" },
      { name: "Michael Stern", title: "CISO", role: "Blocker", sentiment: "Negative", engagement: "Low" },
      { name: "Tom Bradley", title: "Enterprise AE", role: "User", sentiment: "Positive", engagement: "Medium" },
    ],
    meetings: [
      { type: "Discovery Call", date: "2026-01-08", participant: "Jennifer Walsh", summary: "Jennifer described losing 2 deals due to stakeholder blind spots. Team has 23% win rate on $200K+ deals, wants 35% by Q3. Budget up to $150K discretionary, needs CTO approval above that. Loved the stakeholder heat map demo." },
      { type: "Demo", date: "2026-01-22", participant: "Jennifer Walsh, Rachel Torres", summary: "Rachel flagged 14 custom Salesforce objects as potential issue. Custom object support on Q2 roadmap. Rachel rated demo 8/10. Jennifer asked to schedule CTO meeting. Gong API integration in beta." },
      { type: "Technical Review", date: "2026-02-05", participant: "David Park, Rachel Torres", summary: "David asked about OpenAI data policy — addressed with private deployment model. CISO Michael Stern needs to be looped in. Rachel needs sandbox for Salesforce integration testing. David committed to 2-week security review." },
      { type: "Technical Review", date: "2026-02-19", participant: "Rachel Torres", summary: "Salesforce sandbox testing: 18/23 test cases passed. 5 remaining involve custom objects. Rachel ready to recommend if custom objects resolved and security clears. Michael Stern has not started security review." },
      { type: "Follow-up", date: "2026-03-04", participant: "Jennifer Walsh", summary: "CISO review stalled — Michael sent questionnaire back with 12 questions, no response in 2 weeks. Jennifer recommends sending DPA directly to legal. Budget verbally approved at $240K. Wants to close Q1 but CISO is critical path." },
      { type: "Technical Review", date: "2026-03-18", participant: "Michael Stern, Rachel Torres", summary: "BREAKTHROUGH: Michael reviewed SOC2, raised 4 concerns (data retention, deletion rights, sub-processor approval, pen test). All 4 addressed satisfactorily. Michael agreed to 5-day DPA review. Rachel pushed for end-of-week turnaround to close Q1." },
    ],
  },
  {
    id: 2,
    name: "GlobalTech — Revenue Intelligence Platform",
    stage: "Negotiation",
    value: 180000,
    confidence: 82,
    companyInfo: "GlobalTech is a B2B SaaS company (Series C, 600 employees) selling AI-powered analytics to financial services. VP Sales wants to standardize deal methodology across 45 AEs.",
    stakeholders: [
      { name: "Marcus Chen", title: "VP of Sales", role: "Champion", sentiment: "Positive", engagement: "High" },
      { name: "Priya Sharma", title: "CFO", role: "Decision Maker", sentiment: "Neutral", engagement: "Low" },
      { name: "Kevin O'Brien", title: "Head of RevOps", role: "Influencer", sentiment: "Positive", engagement: "High" },
      { name: "Sandra Liu", title: "Procurement Manager", role: "Blocker", sentiment: "Negative", engagement: "Medium" },
    ],
    meetings: [
      { type: "Discovery Call", date: "2025-11-12", participant: "Marcus Chen", summary: "Marcus has 45 AEs, average 7 stakeholders per deal, 8-month cycles. No visibility at stakeholder level. Clari tells him a deal is at risk but not why. Budget within range ($150K-$200K). Wants to show board something in Q1." },
      { type: "Demo", date: "2025-11-26", participant: "Marcus Chen, Kevin O'Brien", summary: "Marcus loved engagement heat map showing stakeholder going cold. Kevin confirmed Salesforce is standard objects only — clean implementation. Kevin ready to start pilot as soon as contract signed. Wants 10-AE pilot in January." },
      { type: "Technical Review", date: "2026-01-08", participant: "Kevin O'Brien", summary: "Implementation planning: standard Salesforce objects, Gong already integrated. Non-standard stage names (Qualified, Proof of Value) — confirmed configurable. Kevin has identified 10 pilot AEs. CFO verbal approval confirmed. Main step: contract negotiation." },
      { type: "Follow-up", date: "2026-02-14", participant: "Marcus Chen, Sandra Liu", summary: "Sandra demanding net-60 and 20% discount. Counter offered: net-45 + 5% discount for 2-year commitment. Marcus likes 2-year option. After Sandra dropped, Marcus said deal is done — just needs something for procurement. CFO budget approved." },
      { type: "Negotiation", date: "2026-03-10", participant: "Marcus Chen, Kevin O'Brien", summary: "Sandra's manager approved 2-year net-45 terms. Legal has 3 MSA redlines: 2x liability cap, 24-hour breach notification, annual audit rights. Kevin says none are deal-breakers. Marcus wants to close this week for Q1 board presentation on March 28th." },
    ],
  },
  {
    id: 4,
    name: "Nexus Systems — Sales Ops Transformation",
    stage: "Demo",
    value: 320000,
    confidence: 42,
    companyInfo: "Nexus Systems is a manufacturing conglomerate (NYSE: NXS, 15,000 employees) undergoing digital transformation. CRO wants to modernize the 200-person sales org.",
    stakeholders: [
      { name: "Amanda Foster", title: "Director of RevOps", role: "Champion", sentiment: "Positive", engagement: "High" },
      { name: "Robert Kim", title: "Chief Revenue Officer", role: "Decision Maker", sentiment: "Neutral", engagement: "Low" },
      { name: "Lisa Nguyen", title: "VP of Sales", role: "Influencer", sentiment: "Neutral", engagement: "Medium" },
      { name: "James Whitfield", title: "IT Security Director", role: "Evaluator", sentiment: "Neutral", engagement: "Medium" },
      { name: "Derek Santos", title: "Senior AE", role: "User", sentiment: "Positive", engagement: "High" },
    ],
    meetings: [
      { type: "Discovery Call", date: "2026-01-15", participant: "Amanda Foster", summary: "Amanda found Meridian via Kevin O'Brien LinkedIn post. 200 AEs, 6-8 stakeholders per deal, 10-12 month cycles. Previous Salesforce upgrade had 40% adoption. Amanda needs CRO approval for $300K-$400K deal. Will build business case first." },
      { type: "Demo", date: "2026-01-29", participant: "Amanda Foster, Derek Santos", summary: "Derek immediately engaged — currently tracks stakeholders in Notion because Salesforce is inadequate. Asked about mobile/iOS app (Q3 roadmap). Amanda focused on admin features and AI insights. Derek wants to be pilot user. Amanda needs CRO buy-in first." },
      { type: "Follow-up", date: "2026-02-12", participant: "Amanda Foster", summary: "Amanda built 12-slide business case for CRO. ROI model: 5% win rate improvement = $10.5M additional revenue. Used Meridian customer case studies. Robert Kim has board presentation March 15th — Amanda wants to present before that. Wants Leo available for CRO call on short notice." },
      { type: "Technical Review", date: "2026-02-26", participant: "James Whitfield, Amanda Foster", summary: "James: security posture solid, no blocking concerns. Needs full DPA for legal review (2-3 weeks). Amanda asked to expedite. James flagged concern about Meridian writing back to Salesforce — higher risk than read-only. Needs more review." },
      { type: "Executive Briefing", date: "2026-03-12", participant: "Robert Kim, Amanda Foster, Lisa Nguyen", summary: "First CRO meeting. Robert's concerns: adoption (60% of AEs not using Salesforce correctly) and implementation risk. Lisa echoed adoption concern. Pre-meeting brief demo resonated with Lisa. Robert asked for 10-AE pilot proposal at $50K with expansion option. Amanda said this was exactly her recommendation." },
    ],
  },
  {
    id: 60001,
    name: "Nike — Global Sales Intelligence",
    stage: "Discovery",
    value: 480000,
    confidence: 35,
    companyInfo: "Nike is a global consumer goods company (NYSE: NKE, 79,000 employees) with a large B2B wholesale sales division. 50 AEs managing complex retailer relationships.",
    stakeholders: [
      { name: "Sarah Kim", title: "VP of Sales Operations", role: "Champion", sentiment: "Positive", engagement: "High" },
      { name: "James Rodriguez", title: "VP of Sales, Wholesale", role: "Decision Maker", sentiment: "Neutral", engagement: "Low" },
      { name: "Emily Zhao", title: "Director of Sales Enablement", role: "Influencer", sentiment: "Positive", engagement: "Medium" },
      { name: "Brian Torres", title: "IT Architecture Lead", role: "Evaluator", sentiment: "Neutral", engagement: "Medium" },
      { name: "Michelle Park", title: "Senior AE", role: "User", sentiment: "Positive", engagement: "High" },
    ],
    meetings: [
      { type: "Discovery Call", date: "2026-03-05", participant: "Sarah Kim", summary: "Sarah reached out after SaaStr. 50 AEs managing retailer relationships with 10-15 stakeholders each. Lost Foot Locker renewal because champion left — didn't know for 3 weeks. Engagement heat map resonated immediately. Budget authority up to $100K, needs VP Sales sign-off for full $400K-$500K deal. Interested in $80K pilot." },
      { type: "Demo", date: "2026-03-12", participant: "Sarah Kim, Emily Zhao", summary: "Emily had competitive analysis: Gong strong on recording but weak on deal intelligence, Clari strong on forecasting but not AE-level. Meridian positioned as deal intelligence layer on top of existing stack. Gong integration demo well-received. Knowledge Base feature was the differentiator for Emily — 'this differentiates you from everyone else.' Sarah wants pilot in April." },
      { type: "Technical Review", date: "2026-03-19", participant: "Emily Zhao, Brian Torres", summary: "Brian: US-only data residency confirmed, private AI deployment model accepted. Main technical gap: Salesforce Shield compatibility required for Nike's enterprise Salesforce instance. Leo said Q2 roadmap. Brian flagged as hard requirement. Emily: 'If you can commit to Shield by Q2, we can work around it for the pilot.' Brian satisfied with overall security posture." },
      { type: "Follow-up", date: "2026-03-24", participant: "Sarah Kim", summary: "James Rodriguez interested but distracted by SAP implementation. Told Sarah to run pilot evaluation and present results in 6 weeks. Salesforce Shield confirmed for June release — works for pilot timeline. Michelle Park excited to start pilot. Sarah can approve $80K pilot. Asked for pilot agreement by end of week." },
    ],
  },
];

async function generateSnapshot(deal) {
  const stakeholderSummary = deal.stakeholders
    .map((s) => `- ${s.name} (${s.title}): ${s.sentiment} sentiment, ${s.engagement} engagement`)
    .join("\n");

  const transcriptEvidence = deal.meetings
    .map((m, i) => `Meeting ${i + 1} (${m.type}, ${m.date}${m.participant ? `, with ${m.participant}` : ""}):\n${m.summary}`)
    .join("\n\n");

  const userPrompt = `Deal: ${deal.name}
Stage: ${deal.stage} | Value: $${deal.value.toLocaleString()} | Confidence: ${deal.confidence}%
Company Context: ${deal.companyInfo}
Stakeholders:
${stakeholderSummary}

=== MEETING EVIDENCE (${deal.meetings.length} meetings) ===
${transcriptEvidence}`;

  const raw = await callOpenAI(SYSTEM_PROMPT, userPrompt);
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned);
}

async function run() {
  // Parse MySQL URL
  const url = new URL(DATABASE_URL);
  const db = await createConnection({
    host: url.hostname,
    port: parseInt(url.port || "3306"),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connected to database");

  // Clear existing snapshots for these 4 deals
  await db.execute("DELETE FROM snapshots WHERE dealId IN (1, 2, 4, 60001) AND tenantId = 1");
  console.log("Cleared existing snapshots");

  for (const deal of deals) {
    console.log(`\nGenerating snapshot for: ${deal.name}...`);
    try {
      const insights = await generateSnapshot(deal);
      const now = new Date();

      await db.execute(
        `INSERT INTO snapshots (dealId, tenantId, date, whatsHappening, whatsNext, keyRisks, confidenceScore, confidenceChange, interactionType, keyParticipant, aiGenerated, createdAt)
         VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          deal.id,
          now,
          insights.whatsHappening,
          JSON.stringify(insights.whatsNext),
          JSON.stringify(insights.keyRisks),
          deal.confidence,
          0,
          "AI Analysis",
          deal.meetings[deal.meetings.length - 1]?.participant?.split(",")[0] ?? null,
          now,
        ]
      );

      console.log(`  ✓ Snapshot created for ${deal.name}`);
      console.log(`  What's happening: ${insights.whatsHappening.slice(0, 100)}...`);
    } catch (err) {
      console.error(`  ✗ Failed for ${deal.name}:`, err.message);
    }
  }

  await db.end();
  console.log("\nDone! All snapshots generated.");
}

run().catch(console.error);
