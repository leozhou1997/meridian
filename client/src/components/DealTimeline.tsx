import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, MessageSquare, FileText, Calendar, Clock, User,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertTriangle,
  Lightbulb, ArrowRight, Plus, Pencil, Check, Trash2, Globe,
  Upload, Bot, Activity, Image, Video, File, Mic, Send,
  Filter, Layers, StickyNote, ExternalLink, Paperclip, X,
  Building2, Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, getConfidenceColor, getConfidenceBg } from '@/lib/data';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SnapshotData {
  id: number;
  dealId: number;
  date: Date | string;
  whatsHappening: string | null;
  whatsNext: Array<{ action: string; rationale: string; suggestedContacts?: Array<{ name: string; title: string; reason: string }> }> | null;
  keyRisks: Array<{ title: string; detail: string; stakeholders: string[] }> | string[] | null;
  confidenceScore: number;
  confidenceChange: number;
  interactionType: string | null;
  keyParticipant: string | null;
  aiGenerated: boolean;
  createdAt: Date | string;
}

interface MeetingData {
  id: number;
  dealId: number;
  date: Date | string;
  type: string;
  keyParticipant: string | null;
  summary: string | null;
  duration: number | null;
  transcriptUrl?: string | null;
  attachmentUrl?: string | null;
  createdAt: Date | string;
}

interface StrategyNoteData {
  id: number;
  dealId: number;
  title: string | null;
  category: string;
  content: string;
  date: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

type TimelineEvent = 
  | { kind: 'snapshot'; data: SnapshotData; timestamp: number }
  | { kind: 'meeting'; data: MeetingData; timestamp: number }
  | { kind: 'strategy'; data: StrategyNoteData; timestamp: number };

interface DealTimelineProps {
  snapshots: SnapshotData[];
  meetings: MeetingData[];
  strategyNotes?: StrategyNoteData[];
  companyInfo?: string | null;
  companyName?: string;
  onAddMeeting?: () => void;
  onCreateMeeting?: (data: { date: string; type: string; keyParticipant?: string; summary?: string; duration?: number }) => void;
  onEditMeeting?: (id: number) => void;
  onDeleteMeeting?: (id: number) => void;
  onSwitchToStrategy?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MEETING_TYPES = [
  'Discovery Call', 'Demo', 'Technical Review', 'POC Check-in',
  'Negotiation', 'Executive Briefing', 'Follow-up',
] as const;

function getInteractionTypeColor(type: string) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    'Discovery Call': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    'Demo': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    'Technical Review': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    'POC Check-in': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    'Negotiation': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    'Executive Briefing': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    'Follow-up': { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  };
  return map[type] || map['Follow-up'];
}

function getMeetingTypeLabel(type: string, isZh: boolean): string {
  const map: Record<string, string> = {
    'Discovery Call': isZh ? '探索电话' : 'Discovery Call',
    'Demo': isZh ? '产品演示' : 'Demo',
    'Technical Review': isZh ? '技术评审' : 'Technical Review',
    'POC Check-in': isZh ? 'POC 检查' : 'POC Check-in',
    'Negotiation': isZh ? '商务谈判' : 'Negotiation',
    'Executive Briefing': isZh ? '高管汇报' : 'Executive Briefing',
    'Follow-up': isZh ? '跟进' : 'Follow-up',
  };
  return map[type] || type;
}

function getStrategyCategoryConfig(isZh: boolean) {
  return {
    pricing: { label: isZh ? '定价策略' : 'Pricing', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    relationship: { label: isZh ? '关系策略' : 'Relationship', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    competitive: { label: isZh ? '竞争情报' : 'Competitive', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    internal: { label: isZh ? '内部对齐' : 'Internal', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    other: { label: isZh ? '其他' : 'Other', color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-border/30' },
  } as Record<string, { label: string; color: string; bg: string; border: string }>;
}

function formatKeyRisk(risk: { title: string; detail: string; stakeholders: string[] } | string): string {
  if (typeof risk === 'string') return risk;
  return risk.title;
}

// ─── Upload Dialog (Unified Add to Deal Room) ──────────────────────────────

function UploadDialog({ onClose, onSubmit, isSubmitting }: {
  onClose: () => void;
  onSubmit: (data: { date: string; type: string; keyParticipant?: string; summary?: string; duration?: number }) => void;
  isSubmitting?: boolean;
}) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const [meetingType, setMeetingType] = useState<string>('Follow-up');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [keyParticipant, setKeyParticipant] = useState('');
  const [duration, setDuration] = useState(30);
  const [summary, setSummary] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    onSubmit({
      date,
      type: meetingType,
      keyParticipant: keyParticipant.trim() || undefined,
      summary: summary.trim() || undefined,
      duration: duration || 30,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-[520px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h3 className="font-display text-sm font-semibold">{isZh ? '添加到交易室' : 'Add to Deal Room'}</h3>
          <button onClick={onClose} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Meeting Type */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2 block">{isZh ? '类型' : 'Type'}</label>
            <div className="grid grid-cols-3 gap-2">
              {MEETING_TYPES.map(t => {
                const tc = getInteractionTypeColor(t);
                const isActive = meetingType === t;
                return (
                  <button
                    key={t}
                    onClick={() => setMeetingType(t)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-[10px] font-medium transition-all ${
                      isActive
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border/30 bg-muted/20 text-muted-foreground hover:border-border/60 hover:bg-muted/40'
                    }`}
                  >
                    {getMeetingTypeLabel(t, isZh)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">{isZh ? '日期' : 'Date'}</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          {/* Key Participants */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">{isZh ? '关键参与人' : 'Key Participants'}</label>
            <input
              value={keyParticipant}
              onChange={e => setKeyParticipant(e.target.value)}
              placeholder={isZh ? '例如：杨楠, 霍光, 李明' : 'e.g., John Smith, Jane Doe'}
              className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground/40"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">{isZh ? '时长（分钟）' : 'Duration (min)'}</label>
            <input
              type="number"
              value={duration}
              onChange={e => setDuration(parseInt(e.target.value) || 0)}
              min={0}
              className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          {/* Meeting Notes / Content */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">
              {isZh ? '会议纪要 / 内容' : 'Meeting Notes / Content'}
            </label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder={isZh ? '粘贴会议转录或笔记...' : 'Paste meeting transcript or notes here...'}
              rows={6}
              className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground/40 resize-none"
            />
          </div>

          {/* File upload (optional) */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">{isZh ? '附件（可选）' : 'Attachment (optional)'}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*,video/*,.pdf"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-lg border-2 border-dashed border-border/40 hover:border-primary/30 bg-muted/10 hover:bg-muted/20 transition-all text-sm text-muted-foreground"
            >
              {selectedFile ? (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-foreground font-medium text-xs">{selectedFile.name}</span>
                  <span className="text-[10px] text-muted-foreground">({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span className="text-xs">{isZh ? '点击上传截图、PDF、录音等' : 'Upload screenshots, PDFs, recordings, etc.'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/30">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
            {isZh ? '取消' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (isZh ? '保存中...' : 'Saving...') : (isZh ? '添加到时间线' : 'Add to Timeline')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Snapshot Node (Tier 1: AI Insights) ────────────────────────────────────

function SnapshotNode({ snapshot, isExpanded, onToggle }: { snapshot: SnapshotData; isExpanded: boolean; onToggle: () => void }) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const source = snapshot.aiGenerated 
    ? (snapshot.interactionType || (isZh ? 'AI 分析' : 'AI Analysis'))
    : (isZh ? '初始评估' : 'Initial Assessment');

  return (
    <div className="cursor-pointer group" onClick={onToggle}>
      <Card className={`border-border/40 transition-all duration-200 ${isExpanded ? 'bg-card shadow-lg shadow-primary/5 border-primary/20' : 'bg-card/80 hover:bg-card hover:border-border/60'}`}>
        <CardContent className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-foreground">{isZh ? 'AI 交易洞察' : 'AI Deal Insight'}</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-primary/5 text-primary border-primary/20">
                    {source}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDate(new Date(snapshot.date).toISOString())}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${getConfidenceBg(snapshot.confidenceScore)}`}>
                {snapshot.confidenceScore}%
                {snapshot.confidenceChange !== 0 && (
                  <span className="ml-0.5">
                    {snapshot.confidenceChange > 0 ? (
                      <TrendingUp className="w-2.5 h-2.5 inline text-green-400" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5 inline text-red-400" />
                    )}
                  </span>
                )}
              </Badge>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          </div>

          {!isExpanded && snapshot.whatsHappening && (
            <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{snapshot.whatsHappening}</p>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="mt-3 space-y-3 border-t border-border/20 pt-3">
                  {snapshot.whatsHappening && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Activity className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">{isZh ? '当前动态' : "What's Happening"}</span>
                      </div>
                      <p className="text-[11px] text-foreground/80 leading-relaxed pl-4.5">{snapshot.whatsHappening}</p>
                    </div>
                  )}
                  {snapshot.whatsNext && snapshot.whatsNext.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <ArrowRight className="w-3 h-3 text-green-400" />
                        <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">{isZh ? '下一步计划' : "What's Next"}</span>
                      </div>
                      <div className="space-y-1.5 pl-4.5">
                        {snapshot.whatsNext.map((item, i) => (
                          <div key={i} className="text-[11px]">
                            <span className="text-foreground/80">{typeof item === 'string' ? item : item.action}</span>
                            {typeof item !== 'string' && item.rationale && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 italic">{item.rationale}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {snapshot.keyRisks && (snapshot.keyRisks as any[]).length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">{isZh ? '关键风险' : 'Key Risks'}</span>
                      </div>
                      <div className="space-y-1.5 pl-4.5">
                        {(snapshot.keyRisks as any[]).map((risk, i) => (
                          <div key={i} className="text-[11px]">
                            <span className="text-foreground/80">{formatKeyRisk(risk)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Meeting Node (Tier 2: External Interactions) ──────────────────────────

function MeetingNode({ meeting, isExpanded, onToggle, onEdit, onDelete }: { 
  meeting: MeetingData; isExpanded: boolean; onToggle: () => void;
  onEdit?: (id: number) => void; onDelete?: (id: number) => void;
}) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const tc = getInteractionTypeColor(meeting.type);

  return (
    <div className="cursor-pointer group" onClick={onToggle}>
      <Card className={`border-border/40 transition-all duration-200 ${isExpanded ? 'bg-card shadow-lg shadow-amber-500/5 border-amber-500/20' : 'bg-card/80 hover:bg-card hover:border-border/60'}`}>
        <CardContent className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center px-1.5 py-0 rounded-full text-[9px] font-semibold border h-4 ${tc.bg} ${tc.text} ${tc.border}`}>
                    {getMeetingTypeLabel(meeting.type, isZh)}
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-blue-500/5 text-blue-400 border-blue-500/20">
                    {isZh ? '外部' : 'External'}
                  </Badge>
                  {meeting.keyParticipant && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <User className="w-2.5 h-2.5" /> {meeting.keyParticipant}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{formatDate(new Date(meeting.date).toISOString())}</span>
                  {meeting.duration && meeting.duration > 0 && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {meeting.duration} {isZh ? '分钟' : 'min'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <button onClick={(e) => { e.stopPropagation(); onEdit(meeting.id); }} className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted transition-colors opacity-0 group-hover:opacity-100" title="Edit">
                  <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
                </button>
              )}
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          </div>

          {!isExpanded && (
            <div className="mt-2 flex gap-2">
              {meeting.attachmentUrl && (
                <div className="w-12 h-12 rounded-md overflow-hidden border border-border/30 shrink-0">
                  <img src={meeting.attachmentUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {meeting.summary && (
                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed flex-1">{meeting.summary}</p>
              )}
            </div>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="mt-3 border-t border-border/20 pt-3">
                  {meeting.summary ? (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {meeting.transcriptUrl ? (isZh ? '转录摘要' : 'Transcript Summary') : (isZh ? '会议纪要' : 'Meeting Notes')}
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{meeting.summary}</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/50 italic">{isZh ? '本次会议未记录笔记' : 'No notes recorded for this meeting'}</p>
                  )}
                  {/* Inline attachment preview (screenshots, images) */}
                  {meeting.attachmentUrl && (
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Image className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {isZh ? '原始附件' : 'Original Attachment'}
                        </span>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-border/30 bg-muted/20">
                        <img
                          src={meeting.attachmentUrl}
                          alt={isZh ? '附件预览' : 'Attachment preview'}
                          className="w-full max-h-[400px] object-contain cursor-zoom-in"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(meeting.attachmentUrl!, '_blank');
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {meeting.transcriptUrl && (
                    <div className="mt-2 p-2 rounded-md bg-muted/30 border border-border/20">
                      <div className="flex items-center gap-1.5">
                        <Upload className="w-3 h-3 text-primary" />
                        <span className="text-[10px] text-primary font-medium">{isZh ? '完整转录可查看' : 'Full transcript available'}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {onEdit && (
                      <button onClick={(e) => { e.stopPropagation(); onEdit(meeting.id); }} className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-[10px] text-muted-foreground hover:bg-muted transition-colors">
                        <Pencil className="w-2.5 h-2.5" /> {isZh ? '编辑' : 'Edit'}
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={(e) => { e.stopPropagation(); onDelete(meeting.id); }} className="flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/10 text-[10px] text-destructive hover:bg-destructive/20 transition-colors">
                        <Trash2 className="w-2.5 h-2.5" /> {isZh ? '删除' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Strategy Note Node (Internal) ─────────────────────────────────────────

function StrategyNode({ note, isExpanded, onToggle, onSwitchToStrategy }: {
  note: StrategyNoteData; isExpanded: boolean; onToggle: () => void;
  onSwitchToStrategy?: () => void;
}) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const catConfig = getStrategyCategoryConfig(isZh)[note.category] || getStrategyCategoryConfig(isZh).other;

  return (
    <div className="cursor-pointer group" onClick={onToggle}>
      <Card className={`border-border/40 transition-all duration-200 border-l-2 border-l-violet-500/60 ${isExpanded ? 'bg-card shadow-lg shadow-violet-500/5 border-violet-500/20' : 'bg-card/80 hover:bg-card hover:border-border/60'}`}>
        <CardContent className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-foreground">
                    {note.title || (isZh ? '内部策略笔记' : 'Internal Strategy Note')}
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-violet-500/10 text-violet-400 border-violet-500/20">
                    {isZh ? '内部' : 'Internal'}
                  </Badge>
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}>
                    {catConfig.label}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {note.date ? formatDate(new Date(note.date).toISOString()) : formatDate(new Date(note.createdAt).toISOString())}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onSwitchToStrategy && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSwitchToStrategy(); }}
                  className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                  title={isZh ? '在交易策略中查看' : 'View in Deal Strategy'}
                >
                  <ExternalLink className="w-2.5 h-2.5 text-violet-400" />
                </button>
              )}
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          </div>

          {!isExpanded && note.content && (
            <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{note.content}</p>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="mt-3 border-t border-border/20 pt-3">
                  <p className="text-[11px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  {onSwitchToStrategy && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSwitchToStrategy(); }}
                      className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-violet-500/10 text-[10px] text-violet-400 font-medium hover:bg-violet-500/20 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {isZh ? '在交易策略中编辑' : 'Edit in Deal Strategy'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Timeline Component ─────────────────────────────────────────────────

export default function DealTimeline({ snapshots, meetings, strategyNotes = [], companyInfo, companyName, onCreateMeeting, onEditMeeting, onDeleteMeeting, onSwitchToStrategy }: DealTimelineProps) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'insight' | 'external' | 'internal'>('all');

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateMeeting = (data: { date: string; type: string; keyParticipant?: string; summary?: string; duration?: number }) => {
    if (onCreateMeeting) {
      setIsSubmitting(true);
      onCreateMeeting(data);
      // Close dialog after a short delay (parent will handle the actual mutation)
      setTimeout(() => {
        setShowUpload(false);
        setIsSubmitting(false);
      }, 500);
    }
  };

  // Merge and sort events chronologically (newest first)
  const events = useMemo<TimelineEvent[]>(() => {
    const all: TimelineEvent[] = [
      ...snapshots.map(s => ({ kind: 'snapshot' as const, data: s, timestamp: new Date(s.date).getTime() })),
      ...meetings.map(m => ({ kind: 'meeting' as const, data: m, timestamp: new Date(m.date).getTime() })),
      ...strategyNotes
        .filter(n => n.date || n.createdAt) // Only show notes with a date
        .map(n => ({
          kind: 'strategy' as const,
          data: n,
          timestamp: n.date ? new Date(n.date).getTime() : new Date(n.createdAt).getTime(),
        })),
    ];
    return all.sort((a, b) => b.timestamp - a.timestamp);
  }, [snapshots, meetings, strategyNotes]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return events;
    return events.filter(e => {
      if (activeFilter === 'insight') return e.kind === 'snapshot';
      if (activeFilter === 'external') return e.kind === 'meeting';
      if (activeFilter === 'internal') return e.kind === 'strategy';
      return true;
    });
  }, [events, activeFilter]);

  // Group events by date
  const groupedByDate = useMemo(() => {
    const groups: { dateLabel: string; events: TimelineEvent[] }[] = [];
    let currentLabel = '';
    for (const event of filteredEvents) {
      const label = new Date(event.timestamp).toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (label !== currentLabel) {
        groups.push({ dateLabel: label, events: [event] });
        currentLabel = label;
      } else {
        groups[groups.length - 1].events.push(event);
      }
    }
    return groups;
  }, [filteredEvents, isZh]);

  // Stats
  const insightCount = events.filter(e => e.kind === 'snapshot').length;
  const externalCount = events.filter(e => e.kind === 'meeting').length;
  const internalCount = events.filter(e => e.kind === 'strategy').length;

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-sm font-semibold">{isZh ? '交易室' : 'Deal Room'}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isZh ? '所有交易相关内容集中管理 — 外部互动与内部策略' : 'All deal activity in one place — external interactions & internal strategy'}
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3 h-3" /> {isZh ? '添加' : 'Add'}
          </button>
        </div>

        {/* Filter Tabs with Internal/External distinction */}
        <div className="flex items-center gap-2 mb-5">
          {[
            { key: 'all' as const, label: isZh ? '全部' : 'All', count: events.length },
            { key: 'insight' as const, label: isZh ? 'AI 洞察' : 'AI Insights', count: insightCount, icon: Sparkles },
            { key: 'external' as const, label: isZh ? '外部互动' : 'External', count: externalCount, icon: Users },
            { key: 'internal' as const, label: isZh ? '内部策略' : 'Internal', count: internalCount, icon: Building2 },
          ].map(f => {
            const Icon = f.icon;
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                  isActive
                    ? f.key === 'internal' ? 'border-violet-500/30 bg-violet-500/10 text-violet-400' :
                      f.key === 'external' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                      'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border/20 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {f.label}
                <span className={`text-[9px] px-1.5 py-0 rounded-full ${isActive ? (f.key === 'internal' ? 'bg-violet-500/20' : f.key === 'external' ? 'bg-amber-500/20' : 'bg-primary/20') : 'bg-muted/40'}`}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Company Overview */}
        {companyInfo && (
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-card to-card/80 border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xs font-display font-semibold">{companyName || (isZh ? '公司' : 'Company')} {isZh ? '概览' : 'Overview'}</h4>
                    <p className="text-[9px] text-muted-foreground">{isZh ? '客户情报基线' : 'Account intelligence baseline'}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{companyInfo}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Timeline */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground/60">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">
              {activeFilter === 'all' ? (isZh ? '暂无活动' : 'No activity yet') :
               activeFilter === 'internal' ? (isZh ? '暂无内部策略记录' : 'No internal strategy notes yet') :
               activeFilter === 'external' ? (isZh ? '暂无外部互动记录' : 'No external interactions yet') :
               (isZh ? '暂无 AI 洞察' : 'No AI insights yet')}
            </p>
            <p className="text-xs mt-1">
              {activeFilter === 'all'
                ? (isZh ? '上传会议记录、添加笔记或运行分析来构建交易室' : 'Upload meeting transcripts, add notes, or run an analysis to build the deal room')
                : activeFilter === 'internal'
                ? (isZh ? '在"交易策略"标签页添加内部策略笔记，它们会自动出现在时间线上' : 'Add internal strategy notes in the "Deal Strategy" tab — they\'ll appear here automatically')
                : (isZh ? '点击"+ 添加"开始添加内容' : 'Click "+ Add" to start adding items')}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Center vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border/40" />

            {groupedByDate.map((group, gi) => (
              <div key={gi} className="relative">
                {/* Date marker */}
                <div className="relative flex items-center mb-4 ml-0">
                  <div className="relative z-10 px-3 py-1 rounded-full bg-muted border border-border/40 text-[10px] font-semibold text-muted-foreground ml-1">
                    <Calendar className="w-3 h-3 inline mr-1 -mt-0.5" />
                    {group.dateLabel}
                  </div>
                </div>

                {/* Events in this date group */}
                {group.events.map((event) => {
                  const eventId = `${event.kind}-${event.data.id}`;
                  const isExpanded = expandedIds.has(eventId);
                  // Color coding: AI=primary, External=amber, Internal=violet
                  const tierColor = event.kind === 'snapshot' ? 'bg-primary border-primary/60' :
                    event.kind === 'meeting' ? 'bg-amber-400 border-amber-400/60' :
                    'bg-violet-400 border-violet-400/60';

                  return (
                    <div key={eventId} className="relative mb-3 pl-14">
                      {/* Timeline dot */}
                      <div className="absolute left-[19px] top-4 z-10">
                        <div className={`w-3 h-3 rounded-full border-2 shadow-sm ${tierColor}`} />
                      </div>

                      {/* Content */}
                      <div className="w-full">
                        {event.kind === 'snapshot' && (
                          <SnapshotNode snapshot={event.data as SnapshotData} isExpanded={isExpanded} onToggle={() => toggleExpand(eventId)} />
                        )}
                        {event.kind === 'meeting' && (
                          <MeetingNode meeting={event.data as MeetingData} isExpanded={isExpanded} onToggle={() => toggleExpand(eventId)} onEdit={onEditMeeting} onDelete={onDeleteMeeting} />
                        )}
                        {event.kind === 'strategy' && (
                          <StrategyNode note={event.data as StrategyNoteData} isExpanded={isExpanded} onToggle={() => toggleExpand(eventId)} onSwitchToStrategy={onSwitchToStrategy} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Timeline start marker */}
            <div className="relative flex items-center mt-2 ml-0">
              <div className="relative z-10 ml-1 w-8 h-8 rounded-full bg-muted/80 border border-border/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-muted-foreground/40" />
              </div>
              <p className="text-[10px] text-muted-foreground/40 ml-3">{isZh ? '交易创建' : 'Deal created'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      {showUpload && (
        <UploadDialog
          onClose={() => setShowUpload(false)}
          onSubmit={handleCreateMeeting}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
