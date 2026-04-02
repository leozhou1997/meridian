import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ─── 包钢集团 (Deal 210001) ─────────────────────────────────────────────
const baogangSnapshots = [
  {
    date: '2025-07-15',
    keyRisks: [
      { title: '客户安全标准极高', detail: '矿长杨楠明确"包钢的底线是安全"，任何系统故障都可能导致项目终止。需要在极寒(-40°C)环境下保证零故障率。', stakeholders: ['杨楠'] },
      { title: '一期系统已运行两年', detail: '客户已有自动驾驶系统运行经验，对技术升级的期望值很高，简单的迭代方案难以打动。', stakeholders: [] },
    ],
    whatsNext: [
      { action: '安排与设备部霍光的技术预沟通，了解一期系统的具体痛点', rationale: '霍光是技术评估的关键人物，需要先建立技术层面的信任，为后续方案设计提供依据。', suggestedContacts: [] },
      { action: '收集一期项目的运行数据（效率、安全记录），作为二期方案的基准参考', rationale: '用客户自己的数据说话，比外部案例更有说服力。', suggestedContacts: [] },
    ],
  },
  {
    date: '2025-08-01',
    keyRisks: [
      { title: '极寒天气信号延迟问题', detail: '一期系统在-40°C环境下存在信号延迟，这是客户最关心的技术痛点。如果我们的方案不能解决这个问题，将失去竞争力。', stakeholders: ['霍光'] },
      { title: '技术方案需要差异化', detail: '客户已有一期经验，对技术细节非常了解。方案必须在数据更新率和边缘计算方面有明显优势。', stakeholders: ['霍光'] },
    ],
    whatsNext: [
      { action: '准备包含边缘网关升级方案的技术白皮书，重点解决信号延迟问题', rationale: '霍光已确认信号延迟是核心痛点，需要用技术方案直接回应。', suggestedContacts: [] },
      { action: '联系肖亮（无人驾驶项目组）了解项目组对二期的具体期望', rationale: '肖亮是项目执行层的关键人物，他的认可将直接影响技术评审结果。', suggestedContacts: [{ name: '肖亮', title: '无人驾驶项目组负责人', reason: '项目执行层关键决策者，对技术方案有直接话语权' }] },
    ],
  },
  {
    date: '2025-08-20',
    keyRisks: [
      { title: '采购部尚未介入', detail: '技术方案已获认可，但采购流程尚未启动。采购部的介入可能带来价格压力和流程延迟。', stakeholders: [] },
      { title: '竞争对手可能提交替代方案', detail: '包钢作为大型国企，通常会进行多方比价。需要在竞争对手介入前建立技术壁垒。', stakeholders: [] },
    ],
    whatsNext: [
      { action: '推动肖亮在内部提交技术评审报告，锁定技术方案', rationale: '肖亮已认可方案，需要将口头认可转化为正式文件，为后续采购流程奠定基础。', suggestedContacts: [] },
      { action: '了解采购部的决策流程和关键人物', rationale: '提前了解采购流程，避免在商务谈判阶段被动。', suggestedContacts: [{ name: '张建平', title: '采购部负责人', reason: '采购决策的关键把关人，需要提前建立关系' }] },
    ],
  },
  {
    date: '2025-09-10',
    keyRisks: [
      { title: '张建平要求降价15%', detail: '采购部张建平正式介入，要求下调15%并提供首年免费驻场维保。如果直接让步，将严重影响利润率。', stakeholders: ['张建平'] },
      { title: '内部价格压力升级', detail: '张建平的降价要求可能影响其他决策者的态度，需要找到既满足采购要求又保护利润的方案。', stakeholders: ['张建平', '杨楠'] },
    ],
    whatsNext: [
      { action: '准备价值论证材料，量化安全和效率提升带来的ROI', rationale: '不能在价格上直接让步，需要用价值说服采购部。一期88%效率提升和零事故记录是最有力的论据。', suggestedContacts: [] },
      { action: '安排CEO隋少龙参观一期项目现场', rationale: '高层对高层的沟通更有效，CEO的参与可以提升项目优先级，绕过纯价格导向的采购谈判。', suggestedContacts: [{ name: '隋少龙', title: 'CEO', reason: '高层背书可以改变采购谈判的格局' }] },
    ],
  },
  {
    date: '2025-09-25',
    keyRisks: [
      { title: '价格谈判仍未解决', detail: '虽然CEO参观提升了高层认可度，但张建平的降价要求仍然存在。需要找到创造性的解决方案。', stakeholders: ['张建平'] },
      { title: '竞争对手可能趁机压价', detail: '如果谈判拖延，竞争对手可能利用价格优势介入。', stakeholders: [] },
    ],
    whatsNext: [
      { action: '通过微信与杨楠沟通，确认安全是否仍是第一优先级', rationale: '如果杨楠确认安全优先于价格，可以在后续谈判中以此为筹码。', suggestedContacts: [] },
      { action: '设计维保捆绑方案，将驻场维保纳入合同而非免费赠送', rationale: '这样既回应了张建平的维保需求，又避免了直接降价，保护了合同总价值。', suggestedContacts: [] },
    ],
  },
  {
    date: '2025-10-05',
    keyRisks: [
      { title: '极寒零故障率承诺的风险', detail: '杨楠明确"只要系统能保证极寒天气下零故障率，价格可以再谈"。这意味着我们需要在合同中做出技术承诺，存在履约风险。', stakeholders: ['杨楠'] },
      { title: '方案评审会的不确定性', detail: '即将召开的正式方案评审会将决定项目走向，需要确保所有关键决策者到场并获得支持。', stakeholders: ['杨楠', '肖亮', '张建平'] },
    ],
    whatsNext: [
      { action: '准备极寒环境测试数据和技术保障方案，为方案评审会做准备', rationale: '杨楠已经给出了明确的决策标准，需要用数据和方案直接回应。', suggestedContacts: [] },
      { action: '提前与肖亮沟通评审会议程，确保技术方案的呈现方式最优', rationale: '肖亮是技术评审的关键支持者，提前对齐可以确保评审会顺利通过。', suggestedContacts: [] },
    ],
  },
  {
    date: '2025-10-15',
    keyRisks: [
      { title: '张建平仍坚持价格下调', detail: '方案评审会技术层面已通过，但张建平仍然坚持降价要求。需要在最终商务谈判前找到突破口。', stakeholders: ['张建平'] },
      { title: '谈判窗口期有限', detail: '如果不能在近期达成协议，可能错过客户的年度预算周期。', stakeholders: [] },
    ],
    whatsNext: [
      { action: '提出维保捆绑方案：将首年驻场维保纳入合同，总价微调但保护核心利润', rationale: '这是解决张建平价格诉求的最佳方案，既满足了他的要求，又保护了我们的利润空间。', suggestedContacts: [] },
      { action: '推动杨楠在内部为项目定调，加速最终决策', rationale: '杨楠已表态支持，需要将他的支持转化为内部推动力，压缩谈判周期。', suggestedContacts: [] },
    ],
  },
  {
    date: '2025-10-20',
    keyRisks: [
      { title: '合同条款细节风险', detail: '维保捆绑方案已获初步认可，但合同条款（SLA、罚则、验收标准）的细节谈判可能产生新的分歧。', stakeholders: ['张建平'] },
      { title: '年底预算截止压力', detail: '如果不能在年底前签约，可能需要等待下一个预算周期，导致项目延迟3-6个月。', stakeholders: [] },
    ],
    whatsNext: [
      { action: '准备详细的合同条款草案，提前预判可能的争议点', rationale: '主动准备合同草案可以掌握谈判主动权，避免被动应对客户的条款要求。', suggestedContacts: [] },
      { action: '与法务团队沟通SLA条款，确保极寒零故障率承诺的可执行性', rationale: '这是合同中最关键的技术承诺，需要确保条款既满足客户要求又保护我方利益。', suggestedContacts: [] },
      { action: '安排与张建平的一对一沟通，就维保方案细节达成共识', rationale: '在正式合同谈判前，先与张建平私下对齐，减少正式谈判中的摩擦。', suggestedContacts: [] },
    ],
  },
];

// ─── 江西铜业 (Deal 210002) ─────────────────────────────────────────────
const jiangxiSnapshots = [
  {
    date: '2025-08-10',
    keyRisks: [
      { title: '矿山环境复杂度高', detail: '城门山铜矿是露天+地下混合作业，技术挑战远超纯露天矿。地下矿道的信号覆盖和定位精度是核心难题。', stakeholders: [] },
      { title: 'OEM合作伙伴关系管理', detail: '通过OEM引荐接触客户，需要平衡合作伙伴关系和自身利益，避免被边缘化。', stakeholders: [] },
    ],
    whatsNext: [
      { action: '安排与技术负责人的深度技术交流，全面了解现有系统的痛点', rationale: '首次接触需要建立技术信任，深入了解客户的具体需求才能设计有针对性的方案。', suggestedContacts: [] },
      { action: '与OEM合作伙伴明确分工和利益分配机制', rationale: '提前明确合作边界，避免后续因利益分配产生冲突。', suggestedContacts: [] },
    ],
  },
  {
    date: '2025-08-28',
    keyRisks: [
      { title: '地下矿道信号覆盖不足', detail: '现有系统在地下矿道的信号覆盖严重不足，这是客户最紧迫的需求。如果我们的方案不能有效解决，将失去竞争优势。', stakeholders: [] },
      { title: '技术方案复杂度高', detail: '露天+地下混合作业需要两套不同的技术方案，增加了实施难度和成本。', stakeholders: [] },
    ],
    whatsNext: [
      { action: '设计联合方案（OEM硬件+我方软件平台），重点解决地下信号覆盖问题', rationale: '联合方案可以发挥各方优势，同时降低客户的集成风险。', suggestedContacts: [] },
      { action: '准备地下矿道信号覆盖的技术解决方案demo', rationale: '用技术demo直接展示解决方案的可行性，比PPT更有说服力。', suggestedContacts: [] },
    ],
  },
  {
    date: '2025-09-15',
    keyRisks: [
      { title: '预算审批流程不确定', detail: '客户已启动预算审批流程，但国企的审批周期通常较长（2-3个月），存在拖延风险。', stakeholders: [] },
      { title: '竞争对手可能介入', detail: '联合方案已提交，但竞争对手可能提交更低价格的替代方案。', stakeholders: [] },
    ],
    whatsNext: [
      { action: '跟进预算审批进度，了解内部审批的关键节点和决策人', rationale: '提前了解审批流程可以预判时间线，避免被动等待。', suggestedContacts: [] },
      { action: '准备竞争对比材料，突出我方方案的技术优势和长期TCO优势', rationale: '预防竞争对手的低价策略，用价值而非价格赢得客户。', suggestedContacts: [] },
    ],
  },
  {
    date: '2025-09-30',
    keyRisks: [
      { title: '竞争对手低价方案冲击', detail: '某国内厂商提交了更低价格的方案，客户内部出现分歧。部分人倾向低价方案，技术评估可能被价格因素覆盖。', stakeholders: [] },
      { title: '客户内部决策分裂', detail: '技术团队倾向我方方案，但采购和部分管理层被低价吸引。需要统一客户内部认知。', stakeholders: [] },
    ],
    whatsNext: [
      { action: '安排客户参观包钢一期项目，用实际运行效果说服决策层', rationale: '百闻不如一见，包钢一期的成功案例是最有力的竞争武器。需要提前与杨楠沟通获得参观许可。', suggestedContacts: [] },
      { action: '准备详细的TCO对比分析，证明长期成本优势', rationale: '低价方案通常在维护、升级和可靠性方面存在隐性成本，需要用数据揭示真实的总拥有成本。', suggestedContacts: [] },
    ],
  },
  {
    date: '2025-10-12',
    keyRisks: [
      { title: '采购部仍在比价', detail: '虽然技术团队已被说服，但采购部仍在进行价格比较。需要在商务层面找到突破口。', stakeholders: [] },
      { title: 'OEM合作伙伴协调风险', detail: '联合方案需要OEM合作伙伴的深度配合，如果合作伙伴响应不及时，可能影响项目进度。', stakeholders: [] },
    ],
    whatsNext: [
      { action: '发送详细的TCO对比分析报告，量化3年总成本优势', rationale: '技术团队已被说服，现在需要用财务数据说服采购部。TCO分析是最直接的工具。', suggestedContacts: [] },
      { action: '推动OEM合作伙伴高层出面背书，增强客户信心', rationale: 'OEM合作伙伴的高层背书可以提升联合方案的可信度，同时展示售后服务的保障能力。', suggestedContacts: [] },
    ],
  },
  {
    date: '2025-10-25',
    keyRisks: [
      { title: '最终商务谈判的价格博弈', detail: '采购部开始重新评估，但最终商务谈判中仍可能面临压价。需要准备好底线和让步策略。', stakeholders: [] },
      { title: '合同签署时间线', detail: '如果谈判拖延到年底，可能影响项目启动时间和资源调配。', stakeholders: [] },
    ],
    whatsNext: [
      { action: '协调OEM合作伙伴高层与客户决策层的会面', rationale: '高层对高层的沟通可以加速决策，同时展示联合团队的实力和诚意。', suggestedContacts: [] },
      { action: '准备最终商务方案，包含灵活的付款条件和实施里程碑', rationale: '灵活的商务条件可以降低客户的决策门槛，同时保护我方的核心利益。', suggestedContacts: [] },
    ],
  },
  {
    date: '2025-11-05',
    keyRisks: [
      { title: '合同条款谈判风险', detail: '进入最终商务谈判阶段，合同条款（验收标准、SLA、罚则）的细节可能产生分歧。', stakeholders: [] },
      { title: '实施团队资源调配', detail: '如果签约，需要同时支持包钢和江铜两个项目，实施团队资源可能紧张。', stakeholders: [] },
    ],
    whatsNext: [
      { action: '准备合同条款草案，重点关注验收标准和SLA定义', rationale: '主动准备合同草案可以掌握谈判主动权，避免被动应对。', suggestedContacts: [] },
      { action: '与内部团队确认实施资源和时间线，确保签约后能及时启动', rationale: '客户最担心的是签约后项目迟迟不能启动，提前准备可以增强客户信心。', suggestedContacts: [] },
      { action: '推动客户在年底前完成签约，锁定预算', rationale: '年底是预算截止期，如果错过可能需要等待下一个预算周期。', suggestedContacts: [] },
    ],
  },
];

// Update snapshots with keyRisks and whatsNext
async function updateSnapshots(dealId, snapshotData) {
  // Get existing snapshots for this deal, ordered by date
  const [rows] = await conn.query(
    'SELECT id, date FROM snapshots WHERE dealId = ? ORDER BY date ASC',
    [dealId]
  );
  
  console.log(`\nDeal ${dealId}: found ${rows.length} snapshots, have ${snapshotData.length} updates`);
  
  for (let i = 0; i < Math.min(rows.length, snapshotData.length); i++) {
    const snap = rows[i];
    const data = snapshotData[i];
    
    await conn.query(
      'UPDATE snapshots SET keyRisks = ?, whatsNext = ? WHERE id = ?',
      [JSON.stringify(data.keyRisks), JSON.stringify(data.whatsNext), snap.id]
    );
    console.log(`  Updated snapshot ${snap.id} (${new Date(snap.date).toISOString().split('T')[0]}): ${data.keyRisks.length} risks, ${data.whatsNext.length} next steps`);
  }
}

await updateSnapshots(210001, baogangSnapshots);
await updateSnapshots(210002, jiangxiSnapshots);

console.log('\nDone! All snapshots now have keyRisks and whatsNext data.');
await conn.end();
