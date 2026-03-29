import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { t as i18t, images as i18nImages } from "@/lib/i18n";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import {
  ArrowRight,
  ChevronRight,
  Sparkles,
  Shield,
  Target,
  Users,
  Brain,
  Layers,
  MessageSquare,
  TrendingUp,
  Zap,
  CheckCircle2,
  Globe,
  Menu,
  X,
} from "lucide-react";

/* ─── CDN Assets ─────────────────────────────────────── */
const LOGO_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/meridian-logo-cropped_69e86f90.png";
const MIRACLEPLUS_LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/miracleplus-logo_11f70a94.png";
const ANTLER_LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/antler-logo_e6d05a8f.png";

/* ─── Intersection Observer Hook ─────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Animated Counter ───────────────────────────────── */
function Counter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */
export default function Landing() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const tt = (key: string) => i18t(language, key as any);
  const imgs = i18nImages[language];

  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistSource, setWaitlistSource] = useState("landing_page");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for nav background
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const openWaitlist = (source: string) => {
    setWaitlistSource(source);
    setWaitlistOpen(true);
    setMobileMenuOpen(false);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const toggleLang = () => setLanguage(language === "en" ? "zh" : "en");

  /* ─── Problem section data (locale-aware) ─── */
  const painPoints = language === "en"
    ? [
        { icon: Users, title: "Invisible buying committees", desc: "You don't know who's really making the decision, who's blocking, or who you haven't met yet." },
        { icon: Brain, title: "Insights trapped in conversations", desc: "Critical signals from calls and emails never make it into your CRM or deal strategy." },
        { icon: Target, title: "Reactive deal management", desc: "By the time you realize a deal is at risk, it's already too late to course-correct." },
      ]
    : [
        { icon: Users, title: "看不见的采购委员会", desc: "你不知道谁在真正做决策、谁在阻碍、谁还没有接触过。" },
        { icon: Brain, title: "洞察被困在对话中", desc: "来自电话和邮件的关键信号从未进入你的 CRM 或交易策略。" },
        { icon: Target, title: "被动的交易管理", desc: "当你意识到交易有风险时，往往已经来不及纠正了。" },
      ];

  const problemTitle = language === "en"
    ? { main: "Your CRM tracks activities. ", dim: "It doesn't understand your deals." }
    : { main: "你的 CRM 记录了活动。", dim: "但它不理解你的交易。" };

  const problemDesc = language === "en"
    ? "Enterprise sales teams spend 60% of their time on admin instead of selling. Critical stakeholder dynamics are trapped in reps' heads. Deals slip through the cracks because no one sees the full picture until it's too late."
    : "企业销售团队将 60% 的时间花在行政工作而非销售上。关键的决策人动态被困在销售代表的脑海中。交易因为没有人能看到全貌而悄然流失——直到为时已晚。";

  /* ─── How It Works data (locale-aware) ─── */
  const howItWorksTitle = language === "en"
    ? { pre: "The Meridian ", highlight: "Intelligence Engine" }
    : { pre: "Meridian ", highlight: "智能引擎" };

  const howItWorksDesc = language === "en"
    ? "Four layers working together to transform raw sales data into actionable deal strategy."
    : "四层架构协同工作，将原始销售数据转化为可执行的交易策略。";

  const chipStack = language === "en"
    ? [
        { layer: "Layer 4", title: "Action Layer", desc: "What's Next recommendations, pre-meeting briefs, risk alerts", icon: Zap, color: "from-purple-500 to-pink-500", glow: "shadow-purple-500/20", borderColor: "border-purple-500/30" },
        { layer: "Layer 3", title: "Intelligence Layer", desc: "Deal narrative, confidence scoring, methodology grading", icon: Brain, color: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/20", borderColor: "border-blue-500/30" },
        { layer: "Layer 2", title: "Understanding Layer", desc: "Stakeholder mapping, relationship analysis, sentiment detection", icon: Users, color: "from-cyan-500 to-teal-500", glow: "shadow-cyan-500/20", borderColor: "border-cyan-500/30" },
        { layer: "Layer 1", title: "Data Layer", desc: "Meeting transcripts, emails, notes, documents, CRM data", icon: Layers, color: "from-slate-500 to-slate-400", glow: "shadow-slate-500/10", borderColor: "border-slate-500/30" },
      ]
    : [
        { layer: "第四层", title: "行动层", desc: "下一步建议、会前简报、风险预警", icon: Zap, color: "from-purple-500 to-pink-500", glow: "shadow-purple-500/20", borderColor: "border-purple-500/30" },
        { layer: "第三层", title: "智能层", desc: "交易叙事、置信度评分、方法论评级", icon: Brain, color: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/20", borderColor: "border-blue-500/30" },
        { layer: "第二层", title: "理解层", desc: "决策人映射、关系分析、情感检测", icon: Users, color: "from-cyan-500 to-teal-500", glow: "shadow-cyan-500/20", borderColor: "border-cyan-500/30" },
        { layer: "第一层", title: "数据层", desc: "会议记录、邮件、笔记、文档、CRM 数据", icon: Layers, color: "from-slate-500 to-slate-400", glow: "shadow-slate-500/10", borderColor: "border-slate-500/30" },
      ];

  /* ─── Team section data (locale-aware) ─── */
  const teamContent = language === "en"
    ? {
        p1: "We've spent years in the trenches of enterprise sales — running complex deals, managing buying committees, and losing sleep over pipeline reviews. We've seen firsthand how the best sales teams win: not through more activity, but through deeper understanding.",
        p2: "We built Meridian because we believe sales intelligence shouldn't be trapped in spreadsheets and tribal knowledge. Every deal tells a story — the relationships, the risks, the momentum. We're building the AI that reads that story and helps you write a better ending.",
        p3_pre: "Our team combines deep enterprise sales experience with AI and product engineering. We're backed by ",
        p3_mid: " and ",
        p3_post: ", and we're based between Singapore and San Francisco.",
      }
    : {
        p1: "我们在企业级销售的战壕中摸爬滚打多年——运营复杂交易、管理采购委员会、为 Pipeline Review 彻夜难眠。我们亲眼见证了最优秀的销售团队如何赢单：不是靠更多的活动，而是靠更深的理解。",
        p2: "我们创建 Meridian 是因为我们相信销售智能不应该被困在电子表格和口口相传的经验中。每笔交易都在讲述一个故事——关系、风险、势头。我们正在构建能读懂这个故事并帮助你写出更好结局的 AI。",
        p3_pre: "我们的团队融合了深厚的企业销售经验与 AI 和产品工程能力。我们获得了 ",
        p3_mid: " 和 ",
        p3_post: " 的支持，团队分布在新加坡和旧金山之间。",
      };

  const ctaSubtext = language === "en"
    ? "No credit card required. We'll reach out within 48 hours."
    : "无需信用卡。我们将在 48 小时内联系您。";

  const waitlistSubtext = language === "en"
    ? "Join the waitlist for early access. We're onboarding select teams who sell complex, multi-stakeholder deals."
    : "加入等候名单获取抢先体验资格。我们正在邀请攻克复杂、多决策人交易的精选团队。";

  return (
    <div className="min-h-screen bg-[#060a14] text-white overflow-x-hidden">
      {/* ─── NAV ─────────────────────────────────────── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#060a14]/90 backdrop-blur-xl border-b border-white/5 shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src={LOGO_IMG} alt="Meridian" className="h-10 w-auto brightness-0 invert" />
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <button onClick={() => scrollTo("features")} className="hover:text-white transition-colors">{tt("nav_features")}</button>
            <button onClick={() => scrollTo("how-it-works")} className="hover:text-white transition-colors">{language === "en" ? "How It Works" : "工作原理"}</button>
            <button onClick={() => scrollTo("team")} className="hover:text-white transition-colors">{tt("nav_team")}</button>
            <button onClick={() => navigate("/pricing")} className="hover:text-white transition-colors">{tt("nav_pricing")}</button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-white/10"
              title={language === "en" ? "切换到中文" : "Switch to English"}
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-medium">{language === "en" ? "中文" : "EN"}</span>
            </button>

            <button
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="text-sm text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
            >
              {user ? tt("nav_dashboard") : tt("nav_login")}
            </button>
            <button
              onClick={() => openWaitlist("nav_desktop")}
              className="text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-5 py-2 rounded-lg transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
            >
              {tt("nav_request_access")}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-slate-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0f1e]/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 space-y-3">
            <button onClick={() => scrollTo("features")} className="block w-full text-left text-sm text-slate-300 hover:text-white py-2">{tt("nav_features")}</button>
            <button onClick={() => scrollTo("how-it-works")} className="block w-full text-left text-sm text-slate-300 hover:text-white py-2">{language === "en" ? "How It Works" : "工作原理"}</button>
            <button onClick={() => scrollTo("team")} className="block w-full text-left text-sm text-slate-300 hover:text-white py-2">{tt("nav_team")}</button>
            <button onClick={() => navigate("/pricing")} className="block w-full text-left text-sm text-slate-300 hover:text-white py-2">{tt("nav_pricing")}</button>
            <hr className="border-white/5" />
            {/* Mobile Language Switcher */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 w-full text-left text-sm text-slate-300 hover:text-white py-2"
            >
              <Globe className="w-4 h-4" />
              {language === "en" ? "切换到中文" : "Switch to English"}
            </button>
            <button onClick={() => navigate(user ? "/dashboard" : "/login")} className="block w-full text-left text-sm text-slate-300 hover:text-white py-2">{user ? tt("nav_dashboard") : tt("nav_login")}</button>
            <button
              onClick={() => openWaitlist("nav_mobile")}
              className="block w-full text-center text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 rounded-lg"
            >
              {tt("nav_request_access")}
            </button>
          </div>
        )}
      </nav>

      {/* ─── HERO ────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-cyan-500/8 via-blue-600/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              {tt("hero_badge")}
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight mb-6">
              {tt("hero_title_1")}{" "}
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                {tt("hero_title_2")}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
              {tt("hero_subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => openWaitlist("hero")}
                className="group flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 text-base"
              >
                {tt("hero_cta_primary")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 px-8 py-3.5 rounded-xl transition-all text-base"
              >
                {tt("nav_login")}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* ─── BACKED BY ─────────────────────────── */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <p className="text-xs font-medium text-slate-500 tracking-widest uppercase">
                {language === "en" ? "Backed by" : "投资方"}
              </p>
              <div className="flex items-center gap-8">
                <img
                  src={MIRACLEPLUS_LOGO}
                  alt="MiraclePlus"
                  className="h-8 md:h-9 w-auto brightness-0 invert opacity-60 hover:opacity-90 transition-opacity"
                />
                <img
                  src={ANTLER_LOGO}
                  alt="Antler"
                  className="h-5 md:h-6 w-auto brightness-0 invert opacity-60 hover:opacity-90 transition-opacity"
                />
              </div>
            </div>
          </div>

          {/* Hero Product Screenshot */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-purple-500/20 rounded-2xl blur-2xl opacity-50" />
            <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
              <img
                src={imgs.hero}
                alt="Meridian Deal Intelligence Platform"
                className="w-full"
                loading="lazy"
              />
              {/* Gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#060a14] to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF / STATS ────────────────────── */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 68, suffix: "%", label: tt("stat_win_rate") },
              { value: 3, suffix: "x", label: tt("stat_qualification") },
              { value: 40, suffix: "%", label: tt("stat_stakeholders") },
              { value: 2, suffix: language === "en" ? "min" : "分钟", label: tt("stat_time_saved") },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  <Counter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROBLEM STATEMENT ───────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm font-medium text-cyan-400 tracking-widest uppercase mb-4">
            {language === "en" ? "The Problem" : "痛点"}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight mb-8">
            {problemTitle.main}{" "}
            <span className="text-slate-500">{problemTitle.dim}</span>
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed max-w-3xl mx-auto mb-16">
            {problemDesc}
          </p>

          {/* Pain Point Cards */}
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {painPoints.map((pain) => (
              <div
                key={pain.title}
                className="group p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                  <pain.icon className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="font-display font-semibold text-base mb-2">{pain.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{pain.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <p className="text-sm font-medium text-cyan-400 tracking-widest uppercase mb-4">{tt("nav_features")}</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight">
              {tt("features_title_1")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                {tt("features_title_2")}
              </span>
            </h2>
          </div>

          {/* Feature 1: AI Deal Insight */}
          <FeatureRow
            badge={tt("feature1_label")}
            title={tt("feature1_title")}
            desc={tt("feature1_desc")}
            bullets={[tt("feature1_bullet1"), tt("feature1_bullet2"), tt("feature1_bullet3")]}
            image={imgs.featureInsight}
            imageAlt={tt("feature1_title")}
            imagePosition="right"
          />

          {/* Feature 2: Stakeholder Map */}
          <FeatureRow
            badge={tt("feature2_label")}
            title={tt("feature2_title")}
            desc={tt("feature2_desc")}
            bullets={[tt("feature2_bullet1"), tt("feature2_bullet2"), tt("feature2_bullet3")]}
            image={imgs.featureMap}
            imageAlt={tt("feature2_title")}
            imagePosition="left"
          />

          {/* Feature 3: Deal Room */}
          <FeatureRow
            badge={tt("feature3_label")}
            title={tt("feature3_title")}
            desc={tt("feature3_desc")}
            bullets={[tt("feature3_bullet1"), tt("feature3_bullet2"), tt("feature3_bullet3")]}
            image={imgs.featureRoom}
            imageAlt={tt("feature3_title")}
            imagePosition="right"
          />
        </div>
      </section>

      {/* ─── HOW IT WORKS (Architecture Chip Stack) ──── */}
      <section id="how-it-works" className="py-24 md:py-32 relative">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <p className="text-sm font-medium text-cyan-400 tracking-widest uppercase mb-4">
              {language === "en" ? "How It Works" : "工作原理"}
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight mb-6">
              {howItWorksTitle.pre}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                {howItWorksTitle.highlight}
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              {howItWorksDesc}
            </p>
          </div>

          {/* Chip Stack */}
          <div className="max-w-lg mx-auto space-y-4">
            {chipStack.map((chip, i) => (
              <ChipCard key={chip.title} chip={chip} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── TEAM ────────────────────────────────────── */}
      <section id="team" className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-cyan-400 tracking-widest uppercase mb-4">{tt("team_badge")}</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight mb-6">
              {tt("team_title").split(language === "en" ? "lived the problem" : "亲历过这些问题")[0]}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                {language === "en" ? "lived the problem" : "亲历过这些问题"}
              </span>
              {language === "zh" ? "的人打造。" : ""}
            </h2>
          </div>

          <div className="p-8 md:p-10 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-6">
              {teamContent.p1}
            </p>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-6">
              {teamContent.p2}
            </p>
            <p className="text-base text-slate-400 leading-relaxed">
              {teamContent.p3_pre}
              <span className="text-cyan-400 font-medium">MiraclePlus</span>
              {teamContent.p3_mid}
              <span className="text-cyan-400 font-medium">Antler</span>
              {teamContent.p3_post}
            </p>

            {/* Backed by logos inline */}
            <div className="flex items-center gap-6 mt-8 pt-6 border-t border-white/5">
              <img
                src={MIRACLEPLUS_LOGO}
                alt="MiraclePlus"
                className="h-6 w-auto brightness-0 invert opacity-40"
              />
              <img
                src={ANTLER_LOGO}
                alt="Antler"
                className="h-4 w-auto brightness-0 invert opacity-40"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA / REQUEST ACCESS ────────────────────── */}
      <section id="cta" className="py-24 md:py-32 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-cyan-500/8 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight mb-6">
            {tt("cta_title_1")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              {tt("cta_title_2")}
            </span>
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-lg mx-auto">
            {waitlistSubtext}
          </p>

          <button
            onClick={() => openWaitlist("cta_bottom")}
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium px-8 py-4 rounded-xl transition-all shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 text-base"
          >
            {tt("cta_button")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <p className="text-xs text-slate-600 mt-4">
            {ctaSubtext}
          </p>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <img src={LOGO_IMG} alt="Meridian" className="h-8 w-auto brightness-0 invert" />
            </a>

            <div className="flex items-center gap-6 text-sm text-slate-500">
              <button onClick={() => scrollTo("features")} className="hover:text-slate-300 transition-colors">{tt("nav_features")}</button>
              <button onClick={() => scrollTo("how-it-works")} className="hover:text-slate-300 transition-colors">{language === "en" ? "How It Works" : "工作原理"}</button>
              <button onClick={() => scrollTo("team")} className="hover:text-slate-300 transition-colors">{tt("nav_team")}</button>
              <button onClick={() => navigate("/pricing")} className="hover:text-slate-300 transition-colors">{tt("nav_pricing")}</button>
              <button onClick={() => navigate("/login")} className="hover:text-slate-300 transition-colors">{tt("nav_login")}</button>
            </div>

            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} {tt("footer_copyright")}
            </p>
          </div>
        </div>
      </footer>

      {/* Waitlist Dialog */}
      <WaitlistDialog
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        source={waitlistSource}
      />
    </div>
  );
}

/* ─── Feature Row Component ──────────────────────────── */
function FeatureRow({
  badge,
  title,
  desc,
  bullets,
  image,
  imageAlt,
  imagePosition,
}: {
  badge: string;
  title: string;
  desc: string;
  bullets: string[];
  image: string;
  imageAlt: string;
  imagePosition: "left" | "right";
}) {
  const { ref, inView } = useInView(0.1);
  const isLeft = imagePosition === "left";

  return (
    <div
      ref={ref}
      className={`flex flex-col ${isLeft ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-12 md:gap-16 py-16 md:py-24 transition-all duration-700 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Text */}
      <div className="flex-1 max-w-lg">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
          <Sparkles className="w-3 h-3" />
          {badge}
        </div>
        <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">{title}</h3>
        <p className="text-slate-400 leading-relaxed mb-6">{desc}</p>
        <ul className="space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Image */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-lg">
          <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-50" />
          <img
            src={image}
            alt={imageAlt}
            className="relative w-full max-h-[420px] object-contain rounded-xl border border-white/10 shadow-2xl shadow-black/40"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Chip Card Component ────────────────────────────── */
function ChipCard({
  chip,
  index,
}: {
  chip: {
    layer: string;
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    glow: string;
    borderColor: string;
  };
  index: number;
}) {
  const { ref, inView } = useInView(0.2);
  const Icon = chip.icon;

  return (
    <div
      ref={ref}
      className={`relative transition-all duration-700 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      {/* 3D perspective chip */}
      <div
        className={`relative p-6 rounded-xl bg-[#0c1222] border ${chip.borderColor} shadow-xl ${chip.glow} hover:scale-[1.02] transition-transform duration-300`}
        style={{
          transform: inView
            ? `perspective(800px) rotateX(${2 - index}deg)`
            : "perspective(800px) rotateX(5deg)",
        }}
      >
        {/* Gradient top edge */}
        <div className={`absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r ${chip.color}`} />

        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${chip.color} flex items-center justify-center shrink-0 shadow-lg ${chip.glow}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">{chip.layer}</span>
              <h3 className="font-display font-semibold text-base">{chip.title}</h3>
            </div>
            <p className="text-sm text-slate-500">{chip.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
