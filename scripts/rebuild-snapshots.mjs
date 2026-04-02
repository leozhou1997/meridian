/**
 * Rebuild snapshots for 包钢集团 and 江西铜业 deals
 * Each snapshot is grounded in real meetings with [ref:meetingId] source attribution
 * Run: node scripts/rebuild-snapshots.mjs
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

// ── Get deal and tenant info ──
const [deals] = await db.execute(`SELECT id, name, tenantId FROM deals WHERE id IN (210001, 210002)`);
if (deals.length === 0) {
  console.log('⚠️  Deals 210001/210002 not found.');
  process.exit(0);
}

const baotouDeal = deals.find(d => d.id === 210001);
const jiangxiDeal = deals.find(d => d.id === 210002);

if (!baotouDeal || !jiangxiDeal) {
  console.log('⚠️  Missing one of the two deals.');
  process.exit(0);
}

// ── Delete old snapshots for these deals ──
console.log('🗑️  Deleting old snapshots...');
await db.execute(`DELETE FROM snapshots WHERE dealId IN (210001, 210002)`);
console.log('✅ Old snapshots deleted.');

// ── Helper to insert snapshot ──
async function insertSnapshot(dealId, tenantId, data) {
  await db.execute(
    `INSERT INTO snapshots (dealId, tenantId, date, whatsHappening, keyRisks, whatsNext, confidenceScore, confidenceChange, interactionType, keyParticipant, aiGenerated, sourceEventIds)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dealId, tenantId, data.date,
      data.whatsHappening,
      JSON.stringify(data.keyRisks),
      JSON.stringify(data.whatsNext),
      data.confidenceScore,
      data.confidenceChange,
      data.interactionType,
      data.keyParticipant,
      true,
      JSON.stringify(data.sourceEventIds),
    ]
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 包钢集团 (210001) — 5 snapshots based on 7 meetings
// Meetings: 90001(Sep8微信), 90002(Sep8微信附件), 120001(Sep8微信),
//           90003(Sep12邮件), 90004(Sep16客户会议), 90005(Oct8邮件), 90006(Oct15评审会)
// ══════════════════════════════════════════════════════════════════════════════

const baotouTenantId = baotouDeal.tenantId;

// Snapshot 1: Sep 8 — Initial contact via WeChat
await insertSnapshot(210001, baotouTenantId, {
  date: new Date('2025-09-08'),
  confidenceScore: 35,
  confidenceChange: 0,
  interactionType: '微信联系',
  keyParticipant: '霍光',
  sourceEventIds: [90001, 90002, 120001],
  whatsHappening: '通过微信联系到包钢集团设备管理部霍光[ref:90001]，初步了解到白云鄂博铁矿二期扩容项目的设备需求。霍光回复确认了对无人矿卡系统的兴趣[ref:120001]，并分享了现场照片作为参考[ref:90002]。交易处于极早期阶段，尚未进入正式商务流程。',
  keyRisks: [
    {
      title: '决策链尚不明确',
      detail: '根据与霍光的微信沟通[ref:90001]，目前仅接触到设备管理部层面。尚不清楚采购决策链和审批流程，需要尽快了解谁是最终决策者以及预算审批机制。',
      stakeholders: ['霍光']
    },
    {
      title: '项目时间线不确定',
      detail: '霍光在微信中[ref:120001]提到二期扩容项目正在推进，但未给出明确的采购时间窗口。如果项目延期，整个交易节奏都会受影响。',
      stakeholders: ['霍光']
    }
  ],
  whatsNext: [
    {
      action: '约霍光进行正式技术沟通，了解一期系统现状和二期具体需求',
      rationale: '根据微信初步沟通[ref:90001]，霍光对我们的方案有兴趣但需要更深入的技术交流。需要了解一期系统的痛点和二期的具体技术要求。',
      suggestedContacts: [{ name: '肖亮', title: '技术工程师', reason: '霍光提到的技术对接人' }]
    },
    {
      action: '收集白云鄂博铁矿一期系统的运行数据和现场环境信息',
      rationale: '从霍光分享的现场照片[ref:90002]来看，矿区环境复杂。需要充分了解现场条件才能制定针对性方案。',
      suggestedContacts: []
    }
  ]
});

// Snapshot 2: Sep 12 — Email with technical proposal
await insertSnapshot(210001, baotouTenantId, {
  date: new Date('2025-09-12'),
  confidenceScore: 45,
  confidenceChange: 10,
  interactionType: '邮件沟通',
  keyParticipant: '霍光/肖亮',
  sourceEventIds: [90003],
  whatsHappening: '向霍光和肖亮发送了初步技术方案邮件[ref:90003]，包含无人矿卡系统的技术架构和适配方案。邮件中附带了类似矿区的成功案例作为参考。肖亮作为技术对接人首次进入沟通链路，表明客户内部已开始技术评估。',
  keyRisks: [
    {
      title: '技术适配存在不确定性',
      detail: '在发送技术方案[ref:90003]时，我们尚未获得一期系统的详细技术参数。如果一期系统存在兼容性问题，可能需要额外的适配开发，影响项目成本和时间。',
      stakeholders: ['肖亮', '霍光']
    },
    {
      title: '竞争对手可能同步接触',
      detail: '根据邮件沟通[ref:90003]的反馈节奏来看，客户可能在同时评估多家供应商。需要尽快建立技术差异化优势。',
      stakeholders: ['霍光']
    }
  ],
  whatsNext: [
    {
      action: '推动与霍光和肖亮的面对面技术沟通会议',
      rationale: '邮件方案[ref:90003]已发送，需要通过面对面会议深入讨论技术细节，了解客户的具体顾虑和一期系统的实际运行情况。',
      suggestedContacts: []
    },
    {
      action: '准备一期系统诊断方案，展示我们对现有系统的理解',
      rationale: '基于邮件沟通[ref:90003]中提到的技术架构，需要展示我们能够无缝对接一期系统的能力。',
      suggestedContacts: []
    }
  ]
});

// Snapshot 3: Sep 16 — Office meeting (Discovery Call)
await insertSnapshot(210001, baotouTenantId, {
  date: new Date('2025-09-16'),
  confidenceScore: 58,
  confidenceChange: 13,
  interactionType: '客户会议',
  keyParticipant: '霍光/肖亮',
  sourceEventIds: [90004],
  whatsHappening: '在霍光办公室进行了首次正式技术沟通[ref:90004]。会议中确认了一期系统存在信号延迟和覆盖盲区的问题，肖亮详细介绍了现场环境的技术挑战。霍光表达了对二期扩容的紧迫感，希望在年底前完成供应商选定。会议气氛积极，双方建立了初步信任。',
  keyRisks: [
    {
      title: '一期系统信号延迟问题需解决',
      detail: '根据与霍光和肖亮的技术沟通[ref:90004]，一期系统在矿区深处存在信号延迟和覆盖盲区。如果我们的方案不能有效解决这个问题，将直接影响客户对二期方案的信心。',
      stakeholders: ['肖亮', '霍光']
    },
    {
      title: '年底时间窗口紧迫',
      detail: '霍光在会议中[ref:90004]明确提到希望年底前完成供应商选定。这意味着我们需要在2-3个月内完成技术验证和商务谈判，时间非常紧张。',
      stakeholders: ['霍光']
    },
    {
      title: '采购决策层尚未接触',
      detail: '会议[ref:90004]中霍光提到最终采购需要经过采购部审批，但我们尚未接触到采购部的关键人物。需要尽快打通采购决策链。',
      stakeholders: ['霍光']
    }
  ],
  whatsNext: [
    {
      action: '制定针对信号延迟问题的专项技术方案',
      rationale: '根据会议[ref:90004]中肖亮描述的一期系统痛点，信号延迟是客户最关心的技术问题。解决这个问题将大幅提升我们的竞争力。',
      suggestedContacts: []
    },
    {
      action: '通过霍光引荐采购部关键决策人',
      rationale: '会议[ref:90004]中霍光提到采购部审批流程，需要尽早接触采购部负责人，了解预算和审批要求。',
      suggestedContacts: [{ name: '张建平', title: '采购部负责人', reason: '霍光会议中提到的采购审批关键人' }]
    }
  ]
});

// Snapshot 4: Oct 8 — Formal proposal email
await insertSnapshot(210001, baotouTenantId, {
  date: new Date('2025-10-08'),
  confidenceScore: 68,
  confidenceChange: 10,
  interactionType: '正式方案提交',
  keyParticipant: '霍光/肖亮/张建平',
  sourceEventIds: [90005],
  whatsHappening: '向包钢集团提交了正式的技术方案和商务报价[ref:90005]。方案中针对一期信号延迟问题提出了专项解决方案，并包含了二期扩容的完整实施计划。张建平作为采购部代表首次出现在邮件收件人中，表明交易已进入正式采购评估阶段。',
  keyRisks: [
    {
      title: '报价可能面临压价',
      detail: '在正式方案邮件[ref:90005]中，张建平被加入了沟通链路。作为采购部负责人，他的介入通常意味着将进入价格谈判阶段。需要准备好价格策略和让步空间。',
      stakeholders: ['张建平']
    },
    {
      title: '技术方案需要现场验证',
      detail: '根据方案提交[ref:90005]的反馈，客户可能要求进行现场POC验证。需要提前准备POC方案和资源调配计划。',
      stakeholders: ['肖亮', '霍光']
    }
  ],
  whatsNext: [
    {
      action: '跟进张建平对报价的反馈，准备价格谈判策略',
      rationale: '正式方案[ref:90005]已提交，张建平作为采购部代表将主导价格评估。需要了解他的预算范围和决策标准。',
      suggestedContacts: []
    },
    {
      action: '推动安排正式方案评审会，争取高层参与',
      rationale: '基于方案提交[ref:90005]的进展，需要一次正式的方案评审会来推动决策。争取让更高层级的领导参与评审。',
      suggestedContacts: [{ name: '杨楠', title: '高层领导', reason: '推动最终决策需要高层支持' }]
    }
  ]
});

// Snapshot 5: Oct 15 — Executive Briefing
await insertSnapshot(210001, baotouTenantId, {
  date: new Date('2025-10-15'),
  confidenceScore: 75,
  confidenceChange: 7,
  interactionType: '正式方案评审会',
  keyParticipant: '杨楠/霍光/肖亮/张建平/隋少龙',
  sourceEventIds: [90006],
  whatsHappening: '召开了正式方案评审会[ref:90006]，包钢集团多位关键决策者出席：杨楠（高层领导）、霍光、肖亮、张建平（采购部）、隋少龙。会议中我方详细介绍了技术方案和实施计划，杨楠对方案表示认可。张建平对报价提出了异议，要求进一步优化价格。会议决定进入最终谈判阶段。',
  keyRisks: [
    {
      title: '价格谈判是最后障碍',
      detail: '在方案评审会[ref:90006]中，张建平明确对报价提出异议，要求进一步优化。这是交易推进的最大障碍，需要制定灵活的价格策略来应对。',
      stakeholders: ['张建平']
    },
    {
      title: '竞争对手可能在最后阶段发力',
      detail: '评审会[ref:90006]中隋少龙的出席表明客户对此项目高度重视。高关注度项目通常会有多家供应商竞争，需要警惕竞争对手在最后阶段的价格战。',
      stakeholders: ['隋少龙', '张建平']
    }
  ],
  whatsNext: [
    {
      action: '制定维保捆绑方案，回应张建平的价格诉求',
      rationale: '根据评审会[ref:90006]中张建平的反馈，直接降价不是最优策略。提出将首年驻场维保纳入合同的捆绑方案，既能回应价格诉求又能保护利润。',
      suggestedContacts: []
    },
    {
      action: '与杨楠建立直接沟通渠道，巩固高层支持',
      rationale: '评审会[ref:90006]中杨楠对方案表示认可，这是重要的高层支持信号。需要在最终谈判前巩固这个支持，避免被价格谈判拖入被动。',
      suggestedContacts: []
    },
    {
      action: '确保与无人矿卡供应商进行联合调试准备',
      rationale: '评审会[ref:90006]中讨论了实施计划，联合调试是客户关注的关键环节。提前准备可以展示我们的执行力。',
      suggestedContacts: []
    }
  ]
});

console.log('✅ 包钢集团: 5 snapshots created');

// ══════════════════════════════════════════════════════════════════════════════
// 江西铜业 (210002) — 5 snapshots based on 6 meetings
// Meetings: 90007(Aug10邮件), 90008(Sep20 POC), 90009(Sep25微信张伟),
//           90010(Sep25微信胥明日), 90011(Nov5验收), 90012(Nov12邮件)
// ══════════════════════════════════════════════════════════════════════════════

const jiangxiTenantId = jiangxiDeal.tenantId;

// Snapshot 1: Aug 10 — Email contact with 徐工 王强
await insertSnapshot(210002, jiangxiTenantId, {
  date: new Date('2025-08-10'),
  confidenceScore: 30,
  confidenceChange: 0,
  interactionType: '邮件沟通',
  keyParticipant: '王强',
  sourceEventIds: [90007],
  whatsHappening: '通过邮件联系徐工集团王强[ref:90007]，讨论了与江西铜业城门山铜矿OEM联合打单的策略。王强确认了徐工在该项目中的设备供应角色，并表示愿意配合我方的智能化方案进行联合推广。交易处于早期策略规划阶段。',
  keyRisks: [
    {
      title: '联合打单模式存在协调风险',
      detail: '根据与王强的邮件沟通[ref:90007]，联合打单需要徐工和我方在技术方案、商务条款上保持一致。如果双方利益诉求不同，可能影响联合推进效率。',
      stakeholders: ['王强']
    },
    {
      title: '终端客户关系尚未建立',
      detail: '目前仅通过徐工王强[ref:90007]间接了解江西铜业的需求，尚未直接接触终端客户的关键决策者。需要尽快建立直接沟通渠道。',
      stakeholders: ['王强']
    }
  ],
  whatsNext: [
    {
      action: '与王强共同制定联合方案，明确双方分工和利益分配',
      rationale: '根据邮件沟通[ref:90007]，王强已表示合作意愿，需要尽快落实具体的联合方案框架和商务条款。',
      suggestedContacts: [{ name: '赵桂洪', title: '江西铜业项目负责人', reason: '王强提到的终端客户关键联系人' }]
    },
    {
      action: '准备城门山铜矿的现场环境调研方案',
      rationale: '基于王强邮件[ref:90007]中描述的项目背景，需要了解矿区的实际环境条件来制定针对性方案。',
      suggestedContacts: []
    }
  ]
});

// Snapshot 2: Sep 20 — POC kickoff meeting
await insertSnapshot(210002, jiangxiTenantId, {
  date: new Date('2025-09-20'),
  confidenceScore: 48,
  confidenceChange: 18,
  interactionType: 'POC启动会',
  keyParticipant: '赵桂洪/王强/胥明日/张伟',
  sourceEventIds: [90008],
  whatsHappening: '在城门山铜矿现场召开了POC启动会[ref:90008]，江西铜业赵桂洪、徐工王强、以及现场技术人员胥明日和张伟均出席。会议确定了POC的测试范围、时间表和验收标准。赵桂洪对智能化方案表现出较高期待，但也提出了对现场复杂环境的担忧。',
  keyRisks: [
    {
      title: '现场环境复杂度超预期',
      detail: '根据POC启动会[ref:90008]中赵桂洪和张伟的反馈，城门山铜矿的地形和气候条件比预期更复杂，可能影响设备的稳定运行和信号传输。',
      stakeholders: ['赵桂洪', '张伟']
    },
    {
      title: 'POC时间窗口有限',
      detail: '启动会[ref:90008]中确定的POC周期较短，如果遇到技术问题需要快速响应，否则可能影响整体评估结果。',
      stakeholders: ['赵桂洪', '胥明日']
    }
  ],
  whatsNext: [
    {
      action: '部署POC设备并确保现场技术支持到位',
      rationale: '根据启动会[ref:90008]确定的时间表，需要尽快完成设备部署。张伟和胥明日将是现场主要对接人。',
      suggestedContacts: []
    },
    {
      action: '建立与赵桂洪的定期沟通机制，及时汇报POC进展',
      rationale: '启动会[ref:90008]中赵桂洪表现出对项目的高度关注，定期汇报可以维持他的信心和支持。',
      suggestedContacts: []
    }
  ]
});

// Snapshot 3: Sep 25 — WeChat field resistance issue
await insertSnapshot(210002, jiangxiTenantId, {
  date: new Date('2025-09-25'),
  confidenceScore: 42,
  confidenceChange: -6,
  interactionType: '微信沟通',
  keyParticipant: '张伟/胥明日',
  sourceEventIds: [90009, 90010],
  whatsHappening: '收到张伟微信反馈[ref:90009]，POC现场遇到操作人员抵触情绪，部分老矿工对智能化系统持怀疑态度，担心影响工作效率和岗位安全。随后胥明日在微信中[ref:90010]提出了应对建议，建议安排现场培训和渐进式导入策略来化解阻力。',
  keyRisks: [
    {
      title: '一线操作人员抵触影响POC效果',
      detail: '根据张伟的微信反馈[ref:90009]，现场操作人员对新系统存在明显抵触情绪。如果不及时化解，可能导致POC数据不真实，影响最终评估结果。',
      stakeholders: ['张伟']
    },
    {
      title: '变革管理成为隐性风险',
      detail: '张伟反馈的现场阻力[ref:90009]和胥明日的应对建议[ref:90010]表明，技术方案之外还需要解决人员适应问题。这可能增加项目实施的复杂度和成本。',
      stakeholders: ['张伟', '胥明日']
    }
  ],
  whatsNext: [
    {
      action: '安排现场操作培训，重点消除操作人员的顾虑',
      rationale: '根据张伟反馈[ref:90009]和胥明日建议[ref:90010]，需要通过实际操作演示来证明系统不会取代人工，而是辅助提升效率。',
      suggestedContacts: []
    },
    {
      action: '向赵桂洪汇报现场情况并提出渐进式导入方案',
      rationale: '现场阻力[ref:90009]需要管理层知悉并支持。赵桂洪的支持对于推动变革管理至关重要。',
      suggestedContacts: []
    }
  ]
});

// Snapshot 4: Nov 5 — POC final review
await insertSnapshot(210002, jiangxiTenantId, {
  date: new Date('2025-11-05'),
  confidenceScore: 62,
  confidenceChange: 20,
  interactionType: 'POC验收评审',
  keyParticipant: '赵桂洪/陈师傅/王强/胥明日/张伟',
  sourceEventIds: [90011],
  whatsHappening: '召开POC最终验收评审会[ref:90011]，赵桂洪、陈师傅（一线操作代表）、王强、胥明日和张伟全部出席。POC数据显示系统运行稳定，效率提升约15%。陈师傅从最初的抵触转为认可，现场演示获得了一线人员的积极反馈。赵桂洪对结果表示满意，提出希望尽快推进正式采购流程。',
  keyRisks: [
    {
      title: '从POC到正式采购的流程可能漫长',
      detail: '验收评审[ref:90011]中赵桂洪虽然表示满意，但正式采购需要经过集团层面的审批流程。国企采购流程通常较长，需要提前做好准备。',
      stakeholders: ['赵桂洪']
    },
    {
      title: '联合方案的商务条款需要最终确认',
      detail: '评审会[ref:90011]中王强提到联合投标的具体条款还需要双方确认。如果商务条款谈判拖延，可能影响整体进度。',
      stakeholders: ['王强', '赵桂洪']
    }
  ],
  whatsNext: [
    {
      action: '与王强确认联合投标方案的最终商务条款',
      rationale: '根据评审会[ref:90011]的讨论，联合投标是推进正式采购的关键步骤。需要尽快与王强敲定双方的分工和利益分配。',
      suggestedContacts: []
    },
    {
      action: '整理POC验收报告，为正式采购审批提供支撑材料',
      rationale: '评审会[ref:90011]的积极结果需要形成正式文档，作为赵桂洪向集团申请采购预算的依据。',
      suggestedContacts: []
    }
  ]
});

// Snapshot 5: Nov 12 — Joint bid email
await insertSnapshot(210002, jiangxiTenantId, {
  date: new Date('2025-11-12'),
  confidenceScore: 65,
  confidenceChange: 3,
  interactionType: '联合投标',
  keyParticipant: '王强',
  sourceEventIds: [90012],
  whatsHappening: '与徐工王强通过邮件[ref:90012]完成了联合投标书的最终版本确认。投标书包含了完整的技术方案、POC验收数据和商务报价。王强确认徐工方面已完成内部审批，可以正式提交。交易进入等待客户采购流程的阶段。',
  keyRisks: [
    {
      title: '客户采购审批周期不可控',
      detail: '联合投标书[ref:90012]已准备就绪，但江西铜业作为国企，内部采购审批流程可能需要数周甚至数月。这段时间内竞争对手可能发起新的攻势。',
      stakeholders: ['王强']
    },
    {
      title: '投标价格竞争力需要持续关注',
      detail: '根据与王强的邮件沟通[ref:90012]，联合投标的价格策略需要在竞争力和利润之间取得平衡。如果竞争对手大幅降价，可能需要调整策略。',
      stakeholders: ['王强']
    }
  ],
  whatsNext: [
    {
      action: '通过赵桂洪了解采购审批的进展和时间预期',
      rationale: '投标书[ref:90012]已提交，需要保持与终端客户的沟通，及时了解审批进展和可能的变数。',
      suggestedContacts: []
    },
    {
      action: '准备应对可能的价格谈判或技术答疑',
      rationale: '根据投标提交[ref:90012]后的常规流程，客户可能会要求进一步的技术澄清或价格协商。需要提前准备应对方案。',
      suggestedContacts: []
    }
  ]
});

console.log('✅ 江西铜业: 5 snapshots created');

await db.end();
console.log('🎉 All snapshots rebuilt with source attribution!');
