/* ─── i18n: Landing + Pricing translations & locale-specific images ─── */
/* Uses the same Language type from LanguageContext ("en" | "zh") */

import type { Language } from "@/contexts/LanguageContext";

/* ─── Image URLs per locale ─── */
export const images = {
  en: {
    hero: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/hero-en_21f986fd.png",
    featureInsight: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-insight-en_63a1a7c9.png",
    featureMap: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-map-en_73dc0e53.png",
    featureRoom: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-room-en_7c4eb4b6.png",
  },
  zh: {
    hero: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/hero-zh_f17a9a8f.png",
    featureInsight: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-insight-zh_78f082fb.png",
    featureMap: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-map-zh_b87c36c2.png",
    featureRoom: "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-room-zh_c656fe10.png",
  },
} as const;

/* ─── Translation strings ─── */
export const translations = {
  en: {
    /* ─── Landing: Nav ─── */
    nav_features: "Features",
    nav_pricing: "Pricing",
    nav_team: "Team",
    nav_login: "Log In",
    nav_dashboard: "Go to Dashboard",
    nav_request_access: "Request Access",

    /* ─── Landing: Hero ─── */
    hero_badge: "AI-Powered Sales Intelligence",
    hero_title_1: "See the deal.",
    hero_title_2: "Not just the data.",
    hero_subtitle:
      "Meridian reads between the lines of every stakeholder interaction — surfacing hidden risks, mapping buying committees, and telling you exactly what to do next.",
    hero_cta_primary: "Request Early Access",
    hero_cta_secondary: "See How It Works",

    /* ─── Landing: Stats ─── */
    stat_win_rate: "Win-rate improvement",
    stat_qualification: "Faster qualification",
    stat_stakeholders: "Shorter deal cycles",
    stat_time_saved: "Saved daily per rep",

    /* ─── Landing: Features section header ─── */
    features_badge: "Core Capabilities",
    features_title_1: "Intelligence at every stage",
    features_title_2: "of the deal.",

    /* ─── Landing: Feature 1 — AI Deal Insight ─── */
    feature1_label: "AI Deal Insight",
    feature1_title: "An AI that reads between the lines.",
    feature1_desc:
      "Meridian doesn't just summarize meetings — it synthesizes every interaction into a living deal narrative, identifies hidden risks before they surface, and recommends specific next actions with confidence scoring.",
    feature1_bullet1: "Confidence scoring with trend analysis",
    feature1_bullet2: "Risk identification across all interactions",
    feature1_bullet3: "AI-suggested next actions per stakeholder",

    /* ─── Landing: Feature 2 — Stakeholder Map ─── */
    feature2_label: "Buying Committee",
    feature2_title: "Map the people who actually decide.",
    feature2_desc:
      "Automatically build and maintain a dynamic stakeholder map from meeting transcripts. See who's a champion, who's blocking, and who you haven't engaged yet — before it's too late.",
    feature2_bullet1: "Auto-detected roles and influence levels",
    feature2_bullet2: "Relationship strength tracking over time",
    feature2_bullet3: "Gap analysis for missing decision-makers",

    /* ─── Landing: Feature 3 — Deal Room ─── */
    feature3_label: "Deal Room",
    feature3_title: "Every interaction. One timeline.",
    feature3_desc:
      "A unified deal room that captures every meeting, email, and touchpoint in chronological context. AI-generated summaries surface what matters — so your team never walks into a meeting unprepared.",
    feature3_bullet1: "Multi-source interaction capture",
    feature3_bullet2: "AI-generated meeting summaries",
    feature3_bullet3: "Pre-meeting stakeholder briefs",

    /* ─── Landing: Team section ─── */
    team_badge: "Our Team",
    team_title: "Built by people who've lived the problem.",
    team_subtitle:
      "We've spent years in enterprise sales — navigating complex buying committees, multi-threaded deals, and the chaos of long sales cycles. Meridian is the tool we wished we had.",

    /* ─── Landing: Bottom CTA ─── */
    cta_title_1: "Stop guessing.",
    cta_title_2: "Start knowing.",
    cta_subtitle:
      "Join the sales teams using Meridian to close complex deals with confidence.",
    cta_button: "Request Early Access",

    /* ─── Landing: Footer ─── */
    footer_copyright: "Meridian Sales Intelligence. All rights reserved.",

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
    waitlist_desc: "Join the waitlist for Meridian's AI-powered deal intelligence platform.",
    waitlist_email_label: "Work Email",
    waitlist_name_label: "Full Name",
    waitlist_company_label: "Company",
    waitlist_email_placeholder: "you@company.com",
    waitlist_name_placeholder: "Jane Smith",
    waitlist_company_placeholder: "Acme Corp",
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
    nav_features: "核心功能",
    nav_pricing: "定价",
    nav_team: "团队",
    nav_login: "登录",
    nav_dashboard: "进入控制台",
    nav_request_access: "申请体验",

    /* ─── Landing: Hero ─── */
    hero_badge: "AI驱动的销售智能平台",
    hero_title_1: "看透交易本质，",
    hero_title_2: "而非只看数据。",
    hero_subtitle:
      "子午线深度解读每一次客户互动——发现隐藏风险、绘制采购决策链、精准推荐下一步行动。",
    hero_cta_primary: "申请抢先体验",
    hero_cta_secondary: "了解产品",

    /* ─── Landing: Stats ─── */
    stat_win_rate: "赢单率提升",
    stat_qualification: "更快的商机评估",
    stat_stakeholders: "缩短成交周期",
    stat_time_saved: "每天节省准备时间",

    /* ─── Landing: Features section header ─── */
    features_badge: "核心能力",
    features_title_1: "覆盖交易全周期的",
    features_title_2: "深度洞察。",

    /* ─── Landing: Feature 1 — AI Deal Insight ─── */
    feature1_label: "AI 交易洞察",
    feature1_title: "读懂字里行间的 AI。",
    feature1_desc:
      "子午线不只是总结会议——它将每一次互动综合为动态交易叙事，在风险浮出水面之前识别它们，并以置信度评分推荐具体的下一步行动。",
    feature1_bullet1: "带趋势分析的置信度评分",
    feature1_bullet2: "跨所有互动的风险识别",
    feature1_bullet3: "按决策人的 AI 行动建议",

    /* ─── Landing: Feature 2 — Stakeholder Map ─── */
    feature2_label: "采购委员会",
    feature2_title: "绘制真正做决策的人。",
    feature2_desc:
      "从会议记录中自动构建并维护动态决策人关系图。清楚看到谁是支持者、谁在阻碍、谁还没有接触——在为时已晚之前。",
    feature2_bullet1: "自动识别角色和影响力等级",
    feature2_bullet2: "关系强度的持续追踪",
    feature2_bullet3: "缺失决策人的差距分析",

    /* ─── Landing: Feature 3 — Deal Room ─── */
    feature3_label: "交易室",
    feature3_title: "所有互动，一条时间线。",
    feature3_desc:
      "统一的交易室捕捉每一次会议、邮件和触点，按时间顺序呈现。AI 生成的摘要提炼关键信息——让你的团队永远不会毫无准备地走进会议。",
    feature3_bullet1: "多来源互动记录",
    feature3_bullet2: "AI 生成的会议摘要",
    feature3_bullet3: "会前决策人简报",

    /* ─── Landing: Team section ─── */
    team_badge: "我们的团队",
    team_title: "由亲历过这些问题的人打造。",
    team_subtitle:
      "我们在企业级销售领域深耕多年——经历过复杂的采购委员会、多线程交易和漫长销售周期的混乱。子午线是我们一直想要的工具。",

    /* ─── Landing: Bottom CTA ─── */
    cta_title_1: "不再猜测，",
    cta_title_2: "开始洞察。",
    cta_subtitle:
      "加入正在使用子午线自信成交复杂交易的销售团队。",
    cta_button: "申请抢先体验",

    /* ─── Landing: Footer ─── */
    footer_copyright: "子午线销售智能平台。保留所有权利。",

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
    waitlist_desc: "加入子午线 AI 销售智能平台的等候名单。",
    waitlist_email_label: "工作邮箱",
    waitlist_name_label: "姓名",
    waitlist_company_label: "公司",
    waitlist_email_placeholder: "you@company.com",
    waitlist_name_placeholder: "张伟",
    waitlist_company_placeholder: "示例科技有限公司",
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
