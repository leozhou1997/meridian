/**
 * Seed script for Meridian demo data
 * Run: node scripts/seed.mjs
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🌱 Seeding Meridian demo data...');

// Get the first user (owner)
const [users] = await db.execute('SELECT id, openId FROM users LIMIT 1');
if (users.length === 0) {
  console.log('⚠️  No users found. Please log in first, then run this seed script.');
  process.exit(0);
}
const userId = users[0].id;
console.log(`👤 Seeding for user ID: ${userId}`);

// Create or get tenant
const [existingTenants] = await db.execute(
  'SELECT id FROM tenants WHERE slug = ?', ['acme-sales']
);
let tenantId;
if (existingTenants.length > 0) {
  tenantId = existingTenants[0].id;
  console.log(`🏢 Using existing tenant ID: ${tenantId}`);
} else {
  const [result] = await db.execute(
    'INSERT INTO tenants (name, slug, plan) VALUES (?, ?, ?)',
    ['Acme Sales Team', 'acme-sales', 'pro']
  );
  tenantId = result.insertId;
  console.log(`🏢 Created tenant ID: ${tenantId}`);
}

// Add user as tenant member if not already
const [existingMember] = await db.execute(
  'SELECT id FROM tenantMembers WHERE tenantId = ? AND userId = ?',
  [tenantId, userId]
);
if (existingMember.length === 0) {
  await db.execute(
    'INSERT INTO tenantMembers (tenantId, userId, role) VALUES (?, ?, ?)',
    [tenantId, userId, 'owner']
  );
}

// Check if deals already seeded
const [existingDeals] = await db.execute(
  'SELECT COUNT(*) as count FROM deals WHERE tenantId = ?', [tenantId]
);
if (existingDeals[0].count > 0) {
  console.log(`✅ Deals already seeded (${existingDeals[0].count} deals). Skipping.`);
  await db.end();
  process.exit(0);
}

// ── Deals ──────────────────────────────────────────────────────────────────
const dealsData = [
  {
    name: 'Acme Corp Enterprise Platform',
    company: 'Acme Corp',
    stage: 'Technical Evaluation',
    value: 240000,
    confidenceScore: 72,
    daysInStage: 18,
    lastActivity: '2 days ago',
    riskOneLiner: 'Competitor POC running in parallel',
    companyInfo: 'Fortune 500 manufacturing company, 12,000 employees. Digital transformation initiative led by new CTO.',
  },
  {
    name: 'GlobalTech AI Suite',
    company: 'GlobalTech',
    stage: 'Negotiation',
    value: 180000,
    confidenceScore: 85,
    daysInStage: 7,
    lastActivity: 'Today',
    riskOneLiner: 'Legal review taking longer than expected',
    companyInfo: 'Mid-market SaaS company, 800 employees. Series C funded, rapid growth phase.',
  },
  {
    name: 'Meridian Analytics POC',
    company: 'Meridian Analytics',
    stage: 'POC',
    value: 95000,
    confidenceScore: 58,
    daysInStage: 34,
    lastActivity: '5 days ago',
    riskOneLiner: 'Champion left the company',
    companyInfo: 'Analytics startup, 150 employees. Seed funded. Strong technical team.',
  },
  {
    name: 'Nexus Systems Platform',
    company: 'Nexus Systems',
    stage: 'Demo',
    value: 320000,
    confidenceScore: 45,
    daysInStage: 12,
    lastActivity: '1 week ago',
    riskOneLiner: 'Budget freeze announced for Q2',
    companyInfo: 'Enterprise software company, 3,500 employees. Going through M&A process.',
  },
  {
    name: 'Velocity Commerce Suite',
    company: 'Velocity Commerce',
    stage: 'Discovery',
    value: 60000,
    confidenceScore: 65,
    daysInStage: 5,
    lastActivity: 'Yesterday',
    riskOneLiner: null,
    companyInfo: 'E-commerce platform, 200 employees. Growing 40% YoY.',
  },
];

const dealIds = [];
for (const deal of dealsData) {
  const [result] = await db.execute(
    `INSERT INTO deals (tenantId, ownerId, name, company, stage, value, confidenceScore, daysInStage, lastActivity, riskOneLiner, companyInfo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, userId, deal.name, deal.company, deal.stage, deal.value, deal.confidenceScore, deal.daysInStage, deal.lastActivity, deal.riskOneLiner, deal.companyInfo]
  );
  dealIds.push(result.insertId);
}
console.log(`✅ Created ${dealIds.length} deals`);

// ── Stakeholders for Deal 1 (Acme Corp) ───────────────────────────────────
const stakeholdersData = [
  { dealIdx: 0, name: 'Sarah Chen', title: 'VP of Engineering', role: 'Decision Maker', sentiment: 'Positive', engagement: 'High', email: 'sarah.chen@acmecorp.com', keyInsights: 'Focused on reducing infrastructure costs by 30% this year. Led migration from on-prem to AWS last year.', personalNotes: 'Mentioned her team is burned out from the last migration. Prefers async communication.', mapX: 0.5, mapY: 0.3 },
  { dealIdx: 0, name: 'Marcus Rodriguez', title: 'CFO', role: 'Decision Maker', sentiment: 'Neutral', engagement: 'Low', email: 'marcus.r@acmecorp.com', keyInsights: 'Very ROI-focused. Needs 18-month payback period. Has veto power on all deals over $100k.', personalNotes: 'Has not attended any meetings yet. Sarah says he will need a business case.', mapX: 0.8, mapY: 0.2 },
  { dealIdx: 0, name: 'Jamie Park', title: 'Senior DevOps Engineer', role: 'Evaluator', sentiment: 'Positive', engagement: 'High', email: 'j.park@acmecorp.com', keyInsights: 'Technical champion. Running the POC evaluation. Loves our Kubernetes integration.', personalNotes: 'Gave us a 5-star internal review. Will advocate to Sarah.', mapX: 0.4, mapY: 0.6 },
  // Deal 2 stakeholders
  { dealIdx: 1, name: 'Alex Thompson', title: 'CEO', role: 'Decision Maker', sentiment: 'Positive', engagement: 'High', email: 'alex@globaltech.io', keyInsights: 'Founder-led company. Alex makes all final decisions personally. Very metrics-driven.', personalNotes: 'Mentioned wanting to close before end of quarter for board reporting.', mapX: 0.5, mapY: 0.2 },
  { dealIdx: 1, name: 'Priya Sharma', title: 'Head of Product', role: 'Champion', sentiment: 'Positive', engagement: 'High', email: 'priya@globaltech.io', keyInsights: 'Our internal champion. Has been pushing for this deal for 3 months.', personalNotes: 'Introduced us to Alex. Very invested in making this work.', mapX: 0.3, mapY: 0.5 },
];

let stakeholderCount = 0;
for (const s of stakeholdersData) {
  await db.execute(
    `INSERT INTO stakeholders (dealId, tenantId, name, title, role, sentiment, engagement, email, keyInsights, personalNotes, mapX, mapY)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [dealIds[s.dealIdx], tenantId, s.name, s.title, s.role, s.sentiment, s.engagement, s.email, s.keyInsights, s.personalNotes, s.mapX, s.mapY]
  );
  stakeholderCount++;
}
console.log(`✅ Created ${stakeholderCount} stakeholders`);

// ── Meetings ───────────────────────────────────────────────────────────────
const meetingsData = [
  { dealIdx: 0, date: new Date('2026-03-18'), type: 'Technical Review', keyParticipant: 'Sarah Chen', summary: 'Deep dive on API architecture. Sarah asked detailed questions about rate limiting and SLA guarantees. Team impressed with our Kubernetes operator.', duration: 60 },
  { dealIdx: 0, date: new Date('2026-03-10'), type: 'Demo', keyParticipant: 'Sarah Chen, Jamie Park', summary: 'Full product demo. Jamie Park was very engaged and asked about CI/CD integration. Sarah wants to see cost comparison vs current stack.', duration: 90 },
  { dealIdx: 1, date: new Date('2026-03-20'), type: 'Negotiation', keyParticipant: 'Alex Thompson', summary: 'Pricing negotiation. Alex pushed for 20% discount on annual contract. We offered 15% with 2-year commitment. Legal review started.', duration: 45 },
  { dealIdx: 2, date: new Date('2026-03-15'), type: 'POC Check-in', keyParticipant: 'David Kim', summary: 'POC progress review. David left the company last week. New contact TBD. POC results look positive but no internal champion now.', duration: 30 },
];

let meetingCount = 0;
for (const m of meetingsData) {
  await db.execute(
    `INSERT INTO meetings (dealId, tenantId, date, type, keyParticipant, summary, duration)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [dealIds[m.dealIdx], tenantId, m.date, m.type, m.keyParticipant, m.summary, m.duration]
  );
  meetingCount++;
}
console.log(`✅ Created ${meetingCount} meetings`);

// ── Snapshots ──────────────────────────────────────────────────────────────
const snapshotsData = [
  { dealIdx: 0, date: new Date('2026-03-18'), confidenceScore: 72, confidenceChange: 5, whatsHappening: 'Technical evaluation progressing well. Jamie Park is our champion and has given positive internal feedback. Sarah Chen engaged but cautious.', whatsNext: 'Send benchmark comparison vs competitor. Schedule security review with engineering team.', keyRisks: ['Competitor POC running in parallel', 'CFO not yet engaged'] },
  { dealIdx: 0, date: new Date('2026-03-10'), confidenceScore: 67, confidenceChange: 8, whatsHappening: 'Demo went well. Strong technical interest from the engineering team. Need to get CFO involved.', whatsNext: 'Follow up with cost analysis. Get intro to CFO through Sarah.', keyRisks: ['Budget approval needed from CFO'] },
  { dealIdx: 1, date: new Date('2026-03-20'), confidenceScore: 85, confidenceChange: 10, whatsHappening: 'In final negotiation. Alex wants to close before end of quarter. Legal review is the main blocker now.', whatsNext: 'Expedite legal review. Prepare final contract draft.', keyRisks: ['Legal review timeline', 'Competitor last-minute pitch'] },
  { dealIdx: 2, date: new Date('2026-03-15'), confidenceScore: 58, confidenceChange: -15, whatsHappening: 'Champion David Kim left the company. POC results are positive but we have no internal advocate now.', whatsNext: 'Identify new champion. Request intro to David\'s replacement.', keyRisks: ['No internal champion', 'POC stalling without advocate'] },
];

let snapshotCount = 0;
for (const s of snapshotsData) {
  await db.execute(
    `INSERT INTO snapshots (dealId, tenantId, date, confidenceScore, confidenceChange, whatsHappening, whatsNext, keyRisks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [dealIds[s.dealIdx], tenantId, s.date, s.confidenceScore, s.confidenceChange, s.whatsHappening, s.whatsNext, JSON.stringify(s.keyRisks)]
  );
  snapshotCount++;
}
console.log(`✅ Created ${snapshotCount} snapshots`);

// ── Next Actions ───────────────────────────────────────────────────────────
const actionsData = [
  { dealIdx: 0, text: 'Send benchmark comparison vs Datadog', dueDate: new Date('2026-03-25'), priority: 'high', completed: false },
  { dealIdx: 0, text: 'Schedule security review with Jamie\'s team', dueDate: new Date('2026-03-28'), priority: 'high', completed: false },
  { dealIdx: 0, text: 'Get intro to CFO Marcus Rodriguez', dueDate: new Date('2026-04-01'), priority: 'medium', completed: false },
  { dealIdx: 1, text: 'Follow up with legal team on contract review', dueDate: new Date('2026-03-22'), priority: 'high', completed: false },
  { dealIdx: 1, text: 'Prepare final contract draft with 15% discount', dueDate: new Date('2026-03-23'), priority: 'high', completed: false },
  { dealIdx: 2, text: 'Identify new champion after David Kim departure', dueDate: new Date('2026-03-24'), priority: 'high', completed: false },
  { dealIdx: 3, text: 'Send ROI calculator to procurement team', dueDate: new Date('2026-04-05'), priority: 'medium', completed: false },
  { dealIdx: 4, text: 'Schedule discovery call with technical team', dueDate: new Date('2026-03-26'), priority: 'medium', completed: false },
];

let actionCount = 0;
for (const a of actionsData) {
  await db.execute(
    `INSERT INTO nextActions (dealId, tenantId, text, dueDate, priority, completed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [dealIds[a.dealIdx], tenantId, a.text, a.dueDate, a.priority, a.completed]
  );
  actionCount++;
}
console.log(`✅ Created ${actionCount} next actions`);

// ── Prompt Templates ───────────────────────────────────────────────────────
const [existingPrompts] = await db.execute('SELECT COUNT(*) as count FROM promptTemplates');
if (existingPrompts[0].count === 0) {
  await db.execute(
    `INSERT INTO promptTemplates (feature, version, isActive, systemPrompt, userPromptTemplate, description, createdBy)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'pre_meeting_brief',
      'v1.0',
      true,
      `You are an expert enterprise sales coach. Generate a concise, actionable pre-meeting brief for a sales representative.

The brief should include:
1. **Who They Are** - Quick summary of the stakeholder's role and background
2. **What They Care About** - Their likely priorities and pain points based on their title and context
3. **Relationship Status** - Current sentiment and engagement level
4. **Talking Points** - 3-5 specific, personalized talking points based on the context provided
5. **Watch Out For** - Key risks or sensitivities to be aware of
6. **Suggested Ask** - The specific next step or commitment to pursue in this meeting

Be direct, specific, and actionable. Avoid generic advice. Format with clear headers.`,
      `Generate a pre-meeting brief for this stakeholder:

**Stakeholder:** {{name}}
**Title:** {{title}}
**Role in Deal:** {{role}}
**Sentiment:** {{sentiment}}
**Engagement Level:** {{engagement}}

**Deal Context:**
- Deal: {{dealName}}
- Stage: {{stage}}
- Value: {{value}}

**What We Know About Them:**
Key Insights: {{keyInsights}}
Personal Notes: {{personalNotes}}

**Last Meeting:** {{lastMeeting}}

**Open Actions for this stakeholder:**
{{openActions}}`,
      'Initial version of pre-meeting brief generation',
      userId
    ]
  );
  console.log('✅ Created prompt template');
}

await db.end();
console.log('\n🎉 Seed complete! Refresh the app to see your data.');
