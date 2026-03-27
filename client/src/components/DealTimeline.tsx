import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, MessageSquare, FileText, Calendar, Clock, User,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertTriangle,
  Lightbulb, ArrowRight, Plus, Pencil, Check, Trash2, Globe,
  Upload, Bot, Activity
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, getConfidenceColor, getConfidenceBg } from '@/lib/data';

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

type TimelineEvent = 
  | { kind: 'snapshot'; data: SnapshotData; timestamp: number }
  | { kind: 'meeting'; data: MeetingData; timestamp: number };

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

function formatKeyRiskDetail(risk: { title: string; detail: string; stakeholders: string[] } | string): string | null {
  if (typeof risk === 'string') return null;
  return risk.detail;
}

// ─── Snapshot Node (Left Side) ───────────────────────────────────────────────

function SnapshotNode({ snapshot, isExpanded, onToggle }: { snapshot: SnapshotData; isExpanded: boolean; onToggle: () => void }) {
  const isEarlyStage = !snapshot.aiGenerated && !snapshot.interactionType;
  const source = snapshot.aiGenerated 
    ? (snapshot.interactionType || 'AI Analysis')
    : 'Initial Assessment';

  return (
    <div className="cursor-pointer group" onClick={onToggle}>
      <Card className={`border-border/40 transition-all duration-200 ${isExpanded ? 'bg-card shadow-lg shadow-primary/5 border-primary/20' : 'bg-card/80 hover:bg-card hover:border-border/60'}`}>
        <CardContent className="p-3.5">
          {/* Header - always visible */}
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
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </div>

          {/* Preview - collapsed state */}
          {!isExpanded && snapshot.whatsHappening && (
            <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
              {snapshot.whatsHappening}
            </p>
          )}

          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3 border-t border-border/20 pt-3">
                  {/* What's Happening */}
                  {snapshot.whatsHappening && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Activity className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">What's Happening</span>
                      </div>
                      <p className="text-[11px] text-foreground/80 leading-relaxed pl-4.5">
                        {snapshot.whatsHappening}
                      </p>
                    </div>
                  )}

                  {/* What's Next */}
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

                  {/* Key Risks */}
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
                            {formatKeyRiskDetail(risk) && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">{formatKeyRiskDetail(risk)}</p>
                            )}
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

// ─── Meeting Node (Right Side) ───────────────────────────────────────────────

function MeetingNode({ meeting, isExpanded, onToggle, onEdit, onDelete }: { 
  meeting: MeetingData; 
  isExpanded: boolean; 
  onToggle: () => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}) {
  const tc = getInteractionTypeColor(meeting.type);

  return (
    <div className="cursor-pointer group" onClick={onToggle}>
      <Card className={`border-border/40 transition-all duration-200 ${isExpanded ? 'bg-card shadow-lg shadow-amber-500/5 border-amber-500/20' : 'bg-card/80 hover:bg-card hover:border-border/60'}`}>
        <CardContent className="p-3.5">
          {/* Header - always visible */}
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
                      <User className="w-2.5 h-2.5" />
                      {meeting.keyParticipant}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(new Date(meeting.date).toISOString())}
                  </span>
                  {meeting.duration && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {meeting.duration} min
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(meeting.id); }}
                  className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                  title="Edit"
                >
                  <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
                </button>
              )}
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </div>

          {/* Preview - collapsed state */}
          {!isExpanded && meeting.summary && (
            <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
              {meeting.summary}
            </p>
          )}

          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 border-t border-border/20 pt-3">
                  {meeting.summary ? (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {meeting.transcriptUrl ? 'Transcript Summary' : 'Meeting Notes'}
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {meeting.summary}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/50 italic">No notes recorded for this meeting</p>
                  )}
                  
                  {/* Transcript link if available */}
                  {meeting.transcriptUrl && (
                    <div className="mt-2 p-2 rounded-md bg-muted/30 border border-border/20">
                      <div className="flex items-center gap-1.5">
                        <Upload className="w-3 h-3 text-primary" />
                        <span className="text-[10px] text-primary font-medium">Full transcript available</span>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    {onEdit && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(meeting.id); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-2.5 h-2.5" /> Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(meeting.id); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/10 text-[10px] text-destructive hover:bg-destructive/20 transition-colors"
                      >
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

// ─── Main Timeline Component ─────────────────────────────────────────────────

export default function DealTimeline({ snapshots, meetings, companyInfo, companyName, onAddMeeting, onEditMeeting, onDeleteMeeting }: DealTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Merge and sort events chronologically (newest first)
  const events = useMemo<TimelineEvent[]>(() => {
    const all: TimelineEvent[] = [
      ...snapshots.map(s => ({
        kind: 'snapshot' as const,
        data: s,
        timestamp: new Date(s.date).getTime(),
      })),
      ...meetings.map(m => ({
        kind: 'meeting' as const,
        data: m,
        timestamp: new Date(m.date).getTime(),
      })),
    ];
    return all.sort((a, b) => b.timestamp - a.timestamp);
  }, [snapshots, meetings]);

  // Group events by date
  const groupedByDate = useMemo(() => {
    const groups: { dateLabel: string; events: TimelineEvent[] }[] = [];
    let currentLabel = '';
    for (const event of events) {
      const label = new Date(event.timestamp).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
      });
      if (label !== currentLabel) {
        groups.push({ dateLabel: label, events: [event] });
        currentLabel = label;
      } else {
        groups[groups.length - 1].events.push(event);
      }
    }
    return groups;
  }, [events]);

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-sm font-semibold">Deal Timeline</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {snapshots.length} insight{snapshots.length !== 1 ? 's' : ''} · {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
            </p>
          </div>
          {onAddMeeting && (
            <button
              onClick={onAddMeeting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Meeting
            </button>
          )}
        </div>

        {/* Company Overview anchor */}
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
        {events.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground/60">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-xs mt-1">Upload meeting transcripts or run an analysis to see the deal timeline</p>
          </div>
        ) : (
          <div className="relative">
            {/* Center vertical line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/40 -translate-x-1/2" />

            {groupedByDate.map((group, gi) => (
              <div key={gi} className="relative">
                {/* Date marker on the center line */}
                <div className="relative flex justify-center mb-4">
                  <div className="relative z-10 px-3 py-1 rounded-full bg-muted border border-border/40 text-[10px] font-semibold text-muted-foreground">
                    <Calendar className="w-3 h-3 inline mr-1 -mt-0.5" />
                    {group.dateLabel}
                  </div>
                </div>

                {/* Events in this date group */}
                {group.events.map((event, ei) => {
                  const eventId = `${event.kind}-${event.data.id}`;
                  const isExpanded = expandedIds.has(eventId);
                  const isSnapshot = event.kind === 'snapshot';

                  return (
                    <div key={eventId} className="relative mb-4">
                      {/* Timeline dot on center line */}
                      <div className="absolute left-1/2 top-4 -translate-x-1/2 z-10">
                        <div className={`w-3 h-3 rounded-full border-2 ${
                          isSnapshot 
                            ? 'bg-primary border-primary/60 shadow-sm shadow-primary/20' 
                            : 'bg-amber-400 border-amber-400/60 shadow-sm shadow-amber-400/20'
                        }`} />
                      </div>

                      {/* Content - left or right based on type */}
                      <div className={`flex ${isSnapshot ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'}`}>
                        <div className="w-full">
                          {isSnapshot ? (
                            <SnapshotNode
                              snapshot={event.data as SnapshotData}
                              isExpanded={isExpanded}
                              onToggle={() => toggleExpand(eventId)}
                            />
                          ) : (
                            <MeetingNode
                              meeting={event.data as MeetingData}
                              isExpanded={isExpanded}
                              onToggle={() => toggleExpand(eventId)}
                              onEdit={onEditMeeting}
                              onDelete={onDeleteMeeting}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Timeline start marker */}
            <div className="relative flex justify-center mt-2">
              <div className="relative z-10 w-8 h-8 rounded-full bg-muted/80 border border-border/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-muted-foreground/40" />
              </div>
            </div>
            <p className="text-center text-[10px] text-muted-foreground/40 mt-1 mb-4">Deal created</p>
          </div>
        )}
      </div>
    </div>
  );
}
