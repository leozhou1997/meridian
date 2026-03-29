import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import {
  Check,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  Shield,
  Headphones,
  Coins,
  Menu,
  X,
} from "lucide-react";

const LOGO_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/meridian-logo-cropped_69e86f90.png";

/* ─── Plan Data ──────────────────────────────────────── */
interface Plan {
  name: string;
  tagline: string;
  price: string;
  period: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  borderColor: string;
}

const plans: Plan[] = [
  {
    name: "Pro",
    tagline: "For sales teams closing complex, multi-stakeholder deals",
    price: "$149",
    period: "per user / month",
    highlight: true,
    badge: "Most Popular",
    icon: Sparkles,
    gradient: "from-cyan-500 to-blue-600",
    borderColor: "border-cyan-500/30",
    features: [
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
  },
  {
    name: "Enterprise",
    tagline: "For revenue organizations at scale",
    price: "Custom",
    period: "",
    icon: Building2,
    gradient: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500/20",
    features: [
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
  },
];

/* ─── FAQ Data ───────────────────────────────────────── */
const faqs = [
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
];

/* ═══════════════════════════════════════════════════════
   PRICING PAGE
   ═══════════════════════════════════════════════════════ */
export default function Pricing() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
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

  return (
    <div className="min-h-screen bg-[#060a14] text-white overflow-x-hidden">
      {/* ─── NAV ─────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#060a14]/90 backdrop-blur-xl border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src={LOGO_IMG} alt="Meridian" className="h-10 w-auto brightness-0 invert" />
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="/#features" className="hover:text-white transition-colors">Features</a>
            <span className="text-white font-medium">Pricing</span>
            <a href="/#team" className="hover:text-white transition-colors">Team</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="text-sm text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
            >
              {user ? "Go to Dashboard" : "Log In"}
            </button>
            <button
              onClick={() => handleRequestAccess("pricing_nav")}
              className="text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-5 py-2 rounded-lg transition-all shadow-lg shadow-cyan-500/20"
            >
              Request Access
            </button>
          </div>

          <button
            className="md:hidden text-slate-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0f1e]/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 space-y-3">
            <a href="/#features" className="block text-sm text-slate-300 hover:text-white py-2">Features</a>
            <span className="block text-sm text-white font-medium py-2">Pricing</span>
            <a href="/#team" className="block text-sm text-slate-300 hover:text-white py-2">Team</a>
            <hr className="border-white/5" />
            <button onClick={() => navigate(user ? "/dashboard" : "/login")} className="block w-full text-left text-sm text-slate-300 hover:text-white py-2">
              {user ? "Go to Dashboard" : "Log In"}
            </button>
          </div>
        )}
      </nav>

      {/* ─── HERO ────────────────────────────────────── */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-cyan-500/6 via-blue-600/4 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, Transparent Pricing
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-[1.1] tracking-tight mb-6">
            Intelligence that{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              pays for itself.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Credit-based pricing that scales with your usage. Every insight generated consumes credits — so you only pay for the intelligence you actually use.
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
                  className={`relative flex flex-col rounded-2xl border ${plan.borderColor} bg-white/[0.02] p-8 lg:p-10 transition-all duration-300 hover:border-white/10 ${
                    plan.highlight
                      ? "ring-1 ring-cyan-500/30 shadow-xl shadow-cyan-500/5"
                      : ""
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-medium text-white shadow-lg shadow-cyan-500/20">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-display font-bold mb-1">{plan.name}</h3>
                    <p className="text-sm text-slate-500">{plan.tagline}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-display font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-sm text-slate-500 ml-1">{plan.period}</span>
                      )}
                    </div>
                  </div>

                  {/* Credits callout for Pro */}
                  {plan.highlight && (
                    <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                      <Coins className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-xs text-cyan-300">1,000 AI credits included monthly — additional packs available</span>
                    </div>
                  )}

                  {!plan.highlight && <div className="mb-6" />}

                  <button
                    onClick={() => plan.highlight ? handleRequestAccess("pricing_plan") : handleContactSales()}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all mb-8 ${
                      plan.highlight
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                        : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                    }`}
                  >
                    Request Access
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                          plan.highlight ? "text-cyan-400" : "text-purple-400"
                        }`} />
                        <span className="text-slate-300">{feature}</span>
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
      <section className="py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-cyan-400 tracking-widest uppercase mb-3">How Credits Work</p>
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              Pay for intelligence, not seats
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Coins, label: "Credit-based usage", desc: "Each insight consumes credits based on complexity" },
              { icon: Sparkles, label: "1,000 credits/mo", desc: "Included with every Pro seat" },
              { icon: Users, label: "Team collaboration", desc: "Share insights across your team" },
              { icon: Shield, label: "Enterprise security", desc: "SOC 2, SSO, data isolation" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
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
            <p className="text-sm font-medium text-cyan-400 tracking-widest uppercase mb-4">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                  <span
                    className={`text-slate-500 transition-transform duration-200 shrink-0 ${
                      openFaq === i ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 -mt-1">
                    <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
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
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-cyan-500/6 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight mb-6">
            Ready to close deals with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              confidence
            </span>
            ?
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-lg mx-auto">
            Start with Pro and see how AI-powered deal intelligence transforms your win rate.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleRequestAccess("pricing_cta")}
              className="group flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-cyan-500/20 text-base"
            >
              Request Access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={handleContactSales}
              className="flex items-center gap-2 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 px-8 py-3.5 rounded-xl transition-all text-base"
            >
              Talk to Sales
            </button>
          </div>
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
              <a href="/#features" className="hover:text-slate-300 transition-colors">Features</a>
              <a href="/pricing" className="text-white font-medium">Pricing</a>
              <a href="/#team" className="hover:text-slate-300 transition-colors">Team</a>
              <button onClick={() => navigate("/login")} className="hover:text-slate-300 transition-colors">Log In</button>
            </div>

            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} Meridian Sales Intelligence. All rights reserved.
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
