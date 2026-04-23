/**
 * Fix need_discovery dimension for 华锐 deal.
 * 
 * Context: The 华锐 deal started from a trade show contact where Lin Xuemei
 * (智能制造部部长) saw the product. The customer's needs are partially understood:
 * - Welding line automation upgrade (organizational)
 * - Smart factory mandate from HQ (organizational)
 * - Quality inspection improvement (organizational)
 * 
 * So need_discovery should be "in_progress", not "not_started".
 * Also adds stakeholder needs mapped to need_discovery dimension.
 */
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  console.log('=== Fixing need_discovery for 华锐 deal ===\n');
  
  // Find the 华锐 deal (dealId 240001 based on seed data)
  const [deals] = await conn.query(
    "SELECT id, tenantId FROM deals WHERE company LIKE '%华锐%' LIMIT 1"
  );
  
  if (deals.length === 0) {
    console.log('No 华锐 deal found, skipping');
    await conn.end();
    return;
  }
  
  const dealId = deals[0].id;
  const tenantId = deals[0].tenantId;
  console.log(`Found deal ${dealId} (tenant ${tenantId})`);
  
  // 1. Update need_discovery status to in_progress
  const [updateResult] = await conn.query(
    "UPDATE dealDimensions SET status = 'in_progress', aiSummary = ? WHERE dealId = ? AND dimensionKey = 'need_discovery'",
    [
      '华锐汽车合肥工厂焊装车间面临三大核心痛点：新车型导入周期长（每次换线需2-3周停产调试）、焊点质量依赖人工抽检（漏检率约2%）、夜班用工困难。集团2025年发布「灯塔工厂」战略，要求2026年底前实现关键工序智能化升级。林雪梅在展会上主动接触我方产品，说明需求已初步明确，但具体技术规格和预算范围仍需深入确认。',
      dealId
    ]
  );
  console.log(`Updated need_discovery status: ${updateResult.affectedRows} rows`);
  
  // 2. Find stakeholders
  const [stakeholders] = await conn.query(
    "SELECT id, name FROM stakeholders WHERE dealId = ?",
    [dealId]
  );
  const stakeholderMap = {};
  for (const s of stakeholders) {
    stakeholderMap[s.name] = s.id;
  }
  console.log(`Found stakeholders: ${Object.keys(stakeholderMap).join(', ')}`);
  
  // 3. Add stakeholder needs for need_discovery dimension
  // Check if any already exist for this dimension
  const [existingNeeds] = await conn.query(
    "SELECT id FROM stakeholderNeeds WHERE dealId = ? AND dimensionKey = 'need_discovery'",
    [dealId]
  );
  
  if (existingNeeds.length > 0) {
    console.log(`Already have ${existingNeeds.length} needs for need_discovery, skipping insert`);
  } else {
    const needsToInsert = [
      {
        stakeholderId: stakeholderMap['陈志远'] || stakeholderMap['陈远'],
        needType: 'organizational',
        title: '焊装线自动化升级需求确认',
        description: '确认合肥工厂24个焊装工位的具体升级优先级、技术规格要求、以及与现有ABB+发那科设备的兼容性需求',
        status: 'in_progress',
        priority: 'critical',
      },
      {
        stakeholderId: stakeholderMap['林雪梅'],
        needType: 'organizational',
        title: '灯塔工厂战略对齐',
        description: '确认集团「灯塔工厂」战略的具体KPI指标、时间节点、以及对焊装车间智能化的具体要求',
        status: 'in_progress',
        priority: 'critical',
      },
      {
        stakeholderId: stakeholderMap['王建国'],
        needType: 'professional',
        title: '一线车间主任的实际操作需求',
        description: '了解王建国作为焊装车间主任对新设备的操作便利性、培训周期、以及与现有工人技能匹配度的具体需求',
        status: 'unmet',
        priority: 'important',
      },
    ];
    
    for (const need of needsToInsert) {
      if (!need.stakeholderId) {
        console.log(`Skipping need "${need.title}" - stakeholder not found`);
        continue;
      }
      await conn.query(
        `INSERT INTO stakeholderNeeds (dealId, tenantId, stakeholderId, needType, title, description, status, dimensionKey, priority, aiGenerated, sortOrder)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'need_discovery', ?, true, 0)`,
        [dealId, tenantId, need.stakeholderId, need.needType, need.title, need.description, need.status, need.priority]
      );
      console.log(`  Added need: ${need.title}`);
    }
  }
  
  // 4. Also update value_proposition to in_progress (they've done POC demos)
  const [vpResult] = await conn.query(
    "UPDATE dealDimensions SET status = 'in_progress' WHERE dealId = ? AND dimensionKey = 'value_proposition' AND status = 'not_started'",
    [dealId]
  );
  if (vpResult.affectedRows > 0) {
    console.log(`Updated value_proposition status to in_progress`);
  }
  
  // 5. Update commercial_close to in_progress (they have pricing discussions)
  const [ccResult] = await conn.query(
    "UPDATE dealDimensions SET status = 'in_progress' WHERE dealId = ? AND dimensionKey = 'commercial_close' AND status = 'not_started'",
    [dealId]
  );
  if (ccResult.affectedRows > 0) {
    console.log(`Updated commercial_close status to in_progress`);
  }
  
  // 6. Update relationship_penetration to in_progress
  const [rpResult] = await conn.query(
    "UPDATE dealDimensions SET status = 'in_progress' WHERE dealId = ? AND dimensionKey = 'relationship_penetration' AND status = 'not_started'",
    [dealId]
  );
  if (rpResult.affectedRows > 0) {
    console.log(`Updated relationship_penetration status to in_progress`);
  }
  
  console.log('\n=== Done ===');
  await conn.end();
}

main().catch(console.error);
