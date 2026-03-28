import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCurrency, getConfidenceColor } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle, Check, Plus, Trash2, Calendar, Send, Loader2,
  ChevronDown, ChevronUp, Sparkles, Settings2, Play, Pause, Ban,
  Clock, CircleCheck, CircleDot, RotateCcw, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Types ──────────────────────────────────────────────────────────────────

type ActionStatus = 'pending' | 'accepted' | 'rejected' | 'later' | 'in_progress' | 'done' | 'blocked';
type ActionSource = 'manual' | 'ai_suggested';

type NextAction = {
  id: number;
  text: string;
  dueDate: Date | string | null;
  priority: string;
  completed: boolean;
  status?: ActionStatus;
  source?: ActionSource;
  snapshotId?: number | null;
};

type KeyRiskItem = { title: string; detail: string; stakeholders: string[] };

type Snapshot = {
  id: number;
  date: Date | string;
  confidenceScore: number;
  confidenceChange: number;
  whatsHappening: string | null;
  keyRisks: KeyRiskItem[] | string[] | null;
  whatsNext: Array<{ action: string; rationale: string; suggestedContacts?: Array<{ name: string; title: string; reason: string }> }> | null;
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

type Meeting = {
  id: number;
  date: Date | string;
  type: string;
  keyParticipant: string | null;
  summary: string | null;
  duration: number | null;
};

type Deal = {
  id: number;
  name: string;
  stage: string;
  value: number;
  confidenceScore: number;
  companyInfo?: string;
  salesModel?: string;
  customModelId?: number | null;
  snapshots: Snapshot[];
  stakeholders: Stakeholder[];
  meetings?: Meeting[];
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
  updateActionStatus?: (id: number, status: string) => void;
  createAiAction?: (text: string, snapshotId?: number, status?: string) => void;
  setActiveTab: (tab: string) => void;
  onStakeholderHover?: (id: number | null) => void;
  onStakeholderClick?: (id: number) => void;
  onOpenMapSheet?: () => void;
};

type SuggestedContact = { name: string; title: string; reason: string };
type WhatsNextItem = string | { action: string; rationale: string; suggestedContacts?: SuggestedContact[] };

// ─── Status Config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ActionStatus, {
  label: string;
  icon: typeof Check;
  color: string;
  bg: string;
  border: string;
}> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-muted-foreground/70', bg: 'bg-muted/20', border: 'border-border/30' },
  accepted: { label: 'To Do', icon: CircleDot, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
  in_progress: { label: 'In Progress', icon: Play, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  done: { label: 'Done', icon: CircleCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
  blocked: { label: 'Blocked', icon: Ban, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' },
  later: { label: 'Later', icon: Pause, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
  rejected: { label: 'Dismissed', icon: Ban, color: 'text-muted-foreground/40', bg: 'bg-muted/10', border: 'border-border/20' },
};

// Valid transitions from each status
const STATUS_TRANSITIONS: Record<ActionStatus, ActionStatus[]> = {
  pending: ['accepted', 'rejected', 'later'],
  accepted: ['in_progress', 'done', 'blocked', 'later'],
  in_progress: ['done', 'blocked', 'accepted'],
  done: ['accepted'], // reopen
  blocked: ['accepted', 'in_progress'],
  later: ['accepted', 'rejected'],
  rejected: ['accepted'], // undo
};

// ─── Collapsible Insight History ────────────────────────────────────────────

function InsightHistory({ snapshots }: { snapshots: Snapshot[] }) {
  const [showHistory, setShowHistory] = useState(false);
  const olderSnapshots = snapshots.slice(1);
  if (olderSnapshots.length === 0) return null;
  return (
    <div>
      <button
        onClick={() => setShowHistory(v => !v)}
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors w-full"
      >
        {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        <span>Insight History ({olderSnapshots.length} previous {olderSnapshots.length === 1 ? 'snapshot' : 'snapshots'})</span>
      </button>
      {showHistory && (
        <div className="mt-2 space-y-3">
          {olderSnapshots.map((snap, si) => (
            <div key={snap.id || si} className="rounded-lg border border-border/20 bg-muted/10 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground/70 font-medium">
                  {new Date(snap.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {snap.interactionType && ` \u00b7 ${snap.interactionType}`}
                </span>
                <span className={`text-[10px] font-mono font-semibold ${getConfidenceColor(snap.confidenceScore)}`}>
                  {snap.confidenceScore}%
                  {snap.confidenceChange !== 0 && (
                    <span className={snap.confidenceChange > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {' '}{snap.confidenceChange > 0 ? '\u2191' : '\u2193'}{Math.abs(snap.confidenceChange)}
                    </span>
                  )}
                </span>
              </div>
              {snap.whatsHappening && (
                <p className="text-[10px] text-foreground/60 leading-relaxed mb-2">{snap.whatsHappening}</p>
              )}
              {snap.whatsNext && snap.whatsNext.length > 0 && (
                <div>
                  <span className="text-[9px] text-emerald-400/70 uppercase tracking-wider font-semibold">Suggested Actions</span>
                  <div className="mt-1 space-y-1">
                    {snap.whatsNext.map((item: any, idx: number) => (
                      <div key={idx} className="text-[10px] text-foreground/50 flex items-start gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-400/40 mt-1.5 shrink-0" />
                        <span>{typeof item === 'string' ? item : item.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {snap.keyRisks && (snap.keyRisks as any[]).length > 0 && (
                <div className="mt-2">
                  <span className="text-[9px] text-red-400/70 uppercase tracking-wider font-semibold">Risks at the time</span>
                  <div className="mt-1 space-y-1">
                    {(snap.keyRisks as any[]).map((risk: any, idx: number) => (
                      <div key={idx} className="text-[10px] text-foreground/50 flex items-start gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-red-400/40 mt-1.5 shrink-0" />
                        <span>{typeof risk === 'string' ? risk : risk.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WhatsNextCard with status lifecycle ─────────────────────────────────────

function WhatsNextCard({
  item,
  stakeholders,
  onStakeholderHover,
  onStakeholderClick,
  onAccept,
  onDismiss,
  onLater,
  onAddToMap,
  onStatusChange,
  dealCompany,
  existingActions,
}: {
  item: WhatsNextItem;
  stakeholders: Stakeholder[];
  onStakeholderHover?: (id: number | null) => void;
  onStakeholderClick?: (id: number) => void;
  onAccept?: (actionText: string) => void;
  onDismiss?: (actionText: string) => void;
  onLater?: (actionText: string) => void;
  onAddToMap?: (contact: SuggestedContact) => void;
  onStatusChange?: (actionId: number, status: string) => void;
  dealCompany?: string;
  existingActions?: NextAction[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [addedContacts, setAddedContacts] = useState<Set<string>>(new Set());

  const actionText = typeof item === 'string' ? item : item.action;
  const rationale = typeof item === 'string' ? null : item.rationale;
  const rawContacts = typeof item === 'string' ? [] : (item.suggestedContacts ?? []);
  const suggestedContacts: SuggestedContact[] = rawContacts.map((c: string | SuggestedContact) =>
    typeof c === 'string' ? { name: c, title: '', reason: '' } : c
  );

  // Check if this suggestion already has a corresponding action
  const existingAction = existingActions?.find(a =>
    a.source === 'ai_suggested' && a.text === actionText
  );
  const currentStatus = existingAction?.status as ActionStatus | undefined;

  const mentioned = stakeholders.filter(s => {
    const firstName = s.name.split(' ')[0];
    return actionText.includes(s.name) || (firstName.length > 2 && actionText.includes(firstName));
  });

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAccept?.(actionText);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.(actionText);
  };

  const handleLater = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLater?.(actionText);
  };

  // If dismissed, show muted with undo option
  if (currentStatus === 'rejected') {
    return (
      <div className="rounded-lg border border-border/20 bg-muted/5 px-3 py-2 flex items-center gap-2 opacity-50 hover:opacity-70 transition-opacity">
        <div className="w-3 h-3 rounded-full border border-muted-foreground/30 shrink-0" />
        <span className="flex-1 text-[11px] text-muted-foreground/60 line-through leading-snug">{actionText}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (existingAction) onStatusChange?.(existingAction.id, 'accepted');
          }}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-blue-400/70 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
          title="Undo dismiss and accept this action"
        >
          <RotateCcw className="w-2.5 h-2.5" /> Undo
        </button>
      </div>
    );
  }

  const statusBadge = currentStatus && currentStatus !== 'pending' ? (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_CONFIG[currentStatus].bg} ${STATUS_CONFIG[currentStatus].color} border ${STATUS_CONFIG[currentStatus].border}`}>
      {STATUS_CONFIG[currentStatus].label}
    </span>
  ) : null;

  return (
    <div className={`rounded-lg border overflow-hidden transition-all ${
      currentStatus === 'accepted' || currentStatus === 'in_progress' ? 'border-blue-400/30 bg-blue-400/5' :
      currentStatus === 'done' ? 'border-emerald-400/30 bg-emerald-400/5' :
      currentStatus === 'later' ? 'border-purple-400/20 bg-purple-400/5' :
      'border-border/30 bg-muted/10'
    }`}>
      <button
        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted/20 transition-colors group"
        onClick={() => setExpanded(e => !e)}
      >
        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
          currentStatus === 'done' ? 'border-emerald-400 bg-emerald-400/20' :
          currentStatus === 'accepted' || currentStatus === 'in_progress' ? 'border-blue-400/60 bg-blue-400/10' :
          'border-emerald-400/50 bg-emerald-400/10'
        }`}>
          {currentStatus === 'done'
            ? <Check className="w-2.5 h-2.5 text-emerald-400" />
            : <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
        </div>
        <span className={`flex-1 text-[12px] leading-snug ${currentStatus === 'done' ? 'text-foreground/50 line-through' : 'text-foreground/85'}`}>
          <StakeholderLinkedText
            text={actionText}
            stakeholders={stakeholders}
            onHover={onStakeholderHover}
            onClick={onStakeholderClick}
          />
        </span>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {statusBadge}
          <div className="text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border/20 space-y-3">
          {/* AI Rationale */}
          <div className="flex items-start gap-2">
            <Sparkles className="w-3 h-3 text-primary/60 shrink-0 mt-0.5" />
            {rationale
              ? <p className="text-[11.5px] text-foreground/70 leading-relaxed italic">{rationale}</p>
              : <p className="text-[11.5px] text-muted-foreground/40 leading-relaxed italic">Run Refresh Analysis to generate detailed rationale.</p>
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

          {/* Suggested Contacts */}
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
                    <div key={contact.name} className={`rounded-lg border p-2.5 transition-all ${isAdded ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-border/30 bg-muted/10'}`}>
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
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400"><Check className="w-3 h-3" /> Added to map</span>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); onAddToMap?.(contact); setAddedContacts(prev => new Set(Array.from(prev).concat(contact.name))); }} className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-medium hover:bg-primary/25 transition-colors">
                            <Plus className="w-2.5 h-2.5" /> Add to Map
                          </button>
                        )}
                        <a href={`https://www.linkedin.com/search/results/people/?keywords=${linkedInQuery}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0077b5]/15 text-[#0077b5] text-[10px] font-medium hover:bg-[#0077b5]/25 transition-colors">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                          LinkedIn
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accept / Dismiss / Later — show if no action exists yet */}
          {!currentStatus && (
            <div className="flex items-center gap-1.5 pt-1">
              <button onClick={handleAccept} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 text-[10.5px] font-medium transition-colors">
                <Check className="w-3 h-3" /> Accept
              </button>
              <button onClick={handleDismiss} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/30 hover:bg-muted/50 text-muted-foreground/70 text-[10.5px] font-medium transition-colors">
                <span className="text-[11px]">{'✕'}</span> Dismiss
              </button>
              <button onClick={handleLater} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-400/10 hover:bg-purple-400/20 text-purple-400/80 text-[10.5px] font-medium transition-colors">
                <Pause className="w-3 h-3" /> Later
              </button>
            </div>
          )}

          {/* Status change for already-actioned items */}
          {currentStatus && existingAction && (
            <div className="pt-1">
              <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-1.5">Change Status</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {STATUS_TRANSITIONS[currentStatus]?.map(targetStatus => {
                  const tc = STATUS_CONFIG[targetStatus];
                  const TIcon = tc.icon;
                  return (
                    <button
                      key={targetStatus}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange?.(existingAction.id, targetStatus);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors border ${tc.bg} ${tc.color} ${tc.border} hover:opacity-80`}
                    >
                      <TIcon className="w-2.5 h-2.5" />
                      {tc.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── StakeholderLinkedText ───────────────────────────────────────────────────

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

  const titleTerms = stakeholders
    .filter(s => s.title)
    .flatMap(s => {
      const title = s.title!;
      const terms: string[] = [title];
      const abbrevMatch = title.match(/\b(C[A-Z]O|VP|SVP|EVP|CPO|CMO|CRO)\b/);
      if (abbrevMatch) terms.push(abbrevMatch[0]);
      return terms;
    });

  const names = stakeholders.flatMap(s => {
    const parts = [s.name];
    const firstName = s.name.split(' ')[0];
    if (firstName && firstName.length > 2) parts.push(firstName);
    return parts;
  });

  const allTerms = [...names, ...titleTerms].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => b.length - a.length);
  const escaped = allTerms.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'g');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => {
        const stakeholder = stakeholders.find(
          s => s.name === part || s.name.startsWith(part + ' ') || (s.title === part) || (s.title?.includes(part) && /\b(C[A-Z]O|VP|SVP|EVP|CPO|CMO|CRO)\b/.test(part))
        );
        if (!stakeholder) return <span key={i}>{part}</span>;
        return (
          <span key={i} className="text-primary underline decoration-dotted underline-offset-2 cursor-pointer hover:text-primary/80 transition-colors font-medium"
            onMouseEnter={() => onHover?.(stakeholder.id)} onMouseLeave={() => onHover?.(null)} onClick={() => onClick?.(stakeholder.id)}>
            {part}
          </span>
        );
      })}
    </span>
  );
}

// ─── KeyRiskCard ────────────────────────────────────────────────────────────

function KeyRiskCard({
  risk, stakeholders, onStakeholderHover, onStakeholderClick,
}: {
  risk: KeyRiskItem | string;
  stakeholders: Stakeholder[];
  onStakeholderHover?: (id: number | null) => void;
  onStakeholderClick?: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isStructured = typeof risk === 'object' && risk !== null;
  const title = isStructured ? (risk as KeyRiskItem).title : (risk as string);
  const detail = isStructured ? (risk as KeyRiskItem).detail : null;
  const riskStakeholderNames: string[] = isStructured ? ((risk as KeyRiskItem).stakeholders ?? []) : [];
  const mentioned = stakeholders.filter(s =>
    riskStakeholderNames.some(name => name.toLowerCase().includes(s.name.split(' ')[0].toLowerCase()) || s.name.toLowerCase().includes(name.toLowerCase()))
  );

  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 overflow-hidden transition-all">
      <button className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-red-500/10 transition-colors group" onClick={() => setExpanded(e => !e)}>
        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
        <span className="flex-1 text-[12px] text-foreground/85 leading-snug">
          <StakeholderLinkedText text={title} stakeholders={stakeholders} onHover={onStakeholderHover} onClick={onStakeholderClick} />
        </span>
        <div className="shrink-0 mt-0.5 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-red-500/15 space-y-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-3 h-3 text-red-400/60 shrink-0 mt-0.5" />
            {detail ? <p className="text-[11.5px] text-foreground/70 leading-relaxed italic">{detail}</p> : <p className="text-[11.5px] text-muted-foreground/40 leading-relaxed italic">Re-run Refresh Analysis to generate detailed risk analysis.</p>}
          </div>
          {mentioned.length > 0 && (
            <div>
              <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1.5">Relevant Stakeholders</div>
              <div className="space-y-1.5">
                {mentioned.map(s => (
                  <button key={s.id} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-card/60 border border-border/30 hover:border-red-400/30 hover:bg-card/80 transition-all text-left"
                    onMouseEnter={() => onStakeholderHover?.(s.id)} onMouseLeave={() => onStakeholderHover?.(null)} onClick={() => onStakeholderClick?.(s.id)}>
                    <div className="w-6 h-6 rounded-full bg-red-400/15 flex items-center justify-center text-[10px] font-bold text-red-400 shrink-0">
                      {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-foreground/80 truncate">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground/60 truncate">{s.title ?? s.role}</div>
                    </div>
                    <div className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${
                      s.sentiment === 'Positive' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' :
                      s.sentiment === 'Negative' ? 'text-red-400 border-red-400/30 bg-red-400/10' :
                      'text-amber-400 border-amber-400/30 bg-amber-400/10'
                    }`}>{s.sentiment}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ActionStatusDropdown ───────────────────────────────────────────────────

function ActionStatusDropdown({
  action,
  onStatusChange,
}: {
  action: NextAction;
  onStatusChange: (id: number, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const status = (action.status ?? (action.completed ? 'done' : 'accepted')) as ActionStatus;
  const config = STATUS_CONFIG[status];
  const transitions = STATUS_TRANSITIONS[status] ?? [];
  const Icon = config.icon;

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium transition-colors border ${config.bg} ${config.color} ${config.border} hover:opacity-80`}
      >
        <Icon className="w-2.5 h-2.5" />
        <span>{config.label}</span>
        <ChevronDown className="w-2 h-2" />
      </button>
      {open && transitions.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[120px]">
            {transitions.map(t => {
              const tc = STATUS_CONFIG[t];
              const TIcon = tc.icon;
              return (
                <button
                  key={t}
                  onClick={(e) => { e.stopPropagation(); onStatusChange(action.id, t); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] hover:bg-muted/50 transition-colors text-left"
                >
                  <TIcon className={`w-3 h-3 ${tc.color}`} />
                  <span className={tc.color}>{tc.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

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
  updateActionStatus,
  createAiAction,
  setActiveTab,
  onStakeholderHover,
  onStakeholderClick,
  onOpenMapSheet,
}: Props) {
  const { t, language } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  // Sales model state
  const [showModelSelector, setShowModelSelector] = useState(false);
  const salesModelsQuery = trpc.salesModels.list.useQuery();
  const setDealModelMutation = trpc.salesModels.setDealModel.useMutation({
    onSuccess: () => {
      utils.deals.get.invalidate({ id: deal.id });
      toast.success(language === 'zh' ? '\u9500\u552e\u6a21\u578b\u5df2\u66f4\u65b0' : 'Sales model updated');
    },
  });
  const currentModelKey = deal.salesModel ?? 'meddic';
  const currentModelName = salesModelsQuery.data?.find(
    m => m.key === currentModelKey || (m.key === 'custom' && m.id === deal.customModelId)
  )?.name ?? 'MEDDIC';

  // Inline chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Local overrides for AI insights
  const [insightOverrides, setInsightOverrides] = useState<{
    whatsHappening?: string;
    keyRisks?: KeyRiskItem[] | string[];
    updatedAt?: Date;
  }>({});
  const [insightDataLevel, setInsightDataLevel] = useState<'early-stage' | 'evidence-based' | null>(null);

  const utils = trpc.useUtils();
  const generateInsightsMutation = trpc.ai.generateDealInsight.useMutation({
    onSuccess: (data) => {
      setInsightOverrides({
        whatsHappening: data.whatsHappening,
        keyRisks: data.keyRisks,
        updatedAt: new Date(),
      });
      setInsightDataLevel(data.dataLevel as 'early-stage' | 'evidence-based');
      utils.deals.get.invalidate({ id: deal.id });
      utils.nextActions.listByDeal.invalidate({ dealId: deal.id });
      toast.success(data.dataLevel === 'early-stage'
        ? 'Initial assessment generated \u2014 upload meeting transcripts for deeper insights'
        : 'Deal insights refreshed \u2014 Meridian has analysed the latest context');
    },
    onError: (err) => {
      toast.error('Failed to generate insights: ' + err.message);
    },
  });

  const chatMutation = trpc.ai.chatWithDeal.useMutation({
    onSuccess: (data) => {
      const assistantMsg: ChatMessage = { id: Date.now().toString(), role: 'assistant', content: data.response, timestamp: new Date() };
      setChatMessages(prev => [...prev, assistantMsg]);
      if (data.updatedInsights) {
        setInsightOverrides({ whatsHappening: data.updatedInsights.whatsHappening, keyRisks: data.updatedInsights.keyRisks, updatedAt: new Date() });
        toast.success('Meridian updated the deal insights based on your input');
      }
    },
    onError: (err) => { toast.error('Failed to get AI response: ' + err.message); },
  });

  const addSuggestedContactMutation = trpc.stakeholders.create.useMutation({
    onSuccess: (newStakeholder) => {
      utils.deals.get.invalidate({ id: deal.id });
      toast.success(`${newStakeholder.name} added to the stakeholder map`);
    },
    onError: (err) => { toast.error('Failed to add contact: ' + err.message); },
  });

  useEffect(() => {
    if (chatOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  const sendChat = () => {
    const msg = chatInput.trim();
    if (!msg || chatMutation.isPending) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    if (!chatOpen) setChatOpen(true);
    const rawRisks = insightOverrides.keyRisks ?? latestSnapshot?.keyRisks ?? [];
    const currentRisks: string[] = (rawRisks as (KeyRiskItem | string)[]).map(r => typeof r === 'string' ? r : r.title);
    chatMutation.mutate({
      dealId: deal.id, dealName: deal.name, dealStage: deal.stage, dealValue: deal.value,
      confidenceScore: deal.confidenceScore, companyInfo: deal.companyInfo,
      currentWhatsHappening: insightOverrides.whatsHappening ?? latestSnapshot?.whatsHappening ?? undefined,
      currentKeyRisks: currentRisks,
      currentWhatsNext: JSON.stringify(latestSnapshot?.whatsNext) ?? undefined,
      stakeholders: deal.stakeholders.map(s => ({ name: s.name, title: s.title, role: s.role, sentiment: s.sentiment, engagement: s.engagement })),
      meetings: (deal.meetings ?? []).map(m => ({ date: typeof m.date === 'string' ? m.date : new Date(m.date).toISOString(), type: m.type, keyParticipant: m.keyParticipant, summary: m.summary })),
      userMessage: msg, language,
    });
  };

  const whatsHappening: string | null | undefined = insightOverrides.whatsHappening ?? latestSnapshot?.whatsHappening;
  const keyRisks: (KeyRiskItem | string)[] = (insightOverrides.keyRisks ?? latestSnapshot?.keyRisks ?? []) as (KeyRiskItem | string)[];
  const whatsNextRaw = latestSnapshot?.whatsNext ?? null;
  const wasUpdatedByChat = !!insightOverrides.updatedAt;

  // Group next actions by status for the management section
  const activeActions = nextActions.filter(a => {
    const s = a.status ?? (a.completed ? 'done' : 'accepted');
    return s === 'accepted' || s === 'in_progress';
  });
  const laterActions = nextActions.filter(a => (a.status ?? 'pending') === 'later');
  const doneActions = nextActions.filter(a => {
    const s = a.status ?? (a.completed ? 'done' : 'accepted');
    return s === 'done';
  });
  const blockedActions = nextActions.filter(a => (a.status ?? 'pending') === 'blocked');

  // Last analysis timestamp
  const lastAnalysisDate = latestSnapshot ? new Date(latestSnapshot.date) : null;

  // Sparkline
  const sparklineEl = (() => {
    if (deal.snapshots.length < 2) return null;
    const sorted = [...deal.snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{t('insight.confidenceTrend')}</span>
          <span className="text-[9px] text-muted-foreground/60">
            {new Date(sorted[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' \u2192 '}
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
          {scores.map((v, i) => (<circle key={i} cx={toX(i)} cy={toY(v)} r="2.5" fill={lineColor} />))}
        </svg>
      </div>
    );
  })();

  return (
    <div className={`shrink-0 border-r border-border/30 bg-card/30 backdrop-blur-sm flex flex-col overflow-hidden transition-all duration-300 ease-in-out h-full ${collapsed ? 'hidden md:flex w-[48px]' : 'w-full md:w-[45%] md:min-w-[340px] md:max-w-[560px]'}`}>
      {/* Collapse toggle */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        {!collapsed && <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">{t('insight.dealInsight')}</span>}
        <button onClick={() => setCollapsed(c => !c)} className="hidden md:flex ml-auto items-center justify-center w-6 h-6 rounded-md hover:bg-muted/40 text-muted-foreground/60 hover:text-foreground transition-colors" title={collapsed ? 'Expand Deal Insight' : 'Collapse Deal Insight'}>
          {collapsed
            ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          }
        </button>
      </div>

      {/* Collapsed state */}
      {collapsed && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 pb-4">
          <div className="writing-mode-vertical text-[10px] text-muted-foreground/40 uppercase tracking-widest font-medium select-none" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            {t('insight.dealInsight')}
          </div>
          <div className={`text-[11px] font-bold font-mono ${deal.confidenceScore >= 75 ? 'text-emerald-400' : deal.confidenceScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{deal.confidenceScore}%</div>
        </div>
      )}

      {/* Full panel content */}
      {!collapsed && <>

      {/* Confidence Header */}
      <div className="px-4 pt-1 pb-3 border-b border-border/20 shrink-0">
        <div className="flex items-end justify-between mb-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">{t('insight.winConfidence')}</span>
            {/* Last analysis timestamp */}
            {lastAnalysisDate && (
              <span className="text-[9px] text-muted-foreground/50">
                Last analysed: {lastAnalysisDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {lastAnalysisDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {/* Refresh Analysis button */}
            <button
              onClick={() => {
                generateInsightsMutation.mutate({
                  dealId: deal.id, dealName: deal.name, dealStage: deal.stage, dealValue: deal.value,
                  confidenceScore: deal.confidenceScore, companyInfo: deal.companyInfo,
                  salesModel: currentModelKey, customModelId: deal.customModelId, language,
                  stakeholders: deal.stakeholders.map(s => ({ name: s.name, title: s.title, role: s.role, sentiment: s.sentiment, engagement: s.engagement })),
                  meetings: (deal.meetings ?? []).map(m => ({
                    date: typeof m.date === 'string' ? m.date : new Date(m.date).toISOString(),
                    type: m.type, keyParticipant: m.keyParticipant, summary: m.summary, duration: m.duration,
                  })),
                });
              }}
              disabled={generateInsightsMutation.isPending}
              className="flex items-center gap-1 text-[9.5px] text-primary/60 hover:text-primary transition-colors disabled:opacity-40 w-fit"
              title="Refresh AI analysis based on current deal context"
            >
              {generateInsightsMutation.isPending
                ? <><Loader2 className="w-2.5 h-2.5 animate-spin" /><span>{t('insight.analysing')}</span></>
                : <><RotateCcw className="w-2.5 h-2.5" /><span>Refresh Analysis</span></>}
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-3xl font-bold font-mono leading-none ${getConfidenceColor(deal.confidenceScore)}`}>{deal.confidenceScore}%</span>
            {latestSnapshot && latestSnapshot.confidenceChange !== 0 && (
              <span className={`text-xs font-mono font-semibold ${latestSnapshot.confidenceChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {latestSnapshot.confidenceChange > 0 ? '\u2191' : '\u2193'}{Math.abs(latestSnapshot.confidenceChange)}
              </span>
            )}
          </div>
        </div>
        {/* Confidence bar */}
        <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mb-1">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${deal.confidenceScore}%`, background: deal.confidenceScore >= 75 ? '#10b981' : deal.confidenceScore >= 50 ? '#f59e0b' : '#ef4444' }} />
        </div>
        {sparklineEl}
        {/* Sales Model Badge */}
        <div className="relative mt-2">
          <button onClick={() => setShowModelSelector(v => !v)} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 border border-border/30 hover:border-primary/30 hover:bg-muted/50 transition-all text-[10px] text-muted-foreground/70 hover:text-foreground/80 w-fit">
            <Settings2 className="w-3 h-3" />
            <span className="font-medium">{currentModelName}</span>
            <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
          </button>
          {showModelSelector && (
            <div className="absolute left-0 top-full mt-1 z-50 w-56 bg-popover border border-border rounded-lg shadow-xl py-1 max-h-[200px] overflow-y-auto">
              {salesModelsQuery.data?.map((model) => {
                const isActive = model.key === currentModelKey || (model.key === 'custom' && model.id === deal.customModelId);
                return (
                  <button key={model.key + (model.id ?? '')} onClick={() => { setDealModelMutation.mutate({ dealId: deal.id, salesModel: model.key === 'custom' ? 'custom' : model.key, customModelId: model.id }); setShowModelSelector(false); }}
                    className={`w-full text-left px-3 py-2 text-[11px] flex items-center justify-between hover:bg-muted/50 transition-colors ${isActive ? 'text-primary bg-primary/5' : 'text-foreground/80'}`}>
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-[9px] text-muted-foreground/60 mt-0.5">{model.dimensions.length} dimensions</div>
                    </div>
                    {isActive && <Check className="w-3 h-3 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Insight Content */}
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <div className="px-4 py-3 space-y-4">

          {/* AI updated badge */}
          {wasUpdatedByChat && (
            <div className="flex items-center gap-1.5 text-[10px] text-primary/70 bg-primary/5 border border-primary/15 rounded-lg px-2.5 py-1.5">
              <Sparkles className="w-3 h-3" />
              <span>{t('insight.insightsUpdated')}</span>
            </div>
          )}

          {/* Early-stage data warning */}
          {insightDataLevel === 'early-stage' && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5"><span className="text-[10px]">{'\u26a0\ufe0f'}</span></div>
              <div className="text-[11px] text-amber-300/90 leading-relaxed">
                <span className="font-semibold">Pre-engagement analysis.</span> This assessment is based on company profile and stakeholder roles only. Upload meeting notes or call recordings to unlock evidence-based insights.
              </div>
            </div>
          )}

          {/* What's Happening */}
          {whatsHappening && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">{t('insight.whatsHappening')}</span>
              </div>
              <p className="text-[12.5px] text-foreground/85 leading-relaxed">
                <StakeholderLinkedText text={whatsHappening} stakeholders={deal.stakeholders} onHover={onStakeholderHover} onClick={onStakeholderClick} />
              </p>
            </div>
          )}

          {/* Key Risks */}
          {keyRisks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">{t('insight.keyRisks')}</span>
              </div>
              <div className="space-y-2">
                {keyRisks.map((risk, i) => (
                  <KeyRiskCard key={i} risk={risk} stakeholders={deal.stakeholders} onStakeholderHover={onStakeholderHover} onStakeholderClick={onStakeholderClick} />
                ))}
              </div>
            </div>
          )}

          {/* What's Next (AI Suggestions) */}
          {whatsNextRaw && whatsNextRaw.length > 0 && (() => {
            const actionItems: WhatsNextItem[] = whatsNextRaw;
            return (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">{t('insight.whatsNext')}</span>
                  <span className="text-[9px] text-muted-foreground/40 ml-auto">AI Suggested</span>
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
                      existingActions={nextActions}
                      onStatusChange={(actionId, status) => updateActionStatus?.(actionId, status)}
                      onAddToMap={(contact) => {
                        addSuggestedContactMutation.mutate({
                          dealId: deal.id, name: contact.name, title: contact.title,
                          role: 'User', sentiment: 'Neutral', engagement: 'Medium', keyInsights: contact.reason,
                        });
                      }}
                      onAccept={(actionText) => {
                        createAiAction?.(actionText, latestSnapshot?.id, 'accepted');
                        toast.success('Action accepted \u2014 added to your task list');
                      }}
                      onDismiss={(actionText) => {
                        createAiAction?.(actionText, latestSnapshot?.id, 'rejected');
                        toast.success('Suggestion dismissed');
                      }}
                      onLater={(actionText) => {
                        createAiAction?.(actionText, latestSnapshot?.id, 'later');
                        toast.success('Saved for later');
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Insight History */}
          <InsightHistory snapshots={deal.snapshots} />

          {/* Divider */}
          <div className="border-t border-border/25" />

          {/* ── Next Actions (Task Management) ── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">{t('insight.nextActions')}</span>
                {activeActions.length > 0 && (
                  <span className="text-[9px] text-muted-foreground/50 bg-muted/30 px-1.5 py-0.5 rounded-full">{activeActions.length} active</span>
                )}
              </div>
              <button onClick={() => setAddingAction(v => !v)} className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground border border-border/30">
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Add new action form */}
            {addingAction && (
              <div className="mb-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                <input autoFocus value={newActionText} onChange={e => setNewActionText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addAction(); if (e.key === 'Escape') { setAddingAction(false); setNewActionText(''); } }}
                  placeholder="Describe the action..." className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/50 mb-2" />
                <div className="flex items-center gap-2">
                  <input type="date" value={newActionDue} onChange={e => setNewActionDue(e.target.value)} className="flex-1 bg-transparent text-[11px] text-muted-foreground outline-none border border-border/30 rounded-md px-2 py-1" />
                  <button onClick={addAction} className="text-[11px] px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-medium">Add</button>
                  <button onClick={() => { setAddingAction(false); setNewActionText(''); }} className="text-[11px] px-2 py-1 rounded-md hover:bg-muted/60 text-muted-foreground">{'\u2715'}</button>
                </div>
              </div>
            )}

            {/* Active actions (accepted + in_progress) */}
            {activeActions.length > 0 && (
              <div className="space-y-1 mb-2">
                {activeActions.map((action) => {
                  const isOverdue = action.dueDate && new Date(action.dueDate) < new Date();
                  return (
                    <div key={action.id} className="flex items-start gap-2 group rounded-xl px-2.5 py-2 transition-colors hover:bg-muted/20 border border-transparent hover:border-border/20">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p className="text-[12px] leading-snug text-foreground/90 flex-1">{action.text}</p>
                          {updateActionStatus && <ActionStatusDropdown action={action} onStatusChange={updateActionStatus} />}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {action.source === 'ai_suggested' && (
                            <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary/60 font-medium">AI</span>
                          )}
                          {action.dueDate && (
                            <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-muted-foreground/60'}`}>
                              <Calendar className="w-2.5 h-2.5" />
                              {isOverdue ? 'Overdue \u00b7 ' : ''}Due {new Date(action.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => deleteAction(action.id)} className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-muted-foreground/40 hover:text-red-400 transition-all shrink-0 mt-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Blocked actions */}
            {blockedActions.length > 0 && (
              <div className="mb-2">
                <div className="text-[9px] text-red-400/60 uppercase tracking-wider font-semibold mb-1 px-2.5">Blocked</div>
                <div className="space-y-1">
                  {blockedActions.map((action) => (
                    <div key={action.id} className="flex items-start gap-2 group rounded-xl px-2.5 py-2 bg-red-400/5 border border-red-400/15">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p className="text-[12px] leading-snug text-foreground/80 flex-1">{action.text}</p>
                          {updateActionStatus && <ActionStatusDropdown action={action} onStatusChange={updateActionStatus} />}
                        </div>
                      </div>
                      <button onClick={() => deleteAction(action.id)} className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-muted-foreground/40 hover:text-red-400 transition-all shrink-0 mt-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Later actions */}
            {laterActions.length > 0 && (
              <div className="mb-2">
                <div className="text-[9px] text-purple-400/60 uppercase tracking-wider font-semibold mb-1 px-2.5">Later</div>
                <div className="space-y-1">
                  {laterActions.map((action) => (
                    <div key={action.id} className="flex items-start gap-2 group rounded-xl px-2.5 py-1.5 opacity-60 hover:opacity-100 transition-opacity">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p className="text-[11px] leading-snug text-foreground/70 flex-1">{action.text}</p>
                          {updateActionStatus && <ActionStatusDropdown action={action} onStatusChange={updateActionStatus} />}
                        </div>
                      </div>
                      <button onClick={() => deleteAction(action.id)} className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-muted-foreground/40 hover:text-red-400 transition-all shrink-0 mt-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Done actions (collapsed by default) */}
            {doneActions.length > 0 && (
              <DoneActionsSection actions={doneActions} deleteAction={deleteAction} updateActionStatus={updateActionStatus} />
            )}

            {/* Empty state */}
            {nextActions.length === 0 && !addingAction && (
              <p className="text-xs text-muted-foreground/40 italic text-center py-3">{t('insight.noActions')}</p>
            )}
          </div>

        </div>
      </ScrollArea>

      {/* Inline Contextual Chat */}
      <div className="border-t border-border/30 shrink-0">
        {chatOpen && chatMessages.length > 0 && (
          <div className="max-h-[200px] overflow-y-auto px-3 py-2 space-y-2 bg-muted/10">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[11.5px] leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted/50 text-foreground/85 rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-2 justify-start">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0"><Sparkles className="w-2.5 h-2.5 text-primary" /></div>
                <div className="bg-muted/50 rounded-xl rounded-bl-sm px-3 py-2"><Loader2 className="w-3 h-3 animate-spin text-muted-foreground" /></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
        {chatMessages.length > 0 && (
          <button onClick={() => setChatOpen(v => !v)} className="w-full flex items-center justify-center gap-1 py-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
            {chatOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            {chatOpen ? 'Hide conversation' : `${chatMessages.length} message${chatMessages.length > 1 ? 's' : ''}`}
          </button>
        )}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="flex-1 flex items-center gap-2 bg-muted/30 border border-border/30 rounded-xl px-3 py-2 focus-within:border-primary/40 transition-colors">
            <Sparkles className="w-3 h-3 text-muted-foreground/50 shrink-0" />
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder={t('insight.chatPlaceholder')} className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/40 text-foreground/90" />
          </div>
          <button onClick={sendChat} disabled={!chatInput.trim() || chatMutation.isPending} className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
            {chatMutation.isPending ? <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" /> : <Send className="w-3.5 h-3.5 text-primary-foreground" />}
          </button>
        </div>
      </div>

      </>
      }

    </div>
  );
}

// ─── Done Actions Collapsible Section ───────────────────────────────────────

function DoneActionsSection({
  actions,
  deleteAction,
  updateActionStatus,
}: {
  actions: NextAction[];
  deleteAction: (id: number) => void;
  updateActionStatus?: (id: number, status: string) => void;
}) {
  const [showDone, setShowDone] = useState(false);
  return (
    <div>
      <button onClick={() => setShowDone(v => !v)} className="flex items-center gap-1.5 text-[9px] text-emerald-400/50 uppercase tracking-wider font-semibold mb-1 px-2.5 hover:text-emerald-400/80 transition-colors w-full">
        {showDone ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
        <span>Completed ({actions.length})</span>
      </button>
      {showDone && (
        <div className="space-y-1">
          {actions.map((action) => (
            <div key={action.id} className="flex items-start gap-2 group rounded-xl px-2.5 py-1.5 opacity-50 hover:opacity-80 transition-opacity">
              <CircleCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] leading-snug text-foreground/60 line-through">{action.text}</p>
              </div>
              {updateActionStatus && (
                <button onClick={() => updateActionStatus(action.id, 'accepted')} className="opacity-0 group-hover:opacity-100 text-[9px] text-muted-foreground/40 hover:text-primary transition-all shrink-0" title="Reopen">
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
              <button onClick={() => deleteAction(action.id)} className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-muted-foreground/40 hover:text-red-400 transition-all shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
