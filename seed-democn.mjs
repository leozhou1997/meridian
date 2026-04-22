import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);

  try {
    console.log("=== 创建中文 Demo 账号：具身智能机器人 ===\n");

    // ════════════════════════════════════════════════════════════════════
    // 1. 创建用户
    // ════════════════════════════════════════════════════════════════════
    const email = "democn@meridianos.ai";
    const password = "demo123";
    const name = "张伟（Demo）";
    const passwordHash = await bcrypt.hash(password, 10);

    const [existingByEmail] = await conn.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    let userId;
    if (existingByEmail.length > 0) {
      userId = existingByEmail[0].id;
      console.log(`用户已存在 (id: ${userId})，更新密码...`);
      await conn.execute(
        "UPDATE users SET passwordHash = ?, loginMethod = 'email', name = ? WHERE email = ?",
        [passwordHash, name, email]
      );
    } else {
      const openId = `local_democn_${Date.now()}`;
      await conn.execute(
        "INSERT INTO users (openId, email, name, passwordHash, loginMethod, role, lastSignedIn) VALUES (?, ?, ?, ?, 'email', 'admin', NOW())",
        [openId, email, name, passwordHash]
      );
      const [newUser] = await conn.execute("SELECT LAST_INSERT_ID() as id");
      userId = newUser[0].id;
      console.log(`创建用户: id=${userId}, email=${email}`);
    }

    // ════════════════════════════════════════════════════════════════════
    // 2. 创建 Tenant
    // ════════════════════════════════════════════════════════════════════
    const [existingMember] = await conn.execute(
      "SELECT tenantId FROM tenantMembers WHERE userId = ?",
      [userId]
    );

    let tenantId;
    if (existingMember.length > 0) {
      tenantId = existingMember[0].tenantId;
      console.log(`Tenant 已存在 (id: ${tenantId})，跳过创建`);
    } else {
      const slug = `democn-${userId}-${Date.now()}`;
      await conn.execute(
        "INSERT INTO tenants (name, slug, plan) VALUES (?, ?, 'enterprise')",
        ["星辰具身智能", slug]
      );
      const [newTenant] = await conn.execute("SELECT LAST_INSERT_ID() as id");
      tenantId = newTenant[0].id;
      await conn.execute(
        "INSERT INTO tenantMembers (tenantId, userId, role) VALUES (?, ?, 'owner')",
        [tenantId, userId]
      );
      console.log(`创建 Tenant: id=${tenantId}, name=星辰具身智能`);
    }

    // ════════════════════════════════════════════════════════════════════
    // 3. 创建公司档案
    // ════════════════════════════════════════════════════════════════════
    const [existingProfile] = await conn.execute(
      "SELECT id FROM companyProfiles WHERE tenantId = ?",
      [tenantId]
    );

    const companyData = [
      tenantId,
      userId,
      "星辰具身智能科技有限公司",
      "https://www.starbody.ai",
      "星辰具身智能成立于2023年，专注于工业级具身智能机器人的研发与商业化落地。核心产品「星行者」系列是面向制造业产线的通用型具身机器人，具备视觉感知、力控操作、自主导航和多机协同能力。机器人搭载自研的「星脑」大模型，能够理解自然语言指令并分解为复杂操作序列，实现从「看懂」到「做到」的闭环。公司核心团队来自清华大学智能机器人实验室、波士顿动力、大疆创新，已获得红杉中国、IDG资本A轮融资。2025年在长三角3家标杆工厂完成POC验证，产线效率提升35%，质检漏检率下降至0.1%以下。",
      "具身智能 / 工业机器人",
      JSON.stringify([
        "星行者 S1（产线巡检+质检机器人）",
        "星行者 M1（物料搬运+上下料机器人）",
        "星脑 OS（机器人操作系统+大模型）",
        "星云平台（多机协同调度+数字孪生）",
      ]),
      "汽车制造、3C电子、新能源电池、精密制造等离散制造行业的头部企业",
      "上海",
      "80-150人",
      "业界首个将大语言模型与力控操作深度融合的具身智能方案。不同于传统工业机器人需要逐一编程示教，星行者通过自然语言+少样本学习即可快速适配新工序，换线时间从传统的2周缩短至2小时。已获得3项发明专利，2025年入选工信部「智能制造优秀场景」。",
      JSON.stringify([
        "线索获取",
        "需求调研",
        "技术验证(POC)",
        "商务谈判",
        "合同签署",
        "部署实施",
      ]),
      "5000000",
      "6",
      "12",
      "汽车制造（年产10万辆以上）、3C电子（年产值50亿以上）、新能源电池（GWh级产线）",
      "年营收50亿以上的制造业集团，有明确的智能制造转型战略",
      "制造副总裁/厂长、智能制造部门负责人、产线经理、IT/数字化负责人、采购总监",
      "用工荒（年轻人不愿进工厂）、产线柔性化需求（多品种小批量）、质检依赖人工经验（老师傅退休断层）、安全合规压力（工伤事故零容忍）",
      "星辰具身智能「星行者」系列是面向制造业的通用型具身机器人。核心能力：视觉感知（0.01mm精度）、力控操作（0.1N力控精度）、自主导航（厘米级定位）、自然语言理解（星脑大模型）。已在汽车焊装、3C组装、电池PACK等场景验证。客户包括某头部新能源车企、某全球TOP3消费电子代工厂。",
    ];

    if (existingProfile.length > 0) {
      await conn.execute(
        `UPDATE companyProfiles SET 
          companyName = ?, companyWebsite = ?, companyDescription = ?, industry = ?,
          products = ?, targetMarket = ?, headquarters = ?, estimatedSize = ?,
          keyDifferentiator = ?, salesStages = ?, avgDealSize = ?, avgDealCycle = ?,
          salesTeamSize = ?, icpIndustries = ?, icpCompanySize = ?, icpTitles = ?,
          icpPainPoints = ?, knowledgeBaseText = ?, onboardingCompleted = 1
        WHERE tenantId = ?`,
        [...companyData.slice(2), tenantId]
      );
      console.log("公司档案已更新");
    } else {
      await conn.execute(
        `INSERT INTO companyProfiles (tenantId, userId, companyName, companyWebsite, companyDescription, industry,
          products, targetMarket, headquarters, estimatedSize, keyDifferentiator, salesStages,
          avgDealSize, avgDealCycle, salesTeamSize, icpIndustries, icpCompanySize, icpTitles,
          icpPainPoints, knowledgeBaseText, onboardingCompleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        companyData
      );
      console.log("公司档案已创建");
    }

    // ════════════════════════════════════════════════════════════════════
    // 4. 清理旧数据
    // ════════════════════════════════════════════════════════════════════
    console.log("\n清理旧数据...");
    await conn.query("DELETE FROM stakeholderNeeds WHERE tenantId = ?", [tenantId]);
    await conn.query("DELETE FROM dealDimensions WHERE tenantId = ?", [tenantId]);
    await conn.query("DELETE FROM dealStrategyNotes WHERE tenantId = ?", [tenantId]);
    await conn.query("DELETE FROM snapshots WHERE tenantId = ?", [tenantId]);
    await conn.query("DELETE FROM nextActions WHERE tenantId = ?", [tenantId]);
    await conn.query("DELETE FROM meetings WHERE tenantId = ?", [tenantId]);
    await conn.query("DELETE FROM stakeholders WHERE tenantId = ?", [tenantId]);
    await conn.query("DELETE FROM deals WHERE tenantId = ?", [tenantId]);
    console.log("旧数据已清理");

    // ════════════════════════════════════════════════════════════════════
    // DEAL 1: 华锐汽车集团 — 焊装产线具身机器人项目
    // ════════════════════════════════════════════════════════════════════
    console.log("\n=== 创建交易 1：华锐汽车集团 焊装产线 ===");
    const [d1] = await conn.query(
      `INSERT INTO deals (tenantId, ownerId, name, company, website, stage, value, confidenceScore, daysInStage, lastActivity, companyInfo, isArchived, salesModel, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'meddic', NOW(), NOW())`,
      [
        tenantId,
        userId,
        "华锐汽车 合肥工厂焊装线 具身机器人项目",
        "华锐汽车集团",
        "https://www.huarui-auto.com",
        "Technical Evaluation",
        12000000,
        62,
        18,
        "POC方案评审会",
        "华锐汽车集团是中国新能源汽车头部企业，2024年全球销量突破120万辆。合肥工厂是其最大的生产基地，年产能40万辆。焊装车间目前使用传统六轴工业机器人（ABB+发那科），面临的核心痛点是：新车型导入周期长（每次换线需要2-3周停产调试）、焊点质检依赖人工抽检（漏检率约2%）、夜班用工困难（焊装车间高温高噪，年轻工人流失率超40%）。集团2025年发布「灯塔工厂」战略，要求合肥工厂在2026年底前实现关键工序的智能化升级。",
      ]
    );
    const deal1Id = d1.insertId;
    console.log("交易 1 已创建, ID:", deal1Id);

    // ── 关键人物 ──
    const d1Stakeholders = [
      [
        "陈志远",
        "合肥工厂厂长",
        "Decision Maker",
        "Positive",
        "High",
        "华锐汽车合肥工厂厂长，向集团制造副总裁直接汇报。2024年因推动合肥工厂产能爬坡至40万辆获得集团嘉奖。对「灯塔工厂」战略高度认同，明确表态焊装线智能化是今年的一号工程。在POC方案评审会上表示：「我不关心你们用什么技术路线，我只关心两件事：换线时间能不能从3周降到3天，质检漏检率能不能降到0.1%以下。」",
        "务实的结果导向型领导。对新技术持开放态度但要求看到硬数据。每周三下午固定巡视焊装车间，可以安排现场演示。个人爱好：高尔夫，周末常去合肥滨湖球场。",
        0.5,
        0.2,
      ],
      [
        "林雪梅",
        "智能制造部部长",
        "Champion",
        "Positive",
        "High",
        "智能制造部核心推动者，清华自动化系硕士，在华锐工作12年。主导了合肥工厂前两轮自动化升级（AGV物流+视觉质检），对具身智能机器人方向非常看好。主动联系我方安排了技术交流会，并在内部推动将具身机器人纳入2026年预算。在技术交流会上对「星脑」大模型的自然语言编程能力表现出极大兴趣，认为这是解决换线效率问题的关键。",
        "技术出身的管理者，能听懂技术细节也能讲商业价值。是我方在客户内部最重要的支持者。她透露陈厂长已经在集团会议上提过具身机器人方案，但CFO对ROI有疑虑。建议我们准备一份详细的TCO对比分析。",
        0.3,
        0.4,
      ],
      [
        "王建国",
        "焊装车间主任",
        "Evaluator",
        "Neutral",
        "High",
        "焊装车间一线负责人，在华锐工作20年，从焊工做起。对传统六轴机器人非常熟悉，对具身机器人持观望态度。核心顾虑是：「我们现在ABB的机器人虽然换线慢，但至少稳定。你们这个新东西，万一在产线上出了问题，一分钟的停线损失就是8万块。」在POC方案评审会上提出了非常具体的技术问题：焊枪夹持力控精度、高温环境下传感器漂移、与现有MES系统的数据对接。",
        "典型的一线技术专家，用数据说话。需要通过POC实测数据打消他的顾虑。他手下有3个班组长是关键意见领袖，如果班组长认可，王主任会转为支持。他女儿今年高考，最近压力比较大。",
        0.6,
        0.6,
      ],
      [
        "赵明辉",
        "集团采购总监",
        "Blocker",
        "Negative",
        "Medium",
        "集团采购总监，负责所有设备采购的商务谈判。态度强硬，在初次商务沟通中直接表示：「ABB和发那科给我们的价格是经过10年谈判磨出来的，你们一个创业公司凭什么报这个价？」要求我方提供至少3家同行业客户的成功案例，并且要求首年免费试用。在内部被称为「赵铁门」，以压价著称。",
        "纯商务导向，对技术不感兴趣。需要通过陈厂长的战略优先级来绕过他的价格壁垒。林雪梅透露赵明辉最近在跟ABB谈一个大框架协议，如果我们的项目影响了他跟ABB的谈判筹码，他会更加抵触。",
        0.8,
        0.7,
      ],
      [
        "刘芳",
        "集团CFO",
        "Influencer",
        "Neutral",
        "Low",
        "集团CFO，所有超过500万的资本支出需要她签字。目前没有直接参与项目讨论，但林雪梅透露她在集团月度经营会上问过「具身机器人的投资回报期是多少」。对新技术投资持谨慎态度，更关注财务指标（ROI、回收期、对产线OEE的影响）。",
        "关键的幕后影响者。虽然不直接参与技术评估，但她的财务审批是必经之路。需要准备一份她能看懂的财务模型（不要技术术语）。林雪梅建议通过陈厂长安排一次15分钟的汇报。",
        0.5,
        0.3,
      ],
    ];

    for (const [
      sName,
      title,
      role,
      sentiment,
      engagement,
      keyInsights,
      personalNotes,
      mapX,
      mapY,
    ] of d1Stakeholders) {
      await conn.query(
        `INSERT INTO stakeholders (dealId, tenantId, name, title, role, sentiment, engagement, keyInsights, personalNotes, mapX, mapY, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          deal1Id,
          tenantId,
          sName,
          title,
          role,
          sentiment,
          engagement,
          keyInsights,
          personalNotes,
          mapX,
          mapY,
        ]
      );
    }
    console.log("交易 1: 5 个关键人物已创建");

    // ── 会议记录 ──
    const d1Meetings = [
      // 1. 初次接触 - 林雪梅主动联系
      [
        "2025-11-05 10:00:00",
        "Discovery Call",
        "林雪梅",
        `【线上会议 - 腾讯会议】
参与人：林雪梅（智能制造部部长）、张伟（星辰具身智能）

会议背景：
林雪梅在2025世界智能制造大会上看到了星辰具身智能的展台演示，对「星行者 S1」的自然语言编程能力印象深刻，会后主动通过LinkedIn联系了我方。

会议内容：
林雪梅：「我们合肥工厂焊装线现在最头疼的问题就是换线。每次新车型导入，ABB的机器人要重新示教编程，光调试就要2-3周，产能损失巨大。你们在大会上演示的那个——用语音指令让机器人学会新动作，这个是真的还是演示效果？」

张伟：「林部长，这是真实的能力。我们的「星脑」大模型可以理解自然语言指令，结合少样本学习，让机器人在2-4小时内适配新工序。我们在某头部新能源车企的焊装线上已经验证过，换线时间从14天缩短到了6小时。」

林雪梅：「6小时？这个数据如果是真的，对我们来说价值巨大。我们合肥工厂今年要导入3款新车型，按现在的节奏，光换线停产损失就超过2000万。你们能不能安排一次现场技术交流？我想让我们焊装车间的王主任也看看。」

张伟：「完全可以。我们可以带一台S1样机过来做现场演示。另外，我注意到华锐去年发布了「灯塔工厂」战略，具身机器人跟这个战略方向是高度契合的。」

林雪梅：「对，灯塔工厂是陈厂长亲自抓的一号工程。如果你们的技术确实靠谱，我可以帮你们推到陈厂长那里。不过提前说好，我们这边采购流程比较严格，赵总监那关不好过。」

行动项：
- [张伟] 准备现场技术交流方案，重点准备焊装场景的演示脚本
- [张伟] 整理换线效率对比数据（传统六轴 vs 星行者）
- [林雪梅] 协调王建国主任的时间，安排11月中旬的现场交流`,
        60,
      ],

      // 2. 现场技术交流会
      [
        "2025-11-18 14:00:00",
        "Demo",
        "林雪梅, 王建国",
        `【现场技术交流 - 华锐汽车合肥工厂 焊装车间会议室】
参与人：林雪梅（智能制造部）、王建国（焊装车间主任）、李强（焊装班组长）、张伟、陈博士（星辰CTO）

演示环节：
陈博士现场演示了星行者S1在模拟焊装工位上的操作：
1. 语音指令演示：用中文对S1说「学习这个焊接路径」，S1通过视觉感知+力控引导，在3分钟内学会了一条新的焊接轨迹
2. 精度测试：S1重复焊接10次，位置重复精度达到±0.05mm，满足焊装要求
3. 异常处理：模拟工件偏移场景，S1自动检测偏移并调整焊接路径

王建国的反应：
王建国全程非常认真地观察，提出了几个尖锐问题：
- 「你们这个力控精度在高温环境下会不会漂移？焊装车间夏天能到45度。」
- 「焊枪夹持力是多少？我们现在ABB的夹持力是150N，你们能到多少？」
- 「跟我们现有的MES系统怎么对接？数据格式兼容吗？」

陈博士逐一回答，王建国对精度数据表示认可，但对高温环境下的稳定性保留意见：「数据是好看，但实验室和产线是两回事。你们敢不敢在我的产线上跑一个月？」

林雪梅总结：
「王主任的顾虑是合理的。我建议我们推动一个正式的POC，在焊装线选一个工位，让星行者跑一个完整的生产周期。张总，你们准备一个POC方案，我来推内部立项。」

行动项：
- [张伟] 一周内提交POC方案（含高温环境测试方案、MES对接方案）
- [陈博士] 准备高温环境下的传感器漂移补偿技术说明
- [林雪梅] 向陈厂长汇报技术交流成果，推动POC立项审批
- [王建国] 选定焊装线B区3号工位作为POC测试点`,
        120,
      ],

      // 3. 内部邮件 - POC方案提交
      [
        "2025-11-25 09:30:00",
        "Email",
        "林雪梅, 王建国, 陈志远",
        `【邮件 张伟→林雪梅, 王建国 | 抄送：陈志远】
主题：星辰具身智能 - 华锐合肥工厂焊装线POC方案（正式版）

林部长、王主任，您好：

感谢上周的现场交流，针对王主任提出的关键技术问题，我们已完成POC方案的编制。方案要点如下：

1. POC范围：焊装线B区3号工位，覆盖侧围焊接工序（含12个焊点）
2. 测试周期：30个自然日（含5天部署调试+25天连续生产验证）
3. 核心验证指标：
   - 换线时间：目标 < 4小时（对标当前14天）
   - 焊接精度：CPK ≥ 1.67（对标当前1.33）
   - 高温稳定性：45°C环境下连续8小时精度漂移 < 0.02mm
   - OEE提升：目标 ≥ 5%
4. MES对接：我方提供标准OPC UA接口，兼容华锐现有西门子MES
5. 投入：我方承担设备和技术团队费用，华锐提供工位和生产物料

详细方案见附件。期待各位领导审阅后安排评审会。

附件：
1. 华锐合肥焊装线POC实施方案_v2.1.pdf
2. 星行者S1高温环境技术白皮书.pdf
3. MES对接技术规格书.pdf`,
        10,
      ],

      // 4. POC方案评审会
      [
        "2025-12-03 14:00:00",
        "Technical Review",
        "陈志远, 林雪梅, 王建国",
        `【POC方案评审会 - 合肥工厂行政楼3楼会议室】
参与人：陈志远（厂长）、林雪梅（智能制造部）、王建国（焊装车间主任）、张伟、陈博士

会议记录：

1. 林雪梅开场：
简要回顾了11月技术交流的成果，重点强调了星行者S1在换线效率上的突破性优势。「如果POC验证成功，我们明年3款新车型的导入周期可以缩短60%以上，这对合肥工厂完成灯塔工厂目标至关重要。」

2. 陈志远的关注点：
陈厂长直接切入核心：「我不关心你们用什么技术路线，我只关心两件事：换线时间能不能从3周降到3天，质检漏检率能不能降到0.1%以下。你们的POC方案里，这两个指标的验证方法是什么？」

张伟详细解释了验证方法论，陈厂长表示认可，但补充了一个要求：「POC期间，我要求你们的技术团队每周给我一份数据报告，不要PPT，要原始数据。」

3. 王建国的技术审查：
王主任逐页审查了技术方案，对高温补偿方案提出了修改意见：「你们的温度补偿算法是基于线性模型的，但焊装车间的温度分布不均匀，靠近焊枪的局部温度可能到60度。建议增加一个非线性补偿模块。」陈博士当场表示可以在一周内完成算法升级。

王建国最后说：「方案我没有大的异议，但我有一个条件——POC期间必须有你们的工程师24小时驻场。出了任何问题，5分钟内必须响应。我的产线一分钟都停不起。」

4. 陈志远拍板：
「POC可以做。林部长负责内部立项，王主任负责现场配合。但我要提醒一点——如果POC数据不达标，这个项目就到此为止，不要浪费大家时间。另外，商务的事情等POC结果出来再谈，不要现在就让赵总监介入，免得节外生枝。」

行动项：
- [张伟] 一周内更新POC方案（加入非线性温度补偿）
- [陈博士] 完成温度补偿算法升级
- [林雪梅] 走内部POC立项流程（预计2周）
- [王建国] 安排B区3号工位12月中旬空出来
- [陈志远] 知会集团制造副总裁（走审批流程）`,
        90,
      ],

      // 5. 微信沟通 - 林雪梅透露内部情况
      [
        "2025-12-10 20:30:00",
        "WeChat",
        "林雪梅",
        `【微信消息 林雪梅→张伟】

林雪梅：张总，跟你说个情况。今天集团月度经营会上，刘芳（CFO）问了一句「那个机器人项目投资回报期是多少」。陈厂长当时没有准备这个数据，场面有点尴尬。

张伟：感谢林部长提醒。我们可以准备一份详细的TCO对比分析和ROI模型，方便陈厂长下次汇报用。

林雪梅：对，你最好准备两个版本。一个技术版给我和王主任看，一个财务版给刘芳看。刘总是学财务出身的，不要跟她讲技术，讲IRR、NPV、回收期就行。

张伟：明白。另外，赵总监那边有什么动静吗？

林雪梅：赵明辉最近在跟ABB谈一个3年的框架协议，涵盖合肥和武汉两个工厂。如果我们的项目做大了，可能会影响他跟ABB的谈判筹码，所以他肯定会阻挠。我建议你们先不要主动接触赵总监，等POC数据出来，用数据说话。

张伟：收到。POC立项进展怎么样？

林雪梅：流程在走了，预计下周能批下来。不过有个小插曲——王主任今天跟我说，他让他手下的李强班组长去调研了一下市面上其他具身机器人公司，发现优必选和宇树也有工业版本。他想多看看。

张伟：理解。我们对自己的技术有信心，欢迎对比。我可以准备一份竞品对比材料。

林雪梅：好，但不要做得太aggressive。王主任这个人，你越推他越退。让数据说话就好。`,
        15,
      ],

      // 6. POC启动会
      [
        "2025-12-20 09:00:00",
        "Site Visit",
        "林雪梅, 王建国, 李强",
        `【POC启动会 - 焊装车间B区3号工位现场】
参与人：林雪梅、王建国、李强（班组长）、张伟、陈博士、2名驻场工程师

会议记录：

1. 设备部署情况：
星行者S1已于12月18日运抵并完成安装调试。陈博士现场演示了升级后的非线性温度补偿算法，在模拟60°C局部高温下，精度漂移控制在0.015mm以内，优于方案承诺的0.02mm。王建国看了数据后点了点头，没说话。

2. 测试计划确认：
- 第1周（12/20-12/26）：基础功能验证（焊接精度、重复性、速度）
- 第2周（12/27-1/2）：换线测试（模拟新车型导入，目标4小时内完成）
- 第3-4周（1/3-1/16）：连续生产验证（7x24小时不间断运行）
- 每周五下午提交数据报告给陈厂长

3. 李强班组长的态度：
李强是王建国最信任的班组长，他的态度很关键。他在现场仔细观察了S1的操作后说：「这个机器人比ABB的灵活多了，但我担心一个问题——如果它出了故障，我们自己能修吗？ABB的机器人我们闭着眼睛都能排故障。」

张伟回应：「李师傅说得对，这也是我们重点考虑的。POC期间我们有工程师24小时驻场。同时我们会培训你们的维护团队，目标是POC结束时，你们的人能独立处理80%的常见问题。」

李强：「行，那我看看。」

4. 王建国的补充要求：
「POC期间，3号工位的产品全部要经过我们的人工复检。如果机器人焊的产品出了质量问题，我要第一时间知道。」

行动项：
- [驻场工程师] 每日数据采集+异常记录
- [张伟] 每周五提交数据报告
- [陈博士] 安排维护培训（第2周开始）
- [李强] 安排2名技工跟班学习`,
        90,
      ],

      // 7. POC第二周 - 换线测试
      [
        "2026-01-02 16:00:00",
        "Phone Call",
        "林雪梅",
        `【电话 林雪梅→张伟】

林雪梅：张总，今天换线测试的结果怎么样？

张伟：林部长，好消息！今天上午我们做了换线测试，从A车型切换到B车型的侧围焊接工序，S1用了3小时22分钟完成全部12个焊点的重新学习和验证。比目标的4小时快了将近40分钟。

林雪梅：太好了！王主任知道吗？

张伟：王主任全程在现场看的。他没说好也没说不好，但我注意到他拍了几张照片发到了他的工作群里。

林雪梅：哈哈，王主任发照片就是认可了。他这个人不会当面夸你的。对了，我跟你说个事——陈厂长看了第一周的数据报告，非常满意。他今天在管理层会上说了一句「这个机器人项目有戏」。

张伟：这是个好信号。不过我们还有两周的连续运行测试，不能掉以轻心。

林雪梅：对。另外，我听说赵明辉已经知道这个项目了。他跟采购部的人说「又是一个烧钱的玩具」。你们要做好准备，POC一结束他肯定会在商务上卡你们。

张伟：明白。我们已经在准备TCO分析和ROI模型了，到时候用数据跟他谈。

林雪梅：还有一件事——刘芳下周要来合肥工厂视察。陈厂长想安排她顺便看一下POC现场。你们能不能准备一个10分钟的简短汇报？记住，只讲财务数据，不要讲技术。

张伟：没问题，我们会准备好的。`,
        20,
      ],

      // 8. CFO现场视察
      [
        "2026-01-08 15:00:00",
        "Executive Briefing",
        "刘芳, 陈志远, 林雪梅",
        `【CFO现场视察 - 焊装车间B区3号工位】
参与人：刘芳（集团CFO）、陈志远（厂长）、林雪梅、张伟

汇报内容（10分钟精简版）：

张伟用一页纸汇报了POC阶段性成果：
- 换线时间：3.4小时（对标传统14天，降低98%）
- 焊接精度CPK：1.72（对标要求1.67，超标3%）
- 连续运行：已稳定运行12天，零停机
- 预估年化节省：单工位节省人工+停线损失约380万元/年

刘芳的反应：
刘芳听完后问了三个问题：
1. 「一台机器人多少钱？回收期多久？」
   张伟：「单台含软件约240万，按单工位380万/年的节省计算，回收期约7.6个月。」
   
2. 「如果全面推广到整条焊装线，总投资是多少？」
   张伟：「焊装线共24个工位，分两期部署的话，总投资约4800万，但年化节省超过9000万。」
   
3. 「你们公司成立才2年，怎么保证5年后还在？售后服务怎么办？」
   张伟：「我们已完成A轮融资，账上资金充足。同时我们可以在合同中约定源代码托管和技术转移条款，确保华锐的长期利益。」

刘芳没有当场表态，但对陈志远说：「数据还不错，等POC全部结束后，让财务部做一个独立的投资评估。」

陈志远：「好，POC还有一周多就结束了。林部长，你跟张总对接，POC结束后一周内出完整报告。」

行动项：
- [张伟] 准备完整的财务模型（含5年TCO、NPV、IRR分析）
- [林雪梅] 协调财务部做独立投资评估
- [张伟] 准备源代码托管和技术转移方案（应对刘芳的顾虑）`,
        30,
      ],
    ];

    for (const [date, type, participant, summary, duration] of d1Meetings) {
      await conn.query(
        `INSERT INTO meetings (dealId, tenantId, date, type, keyParticipant, summary, duration, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [deal1Id, tenantId, date, type, participant, summary, duration]
      );
    }
    console.log("交易 1: 8 条会议记录已创建");

    // ── 策略笔记（内部） ──
    const d1StrategyNotes = [
      [
        "internal",
        `【内部销售策略 2025-11-06】记录人：张伟

华锐汽车合肥工厂是我们2025年最重要的标杆客户机会。如果拿下，对我们的意义：
1. 品牌背书：华锐是新能源汽车TOP3，他们用了我们的产品，其他车企会跟进
2. 规模效应：合肥工厂24个焊装工位，全面部署的话是4800万的大单
3. 复制模板：华锐还有武汉、成都两个工厂，成功后可以横向复制

关键风险：
- 赵明辉（采购总监）是最大阻力，需要通过陈厂长的战略优先级来压制
- 刘芳（CFO）对ROI敏感，需要准备扎实的财务模型
- 王建国（车间主任）是技术把关人，必须用POC数据说服他
- 竞品风险：优必选和宇树可能会被引入对比

核心策略：先通过POC建立技术信任，再用数据驱动商务谈判。不要过早暴露底价。`,
      ],
      [
        "competitive",
        `【竞品分析 2025-12-12】记录人：张伟

林雪梅透露王建国让人调研了优必选和宇树的工业机器人方案。我的分析：

1. 优必选 Walker S：
   - 优势：品牌知名度高，人形机器人概念吸引眼球
   - 劣势：工业场景落地案例极少，焊装精度达不到要求（±0.1mm vs 我们的±0.05mm）
   - 判断：更适合展示和轻量级场景，不是焊装线的真正竞争对手

2. 宇树 B2-W：
   - 优势：价格便宜（约我们的60%），四足机器人在巡检场景有优势
   - 劣势：没有力控操作能力，无法完成焊接等精密操作
   - 判断：跟我们不在同一个赛道，但可能被采购部拿来压价

3. ABB/发那科（现有供应商）：
   - 最大威胁：赵明辉正在谈ABB框架协议，如果ABB推出「快速换线」方案，会直接威胁我们的核心卖点
   - 应对：ABB的换线方案仍然需要专业工程师编程，无法做到自然语言指令，这是我们的护城河

结论：我们的核心差异化在于「星脑大模型+力控操作」的组合，这是目前市面上唯一能在焊装场景实现自然语言编程的方案。POC数据是最好的武器。`,
      ],
      [
        "pricing",
        `【定价策略内部对齐 2025-12-15】参与人：CEO王磊、CTO陈博士、张伟

1. 报价策略：
   - 单台标价280万（含硬件+星脑OS授权+首年维保）
   - 底价：单台不低于220万（毛利率红线40%）
   - 批量折扣：10台以上9折，20台以上85折
   
2. 谈判筹码：
   - 可以让步：首年维保免费（价值约30万/台）、驻场工程师延长至3个月
   - 不能让步：星脑OS授权费（这是我们的核心利润来源）、源代码交付（只能托管，不能交付）
   
3. 应对赵明辉的压价：
   - 准备ABB/发那科的TCO对比（含换线停产损失、人工成本、维保费用）
   - 强调我们是「投资」不是「成本」——7.6个月回收期的故事要讲好
   - 如果赵明辉要求免费试用，可以提出「成功付费」模式：POC达标后再签正式合同

4. CEO王磊的指示：
   「华锐是我们的战略客户，可以在利润上适当让步，但不能赔本赚吆喝。底线是单台220万。如果对方要求低于这个价格，我亲自出面谈。」`,
      ],
    ];

    for (const [category, content] of d1StrategyNotes) {
      await conn.query(
        `INSERT INTO dealStrategyNotes (dealId, tenantId, category, content, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [deal1Id, tenantId, category, content]
      );
    }
    console.log("交易 1: 3 条策略笔记已创建");

    // ════════════════════════════════════════════════════════════════════
    // DEAL 2: 鼎盛精密电子 — 3C组装线具身机器人项目（早期阶段）
    // ════════════════════════════════════════════════════════════════════
    console.log("\n=== 创建交易 2：鼎盛精密电子 ===");
    const [d2] = await conn.query(
      `INSERT INTO deals (tenantId, ownerId, name, company, website, stage, value, confidenceScore, daysInStage, lastActivity, companyInfo, isArchived, salesModel, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'meddic', NOW(), NOW())`,
      [
        tenantId,
        userId,
        "鼎盛精密 昆山工厂 3C组装线智能化",
        "鼎盛精密电子科技集团",
        "https://www.dingsheng-tech.com",
        "Demo",
        6500000,
        40,
        8,
        "技术交流会",
        "鼎盛精密电子是全球TOP5的消费电子代工企业，年营收超过800亿元，客户包括苹果、三星、小米等。昆山工厂是其最大的3C组装基地，员工超过3万人。核心痛点：3C产品迭代极快（平均6个月一代），每次换线需要大量重新编程和调试；同时面临严重的用工荒，年轻工人流失率超过50%。集团2025年提出「少人化工厂」战略，计划3年内将产线工人减少30%。",
      ]
    );
    const deal2Id = d2.insertId;
    console.log("交易 2 已创建, ID:", deal2Id);

    // 关键人物
    const d2Stakeholders = [
      [
        "孙浩然",
        "昆山工厂总经理",
        "Decision Maker",
        "Neutral",
        "Medium",
        "昆山工厂总经理，对智能化转型有兴趣但态度谨慎。在初次会面中表示：「我们每年在自动化上投入超过2亿，但真正落地的项目不到一半。你们跟之前来推销的那些机器人公司有什么不同？」需要用差异化的价值主张打动他。",
        "务实的职业经理人，不喜欢被忽悠。需要看到同行业的成功案例。他之前被一家AGV公司坑过（项目烂尾），所以对创业公司有戒心。",
        0.5,
        0.3,
      ],
      [
        "周婷",
        "自动化工程部经理",
        "Influencer",
        "Positive",
        "High",
        "自动化工程部经理，MIT机械工程硕士，海归背景。对具身智能机器人技术非常感兴趣，在技术交流会上问了很多深入的问题。她认为传统工业机器人已经到了瓶颈，具身智能是下一个方向。主动提出要安排一次更深入的技术对接。",
        "技术型人才，有国际视野。可以发展为Champion。她在公司内部有一定话语权，孙总比较信任她的技术判断。",
        0.4,
        0.5,
      ],
      [
        "马国强",
        "组装车间主管",
        "User",
        "Negative",
        "Low",
        "组装车间主管，在鼎盛工作15年。对任何新技术都持抵触态度：「我管3000个工人，你让我换机器人，这些人怎么办？工会那边你们搞得定吗？」核心担忧是自己的管理权会被削弱。",
        "需要小心处理。不能直接对抗，要让他感觉机器人是帮他而不是替代他。可以强调「人机协作」而不是「无人化」。",
        0.7,
        0.7,
      ],
    ];

    for (const [
      sName,
      title,
      role,
      sentiment,
      engagement,
      keyInsights,
      personalNotes,
      mapX,
      mapY,
    ] of d2Stakeholders) {
      await conn.query(
        `INSERT INTO stakeholders (dealId, tenantId, name, title, role, sentiment, engagement, keyInsights, personalNotes, mapX, mapY, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          deal2Id,
          tenantId,
          sName,
          title,
          role,
          sentiment,
          engagement,
          keyInsights,
          personalNotes,
          mapX,
          mapY,
        ]
      );
    }
    console.log("交易 2: 3 个关键人物已创建");

    // 会议记录
    const d2Meetings = [
      [
        "2026-02-10 10:00:00",
        "Discovery Call",
        "周婷",
        `【线上会议 - 飞书】
参与人：周婷（自动化工程部经理）、张伟

会议背景：
周婷在CES 2026上看到了星辰具身智能的展示，通过官网提交了合作意向。

会议内容：
周婷介绍了鼎盛的痛点：3C产品迭代快，每次换线成本高。她特别关注S1的柔性操作能力——3C组装需要处理很多精密小零件（螺丝、排线、连接器），传统机器人做不了。

张伟介绍了S1在精密操作方面的能力，特别是0.1N力控精度在柔性装配中的优势。

周婷：「听起来很有意思。但我需要看到实际的3C场景演示，不是焊装那种大件操作。你们能不能针对手机组装做一个demo？」

行动项：
- [张伟] 准备3C组装场景的定制demo（手机后盖装配+排线插接）
- [周婷] 安排孙总参加下次技术交流会`,
        45,
      ],
      [
        "2026-02-20 14:00:00",
        "Demo",
        "孙浩然, 周婷, 马国强",
        `【现场技术交流 - 鼎盛昆山工厂】
参与人：孙浩然（总经理）、周婷（自动化工程部）、马国强（组装车间主管）、张伟、陈博士

演示环节：
陈博士演示了S1在3C组装场景的操作：手机后盖精密装配（0.3mm间隙对位）和排线柔性插接。S1通过视觉+力控实现了98.5%的一次成功率。

孙浩然的反应：
「成功率98.5%，意味着每100台有1.5台要返工。我们现在人工的一次成功率是99.2%。你们怎么解决这个差距？」

马国强的反应：
全程沉默，最后说了一句：「我管3000个工人，你让我换机器人，这些人怎么办？」

周婷的总结：
「精度还需要提升，但方向是对的。我建议我们先选一个非关键工序做试点，降低风险。」

行动项：
- [张伟] 优化3C场景的视觉算法，目标一次成功率提升到99.5%
- [周婷] 筛选适合试点的非关键工序
- [张伟] 准备「人机协作」方案（回应马国强的顾虑）`,
        90,
      ],
    ];

    for (const [date, type, participant, summary, duration] of d2Meetings) {
      await conn.query(
        `INSERT INTO meetings (dealId, tenantId, date, type, keyParticipant, summary, duration, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [deal2Id, tenantId, date, type, participant, summary, duration]
      );
    }
    console.log("交易 2: 2 条会议记录已创建");

    // ════════════════════════════════════════════════════════════════════
    // 验证
    // ════════════════════════════════════════════════════════════════════
    const [verify] = await conn.execute(
      "SELECT u.id, u.email, u.name, u.passwordHash IS NOT NULL as hasPassword, tm.tenantId FROM users u LEFT JOIN tenantMembers tm ON u.id = tm.userId WHERE u.email = ?",
      [email]
    );
    console.log("\n=== 验证结果 ===");
    console.log("用户信息:", verify[0]);

    const [dealCount] = await conn.execute(
      "SELECT COUNT(*) as cnt FROM deals WHERE tenantId = ?",
      [tenantId]
    );
    const [stakeholderCount] = await conn.execute(
      "SELECT COUNT(*) as cnt FROM stakeholders WHERE tenantId = ?",
      [tenantId]
    );
    const [meetingCount] = await conn.execute(
      "SELECT COUNT(*) as cnt FROM meetings WHERE tenantId = ?",
      [tenantId]
    );
    const [noteCount] = await conn.execute(
      "SELECT COUNT(*) as cnt FROM dealStrategyNotes WHERE tenantId = ?",
      [tenantId]
    );

    console.log(`交易数: ${dealCount[0].cnt}`);
    console.log(`关键人物数: ${stakeholderCount[0].cnt}`);
    console.log(`会议记录数: ${meetingCount[0].cnt}`);
    console.log(`策略笔记数: ${noteCount[0].cnt}`);

    console.log("\n✅ 中文 Demo 账号已就绪！");
    console.log(`   邮箱: ${email}`);
    console.log(`   密码: ${password}`);
    console.log(`   公司: 星辰具身智能科技有限公司`);
    console.log(`   交易 1: 华锐汽车 合肥工厂焊装线 (技术评估阶段, ¥1200万)`);
    console.log(`   交易 2: 鼎盛精密 昆山工厂3C组装线 (演示阶段, ¥650万)`);
  } catch (error) {
    console.error("错误:", error);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
