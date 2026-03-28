import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, MessageSquare, FileText, Calendar, Clock, User,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertTriangle,
  Lightbulb, ArrowRight, Plus, Pencil, Check, Trash2, Globe,
  Upload, Bot, Activity, Image, Video, File, Mic, Send,
  Filter, Layers, StickyNote, ExternalLink, Paperclip, X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, getConfidenceColor, getConfidenceBg } from '@/lib/data';
import { toast } from 'sonner';

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
  createdAt: Date | string;
}

// New: generic content item for the content hub
interface ContentItem {
  id: string;
  type: 'note' | 'screenshot' | 'pdf' | 'video' | 'audio' | 'action';
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  timestamp: number;
  category: 'insight' | 'note' | 'action'; // tier 1, 2, 3
}

type TimelineEvent = 
  | { kind: 'snapshot'; data: SnapshotData; timestamp: number }
  | { kind: 'meeting'; data: MeetingData; timestamp: number }
  | { kind: 'content'; data: ContentItem; timestamp: number };

interface DealTimelineProps {
  snapshots: SnapshotData[];
  meetings: MeetingData[];
  companyInfo?: string | null;
  companyName?: string;
  onAddMeeting?: () => void;
  onEditMeeting?: (id: number) => void;
  onDeleteMeeting?: (id: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInteractionTypeColor(type: string) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    'Discovery Call': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    'Demo': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    'Technical Review': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    'POC Check-in': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    'Negotiation': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    'Executive Briefing': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    'Follow-up': { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  };
  return map[type] || { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-border/30' };
}

function formatKeyRisk(risk: { title: string; detail: string; stakeholders: string[] } | string): string {
  if (typeof risk === 'string') return risk;
  return risk.title;
}

const CONTENT_TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  note: { icon: StickyNote, label: 'Note', color: 'text-blue-400' },
  screenshot: { icon: Image, label: 'Screenshot', color: 'text-purple-400' },
  pdf: { icon: FileText, label: 'PDF Document', color: 'text-red-400' },
  video: { icon: Video, label: 'Video/Recording', color: 'text-amber-400' },
  audio: { icon: Mic, label: 'Audio Recording', color: 'text-green-400' },
  action: { icon: Send, label: 'Sales Action', color: 'text-cyan-400' },
};

const TIER_CONFIG = {
  insight: { label: 'AI Insights', icon: Sparkles, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  note: { label: 'Notes & Media', icon: Paperclip, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  action: { label: 'Sales Actions', icon: Send, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
};

// ─── Upload Dialog ──────────────────────────────────────────────────────────

function UploadDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (item: ContentItem) => void }) {
  const [uploadType, setUploadType] = useState<ContentItem['type']>('note');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadTypes: { value: ContentItem['type']; label: string; icon: any; accept?: string }[] = [
    { value: 'note', label: 'Meeting Notes', icon: MessageSquare },
    { value: 'audio', label: 'Audio / Video', icon: Mic, accept: 'audio/*,video/*' },
    { value: 'screenshot', label: 'Screenshot', icon: Image, accept: 'image/*' },
    { value: 'pdf', label: 'PDF Document', icon: File, accept: '.pdf' },
    { value: 'action', label: 'Sales Action', icon: Send },
  ];

  const needsFile = ['audio', 'video', 'screenshot', 'pdf'].includes(uploadType);
  const category: ContentItem['category'] = uploadType === 'action' ? 'action' : 'note';

  const handleSubmit = () => {
    if (!title.trim()) { toast.error('Please enter a title'); return; }
    const item: ContentItem = {
      id: `content-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: uploadType,
      title: title.trim(),
      description: description.trim() || undefined,
      fileName: selectedFile?.name,
      fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
      timestamp: Date.now(),
      category,
    };
    onAdd(item);
    onClose();
    toast.success(`${CONTENT_TYPE_CONFIG[uploadType]?.label || 'Item'} added to timeline`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-[520px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h3 className="font-display text-sm font-semibold">Add to Deal Room</h3>
          <button onClick={onClose} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type selector */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2 block">Content Type</label>
            <div className="grid grid-cols-3 gap-2">
              {uploadTypes.map(ut => {
                const Icon = ut.icon;
                const isActive = uploadType === ut.value;
                return (
                  <button
                    key={ut.value}
                    onClick={() => { setUploadType(ut.value); setSelectedFile(null); }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[11px] font-medium transition-all ${
                      isActive
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border/30 bg-muted/20 text-muted-foreground hover:border-border/60 hover:bg-muted/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {ut.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={uploadType === 'action' ? 'e.g., Sent pricing proposal to CFO' : 'e.g., Discovery call with VP Engineering'}
              className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground/40"
            />
          </div>

          {/* Description / Content */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">
              {uploadType === 'note' ? 'Meeting Notes / Transcript Content' : uploadType === 'action' ? 'Action Details' : 'Description (optional)'}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={uploadType === 'note' ? 'Paste meeting transcript or notes here...' : 'Add details...'}
              rows={uploadType === 'note' ? 8 : 3}
              className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground/40 resize-none"
            />
          </div>

          {/* File upload */}
          {needsFile && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">File Upload</label>
              <input
                ref={fileInputRef}
                type="file"
                accept={uploadTypes.find(ut => ut.value === uploadType)?.accept}
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-border/40 hover:border-primary/30 bg-muted/10 hover:bg-muted/20 transition-all text-sm text-muted-foreground"
              >
                {selectedFile ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-foreground font-medium">{selectedFile.name}</span>
                    <span className="text-[10px] text-muted-foreground">({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Click to upload or drag and drop</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                {uploadType === 'audio' && 'Supported: MP3, WAV, M4A, WebM (max 16MB for transcription)'}
                {uploadType === 'video' && 'Supported: MP4, WebM, MOV'}
                {uploadType === 'screenshot' && 'Supported: PNG, JPG, WebP'}
                {uploadType === 'pdf' && 'Supported: PDF documents'}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/30">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Add to Timeline
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Snapshot Node (Tier 1: AI Insights) ────────────────────────────────────

function SnapshotNode({ snapshot, isExpanded, onToggle }: { snapshot: SnapshotData; isExpanded: boolean; onToggle: () => void }) {
  const source = snapshot.aiGenerated 
    ? (snapshot.interactionType || 'AI Analysis')
    : 'Initial Assessment';

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
                  <span className="text-[11px] font-semibold text-foreground">AI Deal Insight</span>
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
                        <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">What's Happening</span>
                      </div>
                      <p className="text-[11px] text-foreground/80 leading-relaxed pl-4.5">{snapshot.whatsHappening}</p>
                    </div>
                  )}
                  {snapshot.whatsNext && snapshot.whatsNext.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <ArrowRight className="w-3 h-3 text-green-400" />
                        <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">What's Next</span>
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
                        <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Key Risks</span>
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

// ─── Meeting Node (Tier 2: Notes & Media) ───────────────────────────────────

function MeetingNode({ meeting, isExpanded, onToggle, onEdit, onDelete }: { 
  meeting: MeetingData; isExpanded: boolean; onToggle: () => void;
  onEdit?: (id: number) => void; onDelete?: (id: number) => void;
}) {
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
                    {meeting.type}
                  </span>
                  {meeting.keyParticipant && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <User className="w-2.5 h-2.5" /> {meeting.keyParticipant}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{formatDate(new Date(meeting.date).toISOString())}</span>
                  {meeting.duration && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {meeting.duration} min
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

          {!isExpanded && meeting.summary && (
            <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{meeting.summary}</p>
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
                          {meeting.transcriptUrl ? 'Transcript Summary' : 'Meeting Notes'}
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{meeting.summary}</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/50 italic">No notes recorded for this meeting</p>
                  )}
                  {meeting.transcriptUrl && (
                    <div className="mt-2 p-2 rounded-md bg-muted/30 border border-border/20">
                      <div className="flex items-center gap-1.5">
                        <Upload className="w-3 h-3 text-primary" />
                        <span className="text-[10px] text-primary font-medium">Full transcript available</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {onEdit && (
                      <button onClick={(e) => { e.stopPropagation(); onEdit(meeting.id); }} className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-[10px] text-muted-foreground hover:bg-muted transition-colors">
                        <Pencil className="w-2.5 h-2.5" /> Edit
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={(e) => { e.stopPropagation(); onDelete(meeting.id); }} className="flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/10 text-[10px] text-destructive hover:bg-destructive/20 transition-colors">
                        <Trash2 className="w-2.5 h-2.5" /> Delete
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

// ─── Content Node (Tier 2 & 3: Notes, Media, Actions) ──────────────────────

function ContentNode({ item, isExpanded, onToggle, onDelete }: {
  item: ContentItem; isExpanded: boolean; onToggle: () => void; onDelete: (id: string) => void;
}) {
  const config = CONTENT_TYPE_CONFIG[item.type] || CONTENT_TYPE_CONFIG.note;
  const Icon = config.icon;
  const tierConfig = TIER_CONFIG[item.category];

  return (
    <div className="cursor-pointer group" onClick={onToggle}>
      <Card className={`border-border/40 transition-all duration-200 ${isExpanded ? `bg-card shadow-lg ${tierConfig.border}` : 'bg-card/80 hover:bg-card hover:border-border/60'}`}>
        <CardContent className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className={`w-6 h-6 rounded-md ${tierConfig.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-foreground">{item.title}</span>
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${tierConfig.bg} ${tierConfig.color} ${tierConfig.border}`}>
                    {config.label}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-2.5 h-2.5 text-muted-foreground" />
              </button>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          </div>

          {!isExpanded && item.description && (
            <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="mt-3 border-t border-border/20 pt-3 space-y-2">
                  {item.description && (
                    <p className="text-[11px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                  )}
                  {item.fileName && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border/20">
                      <Paperclip className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-foreground/70 font-medium">{item.fileName}</span>
                      {item.type === 'audio' && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-400 border-amber-500/20 ml-auto">
                          Pending transcription
                        </Badge>
                      )}
                      {item.type === 'pdf' && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-400 border-amber-500/20 ml-auto">
                          Pending extraction
                        </Badge>
                      )}
                    </div>
                  )}
                  {item.type === 'screenshot' && item.fileUrl && (
                    <div className="rounded-lg overflow-hidden border border-border/20 bg-muted/20">
                      <img src={item.fileUrl} alt={item.title} className="w-full max-h-[300px] object-contain" />
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

// ─── Main Timeline Component ─────────────────────────────────────────────────

export default function DealTimeline({ snapshots, meetings, companyInfo, companyName, onAddMeeting, onEditMeeting, onDeleteMeeting }: DealTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'insight' | 'note' | 'action'>('all');

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addContent = (item: ContentItem) => {
    setContentItems(prev => [item, ...prev]);
  };

  const deleteContent = (id: string) => {
    setContentItems(prev => prev.filter(c => c.id !== id));
    toast.success('Item removed');
  };

  // Merge and sort events chronologically (newest first)
  const events = useMemo<TimelineEvent[]>(() => {
    const all: TimelineEvent[] = [
      ...snapshots.map(s => ({ kind: 'snapshot' as const, data: s, timestamp: new Date(s.date).getTime() })),
      ...meetings.map(m => ({ kind: 'meeting' as const, data: m, timestamp: new Date(m.date).getTime() })),
      ...contentItems.map(c => ({ kind: 'content' as const, data: c, timestamp: c.timestamp })),
    ];
    return all.sort((a, b) => b.timestamp - a.timestamp);
  }, [snapshots, meetings, contentItems]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return events;
    return events.filter(e => {
      if (activeFilter === 'insight') return e.kind === 'snapshot';
      if (activeFilter === 'note') return e.kind === 'meeting' || (e.kind === 'content' && e.data.category === 'note');
      if (activeFilter === 'action') return e.kind === 'content' && e.data.category === 'action';
      return true;
    });
  }, [events, activeFilter]);

  // Group events by date
  const groupedByDate = useMemo(() => {
    const groups: { dateLabel: string; events: TimelineEvent[] }[] = [];
    let currentLabel = '';
    for (const event of filteredEvents) {
      const label = new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (label !== currentLabel) {
        groups.push({ dateLabel: label, events: [event] });
        currentLabel = label;
      } else {
        groups[groups.length - 1].events.push(event);
      }
    }
    return groups;
  }, [filteredEvents]);

  // Stats
  const insightCount = events.filter(e => e.kind === 'snapshot').length;
  const noteCount = events.filter(e => e.kind === 'meeting' || (e.kind === 'content' && e.data.category === 'note')).length;
  const actionCount = events.filter(e => e.kind === 'content' && e.data.category === 'action').length;

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-sm font-semibold">Deal Room</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              All deal-related content in one place
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>

        {/* 3-Tier Filter Tabs */}
        <div className="flex items-center gap-2 mb-5">
          {[
            { key: 'all' as const, label: 'All', count: events.length },
            { key: 'insight' as const, label: 'AI Insights', count: insightCount, icon: Sparkles },
            { key: 'note' as const, label: 'Notes & Media', count: noteCount, icon: Paperclip },
            { key: 'action' as const, label: 'Sales Actions', count: actionCount, icon: Send },
          ].map(f => {
            const Icon = f.icon;
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                  isActive
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border/20 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {f.label}
                <span className={`text-[9px] px-1.5 py-0 rounded-full ${isActive ? 'bg-primary/20' : 'bg-muted/40'}`}>
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
                    <h4 className="text-xs font-display font-semibold">{companyName || 'Company'} Overview</h4>
                    <p className="text-[9px] text-muted-foreground">Account intelligence baseline</p>
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
              {activeFilter === 'all' ? 'No activity yet' : `No ${activeFilter === 'insight' ? 'AI insights' : activeFilter === 'note' ? 'notes or media' : 'sales actions'} yet`}
            </p>
            <p className="text-xs mt-1">
              {activeFilter === 'all'
                ? 'Upload meeting transcripts, add notes, or run an analysis to build the deal room'
                : 'Click "+ Add" to start adding items'}
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
                  const eventId = event.kind === 'content' ? event.data.id : `${event.kind}-${event.data.id}`;
                  const isExpanded = expandedIds.has(eventId);
                  const tierColor = event.kind === 'snapshot' ? 'bg-primary border-primary/60' :
                    event.kind === 'meeting' ? 'bg-amber-400 border-amber-400/60' :
                    (event.data as ContentItem).category === 'action' ? 'bg-cyan-400 border-cyan-400/60' : 'bg-blue-400 border-blue-400/60';

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
                        {event.kind === 'content' && (
                          <ContentNode item={event.data as ContentItem} isExpanded={isExpanded} onToggle={() => toggleExpand(eventId)} onDelete={deleteContent} />
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
              <p className="text-[10px] text-muted-foreground/40 ml-3">Deal created</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      {showUpload && <UploadDialog onClose={() => setShowUpload(false)} onAdd={addContent} />}
    </div>
  );
}
