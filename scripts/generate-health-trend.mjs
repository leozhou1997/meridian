import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Deal 210001: 包钢集团 - starts at 45 (discovery), rises through POC success, dips on pricing concerns, recovers to 75
const baogang = {
  dealId: 210001,
  tenantId: 150001,
  timeline: [
    { date: '2025-07-15', score: 42, change: 0, happening: '初次接触白云鄂博铁矿，了解到一期自动驾驶项目已运行两年。矿长杨楠对安全性要求极高，但对技术升级持开放态度。', type: 'Discovery Call' },
    { date: '2025-08-01', score: 48, change: 6, happening: '与设备部霍光进行技术预沟通，确认一期系统存在极寒天气下的信号延迟问题。客户对升级方案有明确需求。', type: 'Technical Discussion' },
    { date: '2025-08-20', score: 55, change: 7, happening: '提交初步技术方案，包含边缘网关升级和10Hz数据更新率。肖亮（无人驾驶项目组）对技术方案表示认可。', type: 'Proposal' },
    { date: '2025-09-10', score: 52, change: -3, happening: '采购部张建平介入，对报价提出异议，要求下调15%并提供首年免费驻场维保。内部出现价格压力。', type: 'Negotiation' },
    { date: '2025-09-25', score: 58, change: 6, happening: '安排CEO隋少龙参观一期项目现场，展示夜班88%效率提升和连续3年零安全事故记录。高层认可度提升。', type: 'Executive Briefing' },
    { date: '2025-10-05', score: 63, change: 5, happening: '通过微信与杨楠沟通，确认"包钢的底线是安全"，只要系统能保证极寒天气下零故障率，价格可以再谈。关键决策标准明确。', type: 'WeChat' },
    { date: '2025-10-15', score: 70, change: 7, happening: '正式方案评审会召开，肖亮确认技术方案可行性，杨楠表态支持。但张建平仍坚持价格下调要求。', type: 'Executive Briefing' },
    { date: '2025-10-20', score: 75, change: 5, happening: '内部策略调整：提出维保捆绑方案，将首年驻场维保纳入合同，有效回应了张建平的价格诉求。交易进入最终谈判阶段。', type: 'Internal Strategy' },
  ]
};

// Deal 210002: 江西铜业 - more volatile, starts lower, has a significant dip, recovers
const jiangxi = {
  dealId: 210002,
  tenantId: 150001,
  timeline: [
    { date: '2025-08-10', score: 35, change: 0, happening: '通过OEM合作伙伴引荐接触城门山铜矿。矿山环境复杂，露天+地下混合作业，技术挑战大。', type: 'Discovery Call' },
    { date: '2025-08-28', score: 42, change: 7, happening: '与技术负责人进行首次深度技术交流，确认现有系统在地下矿道信号覆盖不足。客户对解决方案有紧迫需求。', type: 'Technical Discussion' },
    { date: '2025-09-15', score: 50, change: 8, happening: '提交联合方案（OEM硬件+我方软件平台），客户对整合方案表示兴趣。预算审批流程启动。', type: 'Proposal' },
    { date: '2025-09-30', score: 44, change: -6, happening: '竞争对手（某国内厂商）提交了更低价格的方案。客户内部出现分歧，部分人倾向低价方案。', type: 'Competitive Intel' },
    { date: '2025-10-12', score: 52, change: 8, happening: '安排客户参观包钢一期项目（经杨楠同意），展示实际运行效果。客户技术团队被说服，但采购仍在比价。', type: 'Site Visit' },
    { date: '2025-10-25', score: 58, change: 6, happening: '通过邮件发送详细的TCO对比分析，证明虽然初始投入高10%，但3年总成本低22%。采购部开始重新评估。', type: 'Email' },
    { date: '2025-11-05', score: 65, change: 7, happening: 'OEM合作伙伴高层出面背书，承诺联合售后服务。客户决策层倾向我方方案，进入最终商务谈判。', type: 'Executive Briefing' },
  ]
};

// First, delete existing snapshots for these deals (keep only the ones we're creating)
const existingIds = await conn.query('SELECT id FROM snapshots WHERE dealId IN (210001, 210002)');
if (existingIds[0].length > 0) {
  await conn.query('DELETE FROM snapshots WHERE dealId IN (210001, 210002)');
  console.log(`Deleted ${existingIds[0].length} existing snapshots`);
}

// Insert new snapshots
for (const deal of [baogang, jiangxi]) {
  for (const point of deal.timeline) {
    await conn.query(
      'INSERT INTO snapshots (dealId, tenantId, date, confidenceScore, confidenceChange, whatsHappening, interactionType, aiGenerated, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [deal.dealId, deal.tenantId, new Date(point.date), point.score, point.change, point.happening, point.type, true, new Date(point.date)]
    );
    console.log(`  ${deal.dealId}: ${point.date} → ${point.score}% (${point.change >= 0 ? '+' : ''}${point.change})`);
  }
}

// Also update the deals table with the latest confidence score
await conn.query('UPDATE deals SET confidenceScore = 75 WHERE id = 210001');
await conn.query('UPDATE deals SET confidenceScore = 65 WHERE id = 210002');

console.log('\nDone! Health trend data generated.');
await conn.end();
