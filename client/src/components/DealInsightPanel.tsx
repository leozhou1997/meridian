import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCurrency, getConfidenceColor } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle, Check, Plus, Trash2, Calendar, Send, Loader2,
  ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

type NextAction = {
  id: number;
  text: string;
  dueDate: Date | string | null;
  priority: string;
  completed: boolean;
};

type Snapshot = {
  id: number;
  date: Date | string;
  confidenceScore: number;
  confidenceChange: number;
  whatsHappening: string | null;
  keyRisks: unknown;
  whatsNext: string[] | null;
  interactionType: string | null;
};

type Stakeholder = {
  id: number;
  name: string;
  title: string | null;
  role: string;
  sentiment: string;
  engagement: string;
};

type Deal = {
  id: number;
  name: string;
  stage: string;
  value: number;
  confidenceScore: number;
  companyInfo?: string;
  snapshots: Snapshot[];
  stakeholders: Stakeholder[];
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type Props = {
  deal: Deal;
  latestSnapshot: Snapshot | undefined;
  nextActions: NextAction[];
  addingAction: boolean;
  setAddingAction: (v: boolean | ((prev: boolean) => boolean)) => void;
  newActionText: string;
  setNewActionText: (v: string) => void;
  newActionDue: string;
  setNewActionDue: (v: string) => void;
  addAction: () => void;
  toggleAction: (id: number) => void;
  deleteAction: (id: number) => void;
  setActiveTab: (tab: string) => void;
  onStakeholderHover?: (id: number | null) => void;
  onStakeholderClick?: (id: number) => void;
};

type SuggestedContact = { name: string; title: string; reason: string };
type WhatsNextItem = string | { action: string; rationale: string; suggestedContacts?: SuggestedContact[] };

/** Expandable action card for What's Next items */
function WhatsNextCard({
  item,
  stakeholders,
  onStakeholderHover,
  onStakeholderClick,
  onAccept,
  onAddToMap,
  dealCompany,
}: {
  item: WhatsNextItem;
  stakeholders: Stakeholder[];
  onStakeholderHover?: (id: number | null) => void;
  onStakeholderClick?: (id: number) => void;
  onAccept?: (actionText: string) => void;
  onAddToMap?: (contact: SuggestedContact) => void;
  dealCompany?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<'accepted' | 'dismissed' | 'later' | null>(null);

  const actionText = typeof item === 'string' ? item : item.action;
  const rationale = typeof item === 'string' ? null : item.rationale;
  const suggestedContacts: SuggestedContact[] = typeof item === 'string' ? [] : (item.suggestedContacts ?? []);
  const [addedContacts, setAddedContacts] = useState<Set<string>>(new Set());

  // Find stakeholders mentioned in this action item
  const mentioned = stakeholders.filter(s => {
    const firstName = s.name.split(' ')[0];
    return actionText.includes(s.name) || (firstName.length > 2 && actionText.includes(firstName));
  });

  // Every card is always expandable — rationale, stakeholders, and feedback buttons are always shown

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFeedback('accepted');
    onAccept?.(actionText);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFeedback('dismissed');
  };

  const handleLater = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFeedback('later');
  };

  if (feedback === 'dismissed') {
    return (
      <div className="rounded-lg border border-border/20 bg-muted/5 px-3 py-2 flex items-center gap-2 opacity-40">
        <div className="w-3 h-3 rounded-full border border-muted-foreground/30 shrink-0" />
        <span className="flex-1 text-[11px] text-muted-foreground/60 line-through leading-snug">{actionText}</span>
        <button onClick={() => setFeedback(null)} className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70">undo</button>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border overflow-hidden transition-all ${
      feedback === 'accepted' ? 'border-emerald-400/40 bg-emerald-400/5' :
      feedback === 'later' ? 'border-amber-400/30 bg-amber-400/5' :
      'border-border/30 bg-muted/10'
    }`}>
      {/* Card header — always visible */}
      <button
        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted/20 transition-colors group"
        onClick={() => setExpanded(e => !e)}
      >
        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
          feedback === 'accepted' ? 'border-emerald-400 bg-emerald-400/20' :
          feedback === 'later' ? 'border-amber-400/60 bg-amber-400/10' :
          'border-emerald-400/50 bg-emerald-400/10'
        }`}>
          {feedback === 'accepted'
            ? <Check className="w-2.5 h-2.5 text-emerald-400" />
            : <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
        </div>
        <span className="flex-1 text-[12px] text-foreground/85 leading-snug">
          <StakeholderLinkedText
            text={actionText}
            stakeholders={stakeholders}
            onHover={onStakeholderHover}
            onClick={onStakeholderClick}
          />
        </span>
        <div className="shrink-0 mt-0.5 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border/20 space-y-3">

          {/* AI Rationale */}
          <div className="flex items-start gap-2">
            <Sparkles className="w-3 h-3 text-primary/60 shrink-0 mt-0.5" />
            {rationale
              ? <p className="text-[11.5px] text-foreground/70 leading-relaxed italic">{rationale}</p>
              : <p className="text-[11.5px] text-muted-foreground/40 leading-relaxed italic">Hit “Refresh Insights” above to generate AI rationale for this action.</p>
            }
          </div>

          {/* Relevant Stakeholders */}
          {mentioned.length > 0 && (
            <div>
              <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1.5">Relevant Stakeholders</div>
              <div className="space-y-1.5">
                {mentioned.map(s => (
                  <button
                    key={s.id}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-card/60 border border-border/30 hover:border-primary/30 hover:bg-card/80 transition-all text-left"
                    onMouseEnter={() => onStakeholderHover?.(s.id)}
                    onMouseLeave={() => onStakeholderHover?.(null)}
                    onClick={() => onStakeholderClick?.(s.id)}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                      {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-foreground/90 truncate">{s.name}</div>
                      {s.title && <div className="text-[10px] text-muted-foreground/60 truncate">{s.title}</div>}
                    </div>
                    <div className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                      s.sentiment === 'Positive' ? 'bg-emerald-400/10 text-emerald-400' :
                      s.sentiment === 'Negative' ? 'bg-red-400/10 text-red-400' :
                      'bg-amber-400/10 text-amber-400'
                    }`}>{s.sentiment}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Contacts — AI-recommended people not yet on the map */}
          {suggestedContacts.length > 0 && (
            <div>
              <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-primary/50" />
                Suggested Contacts
              </div>
              <div className="space-y-2">
                {suggestedContacts.map(contact => {
                  const isAdded = addedContacts.has(contact.name);
                  const linkedInQuery = encodeURIComponent(`${contact.name} ${dealCompany ?? ''}`.trim());
                  return (
                    <div
                      key={contact.name}
                      className={`rounded-lg border p-2.5 transition-all ${
                        isAdded
                          ? 'border-emerald-400/30 bg-emerald-400/5'
                          : 'border-border/30 bg-muted/10'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-foreground/90">{contact.name}</div>
                          <div className="text-[10px] text-muted-foreground/70">{contact.title}</div>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-snug">{contact.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 ml-9">
                        {isAdded ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                            <Check className="w-3 h-3" /> Added to map
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToMap?.(contact);
                              setAddedContacts(prev => new Set(Array.from(prev).concat(contact.name)));
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-medium hover:bg-primary/25 transition-colors"
                          >
                            <Plus className="w-2.5 h-2.5" /> Add to Map
                          </button>
                        )}
                        <a
                          href={`https://www.linkedin.com/search/results/people/?keywords=${linkedInQuery}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0077b5]/15 text-[#0077b5] text-[10px] font-medium hover:bg-[#0077b5]/25 transition-colors"
                        >
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          LinkedIn
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accept / Dismiss / Later */}
          {feedback === null && (
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={handleAccept}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 text-[10.5px] font-medium transition-colors"
              >
                <Check className="w-3 h-3" /> Accept
              </button>
              <button
                onClick={handleDismiss}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/30 hover:bg-muted/50 text-muted-foreground/70 text-[10.5px] font-medium transition-colors"
              >
                <span className="text-[11px]">✕</span> Dismiss
              </button>
              <button
                onClick={handleLater}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-400/10 hover:bg-amber-400/20 text-amber-400/80 text-[10.5px] font-medium transition-colors"
              >
                <span className="text-[11px]">=</span> Later
              </button>
            </div>
          )}
          {feedback === 'accepted' && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-400">
              <Check className="w-3 h-3" /> Added to Next Actions
              <button onClick={() => setFeedback(null)} className="ml-auto text-muted-foreground/40 hover:text-muted-foreground/70">undo</button>
            </div>
          )}
          {feedback === 'later' && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-amber-400/80">
              <span>= Saved for later</span>
              <button onClick={() => setFeedback(null)} className="ml-auto text-muted-foreground/40 hover:text-muted-foreground/70">undo</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Renders text with stakeholder names highlighted as interactive links */
function StakeholderLinkedText({
  text,
  stakeholders,
  onHover,
  onClick,
}: {
  text: string;
  stakeholders: Stakeholder[];
  onHover?: (id: number | null) => void;
  onClick?: (id: number) => void;
}) {
  if (!stakeholders.length) return <span>{text}</span>;

  // Build a regex that matches stakeholder names, first names, and titles
  // Title matching: only match specific role titles (not generic words)
  // e.g. "CTO", "VP of Engineering", "CFO" — but not "Director" alone
  const titleTerms = stakeholders
    .filter(s => s.title)
    .flatMap(s => {
      const title = s.title!;
      const terms: string[] = [];
      // Match full title
      terms.push(title);
      // Match common abbreviations within the title (CTO, CFO, CIO, VP, CEO, COO)
      const abbrevMatch = title.match(/\b(C[A-Z]O|VP|SVP|EVP|CPO|CMO|CRO)\b/);
      if (abbrevMatch) terms.push(abbrevMatch[0]);
      return terms;
    });

  const names = stakeholders
    .flatMap(s => {
      const parts = [s.name];
      const firstName = s.name.split(' ')[0];
      if (firstName && firstName.length > 2) parts.push(firstName);
      return parts;
    });

  const allTerms = [...names, ...titleTerms]
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe
    .sort((a, b) => b.length - a.length); // longest first to avoid partial matches

  const escaped = allTerms.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'g');

  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => {
        const stakeholder = stakeholders.find(
          s =>
            s.name === part ||
            s.name.startsWith(part + ' ') ||
            (s.title === part) ||
            (s.title?.includes(part) && /\b(C[A-Z]O|VP|SVP|EVP|CPO|CMO|CRO)\b/.test(part))
        );
        if (!stakeholder) return <span key={i}>{part}</span>;
        return (
          <span
            key={i}
            className="text-primary underline decoration-dotted underline-offset-2 cursor-pointer hover:text-primary/80 transition-colors font-medium"
            onMouseEnter={() => onHover?.(stakeholder.id)}
            onMouseLeave={() => onHover?.(null)}
            onClick={() => onClick?.(stakeholder.id)}
          >
            {part}
          </span>
        );
      })}
    </span>
  );
}

export default function DealInsightPanel({
  deal,
  latestSnapshot,
  nextActions,
  addingAction,
  setAddingAction,
  newActionText,
  setNewActionText,
  newActionDue,
  setNewActionDue,
  addAction,
  toggleAction,
  deleteAction,
  setActiveTab,
  onStakeholderHover,
  onStakeholderClick,
}: Props) {
  // Panel collapse state
  const [collapsed, setCollapsed] = useState(false);

  // Inline chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Local overrides for AI insights (updated via chat only — not for whatsNext which is now DB-persisted)
  const [insightOverrides, setInsightOverrides] = useState<{
    whatsHappening?: string;
    keyRisks?: string[];
    updatedAt?: Date;
  }>({});

  const utils = trpc.useUtils();
  const generateInsightsMutation = trpc.ai.generateDealInsight.useMutation({
    onSuccess: (data) => {
      setInsightOverrides({
        whatsHappening: data.whatsHappening,
        keyRisks: data.keyRisks,
        updatedAt: new Date(),
      });
      // Invalidate deal query so snapshots reload with the newly persisted insights
      utils.deals.get.invalidate({ id: deal.id });
      toast.success('Deal insights updated — Meridian has analysed the latest context');
    },
    onError: (err) => {
      toast.error('Failed to generate insights: ' + err.message);
    },
  });

  const chatMutation = trpc.ai.chatWithDeal.useMutation({
    onSuccess: (data) => {
      const assistantMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMsg]);

      if (data.updatedInsights) {
        setInsightOverrides({
          whatsHappening: data.updatedInsights.whatsHappening,
          keyRisks: data.updatedInsights.keyRisks,
          updatedAt: new Date(),
        });
        toast.success('Meridian updated the deal insights based on your input');
      }
    },
    onError: (err) => {
      toast.error('Failed to get AI response: ' + err.message);
    },
  });

  const addSuggestedContactMutation = trpc.stakeholders.create.useMutation({
    onSuccess: (newStakeholder) => {
      utils.deals.get.invalidate({ id: deal.id });
      toast.success(`${newStakeholder.name} added to the stakeholder map`);
    },
    onError: (err) => {
      toast.error('Failed to add contact: ' + err.message);
    },
  });

  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  const sendChat = () => {
    const msg = chatInput.trim();
    if (!msg || chatMutation.isPending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    if (!chatOpen) setChatOpen(true);

    const currentRisks = insightOverrides.keyRisks ??
      (latestSnapshot?.keyRisks as string[] | null) ?? [];

    chatMutation.mutate({
      dealId: deal.id,
      dealName: deal.name,
      dealStage: deal.stage,
      dealValue: deal.value,
      confidenceScore: deal.confidenceScore,
      companyInfo: deal.companyInfo,
      currentWhatsHappening: insightOverrides.whatsHappening ?? latestSnapshot?.whatsHappening ?? undefined,
      currentKeyRisks: currentRisks,
      currentWhatsNext: JSON.stringify(latestSnapshot?.whatsNext) ?? undefined,
      stakeholders: deal.stakeholders.map(s => ({
        name: s.name,
        title: s.title,
        role: s.role,
        sentiment: s.sentiment,
        engagement: s.engagement,
      })),
      userMessage: msg,
    });
  };

  const whatsHappening: string | null | undefined = insightOverrides.whatsHappening ?? latestSnapshot?.whatsHappening;
  const keyRisks = insightOverrides.keyRisks ?? (latestSnapshot?.keyRisks as string[] | null) ?? [];
  // whatsNext is always read from DB snapshot (persisted by AI generation)
  const whatsNextRaw = latestSnapshot?.whatsNext;
  const wasUpdatedByChat = !!insightOverrides.updatedAt;

  // Sparkline data
  const sparklineEl = (() => {
    if (deal.snapshots.length < 2) return null;
    const sorted = [...deal.snapshots].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const scores = sorted.map(s => s.confidenceScore);
    const W = 280, H = 44, PAD = 4;
    const minS = Math.max(0, Math.min(...scores) - 10);
    const maxS = Math.min(100, Math.max(...scores) + 10);
    const toX = (i: number) => PAD + (i / (scores.length - 1)) * (W - PAD * 2);
    const toY = (v: number) => H - PAD - ((v - minS) / (maxS - minS)) * (H - PAD * 2);
    const points = scores.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
    const areaPoints = `${toX(0)},${H} ${points} ${toX(scores.length - 1)},${H}`;
    const lastScore = scores[scores.length - 1];
    const lineColor = lastScore >= 75 ? '#10b981' : lastScore >= 50 ? '#f59e0b' : '#ef4444';
    return (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Confidence Trend</span>
          <span className="text-[9px] text-muted-foreground/60">
            {new Date(sorted[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' → '}
            {new Date(sorted[sorted.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
          <defs>
            <linearGradient id={`cg-insight-${deal.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill={`url(#cg-insight-${deal.id})`} />
          <polyline points={points} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {scores.map((v, i) => (
            <circle key={i} cx={toX(i)} cy={toY(v)} r="2.5" fill={lineColor} />
          ))}
        </svg>
      </div>
    );
  })();

  return (
    <div
      className={`shrink-0 border-r border-border/30 bg-card/30 backdrop-blur-sm flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[48px]' : 'w-[340px]'
      }`}
    >
      {/* ── Collapse toggle button (always visible) ── */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        {!collapsed && (
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">Deal Insight</span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`ml-auto flex items-center justify-center w-6 h-6 rounded-md hover:bg-muted/40 text-muted-foreground/60 hover:text-foreground transition-colors`}
          title={collapsed ? 'Expand Deal Insight' : 'Collapse Deal Insight'}
        >
          {collapsed
            ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          }
        </button>
      </div>

      {/* ── Collapsed state: show vertical label ── */}
      {collapsed && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 pb-4">
          <div className="writing-mode-vertical text-[10px] text-muted-foreground/40 uppercase tracking-widest font-medium select-none"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Deal Insight
          </div>
          <div className={`text-[11px] font-bold font-mono ${
            deal.confidenceScore >= 75 ? 'text-emerald-400' : deal.confidenceScore >= 50 ? 'text-amber-400' : 'text-red-400'
          }`}>{deal.confidenceScore}%</div>
        </div>
      )}

      {/* ── Full panel content (hidden when collapsed) ── */}
      {!collapsed && <>

      {/* ── Confidence Header ── */}
      <div className="px-4 pt-1 pb-3 border-b border-border/20 shrink-0">
        <div className="flex items-end justify-between mb-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Win Confidence</span>
            {/* Analyse button — generates fresh AI insights and persists to DB */}
            <button
              onClick={() => generateInsightsMutation.mutate({
                dealId: deal.id,
                dealName: deal.name,
                dealStage: deal.stage,
                dealValue: deal.value,
                confidenceScore: deal.confidenceScore,
                companyInfo: deal.companyInfo,
                stakeholders: deal.stakeholders.map(s => ({
                  name: s.name, title: s.title, role: s.role,
                  sentiment: s.sentiment, engagement: s.engagement,
                })),
              })}
              disabled={generateInsightsMutation.isPending}
              className="flex items-center gap-1 text-[9.5px] text-primary/60 hover:text-primary transition-colors disabled:opacity-40 w-fit"
              title="Ask Meridian to analyse this deal and generate fresh insights"
            >
              {generateInsightsMutation.isPending
                ? <><Loader2 className="w-2.5 h-2.5 animate-spin" /><span>Analysing…</span></>
                : <><Sparkles className="w-2.5 h-2.5" /><span>Analyse deal</span></>}
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-3xl font-bold font-mono leading-none ${getConfidenceColor(deal.confidenceScore)}`}>
              {deal.confidenceScore}%
            </span>
            {latestSnapshot && latestSnapshot.confidenceChange !== 0 && (
              <span className={`text-xs font-mono font-semibold ${
                latestSnapshot.confidenceChange > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {latestSnapshot.confidenceChange > 0 ? '↑' : '↓'}{Math.abs(latestSnapshot.confidenceChange)}
              </span>
            )}
          </div>
        </div>
        {/* Confidence bar */}
        <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mb-1">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${deal.confidenceScore}%`,
              background: deal.confidenceScore >= 75 ? '#10b981' : deal.confidenceScore >= 50 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>

        {/* Sparkline */}
        {sparklineEl}
      </div>

      {/* ── Scrollable Insight Content ── */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-3 space-y-4">

          {/* AI updated badge */}
          {wasUpdatedByChat && (
            <div className="flex items-center gap-1.5 text-[10px] text-primary/70 bg-primary/5 border border-primary/15 rounded-lg px-2.5 py-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Insights updated from your conversation</span>
            </div>
          )}

          {/* ── What's Happening ── */}
          {whatsHappening && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">What's Happening</span>
              </div>
              <p className="text-[12.5px] text-foreground/85 leading-relaxed">
                <StakeholderLinkedText
                  text={whatsHappening}
                  stakeholders={deal.stakeholders}
                  onHover={onStakeholderHover}
                  onClick={onStakeholderClick}
                />
              </p>
            </div>
          )}

          {/* ── Key Risks ── */}
          {keyRisks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">Key Risks</span>
              </div>
              <div className="space-y-1.5">
                {keyRisks.map((risk, i) => (
                  <div key={i} className="flex items-start gap-2 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-[12px] text-foreground/80 leading-snug">
                      <StakeholderLinkedText
                        text={risk}
                        stakeholders={deal.stakeholders}
                        onHover={onStakeholderHover}
                        onClick={onStakeholderClick}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── What's Next ── */}
          {whatsNextRaw && whatsNextRaw.length > 0 && (() => {
            // whatsNextRaw is string[] from DB (Drizzle json column typed as string[])
            const actionItems: WhatsNextItem[] = whatsNextRaw;

            return (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">What's Next</span>
                </div>
<div className="space-y-2">
                  {actionItems.map((item, idx) => (
                    <WhatsNextCard
                      key={idx}
                      item={item}
                      stakeholders={deal.stakeholders}
                      onStakeholderHover={onStakeholderHover}
                      onStakeholderClick={onStakeholderClick}
                      dealCompany={deal.name}
                      onAddToMap={(contact) => {
                        addSuggestedContactMutation.mutate({
                          dealId: deal.id,
                          name: contact.name,
                          title: contact.title,
                          role: 'User',
                          sentiment: 'Neutral',
                          engagement: 'Medium',
                          keyInsights: contact.reason,
                        });
                      }}
                      onAccept={(actionText) => {
                        // Add accepted action to Next Actions list
                        setNewActionText(actionText);
                        setAddingAction(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Divider ── */}
          <div className="border-t border-border/25" />

          {/* ── Next Actions ── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Next Actions</span>
              </div>
              <button
                onClick={() => setAddingAction(v => !v)}
                className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground border border-border/30"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Add new action form */}
            {addingAction && (
              <div className="mb-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                <input
                  autoFocus
                  value={newActionText}
                  onChange={e => setNewActionText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addAction();
                    if (e.key === 'Escape') { setAddingAction(false); setNewActionText(''); }
                  }}
                  placeholder="Describe the action..."
                  className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/50 mb-2"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={newActionDue}
                    onChange={e => setNewActionDue(e.target.value)}
                    className="flex-1 bg-transparent text-[11px] text-muted-foreground outline-none border border-border/30 rounded-md px-2 py-1"
                  />
                  <button onClick={addAction} className="text-[11px] px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-medium">Add</button>
                  <button onClick={() => { setAddingAction(false); setNewActionText(''); }} className="text-[11px] px-2 py-1 rounded-md hover:bg-muted/60 text-muted-foreground">✕</button>
                </div>
              </div>
            )}

            {/* Action list */}
            <div className="space-y-1">
              {nextActions.length === 0 && !addingAction && (
                <p className="text-xs text-muted-foreground/40 italic text-center py-3">No actions yet — click + to add</p>
              )}
              {nextActions.map((action) => {
                const isOverdue = !action.completed && action.dueDate && new Date(action.dueDate) < new Date();
                return (
                  <div key={action.id} className={`flex items-start gap-2.5 group rounded-xl px-2.5 py-2 transition-colors hover:bg-muted/20 border border-transparent hover:border-border/20 ${action.completed ? 'opacity-50' : ''}`}>
                    <button
                      onClick={() => toggleAction(action.id)}
                      className={`mt-0.5 w-4 h-4 rounded-md border shrink-0 flex items-center justify-center transition-colors ${
                        action.completed
                          ? 'bg-primary border-primary'
                          : action.priority === 'high'
                            ? 'border-red-400/60 hover:border-red-400'
                            : 'border-border/60 hover:border-primary'
                      }`}
                    >
                      {action.completed && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] leading-snug ${action.completed ? 'line-through text-muted-foreground/50' : 'text-foreground/90'}`}>
                        {action.text}
                      </p>
                      {action.dueDate && (
                        <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-muted-foreground/60'}`}>
                          <Calendar className="w-2.5 h-2.5" />
                          {isOverdue ? 'Overdue · ' : ''}Due {new Date(action.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteAction(action.id)}
                      className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-muted-foreground/40 hover:text-red-400 transition-all shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>



        </div>
      </ScrollArea>

      {/* ── Inline Contextual Chat ── */}
      <div className="border-t border-border/30 shrink-0">

        {/* Chat history — collapsible */}
        {chatOpen && chatMessages.length > 0 && (
          <div className="max-h-[200px] overflow-y-auto px-3 py-2 space-y-2 bg-muted/10">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[11.5px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted/50 text-foreground/85 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-2 justify-start">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-2.5 h-2.5 text-primary" />
                </div>
                <div className="bg-muted/50 rounded-xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Chat toggle button (when there are messages) */}
        {chatMessages.length > 0 && (
          <button
            onClick={() => setChatOpen(v => !v)}
            className="w-full flex items-center justify-center gap-1 py-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            {chatOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            {chatOpen ? 'Hide conversation' : `${chatMessages.length} message${chatMessages.length > 1 ? 's' : ''}`}
          </button>
        )}

        {/* Input row */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="flex-1 flex items-center gap-2 bg-muted/30 border border-border/30 rounded-xl px-3 py-2 focus-within:border-primary/40 transition-colors">
            <Sparkles className="w-3 h-3 text-muted-foreground/50 shrink-0" />
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder="Tell Meridian what changed, or ask why..."
              className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/40 text-foreground/90"
            />
          </div>
          <button
            onClick={sendChat}
            disabled={!chatInput.trim() || chatMutation.isPending}
            className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {chatMutation.isPending
              ? <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" />
              : <Send className="w-3.5 h-3.5 text-primary-foreground" />
            }
          </button>
        </div>
      </div>

      </> }
    </div>
  );
}
