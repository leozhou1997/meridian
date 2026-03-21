import { useState } from 'react';
import { trpc } from '@/lib/trpc';
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

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [expandedDeals, setExpandedDeals] = useState<Set<number>>(new Set());
  const [selectedInteraction, setSelectedInteraction] = useState<SelectedInteraction | null>(null);

  // Upload form state
  const [uploadDealId, setUploadDealId] = useState('');
  const [uploadType, setUploadType] = useState('');
  const [uploadParticipant, setUploadParticipant] = useState('');
  const [uploadTranscript, setUploadTranscript] = useState('');

  const { data: deals = [], isLoading: dealsLoading } = trpc.deals.list.useQuery();
  const { data: allMeetings = [], isLoading: meetingsLoading } = trpc.meetings.listAll.useQuery();
  const utils = trpc.useUtils();

  const createMeeting = trpc.meetings.create.useMutation({
    onSuccess: () => {
      utils.meetings.listAll.invalidate();
      toast.success('Transcript submitted! AI analysis will begin shortly.');
      setShowUpload(false);
      setUploadDealId('');
      setUploadType('');
      setUploadParticipant('');
      setUploadTranscript('');
    },
    onError: () => toast.error('Failed to upload transcript'),
  });

  const toggleDeal = (dealId: number) => {
    setExpandedDeals(prev => {
      const next = new Set(prev);
      if (next.has(dealId)) next.delete(dealId);
      else next.add(dealId);
      return next;
    });
  };

  // Group meetings by deal
  const dealMeetingsMap = allMeetings.reduce((acc, m) => {
    if (!acc[m.dealId]) acc[m.dealId] = [];
    acc[m.dealId].push(m);
    return acc;
  }, {} as Record<number, typeof allMeetings>);

  const filteredDeals = deals.map(deal => ({
    ...deal,
    filteredInteractions: (dealMeetingsMap[deal.id] ?? []).filter(i =>
      (i.keyParticipant ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.summary ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.company.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  })).filter(d => d.filteredInteractions.length > 0);

  const totalTranscripts = allMeetings.length;
  const withFullText = allMeetings.filter(i => i.transcriptUrl).length;

  const isLoading = dealsLoading || meetingsLoading;

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
                  <Select value={uploadDealId} onValueChange={setUploadDealId}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select deal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {deals.map(d => (
                        <SelectItem key={d.id} value={String(d.id)} className="text-xs">{d.company}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Interaction Type</Label>
                    <Select value={uploadType} onValueChange={setUploadType}>
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
                    <Input
                      placeholder="Name..."
                      className="h-9 text-xs"
                      value={uploadParticipant}
                      onChange={e => setUploadParticipant(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Transcript</Label>
                  <Textarea
                    placeholder="Paste meeting transcript here..."
                    className="min-h-[200px] text-xs font-mono"
                    value={uploadTranscript}
                    onChange={e => setUploadTranscript(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowUpload(false)} className="text-xs font-display">Cancel</Button>
                  <Button
                    size="sm"
                    className="text-xs font-display"
                    disabled={!uploadDealId || !uploadType || !uploadParticipant || createMeeting.isPending}
                    onClick={() => {
                      if (!uploadDealId || !uploadType || !uploadParticipant) {
                        toast.error('Please fill in all required fields');
                        return;
                      }
                      createMeeting.mutate({
                        dealId: Number(uploadDealId),
                        type: uploadType,
                        date: new Date().toISOString(),
                        duration: 60,
                        keyParticipant: uploadParticipant,
                        summary: uploadTranscript.slice(0, 500),
                        transcriptUrl: uploadTranscript.length > 500 ? uploadTranscript : undefined,
                      });
                    }}
                  >
                    {createMeeting.isPending ? 'Uploading...' : 'Submit & Analyze'}
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

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        )}

        {/* Grouped by Deal */}
        {!isLoading && (
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
                      src={deal.logo ?? `https://ui-avatars.com/api/?name=${deal.company}&background=1a1f36&color=fff&size=28`}
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
                                  {interaction.transcriptUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs gap-1.5 font-display"
                                      onClick={() => setSelectedInteraction({
                                      dealName: deal.company,
                                      dealLogo: deal.logo,
                                      type: interaction.type,
                                      date: interaction.date,
                                      duration: interaction.duration ?? 0,
                                      keyParticipant: interaction.keyParticipant ?? '',
                                      summary: interaction.summary ?? '',
                                        transcriptUrl: interaction.transcriptUrl,
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

            {filteredDeals.length === 0 && !isLoading && (
              <Card className="bg-card border-border/50">
                <CardContent className="p-12 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No interactions match your search.' : 'No interactions yet. Upload a transcript to get started.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Transcript viewer modal */}
        <Dialog open={!!selectedInteraction} onOpenChange={() => setSelectedInteraction(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <img
                  src={selectedInteraction?.dealLogo ?? `https://ui-avatars.com/api/?name=${selectedInteraction?.dealName}&background=1a1f36&color=fff&size=28`}
                  alt=""
                  className="w-6 h-6 rounded object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${selectedInteraction?.dealName}&background=1a1f36&color=fff&size=28`; }}
                />
                {selectedInteraction?.dealName} — {selectedInteraction?.type}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{selectedInteraction && formatDate(selectedInteraction.date)}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedInteraction?.duration} min</span>
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{selectedInteraction?.keyParticipant}</span>
              </div>
              <div>
                <p className="text-xs font-display font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Summary</p>
                <p className="text-sm leading-relaxed">{selectedInteraction?.summary}</p>
              </div>
              {selectedInteraction?.transcriptUrl && (
                <div>
                  <p className="text-xs font-display font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Full Transcript</p>
                  <ScrollArea className="h-[300px] rounded-md border border-border/50 p-3">
                    <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground/80">
                      {selectedInteraction.transcriptUrl}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </motion.div>
    </div>
  );
}
