import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const CDN_BASE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw';

// Mapping: meetingId -> { type, attachmentUrl }
// Based on README_AGENT_PROMPT.md touchpoint mapping
const updates = [
  // Deal 1 (包钢集团, dealId=210001): meetings 90001-90006
  // 90001 = TP1 CRM record (no screenshot)
  // 90002 = TP2+TP3 WeChat (李明→霍光, then 霍光→李明 reply) - date 2025-09-08
  {
    id: 90002,
    type: 'WeChat',
    attachmentUrl: `${CDN_BASE}/deal1_tp2_wechat_liming_to_huoguang_4c0526a5.png`,
    summary: '【微信 李明→霍光】\n销售主动联系客户设备部副部长，以一期运行数据为由头，试探二期扩容意向，约线下拜访。\n\n霍光回复确认会面，并透露关键信息：无人驾驶项目组要求系统必须与调度系统打通。',
  },
  // Insert a new meeting for TP3 (霍光 reply) with its own screenshot
  {
    insert: true,
    dealId: 210001,
    tenantId: 150001,
    date: '2025-09-08 15:15:00',
    type: 'WeChat',
    keyParticipant: '霍光, 李明',
    summary: '【微信 霍光→李明】\n客户回复确认会面，并透露关键信息：无人驾驶项目组要求系统必须与调度系统打通。这是一个重要的技术需求信号。',
    attachmentUrl: `${CDN_BASE}/deal1_tp3_wechat_huoguang_reply_bd35ba25.png`,
  },
  // 90003 = TP5 Email (李明→霍光, 肖亮) - tech proposal
  {
    id: 90003,
    type: 'Email',
    attachmentUrl: `${CDN_BASE}/deal1_tp5_email_liming_tech_proposal_9b038cda.png`,
  },
  // 90004 = TP6 meeting (keep as Discovery Call, no screenshot)
  // 90005 = TP7 Email (formal proposal)
  {
    id: 90005,
    type: 'Email',
    attachmentUrl: `${CDN_BASE}/deal1_tp7_email_liming_formal_proposal_5eb3865d.png`,
  },
  // 90006 = TP8 Executive Briefing (no screenshot, it's a meeting)

  // Deal 2 (江西铜业, dealId=210002): meetings 90007-90012
  // 90007 = TP2 Email (胥明日→王强)
  {
    id: 90007,
    type: 'Email',
    attachmentUrl: `${CDN_BASE}/deal2_tp2_email_xumingri_to_wangqiang_a0f6c40b.png`,
  },
  // 90008 = TP3 POC meeting (no screenshot)
  // 90009 = TP5 WeChat (张伟→胥明日 alert)
  {
    id: 90009,
    type: 'WeChat',
    attachmentUrl: `${CDN_BASE}/deal2_tp5_wechat_zhangwei_alert_b1b1ded6.png`,
  },
  // 90010 = TP6 WeChat (胥明日→张伟 reply)
  {
    id: 90010,
    type: 'WeChat',
    attachmentUrl: `${CDN_BASE}/deal2_tp6_wechat_xumingri_reply_d41c656a.png`,
  },
  // 90011 = TP7 POC validation meeting (no screenshot)
  // 90012 = TP9 Email (joint bid)
  {
    id: 90012,
    type: 'Email',
    attachmentUrl: `${CDN_BASE}/deal2_tp9_email_xumingri_joint_bid_e725fdfa.png`,
  },

  // Deal 3 (住友商事, dealId=210003): meetings 90013-90017
  // 90013 = TP1 Email (佐藤→隋少龙 inquiry)
  {
    id: 90013,
    type: 'Email',
    attachmentUrl: `${CDN_BASE}/deal3_tp1_email_sato_inquiry_8d969218.png`,
  },
  // 90014 = TP4 Email (赵宇→佐藤 shipment)
  {
    id: 90014,
    type: 'Email',
    attachmentUrl: `${CDN_BASE}/deal3_tp4_email_zhaoyu_shipment_ea6ef599.png`,
  },
  // 90015 = TP5 Executive Briefing (no screenshot, it's a meeting)
  // 90016 = TP8 Email (赵宇→佐藤 patch)
  {
    id: 90016,
    type: 'Email',
    attachmentUrl: `${CDN_BASE}/deal3_tp8_email_zhaoyu_patch_30fc8c2d.png`,
  },
  // 90017 = TP9 WeChat/Line (佐藤→赵宇 feedback)
  {
    id: 90017,
    type: 'WeChat',
    attachmentUrl: `${CDN_BASE}/deal3_tp9_wechat_sato_feedback_58c26a1a.png`,
  },
];

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  for (const u of updates) {
    if (u.insert) {
      // Insert new meeting
      await conn.execute(
        'INSERT INTO meetings (dealId, tenantId, date, type, keyParticipant, summary, attachmentUrl, duration) VALUES (?, ?, ?, ?, ?, ?, ?, 5)',
        [u.dealId, u.tenantId, u.date, u.type, u.keyParticipant, u.summary, u.attachmentUrl]
      );
      console.log(`✅ Inserted new ${u.type} meeting for deal ${u.dealId}`);
    } else if (u.summary) {
      // Update type, attachmentUrl, and summary
      await conn.execute(
        'UPDATE meetings SET type = ?, attachmentUrl = ?, summary = ? WHERE id = ?',
        [u.type, u.attachmentUrl, u.summary, u.id]
      );
      console.log(`✅ Updated meeting ${u.id}: type=${u.type}, attachmentUrl set, summary updated`);
    } else {
      // Update type and attachmentUrl only
      await conn.execute(
        'UPDATE meetings SET type = ?, attachmentUrl = ? WHERE id = ?',
        [u.type, u.attachmentUrl, u.id]
      );
      console.log(`✅ Updated meeting ${u.id}: type=${u.type}, attachmentUrl set`);
    }
  }

  console.log('\n🎉 All screenshot updates complete!');
  await conn.end();
}

run().catch(console.error);
