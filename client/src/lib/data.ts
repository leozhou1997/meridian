// Meridian Mock Data — Intelligence Cartography Design
// All data simulates Meridian selling to B2B SaaS companies

export interface Stakeholder {
  id: string;
  name: string;
  title: string;
  role: 'Champion' | 'Decision Maker' | 'Influencer' | 'Blocker' | 'User' | 'Evaluator';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  engagement: 'High' | 'Medium' | 'Low';
  avatar: string;
  email?: string;
  linkedIn?: string;
  keyInsights?: string;
  stage?: string; // which buying stage they belong to
  x?: number; // position on stakeholder map
  y?: number;
}

export interface Snapshot {
  id: string;
  dealId: string;
  date: string;
  whatsHappening: string;
  whatsNext: string;
  keyRisks: string[];
  confidenceScore: number;
  confidenceChange: number;
  interactionType: string;
  keyParticipant: string;
}

export interface Interaction {
  id: string;
  dealId: string;
  date: string;
  type: 'Discovery Call' | 'Demo' | 'Technical Review' | 'POC Check-in' | 'Negotiation' | 'Executive Briefing' | 'Follow-up';
  keyParticipant: string;
  summary: string;
  duration: number; // minutes
}

export interface Deal {
  id: string;
  name: string;
  company: string;
  website: string;
  logo: string;
  stage: 'Discovery' | 'Demo' | 'Technical Evaluation' | 'POC' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  value: number;
  confidenceScore: number;
  daysInStage: number;
  lastActivity: string;
  ownerEmail: string;
  riskOneLiner: string;
  stakeholders: Stakeholder[];
  snapshots: Snapshot[];
  interactions: Interaction[];
  buyingStages: string[];
  companyInfo?: string;
}

const AVATAR_URLS = {
  avatar1: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/meridian-avatar-1-7woB3eTuagJnaTwWvc3ZZq.webp',
  avatar2: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/meridian-avatar-2-LTr7jGEX7suSYHmY9WKrmQ.webp',
  avatar3: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/meridian-avatar-3-kDwnvBASBuAnLUQQgvgMsr.webp',
  avatar4: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/meridian-avatar-4-Va8CCvKegTdUqnPbiLqtGY.webp',
};

export const deals: Deal[] = [
  {
    id: 'deal-1',
    name: 'Allbirds Enterprise',
    company: 'Allbirds',
    website: 'www.allbirds.com',
    logo: 'https://logo.clearbit.com/allbirds.com',
    stage: 'Technical Evaluation',
    value: 420000,
    confidenceScore: 70,
    daysInStage: 67,
    lastActivity: '2026-02-28',
    ownerEmail: 'leo@meridian.ai',
    riskOneLiner: 'Champion Benny may leave in Q2',
    buyingStages: ['Champion Buy-in', 'Stakeholder Alignment', 'Procurement Approvals', 'Close'],
    companyInfo: 'Allbirds is a sustainable footwear and apparel company. Founded in 2016, they focus on using natural materials. Revenue ~$300M, 800+ employees.',
    stakeholders: [
      { id: 's1', name: 'Benny Joseph', title: 'CTO & CSO', role: 'Champion', sentiment: 'Positive', engagement: 'High', avatar: AVATAR_URLS.avatar1, stage: 'Champion Buy-in', keyInsights: 'Strong internal advocate. Pushing for AI-driven sales tools. May transition to advisory role in Q2.', x: 150, y: 100 },
      { id: 's2', name: 'Annie Mitchell', title: 'CFO', role: 'Evaluator', sentiment: 'Neutral', engagement: 'Medium', avatar: AVATAR_URLS.avatar2, stage: 'Stakeholder Alignment', keyInsights: 'Needs ROI proof. Skeptical about AI tools after previous failed implementation.', x: 400, y: 100 },
      { id: 's3', name: 'Christos Yatrokis', title: 'Chief Legal & People', role: 'Blocker', sentiment: 'Negative', engagement: 'Low', avatar: AVATAR_URLS.avatar3, stage: 'Procurement Approvals', keyInsights: 'Concerned about data privacy and compliance. Requires SOC2 documentation.', x: 650, y: 100 },
      { id: 's4', name: 'Joe Vernachio', title: 'CEO', role: 'Decision Maker', sentiment: 'Neutral', engagement: 'Low', avatar: AVATAR_URLS.avatar4, stage: 'Close', keyInsights: 'Final sign-off authority. Delegates most vendor decisions to CTO.', x: 900, y: 100 },
      { id: 's5', name: 'Zoe Daniels', title: 'VP, Production', role: 'User', sentiment: 'Positive', engagement: 'Medium', avatar: AVATAR_URLS.avatar2, stage: 'Stakeholder Alignment', keyInsights: 'End user champion. Excited about POC results.', x: 400, y: 300 },
      { id: 's6', name: 'Robert Osburn', title: 'Director, Engineering', role: 'Influencer', sentiment: 'Positive', engagement: 'High', avatar: AVATAR_URLS.avatar1, stage: 'Procurement Approvals', keyInsights: 'Technical evaluator. Approved API integration approach.', x: 650, y: 300 },
    ],
    snapshots: [
      { id: 'snap-1a', dealId: 'deal-1', date: '2026-02-28', whatsHappening: 'Completed 2 rounds of demo completed. Legal Review pending. Champion Benny has gone quiet 17 days. CFO approval is the final hurdle.', whatsNext: 'Schedule ROI presentation for CFO Annie. Get SOC2 docs to Legal.', keyRisks: ['Champion Benny may leave company in Q2', 'Legal review pending — Christos blocking', 'CFO needs ROI proof before sign-off'], confidenceScore: 70, confidenceChange: -5, interactionType: 'POC Check-in', keyParticipant: 'Benny Joseph' },
      { id: 'snap-1b', dealId: 'deal-1', date: '2026-02-14', whatsHappening: 'POC going well. Benny enthusiastic about results. Engineering team approved integration.', whatsNext: 'Present POC results to broader team. Schedule CFO meeting.', keyRisks: ['Need to expand beyond champion', 'Budget cycle ends in March'], confidenceScore: 75, confidenceChange: 10, interactionType: 'Technical Review', keyParticipant: 'Robert Osburn' },
    ],
    interactions: [
      { id: 'int-1a', dealId: 'deal-1', date: '2026-02-28', type: 'POC Check-in', keyParticipant: 'Benny Joseph', summary: 'Reviewed POC metrics. 23% improvement in deal velocity. Benny mentioned potential role change in Q2.', duration: 30 },
      { id: 'int-1b', dealId: 'deal-1', date: '2026-02-14', type: 'Technical Review', keyParticipant: 'Robert Osburn', summary: 'Engineering approved API integration. No security concerns. Robert will champion internally.', duration: 45 },
      { id: 'int-1c', dealId: 'deal-1', date: '2026-01-20', type: 'Demo', keyParticipant: 'Annie Mitchell', summary: 'CFO demo focused on ROI. Annie wants 6-month payback proof. Requested case studies.', duration: 60 },
      { id: 'int-1d', dealId: 'deal-1', date: '2026-01-08', type: 'Discovery Call', keyParticipant: 'Benny Joseph', summary: 'Initial discovery. Benny frustrated with current CRM. Looking for AI-native solution.', duration: 45 },
    ],
  },
  {
    id: 'deal-2',
    name: 'Gymshark Sales Suite',
    company: 'Gymshark',
    website: 'www.gymshark.com',
    logo: 'https://logo.clearbit.com/gymshark.com',
    stage: 'Demo',
    value: 180000,
    confidenceScore: 68,
    daysInStage: 34,
    lastActivity: '2026-02-25',
    ownerEmail: 'leo@meridian.ai',
    riskOneLiner: 'Competing with Gong — need differentiation',
    buyingStages: ['Discovery', 'Evaluation', 'Decision'],
    stakeholders: [
      { id: 's7', name: 'Marcus Chen', title: 'VP Sales', role: 'Champion', sentiment: 'Positive', engagement: 'High', avatar: AVATAR_URLS.avatar3, stage: 'Evaluation', keyInsights: 'Active Gong user but frustrated with lack of relationship intelligence.', x: 200, y: 150 },
      { id: 's8', name: 'Sarah Kim', title: 'Sales Ops Manager', role: 'Evaluator', sentiment: 'Positive', engagement: 'High', avatar: AVATAR_URLS.avatar2, stage: 'Evaluation', keyInsights: 'Running parallel evaluation with Clari. Loves our stakeholder mapping.', x: 500, y: 150 },
      { id: 's9', name: 'David Park', title: 'CRO', role: 'Decision Maker', sentiment: 'Neutral', engagement: 'Low', avatar: AVATAR_URLS.avatar1, stage: 'Decision', keyInsights: 'Will make final call. Needs team consensus first.', x: 750, y: 150 },
    ],
    snapshots: [
      { id: 'snap-2a', dealId: 'deal-2', date: '2026-02-25', whatsHappening: 'Demo completed successfully. Sarah running parallel eval with Clari. Marcus pushing for POC.', whatsNext: 'Send competitive comparison doc. Schedule POC kickoff.', keyRisks: ['Competing with Gong and Clari', 'CRO not yet engaged'], confidenceScore: 68, confidenceChange: 8, interactionType: 'Demo', keyParticipant: 'Sarah Kim' },
    ],
    interactions: [
      { id: 'int-2a', dealId: 'deal-2', date: '2026-02-25', type: 'Demo', keyParticipant: 'Sarah Kim', summary: 'Full platform demo. Sarah impressed by stakeholder map. Wants to test with real deals.', duration: 60 },
      { id: 'int-2b', dealId: 'deal-2', date: '2026-02-10', type: 'Discovery Call', keyParticipant: 'Marcus Chen', summary: 'Marcus looking for relationship intelligence layer on top of Salesforce. Current Gong contract ends in 4 months.', duration: 30 },
    ],
  },
  {
    id: 'deal-3',
    name: 'Sketchers Global',
    company: 'Sketchers',
    website: 'www.skechers.com',
    logo: 'https://logo.clearbit.com/skechers.com',
    stage: 'POC',
    value: 650000,
    confidenceScore: 55,
    daysInStage: 135,
    lastActivity: '2026-02-20',
    ownerEmail: 'leo@meridian.ai',
    riskOneLiner: 'POC stalled — IT team blocking integration',
    buyingStages: ['Technical Validation', 'Business Case', 'Procurement', 'Legal'],
    stakeholders: [
      { id: 's10', name: 'Rachel Torres', title: 'SVP Revenue', role: 'Champion', sentiment: 'Positive', engagement: 'Medium', avatar: AVATAR_URLS.avatar4, stage: 'Business Case', keyInsights: 'Strong sponsor but bandwidth limited. Delegating to team.', x: 300, y: 120 },
      { id: 's11', name: 'Kevin Wright', title: 'IT Director', role: 'Blocker', sentiment: 'Negative', engagement: 'High', avatar: AVATAR_URLS.avatar3, stage: 'Technical Validation', keyInsights: 'Concerned about SSO integration and data residency requirements.', x: 100, y: 120 },
      { id: 's12', name: 'Lisa Huang', title: 'Sales Enablement Lead', role: 'User', sentiment: 'Positive', engagement: 'High', avatar: AVATAR_URLS.avatar2, stage: 'Technical Validation', keyInsights: 'End user champion. Already testing with 3 reps.', x: 100, y: 300 },
    ],
    snapshots: [
      { id: 'snap-3a', dealId: 'deal-3', date: '2026-02-20', whatsHappening: 'POC running but IT blocking full integration. Kevin insists on on-prem option. Rachel trying to override.', whatsNext: 'Prepare data residency documentation. Schedule IT security review.', keyRisks: ['IT Director actively blocking', 'POC stalled for 3 weeks', 'May lose champion attention'], confidenceScore: 55, confidenceChange: -10, interactionType: 'POC Check-in', keyParticipant: 'Lisa Huang' },
    ],
    interactions: [
      { id: 'int-3a', dealId: 'deal-3', date: '2026-02-20', type: 'POC Check-in', keyParticipant: 'Lisa Huang', summary: 'POC users love the product. 3 reps actively using. But IT has blocked API access.', duration: 25 },
      { id: 'int-3b', dealId: 'deal-3', date: '2026-02-05', type: 'Technical Review', keyParticipant: 'Kevin Wright', summary: 'Kevin raised data residency and SSO concerns. Wants on-prem deployment option.', duration: 45 },
    ],
  },
  {
    id: 'deal-4',
    name: 'Lululemon Analytics',
    company: 'Lululemon',
    website: 'www.lululemon.com',
    logo: 'https://logo.clearbit.com/lululemon.com',
    stage: 'Negotiation',
    value: 310000,
    confidenceScore: 60,
    daysInStage: 212,
    lastActivity: '2026-03-01',
    ownerEmail: 'leo@meridian.ai',
    riskOneLiner: 'Budget freeze until Q3 — timeline at risk',
    buyingStages: ['Alignment', 'Negotiation', 'Contract'],
    stakeholders: [
      { id: 's13', name: 'Amanda Foster', title: 'VP Sales Operations', role: 'Champion', sentiment: 'Positive', engagement: 'High', avatar: AVATAR_URLS.avatar4, stage: 'Negotiation', keyInsights: 'Strong champion. Pushing hard internally despite budget freeze.', x: 300, y: 150 },
      { id: 's14', name: 'James Liu', title: 'CFO', role: 'Decision Maker', sentiment: 'Neutral', engagement: 'Medium', avatar: AVATAR_URLS.avatar1, stage: 'Contract', keyInsights: 'Imposed company-wide budget freeze. Open to Q3 start.', x: 600, y: 150 },
    ],
    snapshots: [
      { id: 'snap-4a', dealId: 'deal-4', date: '2026-03-01', whatsHappening: 'Terms agreed but budget frozen company-wide. Amanda negotiating for exception.', whatsNext: 'Wait for Q3 budget cycle. Keep relationship warm.', keyRisks: ['Company-wide budget freeze', 'Long sales cycle fatigue', 'Competitor may enter during pause'], confidenceScore: 60, confidenceChange: -15, interactionType: 'Negotiation', keyParticipant: 'Amanda Foster' },
    ],
    interactions: [
      { id: 'int-4a', dealId: 'deal-4', date: '2026-03-01', type: 'Negotiation', keyParticipant: 'Amanda Foster', summary: 'Amanda confirmed budget freeze. Suggested creative structuring — start billing in Q3.', duration: 40 },
    ],
  },
  {
    id: 'deal-5',
    name: 'Jorya Intelligence',
    company: 'Jorya',
    website: 'www.jorya.com',
    logo: 'https://logo.clearbit.com/jorya.com',
    stage: 'Negotiation',
    value: 110000,
    confidenceScore: 88,
    daysInStage: 55,
    lastActivity: '2026-03-02',
    ownerEmail: 'leo@meridian.ai',
    riskOneLiner: 'On track',
    buyingStages: ['Evaluation', 'Approval', 'Close'],
    stakeholders: [
      { id: 's15', name: 'Michelle Wang', title: 'Head of Sales', role: 'Champion', sentiment: 'Positive', engagement: 'High', avatar: AVATAR_URLS.avatar2, stage: 'Close', keyInsights: 'Ready to sign. Pushing for March close.', x: 600, y: 150 },
      { id: 's16', name: 'Tom Bradley', title: 'CEO', role: 'Decision Maker', sentiment: 'Positive', engagement: 'Medium', avatar: AVATAR_URLS.avatar1, stage: 'Close', keyInsights: 'Approved budget. Wants to start onboarding ASAP.', x: 600, y: 300 },
    ],
    snapshots: [
      { id: 'snap-5a', dealId: 'deal-5', date: '2026-03-02', whatsHappening: 'Contract in final review. Legal approved. Waiting for CEO signature.', whatsNext: 'Send final contract. Schedule onboarding kickoff.', keyRisks: [], confidenceScore: 88, confidenceChange: 5, interactionType: 'Negotiation', keyParticipant: 'Michelle Wang' },
    ],
    interactions: [
      { id: 'int-5a', dealId: 'deal-5', date: '2026-03-02', type: 'Negotiation', keyParticipant: 'Michelle Wang', summary: 'Final terms agreed. 3-year deal with annual billing. Onboarding to start March 15.', duration: 30 },
      { id: 'int-5b', dealId: 'deal-5', date: '2026-02-15', type: 'Executive Briefing', keyParticipant: 'Tom Bradley', summary: 'CEO briefing went well. Tom sees strategic value. Approved budget immediately.', duration: 25 },
    ],
  },
];

export const currentUser = {
  name: 'Leo Zhou',
  email: 'leo@meridian.ai',
  role: 'Account Executive',
  avatar: 'https://ui-avatars.com/api/?name=Leo+Zhou&background=4f46e5&color=fff&size=128',
};

// Helper functions
export function getConfidenceColor(score: number): string {
  if (score >= 75) return 'text-status-success';
  if (score >= 50) return 'text-status-warning';
  return 'text-status-danger';
}

export function getConfidenceBg(score: number): string {
  if (score >= 75) return 'bg-status-success/15 text-status-success';
  if (score >= 50) return 'bg-status-warning/15 text-status-warning';
  return 'bg-status-danger/15 text-status-danger';
}

export function getSentimentColor(sentiment: string): string {
  if (sentiment === 'Positive') return 'text-status-success';
  if (sentiment === 'Neutral') return 'text-status-warning';
  return 'text-status-danger';
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'Champion': return 'bg-status-success/15 text-status-success border-status-success/30';
    case 'Decision Maker': return 'bg-status-info/15 text-status-info border-status-info/30';
    case 'Blocker': return 'bg-status-danger/15 text-status-danger border-status-danger/30';
    case 'Evaluator': return 'bg-status-warning/15 text-status-warning border-status-warning/30';
    case 'Influencer': return 'bg-primary/15 text-primary border-primary/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

export function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getDaysAgo(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function getStageColor(stage: string): string {
  switch (stage) {
    case 'Discovery': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'Demo': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'Technical Evaluation': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'POC': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'Negotiation': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'Closed Won': return 'bg-green-500/15 text-green-400 border-green-500/30';
    case 'Closed Lost': return 'bg-red-500/15 text-red-400 border-red-500/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

export const pipelineStats = {
  totalPipeline: deals.reduce((sum, d) => sum + d.value, 0),
  predictableRevenue: deals.filter(d => d.confidenceScore >= 60).reduce((sum, d) => sum + d.value, 0),
  avgConfidence: Math.round(deals.reduce((sum, d) => sum + d.confidenceScore, 0) / deals.length),
  atRiskCount: deals.filter(d => d.confidenceScore < 60).length,
};
