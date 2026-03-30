import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { t, translations } from "@/lib/i18n";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import {
  Check,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  Shield,
  Coins,
  Menu,
  X,
  Globe,
} from "lucide-react";

const LOGO_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/meridian-logo-cropped_69e86f90.png";

/* ═══════════════════════════════════════════════════════
   PRICING PAGE — LIGHT THEME
   ═══════════════════════════════════════════════════════ */
export default function Pricing() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistSource, setWaitlistSource] = useState("pricing_page");

  const handleRequestAccess = (source = "pricing_page") => {
    setWaitlistSource(source);
    setWaitlistOpen(true);
  };

  const handleContactSales = () => {
    window.location.href = "mailto:hello@meridianos.ai?subject=Enterprise%20Inquiry";
  };

  const toggleLang = () => setLanguage(language === "en" ? "zh" : "en");

  /* ─── Derived plan data from translations ─── */
  const plans = [
    {
      name: t(language, "plan_pro_name"),
      tagline: t(language, "plan_pro_tagline"),
      price: t(language, "plan_pro_price"),
      period: t(language, "plan_pro_period"),
      highlight: true,
      badge: t(language, "plan_pro_badge"),
      creditsNote: t(language, "plan_pro_credits_note"),
      features: t(language, "plan_pro_features") as string[],
      icon: Sparkles,
      gradient: "from-blue-600 to-indigo-600",
      borderColor: "border-blue-200",
    },
    {
      name: t(language, "plan_enterprise_name"),
      tagline: t(language, "plan_enterprise_tagline"),
      price: t(language, "plan_enterprise_price"),
      period: t(language, "plan_enterprise_period"),
      highlight: false,
      badge: undefined as string | undefined,
      creditsNote: undefined as string | undefined,
      features: t(language, "plan_enterprise_features") as string[],
      icon: Building2,
      gradient: "from-purple-500 to-pink-500",
      borderColor: "border-slate-200",
    },
  ];

  const creditsItems = [
    { icon: Coins, label: t(language, "credits_item1_label"), desc: t(language, "credits_item1_desc") },
    { icon: Sparkles, label: t(language, "credits_item2_label"), desc: t(language, "credits_item2_desc") },
    { icon: Users, label: t(language, "credits_item3_label"), desc: t(language, "credits_item3_desc") },
    { icon: Shield, label: t(language, "credits_item4_label"), desc: t(language, "credits_item4_desc") },
  ];

  const faqs = t(language, "faqs") as Array<{ q: string; a: string }>;

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* ─── NAV ─────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src={LOGO_IMG} alt="Meridian" className="h-10 w-auto" />
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-500">
            <a href="/#features" className="hover:text-slate-900 transition-colors">
              {t(language, "nav_features")}
            </a>
            <span className="text-slate-900 font-medium">{t(language, "nav_pricing")}</span>
            <a href="/#team" className="hover:text-slate-900 transition-colors">
              {t(language, "nav_team")}
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Language switcher */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors"
              title={language === "en" ? "切换到中文" : "Switch to English"}
            >
              <Globe className="w-4 h-4" />
              {language === "en" ? "中文" : "EN"}
            </button>

            <button
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="text-sm text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg transition-colors"
            >
              {user ? t(language, "nav_dashboard") : t(language, "nav_login")}
            </button>
            <button
              onClick={() => handleRequestAccess("pricing_nav")}
              className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2 rounded-lg transition-all shadow-lg shadow-blue-500/20"
            >
              {t(language, "nav_request_access")}
            </button>
          </div>

          <button
            className="md:hidden text-slate-600 hover:text-slate-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/60 px-6 py-4 space-y-3">
            <a href="/#features" className="block text-sm text-slate-600 hover:text-slate-900 py-2">
              {t(language, "nav_features")}
            </a>
            <span className="block text-sm text-slate-900 font-medium py-2">{t(language, "nav_pricing")}</span>
            <a href="/#team" className="block text-sm text-slate-600 hover:text-slate-900 py-2">
              {t(language, "nav_team")}
            </a>
            <hr className="border-slate-200" />
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 py-2"
            >
              <Globe className="w-4 h-4" />
              {language === "en" ? "切换到中文" : "Switch to English"}
            </button>
            <button
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="block w-full text-left text-sm text-slate-600 hover:text-slate-900 py-2"
            >
              {user ? t(language, "nav_dashboard") : t(language, "nav_login")}
            </button>
          </div>
        )}
      </nav>

      {/* ─── HERO ────────────────────────────────────── */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-50 via-indigo-50/50 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            {t(language, "pricing_badge")}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-[1.1] tracking-tight mb-6 text-slate-900">
            {t(language, "pricing_title_1")}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              {t(language, "pricing_title_highlight")}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
            {t(language, "pricing_subtitle")}
          </p>
        </div>
      </section>

      {/* ─── PRICING CARDS ───────────────────────────── */}
      <section className="pb-24 md:pb-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border ${plan.borderColor} bg-white p-8 lg:p-10 transition-all duration-300 hover:shadow-lg ${
                    plan.highlight
                      ? "ring-1 ring-blue-300 shadow-xl shadow-blue-500/10"
                      : "shadow-sm"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-medium text-white shadow-lg shadow-blue-500/20">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-slate-900 mb-1">{plan.name}</h3>
                    <p className="text-sm text-slate-500">{plan.tagline}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-display font-bold text-slate-900">{plan.price}</span>
                      {plan.period && (
                        <span className="text-sm text-slate-500 ml-1">{plan.period}</span>
                      )}
                    </div>
                  </div>

                  {/* Credits callout for Pro */}
                  {plan.highlight && plan.creditsNote && (
                    <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                      <Coins className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs text-blue-700">{plan.creditsNote}</span>
                    </div>
                  )}

                  {!plan.highlight && <div className="mb-6" />}

                  <button
                    onClick={() => plan.highlight ? handleRequestAccess("pricing_plan") : handleContactSales()}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all mb-8 ${
                      plan.highlight
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {t(language, "request_access")}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                          plan.highlight ? "text-blue-600" : "text-purple-500"
                        }`} />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW CREDITS WORK ────────────────────────── */}
      <section className="py-16 border-y border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-blue-600 tracking-widest uppercase mb-3">
              {t(language, "credits_badge")}
            </p>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900">
              {t(language, "credits_title")}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {creditsItems.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────── */}
      <section id="faq" className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-blue-600 tracking-widest uppercase mb-4">
              {t(language, "faq_badge")}
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight text-slate-900">
              {t(language, "faq_title")}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-sm font-medium text-slate-900 pr-4">{faq.q}</span>
                  <span
                    className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                      openFaq === i ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 -mt-1">
                    <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ──────────────────────────────── */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-blue-50 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight mb-6 text-slate-900">
            {t(language, "pricing_cta_title_1")}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {t(language, "pricing_cta_title_highlight")}
            </span>
            ?
          </h2>
          <p className="text-lg text-slate-500 mb-10 max-w-lg mx-auto">
            {t(language, "pricing_cta_subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleRequestAccess("pricing_cta")}
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-500/20 text-base"
            >
              {t(language, "request_access")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={handleContactSales}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 border border-slate-300 hover:border-slate-400 px-8 py-3.5 rounded-xl transition-all text-base"
            >
              {t(language, "talk_to_sales")}
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────── */}
      <footer className="border-t border-slate-200/60 py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <img src={LOGO_IMG} alt="Meridian" className="h-8 w-auto" />
            </a>

            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="/#features" className="hover:text-slate-700 transition-colors">
                {t(language, "nav_features")}
              </a>
              <a href="/pricing" className="text-slate-900 font-medium">{t(language, "nav_pricing")}</a>
              <a href="/#team" className="hover:text-slate-700 transition-colors">
                {t(language, "nav_team")}
              </a>
              <button onClick={() => navigate("/login")} className="hover:text-slate-700 transition-colors">
                {t(language, "nav_login")}
              </button>
            </div>

            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} {t(language, "footer_copyright")}
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
