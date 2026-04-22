import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRoute, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { formatCurrency, getConfidenceColor, getConfidenceBg, getRoleColor, getSentimentColor, formatDate, getStageColor, getStageName } from '@/lib/data';
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
import { DecisionMap, DIMENSION_CONFIG } from '@/components/DecisionMap';
import { DimensionDetailPanel } from '@/components/DimensionDetailPanel';
import { StakeholderSidebar } from '@/components/StakeholderSidebar';
import { DealChatPanel } from '@/components/DealChatPanel';
import { ActionCenter } from '@/components/ActionCenter';
import { BattleMapGraph, TimelinePanel } from '@/components/battlemap';
import { NeedEditDialog } from '@/components/battlemap/NeedEditDialog';
import { DIMENSION_CONFIG as DIM_META } from '@/components/DecisionMap';
import DealTimeline from '@/components/DealTimeline';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Globe, Clock, TrendingUp, TrendingDown, AlertTriangle,
  ChevronRight, User, MessageSquare, FileText, Map, BarChart3, X, ExternalLink,
  Mic, Check, Edit2, Save, Camera, GripHorizontal, ChevronDown, ChevronUp,
  Plus, Trash2, Pencil, Calendar, Lightbulb, Lock, Target, Sparkles, Heart, StickyNote, UserCircle, Activity, Users, Loader2, Wand2, Swords
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
import { cn } from '@/lib/utils';
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
  title: string | null;
  category: 'pricing' | 'relationship' | 'competitive' | 'internal' | 'other';
  content: string;
  date: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function getStrategyCategories(isZh: boolean): { value: StrategyNote['category']; label: string; color: string }[] {
  return [
    { value: 'pricing',       label: isZh ? '价格策略' : 'Pricing Flexibility', color: 'text-emerald-400' },
    { value: 'relationship',  label: isZh ? '关系策略' : 'Relationship Strategy', color: 'text-blue-400' },
    { value: 'competitive',   label: isZh ? '竞争情报' : 'Competitive Intel', color: 'text-amber-400' },
    { value: 'internal',      label: isZh ? '内部对齐' : 'Internal Alignment', color: 'text-purple-400' },
    { value: 'other',         label: isZh ? '其他' : 'Other', color: 'text-muted-foreground' },
  ];
}

function getSentimentConfig(isZh: boolean): Record<SentimentType, { label: string; dot: string; bg: string; text: string; border: string }> {
  return {
    Positive: { label: isZh ? '支持' : 'Positive', dot: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    Neutral:  { label: isZh ? '中立' : 'Neutral',  dot: '#f59e0b', bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30'  },
    Negative: { label: isZh ? '反对' : 'Negative', dot: '#ef4444', bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/30'    },
  };
}

const roleConfig: Record<RoleType, { bg: string; text: string; border: string }> = {
  'Champion':       { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/30'    },
  'Decision Maker': { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/30'  },
  'Influencer':     { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/30'    },
  'Blocker':        { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/30'     },
  'User':           { bg: 'bg-green-500/10',   text: 'text-green-400',   border: 'border-green-500/30'   },
  'Evaluator':      { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/30'  },
};

const ROLE_ZH: Record<string, string> = {
  'Champion': '内部支持者',
  'Decision Maker': '决策者',
  'Influencer': '影响者',
  'Blocker': '阻碍者',
  'User': '终端用户',
  'Evaluator': '评估者',
};
function translateRole(role: string, isZh: boolean): string {
  return isZh ? (ROLE_ZH[role] || role) : role;
}

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
  const STRATEGY_CATEGORIES = getStrategyCategories(isZh);
  const sentimentConfig = getSentimentConfig(isZh);

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
  const { data: dimensionsData = [] } = trpc.dimensions.listByDeal.useQuery(
    { dealId },
    { enabled: dealId > 0, refetchOnWindowFocus: false }
  );
  const { data: stakeholderNeedsData = [] } = trpc.stakeholderNeeds.listByDeal.useQuery(
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
  const updateDimensionMutation = trpc.dimensions.update.useMutation({
    onSuccess: () => utils.dimensions.listByDeal.invalidate({ dealId }),
  });
  const generateMapMutation = trpc.dimensions.generateMap.useMutation({
    onSuccess: () => {
      utils.dimensions.listByDeal.invalidate({ dealId });
      utils.nextActions.listByDeal.invalidate({ dealId });
      setIsGeneratingMap(false);
      toast.success(isZh ? 'Decision Map 已更新' : 'Decision Map updated');
    },
    onError: (err) => {
      setIsGeneratingMap(false);
      toast.error(isZh ? 'AI 分析失败，请重试' : 'AI analysis failed, please retry');
    },
  });
  const generateNeedsMutation = trpc.stakeholderNeeds.aiGenerate.useMutation({
    onSuccess: (data) => {
      utils.stakeholderNeeds.listByDeal.invalidate({ dealId });
      if (data.success) {
        toast.success(isZh ? `已生成 ${data.needsCreated} 个需求分析` : `Generated ${data.needsCreated} needs`);
      } else {
        toast.error((data as any).error || (isZh ? '分析失败' : 'Analysis failed'));
      }
      setIsGeneratingNeeds(false);
    },
    onError: () => {
      toast.error(isZh ? '需求分析失败，请重试' : 'Needs analysis failed, please retry');
      setIsGeneratingNeeds(false);
    },
  });
  const updateNeedStatusMutation = trpc.stakeholderNeeds.update.useMutation({
    onSuccess: () => utils.stakeholderNeeds.listByDeal.invalidate({ dealId }),
  });
  const createNeedMutation = trpc.stakeholderNeeds.create.useMutation({
    onSuccess: () => utils.stakeholderNeeds.listByDeal.invalidate({ dealId }),
  });
  const deleteNeedMutation = trpc.stakeholderNeeds.delete.useMutation({
    onSuccess: () => {
      utils.stakeholderNeeds.listByDeal.invalidate({ dealId });
      toast.success(isZh ? '需求已删除' : 'Need deleted');
    },
  });
  const deepDiveMutation = trpc.dimensions.deepDive.useMutation({
    onSuccess: (data) => {
      utils.dimensions.listByDeal.invalidate({ dealId });
      utils.nextActions.listByDeal.invalidate({ dealId });
      if (data.success) {
        toast.success(isZh ? 'AI 深入分析完成' : 'AI deep-dive complete');
      } else {
        toast.error((data as any).error || (isZh ? '分析失败' : 'Analysis failed'));
      }
    },
    onError: () => {
      toast.error(isZh ? 'AI 深入分析失败，请重试' : 'AI deep-dive failed, please retry');
    },
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
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [isGeneratingNeeds, setIsGeneratingNeeds] = useState(false);
  const [centerView, setCenterView] = useState<'battle' | 'actions'>('battle');
  const [editingNeed, setEditingNeed] = useState<{ id: number; title: string; description?: string | null; needType: string; status: string } | null>(null);
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
  const [editingStrategyDraft, setEditingStrategyDraft] = useState<{ category: StrategyNote['category']; content: string; title: string; date: string } | null>(null);

  const addStrategyNote = () => {
    const today = new Date().toISOString().split('T')[0];
    createStrategyNoteMutation.mutate({ dealId, category: 'internal', content: '', title: '', date: today }, {
      onSuccess: (created) => {
        setEditingStrategyId(created.id);
        setEditingStrategyDraft({ category: created.category as StrategyNote['category'], content: created.content, title: created.title ?? '', date: created.date ? new Date(created.date).toISOString().split('T')[0] : today });
      },
    });
  };

  const saveStrategyNote = (id: number) => {
    if (editingStrategyDraft) {
      updateStrategyNoteMutation.mutate({ id, category: editingStrategyDraft.category, content: editingStrategyDraft.content, title: editingStrategyDraft.title, date: editingStrategyDraft.date });
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
              <Badge variant="outline" className={`text-[10px] shrink-0 ${getStageColor(deal.stage)}`}>{getStageName(deal.stage, isZh)}</Badge>
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
              <Badge variant="outline" className={`text-[10px] ${getStageColor(deal.stage)}`}>{getStageName(deal.stage, isZh)}</Badge>
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
                  <span className="hidden sm:inline">{isZh ? '决策地图' : 'Decision Map'}</span>
                  <span className="sm:hidden">{isZh ? '地图' : 'Map'}</span>
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

                {/* ── Left Column: Decision Map (compact) + Stakeholders ── */}
                <div className="hidden md:flex flex-col w-[280px] shrink-0 border-r border-border/30 bg-card/30">
                  {/* Compact Decision Map */}
                  <div className="p-3 border-b border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-foreground">
                        {isZh ? '决策地图' : 'Decision Map'}
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isGeneratingMap}
                        onClick={() => {
                          setIsGeneratingMap(true);
                          generateMapMutation.mutate({ dealId, language: isZh ? 'zh' : 'en' });
                        }}
                        className="h-6 gap-1 text-[10px] px-2"
                      >
                        {isGeneratingMap ? (
                          <><Loader2 size={10} className="animate-spin" />{isZh ? '分析中' : 'Analyzing'}</>
                        ) : (
                          <><Wand2 size={10} />{isZh ? 'AI 分析' : 'AI'}</>
                        )}
                      </Button>
                    </div>
                    <DecisionMap
                      companyName={deal.company}
                      companyLogo={deal.logo}
                      dimensions={dimensionsData.length > 0 ? dimensionsData : [
                        { id: 1, dimensionKey: 'tech_validation', status: 'not_started' as const, aiSummary: null, notes: null },
                        { id: 2, dimensionKey: 'commercial_breakthrough', status: 'not_started' as const, aiSummary: null, notes: null },
                        { id: 3, dimensionKey: 'executive_engagement', status: 'not_started' as const, aiSummary: null, notes: null },
                        { id: 4, dimensionKey: 'competitive_defense', status: 'not_started' as const, aiSummary: null, notes: null },
                        { id: 5, dimensionKey: 'budget_advancement', status: 'not_started' as const, aiSummary: null, notes: null },
                        { id: 6, dimensionKey: 'case_support', status: 'not_started' as const, aiSummary: null, notes: null },
                      ]}
                      actions={actionsData.map((a: any) => ({
                        id: a.id,
                        text: a.text,
                        status: a.status || (a.completed ? 'done' : 'pending'),
                        dimensionKey: a.dimensionKey || null,
                        priority: a.priority,
                      }))}
                      onDimensionClick={(key) => {
                        setSelectedDimension(prev => prev === key ? null : key);
                        // Scroll to dimension in ActionCenter
                        const el = document.getElementById(`dim-${key}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      selectedDimension={selectedDimension}
                    />
                  </div>
                  {/* Stakeholders */}
                  <StakeholderSidebar
                    stakeholders={localStakeholders.map((s: any) => ({
                      id: s.id,
                      name: s.name,
                      title: s.title,
                      role: s.role,
                      sentiment: s.sentiment,
                      engagement: s.engagement,
                      avatar: s.avatar,
                    }))}
                    aiInsights={[]}
                    onStakeholderClick={(id) => {
                      const s = deal.stakeholders.find((st: any) => st.id === id);
                      if (s) handleStakeholderClick(s as Stakeholder);
                    }}
                    className="flex-1 min-h-0"
                  />
                </div>

                {/* ── Center: Battle Map / Action Center (toggle view) ── */}
                <div className="flex-1 overflow-auto min-w-0 flex flex-col">
                  {/* View toggle */}
                  <div className="flex items-center gap-1 px-4 pt-3 pb-1 flex-shrink-0">
                    <button
                      className={cn(
                        'flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-colors',
                        centerView === 'battle'
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                      onClick={() => setCenterView('battle')}
                    >
                      <Swords size={12} />
                      {isZh ? '战役态势' : 'Battle Map'}
                    </button>
                    <button
                      className={cn(
                        'flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-colors',
                        centerView === 'actions'
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                      onClick={() => setCenterView('actions')}
                    >
                      <Target size={12} />
                      {isZh ? '渗透路径' : 'Action Plan'}
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 flex flex-col p-4 md:p-5 pt-2">
                    {centerView === 'battle' ? (
                      <>
                        <div className="flex-1 min-h-0" style={{ minHeight: 420 }}>
                          <BattleMapGraph
                            stakeholders={(stakeholdersData || []).map((s: any) => ({
                              id: s.id,
                              name: s.name,
                              title: s.title || '',
                              role: s.role,
                              sentiment: s.sentiment,
                              avatarUrl: s.avatar || null,
                            }))}
                            needs={stakeholderNeedsData.map((n: any) => ({
                              id: n.id,
                              stakeholderId: n.stakeholderId,
                              needType: n.needType,
                              title: n.title,
                              description: n.description,
                              status: n.status,
                              dimensionKey: n.dimensionKey,
                            }))}
                            actions={actionsData.map((a: any) => ({
                              id: a.id,
                              action: a.text,
                              isDone: a.status === 'done' || a.completed === true,
                              stakeholderId: a.stakeholderId || null,
                              needId: a.needId || null,
                              dimensionKey: a.dimensionKey || null,
                            }))}
                            dimensions={Object.entries(DIM_META).map(([key, meta]) => {
                              const dim = dimensionsData.find((d: any) => d.dimensionKey === key);
                              return {
                                dimensionKey: key,
                                label: isZh ? meta.label : meta.labelEn,
                                score: dim ? (['completed', 'in_progress', 'not_started', 'blocked'].indexOf(dim.status) === 0 ? 100 : dim.status === 'in_progress' ? 60 : dim.status === 'blocked' ? 20 : 0) : 0,
                                weight: (dim as any)?.weight ?? 1,
                              };
                            })}
                            isZh={isZh}
                            onNeedStatusCycle={(needId: number) => {
                              const need = stakeholderNeedsData.find((n: any) => n.id === needId);
                              if (!need) return;
                              const cycle = ['unmet', 'in_progress', 'satisfied', 'blocked'];
                              const idx = cycle.indexOf(need.status);
                              const next = cycle[(idx + 1) % cycle.length];
                              updateNeedStatusMutation.mutate({ id: needId, status: next as 'unmet' | 'in_progress' | 'satisfied' | 'blocked' });
                            }}
                            onNeedEdit={(needId: number) => {
                              const need = stakeholderNeedsData.find((n: any) => n.id === needId);
                              if (need) setEditingNeed({ id: need.id, title: need.title, description: need.description, needType: need.needType, status: need.status });
                            }}
                            onNeedDelete={(needId: number) => {
                              deleteNeedMutation.mutate({ id: needId });
                            }}
                            onStakeholderClick={(id: number) => {
                              const s = (stakeholdersData || []).find((st: any) => st.id === id);
                              if (s) handleStakeholderClick(s as Stakeholder);
                            }}
                            onAiGenerate={() => {
                              setIsGeneratingNeeds(true);
                              generateNeedsMutation.mutate({
                                dealId,
                                language: language as 'zh' | 'en',
                                regenerate: stakeholderNeedsData.length > 0,
                              });
                            }}
                            isGenerating={isGeneratingNeeds}
                          />
                        </div>
                        {/* Bottom Timeline */}
                        <TimelinePanel
                          stakeholders={(stakeholdersData || []).map((s: any) => ({
                            id: s.id,
                            name: s.name,
                            title: s.title || '',
                            role: s.role,
                            sentiment: s.sentiment,
                          }))}
                          actions={actionsData.map((a: any) => ({
                            id: a.id,
                            action: a.text,
                            isDone: a.status === 'done' || a.completed === true,
                            stakeholderId: a.stakeholderId || null,
                            dimensionKey: a.dimensionKey || null,
                            phase: null,
                            priority: a.priority || null,
                            createdAt: a.createdAt ? String(a.createdAt) : null,
                          }))}
                          isZh={isZh}
                        />
                      </>
                    ) : (
                      <ActionCenter
                        dimensions={dimensionsData.length > 0 ? dimensionsData : [
                          { id: 1, dimensionKey: 'tech_validation', status: 'not_started' as const, aiSummary: null },
                          { id: 2, dimensionKey: 'commercial_breakthrough', status: 'not_started' as const, aiSummary: null },
                          { id: 3, dimensionKey: 'executive_engagement', status: 'not_started' as const, aiSummary: null },
                          { id: 4, dimensionKey: 'competitive_defense', status: 'not_started' as const, aiSummary: null },
                          { id: 5, dimensionKey: 'budget_advancement', status: 'not_started' as const, aiSummary: null },
                          { id: 6, dimensionKey: 'case_support', status: 'not_started' as const, aiSummary: null },
                        ]}
                        actions={actionsData.map((a: any) => ({
                          id: a.id,
                          text: a.text,
                          status: a.status || (a.completed ? 'done' : 'pending'),
                          dimensionKey: a.dimensionKey || null,
                          priority: a.priority,
                        }))}
                        selectedDimension={selectedDimension}
                        onDimensionSelect={(key) => setSelectedDimension(key)}
                        onActionToggle={(actionId, newStatus) => {
                          updateActionStatusMutation.mutate({ id: actionId, status: newStatus as 'pending' | 'done' | 'in_progress' | 'blocked' | 'accepted' | 'rejected' | 'later' });
                        }}
                        onAddAction={(dimKey) => {
                          const text = prompt(isZh ? '输入新的行动项：' : 'Enter new action item:');
                          if (text) {
                            createActionMutation.mutate({ dealId, text, priority: 'medium', dimensionKey: dimKey });
                          }
                        }}
                        onAiDeepDive={async (dimKey) => {
                          await deepDiveMutation.mutateAsync({ dealId, dimensionKey: dimKey, language: language as 'zh' | 'en' });
                        }}
                        className="h-full"
                      />
                    )}
                  </div>
                </div>

                {/* ── Right: AI Chat Panel ── */}
                <div className="hidden lg:flex flex-col w-[320px] shrink-0 border-l border-border/30">
                  <DealChatPanel dealId={dealId} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="flex-1 m-0 overflow-auto">
              <DealTimeline
                snapshots={deal.snapshots}
                meetings={localInteractions}
                strategyNotes={strategyNotes}
                companyInfo={deal.companyInfo}
                companyName={deal.company}
                onCreateMeeting={(data) => {
                  createMeetingMutation.mutate({
                    dealId,
                    date: data.date,
                    type: data.type,
                    keyParticipant: data.keyParticipant || '',
                    summary: data.summary || '',
                    duration: data.duration || 30,
                  });
                }}
                onEditMeeting={(id) => setEditingInteractionId(id)}
                onDeleteMeeting={deleteInteraction}
                onSwitchToStrategy={() => setActiveTab('strategy')}
              />
            </TabsContent>


            {/* ── Deal Strategy Tab ── */}
            <TabsContent value="strategy" className="flex-1 m-0 overflow-auto">
              <div className="p-6 max-w-3xl">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-display text-sm font-semibold">{isZh ? '交易策略' : 'Deal Strategy'}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 max-w-sm leading-relaxed">
                      {isZh ? '本交易的内部策略笔记 — 价格空间、关系策略、竞争情报和内部对齐。这些笔记将作为 AI 分析建议的输入。' : 'Internal strategy notes for this deal \u2014 pricing flexibility, relationship plays, competitive intel, and internal alignment. These notes inform the AI agent\'s recommendations.'}
                    </p>
                  </div>
                  <button
                    onClick={addStrategyNote}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0"
                  >
                    <Plus className="w-3 h-3" /> {isZh ? '添加笔记' : 'Add Note'}
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
                              {/* Title */}
                              <input
                                type="text"
                                value={editingStrategyDraft?.title ?? ''}
                                onChange={e => setEditingStrategyDraft(prev => ({ ...(prev ?? { category: note.category, content: note.content, title: '', date: '' }), title: e.target.value }))}
                                placeholder={isZh ? '策略笔记标题（如：内部价格策略讨论）' : 'Strategy note title (e.g., Internal pricing strategy discussion)'}
                                className="w-full text-sm font-medium bg-background border border-border/50 rounded-md px-2.5 py-1.5 text-foreground"
                                autoFocus
                              />
                              {/* Category + Date row */}
                              <div className="flex items-center gap-2">
                                <select
                                  value={draftCat}
                                  onChange={e => setEditingStrategyDraft(prev => ({ ...(prev ?? { category: note.category, content: note.content, title: note.title ?? '', date: note.date ? new Date(note.date).toISOString().split('T')[0] : '' }), category: e.target.value as StrategyNote['category'] }))}
                                  className="flex-1 text-xs bg-background border border-border/50 rounded-md px-2.5 py-1.5 text-foreground"
                                >
                                  {STRATEGY_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                  ))}
                                </select>
                                <input
                                  type="date"
                                  value={editingStrategyDraft?.date ?? ''}
                                  onChange={e => setEditingStrategyDraft(prev => ({ ...(prev ?? { category: note.category, content: note.content, title: '', date: '' }), date: e.target.value }))}
                                  className="text-xs bg-background border border-border/50 rounded-md px-2.5 py-1.5 text-foreground"
                                />
                              </div>
                              <textarea
                                value={draftContent}
                                onChange={e => setEditingStrategyDraft(prev => ({ ...(prev ?? { category: note.category, content: note.content, title: note.title ?? '', date: note.date ? new Date(note.date).toISOString().split('T')[0] : '' }), content: e.target.value }))}
                                placeholder={isZh ? '描述此交易的内部策略、背景或约束条件...' : 'Describe the internal strategy, context, or constraints for this deal...'}
                                rows={5}
                                className="w-full text-xs bg-background border border-border/50 rounded-md px-2.5 py-2 text-foreground resize-y leading-relaxed"
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
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] font-semibold ${catConfig.color}`}>{catConfig.label}</span>
                                  {note.date ? (
                                    <span className="text-[10px] text-muted-foreground/50">· {new Date(note.date).toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground/50">· {formatDate(String(note.updatedAt))}</span>
                                  )}
                                  <div className="ml-auto">
                                    <button
                                      onClick={() => { setEditingStrategyId(note.id); setEditingStrategyDraft({ category: note.category, content: note.content, title: note.title ?? '', date: note.date ? new Date(note.date).toISOString().split('T')[0] : '' }); }}
                                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors"
                                    >
                                      <Pencil className="w-3 h-3 text-muted-foreground/50" />
                                    </button>
                                  </div>
                                </div>
                                {note.title && (
                                  <p className="text-xs font-medium text-foreground mb-1">{note.title}</p>
                                )}
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
                      <p className="text-sm font-medium">{isZh ? '暂无策略笔记' : 'No strategy notes yet'}</p>
                      <p className="text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                        {isZh ? '添加内部上下文，如价格空间、战略优先级或关系策略 — AI 将利用这些信息定制建议。' : 'Add internal context like pricing flexibility, strategic priority, or relationship plays \u2014 the AI agent will use these to tailor its recommendations.'}
                      </p>
                      <button
                        onClick={addStrategyNote}
                        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors mx-auto"
                      >
                        <Plus className="w-3 h-3" /> {isZh ? '添加第一条策略笔记' : 'Add First Strategy Note'}
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
                          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{isZh ? '人物信息' : 'Who They Are'}</div>
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20">
                            <StakeholderAvatar name={s.name} avatarUrl={s.avatar} size="md" />
                            <div>
                              <div className="text-sm font-semibold">{s.name}</div>
                              <div className="text-xs text-muted-foreground">{s.title} · {deal.company}</div>
                              <div className="flex gap-1 mt-1">
                                {roles.map(r => <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">{translateRole(r, isZh)}</span>)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Business context */}
                        {s.keyInsights && (
                          <div>
                            <div className="text-[9px] font-semibold text-status-info uppercase tracking-wider mb-1.5">{isZh ? '业务背景' : 'Business Context'}</div>
                            <p className="text-xs text-foreground/80 leading-relaxed bg-muted/15 rounded-lg p-3">{s.keyInsights}</p>
                          </div>
                        )}

                        {/* Relationship status */}
                        <div>
                          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{isZh ? '关系状态' : 'Relationship Status'}</div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              s.sentiment === 'Positive' ? 'bg-emerald-500/15 text-emerald-400' :
                              s.sentiment === 'Negative' ? 'bg-red-500/15 text-red-400' :
                              'bg-amber-500/15 text-amber-400'
                            }`}>{isZh ? (s.sentiment === 'Positive' ? '支持' : s.sentiment === 'Negative' ? '反对' : '中立') : s.sentiment}</span>
                            <span className="text-muted-foreground">{isZh ? (s.engagement === 'High' ? '高参与度' : s.engagement === 'Medium' ? '中参与度' : '低参与度') : `${s.engagement} Engagement`}</span>
                            {lastMeeting && <span className="text-muted-foreground">{isZh ? '上次会面：' : 'Last met: '}{formatDate(typeof lastMeeting.date === 'string' ? lastMeeting.date : new Date(lastMeeting.date).toISOString())}</span>}
                          </div>
                          {lastMeeting && (
                            <p className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">
                              <span className="font-medium text-muted-foreground">{isZh ? '上次互动：' : 'Last interaction:'}</span> {lastMeeting.summary}
                            </p>
                          )}
                        </div>

                        {/* Personal talking points */}
                        {(signals.length > 0 || notes) && (
                          <div>
                            <div className="text-[9px] font-semibold text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <Heart className="w-2.5 h-2.5" />
                              {isZh ? '个人话题要点' : 'Personal Talking Points'}
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
                            <div className="text-[9px] font-semibold text-primary uppercase tracking-wider mb-1.5">{isZh ? '待办事项' : 'Open Actions'}</div>
                            <div className="space-y-1">
                              {pendingActions.map(a => (
                                <div key={a.id} className="flex items-start gap-2 text-[11px] text-foreground/80">
                                  <span className={`mt-0.5 w-3 h-3 rounded border shrink-0 ${
                                    a.priority === 'high' ? 'border-status-danger/60' : 'border-border/60'
                                  }`} />
                                  <span className="leading-snug">{a.text}</span>
                                  {a.dueDate && <span className="text-[9px] text-muted-foreground/60 shrink-0">{isZh ? '截止 ' : 'Due '}{new Date(a.dueDate).toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Deal context */}
                        <div className="border-t border-border/30 pt-3">
                          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{isZh ? '交易背景' : 'Deal Context'}</div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-muted/20 rounded-lg p-2">
                              <div className="text-[9px] text-muted-foreground mb-0.5">{isZh ? '阶段' : 'Stage'}</div>
                              <div className="text-[11px] font-medium">{getStageName(deal.stage, isZh)}</div>
                            </div>
                            <div className="bg-muted/20 rounded-lg p-2">
                              <div className="text-[9px] text-muted-foreground mb-0.5">{isZh ? '健康度' : 'Health'}</div>
                              <div className={`text-[11px] font-semibold font-mono ${getConfidenceColor(deal.confidenceScore)}`}>{deal.confidenceScore}%</div>
                            </div>
                            <div className="bg-muted/20 rounded-lg p-2">
                              <div className="text-[9px] text-muted-foreground mb-0.5">ACV</div>
                              <div className="text-[11px] font-semibold font-mono">{formatCurrency(deal.value)}</div>
                            </div>
                          </div>
                          {latestSnapshot && (
                            <p className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">
                              <span className="font-medium text-muted-foreground">{isZh ? '当前情况：' : 'Situation:'}</span> {latestSnapshot.whatsHappening}
                            </p>
                          )}
                        </div>

                        {/* AI Brief section */}
                        <div className="border-t border-border/30 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              {isZh ? 'AI 生成简报' : 'AI-Generated Brief'}
                            </div>
                            <button
                              onClick={() => handleGenerateAIBrief(s)}
                              disabled={aiBriefLoading}
                              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
                            >
                              {aiBriefLoading ? (
                                <><div className="w-2.5 h-2.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />{isZh ? '生成中...' : 'Generating...'}</>
                              ) : (
                                <><Sparkles className="w-2.5 h-2.5" />{aiBriefText ? (isZh ? '重新生成' : 'Regenerate') : (isZh ? '生成简报' : 'Generate Brief')}</>
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
                              {isZh ? `正在为 ${s.name} 生成简报...` : `Generating brief for ${s.name}...`}
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground/60 italic">
                              {isZh ? `点击「生成简报」，基于 ${s.name} 的所有上下文生成 AI 叙事简报。` : `Click "Generate Brief" to get an AI-crafted narrative brief based on all available context for ${s.name}.`}
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
                      {isZh ? '决策立场' : 'Decision Stance'}
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
                      {isZh ? '角色' : 'Role'} {isEditingProfile && <span className="text-muted-foreground/60 normal-case font-normal">{isZh ? '(可多选)' : '(select all that apply)'}</span>}
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
                              {translateRole(role, isZh)}
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
                                {translateRole(role, isZh)}
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
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{isZh ? '参与度' : 'Engagement'}</div>
                      <Badge variant="outline" className="text-[10px]">
                        {isZh ? ({'High': '高', 'Medium': '中', 'Low': '低'}[selectedStakeholder.engagement] || selectedStakeholder.engagement) + '参与度' : selectedStakeholder.engagement + ' Engagement'}
                      </Badge>
                    </div>
                  )}

                  {/* Key Insights */}
                  {selectedStakeholder.keyInsights && !isEditingProfile && (
                    <div className="mb-4">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{isZh ? '关键洞察' : 'Key Insights'}</div>
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
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{isZh ? '了解你的利益相关方' : 'Know Your Stakeholder'}</span>
                        </div>

                        {/* AI-extracted signals */}
                        {signals.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center gap-1 mb-1.5">
                              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                              <span className="text-[9px] font-medium text-amber-400/80 uppercase tracking-wider">{isZh ? 'AI 信号' : 'AI Signals'}</span>
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
                                    title={isZh ? '删除信号' : 'Remove signal'}
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
                              <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">{isZh ? '个人笔记' : 'Personal Notes'}</span>
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
                                {notes ? (isZh ? '编辑' : 'Edit') : (isZh ? '添加' : 'Add')}
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
                                  {isZh ? '保存' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setEditingPersonalNotes(false)}
                                  className="text-[9px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                >
                                  {isZh ? '取消' : 'Cancel'}
                                </button>
                              </div>
                            )}
                          </div>
                          {editingPersonalNotes ? (
                            <textarea
                              value={personalNotesDraft}
                              onChange={e => setPersonalNotesDraft(e.target.value)}
                              placeholder={isZh ? '添加个人背景信息 — 爱好、家庭情况、沟通风格、下次会议前需要记住的事项...' : 'Add personal context \u2014 hobbies, family mentions, communication style, things to remember before your next meeting...'}
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
                              {isZh ? `+ 添加关于${selectedStakeholder.name}的个人笔记...` : `+ Add personal notes about ${selectedStakeholder.name.split(' ')[0]}...`}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Contact */}
                  {selectedStakeholder.email && !isEditingProfile && (
                    <div className="mb-4">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{isZh ? '联系方式' : 'Contact'}</div>
                      <p className="text-xs text-primary">{selectedStakeholder.email}</p>
                    </div>
                  )}

                  {/* Related Interactions */}
                  {!isEditingProfile && (
                    <div className="border-t border-border/30 pt-3">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{isZh ? '相关互动' : 'Related Interactions'}</div>
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
                    <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{isZh ? '人物信息' : 'Who They Are'}</div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20">
                      <StakeholderAvatar name={s.name} avatarUrl={s.avatar} size="md" />
                      <div>
                        <div className="text-sm font-semibold">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.title} · {deal.company}</div>
                        <div className="flex gap-1 mt-1">
                          {roles.map(r => <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">{translateRole(r, isZh)}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business context */}
                  {s.keyInsights && (
                    <div>
                      <div className="text-[9px] font-semibold text-status-info uppercase tracking-wider mb-1.5">{isZh ? '业务背景' : 'Business Context'}</div>
                      <p className="text-xs text-foreground/80 leading-relaxed bg-muted/15 rounded-lg p-3">{s.keyInsights}</p>
                    </div>
                  )}

                  {/* Relationship status */}
                  <div>
                    <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{isZh ? '关系状态' : 'Relationship Status'}</div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        s.sentiment === 'Positive' ? 'bg-emerald-500/15 text-emerald-400' :
                        s.sentiment === 'Negative' ? 'bg-red-500/15 text-red-400' :
                        'bg-amber-500/15 text-amber-400'
                      }`}>{isZh ? ({'Positive': '支持', 'Neutral': '中立', 'Negative': '反对'}[s.sentiment] || s.sentiment) : s.sentiment}</span>
                      <span className="text-muted-foreground">{isZh ? ({'High': '高', 'Medium': '中', 'Low': '低'}[s.engagement] || s.engagement) + '参与度' : s.engagement + ' Engagement'}</span>
                      {lastMeeting && <span className="text-muted-foreground">{isZh ? '最近会面：' : 'Last met: '}{formatDate(typeof lastMeeting.date === 'string' ? lastMeeting.date : new Date(lastMeeting.date).toISOString())}</span>}
                    </div>
                    {lastMeeting && (
                      <p className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">
                        <span className="font-medium text-muted-foreground">{isZh ? '上次互动：' : 'Last interaction:'}</span> {lastMeeting.summary}
                      </p>
                    )}
                  </div>

                  {/* Personal talking points */}
                  {(signals.length > 0 || notes) && (
                    <div>
                      <div className="text-[9px] font-semibold text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5" />
                        {isZh ? '个人话题要点' : 'Personal Talking Points'}
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
                      <div className="text-[9px] font-semibold text-primary uppercase tracking-wider mb-1.5">{isZh ? '待办事项' : 'Open Actions'}</div>
                      <div className="space-y-1">
                        {pendingActions.map(a => (
                          <div key={a.id} className="flex items-start gap-2 text-[11px] text-foreground/80">
                            <span className={`mt-0.5 w-3 h-3 rounded border shrink-0 ${
                              a.priority === 'high' ? 'border-status-danger/60' : 'border-border/60'
                            }`} />
                            <span className="leading-snug">{a.text}</span>
                            {a.dueDate && <span className="text-[9px] text-muted-foreground/60 shrink-0">{isZh ? '截止 ' : 'Due '}{new Date(a.dueDate).toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deal context */}
                  <div className="border-t border-border/30 pt-3">
                    <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{isZh ? '交易背景' : 'Deal Context'}</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted/20 rounded-lg p-2">
                        <div className="text-[9px] text-muted-foreground mb-0.5">{isZh ? '阶段' : 'Stage'}</div>
                        <div className="text-[11px] font-medium">{getStageName(deal.stage, isZh)}</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-2">
                        <div className="text-[9px] text-muted-foreground mb-0.5">{isZh ? '健康度' : 'Confidence'}</div>
                        <div className={`text-[11px] font-semibold font-mono ${getConfidenceColor(deal.confidenceScore)}`}>{deal.confidenceScore}%</div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-2">
                        <div className="text-[9px] text-muted-foreground mb-0.5">{isZh ? '年合同额' : 'ACV'}</div>
                        <div className="text-[11px] font-semibold font-mono">{formatCurrency(deal.value)}</div>
                      </div>
                    </div>
                    {latestSnapshot && (
                      <p className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">
                        <span className="font-medium text-muted-foreground">{isZh ? '当前情况：' : 'Situation:'}</span> {latestSnapshot.whatsHappening}
                      </p>
                    )}
                  </div>

                  {/* AI Brief section */}
                  <div className="border-t border-border/30 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        {isZh ? 'AI 生成简报' : 'AI-Generated Brief'}
                      </div>
                      <button
                        onClick={() => handleGenerateAIBrief(s)}
                        disabled={aiBriefLoading}
                        className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
                      >
                        {aiBriefLoading ? (
                          <><div className="w-2.5 h-2.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />{isZh ? '生成中...' : 'Generating...'}</>
                        ) : (
                          <><Sparkles className="w-2.5 h-2.5" />{aiBriefText ? (isZh ? '重新生成' : 'Regenerate') : (isZh ? '生成简报' : 'Generate Brief')}</>
                        )}
                      </button>
                    </div>
                    {aiBriefText ? (
                      <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3">
                        <pre className="text-[11px] text-foreground/85 leading-relaxed whitespace-pre-wrap font-body">{aiBriefText}</pre>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/60 italic">
                        {isZh ? `点击“生成简报”获取基于${s.name}所有可用上下文的 AI 叙述性简报。` : `Click "Generate Brief" to get an AI-crafted narrative brief based on all available context for ${s.name}.`}
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
      {/* ── Meeting Edit Modal ── */}
      {editingInteractionId !== null && (() => {
        const meeting = localInteractions.find(m => m.id === editingInteractionId);
        if (!meeting) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingInteractionId(null)}>
            <div className="bg-card border border-border rounded-xl shadow-2xl w-[520px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <h3 className="text-sm font-semibold">{isZh ? '编辑记录' : 'Edit Meeting'}</h3>
                <button onClick={() => setEditingInteractionId(null)} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{isZh ? '类型' : 'Type'}</label>
                  <select
                    value={meeting.type}
                    onChange={e => updateInteraction(meeting.id, { type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    {INTERACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{isZh ? '日期' : 'Date'}</label>
                  <input
                    type="date"
                    value={typeof meeting.date === 'string' ? meeting.date.slice(0, 10) : new Date(meeting.date).toISOString().slice(0, 10)}
                    onChange={e => updateInteraction(meeting.id, { date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{isZh ? '关键参与人' : 'Key Participant'}</label>
                  <input
                    type="text"
                    value={meeting.keyParticipant ?? ''}
                    onChange={e => updateInteraction(meeting.id, { keyParticipant: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{isZh ? '时长 (分钟)' : 'Duration (min)'}</label>
                  <input
                    type="number"
                    value={meeting.duration ?? 30}
                    onChange={e => updateInteraction(meeting.id, { duration: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{isZh ? '会议纪要 / 内容' : 'Meeting Notes / Content'}</label>
                  <textarea
                    value={meeting.summary ?? ''}
                    onChange={e => updateInteraction(meeting.id, { summary: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-y"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setEditingInteractionId(null)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/50">
                    {isZh ? '关闭' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* NeedEditDialog modal */}
      {editingNeed && (
        <NeedEditDialog
          need={editingNeed}
          isZh={isZh}
          onSave={(id, data) => {
            updateNeedStatusMutation.mutate({
              id,
              title: data.title,
              description: data.description,
              needType: data.needType as 'organizational' | 'professional' | 'personal',
              status: data.status as 'unmet' | 'in_progress' | 'satisfied' | 'blocked',
            });
            setEditingNeed(null);
            toast.success(isZh ? '需求已更新' : 'Need updated');
          }}
          onDelete={(id) => {
            deleteNeedMutation.mutate({ id });
            setEditingNeed(null);
          }}
          onClose={() => setEditingNeed(null)}
        />
      )}
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
