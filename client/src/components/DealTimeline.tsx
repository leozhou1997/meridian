import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, MessageSquare, FileText, Calendar, Clock, User,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertTriangle,
  ArrowRight, Plus, Pencil, Check, Trash2, Globe,
  Upload, Bot, Activity, Image,
  Layers, ExternalLink, X,
  Building2, Users, Phone, Mail, MapPin, MessageCircle, Clipboard
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, getConfidenceColor, getConfidenceBg } from '@/lib/data';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { RichTextEditor } from './RichTextEditor';

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

// ─── Entry Type Config ──────────────────────────────────────────────────────

interface EntryTypeConfig {
  key: string;
  label: string;
  labelZh: string;
  icon: typeof MessageSquare;
  apiType: string; // maps to the meeting.type stored in DB
  color: string;
  bgColor: string;
  borderColor: string;
}

const ENTRY_TYPES: EntryTypeConfig[] = [
  { key: 'meeting', label: 'Meeting Notes', labelZh: '会议纪要', icon: Users, apiType: 'Discovery Call', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { key: 'call', label: 'Phone Call', labelZh: '电话记录', icon: Phone, apiType: 'Follow-up', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { key: 'email', label: 'Email Summary', labelZh: '邮件摘要', icon: Mail, apiType: 'Follow-up', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
  { key: 'visit', label: 'Site Visit', labelZh: '现场拜访', icon: MapPin, apiType: 'Executive Briefing', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { key: 'demo', label: 'Demo / POC', labelZh: '演示/POC', icon: Activity, apiType: 'Demo', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { key: 'feedback', label: 'Client Feedback', labelZh: '客户反馈', icon: MessageCircle, apiType: 'Follow-up', color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  { key: 'internal', label: 'Internal Note', labelZh: '内部讨论', icon: Clipboard, apiType: 'Follow-up', color: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInteractionTypeColor(type: string) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    'Discovery Call': { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
    'Demo': { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
    'Technical Review': { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
    'POC Check-in': { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
    'Negotiation': { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
    'Executive Briefing': { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' },
    'Follow-up': { bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20' },
  };
  return map[type] || map['Follow-up'];
}

function getMeetingTypeLabel(type: string, isZh: boolean): string {
  const map: Record<string, string> = {
    'Discovery Call': isZh ? '会议' : 'Meeting',
    'Demo': isZh ? '演示' : 'Demo',
    'Technical Review': isZh ? '技术评审' : 'Tech Review',
    'POC Check-in': isZh ? 'POC' : 'POC',
    'Negotiation': isZh ? '商务谈判' : 'Negotiation',
    'Executive Briefing': isZh ? '拜访' : 'Visit',
    'Follow-up': isZh ? '跟进' : 'Follow-up',
  };
  return map[type] || type;
}

function getStrategyCategoryConfig(isZh: boolean) {
  return {
    pricing: { label: isZh ? '定价策略' : 'Pricing', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    relationship: { label: isZh ? '关系策略' : 'Relationship', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    competitive: { label: isZh ? '竞争情报' : 'Competitive', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    internal: { label: isZh ? '内部对齐' : 'Internal', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    other: { label: isZh ? '其他' : 'Other', color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-border/30' },
  } as Record<string, { label: string; color: string; bg: string; border: string }>;
}

function formatKeyRisk(risk: { title: string; detail: string; stakeholders: string[] } | string): string {
  if (typeof risk === 'string') return risk;
  return risk.title;
}

// Strip HTML tags for plain text preview
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// ─── Add Entry Dialog (Notion-style) ────────────────────────────────────────

function AddEntryDialog({ onClose, onSubmit, isSubmitting }: {
  onClose: () => void;
  onSubmit: (data: { date: string; type: string; keyParticipant?: string; summary?: string; duration?: number }) => void;
  isSubmitting?: boolean;
}) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const [selectedType, setSelectedType] = useState<string>('meeting');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [keyParticipant, setKeyParticipant] = useState('');
  const [duration, setDuration] = useState(30);
  const [richContent, setRichContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeType = ENTRY_TYPES.find(t => t.key === selectedType) || ENTRY_TYPES[0];

  const handleSubmit = () => {
    // Convert rich HTML to plain text for storage (backend stores as text)
    const plainText = stripHtml(richContent).trim();
    onSubmit({
      date,
      type: activeType.apiType,
      keyParticipant: keyParticipant.trim() || undefined,
      summary: richContent.trim() || plainText || undefined,
      duration: duration || 30,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border/40 rounded-xl shadow-2xl w-[600px] max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${activeType.bgColor}`}>
              <activeType.icon size={14} className={activeType.color} />
            </div>
            <h3 className="text-sm font-semibold">{isZh ? '新增记录' : 'New Entry'}</h3>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Entry type selector — horizontal pills */}
        <div className="px-5 py-3 border-b border-border/10 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {ENTRY_TYPES.map(type => {
              const Icon = type.icon;
              const isActive = selectedType === type.key;
              return (
                <button
                  key={type.key}
                  onClick={() => setSelectedType(type.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all border ${
                    isActive
                      ? `${type.bgColor} ${type.color} ${type.borderColor}`
                      : 'border-transparent text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon size={12} />
                  {isZh ? type.labelZh : type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Metadata row — compact inline */}
        <div className="px-5 py-3 border-b border-border/10 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date */}
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-muted-foreground" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-transparent border-0 text-xs text-foreground outline-none w-[120px] cursor-pointer"
              />
            </div>

            <div className="w-px h-4 bg-border/30" />

            {/* Participants */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
              <User size={12} className="text-muted-foreground shrink-0" />
              <input
                value={keyParticipant}
                onChange={e => setKeyParticipant(e.target.value)}
                placeholder={isZh ? '参与人...' : 'Participants...'}
                className="bg-transparent border-0 text-xs text-foreground outline-none flex-1 placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="w-px h-4 bg-border/30" />

            {/* Duration */}
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-muted-foreground" />
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value) || 0)}
                min={0}
                className="bg-transparent border-0 text-xs text-foreground outline-none w-[40px] text-center"
              />
              <span className="text-[10px] text-muted-foreground">{isZh ? '分钟' : 'min'}</span>
            </div>
          </div>
        </div>

        {/* Rich text editor — main content area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3">
          <RichTextEditor
            placeholder={isZh ? '输入内容... 支持标题、列表、引用等格式' : 'Type here... Supports headings, lists, quotes, etc.'}
            onChange={setRichContent}
            minHeight="200px"
            autoFocus
          />

          {/* File attachment */}
          <div className="mt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border/40 hover:border-primary/30 bg-muted/5 hover:bg-muted/10 transition-all text-xs text-muted-foreground w-full"
            >
              {selectedFile ? (
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-emerald-500" />
                  <span className="text-foreground font-medium">{selectedFile.name}</span>
                  <span className="text-[10px] text-muted-foreground">({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    className="ml-auto hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={12} />
                  <span>{isZh ? '添加附件（截图、PDF、录音等）' : 'Add attachment (screenshots, PDFs, recordings)'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/20 shrink-0 bg-muted/10">
          <p className="text-[10px] text-muted-foreground">
            {isZh ? '支持 Markdown 快捷键 · # 标题 · ** 加粗 · - 列表' : 'Supports Markdown shortcuts · # heading · ** bold · - list'}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
              {isZh ? '取消' : 'Cancel'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (isZh ? '保存中...' : 'Saving...') : (isZh ? '保存' : 'Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Snapshot Node (AI Insights) ────────────────────────────────────────────

function SnapshotNode({ snapshot, isExpanded, onToggle }: { snapshot: SnapshotData; isExpanded: boolean; onToggle: () => void }) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const source = snapshot.aiGenerated 
    ? (snapshot.interactionType || (isZh ? 'AI 分析' : 'AI Analysis'))
    : (isZh ? '初始评估' : 'Initial Assessment');

  return (
    <div className="cursor-pointer group" onClick={onToggle}>
      <Card className={`border-border/20 transition-all duration-200 ${isExpanded ? 'bg-card shadow-sm border-primary/20' : 'bg-card/80 hover:bg-card hover:border-border/40'}`}>
        <CardContent className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-primary" />
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
                      <TrendingUp size={10} className="inline text-green-500" />
                    ) : (
                      <TrendingDown size={10} className="inline text-red-500" />
                    )}
                  </span>
                )}
              </Badge>
              {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
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
                        <Activity size={12} className="text-blue-500" />
                        <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">{isZh ? '当前动态' : "What's Happening"}</span>
                      </div>
                      <p className="text-[11px] text-foreground/80 leading-relaxed pl-4.5">{snapshot.whatsHappening}</p>
                    </div>
                  )}
                  {snapshot.whatsNext && snapshot.whatsNext.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <ArrowRight size={12} className="text-green-500" />
                        <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">{isZh ? '下一步计划' : "What's Next"}</span>
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
                        <AlertTriangle size={12} className="text-red-500" />
                        <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">{isZh ? '关键风险' : 'Key Risks'}</span>
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

// ─── Meeting Node (External Interactions) ───────────────────────────────────

function MeetingNode({ meeting, isExpanded, onToggle, onEdit, onDelete }: { 
  meeting: MeetingData; isExpanded: boolean; onToggle: () => void;
  onEdit?: (id: number) => void; onDelete?: (id: number) => void;
}) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const tc = getInteractionTypeColor(meeting.type);

  return (
    <div className="cursor-pointer group" onClick={onToggle}>
      <Card className={`border-border/20 transition-all duration-200 ${isExpanded ? 'bg-card shadow-sm border-blue-500/20' : 'bg-card/80 hover:bg-card hover:border-border/40'}`}>
        <CardContent className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                <MessageSquare size={14} className="text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center px-1.5 py-0 rounded text-[9px] font-semibold border h-4 ${tc.bg} ${tc.text} ${tc.border}`}>
                    {getMeetingTypeLabel(meeting.type, isZh)}
                  </span>
                  {meeting.keyParticipant && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <User size={10} /> {meeting.keyParticipant}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{formatDate(new Date(meeting.date).toISOString())}</span>
                  {meeting.duration && meeting.duration > 0 && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock size={10} /> {meeting.duration} {isZh ? '分钟' : 'min'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <button onClick={(e) => { e.stopPropagation(); onEdit(meeting.id); }} className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted transition-colors opacity-0 group-hover:opacity-100" title="Edit">
                  <Pencil size={10} className="text-muted-foreground" />
                </button>
              )}
              {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
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
                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                  {meeting.summary.startsWith('<') ? stripHtml(meeting.summary) : meeting.summary}
                </p>
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
                        <FileText size={12} className="text-muted-foreground" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {meeting.transcriptUrl ? (isZh ? '转录摘要' : 'Transcript Summary') : (isZh ? '内容' : 'Content')}
                        </span>
                      </div>
                      {meeting.summary.startsWith('<') ? (
                        <div 
                          className="text-[11px] text-foreground/80 leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-headings:text-foreground prose-headings:mt-2 prose-headings:mb-1"
                          dangerouslySetInnerHTML={{ __html: meeting.summary }}
                        />
                      ) : (
                        <p className="text-[11px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{meeting.summary}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/50 italic">{isZh ? '未记录内容' : 'No content recorded'}</p>
                  )}
                  {meeting.attachmentUrl && (
                    <div className="mt-3">
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
                  <div className="flex gap-2 mt-3">
                    {onEdit && (
                      <button onClick={(e) => { e.stopPropagation(); onEdit(meeting.id); }} className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-[10px] text-muted-foreground hover:bg-muted transition-colors">
                        <Pencil size={10} /> {isZh ? '编辑' : 'Edit'}
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={(e) => { e.stopPropagation(); onDelete(meeting.id); }} className="flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/10 text-[10px] text-destructive hover:bg-destructive/20 transition-colors">
                        <Trash2 size={10} /> {isZh ? '删除' : 'Delete'}
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

// ─── Strategy Note Node (Internal) ──────────────────────────────────────────

function StrategyNode({ note, isExpanded, onToggle, onSwitchToStrategy }: {
  note: StrategyNoteData; isExpanded: boolean; onToggle: () => void;
  onSwitchToStrategy?: () => void;
}) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const catConfig = getStrategyCategoryConfig(isZh)[note.category] || getStrategyCategoryConfig(isZh).other;

  return (
    <div className="cursor-pointer group" onClick={onToggle}>
      <Card className={`border-border/20 transition-all duration-200 border-l-2 border-l-violet-400/50 ${isExpanded ? 'bg-card shadow-sm border-violet-500/20' : 'bg-card/80 hover:bg-card hover:border-border/40'}`}>
        <CardContent className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                <Building2 size={14} className="text-violet-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-foreground">
                    {note.title || (isZh ? '内部策略笔记' : 'Internal Strategy Note')}
                  </span>
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
                  <ExternalLink size={10} className="text-violet-500" />
                </button>
              )}
              {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
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
                      className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-violet-500/10 text-[10px] text-violet-600 font-medium hover:bg-violet-500/20 transition-colors"
                    >
                      <ExternalLink size={12} />
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

// ─── Main Timeline Component ────────────────────────────────────────────────

export default function DealTimeline({ snapshots, meetings, strategyNotes = [], companyInfo, companyName, onCreateMeeting, onEditMeeting, onDeleteMeeting, onSwitchToStrategy }: DealTimelineProps) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAddEntry, setShowAddEntry] = useState(false);
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
      setTimeout(() => {
        setShowAddEntry(false);
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
        .filter(n => n.date || n.createdAt)
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
            onClick={() => setShowAddEntry(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={12} /> {isZh ? '添加记录' : 'Add Entry'}
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 mb-5">
          {[
            { key: 'all' as const, label: isZh ? '全部' : 'All', count: events.length },
            { key: 'insight' as const, label: isZh ? 'AI 洞察' : 'AI', count: insightCount, icon: Sparkles },
            { key: 'external' as const, label: isZh ? '外部互动' : 'External', count: externalCount, icon: Users },
            { key: 'internal' as const, label: isZh ? '内部策略' : 'Internal', count: internalCount, icon: Building2 },
          ].map(f => {
            const Icon = f.icon;
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
              >
                {Icon && <Icon size={12} />}
                {f.label}
                <span className={`text-[9px] tabular-nums ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Company Overview */}
        {companyInfo && (
          <div className="mb-6">
            <Card className="border-border/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe size={16} className="text-primary" />
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
            <Layers size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">
              {activeFilter === 'all' ? (isZh ? '暂无活动' : 'No activity yet') :
               activeFilter === 'internal' ? (isZh ? '暂无内部策略记录' : 'No internal strategy notes yet') :
               activeFilter === 'external' ? (isZh ? '暂无外部互动记录' : 'No external interactions yet') :
               (isZh ? '暂无 AI 洞察' : 'No AI insights yet')}
            </p>
            <p className="text-xs mt-1">
              {activeFilter === 'all'
                ? (isZh ? '点击"+ 添加记录"开始构建交易室' : 'Click "+ Add Entry" to start building the deal room')
                : (isZh ? '切换筛选或添加新内容' : 'Switch filter or add new content')}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Center vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border/30" />

            {groupedByDate.map((group, gi) => (
              <div key={gi} className="relative">
                {/* Date marker */}
                <div className="relative flex items-center mb-4 ml-0">
                  <div className="relative z-10 px-3 py-1 rounded-full bg-muted border border-border/30 text-[10px] font-semibold text-muted-foreground ml-1">
                    <Calendar size={12} className="inline mr-1 -mt-0.5" />
                    {group.dateLabel}
                  </div>
                </div>

                {/* Events in this date group */}
                {group.events.map((event) => {
                  const eventId = `${event.kind}-${event.data.id}`;
                  const isExpanded = expandedIds.has(eventId);
                  const tierColor = event.kind === 'snapshot' ? 'bg-primary border-primary/60' :
                    event.kind === 'meeting' ? 'bg-blue-400 border-blue-400/60' :
                    'bg-violet-400 border-violet-400/60';

                  return (
                    <div key={eventId} className="relative mb-3 pl-14">
                      {/* Timeline dot */}
                      <div className="absolute left-[19px] top-4 z-10">
                        <div className={`w-2.5 h-2.5 rounded-full border-2 shadow-sm ${tierColor}`} />
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
              <div className="relative z-10 ml-1 w-8 h-8 rounded-full bg-muted/80 border border-border/30 flex items-center justify-center">
                <Sparkles size={16} className="text-muted-foreground/40" />
              </div>
              <p className="text-[10px] text-muted-foreground/40 ml-3">{isZh ? '交易创建' : 'Deal created'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Entry Dialog */}
      {showAddEntry && (
        <AddEntryDialog
          onClose={() => setShowAddEntry(false)}
          onSubmit={handleCreateMeeting}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
