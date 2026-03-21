import { createPool } from 'mysql2/promise';

const pool = createPool(process.env.DATABASE_URL);

const [tenants] = await pool.query('SELECT id FROM tenants LIMIT 1');
const tenantId = tenants[0]?.id;
const [users] = await pool.query('SELECT id FROM users LIMIT 1');
const userId = users[0]?.id;

if (!tenantId) { console.log('No tenant found'); await pool.end(); process.exit(0); }

const [existing] = await pool.query('SELECT COUNT(*) as cnt FROM kbDocuments WHERE tenantId = ?', [tenantId]);
if (existing[0].cnt > 0) { console.log('KB docs already exist:', existing[0].cnt); await pool.end(); process.exit(0); }

const docs = [
  {
    name: 'Meridian Product Overview v2.1',
    category: 'product',
    description: 'Core product capabilities, feature set, and technical architecture overview for sales conversations.',
    fileType: 'pdf',
    fileSize: '2.4 MB',
    content: '# Meridian Product Overview\n\n## What is Meridian?\nMeridian is an AI-powered Sales Intelligence platform that transforms unstructured meeting data into actionable deal insights.\n\n## Core Capabilities\n- **Meeting Analysis**: Automatically transcribe and analyze sales calls\n- **Stakeholder Mapping**: Visual relationship mapping with sentiment tracking\n- **Deal Snapshots**: AI-generated deal summaries with confidence scoring\n- **Risk Detection**: Early warning system for at-risk deals\n\n## Technical Architecture\n- Cloud-native SaaS, SOC 2 Type II compliant\n- Integrates with Salesforce, HubSpot, Gong, Zoom, Teams\n- API-first design for custom integrations\n- 99.9% uptime SLA',
  },
  {
    name: 'Competitive Battle Card — Gong vs Meridian',
    category: 'product',
    description: 'Side-by-side comparison with Gong, Chorus, and Clari. Objection handling and differentiation points.',
    fileType: 'doc',
    fileSize: '890 KB',
    content: '# Competitive Battle Card: Meridian vs Gong\n\n## Key Differentiators\n| Feature | Meridian | Gong |\n|---------|----------|------|\n| Stakeholder Map | Visual, editable | Not available |\n| Deal Confidence Score | AI-powered | Revenue Intelligence |\n| Buying Committee Tracking | Multi-role, multi-stage | Limited |\n| Price | $$ | $$$$ |',
  },
  {
    name: 'Enterprise Sales Playbook 2025',
    category: 'playbook',
    description: 'End-to-end enterprise sales methodology: discovery framework, demo flow, POC structure, and negotiation tactics.',
    fileType: 'pdf',
    fileSize: '5.1 MB',
    content: '# Enterprise Sales Playbook 2025\n\n## Discovery Framework (MEDDIC)\n- **Metrics**: Quantify the economic impact\n- **Economic Buyer**: Identify and access the financial decision maker\n- **Decision Criteria**: Understand how they will evaluate solutions\n- **Decision Process**: Map the internal approval workflow\n- **Identify Pain**: Connect to a compelling event\n- **Champion**: Develop an internal advocate',
  },
  {
    name: 'Objection Handling Guide',
    category: 'playbook',
    description: 'Top 20 objections with proven responses. Covers price, security, integration, and ROI concerns.',
    fileType: 'md',
    fileSize: '340 KB',
    content: '# Objection Handling Guide\n\n## Price Objections\n**"It is too expensive"**\nAsk: "What is the cost of losing one enterprise deal per quarter due to poor stakeholder visibility?"\n\n## Security Objections\n**"We cannot share meeting recordings with a third party"**\nMeridian is SOC 2 Type II certified. Data is encrypted at rest and in transit.',
  },
  {
    name: 'Ideal Customer Profile (ICP) Definition',
    category: 'icp',
    description: 'Detailed ICP criteria: firmographics, technographics, behavioral signals, and disqualification criteria.',
    fileType: 'doc',
    fileSize: '1.2 MB',
    content: '# Ideal Customer Profile — Meridian\n\n## Tier 1 ICP\n**Firmographics**\n- B2B SaaS or enterprise software company\n- 50-500 employees\n- $10M-$100M ARR\n- Series B or later\n\n**Sales Team Profile**\n- 5+ quota-carrying AEs\n- Average deal size >$50K ARR\n- Sales cycle 3-9 months\n- Multi-stakeholder deals (3+ contacts per opportunity)',
  },
];

for (const doc of docs) {
  await pool.query(
    'INSERT INTO kbDocuments (tenantId, uploadedBy, name, category, description, fileType, fileSize, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [tenantId, userId, doc.name, doc.category, doc.description, doc.fileType, doc.fileSize, doc.content]
  );
}
console.log('Seeded', docs.length, 'KB documents');
await pool.end();
