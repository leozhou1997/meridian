import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { t as i18t, images as i18nImages } from "@/lib/i18n";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import {
  ArrowRight,
  ChevronRight,
  Globe,
  Menu,
  X,
  Lock,
  Quote,
  Search,
  Users,
  Database,
  Bell,
  Zap,
  MessageSquare,
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

/* ═══════════════════════════════════════════════════════
   LANDING PAGE — REDESIGN V6
   出海 AI 销售引擎 positioning
   Deep navy + warm accent, editorial typography,
   narrative-driven sections aligned with latest product PDF
   ═══════════════════════════════════════════════════════ */
export default function Landing() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const tt = (key: string) => i18t(language, key as any);
  const imgs = i18nImages[language];

  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistSource, setWaitlistSource] = useState("landing_page");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 overflow-x-hidden">

      {/* ─── NAV ─────────────────────────────────────── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src={LOGO_IMG} alt="Meridian" className="h-9 w-auto" />
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-slate-500">
            <button onClick={() => scrollTo("product")} className="hover:text-slate-900 transition-colors">{tt("nav_features")}</button>
            <button onClick={() => scrollTo("results")} className="hover:text-slate-900 transition-colors">{tt("nav_results")}</button>
            <button onClick={() => scrollTo("how")} className="hover:text-slate-900 transition-colors">{tt("nav_how")}</button>
            <button onClick={() => scrollTo("team")} className="hover:text-slate-900 transition-colors">{tt("nav_team")}</button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-md transition-colors"
              title={language === "en" ? "切换到中文" : "Switch to English"}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="font-medium">{language === "en" ? "中文" : "EN"}</span>
            </button>
            <button
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="text-[13px] font-medium text-slate-600 hover:text-slate-900 px-4 py-1.5 rounded-md transition-colors"
            >
              {user ? tt("nav_dashboard") : tt("nav_login")}
            </button>
            <button
              onClick={() => openWaitlist("nav_desktop")}
              className="text-[13px] font-semibold bg-[#1a2b5e] hover:bg-[#243672] text-white px-5 py-2 rounded-lg transition-all"
            >
              {tt("nav_request_access")}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-slate-600 hover:text-slate-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 px-6 py-4 space-y-3">
            <button onClick={() => scrollTo("product")} className="block w-full text-left text-sm text-slate-600 hover:text-slate-900 py-2">{tt("nav_features")}</button>
            <button onClick={() => scrollTo("results")} className="block w-full text-left text-sm text-slate-600 hover:text-slate-900 py-2">{tt("nav_results")}</button>
            <button onClick={() => scrollTo("how")} className="block w-full text-left text-sm text-slate-600 hover:text-slate-900 py-2">{tt("nav_how")}</button>
            <button onClick={() => scrollTo("team")} className="block w-full text-left text-sm text-slate-600 hover:text-slate-900 py-2">{tt("nav_team")}</button>
            <hr className="border-slate-200" />
            <button onClick={toggleLang} className="flex items-center gap-2 w-full text-left text-sm text-slate-600 hover:text-slate-900 py-2">
              <Globe className="w-4 h-4" />
              {language === "en" ? "切换到中文" : "Switch to English"}
            </button>
            <button onClick={() => navigate(user ? "/dashboard" : "/login")} className="block w-full text-left text-sm text-slate-600 hover:text-slate-900 py-2">{user ? tt("nav_dashboard") : tt("nav_login")}</button>
            <button
              onClick={() => openWaitlist("nav_mobile")}
              className="block w-full text-center text-sm font-semibold bg-[#1a2b5e] text-white px-5 py-2.5 rounded-lg"
            >
              {tt("nav_request_access")}
            </button>
          </div>
        )}
      </nav>

      {/* ─── HERO ────────────────────────────────────── */}
      <section className="relative pt-28 pb-8 md:pt-36 md:pb-12">
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <h1 className="text-[2.5rem] sm:text-5xl md:text-[3.5rem] lg:text-[4rem] font-display font-bold leading-[1.08] tracking-tight mb-5 text-[#1a2b5e]">
              {tt("hero_title_1")}
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                {tt("hero_title_2")}
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-xl mx-auto mb-8">
              {tt("hero_subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <button
                onClick={() => openWaitlist("hero")}
                className="group flex items-center gap-2 bg-[#1a2b5e] hover:bg-[#243672] text-white font-semibold px-7 py-3 rounded-lg transition-all text-[15px]"
              >
                {tt("hero_cta_primary")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 border border-slate-300 hover:border-slate-400 px-7 py-3 rounded-lg transition-all text-[15px]"
              >
                {tt("nav_login")}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Backed by */}
            <div className="flex flex-col items-center gap-2.5">
              <p className="text-[11px] font-medium text-slate-400 tracking-[0.15em] uppercase">
                {tt("team_backed")}
              </p>
              <div className="flex items-center gap-7">
                <img src={MIRACLEPLUS_LOGO} alt="MiraclePlus" className="h-7 md:h-8 w-auto opacity-40 hover:opacity-70 transition-opacity" />
                <img src={ANTLER_LOGO} alt="Antler" className="h-4 md:h-5 w-auto opacity-40 hover:opacity-70 transition-opacity" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CHAOS / PAIN POINT ──────────────────────── */}
      <ChaosSection tt={tt} imgs={imgs} openWaitlist={openWaitlist} />

      {/* ─── TWO PERSPECTIVES ────────────────────────── */}
      <PerspectivesSection tt={tt} />

      {/* ─── PRODUCT THREE MODULES ───────────────────── */}
      <ProductModulesSection tt={tt} imgs={imgs} />

      {/* ─── FEISHU INTEGRATION ──────────────────────── */}
      <FeishuSection tt={tt} imgs={imgs} />

      {/* ─── RESULTS ─────────────────────────────────── */}
      <ResultsSection tt={tt} />

      {/* ─── HOW IT WORKS ────────────────────────────── */}
      <HowSection tt={tt} />

      {/* ─── TEAM ────────────────────────────────────── */}
      <TeamSection tt={tt} />

      {/* ─── CTA ─────────────────────────────────────── */}
      <section id="cta" className="py-20 md:py-28 relative">
        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold leading-tight mb-5 text-[#1a2b5e]">
            {tt("cta_title_1")}
            <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
              {tt("cta_title_2")}
            </span>
          </h2>
          <p className="text-base text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed">
            {tt("cta_subtitle")}
          </p>
          <button
            onClick={() => openWaitlist("cta_bottom")}
            className="group inline-flex items-center gap-2 bg-[#1a2b5e] hover:bg-[#243672] text-white font-semibold px-8 py-3.5 rounded-lg transition-all text-[15px]"
          >
            {tt("cta_button")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <p className="text-xs text-slate-400 mt-3">{tt("cta_subtext")}</p>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────── */}
      <footer className="border-t border-slate-200/60 py-10 bg-white/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <img src={LOGO_IMG} alt="Meridian" className="h-7 w-auto" />
            </a>
            <div className="flex items-center gap-6 text-[13px] text-slate-400">
              <a href={`mailto:${tt("footer_email")}`} className="hover:text-slate-600 transition-colors">{tt("footer_email")}</a>
              <span className="hover:text-slate-600 transition-colors">{tt("footer_wechat")}</span>
              <button onClick={() => scrollTo("product")} className="hover:text-slate-600 transition-colors">{tt("nav_features")}</button>
              <button onClick={() => scrollTo("team")} className="hover:text-slate-600 transition-colors">{tt("nav_team")}</button>
            </div>
            <p className="text-xs text-slate-400">
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


/* ═══════════════════════════════════════════════════════
   SECTION COMPONENTS
   ═══════════════════════════════════════════════════════ */

/* ─── Chaos / Pain Point Section ─────────────────────── */
function ChaosSection({ tt, imgs, openWaitlist }: { tt: (k: string) => any; imgs: any; openWaitlist: (s: string) => void }) {
  const { ref, inView } = useInView(0.1);

  return (
    <section className="py-16 md:py-24">
      <div
        ref={ref}
        className={`max-w-6xl mx-auto px-6 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold text-amber-600 tracking-[0.2em] uppercase mb-4">{tt("pain_label")}</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold leading-tight mb-4 text-[#1a2b5e]">
            {tt("pain_title_1")}
            <br className="hidden sm:block" />
            <span className="text-slate-400 font-semibold">{tt("pain_title_2")}</span>
          </h2>
          <p className="text-base text-slate-500 leading-relaxed max-w-2xl mx-auto">
            {tt("pain_desc")}
          </p>
        </div>

        {/* Chaos desktop image */}
        <div className="relative max-w-5xl mx-auto mb-6">
          <div className="absolute -inset-4 bg-gradient-to-r from-amber-100/20 via-orange-100/15 to-amber-100/20 rounded-2xl blur-2xl opacity-40" />
          <div className="relative rounded-xl overflow-hidden border border-slate-200/60 shadow-xl">
            <img
              src={imgs.chaosDesktop}
              alt="Cross-border sales information chaos"
              className="w-full"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}


/* ─── Two Perspectives Section (Sales Rep + CEO) ─────── */
function PerspectivesSection({ tt }: { tt: (k: string) => any }) {
  const { ref, inView } = useInView(0.1);

  const salesItems = [
    tt("pain_sales_item1"),
    tt("pain_sales_item2"),
    tt("pain_sales_item3"),
  ];
  const bossItems = [
    tt("pain_boss_item1"),
    tt("pain_boss_item2"),
    tt("pain_boss_item3"),
  ];

  return (
    <section className="py-12 md:py-20">
      <div
        ref={ref}
        className={`max-w-5xl mx-auto px-6 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sales Rep perspective */}
          <div className="p-6 md:p-8 rounded-xl bg-white border border-slate-200/80">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-display font-semibold text-base text-slate-800">{tt("pain_sales_title")}</h3>
            </div>
            <blockquote className="text-[15px] text-slate-700 italic border-l-2 border-blue-300 pl-4 mb-5">
              "{tt("pain_sales_quote")}"
            </blockquote>
            <ul className="space-y-2.5">
              {salesItems.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-500 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* CEO perspective */}
          <div className="p-6 md:p-8 rounded-xl bg-white border border-slate-200/80">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Search className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-display font-semibold text-base text-slate-800">{tt("pain_boss_title")}</h3>
            </div>
            <blockquote className="text-[15px] text-slate-700 italic border-l-2 border-amber-300 pl-4 mb-5">
              "{tt("pain_boss_quote")}"
            </blockquote>
            <ul className="space-y-2.5">
              {bossItems.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-500 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Insight callout */}
        <div className="mt-8 p-5 rounded-xl bg-[#1a2b5e]/[0.04] border border-[#1a2b5e]/10 text-center">
          <p className="text-[15px] text-[#1a2b5e] font-medium leading-relaxed">
            {tt("pain_insight")}
          </p>
        </div>
      </div>
    </section>
  );
}


/* ─── Product Three Modules Section ──────────────────── */
function ProductModulesSection({ tt, imgs }: { tt: (k: string) => any; imgs: any }) {
  const { ref, inView } = useInView(0.1);

  const modules = [
    {
      numKey: "product_mod1_num",
      titleKey: "product_mod1_title",
      descKey: "product_mod1_desc",
      icon: Search,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      numKey: "product_mod2_num",
      titleKey: "product_mod2_title",
      descKey: "product_mod2_desc",
      icon: Users,
      accent: "bg-indigo-50 text-indigo-600",
    },
    {
      numKey: "product_mod3_num",
      titleKey: "product_mod3_title",
      descKey: "product_mod3_desc",
      icon: Database,
      accent: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <section id="product" className="py-20 md:py-28 bg-white">
      <div
        ref={ref}
        className={`max-w-6xl mx-auto px-6 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold text-blue-600 tracking-[0.2em] uppercase mb-4">{tt("product_label")}</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold leading-tight mb-5 text-[#1a2b5e]">
            {tt("product_title_1")}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
              {tt("product_title_2")}
            </span>
          </h2>
          <p className="text-base text-slate-500 leading-relaxed max-w-xl mx-auto">
            {tt("product_desc")}
          </p>
        </div>

        {/* Three module cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {modules.map((mod, i) => (
            <div
              key={mod.titleKey}
              className="relative p-6 rounded-xl bg-[#F7F8FA] border border-slate-100 transition-all duration-300 hover:shadow-md"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-display font-bold text-[#1a2b5e]/20">{tt(mod.numKey)}</span>
                <div className={`w-9 h-9 rounded-lg ${mod.accent.split(" ")[0]} flex items-center justify-center`}>
                  <mod.icon className={`w-4.5 h-4.5 ${mod.accent.split(" ")[1]}`} />
                </div>
              </div>
              <h3 className="font-display font-semibold text-lg mb-2 text-slate-800">{tt(mod.titleKey)}</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">{tt(mod.descKey)}</p>
            </div>
          ))}
        </div>

        {/* Product modules infographic from PDF */}
        <div className="relative max-w-4xl mx-auto">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-100/30 via-indigo-100/20 to-blue-100/30 rounded-2xl blur-2xl opacity-50" />
          <div className="relative rounded-xl overflow-hidden border border-slate-200/60 shadow-xl">
            <img
              src={imgs.productMockup}
              alt="Meridian Product Dashboard"
              className="w-full"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}


/* ─── Feishu Integration Section ─────────────────────── */
function FeishuSection({ tt, imgs }: { tt: (k: string) => any; imgs: any }) {
  const { ref, inView } = useInView(0.1);

  const items = [
    { titleKey: "feishu_item1_title", descKey: "feishu_item1_desc", icon: Bell },
    { titleKey: "feishu_item2_title", descKey: "feishu_item2_desc", icon: Zap },
    { titleKey: "feishu_item3_title", descKey: "feishu_item3_desc", icon: MessageSquare },
  ];

  return (
    <section className="py-20 md:py-28">
      <div
        ref={ref}
        className={`max-w-6xl mx-auto px-6 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {/* Feishu bot mockup - left */}
          <div className="flex-1 flex justify-center order-2 md:order-1">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-3 bg-gradient-to-r from-blue-100/30 to-indigo-100/30 rounded-2xl blur-xl opacity-50" />
              <img
                src={imgs.feishuBot}
                alt="Meridian Feishu Bot"
                className="relative w-full rounded-xl border border-slate-200/60 shadow-xl object-contain"
                loading="lazy"
              />
            </div>
          </div>

          {/* Text - right */}
          <div className="flex-1 order-1 md:order-2">
            <p className="text-[11px] font-semibold text-indigo-600 tracking-[0.2em] uppercase mb-4">{tt("feishu_label")}</p>
            <h2 className="text-2xl sm:text-3xl md:text-[2rem] font-display font-bold leading-tight mb-5 text-[#1a2b5e]">
              {tt("feishu_title_1")}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">{tt("feishu_title_2")}</span>
            </h2>

            <div className="space-y-5">
              {items.map((item) => (
                <div key={item.titleKey} className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-[15px] text-slate-800 mb-0.5">{tt(item.titleKey)}</h3>
                    <p className="text-[13px] text-slate-500 leading-relaxed">{tt(item.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ─── Results Section ────────────────────────────────── */
function ResultsSection({ tt }: { tt: (k: string) => any }) {
  const { ref, inView } = useInView(0.1);
  const stats = [
    { valueKey: "results_stat1_value", labelKey: "results_stat1_label", descKey: "results_stat1_desc" },
    { valueKey: "results_stat2_value", labelKey: "results_stat2_label", descKey: "results_stat2_desc" },
    { valueKey: "results_stat3_value", labelKey: "results_stat3_label", descKey: "results_stat3_desc" },
  ];

  return (
    <section id="results" className="py-20 md:py-28 bg-[#1a2b5e]">
      <div
        ref={ref}
        className={`max-w-5xl mx-auto px-6 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold text-blue-300 tracking-[0.2em] uppercase mb-4">{tt("results_label")}</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold leading-tight text-white">
            {tt("results_title_1")}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {stats.map((stat, i) => (
            <div
              key={stat.valueKey}
              className="text-center p-6 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-sm"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                {tt(stat.valueKey)}
              </div>
              <div className="text-sm font-medium text-blue-200 mb-1">{tt(stat.labelKey)}</div>
              <div className="text-xs text-blue-300/70">{tt(stat.descKey)}</div>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative">
            <Quote className="w-8 h-8 text-blue-400/30 mx-auto mb-4" />
            <blockquote className="text-lg md:text-xl text-white/90 leading-relaxed font-medium italic mb-4">
              "{tt("results_quote")}"
            </blockquote>
            <p className="text-sm text-blue-300/70">
              — {tt("results_quote_attr")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ─── How It Works Section ───────────────────────────── */
function HowSection({ tt }: { tt: (k: string) => any }) {
  const { ref, inView } = useInView(0.1);
  const weeks = [
    { num: "W1", titleKey: "how_week1_title", descKey: "how_week1_desc" },
    { num: "W2", titleKey: "how_week2_title", descKey: "how_week2_desc" },
    { num: "W3", titleKey: "how_week3_title", descKey: "how_week3_desc" },
    { num: "W4", titleKey: "how_week4_title", descKey: "how_week4_desc" },
  ];

  return (
    <section id="how" className="py-20 md:py-28 bg-white">
      <div
        ref={ref}
        className={`max-w-4xl mx-auto px-6 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold text-blue-600 tracking-[0.2em] uppercase mb-4">{tt("how_label")}</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold leading-tight text-[#1a2b5e]">
            {tt("how_title")}
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2 hidden md:block" />

          <div className="space-y-8 md:space-y-0">
            {weeks.map((week, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div key={week.num} className="relative md:flex md:items-center md:min-h-[120px]">
                  <div className={`hidden md:flex w-full items-center ${isLeft ? "" : "flex-row-reverse"}`}>
                    <div className={`w-[calc(50%-2rem)] ${isLeft ? "text-right pr-8" : "text-left pl-8"}`}>
                      <h3 className="font-display font-semibold text-base text-slate-800 mb-1">{tt(week.titleKey)}</h3>
                      <p className="text-[13px] text-slate-500 leading-relaxed">{tt(week.descKey)}</p>
                    </div>
                    <div className="w-16 flex justify-center shrink-0">
                      <div className="w-10 h-10 rounded-full bg-[#1a2b5e] text-white flex items-center justify-center text-xs font-bold font-display">
                        {week.num}
                      </div>
                    </div>
                    <div className="w-[calc(50%-2rem)]" />
                  </div>

                  <div className="md:hidden flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1a2b5e] text-white flex items-center justify-center text-xs font-bold font-display shrink-0">
                      {week.num}
                    </div>
                    <div className="pt-1.5">
                      <h3 className="font-display font-semibold text-base text-slate-800 mb-1">{tt(week.titleKey)}</h3>
                      <p className="text-[13px] text-slate-500 leading-relaxed">{tt(week.descKey)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security note */}
        <div className="mt-12 p-4 rounded-lg bg-slate-50 border border-slate-200/60 flex items-start gap-3">
          <Lock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-[13px] text-slate-500 leading-relaxed">{tt("how_security")}</p>
        </div>
      </div>
    </section>
  );
}


/* ─── Team Section ───────────────────────────────────── */
function TeamSection({ tt }: { tt: (k: string) => any }) {
  const { ref, inView } = useInView(0.1);

  return (
    <section id="team" className="py-20 md:py-28">
      <div
        ref={ref}
        className={`max-w-3xl mx-auto px-6 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold text-blue-600 tracking-[0.2em] uppercase mb-4">{tt("team_label")}</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold leading-tight text-[#1a2b5e]">
            {tt("team_title_1")}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
              {tt("team_title_2")}
            </span>
          </h2>
        </div>

        <div className="p-7 md:p-9 rounded-xl bg-white border border-slate-200/80">
          <p className="text-base md:text-[17px] text-slate-600 leading-relaxed mb-5">
            {tt("team_p1")}
          </p>
          <p className="text-base md:text-[17px] text-slate-600 leading-relaxed mb-6">
            {tt("team_p2")}
          </p>

          {/* Backed by logos */}
          <div className="flex items-center gap-5 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 tracking-[0.15em] uppercase">{tt("team_backed")}</span>
            <img src={MIRACLEPLUS_LOGO} alt="MiraclePlus" className="h-5 w-auto opacity-40 hover:opacity-70 transition-opacity" />
            <img src={ANTLER_LOGO} alt="Antler" className="h-3.5 w-auto opacity-40 hover:opacity-70 transition-opacity" />
          </div>
        </div>
      </div>
    </section>
  );
}
