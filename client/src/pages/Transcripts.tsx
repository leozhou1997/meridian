import { useState } from 'react';
import { deals, formatDate } from '@/lib/data';
import { motion } from 'framer-motion';
import { FileText, Upload, Clock, User, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const allInteractions = deals.flatMap(d =>
  d.interactions.map(i => ({ ...i, dealName: d.company, dealLogo: d.logo }))
).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export default function Transcripts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const filtered = allInteractions.filter(i =>
    i.dealName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.keyParticipant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[900px]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold mb-1">Transcripts</h1>
            <p className="text-muted-foreground text-sm">All meeting transcripts and interaction records.</p>
          </div>
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button className="font-display text-xs gap-2">
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
                  <Textarea
                    placeholder="Paste meeting transcript here..."
                    className="min-h-[200px] text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowUpload(false)} className="text-xs font-display">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs font-display"
                    onClick={() => {
                      toast.success('Transcript submitted! AI analysis will begin shortly.');
                      setShowUpload(false);
                    }}
                  >
                    Submit & Analyze
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcripts..."
            className="pl-10 h-9 text-xs"
          />
        </div>

        <div className="space-y-2">
          {filtered.map(interaction => (
            <Card key={interaction.id} className="bg-card border-border/50 hover:border-border/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={interaction.dealLogo}
                    alt=""
                    className="w-8 h-8 rounded bg-white/10 object-contain p-1 mt-0.5"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${interaction.dealName}&background=1a1f36&color=fff&size=32`; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{interaction.dealName}</span>
                      <Badge variant="outline" className="text-[10px]">{interaction.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{interaction.summary}</p>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{interaction.keyParticipant}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{interaction.duration}min</span>
                      <span>{formatDate(interaction.date)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
