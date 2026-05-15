/* ─── i18n: Landing + Pricing translations & locale-specific images ─── */
/* Uses the same Language type from LanguageContext ("en" | "zh") */

import type { Language } from "@/contexts/LanguageContext";

/* ─── Image URLs per locale ─── */
export const images = {
  en: {
    hero: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/hero-en-light-v4_24831889.png",
    chaosDesktop: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/chaos-desktop_e9186459.png",
    feishuBot: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feishu-bot-mockup_741fbc7a.png",
    productModules: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/product-modules_83e12ae5.png",
    productMockup: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/product-mockup-bg-2x_35ae52f0.png",
    /* keep old feature images for fallback */
    featureInsight: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-insight-en-light-v4_c43b2426.png",
    featureMap: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-map-en-light-v4_d24cd793.png",
    featureRoom: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-room-en-light-v4_580f18fa.png",
  },
  zh: {
    hero: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/hero-zh-light-v4_ac963f49.png",
    chaosDesktop: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/chaos-desktop_e9186459.png",
    feishuBot: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feishu-bot-mockup_741fbc7a.png",
    productModules: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/product-modules_83e12ae5.png",
    productMockup: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/product-mockup-bg-2x_35ae52f0.png",
    featureInsight: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-insight-zh-light-v4_a66adf65.png",
    featureMap: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-map-zh-light-v4_9eaf39f4.png",
    featureRoom: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-room-zh-light-v4_95941fac.png",
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
    hero_title_1: "Give your overseas team",
    hero_title_2: "an AI sales engine.",
    hero_subtitle:
      "Meridian helps Chinese companies going global win every complex deal. Market intelligence, customer mapping, and deal memory — all in one AI-powered platform.",
    hero_cta_primary: "Request Early Access",

    /* ─── Landing: Pain Point (Chaos Scene) ─── */
    pain_label: "The Problem",
    pain_title_1: "6 markets. 4 languages. 200 leads.",
    pain_title_2: "Even the best team can't keep up.",
    pain_desc: "Going global means information overload: Feishu, CRM, WeChat, LinkedIn, Gmail, WhatsApp — scattered across tools, languages, and time zones. Opportunities slip through the cracks every day.",

    /* ─── Landing: Pain Analysis (Two Perspectives) ─── */
    pain_sales_title: "What your sales reps say:",
    pain_sales_quote: "HQ gave me no ammo, but expects me to crack this region.",
    pain_sales_item1: "Can't tell real opportunities from polite inquiries",
    pain_sales_item2: "Every market has different compliance, customs, and decision chains",
    pain_sales_item3: "Domestic experience doesn't translate overseas",
    pain_boss_title: "What the CEO worries about:",
    pain_boss_quote: "We spent $500K on the market. Has it actually opened?",
    pain_boss_item1: "Ask the frontline for updates — nobody can give a clear answer",
    pain_boss_item2: "Long feedback cycles — don't know whether to double down or cut losses",
    pain_boss_item3: "Local seniors cost $250K/yr and move slowly; trade reps don't understand the market",
    pain_insight: "It's not that the team isn't trying. The information complexity of cross-cultural deals exceeds any individual's processing capacity.",

    /* ─── Landing: Product Three Modules ─── */
    product_label: "The Product",
    product_title_1: "AI sales engine for ",
    product_title_2: "going global.",
    product_desc: "Three modules covering the entire overseas sales pipeline.",
    product_mod1_num: "01",
    product_mod1_title: "Market Intelligence",
    product_mod1_desc: "Target region attractiveness scoring. Agent & distributor tiering. Regional volume and entry difficulty analysis.",
    product_mod2_num: "02",
    product_mod2_title: "Customer Deep Profile",
    product_mod2_desc: "Customer org structure & decision chain mapping. Strategic dynamics & key event tracking. Product-region opportunity matrix.",
    product_mod3_num: "03",
    product_mod3_title: "Deal Memory",
    product_mod3_desc: "Complete context for every deal. Key milestone & follow-up tracking. Cross-cycle knowledge retention and reuse.",

    /* ─── Landing: Feishu Integration ─── */
    feishu_label: "Seamless Integration",
    feishu_title_1: "Embedded in your ",
    feishu_title_2: "collaboration platform.",
    feishu_item1_title: "Proactive, not reactive",
    feishu_item1_desc: "When new signals appear on a deal, Meridian pushes alerts and recommendations automatically.",
    feishu_item2_title: "Not just answers — actions done",
    feishu_item2_desc: "Every alert comes with updated org charts, competitive intel, and specific next steps.",
    feishu_item3_title: "Zero-friction adoption",
    feishu_item3_desc: "No new system to install. No habits to change. No training required. Works inside Feishu, DingTalk, or Slack.",

    /* ─── Landing: Results ─── */
    results_label: "Results",
    results_title_1: "After deploying Meridian",
    results_stat1_value: "+45%",
    results_stat1_label: "Inquiry response quality",
    results_stat1_desc: "Overseas inquiry response quality improvement",
    results_stat2_value: "3mo → 3wk",
    results_stat2_label: "New rep ramp-up",
    results_stat2_desc: "From 3 months to 3 weeks to work independently",
    results_stat3_value: "100%",
    results_stat3_label: "Agent network visibility",
    results_stat3_desc: "From black box to full transparency",
    results_quote: "Our 3-person overseas team can now speak directly to what the client's decision-makers care about. That used to require a 5-year local veteran.",
    results_quote_attr: "VP of Overseas Business · High-end Equipment Manufacturer",

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
    team_p1: "We've spent years on the front lines of overseas B2B sales — running complex cross-border deals, navigating multi-cultural buying committees, and bridging the gap between Chinese HQ and global markets.",
    team_p2: "We built Meridian because we believe the judgment gap in overseas sales shouldn't be filled by hiring more expensive people. AI can deliver senior-level market intuition to every member of your team.",
    team_backed: "Backed by",

    /* ─── Landing: Bottom CTA ─── */
    cta_title_1: "Let your overseas team ",
    cta_title_2: "understand the market like a local — from day one.",
    cta_subtitle: "Join the waitlist for early access. We're onboarding select Chinese companies going global with complex, high-value deals.",
    cta_button: "Request Early Access",
    cta_subtext: "No credit card required. We'll reach out within 48 hours.",

    /* ─── Landing: Footer ─── */
    footer_copyright: "Meridian. All rights reserved.",
    footer_email: "leo@meridianos.ai",
    footer_wechat: "WeChat: leo971217",

    /* ─── Pricing: Hero ─── */
    pricing_badge: "Simple, Transparent Pricing",
    pricing_title_1: "Intelligence that ",
    pricing_title_highlight: "pays for itself.",
    pricing_subtitle:
      "Credit-based pricing that scales with your usage. Every insight generated consumes credits — so you only pay for the intelligence you actually use.",

    /* ─── Pricing: Plans ─── */
    plan_pro_name: "Pro",
    plan_pro_tagline: "For overseas sales teams closing complex, high-value deals",
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
        a: "Meridian uses state-of-the-art language models to analyze your meeting transcripts, notes, and deal context. Your data is encrypted in transit and at rest, and is never used to train models. Each tenant's data is strictly isolated.",
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
    waitlist_desc: "Join the waitlist for Meridian — the AI sales engine for Chinese companies going global.",
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
    hero_title_1: "给你的出海团队，",
    hero_title_2: "装上AI销售引擎。",
    hero_subtitle:
      "帮助中国出海企业赢下每一笔交易。市场洞察、客户画像、交易记忆——一个AI平台，覆盖出海销售全链路。",
    hero_cta_primary: "申请抢先体验",

    /* ─── Landing: Pain Point (Chaos Scene) ─── */
    pain_label: "痛点",
    pain_title_1: "6个海外市场，4种语言，200条线索。",
    pain_title_2: "再强的团队也看不完。",
    pain_desc: "出海意味着信息过载：飞书、CRM、微信、LinkedIn、Gmail、WhatsApp——散落在不同工具、不同语言、不同时区。每天都有机会在指缝间溜走。",

    /* ─── Landing: Pain Analysis (Two Perspectives) ─── */
    pain_sales_title: "一线销售的声音：",
    pain_sales_quote: "总部没给我弹药，但要我拿下这个区域。",
    pain_sales_item1: "收到海外询盘，分不清是商机还是客套",
    pain_sales_item2: "每个市场的合规、习惯、决策链都不一样",
    pain_sales_item3: "国内经验在海外完全失效",
    pain_boss_title: "老板的焦虑：",
    pain_boss_quote: "钱花了，人招了，市场到底打开了没有？",
    pain_boss_item1: "花了300万铺市场，问一线进展没人说得清",
    pain_boss_item2: "反馈周期长，不知道该加投入还是止损",
    pain_boss_item3: "招白人太贵、工作节奏慢；招外贸员不懂当地市场",
    pain_insight: "不是团队不努力。是出海跨文化交易的信息复杂度，超出了任何个人的处理能力。",

    /* ─── Landing: Product Three Modules ─── */
    product_label: "产品",
    product_title_1: "出海B2B销售智能体",
    product_title_2: "——帮您丝滑出海。",
    product_desc: "三个模块，覆盖出海销售全链路。",
    product_mod1_num: "01",
    product_mod1_title: "市场洞察",
    product_mod1_desc: "目标地区吸引力评估。代理商与渠道商分层梳理。区域业务体量与进入难度分析。",
    product_mod2_num: "02",
    product_mod2_title: "客户深度画像",
    product_mod2_desc: "客户组织架构与决策链映射。战略动态与关键事件追踪。产品×区域进入机会矩阵。",
    product_mod3_num: "03",
    product_mod3_title: "交易记忆",
    product_mod3_desc: "每笔交易的完整上下文。关键节点与跟进状态追踪。跨周期知识沉淀与复用。",

    /* ─── Landing: Feishu Integration ─── */
    feishu_label: "无缝嵌入",
    feishu_title_1: "嵌入你的",
    feishu_title_2: "内部协作平台。",
    feishu_item1_title: "不等你问，主动告诉你",
    feishu_item1_desc: "交易出现新信号时，自动推送预警和建议。",
    feishu_item2_title: "不只是回答，已经帮你做完了",
    feishu_item2_desc: "推送同时附带最新组织架构、竞对动态、行动建议。",
    feishu_item3_title: "嵌入飞书，零摩擦接入",
    feishu_item3_desc: "不装系统、不改习惯、不用培训。支持飞书、钉钉、Slack。",

    /* ─── Landing: Results ─── */
    results_label: "效果",
    results_title_1: "部署子午线后...",
    results_stat1_value: "+45%",
    results_stat1_label: "询盘响应质量",
    results_stat1_desc: "海外询盘响应质量提升",
    results_stat2_value: "3个月→3周",
    results_stat2_label: "新人上手时间",
    results_stat2_desc: "从3个月压缩到3周独立打单",
    results_stat3_value: "100%",
    results_stat3_label: "代理商网络可见度",
    results_stat3_desc: "从黑盒到完全透明",
    results_quote: "我们3人海外团队，跟欧洲客户开会能直接讲到对方决策层关心的点。过去要靠5年本地senior才能做到。",
    results_quote_attr: "某高端装备出海公司 · 海外业务VP",

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
    team_p1: "我们在海外B2B销售的一线摸爬滚打多年——运营复杂的跨境交易、穿越多文化采购委员会、在中国总部和全球市场之间架起桥梁。",
    team_p2: "我们创建子午线，是因为我们相信出海销售的判断力差距，不应该靠招更贵的人来填补。AI可以把资深销售的市场直觉，赋予团队的每一个人。",
    team_backed: "投资方",

    /* ─── Landing: Bottom CTA ─── */
    cta_title_1: "让你的出海团队，",
    cta_title_2: "从第一天就像本地人一样懂市场。",
    cta_subtitle: "加入等候名单获取抢先体验资格。我们正在邀请攻克复杂、高价值出海交易的精选团队。",
    cta_button: "申请抢先体验",
    cta_subtext: "无需信用卡。我们将在 48 小时内联系您。",

    /* ─── Landing: Footer ─── */
    footer_copyright: "子午线 Meridian. 保留所有权利。",
    footer_email: "leo@meridianos.ai",
    footer_wechat: "微信：leo971217",

    /* ─── Pricing: Hero ─── */
    pricing_badge: "简洁透明的定价",
    pricing_title_1: "让智能",
    pricing_title_highlight: "为自己买单。",
    pricing_subtitle:
      "基于 Credit 的弹性定价，随用量扩展。每次生成洞察消耗 Credit——你只为实际使用的智能付费。",

    /* ─── Pricing: Plans ─── */
    plan_pro_name: "Pro",
    plan_pro_tagline: "适合攻克复杂、高价值出海交易的销售团队",
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
    plan_enterprise_tagline: "适合规模化的出海营收组织",
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
    waitlist_desc: "加入子午线等候名单——帮助中国出海企业赢下每一笔交易的AI销售引擎。",
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
