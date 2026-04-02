import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, Clock, User, Search, ChevronDown, ChevronRight, Eye, Calendar,
  MessageSquare, BarChart3, Users, Sparkles, CheckCircle, AlertTriangle, Plus,
  Trash2, Edit2, X, Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { CompanyLogo } from '@/components/Avatars';
import { useLanguage } from '@/contexts/LanguageContext';
import { getStageName } from '@/lib/data';

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  'Discovery Call':      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Demo':                'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Technical Review':    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'POC Check-in':        'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Negotiation':         'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Executive Briefing':  'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Follow-up':           'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const STAGE_COLORS: Record<string, string> = {
  'Discovery':            'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Demo':                 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Technical Evaluation': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'POC':                  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Negotiation':          'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Closed Won':           'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Closed Lost':          'bg-red-500/10 text-red-400 border-red-500/20',
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelative(d: Date | string, lang?: string) {
  const zh = lang === 'zh';
  const now = Date.now();
  const then = new Date(d).getTime();
  const diff = now - then;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return zh ? '今天' : 'Today';
  if (days === 1) return zh ? '昨天' : 'Yesterday';
  if (days < 7) return zh ? `${days}天前` : `${days}d ago`;
  if (days < 30) return zh ? `${Math.floor(days / 7)}周前` : `${Math.floor(days / 7)}w ago`;
  return zh ? `${Math.floor(days / 30)}月前` : `${Math.floor(days / 30)}mo ago`;
}

// ─── Information Density Bar ────────────────────────────────────────────────

function DensityBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground/60 w-20 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground/80 w-6 text-right font-mono">{count}</span>
    </div>
  );
}

// ─── Deal Summary Card ──────────────────────────────────────────────────────

function DealSummaryCard({ deal, interactions, stakeholderCount, snapshotCount, actionCount, maxInteractions, isExpanded, onToggle }: {
  deal: any;
  interactions: any[];
  stakeholderCount: number;
  snapshotCount: number;
  actionCount: number;
  maxInteractions: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const lastInteraction = interactions.length > 0
    ? interactions.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b)
    : null;

  const typeCounts = interactions.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const withTranscript = interactions.filter(i => i.transcriptUrl).length;
  const totalMinutes = interactions.reduce((s, i) => s + (i.duration ?? 0), 0);

  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      {/* Deal header with density metrics */}
      <button
        onClick={onToggle}
        className="w-full text-left hover:bg-accent/20 transition-colors"
      >
        <div className="px-4 py-3 flex items-start gap-3">
          <CompanyLogo name={deal.company} logoUrl={deal.logo} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display text-sm font-semibold">{deal.company}</span>
              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${STAGE_COLORS[deal.stage] ?? 'bg-muted/50 text-muted-foreground'}`}>
                {getStageName(deal.stage, isZh)}
              </Badge>
            </div>

            {/* Information density metrics row */}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70 flex-wrap">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {isZh ? `${interactions.length} 次互动` : `${interactions.length} interaction${interactions.length !== 1 ? 's' : ''}`}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {isZh ? `${stakeholderCount} 位联系人` : `${stakeholderCount} contact${stakeholderCount !== 1 ? 's' : ''}`}
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {isZh ? `${snapshotCount} 次分析` : `${snapshotCount} analysis`}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {isZh ? `${actionCount} 个行动` : `${actionCount} action${actionCount !== 1 ? 's' : ''}`}
              </span>
              {withTranscript > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {isZh ? `${withTranscript} 份记录` : `${withTranscript} transcript${withTranscript !== 1 ? 's' : ''}`}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {isZh ? `已录制 ${totalMinutes > 60 ? `${Math.round(totalMinutes / 60)}h` : `${totalMinutes}m`}` : `${totalMinutes > 60 ? `${Math.round(totalMinutes / 60)}h` : `${totalMinutes}m`} recorded`}
              </span>
            </div>

            {/* Density bars */}
            <div className="mt-2 space-y-0.5">
              <DensityBar label={isZh ? '互动' : 'Interactions'} count={interactions.length} max={maxInteractions} color="bg-blue-400" />
              <DensityBar label={isZh ? '利益相关者' : 'Stakeholders'} count={stakeholderCount} max={Math.max(stakeholderCount, 8)} color="bg-purple-400" />
              <DensityBar label={isZh ? '记录' : 'Transcripts'} count={withTranscript} max={interactions.length || 1} color="bg-emerald-400" />
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {lastInteraction && (
              <span className="text-[10px] text-muted-foreground/50">{formatRelative(lastInteraction.date, language)}</span>
            )}
            {isExpanded
              ? <ChevronDown className="w-4 h-4 text-muted-foreground/50" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            }
          </div>
        </div>
      </button>

      {/* Expanded: interaction list + type breakdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-border/40">
              {/* Type breakdown */}
              {Object.keys(typeCounts).length > 0 && (
                <div className="px-4 py-2 flex items-center gap-2 flex-wrap border-b border-border/20 bg-muted/10">
                  {(Object.entries(typeCounts) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                    <Badge key={type} variant="outline" className={`text-[9px] px-1.5 py-0 gap-1 ${TYPE_COLORS[type] ?? ''}`}>
                      {type} <span className="font-mono">{count}</span>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Interaction rows */}
              {interactions.map(interaction => (
                <InteractionRow key={interaction.id} interaction={interaction} dealName={deal.company} dealLogo={deal.logo} />
              ))}

              {interactions.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground/60">
                  {isZh ? '暂无互动记录。' : 'No interactions recorded yet.'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Interaction Row ────────────────────────────────────────────────────────

function InteractionRow({ interaction, dealName, dealLogo }: { interaction: any; dealName: string; dealLogo: string | null }) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <>
      <div className="px-4 py-2.5 hover:bg-accent/15 transition-colors border-b border-border/10 last:border-b-0">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 mt-0.5">
            <MessageSquare className="w-3 h-3 text-muted-foreground/60" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${TYPE_COLORS[interaction.type] ?? ''}`}>
                {interaction.type}
              </Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Calendar className="w-2.5 h-2.5" />{formatDate(interaction.date)}
              </span>
              {interaction.duration > 0 && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />{interaction.duration}m
                </span>
              )}
              {interaction.keyParticipant && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <User className="w-2.5 h-2.5" />{interaction.keyParticipant}
                </span>
              )}
            </div>
            {interaction.summary && (
              <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">{interaction.summary}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {interaction.transcriptUrl && (
              <button
                onClick={() => setShowTranscript(true)}
                className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors px-1.5 py-0.5 rounded hover:bg-primary/10"
              >
                <Eye className="w-3 h-3" /> {isZh ? '查看' : 'View'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transcript viewer */}
      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <CompanyLogo name={dealName} logoUrl={dealLogo} size="xs" />
              {dealName} — {interaction.type}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(interaction.date)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{interaction.duration}m</span>
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{interaction.keyParticipant}</span>
            </div>
            {interaction.summary && (
              <div>
                <p className="text-xs font-display font-semibold text-muted-foreground mb-1 uppercase tracking-wider">{isZh ? '摘要' : 'Summary'}</p>
                <p className="text-sm leading-relaxed">{interaction.summary}</p>
              </div>
            )}
            {interaction.transcriptUrl && (
              <div>
                <p className="text-xs font-display font-semibold text-muted-foreground mb-1 uppercase tracking-wider">{isZh ? '完整记录' : 'Full Transcript'}</p>
                <ScrollArea className="h-[300px] rounded-md border border-border/50 p-3">
                  <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground/80">
                    {interaction.transcriptUrl}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

type SelectedInteraction = {
  dealName: string;
  dealLogo: string | null;
  type: string;
  date: Date | string;
  duration: number;
  keyParticipant: string;
  summary: string;
  transcriptUrl?: string | null;
};

export default function Transcripts() {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDeals, setExpandedDeals] = useState<Set<number>>(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const [sortBy, setSortBy] = useState<'activity' | 'density' | 'name'>('activity');

  const [addDealId, setAddDealId] = useState('');
  const [addContentType, setAddContentType] = useState<'note' | 'audio' | 'screenshot' | 'pdf' | 'action'>('note');
  const [addTitle, setAddTitle] = useState('');
  const [addDescription, setAddDescription] = useState('');

  const { data: deals = [], isLoading: dealsLoading } = trpc.deals.list.useQuery();
  const { data: allMeetings = [], isLoading: meetingsLoading } = trpc.meetings.listAll.useQuery();
  const { data: allStakeholders = [] } = trpc.stakeholders.listAll.useQuery();
  const { data: snapshotCounts = [] } = trpc.snapshots.countsByDeal.useQuery();
  const utils = trpc.useUtils();

  const createMeeting = trpc.meetings.create.useMutation({
    onSuccess: () => {
      utils.meetings.listAll.invalidate();
      toast.success(isZh ? '已添加到交易室！AI 分析即将开始。' : 'Added to Deal Room! AI analysis will begin shortly.');
      setShowUpload(false);
      setAddDealId('');
      setAddContentType('note');
      setAddTitle('');
      setAddDescription('');
    },
    onError: () => toast.error(isZh ? '添加到交易室失败' : 'Failed to add to Deal Room'),
  });

  const toggleDeal = (dealId: number) => {
    setExpandedDeals(prev => {
      const next = new Set(prev);
      if (next.has(dealId)) next.delete(dealId);
      else next.add(dealId);
      return next;
    });
  };

  // Group data by deal
  const meetingsByDeal = useMemo(() => allMeetings.reduce((acc, m) => {
    if (!acc[m.dealId]) acc[m.dealId] = [];
    acc[m.dealId].push(m);
    return acc;
  }, {} as Record<number, typeof allMeetings>), [allMeetings]);

  const stakeholdersByDeal = useMemo(() => allStakeholders.reduce((acc, s) => {
    if (!acc[s.dealId]) acc[s.dealId] = [];
    acc[s.dealId].push(s);
    return acc;
  }, {} as Record<number, typeof allStakeholders>), [allStakeholders]);

  // Compute deal data with metrics
  const dealData = useMemo(() => {
    return deals.map(deal => {
      const interactions = (meetingsByDeal[deal.id] ?? [])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const stakeholders = stakeholdersByDeal[deal.id] ?? [];
      const lastActivity = interactions.length > 0 ? new Date(interactions[0].date).getTime() : 0;
      const density = interactions.length + stakeholders.length;

      return {
        ...deal,
        interactions,
        stakeholderCount: stakeholders.length,
        snapshotCount: snapshotCounts.find(s => s.dealId === deal.id)?.count ?? 0,
        actionCount: 0, // Actions are embedded in snapshots as suggestionActions
        lastActivity,
        density,
      };
    });
  }, [deals, meetingsByDeal, stakeholdersByDeal]);

  // Filter and sort
  const filteredDeals = useMemo(() => {
    let result = dealData;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.company.toLowerCase().includes(q) ||
        d.interactions.some(i =>
          (i.keyParticipant ?? '').toLowerCase().includes(q) ||
          (i.summary ?? '').toLowerCase().includes(q) ||
          i.type.toLowerCase().includes(q)
        )
      );
    }
    // Sort
    if (sortBy === 'activity') {
      result = [...result].sort((a, b) => b.lastActivity - a.lastActivity);
    } else if (sortBy === 'density') {
      result = [...result].sort((a, b) => b.density - a.density);
    } else {
      result = [...result].sort((a, b) => a.company.localeCompare(b.company));
    }
    return result;
  }, [dealData, searchQuery, sortBy]);

  const maxInteractions = Math.max(...dealData.map(d => d.interactions.length), 1);

  // Global stats
  const totalInteractions = allMeetings.length;
  const totalTranscripts = allMeetings.filter(m => m.transcriptUrl).length;
  const totalMinutes = allMeetings.reduce((s, m) => s + (m.duration ?? 0), 0);

  const isLoading = dealsLoading || meetingsLoading;

  return (
    <div className="p-4 md:p-6 max-w-[1040px]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold mb-1">{isZh ? '交易室' : 'Deal Room'}</h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              {isZh ? '统一查看所有交易活动、互动记录和数据密度。' : 'Unified view of all deal activity, interactions, and data density across your pipeline.'}
            </p>
          </div>
          <Button className="font-display text-xs gap-2 shrink-0 w-full sm:w-auto" onClick={() => setShowUpload(true)}>
            <Plus className="w-3.5 h-3.5" />
            {isZh ? '添加到交易室' : 'Add to Deal Room'}
          </Button>

          {/* New unified Add to Deal Room dialog */}
          {showUpload && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowUpload(false)}>
              <div className="bg-card border border-border rounded-xl shadow-2xl w-[520px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                  <h3 className="font-display text-sm font-semibold">{isZh ? '添加到交易室' : 'Add to Deal Room'}</h3>
                  <button onClick={() => setShowUpload(false)} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Deal selector */}
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">{isZh ? '交易' : 'Deal'}</label>
                    <Select value={addDealId} onValueChange={setAddDealId}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder={isZh ? '选择交易...' : 'Select deal...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {deals.map(d => (
                          <SelectItem key={d.id} value={String(d.id)} className="text-xs">{d.company}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content type selector */}
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2 block">{isZh ? '内容类型' : 'Content Type'}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'note' as const, label: isZh ? '会议笔记' : 'Meeting Notes', icon: MessageSquare },
                        { value: 'audio' as const, label: isZh ? '音视频' : 'Audio / Video', icon: Upload },
                        { value: 'screenshot' as const, label: isZh ? '截图' : 'Screenshot', icon: Eye },
                        { value: 'pdf' as const, label: isZh ? 'PDF 文档' : 'PDF Document', icon: FileText },
                        { value: 'action' as const, label: isZh ? '销售行动' : 'Sales Action', icon: CheckCircle },
                      ].map(ct => (
                        <button
                          key={ct.value}
                          onClick={() => setAddContentType(ct.value)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[11px] font-medium transition-all ${
                            addContentType === ct.value
                              ? 'border-primary/40 bg-primary/10 text-primary'
                              : 'border-border/30 bg-muted/20 text-muted-foreground hover:border-border/60 hover:bg-muted/40'
                          }`}
                        >
                          <ct.icon className="w-3.5 h-3.5" />
                          {ct.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">{isZh ? '标题' : 'Title'}</label>
                    <Input
                      value={addTitle}
                      onChange={e => setAddTitle(e.target.value)}
                      placeholder={addContentType === 'action' ? (isZh ? '例如：向 CFO 发送报价方案' : 'e.g., Sent pricing proposal to CFO') : (isZh ? '例如：与 VP Engineering 的探索电话' : 'e.g., Discovery call with VP Engineering')}
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* Description / Content */}
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">
                      {addContentType === 'note' ? (isZh ? '会议笔记 / 记录内容' : 'Meeting Notes / Transcript Content') : addContentType === 'action' ? (isZh ? '行动详情' : 'Action Details') : (isZh ? '描述（可选）' : 'Description (optional)')}
                    </label>
                    <Textarea
                      value={addDescription}
                      onChange={e => setAddDescription(e.target.value)}
                      placeholder={addContentType === 'note' ? (isZh ? '粘贴会议记录或笔记...' : 'Paste meeting transcript or notes here...') : (isZh ? '添加详情...' : 'Add details...')}
                      className={`text-xs ${addContentType === 'note' ? 'min-h-[200px]' : 'min-h-[80px]'}`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/30">
                  <Button variant="outline" size="sm" onClick={() => setShowUpload(false)} className="text-xs font-display">{isZh ? '取消' : 'Cancel'}</Button>
                  <Button
                    size="sm"
                    className="text-xs font-display"
                    disabled={!addDealId || !addTitle.trim() || createMeeting.isPending}
                    onClick={() => {
                      if (!addDealId || !addTitle.trim()) {
                        toast.error(isZh ? '请选择交易并输入标题' : 'Please select a deal and enter a title');
                        return;
                      }
                      const typeMap: Record<string, string> = {
                        note: 'Follow-up',
                        audio: 'Follow-up',
                        screenshot: 'Follow-up',
                        pdf: 'Follow-up',
                        action: 'Follow-up',
                      };
                      createMeeting.mutate({
                        dealId: Number(addDealId),
                        type: typeMap[addContentType] || 'Follow-up',
                        date: new Date().toISOString(),
                        duration: 30,
                        keyParticipant: addTitle.trim(),
                        summary: addDescription.trim().slice(0, 500) || addTitle.trim(),
                        transcriptUrl: addDescription.length > 500 ? addDescription : undefined,
                      });
                    }}
                  >
                    {createMeeting.isPending ? (isZh ? '保存中...' : 'Saving...') : (isZh ? '添加到时间线' : 'Add to Timeline')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="rounded-lg border border-border/40 bg-card/50 px-3 py-2.5">
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">{isZh ? '交易' : 'Deals'}</div>
            <div className="text-lg font-display font-bold">{deals.length}</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/50 px-3 py-2.5">
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">{isZh ? '互动' : 'Interactions'}</div>
            <div className="text-lg font-display font-bold">{totalInteractions}</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/50 px-3 py-2.5">
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">{isZh ? '记录' : 'Transcripts'}</div>
            <div className="text-lg font-display font-bold">{totalTranscripts}</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/50 px-3 py-2.5">
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">{isZh ? '录制时长' : 'Time Recorded'}</div>
            <div className="text-lg font-display font-bold">{totalMinutes > 60 ? `${Math.round(totalMinutes / 60)}h` : `${totalMinutes}m`}</div>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isZh ? '按交易、参与者或主题搜索...' : 'Search by deal, participant, or topic...'}
              className="pl-10 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
            {([['activity', isZh ? '最近' : 'Recent'], ['density', isZh ? '数据密度' : 'Data Density'], ['name', 'A-Z']] as [string, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortBy(key as any)}
                className={`text-[10px] px-2.5 py-1 rounded-md transition-colors ${sortBy === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        )}

        {/* Deal cards */}
        {!isLoading && (
          <div className="space-y-3">
            {filteredDeals.map(deal => (
              <DealSummaryCard
                key={deal.id}
                deal={deal}
                interactions={deal.interactions}
                stakeholderCount={deal.stakeholderCount}
                snapshotCount={deal.snapshotCount}
                actionCount={deal.actionCount}
                maxInteractions={maxInteractions}
                isExpanded={expandedDeals.has(deal.id)}
                onToggle={() => toggleDeal(deal.id)}
              />
            ))}

            {filteredDeals.length === 0 && !isLoading && (
              <Card className="bg-card border-border/50">
                <CardContent className="p-12 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? (isZh ? '没有匹配的交易。' : 'No deals match your search.') : (isZh ? '暂无交易。创建交易开始吧。' : 'No deals yet. Create a deal to get started.')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      </motion.div>
    </div>
  );
}
