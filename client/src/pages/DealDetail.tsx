import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoute, Link } from 'wouter';
import { deals, formatCurrency, getConfidenceColor, getConfidenceBg, getRoleColor, getSentimentColor, formatDate, getStageColor } from '@/lib/data';
import type { Stakeholder, Interaction, PersonalSignal } from '@/lib/data';
import StakeholderMap from '@/components/StakeholderMap';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Globe, Clock, TrendingUp, TrendingDown, AlertTriangle,
  ChevronRight, User, MessageSquare, FileText, Map, BarChart3, X, ExternalLink,
  Mic, Check, Edit2, Save, Camera, GripHorizontal, ChevronDown, ChevronUp,
  Plus, Trash2, Pencil, Calendar, Lightbulb, Lock, Target, Sparkles, Heart, StickyNote
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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

interface StrategyNote {
  id: string;
  category: 'pricing' | 'relationship' | 'competitive' | 'internal' | 'other';
  content: string;
  createdAt: string;
  updatedAt: string;
}

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

export default function DealDetail() {
  const [, params] = useRoute('/deal/:id');
  const deal = deals.find(d => d.id === params?.id);
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
  const [activeTab, setActiveTab] = useState('map');
  const [showSummary, setShowSummary] = useState(true);
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

  // Local editable stakeholder state (per-deal, in-memory)
  const [localStakeholders, setLocalStakeholders] = useState<Stakeholder[]>(deal?.stakeholders ?? []);

  // Local editable interactions — shared between All Interactions tab and StakeholderMap
  const [localInteractions, setLocalInteractions] = useState<Interaction[]>(deal?.interactions ?? []);
  const [editingInteractionId, setEditingInteractionId] = useState<string | null>(null);
  const [expandedTranscriptId, setExpandedTranscriptId] = useState<string | null>(null);

  // Deal Strategy notes
  const [strategyNotes, setStrategyNotes] = useState<StrategyNote[]>([]);
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);

  const addStrategyNote = () => {
    const note: StrategyNote = {
      id: nanoid(8),
      category: 'internal',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setStrategyNotes(prev => [note, ...prev]);
    setEditingStrategyId(note.id);
  };

  const updateStrategyNote = (id: string, patch: Partial<StrategyNote>) => {
    setStrategyNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n));
  };

  const deleteStrategyNote = (id: string) => {
    setStrategyNotes(prev => prev.filter(n => n.id !== id));
    if (editingStrategyId === id) setEditingStrategyId(null);
  };

  const INTERACTION_TYPES = [
    'Discovery Call', 'Demo', 'Technical Review', 'POC Check-in',
    'Negotiation', 'Executive Briefing', 'Follow-up',
  ] as const;

  const updateInteraction = (id: string, patch: Partial<Interaction>) => {
    setLocalInteractions(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const addInteraction = () => {
    const newI: Interaction = {
      id: nanoid(8),
      dealId: deal!.id,
      date: new Date().toISOString().slice(0, 10),
      type: 'Follow-up',
      keyParticipant: '',
      summary: '',
      duration: 30,
    };
    setLocalInteractions(prev => [newI, ...prev]);
    setEditingInteractionId(newI.id);
  };

  const deleteInteraction = (id: string) => {
    setLocalInteractions(prev => prev.filter(i => i.id !== id));
    if (editingInteractionId === id) setEditingInteractionId(null);
  };

  // Reset all per-deal state when deal changes
  useEffect(() => {
    if (deal) {
      setLocalStakeholders(deal.stakeholders);
      setLocalInteractions(deal.interactions);
      setEditingInteractionId(null);
      setExpandedTranscriptId(null);
      setStrategyNotes([]);
      setEditingStrategyId(null);
      setSelectedStakeholder(null);
      setIsEditingProfile(false);
      setShowSummary(true);
      setSummaryPos({ x: 16, y: 16 });
      setActiveTab('map');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal?.id]);

  // Personal intelligence state — keyed by stakeholder ID
  const [personalNotesMap, setPersonalNotesMap] = useState<Record<string, string>>({});
  const [personalSignalsMap, setPersonalSignalsMap] = useState<Record<string, PersonalSignal[]>>({});
  const [editingPersonalNotes, setEditingPersonalNotes] = useState(false);
  const [personalNotesDraft, setPersonalNotesDraft] = useState('');

  // Initialize personal data from seed when deal changes
  useEffect(() => {
    if (deal) {
      const notesMap: Record<string, string> = {};
      const signalsMap: Record<string, PersonalSignal[]> = {};
      deal.stakeholders.forEach(s => {
        if (s.personalNotes) notesMap[s.id] = s.personalNotes;
        if (s.personalSignals) signalsMap[s.id] = s.personalSignals;
      });
      setPersonalNotesMap(notesMap);
      setPersonalSignalsMap(signalsMap);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal?.id]);

  // Editing state for the profile panel
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editSentiment, setEditSentiment] = useState<SentimentType>('Neutral');
  const [editRoles, setEditRoles] = useState<RoleType[]>([]);

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="font-display text-xl font-bold mb-2">Deal not found</h2>
          <Link href="/">
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
    setSelectedStakeholder(latest);
    setIsEditingProfile(false);
    setEditName(latest.name);
    setEditTitle(latest.title);
    setEditSentiment(latest.sentiment as SentimentType);
    // role can be a single string in current data — normalize to array
    const currentRoles = Array.isArray((latest as any).roles)
      ? (latest as any).roles
      : [latest.role];
    setEditRoles(currentRoles as RoleType[]);
  };

  // Save edits back to local state
  const handleSaveProfile = () => {
    if (!selectedStakeholder) return;
    const updated = localStakeholders.map(s => {
      if (s.id !== selectedStakeholder.id) return s;
      return {
        ...s,
        name: editName.trim() || s.name,
        title: editTitle.trim() || s.title,
        sentiment: editSentiment,
        role: editRoles[0] || s.role, // primary role for backward compat
        // store full roles array
        roles: editRoles,
      } as Stakeholder;
    });
    setLocalStakeholders(updated);
    const updatedS = updated.find(s => s.id === selectedStakeholder.id)!;
    setSelectedStakeholder(updatedS);
    setIsEditingProfile(false);
    toast.success('Stakeholder profile updated');
  };

  const toggleRole = (role: RoleType) => {
    setEditRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  // Avatar upload handler
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStakeholder) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const updated = localStakeholders.map(s =>
        s.id === selectedStakeholder.id ? { ...s, avatar: dataUrl } : s
      );
      setLocalStakeholders(updated);
      setSelectedStakeholder({ ...selectedStakeholder, avatar: dataUrl });
      toast.success('Avatar updated');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Deal header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm px-6 py-3.5 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <img
            src={deal.logo}
            alt={deal.company}
            className="w-9 h-9 rounded-lg bg-white/10 object-contain p-1.5 border border-border/30"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${deal.company}&background=1a1f36&color=fff&size=64`; }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-lg font-bold">{deal.company}</h1>
              <a
                href={`https://${deal.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
              >
                {deal.website} <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[10px] text-muted-foreground">last edited 13 mins ago</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className={`text-[10px] ${getStageColor(deal.stage)}`}>{deal.stage}</Badge>
              <span className="font-mono text-sm font-medium">{formatCurrency(deal.value)} ACV</span>
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
          <Button
            onClick={() => toast('Update Account History coming soon')}
            className="font-display text-xs shrink-0"
          >
            Update Account History
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-border/30 px-6">
              <TabsList className="bg-transparent h-10 gap-1 p-0">
                <TabsTrigger value="map" className="data-[state=active]:bg-muted/50 data-[state=active]:shadow-none rounded-lg text-xs font-display gap-1.5 px-3 h-8">
                  <Map className="w-3.5 h-3.5" />
                  Buying Committee
                </TabsTrigger>
                <TabsTrigger value="signals" className="data-[state=active]:bg-muted/50 data-[state=active]:shadow-none rounded-lg text-xs font-display gap-1.5 px-3 h-8">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Account Signals
                </TabsTrigger>
                <TabsTrigger value="discussions" className="data-[state=active]:bg-muted/50 data-[state=active]:shadow-none rounded-lg text-xs font-display gap-1.5 px-3 h-8">
                  <MessageSquare className="w-3.5 h-3.5" />
                  All Interactions
                </TabsTrigger>
                <TabsTrigger value="strategy" className="data-[state=active]:bg-muted/50 data-[state=active]:shadow-none rounded-lg text-xs font-display gap-1.5 px-3 h-8">
                  <Target className="w-3.5 h-3.5" />
                  Deal Strategy
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="map" className="flex-1 m-0">
              <div className="h-full flex overflow-hidden">

                {/* ── Deal Summary — fixed left sidebar ── */}
                {latestSnapshot && (
                  <div className="w-64 shrink-0 border-r border-border/30 bg-card/60 flex flex-col overflow-hidden">
                    <ScrollArea className="flex-1">
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="w-3.5 h-3.5 text-status-warning shrink-0" />
                          <span className="text-xs font-display font-semibold">Deal Summary</span>
                        </div>

                        {/* Key metrics grid */}
                        <div className="grid grid-cols-2 gap-1.5 mb-3">
                          <div className="bg-muted/30 rounded-lg px-2.5 py-2">
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Status</div>
                            <div className={`text-[11px] font-semibold ${statusColor}`}>{statusLabel}</div>
                          </div>
                          <div className="bg-muted/30 rounded-lg px-2.5 py-2">
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Confidence</div>
                            <div className={`text-[11px] font-semibold font-mono ${getConfidenceColor(deal.confidenceScore)}`}>
                              {deal.confidenceScore}%
                              {latestSnapshot.confidenceChange !== 0 && (
                                <span className="text-[9px] text-muted-foreground ml-1">
                                  {latestSnapshot.confidenceChange > 0 ? '↑' : '↓'}{Math.abs(latestSnapshot.confidenceChange)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="bg-muted/30 rounded-lg px-2.5 py-2">
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Stage</div>
                            <div className="text-[10px] font-medium">{deal.stage}</div>
                          </div>
                          <div className="bg-muted/30 rounded-lg px-2.5 py-2">
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">ACV</div>
                            <div className="text-[10px] font-semibold font-mono">{formatCurrency(deal.value)}</div>
                          </div>
                        </div>

                        {/* Confidence bar */}
                        <div className="mb-4">
                          <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${deal.confidenceScore}%`,
                                background: deal.confidenceScore >= 75 ? '#10b981' : deal.confidenceScore >= 50 ? '#f59e0b' : '#ef4444'
                              }}
                            />
                          </div>
                        </div>

                        <div className="border-t border-border/25 mb-3" />

                        {/* What's Happening — always fully visible */}
                        <div className="mb-3">
                          <div className="text-[9px] font-semibold text-status-info uppercase tracking-wider mb-1.5">What's Happening</div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {latestSnapshot.whatsHappening}
                          </p>
                        </div>

                        {/* Key Risks */}
                        {latestSnapshot.keyRisks.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[9px] font-semibold text-status-danger uppercase tracking-wider mb-1.5">Key Risks</div>
                            <div className="space-y-1">
                              {latestSnapshot.keyRisks.map((risk, i) => (
                                <div key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                                  <span className="text-status-danger mt-0.5 shrink-0">•</span>
                                  <span className="leading-snug">{risk}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* What's Next */}
                        <div className="mb-4">
                          <div className="text-[9px] font-semibold text-status-success uppercase tracking-wider mb-1.5">What's Next</div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {latestSnapshot.whatsNext}
                          </p>
                        </div>

                        <div className="border-t border-border/25 pt-3 space-y-1.5">
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full text-[10px] h-7 font-display"
                            onClick={() => setActiveTab('signals')}
                          >
                            Account Signals
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-[10px] h-7 font-display"
                            onClick={() => setActiveTab('discussions')}
                          >
                            All Interactions
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* ── Stakeholder Map canvas ── */}
                <div className="flex-1 relative overflow-hidden">
                  <StakeholderMap
                    key={deal.id}
                    deal={deal}
                    onStakeholderClick={handleStakeholderClick}
                    onStakeholdersChange={setLocalStakeholders}
                  />
                </div>

              </div>
            </TabsContent>

            <TabsContent value="signals" className="flex-1 m-0 overflow-auto">
              <div className="p-6 max-w-3xl space-y-4">
                <h3 className="font-display text-sm font-semibold mb-4">Account Signals & Intelligence</h3>
                {deal.companyInfo && (
                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4">
                      <h4 className="text-xs font-display font-semibold mb-2">Company Overview</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{deal.companyInfo}</p>
                    </CardContent>
                  </Card>
                )}
                {deal.snapshots.map(snap => (
                  <Card key={snap.id} className="bg-card border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{snap.interactionType}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(snap.date)}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${getConfidenceBg(snap.confidenceScore)}`}>
                          {snap.confidenceScore}%
                          {snap.confidenceChange !== 0 && (
                            <span className="ml-1">
                              ({snap.confidenceChange > 0 ? '+' : ''}{snap.confidenceChange})
                            </span>
                          )}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium text-status-info">Happening: </span>
                          <span className="text-muted-foreground">{snap.whatsHappening}</span>
                        </div>
                        <div>
                          <span className="font-medium text-status-success">Next: </span>
                          <span className="text-muted-foreground">{snap.whatsNext}</span>
                        </div>
                        {snap.keyRisks.length > 0 && (
                          <div>
                            <span className="font-medium text-status-danger">Risks: </span>
                            <span className="text-muted-foreground">{snap.keyRisks.join('; ')}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="discussions" className="flex-1 m-0 overflow-auto">
              <div className="p-6 max-w-3xl space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-sm font-semibold">All Interactions</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{localInteractions.length} interaction{localInteractions.length !== 1 ? 's' : ''} recorded</p>
                  </div>
                  <button
                    onClick={addInteraction}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Interaction
                  </button>
                </div>
                {localInteractions
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(interaction => {
                    const isEditing = editingInteractionId === interaction.id;
                    return (
                      <Card key={interaction.id} className={`border-border/50 transition-colors ${
                        isEditing ? 'bg-muted/40 border-primary/30' : 'bg-card'
                      }`}>
                        <CardContent className="p-4">
                          {isEditing ? (
                            /* ── Edit mode ── */
                            <div className="space-y-3">
                              {/* Type + Participant row */}
                              <div className="flex gap-2">
                                <select
                                  value={interaction.type}
                                  onChange={e => updateInteraction(interaction.id, { type: e.target.value as Interaction['type'] })}
                                  className="flex-1 text-xs bg-background border border-border/50 rounded-md px-2.5 py-1.5 text-foreground"
                                >
                                  {INTERACTION_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={interaction.keyParticipant}
                                  onChange={e => updateInteraction(interaction.id, { keyParticipant: e.target.value })}
                                  placeholder="Participant name"
                                  className="flex-1 text-xs bg-background border border-border/50 rounded-md px-2.5 py-1.5 text-foreground"
                                />
                              </div>
                              {/* Date + Duration row */}
                              <div className="flex gap-2 items-center">
                                <div className="flex items-center gap-1.5 flex-1">
                                  <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <input
                                    type="date"
                                    value={interaction.date}
                                    onChange={e => updateInteraction(interaction.id, { date: e.target.value })}
                                    className="flex-1 text-xs bg-background border border-border/50 rounded-md px-2.5 py-1.5 text-foreground"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <input
                                    type="number"
                                    value={interaction.duration}
                                    onChange={e => updateInteraction(interaction.id, { duration: Number(e.target.value) })}
                                    min={1}
                                    className="w-16 text-xs bg-background border border-border/50 rounded-md px-2.5 py-1.5 text-foreground"
                                  />
                                  <span className="text-xs text-muted-foreground">min</span>
                                </div>
                              </div>
                              {/* Notes / transcript */}
                              <div>
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes / Transcript</div>
                                <textarea
                                  value={interaction.summary}
                                  onChange={e => updateInteraction(interaction.id, { summary: e.target.value })}
                                  placeholder="Meeting notes, key decisions, action items..."
                                  rows={5}
                                  className="w-full text-xs bg-background border border-border/50 rounded-md px-2.5 py-2 text-foreground resize-y leading-relaxed"
                                />
                              </div>
                              {/* Action buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingInteractionId(null)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                                >
                                  <Check className="w-3 h-3" /> Done
                                </button>
                                <button
                                  onClick={() => deleteInteraction(interaction.id)}
                                  className="px-4 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ── Read mode ── */
                            <div>
                              {/* Top row: icon + type badge + meta */}
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/60" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                    {(() => {
                                      const tc = getInteractionTypeColor(interaction.type);
                                      return (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tc.bg} ${tc.text} ${tc.border}`}>
                                          {interaction.type}
                                        </span>
                                      );
                                    })()}
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <Calendar className="w-3 h-3" />
                                      <span>{formatDate(interaction.date)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <Clock className="w-3 h-3" />
                                      <span>{interaction.duration} min</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <User className="w-3 h-3" />
                                      <span>{interaction.keyParticipant || <span className="italic opacity-50">Unknown</span>}</span>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1">
                                      <button
                                        onClick={() => setEditingInteractionId(interaction.id)}
                                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors"
                                        title="Edit"
                                      >
                                        <Pencil className="w-3 h-3 text-muted-foreground/50" />
                                      </button>
                                    </div>
                                  </div>
                                  {/* Summary line */}
                                  {interaction.summary ? (
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {interaction.summary}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground/40 italic">No notes yet — click ✏ to add</p>
                                  )}
                                  {/* View Full Transcript toggle — only shown when a separate transcript exists */}
                                  {(interaction.transcript || (interaction.summary && interaction.summary.length > 120)) && (
                                    <button
                                      onClick={() => setExpandedTranscriptId(id => id === interaction.id ? null : interaction.id)}
                                      className="mt-2 flex items-center gap-1.5 text-[10px] text-primary hover:text-primary/80 font-medium transition-colors"
                                    >
                                      <FileText className="w-3 h-3" />
                                      {expandedTranscriptId === interaction.id ? 'Collapse Transcript' : 'View Full Transcript'}
                                      {expandedTranscriptId === interaction.id
                                        ? <ChevronUp className="w-3 h-3" />
                                        : <ChevronDown className="w-3 h-3" />
                                      }
                                    </button>
                                  )}
                                  {/* Expanded transcript — shows interaction.transcript if available, else full summary */}
                                  <AnimatePresence>
                                    {expandedTranscriptId === interaction.id && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-2 rounded-lg border border-border/30 overflow-hidden">
                                          <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/30">
                                            <div className="flex items-center gap-1.5">
                                              <FileText className="w-3 h-3 text-muted-foreground" />
                                              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                {interaction.transcript ? 'Full Transcript' : 'Full Notes'}
                                              </span>
                                            </div>
                                            <span className="text-[9px] text-muted-foreground/50">
                                              {interaction.duration} min · {formatDate(interaction.date)}
                                            </span>
                                          </div>
                                          <div className="p-3 bg-muted/20 max-h-96 overflow-y-auto">
                                            <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono">
                                              {interaction.transcript ?? interaction.summary}
                                            </p>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                {localInteractions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground/60">
                    <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No interactions recorded yet</p>
                    <p className="text-xs mt-1">Click "Add Interaction" to log your first touchpoint</p>
                  </div>
                )}
              </div>
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
                    return (
                      <Card key={note.id} className={`border-border/50 transition-colors ${
                        isEditing ? 'bg-muted/40 border-primary/30' : 'bg-card'
                      }`}>
                        <CardContent className="p-4">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <select
                                  value={note.category}
                                  onChange={e => updateStrategyNote(note.id, { category: e.target.value as StrategyNote['category'] })}
                                  className="flex-1 text-xs bg-background border border-border/50 rounded-md px-2.5 py-1.5 text-foreground"
                                >
                                  {STRATEGY_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                  ))}
                                </select>
                              </div>
                              <textarea
                                value={note.content}
                                onChange={e => updateStrategyNote(note.id, { content: e.target.value })}
                                placeholder="Describe the internal strategy, context, or constraints for this deal..."
                                rows={5}
                                className="w-full text-xs bg-background border border-border/50 rounded-md px-2.5 py-2 text-foreground resize-y leading-relaxed"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingStrategyId(null)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                                >
                                  <Check className="w-3 h-3" /> Done
                                </button>
                                <button
                                  onClick={() => deleteStrategyNote(note.id)}
                                  className="px-4 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                                >
                                  Delete
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
                                  <span className="text-[10px] text-muted-foreground/50">· {formatDate(note.updatedAt)}</span>
                                  <div className="ml-auto">
                                    <button
                                      onClick={() => setEditingStrategyId(note.id)}
                                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors"
                                    >
                                      <Pencil className="w-3 h-3 text-muted-foreground/50" />
                                    </button>
                                  </div>
                                </div>
                                {note.content ? (
                                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                ) : (
                                  <p className="text-xs text-muted-foreground/40 italic">Empty note — click ✏ to add content</p>
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

        {/* ── Stakeholder Profile Panel ── */}
        <AnimatePresence>
          {selectedStakeholder && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-l border-border/50 bg-card/50 shrink-0 overflow-hidden"
            >
              <ScrollArea className="h-full">
                <div className="p-4">
                  {/* Panel header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-sm font-semibold">Stakeholder Profile</h3>
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
                          <button
                            onClick={() => setIsEditingProfile(true)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-[10px] font-medium hover:bg-muted/80 hover:text-foreground transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
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

                  {/* Avatar + Name/Title */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="relative shrink-0 group">
                      <img
                        src={selectedStakeholder.avatar}
                        alt={selectedStakeholder.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStakeholder.name)}&background=1a1f36&color=fff&size=56`;
                        }}
                      />
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
                      {deal.interactions
                        .filter(i => i.keyParticipant === selectedStakeholder.name)
                        .map(interaction => (
                          <div key={interaction.id} className="p-2 rounded bg-muted/20 mb-1.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge variant="outline" className="text-[9px] px-1 py-0">{interaction.type}</Badge>
                              <span className="text-[10px] text-muted-foreground">{formatDate(interaction.date)}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">{interaction.summary}</p>
                          </div>
                        ))
                      }
                      {deal.interactions.filter(i => i.keyParticipant === selectedStakeholder.name).length === 0 && (
                        <p className="text-[10px] text-muted-foreground/60 italic">No direct interactions recorded.</p>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ask Meridian bar */}
      <div className="border-t border-border/50 bg-card/50 px-6 py-2.5 shrink-0">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Ask Meridian..."
              className="w-full h-9 px-4 rounded-lg bg-muted/30 border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') toast('AI assistant coming soon — this feature requires backend integration.');
              }}
            />
          </div>
          <button
            onClick={() => toast('File upload coming soon')}
            className="w-9 h-9 rounded-lg border border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <FileText className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => toast('Voice input coming soon')}
            className="w-9 h-9 rounded-lg border border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Mic className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
