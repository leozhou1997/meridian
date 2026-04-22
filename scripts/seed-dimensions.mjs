/**
 * Seed Decision Map dimensions and action items for existing demo deals
 * Run: node scripts/seed-dimensions.mjs
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🗺️  Seeding Decision Map dimensions...');

// Get the first user's tenant
const [users] = await db.execute('SELECT id FROM users LIMIT 1');
if (users.length === 0) {
  console.log('⚠️  No users found.');
  process.exit(0);
}

const [tenants] = await db.execute(
  'SELECT t.id FROM tenants t JOIN tenantMembers tm ON t.id = tm.tenantId WHERE tm.userId = ? LIMIT 1',
  [users[0].id]
);
if (tenants.length === 0) {
  console.log('⚠️  No tenant found.');
  process.exit(0);
}
const tenantId = tenants[0].id;

// Get all deals
const [deals] = await db.execute(
  'SELECT id, company, stage, confidenceScore FROM deals WHERE tenantId = ?',
  [tenantId]
);

console.log(`Found ${deals.length} deals`);

const DIMENSIONS = [
  'tech_validation',
  'commercial_breakthrough',
  'executive_engagement',
  'competitive_defense',
  'budget_advancement',
  'case_support',
];

// Dimension seed data per deal (keyed by company name pattern)
const DIMENSION_SEEDS = {
  'Acme': {
    tech_validation: { status: 'in_progress', aiSummary: 'David Park (CTO) 对技术方案表示认可，但 Michael Stern (CISO) 对数据安全合规有顾虑。POC 环境已搭建，正在进行第二轮技术验证。' },
    commercial_breakthrough: { status: 'in_progress', aiSummary: 'Jennifer Walsh (VP Sales) 已确认预算范围在 $200K-$280K 之间。采购流程需要 Rachel Torres (RevOps Director) 推动。' },
    executive_engagement: { status: 'not_started', aiSummary: '尚未接触到 C-level 决策者。需要通过 Jennifer Walsh 引荐 CRO。' },
    competitive_defense: { status: 'blocked', aiSummary: '竞对 Gong.io 已经在做 POC，且有内部支持者。Michael Stern 曾在前公司使用过 Gong，有品牌偏好。' },
    budget_advancement: { status: 'in_progress', aiSummary: 'Q3 预算已预留，但需要 VP+ 级别审批。Rachel Torres 正在推动内部审批流程。' },
    case_support: { status: 'completed', aiSummary: '已提供同行业 3 个成功案例（含 ROI 数据）。Tom Bradley 反馈案例非常有说服力。' },
  },
  'GlobalTech': {
    tech_validation: { status: 'completed', aiSummary: 'POC 已通过，技术团队确认集成方案可行。API 对接文档已交付。' },
    commercial_breakthrough: { status: 'in_progress', aiSummary: '合同条款谈判中，价格基本达成一致。法务审核预计还需 1 周。' },
    executive_engagement: { status: 'completed', aiSummary: 'VP of Engineering 已签字确认技术选型。CTO 在 Board Meeting 上提到了我们的方案。' },
    competitive_defense: { status: 'completed', aiSummary: '竞对已出局。我们在技术评估中得分最高，且有独家功能优势。' },
    budget_advancement: { status: 'in_progress', aiSummary: '预算已获 VP 批准，等待 CFO 最终签字。预计本周内完成。' },
    case_support: { status: 'completed', aiSummary: '客户已参观参考客户现场，反馈非常积极。' },
  },
  'Nexus': {
    tech_validation: { status: 'in_progress', aiSummary: 'RevOps 团队对产品功能很感兴趣，但缺少技术 champion 推动 POC。' },
    commercial_breakthrough: { status: 'not_started', aiSummary: '尚未进入商务讨论阶段。需要先完成技术验证。' },
    executive_engagement: { status: 'blocked', aiSummary: '没有识别到高管赞助人。当前联系人层级不够，无法推动战略级决策。' },
    competitive_defense: { status: 'not_started', aiSummary: '竞争格局不明确，需要了解客户是否在评估其他方案。' },
    budget_advancement: { status: 'blocked', aiSummary: '客户表示预算紧张，需要等 Q4 新预算周期。缺乏预算推动者。' },
    case_support: { status: 'not_started', aiSummary: '尚未提供案例支撑材料。需要准备针对 RevOps 场景的案例。' },
  },
  'Nike': {
    tech_validation: { status: 'not_started', aiSummary: '初步接触阶段，尚未开始技术验证。' },
    commercial_breakthrough: { status: 'not_started', aiSummary: '需求发现阶段，商务讨论尚未开始。' },
    executive_engagement: { status: 'not_started', aiSummary: '目前只接触到中层管理者，需要向上拓展。' },
    competitive_defense: { status: 'not_started', aiSummary: '竞争情报缺失，需要在发现阶段了解。' },
    budget_advancement: { status: 'not_started', aiSummary: '预算情况未知，需要在需求发现中确认。' },
    case_support: { status: 'not_started', aiSummary: '需要准备运动品牌/零售行业的相关案例。' },
  },
  'JD': {
    tech_validation: { status: 'not_started', aiSummary: '刚进入需求发现阶段，技术验证尚未开始。' },
    commercial_breakthrough: { status: 'not_started', aiSummary: '需求尚在确认中。' },
    executive_engagement: { status: 'not_started', aiSummary: '需要识别关键决策人。' },
    competitive_defense: { status: 'not_started', aiSummary: '竞争格局未知。' },
    budget_advancement: { status: 'not_started', aiSummary: '预算情况待确认。' },
    case_support: { status: 'not_started', aiSummary: '需要准备电商行业案例。' },
  },
};

// Action items per deal
const ACTION_SEEDS = {
  'Acme': [
    { text: '安排 Michael Stern (CISO) 参加数据安全专场演示', dimensionKey: 'tech_validation', priority: 'high', status: 'in_progress' },
    { text: '准备 SOC2 合规报告和数据安全白皮书发给 Michael', dimensionKey: 'tech_validation', priority: 'high', status: 'pending' },
    { text: '与 Jennifer Walsh 确认最终定价方案', dimensionKey: 'commercial_breakthrough', priority: 'high', status: 'pending' },
    { text: '推动 Rachel Torres 启动采购流程', dimensionKey: 'commercial_breakthrough', priority: 'medium', status: 'pending' },
    { text: '请 Jennifer 引荐 CRO 进行高管对话', dimensionKey: 'executive_engagement', priority: 'high', status: 'pending' },
    { text: '准备竞对 Gong 的差异化对比材料', dimensionKey: 'competitive_defense', priority: 'high', status: 'in_progress' },
    { text: '跟进 Rachel 的内部预算审批进度', dimensionKey: 'budget_advancement', priority: 'medium', status: 'in_progress' },
    { text: '安排 Tom Bradley 与参考客户通话', dimensionKey: 'case_support', priority: 'low', status: 'done' },
  ],
  'GlobalTech': [
    { text: '跟进法务合同审核进度', dimensionKey: 'commercial_breakthrough', priority: 'high', status: 'in_progress' },
    { text: '准备最终签约文件', dimensionKey: 'commercial_breakthrough', priority: 'high', status: 'pending' },
    { text: '确认 CFO 签字时间表', dimensionKey: 'budget_advancement', priority: 'high', status: 'in_progress' },
  ],
  'Nexus': [
    { text: '识别并接触技术决策者（CTO 或 VP Engineering）', dimensionKey: 'tech_validation', priority: 'high', status: 'pending' },
    { text: '准备 RevOps 场景的定制化 Demo', dimensionKey: 'tech_validation', priority: 'medium', status: 'pending' },
    { text: '通过 LinkedIn 或行业活动寻找高管接触路径', dimensionKey: 'executive_engagement', priority: 'high', status: 'pending' },
    { text: '了解客户 Q4 预算规划时间线', dimensionKey: 'budget_advancement', priority: 'medium', status: 'pending' },
  ],
};

for (const deal of deals) {
  console.log(`\n📊 Processing: ${deal.company} (ID: ${deal.id})`);
  
  // Find matching seed data
  const matchKey = Object.keys(DIMENSION_SEEDS).find(k => deal.company.includes(k));
  if (!matchKey) {
    console.log(`  ⏭️  No seed data for ${deal.company}, skipping`);
    continue;
  }
  
  const dimSeeds = DIMENSION_SEEDS[matchKey];
  
  // Check if dimensions already exist
  const [existingDims] = await db.execute(
    'SELECT id FROM dealDimensions WHERE dealId = ? AND tenantId = ?',
    [deal.id, tenantId]
  );
  
  if (existingDims.length > 0) {
    console.log(`  ✅ Dimensions already exist (${existingDims.length}), updating...`);
    // Update existing dimensions
    for (const dimKey of DIMENSIONS) {
      const seed = dimSeeds[dimKey];
      if (seed) {
        await db.execute(
          'UPDATE dealDimensions SET status = ?, aiSummary = ? WHERE dealId = ? AND tenantId = ? AND dimensionKey = ?',
          [seed.status, seed.aiSummary, deal.id, tenantId, dimKey]
        );
      }
    }
  } else {
    console.log(`  🆕 Creating dimensions...`);
    for (const dimKey of DIMENSIONS) {
      const seed = dimSeeds[dimKey] || { status: 'not_started', aiSummary: null };
      await db.execute(
        'INSERT INTO dealDimensions (dealId, tenantId, dimensionKey, status, aiSummary) VALUES (?, ?, ?, ?, ?)',
        [deal.id, tenantId, dimKey, seed.status, seed.aiSummary]
      );
    }
  }
  console.log(`  ✅ Dimensions seeded`);
  
  // Seed action items with dimensionKey
  const actionSeeds = ACTION_SEEDS[matchKey];
  if (actionSeeds) {
    // Update existing actions to have dimensionKey, or create new ones
    for (const action of actionSeeds) {
      // Check if similar action already exists
      const [existing] = await db.execute(
        'SELECT id FROM nextActions WHERE dealId = ? AND tenantId = ? AND text = ?',
        [deal.id, tenantId, action.text]
      );
      if (existing.length === 0) {
        await db.execute(
          'INSERT INTO nextActions (dealId, tenantId, text, priority, source, status, dimensionKey) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [deal.id, tenantId, action.text, action.priority, 'ai_suggested', action.status, action.dimensionKey]
        );
        console.log(`  ➕ Action: ${action.text.substring(0, 40)}...`);
      }
    }
    console.log(`  ✅ Actions seeded`);
  }
}

console.log('\n🎉 Decision Map seed complete!');
await db.end();
