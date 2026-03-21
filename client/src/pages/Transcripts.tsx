import { useState } from 'react';
import { deals, formatDate } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Clock, User, Search, ChevronDown, ChevronRight, Eye, Calendar, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const TYPE_COLORS: Record<string, string> = {
  'Discovery Call':      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Demo':                'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Technical Review':    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'POC Check-in':        'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Negotiation':         'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Executive Briefing':  'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Follow-up':           'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function Transcripts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [expandedDeals, setExpandedDeals] = useState<Set<string>>(new Set(deals.map(d => d.id)));
  const [selectedInteraction, setSelectedInteraction] = useState<{ dealName: string; dealLogo: string; type: string; date: string; duration: number; keyParticipant: string; summary: string; transcript?: string } | null>(null);

  const toggleDeal = (dealId: string) => {
    setExpandedDeals(prev => {
      const next = new Set(prev);
      if (next.has(dealId)) next.delete(dealId);
      else next.add(dealId);
      return next;
    });
  };

  const filteredDeals = deals.map(deal => ({
    ...deal,
    filteredInteractions: deal.interactions.filter(i =>
      i.keyParticipant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.company.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  })).filter(d => d.filteredInteractions.length > 0);

  const totalTranscripts = deals.reduce((sum, d) => sum + d.interactions.length, 0);
  const withFullText = deals.reduce((sum, d) => sum + d.interactions.filter(i => i.transcript).length, 0);

  return (
    <div className="p-6 max-w-[960px]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold mb-1">Transcripts</h1>
            <p className="text-muted-foreground text-sm">
              {totalTranscripts} interactions across {deals.length} deals · {withFullText} with full transcript
            </p>
          </div>
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button className="font-display text-xs gap-2 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                Upload Transcript
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Upload New Transcript</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-xs">Deal</Label>
                  <Select>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select deal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {deals.map(d => (
                        <SelectItem key={d.id} value={d.id} className="text-xs">{d.company}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Interaction Type</Label>
                    <Select>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {['Discovery Call', 'Demo', 'Technical Review', 'POC Check-in', 'Negotiation', 'Executive Briefing', 'Follow-up'].map(t => (
                          <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Key Participant</Label>
                    <Input placeholder="Name..." className="h-9 text-xs" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Transcript</Label>
                  <Textarea placeholder="Paste meeting transcript here..." className="min-h-[200px] text-xs font-mono" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowUpload(false)} className="text-xs font-display">Cancel</Button>
                  <Button size="sm" className="text-xs font-display" onClick={() => { toast.success('Transcript submitted! AI analysis will begin shortly.'); setShowUpload(false); }}>
                    Submit & Analyze
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by deal, participant, or topic..."
            className="pl-10 h-9 text-sm"
          />
        </div>

        {/* Grouped by Deal */}
        <div className="space-y-3">
          {filteredDeals.map(deal => {
            const isExpanded = expandedDeals.has(deal.id);
            return (
              <Card key={deal.id} className="bg-card border-border/50 overflow-hidden">
                {/* Deal header row */}
                <button
                  onClick={() => toggleDeal(deal.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
                >
                  <img
                    src={deal.logo}
                    alt=""
                    className="w-7 h-7 rounded bg-white/10 object-contain p-0.5 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${deal.company}&background=1a1f36&color=fff&size=28`; }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-display text-sm font-semibold">{deal.company}</span>
                    <span className="text-xs text-muted-foreground ml-2">{deal.stage}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mr-2">
                    {deal.filteredInteractions.length} interaction{deal.filteredInteractions.length !== 1 ? 's' : ''}
                  </span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>

                {/* Interaction list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="border-t border-border/40 divide-y divide-border/30">
                        {deal.filteredInteractions.map(interaction => (
                          <div key={interaction.id} className="px-4 py-3 hover:bg-accent/20 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 ${TYPE_COLORS[interaction.type] ?? ''}`}
                                  >
                                    {interaction.type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />{formatDate(interaction.date)}
                                  </span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />{interaction.duration} min
                                  </span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <User className="w-3 h-3" />{interaction.keyParticipant}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground/80 leading-relaxed mb-2">{interaction.summary}</p>
                                {interaction.transcript && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs gap-1.5 font-display"
                                    onClick={() => setSelectedInteraction({
                                      dealName: deal.company,
                                      dealLogo: deal.logo,
                                      type: interaction.type,
                                      date: interaction.date,
                                      duration: interaction.duration,
                                      keyParticipant: interaction.keyParticipant,
                                      summary: interaction.summary,
                                      transcript: interaction.transcript,
                                    })}
                                  >
                                    <Eye className="w-3 h-3" />
                                    View Full Transcript
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}

          {filteredDeals.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No transcripts match your search.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Full Transcript Dialog */}
      <Dialog open={!!selectedInteraction} onOpenChange={() => setSelectedInteraction(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <div className="flex items-center gap-3 mb-1">
              {selectedInteraction && (
                <img
                  src={selectedInteraction.dealLogo}
                  alt=""
                  className="w-7 h-7 rounded bg-white/10 object-contain p-0.5"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${selectedInteraction.dealName}&background=1a1f36&color=fff&size=28`; }}
                />
              )}
              <DialogTitle className="font-display text-base">
                {selectedInteraction?.dealName} — {selectedInteraction?.type}
              </DialogTitle>
            </div>
            {selectedInteraction && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(selectedInteraction.date)}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedInteraction.duration} min</span>
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{selectedInteraction.keyParticipant}</span>
              </div>
            )}
          </DialogHeader>

          {selectedInteraction && (
            <ScrollArea className="flex-1 mt-3">
              {/* AI Summary */}
              <div className="bg-primary/5 border border-primary/15 rounded-lg p-4 mb-4">
                <div className="text-xs font-display font-semibold text-primary mb-1.5 uppercase tracking-wide">AI Summary</div>
                <p className="text-sm leading-relaxed text-foreground/80">{selectedInteraction.summary}</p>
              </div>

              {/* Full Transcript */}
              <div className="space-y-1">
                <div className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide mb-3">Full Transcript</div>
                {selectedInteraction.transcript?.split('\n').map((line, i) => {
                  if (!line.trim()) return <div key={i} className="h-2" />;
                  // Bold speaker names (lines starting with "Name:")
                  const speakerMatch = line.match(/^([A-Za-z ]+):\s*(.*)/);
                  if (speakerMatch) {
                    return (
                      <div key={i} className="flex gap-2 py-1">
                        <span className="text-xs font-semibold text-primary/80 shrink-0 min-w-[120px] pt-0.5">{speakerMatch[1]}:</span>
                        <span className="text-sm text-foreground/85 leading-relaxed">{speakerMatch[2]}</span>
                      </div>
                    );
                  }
                  return <p key={i} className="text-sm text-foreground/70 leading-relaxed pl-1">{line}</p>;
                })}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
