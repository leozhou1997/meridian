import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
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
  Mail,
  Loader2,
  Menu,
  X,
} from "lucide-react";

/* ─── CDN Assets ─────────────────────────────────────── */
const LOGO_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/meridian-logo-cropped_69e86f90.png";
const HERO_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/hero-product-mockup-WTVk7MPtNg3kv8RX8Lt6Lh.webp";
const FEATURE_MAP =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-stakeholder-map-v3-XpdspnpuAKvTKPjMMm5oz5.webp";
const FEATURE_INSIGHT =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-ai-insight-VrpwZXFHpvvsiDzqKWMfZu.webp";
const FEATURE_ROOM =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/feature-deal-room-P9metY77PHf7ktVxoerFW6.webp";
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
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for nav background
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const requestAccessMutation = trpc.landing.requestAccess.useMutation({
    onSuccess: () => {
      setSubmitting(false);
      setSubmitted(true);
    },
    onError: () => {
      setSubmitting(false);
      // Still show success to user (don't expose backend errors)
      setSubmitted(true);
    },
  });

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    requestAccessMutation.mutate({ email: email.trim() });
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

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
            <button onClick={() => scrollTo("features")} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollTo("how-it-works")} className="hover:text-white transition-colors">How It Works</button>
            <button onClick={() => scrollTo("team")} className="hover:text-white transition-colors">Team</button>
            <button onClick={() => navigate("/pricing")} className="hover:text-white transition-colors">Pricing</button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="text-sm text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
            >
              {user ? "Go to Dashboard" : "Log In"}
            </button>
            <button
              onClick={() => scrollTo("cta")}
              className="text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-5 py-2 rounded-lg transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
            >
              Request Access
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
            <button onClick={() => scrollTo("features")} className="block w-full text-left text-sm text-slate-300 hover:text-white py-2">Features</button>
            <button onClick={() => scrollTo("how-it-works")} className="block w-full text-left text-sm text-slate-300 hover:text-white py-2">How It Works</button>
            <button onClick={() => scrollTo("team")} className="block w-full text-left text-sm text-slate-300 hover:text-white py-2">Team</button>
            <button onClick={() => navigate("/pricing")} className="block w-full text-left text-sm text-slate-300 hover:text-white py-2">Pricing</button>
            <hr className="border-white/5" />
            <button onClick={() => navigate(user ? "/dashboard" : "/login")} className="block w-full text-left text-sm text-slate-300 hover:text-white py-2">{user ? "Go to Dashboard" : "Log In"}</button>
            <button
              onClick={() => scrollTo("cta")}
              className="block w-full text-center text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 rounded-lg"
            >
              Request Access
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
              AI-Powered Sales Intelligence
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight mb-6">
              Stop guessing.{" "}
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                Start knowing.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
              Meridian is the AI deal intelligence layer that reads your sales conversations,
              maps the buying committee, and tells you exactly what to do next to win.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => scrollTo("cta")}
                className="group flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 text-base"
              >
                Request Early Access
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 px-8 py-3.5 rounded-xl transition-all text-base"
              >
                Log In
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* ─── BACKED BY ─────────────────────────── */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <p className="text-xs font-medium text-slate-500 tracking-widest uppercase">Backed by</p>
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
                src={HERO_IMG}
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
              { value: 68, suffix: "%", label: "Avg. win-rate improvement" },
              { value: 3, suffix: "x", label: "Faster deal qualification" },
              { value: 40, suffix: "%", label: "Less time on CRM data entry" },
              { value: 2, suffix: "min", label: "Pre-meeting brief generation" },
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
          <p className="text-sm font-medium text-cyan-400 tracking-widest uppercase mb-4">The Problem</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight mb-8">
            Your CRM tracks activities.{" "}
            <span className="text-slate-500">It doesn't understand your deals.</span>
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed max-w-3xl mx-auto mb-16">
            Enterprise sales teams spend 60% of their time on admin instead of selling.
            Critical stakeholder dynamics are trapped in reps' heads. Deals slip through
            the cracks because no one sees the full picture until it's too late.
          </p>

          {/* Pain Point Cards */}
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              {
                icon: Users,
                title: "Invisible buying committees",
                desc: "You don't know who's really making the decision, who's blocking, or who you haven't met yet.",
              },
              {
                icon: Brain,
                title: "Insights trapped in conversations",
                desc: "Critical signals from calls and emails never make it into your CRM or deal strategy.",
              },
              {
                icon: Target,
                title: "Reactive deal management",
                desc: "By the time you realize a deal is at risk, it's already too late to course-correct.",
              },
            ].map((pain) => (
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
            <p className="text-sm font-medium text-cyan-400 tracking-widest uppercase mb-4">Features</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight">
              Your AI co-pilot for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                complex deals
              </span>
            </h2>
          </div>

          {/* Feature 1: AI Deal Insight */}
          <FeatureRow
            badge="Deal Intelligence"
            title="AI that reads between the lines"
            desc="Meridian analyzes every meeting transcript, email, and note to generate a real-time deal narrative. It identifies what's happening, surfaces key risks, and recommends your exact next moves — grounded in your chosen sales methodology (MEDDIC, BANT, SPICED, or custom)."
            bullets={[
              "Win confidence score with 30-day trend tracking",
              "Key risks with stakeholder attribution",
              "AI-suggested next actions with Accept / Dismiss / Later",
              "Contextual chat — ask the AI anything about your deal",
            ]}
            image={FEATURE_INSIGHT}
            imageAlt="AI Deal Insight Panel — 68% Confidence Score, Risk Analysis, and Next Steps"
            imagePosition="right"
          />

          {/* Feature 2: Stakeholder Map */}
          <FeatureRow
            badge="Buying Committee"
            title="Map the power dynamics"
            desc="Visualize the entire buying committee in an interactive concentric-circle map. Decision makers at the center, blockers on the outside. Drag, connect, and annotate relationships. AI auto-generates the initial map from your first meeting — you refine from there."
            bullets={[
              "Concentric circle layout by influence level",
              "Relationship lines and interaction history",
              "Pre-meeting briefs generated per stakeholder",
              "AI-suggested contacts you haven't engaged yet",
            ]}
            image={FEATURE_MAP}
            imageAlt="Interactive Stakeholder Relationship Map"
            imagePosition="left"
          />

          {/* Feature 3: Deal Room */}
          <FeatureRow
            badge="Deal Room"
            title="Every interaction, one timeline"
            desc="Meetings, notes, emails, documents — everything that happened in a deal, organized chronologically. Upload a call recording and get an AI-generated summary in minutes. No more digging through Slack threads or email chains to find what was said."
            bullets={[
              "Multi-source timeline (meetings, notes, emails, docs)",
              "AI meeting summaries from transcripts",
              "Voice transcription with speaker detection",
              "Quick capture from any device",
            ]}
            image={FEATURE_ROOM}
            imageAlt="Deal Timeline — Chronological Meeting History with AI Summaries"
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
            <p className="text-sm font-medium text-cyan-400 tracking-widest uppercase mb-4">How It Works</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight mb-6">
              The Meridian{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Intelligence Engine
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Four layers working together to transform raw sales data into actionable deal strategy.
            </p>
          </div>

          {/* Chip Stack */}
          <div className="max-w-lg mx-auto space-y-4">
            {[
              {
                layer: "Layer 4",
                title: "Action Layer",
                desc: "What's Next recommendations, pre-meeting briefs, risk alerts",
                icon: Zap,
                color: "from-purple-500 to-pink-500",
                glow: "shadow-purple-500/20",
                borderColor: "border-purple-500/30",
              },
              {
                layer: "Layer 3",
                title: "Intelligence Layer",
                desc: "Deal narrative, confidence scoring, methodology grading",
                icon: Brain,
                color: "from-blue-500 to-cyan-500",
                glow: "shadow-blue-500/20",
                borderColor: "border-blue-500/30",
              },
              {
                layer: "Layer 2",
                title: "Understanding Layer",
                desc: "Stakeholder mapping, relationship analysis, sentiment detection",
                icon: Users,
                color: "from-cyan-500 to-teal-500",
                glow: "shadow-cyan-500/20",
                borderColor: "border-cyan-500/30",
              },
              {
                layer: "Layer 1",
                title: "Data Layer",
                desc: "Meeting transcripts, emails, notes, documents, CRM data",
                icon: Layers,
                color: "from-slate-500 to-slate-400",
                glow: "shadow-slate-500/10",
                borderColor: "border-slate-500/30",
              },
            ].map((chip, i) => (
              <ChipCard key={chip.title} chip={chip} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── TEAM ────────────────────────────────────── */}
      <section id="team" className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-cyan-400 tracking-widest uppercase mb-4">Our Team</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight mb-6">
              Built by a team that's{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                lived the problem
              </span>
            </h2>
          </div>

          <div className="p-8 md:p-10 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-6">
              We've spent years in the trenches of enterprise sales — running complex deals, managing buying committees, and losing sleep over pipeline reviews. We've seen firsthand how the best sales teams win: not through more activity, but through deeper understanding.
            </p>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-6">
              We built Meridian because we believe sales intelligence shouldn't be trapped in spreadsheets and tribal knowledge. Every deal tells a story — the relationships, the risks, the momentum. We're building the AI that reads that story and helps you write a better ending.
            </p>
            <p className="text-base text-slate-400 leading-relaxed">
              Our team combines deep enterprise sales experience with AI and product engineering. We're backed by{" "}
              <span className="text-cyan-400 font-medium">MiraclePlus</span> and{" "}
              <span className="text-cyan-400 font-medium">Antler</span>, and we're based between Singapore and San Francisco.
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
            Ready to see your deals{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              clearly
            </span>
            ?
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-lg mx-auto">
            Join the waitlist for early access. We're onboarding select teams who sell
            complex, multi-stakeholder deals.
          </p>

          {submitted ? (
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-300 font-medium">
                You're on the list. We'll be in touch soon.
              </span>
            </div>
          ) : (
            <form onSubmit={handleRequestAccess} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 text-sm whitespace-nowrap disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Request Access
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-xs text-slate-600 mt-4">
            No credit card required. We'll reach out within 48 hours.
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
              <button onClick={() => scrollTo("features")} className="hover:text-slate-300 transition-colors">Features</button>
              <button onClick={() => scrollTo("how-it-works")} className="hover:text-slate-300 transition-colors">How It Works</button>
              <button onClick={() => scrollTo("team")} className="hover:text-slate-300 transition-colors">Team</button>
              <button onClick={() => navigate("/pricing")} className="hover:text-slate-300 transition-colors">Pricing</button>
              <button onClick={() => navigate("/login")} className="hover:text-slate-300 transition-colors">Log In</button>
            </div>

            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} Meridian Sales Intelligence. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
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
