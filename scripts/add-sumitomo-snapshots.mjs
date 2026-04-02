import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Sumitomo meetings:
// 90013: Email, 2024-02-15 - initial outreach
// 90014: Email, 2024-03-10 - follow-up
// 90015: Executive Briefing, 2024-12-10 - formal meeting
// 90016: Email, 2024-12-17 - post-meeting follow-up
// 90017: WeChat, 2024-12-20 - informal chat

// Get meeting summaries for context
const [meetings] = await conn.query(
  'SELECT id, type, date, summary, keyParticipant FROM meetings WHERE dealId = 210003 ORDER BY date'
);
console.log('Sumitomo meetings:');
meetings.forEach(m => console.log(`  ${m.id}: ${m.type} on ${m.date} - ${m.keyParticipant}`));

// Delete any existing Sumitomo snapshots
await conn.query('DELETE FROM snapshots WHERE dealId = 210003');
console.log('Deleted existing Sumitomo snapshots');

const dealId = 210003;
const tenantId = 1;

// Snapshot 1: After initial email outreach (Feb 2024)
await conn.query(
  `INSERT INTO snapshots (dealId, tenantId, date, confidenceScore, confidenceChange, whatsHappening, keyRisks, whatsNext, interactionType, sourceEventIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    dealId, tenantId,
    new Date('2024-02-16T10:00:00Z'),
    30, 0,
    '通过邮件向住友商事运输与建设系统事业部发起初步接触[ref:90013]，介绍了我方在海外矿山自动化领域的解决方案。目前处于极早期阶段，尚未确认对方的具体需求和采购意向。',
    JSON.stringify([
      { title: '日方决策流程复杂', detail: '住友商事作为日本综合商社，内部决策链条长，审批流程严格。根据初次邮件沟通[ref:90013]，预计需要经过多层审批才能进入正式评估阶段。', stakeholders: ['樽見雅幸'] },
      { title: '跨国合作存在文化差异', detail: '中日商务合作在沟通方式、合同条款、技术标准等方面存在差异，需要提前做好准备。', stakeholders: [] }
    ]),
    JSON.stringify([
      { action: '准备日语版本的公司介绍和技术方案概要', rationale: '根据初次邮件接触[ref:90013]，对方为日本企业，提供日语材料能显著提升专业度和沟通效率。' },
      { action: '研究住友商事在海外矿山项目中的布局和需求', rationale: '了解对方业务背景有助于在后续沟通中精准定位我方方案的价值。' }
    ]),
    '邮件沟通',
    JSON.stringify([90013])
  ]
);
console.log('Created snapshot 1 (Feb 2024)');

// Snapshot 2: After follow-up email (Mar 2024)
await conn.query(
  `INSERT INTO snapshots (dealId, tenantId, date, confidenceScore, confidenceChange, whatsHappening, keyRisks, whatsNext, interactionType, sourceEventIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    dealId, tenantId,
    new Date('2024-03-11T10:00:00Z'),
    40, 10,
    '收到住友商事方面的回复邮件[ref:90014]，对方表达了对我方矿山自动化方案的初步兴趣，特别是在南美和东南亚矿山项目中的应用场景。樽見雅幸（运输与建设系统事业部门长）已被确认为主要对接人。',
    JSON.stringify([
      { title: '竞争对手已有合作基础', detail: '根据邮件沟通[ref:90014]了解到，住友商事在部分海外矿山项目中已与日本本土供应商有合作关系，我方需要展示差异化优势。', stakeholders: ['樽見雅幸'] },
      { title: '项目时间线不明确', detail: '对方尚未给出明确的项目时间表，可能处于前期调研阶段。', stakeholders: [] }
    ]),
    JSON.stringify([
      { action: '安排与樽見雅幸的视频会议，深入了解具体项目需求', rationale: '根据邮件回复[ref:90014]，对方已表达兴趣，应尽快推进到面对面沟通阶段。' },
      { action: '准备针对南美和东南亚矿山场景的案例材料', rationale: '对方在邮件[ref:90014]中特别提到了这两个区域的项目，需要针对性准备。' }
    ]),
    '邮件跟进',
    JSON.stringify([90013, 90014])
  ]
);
console.log('Created snapshot 2 (Mar 2024)');

// Snapshot 3: After executive briefing (Dec 2024)
await conn.query(
  `INSERT INTO snapshots (dealId, tenantId, date, confidenceScore, confidenceChange, whatsHappening, keyRisks, whatsNext, interactionType, sourceEventIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    dealId, tenantId,
    new Date('2024-12-11T10:00:00Z'),
    60, 20,
    '在东京举行了正式的高管会议[ref:90015]，我方向住友商事高层详细介绍了矿山自动化解决方案。樽見雅幸全程参与并表现出浓厚兴趣，会议中讨论了独家代理合作模式的可能性。对方提出希望先在一个试点项目中验证方案效果。',
    JSON.stringify([
      { title: '独家代理条款谈判复杂', detail: '在高管会议[ref:90015]中，双方就独家代理的地域范围和期限存在分歧。住友商事希望获得更广泛的独家代理权，而我方需要平衡其他渠道的发展。', stakeholders: ['樽見雅幸'] },
      { title: '试点项目选择存在不确定性', detail: '会议[ref:90015]中讨论了多个潜在试点项目，但尚未确定具体选择哪一个，这可能影响合作推进速度。', stakeholders: ['樽見雅幸'] }
    ]),
    JSON.stringify([
      { action: '起草独家代理合作框架协议初稿', rationale: '根据高管会议[ref:90015]的讨论结果，双方已就合作模式达成初步共识，需要尽快形成书面文件推进谈判。' },
      { action: '提供2-3个适合作为试点的项目方案供对方选择', rationale: '会议[ref:90015]中对方明确提出试点需求，主动提供选项能加速决策进程。' }
    ]),
    '高管会议',
    JSON.stringify([90013, 90014, 90015])
  ]
);
console.log('Created snapshot 3 (Dec 2024 - after executive briefing)');

// Snapshot 4: After post-meeting email follow-up (Dec 17)
await conn.query(
  `INSERT INTO snapshots (dealId, tenantId, date, confidenceScore, confidenceChange, whatsHappening, keyRisks, whatsNext, interactionType, sourceEventIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    dealId, tenantId,
    new Date('2024-12-18T10:00:00Z'),
    65, 5,
    '会后通过邮件[ref:90016]与樽見雅幸确认了高管会议[ref:90015]的关键决议事项。对方正式确认将推动内部审批流程，预计在2025年Q1完成内部评估。同时对方要求我方提供详细的技术规格文档和过往项目的性能数据。',
    JSON.stringify([
      { title: '内部审批周期可能较长', detail: '根据会后邮件[ref:90016]，住友商事需要经过内部审批流程，日本企业的稟议制度通常需要数周到数月时间。', stakeholders: ['樽見雅幸'] },
      { title: '技术文档要求严格', detail: '对方在邮件[ref:90016]中要求提供详细技术规格和性能数据，日方对技术文档的严谨度要求很高，需要认真准备。', stakeholders: [] }
    ]),
    JSON.stringify([
      { action: '准备完整的技术规格文档（含日语翻译）', rationale: '对方在邮件[ref:90016]中明确要求提供详细技术规格，这是推进内部审批的必要材料。' },
      { action: '整理过往项目的性能数据和客户证言', rationale: '邮件[ref:90016]中特别提到需要性能数据来支持内部评估，实际案例数据最具说服力。' }
    ]),
    '邮件跟进',
    JSON.stringify([90015, 90016])
  ]
);
console.log('Created snapshot 4 (Dec 17 - post-meeting follow-up)');

// Snapshot 5: After WeChat chat (Dec 20) - latest
await conn.query(
  `INSERT INTO snapshots (dealId, tenantId, date, confidenceScore, confidenceChange, whatsHappening, keyRisks, whatsNext, interactionType, sourceEventIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    dealId, tenantId,
    new Date('2024-12-21T10:00:00Z'),
    70, 5,
    '通过微信与樽見雅幸进行了非正式沟通[ref:90017]，了解到住友商事内部对合作持积极态度。樽見雅幸透露公司正在评估在智利铜矿项目中引入自动化方案的可能性，这可能成为首个试点项目。对方还提到竞争对手小松也在接触中，但我方在性价比方面有优势。',
    JSON.stringify([
      { title: '小松作为竞争对手正在积极接触', detail: '根据微信沟通[ref:90017]，樽見雅幸提到小松也在与住友商事接触，作为日本本土企业，小松在关系网络上可能有天然优势。', stakeholders: ['樽見雅幸'] },
      { title: '试点项目地点在智利，执行难度较大', detail: '微信沟通[ref:90017]中提到的智利铜矿项目距离远、环境复杂，试点执行的后勤保障和技术支持需要提前规划。', stakeholders: [] }
    ]),
    JSON.stringify([
      { action: '准备针对智利铜矿场景的定制化方案', rationale: '根据微信沟通[ref:90017]，智利铜矿项目最有可能成为试点，提前准备定制方案能抢占先机。' },
      { action: '制定与小松的差异化竞争策略', rationale: '微信沟通[ref:90017]确认小松是主要竞争对手，需要明确我方在性价比、技术灵活性等方面的差异化优势。' },
      { action: '安排年后首次正式商务拜访，推动合同谈判', rationale: '综合高管会议[ref:90015]和后续沟通[ref:90016][ref:90017]的进展，双方已建立良好基础，应在Q1推动实质性谈判。' }
    ]),
    '微信沟通',
    JSON.stringify([90015, 90016, 90017])
  ]
);
console.log('Created snapshot 5 (Dec 20 - latest)');

// Update the deal's confidence score to match latest snapshot
await conn.query('UPDATE deals SET confidenceScore = 70 WHERE id = 210003');
console.log('Updated Sumitomo deal confidence to 70%');

await conn.end();
console.log('\nDone! Created 5 snapshots for Sumitomo Corporation');
