import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCurrency, getConfidenceColor } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle, Check, Plus, Trash2, Calendar, Send, Loader2,
  ChevronDown, ChevronUp, RefreshCw, Sparkles
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
  whatsNext: string | null;
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

  // Build a regex that matches any stakeholder name (first name or full name)
  const names = stakeholders
    .flatMap(s => {
      const parts = [s.name];
      const firstName = s.name.split(' ')[0];
      if (firstName && firstName.length > 2) parts.push(firstName);
      return parts;
    })
    .sort((a, b) => b.length - a.length); // longest first to avoid partial matches

  const escaped = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'g');

  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => {
        const stakeholder = stakeholders.find(
          s => s.name === part || s.name.startsWith(part + ' ')
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
  // Inline chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Local overrides for AI insights (updated via chat)
  const [insightOverrides, setInsightOverrides] = useState<{
    whatsHappening?: string;
    keyRisks?: string[];
    whatsNext?: string;
    updatedAt?: Date;
  }>({});

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
          ...data.updatedInsights,
          updatedAt: new Date(),
        });
        toast.success('Meridian updated the deal insights based on your input');
      }
    },
    onError: (err) => {
      toast.error('Failed to get AI response: ' + err.message);
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
      currentWhatsNext: insightOverrides.whatsNext ?? latestSnapshot?.whatsNext ?? undefined,
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

  const whatsHappening = insightOverrides.whatsHappening ?? latestSnapshot?.whatsHappening;
  const keyRisks = insightOverrides.keyRisks ?? (latestSnapshot?.keyRisks as string[] | null) ?? [];
  const whatsNext = insightOverrides.whatsNext ?? latestSnapshot?.whatsNext;
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
    <div className="w-[340px] shrink-0 border-r border-border/30 bg-card/30 backdrop-blur-sm flex flex-col overflow-hidden">

      {/* ── Confidence Header ── */}
      <div className="px-4 pt-4 pb-3 border-b border-border/20 shrink-0">
        <div className="flex items-end justify-between mb-1">
          <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Win Confidence</span>
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
                    <span className="text-[12px] text-foreground/80 leading-snug">{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── What's Next ── */}
          {whatsNext && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">What's Next</span>
              </div>
              <p className="text-[12.5px] text-foreground/85 leading-relaxed">
                <StakeholderLinkedText
                  text={whatsNext}
                  stakeholders={deal.stakeholders}
                  onHover={onStakeholderHover}
                  onClick={onStakeholderClick}
                />
              </p>
            </div>
          )}

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

    </div>
  );
}
