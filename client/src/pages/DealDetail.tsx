import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoute, Link } from 'wouter';
import { deals, formatCurrency, getConfidenceColor, getConfidenceBg, getRoleColor, getSentimentColor, formatDate, getStageColor } from '@/lib/data';
import type { Stakeholder } from '@/lib/data';
import StakeholderMap from '@/components/StakeholderMap';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Globe, Clock, TrendingUp, TrendingDown, AlertTriangle,
  ChevronRight, User, MessageSquare, FileText, Map, BarChart3, X, ExternalLink,
  Mic, Check, Edit2, Save, Camera, GripHorizontal, ChevronDown, ChevronUp
} from 'lucide-react';
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

  // Reset all per-deal state when deal changes
  useEffect(() => {
    if (deal) {
      setLocalStakeholders(deal.stakeholders);
      setSelectedStakeholder(null);
      setIsEditingProfile(false);
      setShowSummary(true);
      setSummaryPos({ x: 16, y: 16 });
      setActiveTab('map');
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
                  Internal Discussions
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="map" className="flex-1 m-0 relative">
              <div className="absolute inset-0 flex">
                <div className="flex-1 relative">
                  <StakeholderMap
                    key={deal.id}
                    deal={deal}
                    onStakeholderClick={handleStakeholderClick}
                    onStakeholdersChange={setLocalStakeholders}
                  />

                  {/* Deal Summary floating panel */}
                  <AnimatePresence>
                    {showSummary && latestSnapshot && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-30"
                        style={{ left: summaryPos.x, top: summaryPos.y }}
                      >
                        <Card className="bg-card/95 backdrop-blur-md border-border/40 shadow-xl shadow-black/25" style={{ width: 264 }}>
                          {/* Drag handle bar */}
                          <div
                            className="flex items-center justify-center py-1.5 cursor-grab active:cursor-grabbing border-b border-border/20 hover:bg-muted/30 transition-colors rounded-t-xl"
                            onMouseDown={handleSummaryMouseDown}
                          >
                            <GripHorizontal className="w-4 h-4 text-muted-foreground/50" />
                          </div>

                          <CardContent className="p-3 pt-2.5">
                            {/* Header row */}
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-[11px] font-display font-semibold select-none">Deal Summary</span>
                              <button
                                onClick={() => setShowSummary(false)}
                                className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted/60 transition-colors"
                              >
                                <X className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </div>

                            {/* Key metrics grid */}
                            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                              <div className="bg-muted/30 rounded-lg px-2 py-1.5">
                                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Status</div>
                                <div className={`text-[11px] font-semibold ${statusColor}`}>{statusLabel}</div>
                              </div>
                              <div className="bg-muted/30 rounded-lg px-2 py-1.5">
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
                              <div className="bg-muted/30 rounded-lg px-2 py-1.5">
                                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Stage</div>
                                <div className="text-[10px] font-medium truncate">{deal.stage}</div>
                              </div>
                              <div className="bg-muted/30 rounded-lg px-2 py-1.5">
                                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">ACV</div>
                                <div className="text-[10px] font-semibold font-mono">{formatCurrency(deal.value)}</div>
                              </div>
                            </div>

                            {/* Confidence bar */}
                            <div className="mb-2.5">
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

                            <div className="border-t border-border/25 my-2" />

                            {/* Expandable sections */}
                            <div className="space-y-1.5">
                              {/* What's Happening */}
                              <div>
                                <button
                                  className="w-full flex items-center justify-between group"
                                  onClick={() => setSummaryExpandedSection(s => s === 'happening' ? null : 'happening')}
                                >
                                  <span className="text-[9px] font-semibold text-status-info uppercase tracking-wider">What's Happening</span>
                                  {summaryExpandedSection === 'happening'
                                    ? <ChevronUp className="w-3 h-3 text-muted-foreground" />
                                    : <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                  }
                                </button>
                                <p className={`text-[10px] text-muted-foreground leading-relaxed mt-0.5 ${summaryExpandedSection === 'happening' ? '' : 'line-clamp-2'}`}>
                                  {latestSnapshot.whatsHappening}
                                </p>
                              </div>

                              {/* Key Risks */}
                              {latestSnapshot.keyRisks.length > 0 && (
                                <div>
                                  <button
                                    className="w-full flex items-center justify-between group"
                                    onClick={() => setSummaryExpandedSection(s => s === 'risks' ? null : 'risks')}
                                  >
                                    <span className="text-[9px] font-semibold text-status-danger uppercase tracking-wider">Key Risks</span>
                                    {summaryExpandedSection === 'risks'
                                      ? <ChevronUp className="w-3 h-3 text-muted-foreground" />
                                      : <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                    }
                                  </button>
                                  <div className="mt-0.5 space-y-0.5">
                                    {(summaryExpandedSection === 'risks'
                                      ? latestSnapshot.keyRisks
                                      : latestSnapshot.keyRisks.slice(0, 2)
                                    ).map((risk, i) => (
                                      <div key={i} className="flex items-start gap-1 text-[10px] text-muted-foreground">
                                        <span className="text-status-danger mt-px shrink-0">•</span>
                                        <span>{risk}</span>
                                      </div>
                                    ))}
                                    {summaryExpandedSection !== 'risks' && latestSnapshot.keyRisks.length > 2 && (
                                      <div className="text-[9px] text-muted-foreground/50 pl-3">+{latestSnapshot.keyRisks.length - 2} more</div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* What's Next */}
                              <div>
                                <button
                                  className="w-full flex items-center justify-between group"
                                  onClick={() => setSummaryExpandedSection(s => s === 'next' ? null : 'next')}
                                >
                                  <span className="text-[9px] font-semibold text-status-success uppercase tracking-wider">What's Next</span>
                                  {summaryExpandedSection === 'next'
                                    ? <ChevronUp className="w-3 h-3 text-muted-foreground" />
                                    : <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                  }
                                </button>
                                <p className={`text-[10px] text-muted-foreground leading-relaxed mt-0.5 ${summaryExpandedSection === 'next' ? '' : 'line-clamp-2'}`}>
                                  {latestSnapshot.whatsNext}
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-border/25 mt-2.5 pt-2 flex gap-1.5">
                              <Button
                                size="sm"
                                variant="default"
                                className="text-[10px] h-6 px-2 flex-1 font-display"
                                onClick={() => toast('Deal map view coming soon')}
                              >
                                View Deal Map
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[10px] h-6 px-2 flex-1 font-display"
                                onClick={() => setActiveTab('discussions')}
                              >
                                All Interactions
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!showSummary && (
                    <button
                      onClick={handleOpenSummary}
                      className="absolute top-4 left-4 z-30 w-8 h-8 rounded-lg bg-card/90 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-muted transition-colors shadow-md"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-status-warning" />
                    </button>
                  )}
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
                <h3 className="font-display text-sm font-semibold mb-4">Meeting History</h3>
                {deal.interactions.map(interaction => (
                  <Card key={interaction.id} className="bg-card border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{interaction.type}</Badge>
                          <span className="text-xs font-medium">{interaction.keyParticipant}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{interaction.duration}min</span>
                          <span>{formatDate(interaction.date)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{interaction.summary}</p>
                    </CardContent>
                  </Card>
                ))}
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
