import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Upload, FileText, Target, Layers, Plus, Trash2,
  Eye, Download, Search, ChevronDown, ChevronRight, File, FileCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type DocCategory = 'product' | 'playbook' | 'icp';

interface KBDocument {
  id: string;
  name: string;
  category: DocCategory;
  description: string;
  fileType: 'pdf' | 'doc' | 'md' | 'txt';
  uploadedAt: string;
  size: string;
  content?: string;
}

const INITIAL_DOCS: KBDocument[] = [
  {
    id: 'kb-1',
    name: 'Meridian Product Overview v2.1',
    category: 'product',
    description: 'Core product capabilities, feature set, and technical architecture overview for sales conversations.',
    fileType: 'pdf',
    uploadedAt: '2025-02-15',
    size: '2.4 MB',
    content: `# Meridian Product Overview\n\n## What is Meridian?\nMeridian is an AI-powered Sales Intelligence platform that transforms unstructured meeting data into actionable deal insights.\n\n## Core Capabilities\n- **Meeting Analysis**: Automatically transcribe and analyze sales calls\n- **Stakeholder Mapping**: Visual relationship mapping with sentiment tracking\n- **Deal Snapshots**: AI-generated deal summaries with confidence scoring\n- **Risk Detection**: Early warning system for at-risk deals\n\n## Technical Architecture\n- Cloud-native SaaS, SOC 2 Type II compliant\n- Integrates with Salesforce, HubSpot, Gong, Zoom, Teams\n- API-first design for custom integrations\n- 99.9% uptime SLA`,
  },
  {
    id: 'kb-2',
    name: 'Competitive Battle Card — Gong vs Meridian',
    category: 'product',
    description: 'Side-by-side comparison with Gong, Chorus, and Clari. Objection handling and differentiation points.',
    fileType: 'doc',
    uploadedAt: '2025-03-01',
    size: '890 KB',
    content: `# Competitive Battle Card: Meridian vs Gong\n\n## Key Differentiators\n| Feature | Meridian | Gong |\n|---------|----------|------|\n| Stakeholder Map | ✅ Visual, editable | ❌ Not available |\n| Deal Confidence Score | ✅ AI-powered | ✅ Revenue Intelligence |\n| Buying Committee Tracking | ✅ Multi-role, multi-stage | ⚠️ Limited |\n| Price | $$ | $$$$ |\n\n## Common Objections\n**"We already use Gong"**\nMeridian focuses on deal strategy and stakeholder intelligence, not just call recording. We complement Gong by providing the "so what" layer on top of raw conversation data.`,
  },
  {
    id: 'kb-3',
    name: 'Enterprise Sales Playbook 2025',
    category: 'playbook',
    description: 'End-to-end enterprise sales methodology: discovery framework, demo flow, POC structure, and negotiation tactics.',
    fileType: 'pdf',
    uploadedAt: '2025-01-20',
    size: '5.1 MB',
    content: `# Enterprise Sales Playbook 2025\n\n## Discovery Framework (MEDDIC)\n- **Metrics**: Quantify the economic impact\n- **Economic Buyer**: Identify and access the financial decision maker\n- **Decision Criteria**: Understand how they will evaluate solutions\n- **Decision Process**: Map the internal approval workflow\n- **Identify Pain**: Connect to a compelling event\n- **Champion**: Develop an internal advocate\n\n## Demo Flow\n1. Recap discovery findings (5 min)\n2. Show the "before" state — manual, fragmented data (3 min)\n3. Live walkthrough with their actual use case (20 min)\n4. ROI calculation together (10 min)\n5. Next steps and timeline (5 min)\n\n## POC Structure\n- Duration: 30 days max\n- Success criteria: defined upfront, in writing\n- Weekly check-ins with champion\n- Executive sponsor meeting at day 15`,
  },
  {
    id: 'kb-4',
    name: 'Objection Handling Guide',
    category: 'playbook',
    description: 'Top 20 objections with proven responses. Covers price, security, integration, and ROI concerns.',
    fileType: 'md',
    uploadedAt: '2025-02-28',
    size: '340 KB',
    content: `# Objection Handling Guide\n\n## Price Objections\n**"It's too expensive"**\nAsk: "What's the cost of losing one enterprise deal per quarter due to poor stakeholder visibility?" Then anchor to their average deal size × win rate improvement.\n\n## Security Objections\n**"We can't share meeting recordings with a third party"**\nMeridian is SOC 2 Type II certified. Data is encrypted at rest and in transit. We offer private cloud deployment for enterprise customers. We can provide our security whitepaper.\n\n## Integration Objections\n**"We already have Salesforce/HubSpot"**\nMeridian integrates natively with both. We don't replace your CRM — we enrich it with deal intelligence that your CRM can't capture from structured fields alone.`,
  },
  {
    id: 'kb-5',
    name: 'Ideal Customer Profile (ICP) Definition',
    category: 'icp',
    description: 'Detailed ICP criteria: firmographics, technographics, behavioral signals, and disqualification criteria.',
    fileType: 'doc',
    uploadedAt: '2025-03-10',
    size: '1.2 MB',
    content: `# Ideal Customer Profile — Meridian\n\n## Tier 1 ICP (Highest Priority)\n**Firmographics**\n- B2B SaaS or enterprise software company\n- 50–500 employees\n- $10M–$100M ARR\n- Series B or later\n\n**Sales Team Profile**\n- 5+ quota-carrying AEs\n- Average deal size >$50K ARR\n- Sales cycle 3–9 months\n- Multi-stakeholder deals (3+ contacts per opportunity)\n\n**Technographics**\n- Uses Salesforce or HubSpot\n- Has Gong, Zoom, or Teams for calls\n- Has a RevOps or Sales Ops function\n\n**Behavioral Signals**\n- Recently missed quota (pain is acute)\n- Scaling sales team (hiring AEs)\n- Lost a major deal to a competitor recently\n\n## Disqualification Criteria\n- Transactional sales (<30 day cycle)\n- SMB-only focus (<$10K ACV)\n- No dedicated sales team (founder-led only)\n- Regulated industries with strict data residency requirements (unless enterprise plan)`,
  },
];

const CATEGORIES = [
  {
    id: 'product' as DocCategory,
    label: 'Product',
    icon: Layers,
    description: 'Product docs, feature guides, battle cards',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'playbook' as DocCategory,
    label: 'Sales Playbook',
    icon: FileCheck,
    description: 'Sales methodology, objection handling, demo scripts',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 'icp' as DocCategory,
    label: 'ICP & Personas',
    icon: Target,
    description: 'Ideal customer profiles, buyer personas, use cases',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
];

const FILE_TYPE_ICON: Record<string, string> = {
  pdf: '📄',
  doc: '📝',
  md: '📋',
  txt: '📃',
};

export default function KnowledgeBase() {
  const [docs, setDocs] = useState<KBDocument[]>(INITIAL_DOCS);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<DocCategory>>(new Set<DocCategory>(['product', 'playbook', 'icp']));
  const [selectedDoc, setSelectedDoc] = useState<KBDocument | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocCategory>('product');
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadContent, setUploadContent] = useState('');

  const toggleCategory = (cat: DocCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleDelete = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    toast.success('Document removed from Knowledge Base');
  };

  const handleUpload = () => {
    if (!uploadName.trim()) { toast.error('Please enter a document name'); return; }
    const newDoc: KBDocument = {
      id: `kb-${Date.now()}`,
      name: uploadName,
      category: uploadCategory,
      description: uploadDesc,
      fileType: 'txt',
      uploadedAt: new Date().toISOString().split('T')[0],
      size: `${Math.round(uploadContent.length / 1024 * 10) / 10} KB`,
      content: uploadContent,
    };
    setDocs(prev => [newDoc, ...prev]);
    toast.success('Document added to Knowledge Base. Meridian AI will use this in deal analysis.');
    setShowUpload(false);
    setUploadName('');
    setUploadDesc('');
    setUploadContent('');
  };

  const filteredDocs = (cat: DocCategory) =>
    docs.filter(d =>
      d.category === cat &&
      (d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       d.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  return (
    <div className="p-6 max-w-[960px]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-display text-2xl font-bold mb-1">Knowledge Base</h1>
            <p className="text-muted-foreground text-sm">
              Sales intelligence foundation — Meridian AI uses these documents to analyze deals and generate insights.
            </p>
          </div>
          <Button className="font-display text-xs gap-2 shrink-0" onClick={() => setShowUpload(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add Document
          </Button>
        </div>

        {/* AI context banner */}
        <div className="bg-primary/5 border border-primary/15 rounded-lg px-4 py-3 mb-5 flex items-start gap-3">
          <BookOpen className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-foreground/70 leading-relaxed">
            <span className="font-semibold text-primary">How Meridian uses this:</span> When analyzing meeting transcripts, Meridian AI cross-references your product docs, sales playbook, and ICP to generate contextually accurate deal insights, identify misalignment with your target customer, and suggest next best actions aligned with your methodology.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="pl-10 h-9 text-sm"
          />
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {CATEGORIES.map(cat => {
            const catDocs = filteredDocs(cat.id);
            const isExpanded = expandedCategories.has(cat.id);
            const CatIcon = cat.icon;

            return (
              <Card key={cat.id} className="bg-card border-border/50 overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${cat.bg}`}>
                    <CatIcon className={`w-4 h-4 ${cat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-display text-sm font-semibold">{cat.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">{cat.description}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mr-2">
                    {catDocs.length} doc{catDocs.length !== 1 ? 's' : ''}
                  </span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border/40 divide-y divide-border/30">
                    {catDocs.length === 0 ? (
                      <div className="px-4 py-6 text-center text-muted-foreground">
                        <File className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No documents yet. Add your first {cat.label.toLowerCase()} document.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 text-xs font-display gap-1.5"
                          onClick={() => { setUploadCategory(cat.id); setShowUpload(true); }}
                        >
                          <Plus className="w-3 h-3" />
                          Add {cat.label}
                        </Button>
                      </div>
                    ) : (
                      catDocs.map(doc => (
                        <div key={doc.id} className="px-4 py-3 hover:bg-accent/20 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-lg mt-0.5 shrink-0">{FILE_TYPE_ICON[doc.fileType]}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-medium">{doc.name}</span>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase tracking-wide">
                                  {doc.fileType}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed mb-2">{doc.description}</p>
                              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                <span>{doc.uploadedAt}</span>
                                <span>{doc.size}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {doc.content && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => setSelectedDoc(doc)}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(doc.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* View Document Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-display text-base flex items-center gap-2">
              <span>{selectedDoc && FILE_TYPE_ICON[selectedDoc.fileType]}</span>
              {selectedDoc?.name}
            </DialogTitle>
            {selectedDoc && (
              <p className="text-xs text-muted-foreground mt-1">{selectedDoc.description}</p>
            )}
          </DialogHeader>
          {selectedDoc?.content && (
            <div className="flex-1 overflow-auto mt-3">
              <div className="bg-muted/30 rounded-lg p-4">
                <pre className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap font-body">
                  {selectedDoc.content}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Add to Knowledge Base</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs">Category</Label>
              <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as DocCategory)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Document Name</Label>
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="e.g. Q2 Sales Playbook"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Input
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="Brief description of this document..."
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Content</Label>
              <Textarea
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                placeholder="Paste document content here. Meridian AI will use this to inform deal analysis..."
                className="min-h-[160px] text-xs font-mono"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowUpload(false)} className="text-xs font-display">Cancel</Button>
              <Button size="sm" className="text-xs font-display" onClick={handleUpload}>
                Add to Knowledge Base
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
