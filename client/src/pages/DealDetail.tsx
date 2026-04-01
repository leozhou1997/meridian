import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRoute, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { formatCurrency, getConfidenceColor, getConfidenceBg, getRoleColor, getSentimentColor, formatDate, getStageColor } from '@/lib/data';
import type { PersonalSignal } from '@/lib/data';

// DB-backed types (numeric IDs)
type Stakeholder = {
  id: number;
  dealId: number;
  tenantId: number;
  name: string;
  title: string | null;
  role: string;
  sentiment: string;
  engagement: string;
  email: string | null;
  linkedIn: string | null;
  keyInsights: string | null;
  personalNotes: string | null;
  personalSignals?: PersonalSignal[] | null;
  mapX: number | null;
  mapY: number | null;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
};
type Interaction = {
  id: number;
  dealId: number;
  tenantId: number;
  date: Date | string;
  type: string;
  keyParticipant: string | null;
  summary: string | null;
  duration: number | null;
  transcriptUrl?: string | null;
  createdAt: Date;
};
type NextAction = {
  id: number;
  dealId: number;
  tenantId: number;
  text: string;
  dueDate: Date | string | null;
  priority: string;
  completed: boolean;
  status?: string;
  source?: string;
  snapshotId?: number | null;
  createdAt: Date;
  updatedAt: Date;
};
import StakeholderMap from '@/components/StakeholderMap';
import DealInsightPanel from '@/components/DealInsightPanel';
import DealTimeline from '@/components/DealTimeline';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Globe, Clock, TrendingUp, TrendingDown, AlertTriangle,
  ChevronRight, User, MessageSquare, FileText, Map, BarChart3, X, ExternalLink,
  Mic, Check, Edit2, Save, Camera, GripHorizontal, ChevronDown, ChevronUp,
  Plus, Trash2, Pencil, Calendar, Lightbulb, Lock, Target, Sparkles, Heart, StickyNote, UserCircle, Activity, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CompanyLogo, StakeholderAvatar } from '@/components/Avatars';
import { useLanguage } from '@/contexts/LanguageContext';
import { PipelineToggleButton } from '@/components/AppLayout';
import DealPDFExport from '@/components/DealPDFExport';

type SentimentType = 'Positive' | 'Neutral' | 'Negative';
type RoleType = 'Champion' | 'Decision Maker' | 'Influencer' | 'Blocker' | 'User' | 'Evaluator';

const ALL_ROLES: RoleType[] = ['Champion', 'Decision Maker', 'Influencer', 'Blocker', 'User', 'Evaluator'];
const ALL_SENTIMENTS: SentimentType[] = ['Positive', 'Neutral', 'Negative'];

// Color map for interaction type badges
const INTERACTION_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Discovery Call':     { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/30'    },
  'Demo':               { bg: 'bg-purple-500/15',  text: 'text-purple-400',  border: 'border-purple-500/30'  },
  'Technical Review':   { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    border: 'border-cyan-500/30'    },
  'POC Check-in':       { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30'   },
  'Negotiation':        { bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/30'     },
  'Executive Briefing': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Follow-up':          { bg: 'bg-slate-500/15',   text: 'text-slate-400',   border: 'border-slate-500/30'   },
};
function getInteractionTypeColor(type: string) {
  return INTERACTION_TYPE_COLORS[type] ?? { bg: 'bg-muted/40', text: 'text-muted-foreground', border: 'border-border/40' };
}

// DB-backed strategy note type (numeric IDs from server)
type StrategyNote = {
  id: number;
  dealId: number;
  tenantId: number;
  category: 'pricing' | 'relationship' | 'competitive' | 'internal' | 'other';
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

const STRATEGY_CATEGORIES: { value: StrategyNote['category']; label: string; color: string }[] = [
  { value: 'pricing',       label: 'Pricing Flexibility', color: 'text-emerald-400' },
  { value: 'relationship',  label: 'Relationship Strategy', color: 'text-blue-400' },
  { value: 'competitive',   label: 'Competitive Intel', color: 'text-amber-400' },
  { value: 'internal',      label: 'Internal Alignment', color: 'text-purple-400' },
  { value: 'other',         label: 'Other', color: 'text-muted-foreground' },
];

const sentimentConfig: Record<SentimentType, { label: string; dot: string; bg: string; text: string; border: string }> = {
  Positive: { label: 'Positive', dot: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Neutral:  { label: 'Neutral',  dot: '#f59e0b', bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30'  },
  Negative: { label: 'Negative', dot: '#ef4444', bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/30'    },
};

const roleConfig: Record<RoleType, { bg: string; text: string; border: string }> = {
  'Champion':       { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/30'    },
  'Decision Maker': { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/30'  },
  'Influencer':     { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/30'    },
  'Blocker':        { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/30'     },
  'User':           { bg: 'bg-green-500/10',   text: 'text-green-400',   border: 'border-green-500/30'   },
  'Evaluator':      { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/30'  },
};

// ─── Mobile Pre-Meeting Summary Card ─────────────────────────────────────────
function MobileSummaryCard({
  deal, latestSnapshot, nextActions, interactions
}: {
  deal: any;
  latestSnapshot: any;
  nextActions: any[];
  interactions: any[];
}) {
  const [expanded, setExpanded] = useState(false);
  const pendingActions = nextActions.filter(a => a.status === 'accepted' || a.status === 'in_progress');
  const overdueActions = pendingActions.filter(a => a.dueDate && new Date(a.dueDate) < new Date());
  const lastInteraction = interactions[interactions.length - 1];
  const daysSinceLast = lastInteraction
    ? Math.floor((Date.now() - new Date(lastInteraction.date).getTime()) / 86400000)
    : null;

  return (
    <div className="md:hidden border-b border-border/30 bg-card/30">
      {/* Collapsed: 3 key numbers */}
      <button
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className={`font-mono text-sm font-bold ${deal.confidenceScore >= 75 ? 'text-emerald-400' : deal.confidenceScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {deal.confidenceScore}%
            </span>
            <span className="text-[10px] text-muted-foreground">confidence</span>
          </div>
          {pendingActions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className={`font-mono text-sm font-bold ${overdueActions.length > 0 ? 'text-red-400' : 'text-foreground'}`}>
                {pendingActions.length}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {overdueActions.length > 0 ? `actions (${overdueActions.length} overdue)` : 'actions'}
              </span>
            </div>
          )}
          {daysSinceLast !== null && (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold text-foreground">{daysSinceLast}d</span>
              <span className="text-[10px] text-muted-foreground">since last touch</span>
            </div>
          )}
        </div>
        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/50 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded: AI summary + next action + last interaction */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2.5 border-t border-border/20 pt-2.5">
          {latestSnapshot?.whatsHappening && (
            <div>
              <div className="text-[9px] text-primary/60 uppercase tracking-wider font-semibold mb-1">Situation</div>
              <p className="text-[12px] text-foreground/80 leading-relaxed line-clamp-3">{latestSnapshot.whatsHappening}</p>
            </div>
          )}
          {pendingActions.length > 0 && (
            <div>
              <div className="text-[9px] text-amber-400/60 uppercase tracking-wider font-semibold mb-1">Next Action</div>
              <p className="text-[12px] text-foreground/80 leading-snug">{pendingActions[0].text}</p>
              {pendingActions[0].dueDate && (
                <span className={`text-[10px] ${new Date(pendingActions[0].dueDate) < new Date() ? 'text-red-400' : 'text-muted-foreground/60'}`}>
                  Due {new Date(pendingActions[0].dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          )}
          {lastInteraction && (
            <div>
              <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider font-semibold mb-1">Last Interaction</div>
              <p className="text-[12px] text-muted-foreground/70 leading-snug">
                {lastInteraction.type} · {daysSinceLast === 0 ? 'Today' : `${daysSinceLast}d ago`}
                {lastInteraction.summary ? ` · ${lastInteraction.summary.slice(0, 80)}${lastInteraction.summary.length > 80 ? '...' : ''}` : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DealDetail() {
  const [, params] = useRoute('/deal/:id');
  const dealId = params?.id ? Number(params.id) : 0;
  const { t, language } = useLanguage();
  const isZh = language === 'zh';

  // ── Real API queries ──────────────────────────────────────────────────────
  const { data: dealData, isLoading: dealLoading } = trpc.deals.get.useQuery(
    { id: dealId },
    { enabled: dealId > 0, refetchOnWindowFocus: false }
  );
  const { data: stakeholdersData = [] } = trpc.stakeholders.listByDeal.useQuery(
    { dealId },
    { enabled: dealId > 0, refetchOnWindowFocus: false }
  );
  const { data: meetingsData = [] } = trpc.meetings.listByDeal.useQuery(
    { dealId },
    { enabled: dealId > 0, refetchOnWindowFocus: false }
  );
  const { data: snapshotsData = [] } = trpc.snapshots.listByDeal.useQuery(
    { dealId },
    { enabled: dealId > 0, refetchOnWindowFocus: false }
  );
  const { data: actionsData = [] } = trpc.nextActions.listByDeal.useQuery(
    { dealId },
    { enabled: dealId > 0, refetchOnWindowFocus: false }
  );
  const { data: strategyNotesData = [] } = trpc.strategyNotes.listByDeal.useQuery(
    { dealId },
    { enabled: dealId > 0, refetchOnWindowFocus: false }
  );

  // ── tRPC mutations ────────────────────────────────────────────────────────
  const utils = trpc.useUtils();
  const createActionMutation = trpc.nextActions.create.useMutation({
    onSuccess: () => utils.nextActions.listByDeal.invalidate({ dealId }),
  });
  const toggleActionMutation = trpc.nextActions.toggle.useMutation({
    onSuccess: () => utils.nextActions.listByDeal.invalidate({ dealId }),
  });
  const deleteActionMutation = trpc.nextActions.delete.useMutation({
    onSuccess: () => utils.nextActions.listByDeal.invalidate({ dealId }),
  });
  const updateActionStatusMutation = trpc.nextActions.updateStatus.useMutation({
    onSuccess: () => utils.nextActions.listByDeal.invalidate({ dealId }),
  });
  const updateStakeholderMutation = trpc.stakeholders.update.useMutation({
    onSuccess: () => utils.stakeholders.listByDeal.invalidate({ dealId }),
  });
  const createMeetingMutation = trpc.meetings.create.useMutation({
    onSuccess: () => utils.meetings.listByDeal.invalidate({ dealId }),
  });
  const updateMeetingMutation = trpc.meetings.update.useMutation({
    onSuccess: () => utils.meetings.listByDeal.invalidate({ dealId }),
  });
  const deleteMeetingMutation = trpc.meetings.delete.useMutation({
    onSuccess: () => utils.meetings.listByDeal.invalidate({ dealId }),
  });
  const updateDealMutation = trpc.deals.update.useMutation({
    onSuccess: () => utils.deals.get.invalidate({ id: dealId }),
  });
  const createStrategyNoteMutation = trpc.strategyNotes.create.useMutation({
    onSuccess: () => utils.strategyNotes.listByDeal.invalidate({ dealId }),
  });
  const updateStrategyNoteMutation = trpc.strategyNotes.update.useMutation({
    onSuccess: () => utils.strategyNotes.listByDeal.invalidate({ dealId }),
  });
  const deleteStrategyNoteMutation = trpc.strategyNotes.delete.useMutation({
    onSuccess: () => utils.strategyNotes.listByDeal.invalidate({ dealId }),
  });

  // Build a unified deal object that matches the UI's expected shape
  const deal = useMemo(() => {
    if (!dealData) return null;
    return {
      ...dealData,
      // Normalize all JSON/array fields that may be null from DB
      buyingStages: Array.isArray(dealData.buyingStages) ? dealData.buyingStages : [],
      companyInfo: dealData.companyInfo ?? '',
      website: dealData.website ?? '',
      logo: dealData.logo ?? null,
      stakeholders: stakeholdersData ?? [],
      meetings: meetingsData ?? [],
      snapshots: snapshotsData ?? [],
      nextActions: actionsData ?? [],
    };
  }, [dealData, stakeholdersData, meetingsData, snapshotsData, actionsData]);

  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
  const [activeTab, setActiveTab] = useState('map');
  const [showSummary, setShowSummary] = useState(true);
  const [hoveredStakeholderId, setHoveredStakeholderId] = useState<number | null>(null);
  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [mapSheetOpen, setMapSheetOpen] = useState(false);
  // Draggable Deal Summary panel
  const [summaryPos, setSummaryPos] = useState({ x: 16, y: 16 });
  const summaryDragRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  // Expandable text sections in Deal Summary
  const [summaryExpandedSection, setSummaryExpandedSection] = useState<string | null>(null);

  const handleSummaryMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    summaryDragRef.current = { mx: e.clientX, my: e.clientY, px: summaryPos.x, py: summaryPos.y };
    const onMove = (ev: MouseEvent) => {
      if (!summaryDragRef.current) return;
      const dx = ev.clientX - summaryDragRef.current.mx;
      const dy = ev.clientY - summaryDragRef.current.my;
      setSummaryPos({ x: summaryDragRef.current.px + dx, y: summaryDragRef.current.py + dy });
    };
    const onUp = () => {
      summaryDragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [summaryPos]);

  const handleOpenSummary = () => {
    setSummaryPos({ x: 16, y: 16 }); // reset to top-left
    setShowSummary(true);
  };

  // Stakeholders come directly from API (stakeholdersData)
  const localStakeholders = stakeholdersData;

  // Local editable interactions — shared between All Interactions tab and StakeholderMap
  // Use meetingsData directly from API + allow optimistic local overrides
  const [localInteractionOverrides, setLocalInteractionOverrides] = useState<Record<number, Partial<Interaction>>>({});
  const localInteractions = useMemo(() =>
    meetingsData.map(m => ({ ...m, ...localInteractionOverrides[m.id] })),
  [meetingsData, localInteractionOverrides]);
  const setLocalInteractions = (updater: (prev: Interaction[]) => Interaction[]) => {
    // No-op: local overrides are handled via localInteractionOverrides
  };
  const [editingInteractionId, setEditingInteractionId] = useState<number | null>(null);
  const [expandedTranscriptId, setExpandedTranscriptId] = useState<number | null>(null);

  // Next Actions - use actionsData directly from API
  const nextActions = actionsData;
  const [addingAction, setAddingAction] = useState(false);
  const [newActionText, setNewActionText] = useState('');
  const [newActionDue, setNewActionDue] = useState('');

  const toggleAction = (id: number) => {
    const action = actionsData.find(a => a.id === id);
    if (!action) return;
    toggleActionMutation.mutate({ id, completed: !action.completed });
  };
  const deleteAction = (id: number) => {
    deleteActionMutation.mutate({ id });
  };
  const addAction = () => {
    if (!newActionText.trim()) return;
    createActionMutation.mutate({
      dealId,
      text: newActionText.trim(),
      dueDate: newActionDue || undefined,
      priority: 'medium',
      source: 'manual',
      status: 'accepted',
    });
    setNewActionText('');
    setNewActionDue('');
    setAddingAction(false);
  };
  // Post-action feedback prompt state
  const [showDonePrompt, setShowDonePrompt] = useState(false);
  const [donePromptDealId, setDonePromptDealId] = useState<number | null>(null);
  const [donePromptActionText, setDonePromptActionText] = useState('');
  // Quick log interaction state (from done prompt)
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [quickLogType, setQuickLogType] = useState('Follow-up');
  const [quickLogSummary, setQuickLogSummary] = useState('');

  const updateActionStatus = (id: number, status: string) => {
    // If marking as done, show the feedback prompt
    if (status === 'done') {
      const action = actionsData.find(a => a.id === id);
      setDonePromptActionText(action?.text ?? '');
      setDonePromptDealId(dealId);
      setShowDonePrompt(true);
    }
    updateActionStatusMutation.mutate({ id, status: status as any });
  };

  // Deal Strategy notes (DB-backed)
  const strategyNotes = strategyNotesData as StrategyNote[];
  const [editingStrategyId, setEditingStrategyId] = useState<number | null>(null);
  const [editingStrategyDraft, setEditingStrategyDraft] = useState<{ category: StrategyNote['category']; content: string } | null>(null);

  const addStrategyNote = () => {
    createStrategyNoteMutation.mutate({ dealId, category: 'internal', content: '' }, {
      onSuccess: (created) => {
        setEditingStrategyId(created.id);
        setEditingStrategyDraft({ category: created.category as StrategyNote['category'], content: created.content });
      },
    });
  };

  const saveStrategyNote = (id: number) => {
    if (editingStrategyDraft) {
      updateStrategyNoteMutation.mutate({ id, ...editingStrategyDraft });
    }
    setEditingStrategyId(null);
    setEditingStrategyDraft(null);
  };

  const deleteStrategyNote = (id: number) => {
    deleteStrategyNoteMutation.mutate({ id });
    if (editingStrategyId === id) {
      setEditingStrategyId(null);
      setEditingStrategyDraft(null);
    }
  };

  const INTERACTION_TYPES = [
    'Discovery Call', 'Demo', 'Technical Review', 'POC Check-in',
    'Negotiation', 'Executive Briefing', 'Follow-up',
  ] as const;

  const updateInteraction = (id: number, patch: Partial<Interaction>) => {
    // Only pass fields the server router accepts
    const serverPatch: { id: number; date?: string | Date; type?: string; summary?: string; transcriptUrl?: string; keyParticipant?: string; duration?: number } = { id };
    if (patch.date !== undefined) serverPatch.date = patch.date as string | Date;
    if (patch.type !== undefined) serverPatch.type = patch.type;
    if (patch.summary !== undefined) serverPatch.summary = patch.summary ?? undefined;
    if (patch.keyParticipant !== undefined) serverPatch.keyParticipant = patch.keyParticipant ?? undefined;
    if (patch.duration !== undefined) serverPatch.duration = patch.duration ?? undefined;
    updateMeetingMutation.mutate(serverPatch);
    // Optimistic local override
    setLocalInteractionOverrides(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }));
  };

  const addInteraction = () => {
    createMeetingMutation.mutate({
      dealId,
      date: new Date().toISOString().slice(0, 10),
      type: 'Follow-up',
      keyParticipant: '',
      summary: '',
      duration: 30,
    });
  };

  const deleteInteraction = (id: number) => {
    deleteMeetingMutation.mutate({ id });
    // Clear any local overrides for this interaction
    setLocalInteractionOverrides(prev => { const next = { ...prev }; delete next[id]; return next; });
    if (editingInteractionId === id) setEditingInteractionId(null);
  };

  // Reset per-deal UI state when deal changes
  useEffect(() => {
    if (dealId > 0) {
      setEditingInteractionId(null);
      setExpandedTranscriptId(null);
      setEditingStrategyId(null);
      setEditingStrategyDraft(null);
      setSelectedStakeholder(null);
      setIsEditingProfile(false);
      setShowSummary(true);
      setSummaryPos({ x: 16, y: 16 });
      setActiveTab('map');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  // Personal intelligence state — keyed by stakeholder ID
  const [personalNotesMap, setPersonalNotesMap] = useState<Record<string, string>>({});
  const [personalSignalsMap, setPersonalSignalsMap] = useState<Record<string, PersonalSignal[]>>({});
  const [editingPersonalNotes, setEditingPersonalNotes] = useState(false);
  const [personalNotesDraft, setPersonalNotesDraft] = useState('');

  // Initialize personal data from stakeholders when they load
  useEffect(() => {
    if (stakeholdersData.length > 0) {
      const notesMap: Record<string, string> = {};
      const signalsMap: Record<string, PersonalSignal[]> = {};
      stakeholdersData.forEach(s => {
        if (s.personalNotes) notesMap[String(s.id)] = s.personalNotes;
        if (s.personalSignals) signalsMap[String(s.id)] = s.personalSignals as PersonalSignal[];
      });
      setPersonalNotesMap(notesMap);
      setPersonalSignalsMap(signalsMap);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stakeholdersData]);

  // Editing state for the profile panel
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editSentiment, setEditSentiment] = useState<SentimentType>('Neutral');
  const [editRoles, setEditRoles] = useState<RoleType[]>([]);

  // Pre-meeting Brief state
  const [showBrief, setShowBrief] = useState(false);
  const [briefStakeholderId, setBriefStakeholderId] = useState<number | null>(null);
  const [aiBriefText, setAiBriefText] = useState<string | null>(null);
  const [aiBriefLoading, setAiBriefLoading] = useState(false);
  // Profile modal view: 'brief' (default) | 'profile'
  const [profileModalView, setProfileModalView] = useState<'brief' | 'profile'>('brief');

  // Avatar upload ref — must be before early returns (Rules of Hooks)
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Inline edit state for deal header (must be before early returns) ──
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editCompany, setEditCompany] = useState(deal?.company ?? '');
  const [editDealName, setEditDealName] = useState(deal?.name ?? '');
  const [editValue, setEditValue] = useState(deal?.value?.toString() ?? '');
  const [editWebsite, setEditWebsite] = useState(deal?.website || '');

  // Sync local edit state when deal data changes (must be before early returns)
  useEffect(() => {
    if (!editingField && deal) {
      setEditCompany(deal.company);
      setEditDealName(deal.name);
      setEditValue(deal.value.toString());
      setEditWebsite(deal.website || '');
    }
  }, [deal?.company, deal?.name, deal?.value, deal?.website, editingField]);

  const generateBriefMutation = trpc.ai.generateBrief.useMutation();

  const generateBrief = (stakeholder: Stakeholder) => {
    setBriefStakeholderId(stakeholder.id);
    setShowBrief(true);
    setAiBriefText(null);
  };

  // When profile modal opens, default to 'brief' view and auto-generate if not already loaded
  const handleOpenStakeholderProfile = (s: Stakeholder) => {
    setSelectedStakeholder(s);
    setProfileModalView('brief');
    // Auto-generate brief when profile opens
    setBriefStakeholderId(s.id);
    setAiBriefText(null);
    // Trigger generation after state settles
    setTimeout(() => handleGenerateAIBrief(s), 50);
  };

  const handleGenerateAIBrief = async (s: any) => {
    if (!deal) return;
    setAiBriefLoading(true);
    try {
      const roles: string[] = Array.isArray((s as any).roles) ? (s as any).roles : [s.role];
      const relatedMeetings = deal.meetings.filter(m => m.keyParticipant === s.name);
      const lastMeeting = relatedMeetings[0];
      const signals = personalSignalsMap[s.id] ?? [];
      const pendingActions = nextActions.filter(a => !a.completed && (a as any).stakeholderId === s.id);
      const result = await generateBriefMutation.mutateAsync({
        dealId: deal.id,
        stakeholderName: s.name,
        stakeholderTitle: s.title ?? '',
        stakeholderRole: roles[0] ?? 'Unknown',
        sentiment: s.sentiment,
        engagement: s.engagement,
        keyInsights: s.keyInsights ?? '',
        personalNotes: personalNotesMap[s.id] ?? '',
        personalSignals: signals.map((sig: any) => ({ text: sig.text, emoji: sig.emoji ?? '•' })),
        dealName: deal.company,
        dealStage: deal.stage,
        dealValue: deal.value,
        companyInfo: deal.companyInfo ?? '',
        lastMeetingSummary: lastMeeting?.summary ?? undefined,
        openActions: pendingActions.map((a: any) => a.text),
        meetings: deal.meetings.map((m: any) => ({
          date: typeof m.date === 'string' ? m.date : new Date(m.date).toISOString(),
          type: m.type,
          keyParticipant: m.keyParticipant,
          summary: m.summary,
        })),
        language,
      });
      setAiBriefText(result.brief);
    } catch (err) {
      console.error('Brief generation failed:', err);
    } finally {
      setAiBriefLoading(false);
    }
  };

  if (dealLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading deal...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="font-display text-xl font-bold mb-2">Deal not found</h2>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const latestSnapshot = deal.snapshots[0];
  const statusLabel = deal.confidenceScore >= 75 ? 'On Track' : deal.confidenceScore >= 50 ? 'Need Attention' : 'At Risk';
  const statusColor = deal.confidenceScore >= 75 ? 'text-status-success' : deal.confidenceScore >= 50 ? 'text-status-warning' : 'text-status-danger';

  // Open stakeholder profile panel
  const handleStakeholderClick = (s: Stakeholder) => {
    // Find the latest local version
    const latest = localStakeholders.find(ls => ls.id === s.id) || s;
    setSelectedStakeholder(latest as Stakeholder);
    setIsEditingProfile(false);
    setEditName(latest.name);
    setEditTitle(latest.title ?? '');
    setEditSentiment(latest.sentiment as SentimentType);
    // role can be a single string in current data — normalize to array
    const currentRoles = Array.isArray((latest as any).roles)
      ? (latest as any).roles
      : [latest.role];
    setEditRoles(currentRoles as RoleType[]);
    // Default to brief view and auto-generate
    setProfileModalView('brief');
    setBriefStakeholderId(latest.id);
    setAiBriefText(null);
    setTimeout(() => handleGenerateAIBrief(latest), 50);
  };

  // Save edits via real API
  const handleSaveProfile = () => {
    if (!selectedStakeholder) return;
    updateStakeholderMutation.mutate({
      id: selectedStakeholder.id,
      name: editName.trim() || selectedStakeholder.name,
      title: editTitle.trim() || selectedStakeholder.title || '',
      sentiment: editSentiment,
      role: editRoles[0] || selectedStakeholder.role,
    }, {
      onSuccess: () => {
        // Refresh from API
        utils.stakeholders.listByDeal.invalidate({ dealId });
        setIsEditingProfile(false);
        toast.success('Stakeholder profile updated');
      },
    });
  };

  const toggleRole = (role: RoleType) => {
    setEditRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  // Avatar upload handler
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStakeholder) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      // Avatar is stored locally in UI state only (not persisted to DB yet)
      setSelectedStakeholder({ ...selectedStakeholder, avatar: dataUrl });
      toast.success('Avatar updated (local preview only)');
    };
    reader.readAsDataURL(file);
  };


  const saveField = (field: string) => {
    const updates: Record<string, any> = {};
    if (field === 'company' && editCompany.trim() !== deal.company) updates.company = editCompany.trim();
    if (field === 'name' && editDealName.trim() !== deal.name) updates.name = editDealName.trim();
    if (field === 'value') {
      const num = parseFloat(editValue);
      if (!isNaN(num) && num !== deal.value) updates.value = num;
    }
    if (field === 'website' && editWebsite.trim() !== (deal.website || '')) updates.website = editWebsite.trim();
    if (Object.keys(updates).length > 0) {
      updateDealMutation.mutate({ id: dealId, ...updates }, {
        onSuccess: () => toast.success('Deal updated'),
        onError: () => toast.error('Failed to update deal'),
      });
    }
    setEditingField(null);
  };

  const InlineEdit = ({ field, value, setValue, displayValue, className = '', inputClassName = '', prefix = '' }: {
    field: string; value: string; setValue: (v: string) => void; displayValue?: string; className?: string; inputClassName?: string; prefix?: string;
  }) => {
    if (editingField === field) {
      return (
        <div className="flex items-center gap-0">
          {prefix && <span className="text-muted-foreground text-sm font-mono">{prefix}</span>}
          <input
            autoFocus
            value={field === 'value' ? Number(value).toLocaleString('en-US') : value}
            onChange={e => {
              if (field === 'value') {
                const raw = e.target.value.replace(/[^0-9.]/g, '');
                setValue(raw);
              } else {
                setValue(e.target.value);
              }
            }}
            onBlur={() => saveField(field)}
            onKeyDown={e => { if (e.key === 'Enter') saveField(field); if (e.key === 'Escape') setEditingField(null); }}
            className={`bg-muted/50 border border-primary/30 rounded px-1.5 py-0.5 outline-none focus:border-primary text-foreground ${inputClassName}`}
          />
        </div>
      );
    }
    return (
      <span
        onClick={() => setEditingField(field)}
        className={`cursor-pointer hover:bg-muted/40 rounded px-1 py-0.5 -mx-1 transition-colors ${className}`}
        title="Click to edit"
      >
        {displayValue || value}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Deal header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm px-3 md:px-6 py-3 md:py-3.5 shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/deals">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <CompanyLogo name={deal.company} logoUrl={deal.logo} size="md" />
          <div className="flex-1 min-w-0">
            {/* Mobile: compact single-line header */}
            <div className="flex items-center gap-2 md:hidden">
              <span className="font-display text-base font-bold truncate">{editCompany}</span>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${getStageColor(deal.stage)}`}>{deal.stage}</Badge>
              <span className={`font-mono text-sm font-medium shrink-0 ${getConfidenceColor(deal.confidenceScore)}`}>{deal.confidenceScore}%</span>
            </div>
            {/* Desktop: full header with inline edits */}
            <div className="hidden md:flex items-center gap-3">
              <InlineEdit
                field="company"
                value={editCompany}
                setValue={setEditCompany}
                className="font-display text-lg font-bold"
                inputClassName="font-display text-lg font-bold w-48"
              />
              <span className="text-muted-foreground/30">·</span>
              <InlineEdit
                field="name"
                value={editDealName}
                setValue={setEditDealName}
                className="text-sm text-muted-foreground font-medium"
                inputClassName="text-sm w-48"
              />
              <span className="text-muted-foreground/30">·</span>
              {editWebsite ? (
                <div className="flex items-center gap-1">
                  <InlineEdit
                    field="website"
                    value={editWebsite}
                    setValue={setEditWebsite}
                    className="text-xs text-muted-foreground hover:text-primary"
                    inputClassName="text-xs w-40"
                  />
                  <a
                    href={`https://${editWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground/50 hover:text-primary transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <button
                  onClick={() => { setEditWebsite(''); setEditingField('website'); }}
                  className="text-xs text-muted-foreground/40 hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <Globe className="w-3 h-3" /> Add website
                </button>
              )}
            </div>
            <div className="hidden md:flex items-center gap-3 mt-1">
              <Badge variant="outline" className={`text-[10px] ${getStageColor(deal.stage)}`}>{deal.stage}</Badge>
              <InlineEdit
                field="value"
                value={editValue}
                setValue={setEditValue}
                displayValue={`${formatCurrency(deal.value)} ACV`}
                className="font-mono text-sm font-medium"
                inputClassName="font-mono text-sm w-28"
                prefix="$"
              />
              <div className="flex items-center gap-1">
                <span className={`font-mono text-sm font-medium ${getConfidenceColor(deal.confidenceScore)}`}>
                  {deal.confidenceScore}%
                </span>
                {latestSnapshot && latestSnapshot.confidenceChange !== 0 && (
                  <span className={`flex items-center text-xs font-mono ${
                    latestSnapshot.confidenceChange > 0 ? 'text-status-success' : 'text-status-danger'
                  }`}>
                    {latestSnapshot.confidenceChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {latestSnapshot.confidenceChange > 0 ? '+' : ''}{latestSnapshot.confidenceChange}
                  </span>
                )}
              </div>
              <Progress value={deal.confidenceScore} className="w-24 h-1.5" />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <DealPDFExport deal={{
              company: deal.company,
              name: deal.name,
              stage: deal.stage,
              value: deal.value,
              confidenceScore: deal.confidenceScore,
              companyInfo: deal.companyInfo,
              website: deal.website,
              stakeholders: localStakeholders.map((s: any) => ({
                name: s.name,
                title: s.title,
                role: s.role,
                sentiment: s.sentiment,
                engagement: s.engagement,
              })),
              snapshot: latestSnapshot ? {
                whatsHappening: latestSnapshot.whatsHappening ?? undefined,
                keyRisks: latestSnapshot.keyRisks as any,
                whatsNext: latestSnapshot.whatsNext as any,
                confidenceChange: latestSnapshot.confidenceChange ?? undefined,
              } : null,
              nextActions: nextActions.map((a: any) => ({
                text: a.text,
                dueDate: a.dueDate,
                completed: a.completed,
                status: a.status,
              })),
              interactions: localInteractions.map((m: any) => ({
                date: m.date,
                type: m.type,
                keyParticipant: m.keyParticipant,
                summary: m.summary,
              })),
            }} />
            <PipelineToggleButton />
          </div>
        </div>
      </div>

      {/* Mobile Pre-Meeting Summary Card — only visible on mobile */}
      <MobileSummaryCard
        deal={deal}
        latestSnapshot={latestSnapshot}
        nextActions={nextActions}
        interactions={localInteractions}
      />

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-border/30 px-3 md:px-6">
              <TabsList className="bg-transparent h-10 gap-0.5 md:gap-1 p-0">
                <TabsTrigger value="map" className="data-[state=active]:bg-muted/50 data-[state=active]:shadow-none rounded-lg text-xs font-display gap-1 md:gap-1.5 px-2 md:px-3 h-8">
                  <Map className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('deal.buyingCommittee')}</span>
                  <span className="sm:hidden">{isZh ? '洞察' : 'Insight'}</span>
                </TabsTrigger>
                <TabsTrigger value="timeline" className="data-[state=active]:bg-muted/50 data-[state=active]:shadow-none rounded-lg text-xs font-display gap-1 md:gap-1.5 px-2 md:px-3 h-8">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isZh ? '交易室' : 'Deal Room'}</span>
                  <span className="sm:hidden">{isZh ? '交易室' : 'Room'}</span>
                </TabsTrigger>
                <TabsTrigger value="strategy" className="data-[state=active]:bg-muted/50 data-[state=active]:shadow-none rounded-lg text-xs font-display gap-1 md:gap-1.5 px-2 md:px-3 h-8">
                  <Target className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('deal.dealStrategy')}</span>
                  <span className="sm:hidden">{isZh ? '策略' : 'Strategy'}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="map" className="flex-1 m-0 overflow-hidden min-h-0">
              <div className="h-full flex overflow-hidden">

                {/* ── Deal Insight Panel — full width on mobile, left side on desktop ── */}
                <DealInsightPanel
                  deal={deal}
                  latestSnapshot={latestSnapshot}
                  nextActions={nextActions}
                  addingAction={addingAction}
                  setAddingAction={setAddingAction}
                  newActionText={newActionText}
                  setNewActionText={setNewActionText}
                  newActionDue={newActionDue}
                  setNewActionDue={setNewActionDue}
                  addAction={addAction}
                  toggleAction={toggleAction}
                  deleteAction={deleteAction}
                  updateActionStatus={updateActionStatus}
                  createAiAction={(text: string, snapshotId?: number, status?: string) => {
                    createActionMutation.mutate({
                      dealId,
                      text,
                      source: 'ai_suggested',
                      status: (status ?? 'pending') as any,
                      snapshotId,
                    });
                  }}
                  setActiveTab={setActiveTab}
                  onStakeholderHover={setHoveredStakeholderId}
                  onStakeholderClick={(id) => {
                    const s = deal.stakeholders.find((st: any) => st.id === id);
                    if (s) handleStakeholderClick(s as Stakeholder);
                  }}
                  onOpenMapSheet={() => setMapSheetOpen(true)}
                />

                {/* ── Stakeholder Map canvas — hidden on mobile, right side on desktop ── */}
                <div className={`hidden md:block relative overflow-hidden transition-all duration-300 ease-in-out ${mapCollapsed ? 'w-[48px] shrink-0' : 'flex-1'}`}>
                  {/* Map collapse toggle */}
                  <button
                    onClick={() => setMapCollapsed(c => !c)}
                    className="absolute top-2 left-2 z-20 flex items-center justify-center w-7 h-7 rounded-lg bg-card/80 backdrop-blur-sm border border-border/40 hover:bg-card text-muted-foreground/60 hover:text-foreground transition-all shadow-sm"
                    title={mapCollapsed ? (isZh ? '展开利益相关者地图' : 'Expand Stakeholder Map') : (isZh ? '收起利益相关者地图' : 'Minimize Stakeholder Map')}
                  >
                    {mapCollapsed
                      ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    }
                  </button>
                  {mapCollapsed ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 bg-card/20">
                      <Map className="w-4 h-4 text-muted-foreground/40" />
                      <div className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-medium select-none" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        {isZh ? '利益相关者' : 'Stakeholder Map'}
                      </div>
                    </div>
                  ) : (
                    <StakeholderMap
                      key={deal.id}
                      deal={deal as any}
                      highlightedStakeholderId={hoveredStakeholderId}
                      onStakeholderClick={(s: any) => handleStakeholderClick(s as Stakeholder)}
                      onStakeholdersChange={() => utils.stakeholders.listByDeal.invalidate({ dealId })}
                      onBuyingStagesChange={(stages) => updateDealMutation.mutate({ id: dealId, buyingStages: stages })}
                    />
                  )}
                </div>


              </div>

              {/* ── Mobile Stakeholder Map Bottom Sheet ── */}
              <MobileMapSheet
                open={mapSheetOpen}
                onClose={() => setMapSheetOpen(false)}
                deal={deal as any}
                hoveredStakeholderId={hoveredStakeholderId}
                onStakeholderClick={(s: any) => handleStakeholderClick(s as Stakeholder)}
                onStakeholdersChange={() => utils.stakeholders.listByDeal.invalidate({ dealId })}
                onBuyingStagesChange={(stages: any) => updateDealMutation.mutate({ id: dealId, buyingStages: stages })}
              />
            </TabsContent>

            <TabsContent value="timeline" className="flex-1 m-0 overflow-auto">
              <DealTimeline
                snapshots={deal.snapshots}
                meetings={localInteractions}
                companyInfo={deal.companyInfo}
                companyName={deal.company}
                onAddMeeting={addInteraction}
                onEditMeeting={(id) => setEditingInteractionId(id)}
                onDeleteMeeting={deleteInteraction}
              />
            </TabsContent>


            {/* ── Deal Strategy Tab ── */}
            <TabsContent value="strategy" className="flex-1 m-0 overflow-auto">
              <div className="p-6 max-w-3xl">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-display text-sm font-semibold">Deal Strategy</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 max-w-sm leading-relaxed">
                      Internal strategy notes for this deal — pricing flexibility, relationship plays, competitive intel, and internal alignment. These notes inform the AI agent’s recommendations.
                    </p>
                  </div>
                  <button
                    onClick={addStrategyNote}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0"
                  >
                    <Plus className="w-3 h-3" /> Add Note
                  </button>
                </div>

                {/* Category legend */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {STRATEGY_CATEGORIES.map(cat => (
                    <span key={cat.value} className={`text-[10px] font-medium ${cat.color} flex items-center gap-1`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {cat.label}
                    </span>
                  ))}
                </div>

                <div className="space-y-3">
                  {strategyNotes.map(note => {
                    const isEditing = editingStrategyId === note.id;
                    const catConfig = STRATEGY_CATEGORIES.find(c => c.value === note.category) ?? STRATEGY_CATEGORIES[4];
                    const draftCat = isEditing && editingStrategyDraft ? editingStrategyDraft.category : note.category;
                    const draftContent = isEditing && editingStrategyDraft ? editingStrategyDraft.content : note.content;
                    return (
                      <Card key={note.id} className={`border-border/50 transition-colors ${
                        isEditing ? 'bg-muted/40 border-primary/30' : 'bg-card'
                      }`}>
                        <CardContent className="p-4">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <select
                                  value={draftCat}
                                  onChange={e => setEditingStrategyDraft(prev => ({ ...(prev ?? { category: note.category, content: note.content }), category: e.target.value as StrategyNote['category'] }))}
                                  className="flex-1 text-xs bg-background border border-border/50 rounded-md px-2.5 py-1.5 text-foreground"
                                >
                                  {STRATEGY_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                  ))}
                                </select>
                              </div>
                              <textarea
                                value={draftContent}
                                onChange={e => setEditingStrategyDraft(prev => ({ ...(prev ?? { category: note.category, content: note.content }), content: e.target.value }))}
                                placeholder={isZh ? '描述此交易的内部策略、背景或约束条件...' : 'Describe the internal strategy, context, or constraints for this deal...'}
                                rows={5}
                                className="w-full text-xs bg-background border border-border/50 rounded-md px-2.5 py-2 text-foreground resize-y leading-relaxed"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveStrategyNote(note.id)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                                >
                                  <Check className="w-3 h-3" /> {isZh ? '保存' : 'Done'}
                                </button>
                                <button
                                  onClick={() => deleteStrategyNote(note.id)}
                                  className="px-4 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                                >
                                  {isZh ? '删除' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                <Lightbulb className="w-3.5 h-3.5 text-muted-foreground/60" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className={`text-[10px] font-semibold ${catConfig.color}`}>{catConfig.label}</span>
                                  <span className="text-[10px] text-muted-foreground/50">· {formatDate(String(note.updatedAt))}</span>
                                  <div className="ml-auto">
                                    <button
                                      onClick={() => { setEditingStrategyId(note.id); setEditingStrategyDraft({ category: note.category, content: note.content }); }}
                                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors"
                                    >
                                      <Pencil className="w-3 h-3 text-muted-foreground/50" />
                                    </button>
                                  </div>
                                </div>
                                {note.content ? (
                                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                ) : (
                                  <p className="text-xs text-muted-foreground/40 italic">{isZh ? '空笔记 — 点击 ✏ 添加内容' : 'Empty note — click ✏ to add content'}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {strategyNotes.length === 0 && (
                    <div className="text-center py-14 text-muted-foreground/60">
                      <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                        <Target className="w-6 h-6 opacity-30" />
                      </div>
                      <p className="text-sm font-medium">No strategy notes yet</p>
                      <p className="text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                        Add internal context like pricing flexibility, strategic priority, or relationship plays — the AI agent will use these to tailor its recommendations.
                      </p>
                      <button
                        onClick={addStrategyNote}
                        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors mx-auto"
                      >
                        <Plus className="w-3 h-3" /> Add First Strategy Note
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Stakeholder Profile Modal ── */}
        <AnimatePresence>
          {selectedStakeholder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedStakeholder(null)}
            >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="w-[640px] max-h-[85vh] overflow-hidden rounded-2xl bg-card border border-border/60 shadow-2xl flex flex-col"
            >
              {/* Modal sticky header with tabs */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 shrink-0">
                <div className="flex items-center gap-1">
                  {/* Avatar mini */}
                  <StakeholderAvatar name={selectedStakeholder.name} avatarUrl={selectedStakeholder.avatar} size="xs" className="mr-1" />
                  <span className="text-xs font-semibold text-foreground/90 mr-3">{selectedStakeholder.name}</span>
                  {/* Tab switcher */}
                  {!isEditingProfile && (
                    <div className="flex items-center gap-0.5 bg-muted/40 rounded-lg p-0.5">
                      <button
                        onClick={() => setProfileModalView('brief')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                          profileModalView === 'brief'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        Brief
                      </button>
                      <button
                        onClick={() => setProfileModalView('profile')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                          profileModalView === 'profile'
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <UserCircle className="w-2.5 h-2.5" />
                        Profile
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isEditingProfile ? (
                    <>
                      <button
                        onClick={handleSaveProfile}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      {profileModalView === 'profile' && (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-[10px] font-medium hover:bg-muted/80 hover:text-foreground transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedStakeholder(null)}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-5">
                  {/* Brief View */}
                  {profileModalView === 'brief' && !isEditingProfile && (() => {
                    const s = selectedStakeholder;
                    const signals = personalSignalsMap[s.id] ?? [];
                    const notes = personalNotesMap[s.id] ?? '';
                    const relatedMeetings = deal.meetings.filter(m => m.keyParticipant === s.name);
                    const lastMeeting = relatedMeetings[0];
                    const roles: string[] = Array.isArray((s as any).roles) ? (s as any).roles : [s.role];
                    const pendingActions = nextActions.filter(a => !a.completed && (a as any).stakeholderId === s.id);
                    return (
                      <div className="space-y-4">
                        {/* Who they are */}
                        <div>
                          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Who They Are</div>
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20">
                            <StakeholderAvatar name={s.name} avatarUrl={s.avatar} size="md" />
                            <div>
                              <div className="text-sm font-semibold">{s.name}</div>
                              <div className="text-xs text-muted-foreground">{s.title} · {deal.company}</div>
                              <div className="flex gap-1 mt-1">
                                {roles.map(r => <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">{r}</span>)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Business context */}
                        {s.keyInsights && (
                          <div>
                            <div className="text-[9px] font-semibold text-status-info uppercase tracking-wider mb-1.5">Business Context</div>
                            <p className="text-xs text-foreground/80 leading-relaxed bg-muted/15 rounded-lg p-3">{s.keyInsights}</p>
                          </div>
                        )}

                        {/* Relationship status */}
                        <div>
                          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Relationship Status</div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              s.sentiment === 'Positive' ? 'bg-emerald-500/15 text-emerald-400' :
                              s.sentiment === 'Negative' ? 'bg-red-500/15 text-red-400' :
                              'bg-amber-500/15 text-amber-400'
                            }`}>{s.sentiment}</span>
                            <span className="text-muted-foreground">{s.engagement} Engagement</span>
                            {lastMeeting && <span className="text-muted-foreground">Last met: {formatDate(typeof lastMeeting.date === 'string' ? lastMeeting.date : new Date(lastMeeting.date).toISOString())}</span>}
                          </div>
                          {lastMeeting && (
                            <p className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">
                              <span className="font-medium text-muted-foreground">Last interaction:</span> {lastMeeting.summary}
                            </p>
                          )}
                        </div>

                        {/* Personal talking points */}
                        {(signals.length > 0 || notes) && (
                          <div>
                            <div className="text-[9px] font-semibold text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <Heart className="w-2.5 h-2.5" />
                              Personal Talking Points
                            </div>
                            {signals.length > 0 && (
                              <div className="space-y-1.5 mb-2">
                                {signals.map(sig => (
                                  <div key={sig.id} className="flex items-start gap-2 text-[11px] text-foreground/80">
                                    <span>{sig.emoji}</span>
                                    <span className="leading-snug">{sig.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {notes && (
                              <p className="text-[11px] text-foreground/70 leading-relaxed bg-muted/15 rounded-lg p-2.5 border border-border/20 whitespace-pre-wrap">{notes}</p>
                            )}
                          </div>
                        )}

                        {/* Pending actions */}
                        {pendingActions.length > 0 && (
                          <div>
                            <div className="text-[9px] font-semibold text-primary uppercase tracking-wider mb-1.5">Open Actions</div>
                            <div className="space-y-1">
                              {pendingActions.map(a => (
                                <div key={a.id} className="flex items-start gap-2 text-[11px] text-foreground/80">
                                  <span className={`mt-0.5 w-3 h-3 rounded border shrink-0 ${
                                    a.priority === 'high' ? 'border-status-danger/60' : 'border-border/60'
                                  }`} />
                                  <span className="leading-snug">{a.text}</span>
                                  {a.dueDate && <span className="text-[9px] text-muted-foreground/60 shrink-0">Due {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Deal context */}
                        <div className="border-t border-border/30 pt-3">
                          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Deal Context</div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-muted/20 rounded-lg p-2">
                              <div className="text-[9px] text-muted-foreground mb-0.5">Stage</div>
                              <div className="text-[11px] font-medium">{deal.stage}</div>
                            </div>
                            <div className="bg-muted/20 rounded-lg p-2">
                              <div className="text-[9px] text-muted-foreground mb-0.5">Confidence</div>
                              <div className={`text-[11px] font-semibold font-mono ${getConfidenceColor(deal.confidenceScore)}`}>{deal.confidenceScore}%</div>
                            </div>
                            <div className="bg-muted/20 rounded-lg p-2">
                              <div className="text-[9px] text-muted-foreground mb-0.5">ACV</div>
                              <div className="text-[11px] font-semibold font-mono">{formatCurrency(deal.value)}</div>
                            </div>
                          </div>
                          {latestSnapshot && (
                            <p className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">
                              <span className="font-medium text-muted-foreground">Situation:</span> {latestSnapshot.whatsHappening}
                            </p>
                          )}
                        </div>

                        {/* AI Brief section */}
                        <div className="border-t border-border/30 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              AI-Generated Brief
                            </div>
                            <button
                              onClick={() => handleGenerateAIBrief(s)}
                              disabled={aiBriefLoading}
                              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
                            >
                              {aiBriefLoading ? (
                                <><div className="w-2.5 h-2.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />Generating...</>
                              ) : (
                                <><Sparkles className="w-2.5 h-2.5" />{aiBriefText ? 'Regenerate' : 'Generate Brief'}</>
                              )}
                            </button>
                          </div>
                          {aiBriefText ? (
                            <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3">
                              <pre className="text-[11px] text-foreground/85 leading-relaxed whitespace-pre-wrap font-body">{aiBriefText}</pre>
                            </div>
                          ) : aiBriefLoading ? (
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 py-3">
                              <div className="w-3 h-3 border border-amber-400/50 border-t-transparent rounded-full animate-spin" />
                              Generating brief for {s.name}...
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground/60 italic">
                              Click "Generate Brief" to get an AI-crafted narrative brief based on all available context for {s.name}.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Profile View (or editing mode) */}
                  {(profileModalView === 'profile' || isEditingProfile) && (
                  <div className="space-y-0">

                  {/* Avatar + Name/Title */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="relative shrink-0 group">
                      <StakeholderAvatar name={selectedStakeholder.name} avatarUrl={selectedStakeholder.avatar} size="lg" className="border-2 border-border" />
                      {/* Upload overlay — always visible on hover */}
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Change photo"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditingProfile ? (
                        <div className="space-y-1.5">
                          <Input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="h-7 text-xs font-medium"
                            placeholder="Full name"
                          />
                          <Input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="h-7 text-xs text-muted-foreground"
                            placeholder="Job title"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-medium">{selectedStakeholder.name}</div>
                          <div className="text-xs text-muted-foreground">{selectedStakeholder.title}</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ── Decision Stance (single select) ── */}
                  <div className="mb-4">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Decision Stance
                    </div>
                    {isEditingProfile ? (
                      <div className="flex gap-2">
                        {ALL_SENTIMENTS.map(s => {
                          const cfg = sentimentConfig[s];
                          const isActive = editSentiment === s;
                          return (
                            <button
                              key={s}
                              onClick={() => setEditSentiment(s)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                                isActive
                                  ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-current/30`
                                  : 'border-border/40 text-muted-foreground hover:border-border/70'
                              }`}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                              {s}
                              {isActive && <Check className="w-2.5 h-2.5" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {(() => {
                          const cfg = sentimentConfig[selectedStakeholder.sentiment as SentimentType] || sentimentConfig.Neutral;
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                              {selectedStakeholder.sentiment}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* ── Role (multi-select) ── */}
                  <div className="mb-4">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Role {isEditingProfile && <span className="text-muted-foreground/60 normal-case font-normal">(select all that apply)</span>}
                    </div>
                    {isEditingProfile ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {ALL_ROLES.map(role => {
                          const cfg = roleConfig[role];
                          const isActive = editRoles.includes(role);
                          return (
                            <button
                              key={role}
                              onClick={() => toggleRole(role)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                                isActive
                                  ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-current/20`
                                  : 'border-border/40 text-muted-foreground hover:border-border/70'
                              }`}
                            >
                              {isActive && <Check className="w-2.5 h-2.5 shrink-0" />}
                              {role}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          const roles: RoleType[] = Array.isArray((selectedStakeholder as any).roles)
                            ? (selectedStakeholder as any).roles
                            : [selectedStakeholder.role];
                          return roles.map(role => {
                            const cfg = roleConfig[role as RoleType] || roleConfig.Influencer;
                            return (
                              <span
                                key={role}
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                              >
                                {role}
                              </span>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Engagement */}
                  {!isEditingProfile && (
                    <div className="mb-4">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Engagement</div>
                      <Badge variant="outline" className="text-[10px]">
                        {selectedStakeholder.engagement} Engagement
                      </Badge>
                    </div>
                  )}

                  {/* Key Insights */}
                  {selectedStakeholder.keyInsights && !isEditingProfile && (
                    <div className="mb-4">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Key Insights</div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{selectedStakeholder.keyInsights}</p>
                    </div>
                  )}

                  {/* ── Know Your Stakeholder ── */}
                  {!isEditingProfile && (() => {
                    const sid = selectedStakeholder.id;
                    const signals = personalSignalsMap[sid] ?? [];
                    const notes = personalNotesMap[sid] ?? '';
                    return (
                      <div className="mb-4 border-t border-border/30 pt-4">
                        {/* Section header */}
                        <div className="flex items-center gap-1.5 mb-3">
                          <Heart className="w-3 h-3 text-rose-400" />
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Know Your Stakeholder</span>
                        </div>

                        {/* AI-extracted signals */}
                        {signals.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center gap-1 mb-1.5">
                              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                              <span className="text-[9px] font-medium text-amber-400/80 uppercase tracking-wider">AI Signals</span>
                            </div>
                            <div className="space-y-1.5">
                              {signals.map(sig => (
                                <div key={sig.id} className="group flex items-start gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                                  <span className="text-sm leading-none mt-0.5">{sig.emoji}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-foreground/80 leading-snug">{sig.text}</p>
                                    {sig.source && (
                                      <p className="text-[9px] text-muted-foreground/50 mt-0.5">{sig.source}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => setPersonalSignalsMap(prev => ({
                                      ...prev,
                                      [sid]: (prev[sid] ?? []).filter(s => s.id !== sig.id)
                                    }))}
                                    className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-muted-foreground/50 hover:text-destructive transition-all"
                                    title="Remove signal"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Personal notes */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1">
                              <StickyNote className="w-2.5 h-2.5 text-muted-foreground/60" />
                              <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Personal Notes</span>
                            </div>
                            {!editingPersonalNotes ? (
                              <button
                                onClick={() => {
                                  setPersonalNotesDraft(notes);
                                  setEditingPersonalNotes(true);
                                }}
                                className="text-[9px] text-primary/70 hover:text-primary flex items-center gap-0.5 transition-colors"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                                {notes ? 'Edit' : 'Add'}
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setPersonalNotesMap(prev => ({ ...prev, [sid]: personalNotesDraft }));
                                    setEditingPersonalNotes(false);
                                    toast.success('Personal notes saved');
                                  }}
                                  className="text-[9px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingPersonalNotes(false)}
                                  className="text-[9px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                          {editingPersonalNotes ? (
                            <textarea
                              value={personalNotesDraft}
                              onChange={e => setPersonalNotesDraft(e.target.value)}
                              placeholder="Add personal context — hobbies, family mentions, communication style, things to remember before your next meeting..."
                              className="w-full min-h-[80px] text-xs p-2 rounded-lg bg-muted/30 border border-border/50 text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none transition-colors"
                              autoFocus
                            />
                          ) : notes ? (
                            <p className="text-[11px] text-foreground/70 leading-relaxed whitespace-pre-wrap bg-muted/10 rounded-lg p-2 border border-border/20">{notes}</p>
                          ) : (
                            <button
                              onClick={() => {
                                setPersonalNotesDraft('');
                                setEditingPersonalNotes(true);
                              }}
                              className="w-full text-left text-[10px] text-muted-foreground/40 italic p-2 rounded-lg border border-dashed border-border/30 hover:border-border/50 hover:text-muted-foreground/60 transition-colors"
                            >
                              + Add personal notes about {selectedStakeholder.name.split(' ')[0]}...
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Contact */}
                  {selectedStakeholder.email && !isEditingProfile && (
                    <div className="mb-4">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Contact</div>
                      <p className="text-xs text-primary">{selectedStakeholder.email}</p>
                    </div>
                  )}

                  {/* Related Interactions */}
                  {!isEditingProfile && (
                    <div className="border-t border-border/30 pt-3">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Related Interactions</div>
                      {deal.meetings
                        .filter(i => i.keyParticipant === selectedStakeholder.name)
                        .map(interaction => (
                          <div key={interaction.id} className="p-2 rounded bg-muted/20 mb-1.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge variant="outline" className="text-[9px] px-1 py-0">{interaction.type}</Badge>
                              <span className="text-[10px] text-muted-foreground">{formatDate(typeof interaction.date === 'string' ? interaction.date : new Date(interaction.date).toISOString())}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">{interaction.summary}</p>
                          </div>
                        ))
                      }
                      {deal.meetings.filter(i => i.keyParticipant === selectedStakeholder.name).length === 0 && (
                        <p className="text-[10px] text-muted-foreground/60 italic">No direct interactions recorded.</p>
                      )}
                    </div>
                  )}
                  </div>
                  )}
                </div>
              </div>
            </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pre-meeting Brief Modal */}
      <AnimatePresence>
        {showBrief && briefStakeholderId && (() => {
          const s = localStakeholders.find(st => st.id === briefStakeholderId);
          if (!s) return null;
          const signals = personalSignalsMap[s.id] ?? [];
          const notes = personalNotesMap[s.id] ?? '';
          const relatedMeetings = deal.meetings.filter(m => m.keyParticipant === s.name);
          const lastMeeting = relatedMeetings[0];
          const roles: string[] = Array.isArray((s as any).roles) ? (s as any).roles : [s.role];
          const pendingActions = nextActions.filter(a => !a.completed && a.stakeholderId === s.id);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShowBrief(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={e => e.stopPropagation()}
                className="w-[520px] max-h-[80vh] overflow-y-auto rounded-2xl bg-card border border-border/60 shadow-2xl"
              >
                {/* Brief header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-display text-sm font-semibold">Pre-meeting Brief</span>
                    <span className="text-xs text-muted-foreground">— {s.name}</span>
                  </div>
                  <button onClick={() => setShowBrief(false)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {/* Who they are */}
                  <div>
                    <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Who They Are</div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20">
                      <StakeholderAvatar name={s.name} avatarUrl={s.avatar} size="md" />
                      <div>
                        <div className="text-sm font-semibold">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.title} · {deal.company}</div>
                        <div className="flex gap-1 mt-1">
                          {roles.map(r => <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">{r}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business context */}
                  {s.keyInsights && (
                    <div>
                      <div className="text-[9px] font-semibold text-status-info uppercase tracking-wider mb-1.5">Business Context</div>
                      <p className="text-xs text-foreground/80 leading-relaxed bg-muted/15 rounded-lg p-3">{s.keyInsights}</p>
                    </div>
                  )}

                  {/* Relationship status */}
                  <div>
                    <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Relationship Status</div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        s.sentiment === 'Positive' ? 'bg-emerald-500/15 text-emerald-400' :
                        s.sentiment === 'Negative' ? 'bg-red-500/15 text-red-400' :
                        'bg-amber-500/15 text-amber-400'
                      }`}>{s.sentiment}</span>
                      <span className="text-muted-foreground">{s.engagement} Engagement</span>
                      {lastMeeting && <span className="text-muted-foreground">Last met: {formatDate(typeof lastMeeting.date === 'string' ? lastMeeting.date : new Date(lastMeeting.date).toISOString())}</span>}
                    </div>
                    {lastMeeting && (
                      <p className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">
                        <span className="font-medium text-muted-foreground">Last interaction:</span> {lastMeeting.summary}
                      </p>
                    )}
                  </div>

                  {/* Personal talking points */}
                  {(signals.length > 0 || notes) && (
                    <div>
                      <div className="text-[9px] font-semibold text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5" />
                        Personal Talking Points
                      </div>
                      {signals.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          {signals.map(sig => (
                            <div key={sig.id} className="flex items-start gap-2 text-[11px] text-foreground/80">
                              <span>{sig.emoji}</span>
                              <span className="leading-snug">{sig.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {notes && (
                        <p className="text-[11px] text-foreground/70 leading-relaxed bg-muted/15 rounded-lg p-2.5 border border-border/20 whitespace-pre-wrap">{notes}</p>
                      )}
                    </div>
                  )}

                  {/* Pending actions for this stakeholder */}
                  {pendingActions.length > 0 && (
                    <div>
                      <div className="text-[9px] font-semibold text-primary uppercase tracking-wider mb-1.5">Open Actions</div>
                      <div className="space-y-1">
                        {pendingActions.map(a => (
                          <div key={a.id} className="flex items-start gap-2 text-[11px] text-foreground/80">
                            <span className={`mt-0.5 w-3 h-3 rounded border shrink-0 ${
                              a.priority === 'high' ? 'border-status-danger/60' : 'border-border/60'
                            }`} />
                            <span className="leading-snug">{a.text}</span>
                            {a.dueDate && <span className="text-[9px] text-muted-foreground/60 shrink-0">Due {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deal context */}
                  <div className="border-t border-border/30 pt-3">
                    <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Deal Context</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted/20 rounded-lg p-2">
                        <div className="text-[9px] text-muted-foreground mb-0.5">Stage</div>
                        <div className="text-[11px] font-medium">{deal.stage}</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-2">
                        <div className="text-[9px] text-muted-foreground mb-0.5">Confidence</div>
                        <div className={`text-[11px] font-semibold font-mono ${getConfidenceColor(deal.confidenceScore)}`}>{deal.confidenceScore}%</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-2">
                        <div className="text-[9px] text-muted-foreground mb-0.5">ACV</div>
                        <div className="text-[11px] font-semibold font-mono">{formatCurrency(deal.value)}</div>
                      </div>
                    </div>
                    {latestSnapshot && (
                      <p className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">
                        <span className="font-medium text-muted-foreground">Situation:</span> {latestSnapshot.whatsHappening}
                      </p>
                    )}
                  </div>

                  {/* AI Brief section */}
                  <div className="border-t border-border/30 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        AI-Generated Brief
                      </div>
                      <button
                        onClick={() => handleGenerateAIBrief(s)}
                        disabled={aiBriefLoading}
                        className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
                      >
                        {aiBriefLoading ? (
                          <><div className="w-2.5 h-2.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />Generating...</>
                        ) : (
                          <><Sparkles className="w-2.5 h-2.5" />{aiBriefText ? 'Regenerate' : 'Generate Brief'}</>
                        )}
                      </button>
                    </div>
                    {aiBriefText ? (
                      <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3">
                        <pre className="text-[11px] text-foreground/85 leading-relaxed whitespace-pre-wrap font-body">{aiBriefText}</pre>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/60 italic">
                        Click "Generate Brief" to get an AI-crafted narrative brief based on all available context for {s.name}.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
        </AnimatePresence>

      {/* ── P0-1: Post-Action Done Prompt ── */}
      <AnimatePresence>
        {showDonePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDonePrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:w-[440px] mx-4 mb-4 sm:mb-0 rounded-2xl bg-card border border-border/60 shadow-2xl p-5"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Check className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground mb-0.5">Action completed!</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{donePromptActionText}</div>
                </div>
                <button
                  onClick={() => setShowDonePrompt(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Want to log what happened? Recording the outcome will help AI generate better insights for your next steps.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDonePrompt(false);
                    setShowQuickLog(true);
                    setQuickLogSummary('');
                    setQuickLogType('Follow-up');
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log Interaction
                </button>
                <button
                  onClick={() => setShowDonePrompt(false)}
                  className="px-3 py-2 rounded-lg border border-border/50 text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick Log Interaction Modal (from Done Prompt) ── */}
      <AnimatePresence>
        {showQuickLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowQuickLog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:w-[480px] mx-4 mb-4 sm:mb-0 rounded-2xl bg-card border border-border/60 shadow-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold">Log Interaction</div>
                <button
                  onClick={() => setShowQuickLog(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Interaction type */}
              <div className="mb-3">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {INTERACTION_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setQuickLogType(t)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                        quickLogType === t
                          ? 'bg-primary/15 text-primary border-primary/30'
                          : 'bg-muted/30 text-muted-foreground border-border/30 hover:bg-muted/60'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="mb-4">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">What happened?</label>
                <textarea
                  value={quickLogSummary}
                  onChange={e => setQuickLogSummary(e.target.value)}
                  placeholder="Brief summary of the interaction..."
                  className="w-full h-24 bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    createMeetingMutation.mutate({
                      dealId,
                      date: new Date().toISOString().slice(0, 10),
                      type: quickLogType,
                      keyParticipant: '',
                      summary: quickLogSummary,
                      duration: 30,
                    }, {
                      onSuccess: () => {
                        setShowQuickLog(false);
                        toast.success('Interaction logged');
                      },
                    });
                  }}
                  disabled={!quickLogSummary.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Interaction
                </button>
                <button
                  onClick={() => setShowQuickLog(false)}
                  className="px-3 py-2 rounded-lg border border-border/50 text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile floating Stakeholder Map button (Deal pages only, above QuickCapture FAB) ── */}
      <button
        onClick={() => setMapSheetOpen(true)}
        className="md:hidden fixed bottom-[136px] right-4 z-50 w-12 h-12 rounded-full bg-card border border-border/60 text-foreground shadow-lg flex items-center justify-center hover:bg-muted active:scale-95 transition-all"
        aria-label="Open Stakeholder Map"
      >
        <Users className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── Mobile Stakeholder Map Bottom Sheet ─────────────────────────────────────

interface MobileMapSheetProps {
  open: boolean;
  onClose: () => void;
  deal: any;
  hoveredStakeholderId: number | null;
  onStakeholderClick: (s: any) => void;
  onStakeholdersChange: () => void;
  onBuyingStagesChange: (stages: any) => void;
}

function MobileMapSheet({
  open,
  onClose,
  deal,
  hoveredStakeholderId,
  onStakeholderClick,
  onStakeholdersChange,
  onBuyingStagesChange,
}: MobileMapSheetProps) {
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const dragStartY = React.useRef<number | null>(null);
  const dragCurrentY = React.useRef<number>(0);
  const [dragOffset, setDragOffset] = React.useState(0);

  // Lock body scroll when sheet is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Touch drag to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = 0;
    setDragOffset(0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    if (dy > 0) {
      dragCurrentY.current = dy;
      setDragOffset(dy);
    }
  };
  const handleTouchEnd = () => {
    if (dragCurrentY.current > 80) {
      onClose();
    }
    dragStartY.current = null;
    setDragOffset(0);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-background"
      style={{
        transform: `translateY(${dragOffset}px)`,
        transition: dragOffset === 0 ? 'transform 0.3s cubic-bezier(0.32,0.72,0,1)' : 'none',
      }}
    >
      {/* Header bar — drag handle + title + close */}
      <div
        ref={sheetRef}
        className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/30 bg-background/95 backdrop-blur-sm"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle centered above */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-muted-foreground/30" />
        <span className="text-sm font-semibold text-foreground mt-1">Stakeholder Map</span>
        <button
          onClick={onClose}
          className="mt-1 w-7 h-7 rounded-full flex items-center justify-center bg-muted/60 hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Full-screen map canvas */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <StakeholderMap
          key={`mobile-sheet-${deal.id}-mobile`}
          deal={deal}
          highlightedStakeholderId={hoveredStakeholderId}
          onStakeholderClick={onStakeholderClick}
          onStakeholdersChange={onStakeholdersChange}
          onBuyingStagesChange={onBuyingStagesChange}
          initialZoom={0.9}
          isMobile={true}
        />
      </div>
    </div>
  );
}
