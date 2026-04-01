import 'dotenv/config';
import mysql from 'mysql2/promise';

const TENANT_ID = 150001;
const OWNER_ID = 3270005;

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('Connected to database');

  // ── Clean existing data for this tenant ──
  console.log('Cleaning existing data...');
  await conn.query('DELETE FROM dealStrategyNotes WHERE tenantId = ?', [TENANT_ID]);
  await conn.query('DELETE FROM snapshots WHERE tenantId = ?', [TENANT_ID]);
  await conn.query('DELETE FROM nextActions WHERE tenantId = ?', [TENANT_ID]);
  await conn.query('DELETE FROM meetings WHERE tenantId = ?', [TENANT_ID]);
  await conn.query('DELETE FROM stakeholders WHERE tenantId = ?', [TENANT_ID]);
  await conn.query('DELETE FROM deals WHERE tenantId = ?', [TENANT_ID]);
  console.log('Cleaned existing data');

  // ════════════════════════════════════════════════════════════════════════════
  // DEAL 1: 包钢集团 白云鄂博铁矿 (二期扩容复购)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n=== Seeding Deal 1: 包钢集团 ===');
  const [d1] = await conn.query(
    `INSERT INTO deals (tenantId, ownerId, name, company, website, stage, value, confidenceScore, daysInStage, lastActivity, companyInfo, isArchived, salesModel, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'meddic', NOW(), NOW())`,
    [TENANT_ID, OWNER_ID,
     '包钢集团 白云鄂博铁矿 二期扩容',
     '包钢集团',
     'https://www.btsteel.com',
     'Negotiation',
     8500000,
     75,
     12,
     '方案评审会',
     '包钢集团白云鄂博铁矿，中国最大的稀土和铁矿石综合矿山之一。一期已部署3台电铲远程智控系统，连续稳定运行超3年，夜班效率从71%提升至88%以上，零安全事故。二期扩容目标：在极寒天气(-30°C)下实现全矿区系统级融合，将工人从危险作业区彻底撤出。核心技术挑战：需要与"矿山大脑"调度系统对接，满足10Hz高频数据同步需求。']
  );
  const deal1Id = d1.insertId;
  console.log('Deal 1 created, ID:', deal1Id);

  // Stakeholders
  const d1Stakeholders = [
    ['杨楠', '矿长', 'Decision Maker', 'Positive', 'High', '包钢集团白云鄂博铁矿矿长，最终经济决策人。明确表态"包钢的底线是安全"，只要系统能保证极寒天气下零故障率，价格可以再谈。在方案评审会上打断了采购部的价格争论，展现了对安全优先的坚定立场。', '安全第一的务实领导者，对一期成果认可度高。需要通过高层晚餐巩固信任关系。', 0.5, 0.2],
    ['霍光', '设备部副部长', 'Champion', 'Positive', 'High', '设备部核心推动者，对一期部署非常满意。主动帮忙协调矿长和采购部召开评审会。在评审会上开场定调，高度认可一期成果（夜班88%效率+3年零事故）。是我方在客户内部的关键支持者。', '与李明关系良好，愿意主动推动项目。提前透露了肖亮团队对调度系统对接的高要求。', 0.3, 0.5],
    ['肖亮', '无人驾驶项目负责人', 'Influencer', 'Neutral', 'Medium', '技术把关人，对API数据推送延迟要求极其苛刻（10Hz更新频率）。在需求探底会上进行了严格的技术拷问。在评审会上对升级版边缘网关方案表示满意并签字放行，但要求上线前必须与慧拓（无人矿卡供应商）进行联合调试。', '技术导向型决策者，需要用硬数据说服。已通过技术验证，但联合调试是新增条件。', 0.7, 0.5],
    ['张建平', '采购部部长', 'Blocker', 'Negative', 'Medium', '采购决策人，态度强硬。指出二期批量采购硬件成本理应下降，但报价反而比一期高。要求总价直接下调15%并首年驻场维保免费。是主要的商务阻力。', '典型的采购部门价格导向思维。需要通过打包策略（阶梯折扣+维保赠品）给台阶下。被杨矿长打断后有所收敛。', 0.7, 0.8],
  ];
  for (const [name, title, role, sentiment, engagement, keyInsights, personalNotes, mapX, mapY] of d1Stakeholders) {
    await conn.query(
      `INSERT INTO stakeholders (dealId, tenantId, name, title, role, sentiment, engagement, keyInsights, personalNotes, mapX, mapY, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [deal1Id, TENANT_ID, name, title, role, sentiment, engagement, keyInsights, personalNotes, mapX, mapY]
    );
  }
  console.log('Deal 1: 4 stakeholders created');

  // Deal Room meetings (external touchpoints)
  const d1Meetings = [
    // TP2: WeChat 探口风
    ['2025-09-08 14:30:00', 'Follow-up', '霍光',
     `【微信消息 李明→霍光】\n霍部长您好！最近一期那3台电铲运行数据我看了一下，夜班效率已经稳在88%以上了，师傅们反馈都挺好。下周二我正好去包头出差，想去矿上拜访您一下，顺便汇报一下我们最新的"掘悟"2.0系统，看看二期全面推广的机会。您看周二下午方便喝个茶吗？`, 5],
    // TP3: 客户反馈
    ['2025-09-08 15:15:00', 'Follow-up', '霍光',
     `【微信消息 霍光→李明】\n李总好。数据确实不错，杨矿长前几天开会还表扬了。周二下午2点你直接来我办公室吧。不过提前透个底，二期扩容的话，肖亮他们无人驾驶项目组那边要求很高，必须跟他们的调度系统打通。你这次来最好带上你们的技术方案。`, 5],
    // TP5: 会前技术资料邮件
    ['2025-09-12 09:00:00', 'Follow-up', '霍光, 肖亮',
     `【邮件 李明→霍光, 肖亮】\n主题：拓疆者 - 白云鄂博铁矿二期扩容初步技术方案与API对接说明\n\n霍部长、肖总，您好：\n感谢您安排下周的会面。针对二期扩容以及与"矿山大脑"的协同需求，我附上了我们最新的《拓疆者远程智控系统2.0技术白皮书》以及《第三方调度系统API对接指南》。\n我们的系统目前已经支持标准的RESTful API，可以实时输出设备的姿态、位置和工作状态数据，完全能够满足肖总这边"远程作业+无人运输"常态化协同的要求。\n期待周二与各位当面深入交流。\n附件：1. BuilderX_System_v2_Whitepaper.pdf  2. BuilderX_API_Integration_Guide.pdf`, 10],
    // TP6: 初步需求探底会
    ['2025-09-16 14:00:00', 'Discovery Call', '霍光, 肖亮',
     `【客户会议 - 霍光办公室】\n参与人：霍光、肖亮、李明\n\n会议总结：\n- 霍光的诉求：对一期非常满意。二期扩容的核心驱动力是：在极寒天气（-30°C）下，彻底把工人从危险作业区撤出来，实现本质安全。\n- 肖亮的技术拷问：肖亮对API数据推送的延迟非常苛刻。他要求电铲铲斗的位置数据必须达到10Hz的更新频率，否则无人矿卡无法精准对位装车。\n\n行动项：\n- [李明] 确认升级后的边缘网关能否在不拖垮本地5G基站的情况下，稳定输出10Hz的数据。\n- [霍光] 如果技术指标能过关，下个月帮忙协调矿长（杨楠）和采购部（张建平）召开正式的方案评审会。`, 90],
    // TP7: 正式报价邮件
    ['2025-10-08 10:30:00', 'Negotiation', '霍光, 肖亮, 张建平',
     `【邮件 李明→霍光, 肖亮, 张建平 | 抄送：隋少龙】\n主题：拓疆者 - 白云鄂博铁矿二期扩容正式方案与报价\n\n各位领导好：\n结合前期与霍部长、肖总的深入沟通，我们完成了二期扩容的正式方案。本次方案不仅涵盖了新增设备的远程智控改造，还特别针对肖总提出的10Hz高频数据同步需求，升级了边缘计算网关，确保与"矿山大脑"的无缝对接。\n详细的技术方案和商务报价请见附件。我们隋总也非常重视此次合作，计划在下周的评审会上亲自向杨矿长和各位领导汇报。\n附件：1. 白云鄂博铁矿二期扩容技术方案_Final.pdf  2. 白云鄂博铁矿二期扩容商务报价单.xlsx`, 10],
    // TP8: 正式方案评审会
    ['2025-10-15 14:00:00', 'Executive Briefing', '杨楠, 霍光, 肖亮, 张建平, 隋少龙',
     `【正式方案评审会 - 白云鄂博铁矿办公楼302会议室】\n参与人：杨楠(矿长)、霍光(设备部)、肖亮(无人驾驶项目组)、张建平(采购部)、隋少龙(CEO)、李明\n\n会议详细记录：\n1. 一期复盘：霍光部长开场定调，高度认可一期成果。特别强调了夜班88%的效率，以及连续3年零安全事故的记录。\n2. 技术对齐：肖亮审查了升级版边缘网关的方案。他对10Hz数据更新率的承诺表示满意，并在技术可行性上签字放行。他同时要求拓疆者在二期上线前，必须与无人矿卡供应商（慧拓）进行一次联合调试。\n3. 商务博弈：采购部张建平部长态度强硬。他指出，既然是二期批量采购，硬件成本理应下降，但拓疆者的单台报价反而比一期高了（因为暗含了网关升级成本）。他要求总价直接下调15%，并且要求首年驻场维保免费。\n4. 高层决策：杨楠矿长介入打断了争论。他明确表态："包钢的底线是安全。只要拓疆者能保证系统在极寒天气下的零故障率，价格可以再谈。"他指示设备部和采购部在一周内与拓疆者敲定最终技术协议。\n\n下一步行动：\n- [李明] 重新核算报价模型。按照之前内部对齐的策略，提供阶梯折扣，并把维保费用打包进去作为让步。10月22日前提交。\n- [隋少龙] 安排与杨楠矿长的单独晚餐，巩固高层信任。`, 150],
  ];
  for (const [date, type, participant, summary, duration] of d1Meetings) {
    await conn.query(
      `INSERT INTO meetings (dealId, tenantId, date, type, keyParticipant, summary, duration, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [deal1Id, TENANT_ID, date, type, participant, summary, duration]
    );
  }
  console.log('Deal 1: 6 meetings created');

  // Strategy Notes (internal touchpoints)
  const d1StrategyNotes = [
    // TP1: 内部销售规划
    ['internal',
     `【内部销售规划 2025-09-05】记录人：李明\n\n执行记录：调取了一期部署的3台电铲的运行数据。系统已经连续稳定运行超过3年，夜班作业效率从最初的71%稳步提升到了88%以上。\n\n采取行动：起草了二期全面推广的初步扩容方案。已向产研团队提交内部工单，要求确认我们的API接口是否已经准备好与包钢现有的"矿山大脑"系统进行对接。\n\n下一步计划：找个借口联系霍光部长，非正式地探探二期扩容的口风。`],
    // TP4: 内部战略对齐会
    ['pricing',
     `【内部高管战略对齐会 2025-09-10】参与人：隋少龙(CEO)、李明(销售总监)、产研负责人\n\n1. 项目定调：隋总强调，包钢二期不仅是营收目标，更是拓疆者从"单点设备改造"走向"全矿区系统级融合"的标杆战役。必须拿下。\n2. 技术底线：产研负责人指出，如果要满足肖亮那边"无人矿卡+远程电铲"的协同，现有的边缘网关算力不够，必须升级硬件，这会导致单台硬件成本上升约5%。\n3. 定价策略：李明提出担忧，成本上升会在采购部（张建平）那里遇到阻力。隋总拍板："硬件成本上升我们自己先消化一部分，报价单上不要体现单项涨价，整体打包报价。如果采购部压价太狠，我们可以把第一年的驻场维保作为谈判筹码送出去，但绝不能在技术标准上妥协。"`],
  ];
  for (const [category, content] of d1StrategyNotes) {
    await conn.query(
      `INSERT INTO dealStrategyNotes (dealId, tenantId, category, content, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [deal1Id, TENANT_ID, category, content]
    );
  }
  console.log('Deal 1: 2 strategy notes created');

  // ════════════════════════════════════════════════════════════════════════════
  // DEAL 2: 江西铜业 城门山铜矿 (OEM合作三角关系)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n=== Seeding Deal 2: 江西铜业 ===');
  const [d2] = await conn.query(
    `INSERT INTO deals (tenantId, ownerId, name, company, website, stage, value, confidenceScore, daysInStage, lastActivity, companyInfo, isArchived, salesModel, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'meddic', NOW(), NOW())`,
    [TENANT_ID, OWNER_ID,
     '江西铜业 城门山铜矿 OEM联合打单',
     '江西铜业 (via 徐工集团)',
     'https://www.jxcc.com',
     'POC',
     4200000,
     65,
     18,
     'POC验收评审会',
     '江西铜业城门山铜矿，通过徐工集团(XCMG)的OEM合作模式切入。江铜集团正在推进"数字江铜"战略，徐工在江西市场面临三一重工的激烈竞争，需要差异化卖点。合作模式：拓疆者提供5G远程智控系统前装到徐工设备，联合投标，利润分成。POC已成功完成，操作手从最初抵触转为积极支持。']
  );
  const deal2Id = d2.insertId;
  console.log('Deal 2 created, ID:', deal2Id);

  // Stakeholders
  const d2Stakeholders = [
    ['赵桂洪', '矿长/法人代表', 'Decision Maker', 'Positive', 'High', '城门山铜矿矿长，最终决策人。非常务实："我不管你们那些花里胡哨的技术名词。我只关心这套系统在我们的排土场到底能不能用，会不会拖慢生产进度。"高度重视一线操作手的意见，"只要工人愿意用，我就认。"已在POC验收报告上签字，指示团队起草招标文件。', '务实型领导，以一线反馈为决策依据。对技术概念不感冒，但对实际效果认可度高。', 0.5, 0.2],
    ['刘方云', '前矿长/集团高管', 'Influencer', 'Positive', 'Low', '江铜集团高管，前城门山矿长。是"数字江铜"战略的早期构想者。看了陈师傅的视频和POC数据后非常高兴，承诺在集团层面帮忙推动。更重要的是，他邀请拓疆者去德兴铜矿（亚洲最大铜矿）做现场勘测，准备大规模车队改造。', '隐形决策者，集团层面的战略推动者。德兴铜矿是真正的大鱼。需要持续维护这层高层关系。', 0.3, 0.3],
    ['王强', '徐工大客户经理', 'Champion', 'Positive', 'High', '徐工矿业机械事业部大客户经理，渠道合作伙伴。将"徐工+拓疆者"组合定位为解决操作手安全问题、实现换班不停机的终极方案。POC成功后高度满意，敦促矿方尽快启动正式采购流程。110吨级远程推土机已成为徐工在华南大区的标杆。', '利益高度一致的渠道伙伴。在徐工内部有推动力，愿意把我们的能力作为核心卖点。', 0.7, 0.5],
    ['陈师傅', '资深挖掘机操作手', 'User', 'Positive', 'High', '矿上最资深的操作手，由赵矿长指定负责测试。最初对远程操控有强烈抵触情绪（抱怨没有"路感"，担心下岗）。经过策略性沟通后转变为最大支持者——发现干完一个班次后腰不疼了。现在其他操作手都在抢着排班进远程操作舱。提出了一个有价值的技术反馈：下午4点太阳直射摄像头时景深判断有困难。', '从抵触者转变为最强支持者的典型用户。他的意见直接影响赵矿长的决策。录制的操作视频已成为营销素材。', 0.7, 0.8],
  ];
  for (const [name, title, role, sentiment, engagement, keyInsights, personalNotes, mapX, mapY] of d2Stakeholders) {
    await conn.query(
      `INSERT INTO stakeholders (dealId, tenantId, name, title, role, sentiment, engagement, keyInsights, personalNotes, mapX, mapY, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [deal2Id, TENANT_ID, name, title, role, sentiment, engagement, keyInsights, personalNotes, mapX, mapY]
    );
  }
  console.log('Deal 2: 4 stakeholders created');

  // Deal Room meetings (external touchpoints)
  const d2Meetings = [
    // TP2: 渠道伙伴邮件
    ['2025-08-10 09:30:00', 'Discovery Call', '王强 (徐工)',
     `【邮件 胥明日→王强(徐工)】\n主题：拓疆者 x 徐工 - 江铜城门山项目联合打单策略沟通\n\n王总您好：\n听闻徐工最近在跟进江铜城门山铜矿的110吨级推土机和挖掘机采购项目。考虑到江铜集团正在大力推进"数字江铜"战略，我们认为如果徐工的设备能前装拓疆者的"5G远程智控系统"，将极大提升中标概率。\n我们之前在包钢和新疆的案例您也了解，系统稳定性已经过验证。不知下周是否有空通个电话，探讨一下联合投标的可行性？`, 10],
    // TP4: POC现场启动会
    ['2025-09-20 10:00:00', 'POC Check-in', '赵桂洪, 王强, 胥明日, 张伟',
     `【POC现场启动会 - 城门山铜矿现场指挥部】\n参与人：赵桂洪(矿长)、王强(徐工)、胥明日(COO)、张伟(实施工程师)\n\n会议总结：\n- 赵桂洪的期望：矿长非常务实："我不管你们那些花里胡哨的技术名词。我只关心这套系统在我们的排土场到底能不能用，会不会拖慢生产进度。"\n- 王强的推销：王强将"徐工+拓疆者"的组合定位为解决操作手安全问题、实现换班不停机的终极方案。\n\n行动项：\n- [张伟] 在空调办公楼内搭建好远程操作舱。确保现场5G网络延迟控制在150ms以内。\n- [赵桂洪] 指定陈师傅（矿上最资深的操作手）在接下来的4周内负责测试这套系统。`, 60],
    // TP5: 用户抵触预警
    ['2025-09-25 16:45:00', 'Follow-up', '张伟',
     `【微信消息 张伟→胥明日】\n胥总，现场遇到点阻力。陈师傅今天试开了一下午，一直抱怨说没有"路感"，听不到发动机真实的轰鸣声，他不敢踩油门。而且他私下跟其他工友说，这机器要是真好用，以后大家都要下岗了。情绪有点抵触。`, 5],
    // TP6: 策略调整指导
    ['2025-09-25 17:10:00', 'Follow-up', '胥明日',
     `【微信消息 胥明日→张伟】\n收到。这是典型的操作手初期心理防御。你明天买两条好烟去拜访一下陈师傅。不要跟他讲大道理，就让他对比一下：在排土场吃灰颠簸一天，和在空调房里喝着茶干活，哪个对腰椎好？另外，把座椅的震动反馈调大一点，模拟真实路感。告诉他，这技术不是替代他，是让他这样的老司机能多干几年，带带徒弟。`, 5],
    // TP8: POC最终验收评审会
    ['2025-11-05 09:30:00', 'Demo', '赵桂洪, 陈师傅, 王强, 胥明日, 张伟',
     `【POC最终验收评审会 - 城门山铜矿排土场现场指挥部】\n参与人：赵桂洪(矿长)、陈师傅(操作手代表)、王强(徐工)、胥明日(COO)、张伟(实施工程师)\n\n会议详细记录：\n1. POC数据汇报：胥明日展示了4周的测试数据。5G延迟稳定在140ms以内。远程操作效率达到了传统人工操作的95%。整个测试期间零安全事故。\n2. 一线用户反馈：陈师傅发言。他坦承了最初的抵触情绪，但现在对舒适度和安全性赞不绝口。不过他指出了一个技术瑕疵："下午4点太阳直射摄像头的时候，景深判断有点吃力，精准排土时有点拿不准距离。"\n3. 合作伙伴表态：徐工王强表示高度满意。这台110吨级远程推土机已经成为徐工在华南大区的标杆。他敦促矿方尽快启动正式的采购流程。\n4. 高层决策：赵桂洪矿长非常看重陈师傅的意见。"只要工人愿意用，我就认。"他当场在POC验收报告上签字，并指示团队下周起草招标文件。\n\n下一步行动：\n- [产研团队] 针对强光下的景深判断问题，在v2.0版本中优化算法。\n- [胥明日 & 王强] 协同准备联合投标书，确保技术标拿高分。\n- [胥明日] 安排拜访刘方云（集团高管），借此成功案例，谋求在亚洲最大的德兴铜矿进行大规模推广。`, 120],
    // TP9: 联合投标书邮件
    ['2025-11-12 14:00:00', 'Negotiation', '王强 (徐工)',
     `【邮件 胥明日→王强】\n主题：城门山铜矿智能挖机联合投标书 - 拓疆者技术部分\n\n王总：\n附件是我们负责的技术标书部分，已经按照江铜的招标要求进行了排版。特别强调了我们在5G低延时控制和多传感器融合方面的专利优势，这部分应该能帮徐工拉开与三一的评分差距。\n另外，针对陈师傅提到的强光景深问题，我们已经在标书中承诺了免费的软件OTA升级服务。\n请您整合后统一提交。预祝我们一举中标！`, 10],
  ];
  for (const [date, type, participant, summary, duration] of d2Meetings) {
    await conn.query(
      `INSERT INTO meetings (dealId, tenantId, date, type, keyParticipant, summary, duration, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [deal2Id, TENANT_ID, date, type, participant, summary, duration]
    );
  }
  console.log('Deal 2: 6 meetings created');

  // Strategy Notes (internal touchpoints)
  const d2StrategyNotes = [
    // TP1: 内部渠道拓展策略会
    ['competitive',
     `【内部渠道拓展策略会 2025-08-05】参与人：隋少龙(CEO)、胥明日(COO)\n\n1. 渠道破局：隋总指出，我们不能只靠直销，必须绑定主机厂（OEM）。徐工目前在江西市场被三一重工压制，急需差异化卖点。\n2. 切入点选择：胥总建议，以江铜城门山铜矿的110吨级推土机采购案为切入点。江铜集团正在推"数字江铜"战略，如果徐工的设备能出厂自带我们的"5G远程智控"，中标率会大增。\n3. 行动决议：胥总亲自挂帅，直接对接徐工矿业机械事业部的大客户经理王强，提出"联合打单、利润分成"的合作模式。`],
    // TP3: 渠道对齐与POC确认
    ['relationship',
     `【渠道对齐与POC确认 2025-08-14】记录人：胥明日\n\n执行记录：刚跟徐工的王强通了45分钟电话。他非常感兴趣。徐工在江西确实面临三一的激烈竞争，他同意把我们的远程操控能力作为核心差异化卖点。\n采取行动：双方达成一致，在城门山铜矿开展为期1个月的免费POC（概念验证）。徐工负责设备的物流和现场协调；我们负责智控系统的改装和现场工程师支持。\n下一步计划：派张伟（实施工程师）先去徐州，在设备发往江西前完成前装改造。`],
    // TP7: POC中期进展
    ['internal',
     `【POC中期进展汇报 2025-10-15】记录人：张伟\n\n执行记录：胥总的策略奏效了。陈师傅现在是我们最大的支持者。他发现干完一个班次后腰居然不疼了。现在其他操作手都在抢着排班进远程操作舱。\n采取行动：录了一段陈师傅一边喝茶一边平稳操作推土机的短视频。已经发给徐工的王强，让他拿去当营销素材。\n下一步计划：准备下个月的POC最终验收评审会。`],
  ];
  for (const [category, content] of d2StrategyNotes) {
    await conn.query(
      `INSERT INTO dealStrategyNotes (dealId, tenantId, category, content, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [deal2Id, TENANT_ID, category, content]
    );
  }
  console.log('Deal 2: 3 strategy notes created');

  // ════════════════════════════════════════════════════════════════════════════
  // DEAL 3: 住友商事 (海外独家代理商)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n=== Seeding Deal 3: 住友商事 ===');
  const [d3] = await conn.query(
    `INSERT INTO deals (tenantId, ownerId, name, company, website, stage, value, confidenceScore, daysInStage, lastActivity, companyInfo, isArchived, salesModel, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'meddic', NOW(), NOW())`,
    [TENANT_ID, OWNER_ID,
     '住友商事 海外独家代理',
     '住友商事 (Sumitomo Corporation)',
     'https://www.sumitomocorp.com',
     'Negotiation',
     20000000,
     70,
     25,
     'Q4联合销售策略会',
     '住友商事(Sumitomo Corporation)，日本五大商社之一，建机渠道极强。已签署独家代理协议，成为拓疆者在日本市场的独家进口和销售代理商。日本建筑业面临严重的"少子老龄化"劳动力短缺，对机器换人需求刚性且价格敏感度低。已与大林组(Obayashi)完成跨国POC测试（北京遥控大阪挖掘机），首批5台设备已下单。2025年预计通过住友在矿山、废弃物处理和建筑等多领域销售至少30台设备。']
  );
  const deal3Id = d3.insertId;
  console.log('Deal 3 created, ID:', deal3Id);

  // Stakeholders
  const d3Stakeholders = [
    ['樽见雅幸 (Masayuki Tarumi)', '运输与建设系统事业部门长', 'Decision Maker', 'Positive', 'Medium', '住友商事运输与建设系统事业部门长，经济买单人。批准了独家代理协议和"拓疆者日本技术支持中心"的联合投资计划。认同"安全"和"改善恶劣工作环境"的销售话术，指出这完美契合日本建筑业的"老龄化"危机。', '高层决策者，对合作方向认可但参与频率不高。需要通过佐藤维护关系。', 0.5, 0.2],
    ['佐藤健一 (Kenichi Sato)', '建机业务部 拓疆者项目负责人', 'Champion', 'Positive', 'High', '住友商事建机业务部项目负责人，核心支持者。最初主动发起询盘，全程推动合作。负责协调大林组POC测试、CSPI-EXPO展会筹备、日文本地化等。提出了关键问题：随着订单规模扩大，需要在日本建立本地化备件库和技术支持团队。', '最关键的内部推动者。技术理解力强，能在住友内部有效推动项目。需要持续赋能他的销售团队。', 0.3, 0.5],
    ['莲轮贤治 (Kenji Hasuwa)', '大林组 代表取缔役社长', 'Influencer', 'Positive', 'Medium', '大林组(Obayashi)社长，日本五大建筑商之一的最高决策者。作为标杆客户参与了跨国POC测试，对北京遥控大阪挖掘机的无缝操控感到震惊。已批准首批5台设备采购，用于东京城市更新项目。对微操精度补丁(v2.1.J)的测试结果表示满意。', '标杆客户的最高决策者。他的采购决定对住友在日本市场的推广具有示范效应。', 0.7, 0.5],
  ];
  for (const [name, title, role, sentiment, engagement, keyInsights, personalNotes, mapX, mapY] of d3Stakeholders) {
    await conn.query(
      `INSERT INTO stakeholders (dealId, tenantId, name, title, role, sentiment, engagement, keyInsights, personalNotes, mapX, mapY, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [deal3Id, TENANT_ID, name, title, role, sentiment, engagement, keyInsights, personalNotes, mapX, mapY]
    );
  }
  console.log('Deal 3: 3 stakeholders created');

  // Deal Room meetings (external touchpoints)
  const d3Meetings = [
    // TP1: 代理商初步询盘
    ['2024-02-15 10:00:00', 'Discovery Call', '佐藤健一 (Sumitomo)',
     `【邮件 佐藤健一(Sumitomo)→隋少龙】\n主题：Inquiry regarding BuilderX Remote Control Solutions for the Japanese Market\n\nDear Mr. Sui,\nI am Kenichi Sato from the Construction Equipment Division at Sumitomo Corporation. We have been following BuilderX's recent deployments in Chinese mines with great interest.\nJapan's construction industry is facing a severe labor shortage due to our aging population. We believe remote-control technology could be a game-changer for quarry mining, port loading, and industrial waste processing here.\nWe would like to explore a potential partnership to introduce your solutions to Japan. Could we schedule an introductory video call next week?\nBest regards, Kenichi Sato`, 10],
    // TP4: 跨国测试准备
    ['2024-03-10 09:30:00', 'Technical Review', '佐藤健一',
     `【邮件 赵宇→佐藤健一】\n主题：BuilderX Demo Unit Shipment & Cross-Border Test Setup\n\nSato-san,\nThe demo unit has cleared customs and should arrive at your facility in Osaka by Friday.\nFor the cross-border test with Obayashi Corporation, we have configured the system to operate over the public 4G network. Our engineers in Beijing will attempt to control the excavator in Osaka (a distance of 1,700 km).\nPlease ensure the local SIM cards are activated and the excavator's hydraulic system is ready for calibration upon arrival.\nBest, Zhao Yu`, 10],
    // TP7: Q4联合销售策略会
    ['2024-12-10 10:00:00', 'Executive Briefing', '樽见雅幸, 佐藤健一, 隋少龙, 赵宇',
     `【Q4联合销售策略会 - Zoom (北京 & 东京)】\n参与人：樽见雅幸(事业部门长)、佐藤健一(项目负责人)、隋少龙(CEO)、赵宇(海外BD总监)\n\n会议详细记录：\n1. 大林组试点复盘：佐藤汇报了大阪的测试进展。虽然跨国遥控很惊艳，但大林组指出，日本的施工现场（如城市重建）比中国的露天矿山狭小得多。他们对靠近墙壁和沟渠时的"微操"精度要求极高。\n2. 销售话术对齐：隋少龙分享了国内的打单经验："不要试图用'省钱'去说服客户，要用'安全'和'改善恶劣工作环境'去打动他们。"樽见雅幸深表赞同，他指出这套话术完美契合日本建筑业的"老龄化"危机，甚至能把开挖掘机包装成"打游戏"，吸引年轻人入行。\n3. CSPI-EXPO 2025展会筹备：双方同意明年6月在千叶幕张联合参展。住友要求拓疆者提供全套日文版的营销物料和技术白皮书。\n4. 售后支持体系：佐藤提出了一个尖锐的问题：随着订单规模扩大，完全依赖北京进行远程排障是不现实的。住友要求拓疆者在日本建立本地化的备件库和技术支持团队。\n\n下一步行动：\n- [产研团队] 开发一个专门针对狭小空间微操精度的软件补丁。下周与佐藤团队对齐。\n- [市场团队] 启动CSPI-EXPO展会物料的日文本地化工作。1月底前交付初稿。\n- [隋少龙] 年底前起草一份关于在日本设立本地技术支持中心（或与住友合资）的初步商业计划书。`, 90],
    // TP8: 微操精度补丁邮件
    ['2024-12-17 14:00:00', 'Technical Review', '佐藤健一',
     `【邮件 赵宇→佐藤健一】\n主题：BuilderX Software Patch for Micro-Movement Precision\n\nSato-san,\nFollowing our discussion last week, our R&D team has developed a custom software patch (v2.1.J) specifically tuned for the cramped conditions of Japanese construction sites.\nThis patch adjusts the joystick sensitivity curves and enhances the depth-perception algorithms for close-quarters operation. We have pushed the update over-the-air (OTA) to the demo unit in Osaka.\nCould you arrange for the Obayashi operators to test it this Thursday and provide feedback?\nBest, Zhao Yu`, 10],
    // TP9: 标杆客户积极反馈
    ['2024-12-20 16:30:00', 'Follow-up', '佐藤健一',
     `【Line消息 佐藤健一→赵宇】\nZhao-san, great news. The Obayashi operators tested the new patch today. They reported a significant improvement in precision when operating near walls and trenches. Hasuwa-san (President of Obayashi) has given the green light to procure the first batch of 5 units for their upcoming urban renewal project in Tokyo.`, 5],
  ];
  for (const [date, type, participant, summary, duration] of d3Meetings) {
    await conn.query(
      `INSERT INTO meetings (dealId, tenantId, date, type, keyParticipant, summary, duration, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [deal3Id, TENANT_ID, date, type, participant, summary, duration]
    );
  }
  console.log('Deal 3: 5 meetings created');

  // Strategy Notes (internal touchpoints)
  const d3StrategyNotes = [
    // TP2: 内部出海战略研讨会
    ['competitive',
     `【内部出海战略研讨会 2024-02-18】参与人：隋少龙(CEO)、胥明日(COO)、赵宇(海外BD总监)\n\n1. 出海时机判断：隋总认为，国内矿山市场虽然大，但竞争日益激烈。日本市场因为"少子老龄化"，对机器换人的需求是刚性的，且价格敏感度低，是绝佳的出海第一站。\n2. 代理商模式确立：胥总指出，日本商社文化封闭，我们不可能直接做直销。住友商事是日本五大商社之一，建机渠道极强。我们必须绑定他们。\n3. 谈判底线：赵宇提出，住友肯定会要求"独家代理权"。隋总拍板："独家可以给，但必须附带年度最低采购量（MOQ）对赌，并且要求他们承担日本本土的Tier-1售后服务。我们不能把研发团队耗在跨国修机器上。"`],
    // TP3: 高层对齐与POC确认
    ['relationship',
     `【高层对齐与跨国POC确认 2024-02-22】记录人：隋少龙\n\n执行记录：刚跟佐藤以及他的部门长樽见雅幸（Tarumi-san）开完视频会。他们确实想要独家代理权。我抛出了我们的底线：需要一个强有力的本地合作伙伴，不仅负责销售，还要负责安装和一线售后。\n采取行动：双方同意先签NDA，我们发一台测试样机过去。他们计划拉上日本五大建筑商之一的"大林组"（Obayashi）来做最初的POC测试。\n下一步计划：赵宇负责协调样机发货，并起草NDA。`],
    // TP5: 跨国POC成功
    ['internal',
     `【跨国POC成功复盘 2024-03-27】记录人：赵宇\n\n执行记录：今天取得了巨大成功！我们在北京办公室通过公共4G网络，成功遥控了大阪的挖掘机。延迟完全在可控范围内。大林组的高管（包括他们的社长莲轮贤治）对这种无缝操控感到非常震惊。\n采取行动：录制了全过程。把原始素材发给了住友的公关团队，供他们发新闻稿用。\n下一步计划：趁热打铁，推进《独家代理协议》的正式签署。`],
    // TP6: 独家代理协议签署
    ['internal',
     `【独家代理协议签署 2024-05-21】记录人：隋少龙\n\n执行记录：《独家代理协议》正式签署。住友商事今天发布了新闻稿，宣布成为我们在日本市场的独家进口和销售代理商。\n采取行动：团队内部庆祝。但真正的硬仗才刚开始：如何赋能他们的销售团队，以及产品的日文本地化。\n下一步计划：安排Q4的联合销售策略会，复盘大林组的试点情况，并规划2025年的打法。`],
    // TP10: 本地支持中心提案
    ['pricing',
     `【本地支持中心提案与2025预测 2025-01-15】记录人：赵宇\n\n执行记录：收到了住友发来的正式PO（采购订单），大林组首批5台设备落地。同时，樽见雅幸也批准了隋总提出的"拓疆者日本技术支持中心"的联合投资计划。\n采取行动：更新了2025年的营收预测。有了本地支持中心和即将到来的CSPI-EXPO展会，我们预计住友今年能在矿山、废弃物处理和建筑等多个领域卖出至少30台设备。\n下一步计划：协调供应链团队，确保这5台设备在春节假期前发货。`],
  ];
  for (const [category, content] of d3StrategyNotes) {
    await conn.query(
      `INSERT INTO dealStrategyNotes (dealId, tenantId, category, content, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [deal3Id, TENANT_ID, category, content]
    );
  }
  console.log('Deal 3: 5 strategy notes created');

  // ── Summary ──
  console.log('\n========================================');
  console.log('Seeding complete!');
  console.log(`Deal 1 (包钢集团): ID=${deal1Id}, 4 stakeholders, 6 meetings, 2 strategy notes`);
  console.log(`Deal 2 (江西铜业): ID=${deal2Id}, 4 stakeholders, 6 meetings, 3 strategy notes`);
  console.log(`Deal 3 (住友商事): ID=${deal3Id}, 3 stakeholders, 5 meetings, 5 strategy notes`);
  console.log('========================================');

  await conn.end();
}

main().catch(err => { console.error(err); process.exit(1); });
