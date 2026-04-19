/* ─── i18n: Landing + Pricing translations & locale-specific images ─── */
/* Uses the same Language type from LanguageContext ("en" | "zh") */

import type { Language } from "@/contexts/LanguageContext";

/* ─── Image URLs per locale ─── */
export const images = {
  en: {
    hero: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/hero-en-light-v4_24831889.png",
    featureInsight: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-insight-en-light-v4_c43b2426.png",
    featureMap: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-map-en-light-v4_d24cd793.png",
    featureRoom: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-room-en-light-v4_580f18fa.png",
    productMockup: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/product-mockup-bg-2x_35ae52f0.png",
  },
  zh: {
    hero: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/hero-zh-light-v4_ac963f49.png",
    featureInsight: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-insight-zh-light-v4_a66adf65.png",
    featureMap: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-map-zh-light-v4_9eaf39f4.png",
    featureRoom: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-room-zh-light-v4_95941fac.png",
    productMockup: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/product-mockup-bg-2x_35ae52f0.png",
  },
} as const;

/* ─── Translation strings ─── */
export const translations = {
  en: {
    /* ─── Landing: Nav ─── */
    nav_features: "Product",
    nav_how: "How It Works",
    nav_results: "Results",
    nav_pricing: "Pricing",
    nav_team: "Team",
    nav_login: "Log In",
    nav_dashboard: "Dashboard",
    nav_request_access: "Request Access",

    /* ─── Landing: Hero ─── */
    hero_title_1: "Navigate every deal.",
    hero_title_2: "Close with confidence.",
    hero_subtitle:
      "Meridian is an AI decision engine for complex B2B sales. It tells you who to talk to, what to say, and what to do next.",
    hero_cta_primary: "Request Early Access",

    /* ─── Landing: Pain Point ─── */
    pain_label: "The Problem",
    pain_title_1: "A $500K deal. Nine decision-makers.",
    pain_title_2: "What's your next move?",
    pain_desc: "The real intelligence is scattered across chat groups, emails, meeting notes, CRM records, and your head. No single view. No clear path. Just guesswork.",
    pain_item1_title: "Invisible buying committees",
    pain_item1_desc: "You don't know who's really deciding, who's blocking, or who you haven't met yet.",
    pain_item2_title: "Insights trapped in conversations",
    pain_item2_desc: "Critical signals from calls and emails never make it into your deal strategy.",
    pain_item3_title: "Reactive deal management",
    pain_item3_desc: "By the time you realize a deal is at risk, it's already too late.",

    /* ─── Landing: Product ─── */
    product_label: "The Product",
    product_title_1: "Your AI ",
    product_title_2: "Sales Strategist.",
    product_desc: "Meridian reads every signal across your deal — then tells you exactly what to do next.",
    product_cap1_title: "Auto-generate strategy",
    product_cap1_desc: "Feed it a deal. Get a battle plan based on your sales process.",
    product_cap2_title: "Multi-thread penetration",
    product_cap2_desc: "Leverage internal experience and public intel to find breakthrough angles.",
    product_cap3_title: "Proactive alerts",
    product_cap3_desc: "When the situation changes, Meridian pushes updates. No waiting for you to ask.",

    /* ─── Landing: Decision Map ─── */
    dmap_label: "Decision Map",
    dmap_title_1: "See the entire deal.",
    dmap_title_2: "At a glance.",
    dmap_item1_title: "Six dimensions",
    dmap_item1_desc: "Tech validation, business breakthrough, executive push, competitive defense, budget, and case support.",
    dmap_item2_title: "Stakeholder clarity",
    dmap_item2_desc: "Every person's role, stance, and influence. Who supports you. Who's blocking.",
    dmap_item3_title: "Spot the bottleneck",
    dmap_item3_desc: "Red = blocked. Green = done. Blue = in progress. No more digging through chat logs.",

    /* ─── Landing: Results ─── */
    results_label: "Results",
    results_title_1: "After using Meridian",
    results_stat1_value: "-35%",
    results_stat1_label: "Sales cycle reduction",
    results_stat1_desc: "From first contact to close",
    results_stat2_value: "3mo → 4d",
    results_stat2_label: "New rep ramp-up",
    results_stat2_desc: "From 3 months to 4 days to work independently",
    results_stat3_value: "Minutes",
    results_stat3_label: "Bottleneck detection",
    results_stat3_desc: "From gut feeling to automatic early warning",
    results_quote: "The key is those 34 idle days — what should my reps be doing? Meridian gave them a Todo list.",
    results_quote_attr: "CEO, $100M+ annual revenue customer · 300+ active deals",

    /* ─── Landing: How It Works ─── */
    how_label: "How It Works",
    how_title: "4 weeks to go live. Pay for results.",
    how_week1_title: "Business Deconstruction",
    how_week1_desc: "Map your deal flow and decision chains. Select 2-3 high-value target deals.",
    how_week2_title: "Data Integration",
    how_week2_desc: "Read-only access to existing systems (CRM, Feishu/DingTalk, email). Zero workflow disruption.",
    how_week3_title: "First Delivery",
    how_week3_desc: "Deliver the first deal battle briefing — complete with decision map and penetration strategy.",
    how_week4_title: "Full Rollout",
    how_week4_desc: "Team goes live. Weekly action recommendations. Continuous optimization.",
    how_security: "Data security: Read-only access. Encrypted transmission. Strict isolation. IT-controlled permissions. Supports private deployment.",

    /* ─── Landing: Team section ─── */
    team_label: "Our Team",
    team_title_1: "Built by people who've ",
    team_title_2: "lived the problem.",
    team_p1: "We've spent years running complex enterprise deals — managing buying committees, navigating multi-threaded negotiations, and losing sleep over pipeline reviews.",
    team_p2: "We built Meridian because we believe deal intelligence shouldn't be trapped in spreadsheets and tribal knowledge. Every deal tells a story. We're building the AI that reads it.",
    team_backed: "Backed by",

    /* ─── Landing: Bottom CTA ─── */
    cta_title_1: "Stop guessing.",
    cta_title_2: "Make every deal evidence-based.",
    cta_subtitle: "Join the waitlist for early access. We're onboarding select teams tackling complex, multi-stakeholder deals.",
    cta_button: "Request Early Access",
    cta_subtext: "No credit card required. We'll reach out within 48 hours.",

    /* ─── Landing: Footer ─── */
    footer_copyright: "Meridian. All rights reserved.",
    footer_email: "leo@meridianos.ai",

    /* ─── Pricing: Hero ─── */
    pricing_badge: "Simple, Transparent Pricing",
    pricing_title_1: "Intelligence that ",
    pricing_title_highlight: "pays for itself.",
    pricing_subtitle:
      "Credit-based pricing that scales with your usage. Every insight generated consumes credits — so you only pay for the intelligence you actually use.",

    /* ─── Pricing: Plans ─── */
    plan_pro_name: "Pro",
    plan_pro_tagline: "For sales teams closing complex, multi-stakeholder deals",
    plan_pro_price: "$149",
    plan_pro_period: "per user / month",
    plan_pro_badge: "Most Popular",
    plan_pro_credits_note: "1,000 AI credits included monthly — additional packs available",
    plan_pro_features: [
      "1,000 AI credits included per month",
      "Unlimited active deals",
      "AI deal insight generation & confidence scoring",
      "Full stakeholder map with relationship connections",
      "Unlimited meeting transcript uploads",
      "All sales methodologies (MEDDIC, BANT, SPICED, custom)",
      "Deal room with full activity timeline",
      "Pre-meeting briefs per stakeholder",
      "AI-suggested next actions & risk alerts",
      "Team collaboration (up to 10 users)",
      "Priority email support",
    ],

    plan_enterprise_name: "Enterprise",
    plan_enterprise_tagline: "For revenue organizations at scale",
    plan_enterprise_price: "Custom",
    plan_enterprise_period: "",
    plan_enterprise_features: [
      "Everything in Pro",
      "Unlimited AI credits",
      "Unlimited team members",
      "CRM integration (Salesforce, HubSpot)",
      "Custom AI model training on your playbook",
      "SSO / SAML authentication",
      "Advanced analytics & reporting",
      "Dedicated customer success manager",
      "Custom SLA & uptime guarantee",
      "On-premise deployment option",
      "API access for custom workflows",
    ],

    request_access: "Request Access",
    talk_to_sales: "Talk to Sales",

    /* ─── Pricing: How Credits Work ─── */
    credits_badge: "How Credits Work",
    credits_title: "Pay for intelligence, not seats",
    credits_item1_label: "Credit-based usage",
    credits_item1_desc: "Each insight consumes credits based on complexity",
    credits_item2_label: "1,000 credits/mo",
    credits_item2_desc: "Included with every Pro seat",
    credits_item3_label: "Team collaboration",
    credits_item3_desc: "Share insights across your team",
    credits_item4_label: "Enterprise security",
    credits_item4_desc: "SOC 2, SSO, data isolation",

    /* ─── Pricing: FAQ ─── */
    faq_badge: "FAQ",
    faq_title: "Frequently asked questions",
    faqs: [
      {
        q: "How do AI credits work?",
        a: "Each time Meridian generates an insight — such as a deal analysis, stakeholder brief, or next-action recommendation — it consumes a certain number of credits depending on the complexity. The Pro plan includes 1,000 credits per user per month, which is enough for most active sales teams. Additional credit packs can be purchased if needed.",
      },
      {
        q: "Can I switch plans at any time?",
        a: "Yes. You can upgrade from Pro to Enterprise at any time. When upgrading, you get immediate access to new features. Contact our sales team to discuss the transition.",
      },
      {
        q: "What counts as an 'active deal'?",
        a: "An active deal is any deal that hasn't been marked as Closed Won or Closed Lost. Both Pro and Enterprise plans include unlimited active deals.",
      },
      {
        q: "Do you offer discounts for annual billing?",
        a: "Yes — annual billing saves you 20% compared to monthly. Contact us for annual pricing details on both Pro and Enterprise plans.",
      },
      {
        q: "How does the AI work with my data?",
        a: "Meridian uses state-of-the-art language models to analyze your meeting transcripts, notes, and deal context. Your data is encrypted in transit and at rest, and is never used to train models. Each tenant's data is fully isolated.",
      },
      {
        q: "What CRM integrations are available?",
        a: "CRM integrations (Salesforce, HubSpot) are available on the Enterprise plan. We're building native two-way sync that keeps your CRM updated automatically. Pro plan users can export data via CSV and API.",
      },
    ],

    /* ─── Pricing: Bottom CTA ─── */
    pricing_cta_title_1: "Ready to close deals with ",
    pricing_cta_title_highlight: "confidence",
    pricing_cta_subtitle:
      "Start with Pro and see how AI-powered deal intelligence transforms your win rate.",

    /* ─── WaitlistDialog ─── */
    waitlist_title: "Request Early Access",
    waitlist_desc: "Join the waitlist for Meridian's AI decision engine for complex B2B sales.",
    waitlist_email_label: "Work Email",
    waitlist_name_label: "Full Name",
    waitlist_company_label: "Company",
    waitlist_phone_label: "Phone Number",
    waitlist_wechat_label: "WeChat ID",
    waitlist_email_placeholder: "you@company.com",
    waitlist_name_placeholder: "Jane Smith",
    waitlist_company_placeholder: "Acme Corp",
    waitlist_phone_placeholder: "+1 (555) 000-0000",
    waitlist_wechat_placeholder: "Your WeChat ID",
    waitlist_submit: "Request Access",
    waitlist_submitting: "Submitting...",
    waitlist_error: "Something went wrong. Please try again.",
    waitlist_success_title: "You're on the List!",
    waitlist_success_already: "You're Already on the List!",
    waitlist_success_desc: "Thank you for your interest in Meridian. We'll reach out soon with early access details.",
    waitlist_success_already_desc: "We already have your request. Our team will reach out soon with next steps.",
    waitlist_got_it: "Got it",
  },

  zh: {
    /* ─── Landing: Nav ─── */
    nav_features: "产品",
    nav_how: "如何上线",
    nav_results: "效果",
    nav_pricing: "定价",
    nav_team: "团队",
    nav_login: "登录",
    nav_dashboard: "进入控制台",
    nav_request_access: "申请体验",

    /* ─── Landing: Hero ─── */
    hero_title_1: "给你的每一笔销售订单，",
    hero_title_2: "都装上导航。",
    hero_subtitle:
      "子午线是复杂B2B销售的AI决策引擎。告诉你该找谁、该说什么、下一步该做什么。",
    hero_cta_primary: "申请抢先体验",

    /* ─── Landing: Pain Point ─── */
    pain_label: "痛点",
    pain_title_1: "¥500万订单，九个决策人，",
    pain_title_2: "下一步该做什么？",
    pain_desc: "真正的情报散落在群聊、邮件、会议纪要、CRM 和你的脑子里。没有全局视图，没有清晰路径，只有猜测。",
    pain_item1_title: "看不见的采购委员会",
    pain_item1_desc: "你不知道谁在真正做决策、谁在阻碍、谁还没有接触过。",
    pain_item2_title: "洞察被困在对话中",
    pain_item2_desc: "来自电话和邮件的关键信号从未进入你的交易策略。",
    pain_item3_title: "被动的交易管理",
    pain_item3_desc: "当你意识到交易有风险时，往往已经来不及了。",

    /* ─── Landing: Product ─── */
    product_label: "产品",
    product_title_1: "你的AI",
    product_title_2: "销售军师。",
    product_desc: "子午线读取交易中的每一个信号，然后精确告诉你下一步该做什么。",
    product_cap1_title: "输入交易，自动生成策略",
    product_cap1_desc: "给它一笔交易，自动生成基于你的销售流程的作战策略。",
    product_cap2_title: "多线程渗透策略",
    product_cap2_desc: "基于内部经验和外部公开信息源检索，寻找突破口，加速交易。",
    product_cap3_title: "主动推送，不等你来问",
    product_cap3_desc: "局势变化时自动推送更新，不错过任何关键窗口。",

    /* ─── Landing: Decision Map ─── */
    dmap_label: "决策全景图",
    dmap_title_1: "看清整笔交易。",
    dmap_title_2: "一目了然。",
    dmap_item1_title: "六个维度拆解",
    dmap_item1_desc: "技术验证、商务突破、高层推动、竞对防御、预算推进、案例支撑。",
    dmap_item2_title: "决策人关系一目了然",
    dmap_item2_desc: "每个人的角色、态度、影响力。谁支持你，谁在阻碍。",
    dmap_item3_title: "哪里卡住，一眼看出",
    dmap_item3_desc: "红色阻塞、绿色完成、蓝色进行中。不需要翻聊天记录。",

    /* ─── Landing: Results ─── */
    results_label: "效果",
    results_title_1: "用了子午线后...",
    results_stat1_value: "-35%",
    results_stat1_label: "销售周期缩短",
    results_stat1_desc: "从首次接触到最初成单",
    results_stat2_value: "3个月→4天",
    results_stat2_label: "新人上手时间",
    results_stat2_desc: "从3个月压缩到4天独立打单",
    results_stat3_value: "分钟级",
    results_stat3_label: "卡点判断",
    results_stat3_desc: "从靠经验判断变为自动预警",
    results_quote: "关键是这34天空白期，我的销售该做什么？它直接给了Todo。",
    results_quote_attr: "年营收过亿客户CEO · 300+条在途交易",

    /* ─── Landing: How It Works ─── */
    how_label: "如何上线",
    how_title: "4周上线，按效果说话。",
    how_week1_title: "业务解构",
    how_week1_desc: "梳理你的交易流程和决策链路，选定2-3笔高价值目标交易。",
    how_week2_title: "数据接入",
    how_week2_desc: "只读接入现有系统（CRM、飞书/钉钉、邮件），不改变你的任何工作流。",
    how_week3_title: "首次交付",
    how_week3_desc: "交付第一份交易作战简报，包含决策人图谱和渗透策略。",
    how_week4_title: "全员上线",
    how_week4_desc: "团队开始使用，每周收到行动建议，持续优化。",
    how_security: "数据安全：所有数据只读接入、传输加密、严格隔离。权限由你的IT团队控制，随时可撤回。支持私有化部署。",

    /* ─── Landing: Team section ─── */
    team_label: "我们的团队",
    team_title_1: "由",
    team_title_2: "亲历过这些问题的人打造。",
    team_p1: "我们在企业级销售的战壕中摸爬滚打多年——运营复杂交易、管理采购委员会、为 Pipeline Review 彻夜难眠。",
    team_p2: "我们创建子午线，是因为我们相信交易智能不应该被困在电子表格和口口相传的经验中。每笔交易都在讲述一个故事。我们正在构建能读懂这个故事的 AI。",
    team_backed: "投资方",

    /* ─── Landing: Bottom CTA ─── */
    cta_title_1: "别再猜了，",
    cta_title_2: "让每一笔交易都有据可依。",
    cta_subtitle: "加入等候名单获取抢先体验资格。我们正在邀请攻克复杂、多决策人交易的精选团队。",
    cta_button: "申请抢先体验",
    cta_subtext: "无需信用卡。我们将在 48 小时内联系您。",

    /* ─── Landing: Footer ─── */
    footer_copyright: "子午线 Meridian. 保留所有权利。",
    footer_email: "leo@meridianos.ai",

    /* ─── Pricing: Hero ─── */
    pricing_badge: "简洁透明的定价",
    pricing_title_1: "让智能",
    pricing_title_highlight: "为自己买单。",
    pricing_subtitle:
      "基于 Credit 的弹性定价，随用量扩展。每次生成洞察消耗 Credit——你只为实际使用的智能付费。",

    /* ─── Pricing: Plans ─── */
    plan_pro_name: "Pro",
    plan_pro_tagline: "适合攻克复杂、多决策人交易的销售团队",
    plan_pro_price: "$149",
    plan_pro_period: "每用户 / 月",
    plan_pro_badge: "最受欢迎",
    plan_pro_credits_note: "每月含 1,000 AI Credits — 可购买额外包",
    plan_pro_features: [
      "每月含 1,000 AI Credits",
      "不限活跃交易数量",
      "AI 交易洞察生成与置信度评分",
      "完整的决策人关系图谱",
      "不限会议录音上传",
      "全部销售方法论（MEDDIC、BANT、SPICED、自定义）",
      "交易室与完整活动时间线",
      "按决策人的会前简报",
      "AI 推荐的下一步行动与风险预警",
      "团队协作（最多 10 人）",
      "优先邮件支持",
    ],

    plan_enterprise_name: "Enterprise",
    plan_enterprise_tagline: "适合规模化的营收组织",
    plan_enterprise_price: "定制",
    plan_enterprise_period: "",
    plan_enterprise_features: [
      "包含 Pro 的全部功能",
      "不限 AI Credits",
      "不限团队成员",
      "CRM 集成（Salesforce、HubSpot）",
      "基于你的 Playbook 的定制 AI 模型训练",
      "SSO / SAML 身份认证",
      "高级分析与报表",
      "专属客户成功经理",
      "定制 SLA 与可用性保障",
      "私有化部署选项",
      "API 接口支持自定义工作流",
    ],

    request_access: "申请体验",
    talk_to_sales: "联系销售",

    /* ─── Pricing: How Credits Work ─── */
    credits_badge: "Credit 机制",
    credits_title: "为智能付费，而非按人头",
    credits_item1_label: "按用量计费",
    credits_item1_desc: "每次洞察按复杂度消耗 Credit",
    credits_item2_label: "1,000 Credits/月",
    credits_item2_desc: "每个 Pro 席位包含",
    credits_item3_label: "团队协作",
    credits_item3_desc: "团队共享洞察成果",
    credits_item4_label: "企业级安全",
    credits_item4_desc: "SOC 2、SSO、数据隔离",

    /* ─── Pricing: FAQ ─── */
    faq_badge: "常见问题",
    faq_title: "常见问题解答",
    faqs: [
      {
        q: "AI Credit 是如何运作的？",
        a: "每当子午线生成一个洞察——例如交易分析、决策人简报或下一步行动建议——会根据复杂度消耗一定数量的 Credit。Pro 计划每用户每月包含 1,000 个 Credit，对大多数活跃销售团队来说足够使用。如有需要，可以购买额外的 Credit 包。",
      },
      {
        q: "可以随时切换计划吗？",
        a: "可以。你可以随时从 Pro 升级到 Enterprise。升级后立即获得新功能的访问权限。请联系我们的销售团队讨论过渡方案。",
      },
      {
        q: "什么算作「活跃交易」？",
        a: "活跃交易是指尚未标记为「已赢单」或「已输单」的交易。Pro 和 Enterprise 计划均包含不限数量的活跃交易。",
      },
      {
        q: "年付有折扣吗？",
        a: "有——年付相比月付可节省 20%。请联系我们了解 Pro 和 Enterprise 计划的年付价格详情。",
      },
      {
        q: "AI 如何处理我的数据？",
        a: "子午线使用最先进的语言模型分析你的会议记录、笔记和交易上下文。你的数据在传输和存储时均加密，且绝不会用于训练模型。每个租户的数据完全隔离。",
      },
      {
        q: "有哪些 CRM 集成？",
        a: "CRM 集成（Salesforce、HubSpot）在 Enterprise 计划中提供。我们正在构建原生双向同步，自动保持你的 CRM 数据更新。Pro 计划用户可通过 CSV 和 API 导出数据。",
      },
    ],

    /* ─── Pricing: Bottom CTA ─── */
    pricing_cta_title_1: "准备好自信地",
    pricing_cta_title_highlight: "赢下交易",
    pricing_cta_subtitle:
      "从 Pro 开始，体验 AI 驱动的交易智能如何提升你的赢单率。",

    /* ─── WaitlistDialog ─── */
    waitlist_title: "申请抢先体验",
    waitlist_desc: "加入子午线 AI 决策引擎的等候名单。",
    waitlist_email_label: "工作邮箱",
    waitlist_name_label: "姓名",
    waitlist_company_label: "公司",
    waitlist_phone_label: "手机号",
    waitlist_wechat_label: "微信号",
    waitlist_email_placeholder: "you@company.com",
    waitlist_name_placeholder: "张伟",
    waitlist_company_placeholder: "示例科技有限公司",
    waitlist_phone_placeholder: "138 0000 0000",
    waitlist_wechat_placeholder: "你的微信号",
    waitlist_submit: "申请体验",
    waitlist_submitting: "提交中...",
    waitlist_error: "出了点问题，请重试。",
    waitlist_success_title: "你已加入名单！",
    waitlist_success_already: "你已经在名单中了！",
    waitlist_success_desc: "感谢你对子午线的关注。我们会尽快联系你，提供抢先体验的详情。",
    waitlist_success_already_desc: "我们已收到你的申请。团队会尽快与你联系，告知后续步骤。",
    waitlist_got_it: "知道了",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(lang: Language, key: TranslationKey): any {
  return translations[lang][key];
}
