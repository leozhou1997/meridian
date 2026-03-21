import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
import {
  BookOpen, Plus, Trash2,
  Eye, Search, ChevronDown, ChevronRight, File, FileCheck, Layers, Target
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type DocCategory = 'product' | 'playbook' | 'icp';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<DocCategory>>(new Set<DocCategory>(['product', 'playbook', 'icp']));
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocCategory>('product');
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadContent, setUploadContent] = useState('');

  const { data: docs = [], isLoading } = trpc.knowledge.list.useQuery();
  const utils = trpc.useUtils();

  const createDoc = trpc.knowledge.create.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      toast.success('Document added to Knowledge Base. Meridian AI will use this in deal analysis.');
      setShowUpload(false);
      setUploadName('');
      setUploadDesc('');
      setUploadContent('');
    },
    onError: () => toast.error('Failed to add document'),
  });

  const deleteDoc = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      toast.success('Document removed from Knowledge Base');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  const toggleCategory = (cat: DocCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleUpload = () => {
    if (!uploadName.trim()) { toast.error('Please enter a document name'); return; }
    createDoc.mutate({
      name: uploadName,
      category: uploadCategory,
      description: uploadDesc,
      fileType: 'md',
      content: uploadContent,
      fileSize: `${Math.round(uploadContent.length / 1024 * 10) / 10} KB`,
    });
  };

  const filteredDocs = (cat: DocCategory) =>
    docs.filter(d =>
      d.category === cat &&
      (d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       (d.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const selectedDoc = selectedDocId ? docs.find(d => d.id === selectedDocId) : null;

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

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        )}

        {/* Categories */}
        {!isLoading && (
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
                              <span className="text-lg mt-0.5 shrink-0">{FILE_TYPE_ICON[doc.fileType ?? 'md'] ?? '📋'}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-medium">{doc.name}</span>
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase tracking-wide">
                                    {doc.fileType ?? 'md'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{doc.description}</p>
                                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                  <span>{new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  {doc.fileSize && <span>{doc.fileSize}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {doc.content && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                    onClick={() => setSelectedDocId(doc.id)}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteDoc.mutate({ id: doc.id })}
                                  disabled={deleteDoc.isPending}
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
        )}
      </motion.div>

      {/* View Document Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDocId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-display text-base flex items-center gap-2">
              <span>{selectedDoc && FILE_TYPE_ICON[selectedDoc.fileType ?? 'md']}</span>
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
              <Button
                size="sm"
                className="text-xs font-display"
                onClick={handleUpload}
                disabled={createDoc.isPending}
              >
                {createDoc.isPending ? 'Adding...' : 'Add to Knowledge Base'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
