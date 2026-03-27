import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Trash2, Pencil, Copy,
  Eye, Search, ChevronDown, ChevronRight, File, FileCheck, Layers, Target,
  Compass, Zap, Shield, BarChart3, X, Check, GripVertical
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

// ─── Types ──────────────────────────────────────────────────────────────────

type DocCategory = 'product' | 'playbook' | 'icp';

type SalesModel = {
  id: number | null;
  key: string;
  name: string;
  description: string;
  dimensions: Array<{ key: string; label: string; description: string }>;
  isBuiltIn: boolean;
};

// ─── Constants ──────────────────────────────────────────────────────────────

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

const FILE_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  pdf: { icon: '📄', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  doc: { icon: '📝', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  md: { icon: '📋', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  txt: { icon: '📃', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
};

const MODEL_ICONS: Record<string, typeof Compass> = {
  meddic: Compass,
  bant: BarChart3,
  spiced: Zap,
  meddicc: Shield,
};

// ─── Sales Framework Section ────────────────────────────────────────────────

function SalesFrameworkSection() {
  const { data: models = [], isLoading } = trpc.salesModels.list.useQuery();
  const utils = trpc.useUtils();

  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<SalesModel | null>(null);
  const [forkSource, setForkSource] = useState<SalesModel | null>(null);

  // Create / Update mutations
  const createModel = trpc.salesModels.create.useMutation({
    onSuccess: () => {
      utils.salesModels.list.invalidate();
      toast.success('Custom framework created');
      setShowCreateDialog(false);
      setForkSource(null);
    },
    onError: () => toast.error('Failed to create framework'),
  });

  const updateModel = trpc.salesModels.update.useMutation({
    onSuccess: () => {
      utils.salesModels.list.invalidate();
      toast.success('Framework updated');
      setEditingModel(null);
    },
    onError: () => toast.error('Failed to update framework'),
  });

  const deleteModel = trpc.salesModels.delete.useMutation({
    onSuccess: () => {
      utils.salesModels.list.invalidate();
      toast.success('Framework deleted');
    },
    onError: () => toast.error('Failed to delete framework'),
  });

  const builtInModels = models.filter(m => m.isBuiltIn);
  const customModels = models.filter(m => !m.isBuiltIn);

  const toggleExpand = (key: string) => {
    setExpandedModel(prev => prev === key ? null : key);
  };

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg border bg-violet-500/10 border-violet-500/20 flex items-center justify-center">
            <Compass className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold">Sales Frameworks</h2>
            <p className="text-xs text-muted-foreground">Qualification methodologies that guide AI analysis</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-display gap-1.5"
          onClick={() => { setForkSource(null); setShowCreateDialog(true); }}
        >
          <Plus className="w-3 h-3" />
          Custom Framework
        </Button>
      </div>

      {/* AI context */}
      <div className="bg-violet-500/5 border border-violet-500/15 rounded-lg px-4 py-2.5 flex items-start gap-3">
        <Compass className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-foreground/60 leading-relaxed">
          When you select a framework on a deal, Meridian AI structures its analysis around that framework's dimensions — scoring each dimension, identifying gaps, and recommending actions aligned with the methodology.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />)}
        </div>
      )}

      {/* Built-in models */}
      {!isLoading && builtInModels.map(model => {
        const ModelIcon = MODEL_ICONS[model.key] ?? Compass;
        const isExpanded = expandedModel === model.key;

        return (
          <Card key={model.key} className="bg-card border-border/50 overflow-hidden">
            <button
              onClick={() => toggleExpand(model.key)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <ModelIcon className="w-4.5 h-4.5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold">{model.name}</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase tracking-wide text-violet-400 border-violet-500/30">
                    Built-in
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{model.description}</p>
              </div>
              <span className="text-xs text-muted-foreground mr-2">{model.dimensions.length} dimensions</span>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="border-t border-border/40 px-4 py-4">
                    {/* Dimensions grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                      {model.dimensions.map((dim, i) => (
                        <div key={dim.key} className="bg-muted/20 rounded-lg p-3 border border-border/30">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 rounded px-1.5 py-0.5">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="text-xs font-semibold">{dim.label}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{dim.description}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-display gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForkSource(model);
                          setShowCreateDialog(true);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                        Fork & Customize
                      </Button>
                      <span className="text-[10px] text-muted-foreground">Create a variant based on {model.name}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}

      {/* Custom models */}
      {!isLoading && customModels.map(model => {
        const isExpanded = expandedModel === `custom-${model.id}`;

        return (
          <Card key={model.id} className="bg-card border-border/50 overflow-hidden">
            <button
              onClick={() => toggleExpand(`custom-${model.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Compass className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold">{model.name}</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase tracking-wide text-emerald-400 border-emerald-500/30">
                    Custom
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{model.description}</p>
              </div>
              <span className="text-xs text-muted-foreground mr-2">{model.dimensions.length} dimensions</span>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="border-t border-border/40 px-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                      {model.dimensions.map((dim, i) => (
                        <div key={dim.key} className="bg-muted/20 rounded-lg p-3 border border-border/30">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 rounded px-1.5 py-0.5">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="text-xs font-semibold">{dim.label}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{dim.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-display gap-1.5"
                        onClick={(e) => { e.stopPropagation(); setEditingModel(model); }}
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-display gap-1.5 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (model.id) deleteModel.mutate({ id: model.id });
                        }}
                        disabled={deleteModel.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}

      {/* Create / Fork Dialog */}
      <FrameworkEditorDialog
        open={showCreateDialog}
        onClose={() => { setShowCreateDialog(false); setForkSource(null); }}
        forkSource={forkSource}
        onSave={(data) => createModel.mutate(data)}
        isPending={createModel.isPending}
      />

      {/* Edit Dialog */}
      {editingModel && editingModel.id && (
        <FrameworkEditorDialog
          open={!!editingModel}
          onClose={() => setEditingModel(null)}
          initialData={editingModel}
          onSave={(data) => updateModel.mutate({ id: editingModel.id!, ...data })}
          isPending={updateModel.isPending}
        />
      )}
    </div>
  );
}

// ─── Framework Editor Dialog ────────────────────────────────────────────────

function FrameworkEditorDialog({
  open,
  onClose,
  forkSource,
  initialData,
  onSave,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  forkSource?: SalesModel | null;
  initialData?: SalesModel | null;
  onSave: (data: { name: string; description?: string; dimensions: Array<{ key: string; label: string; description: string }> }) => void;
  isPending: boolean;
}) {
  const source = initialData ?? forkSource;
  const isEdit = !!initialData;

  const [name, setName] = useState(isEdit ? source?.name ?? '' : forkSource ? `${forkSource.name} (Custom)` : '');
  const [description, setDescription] = useState(source?.description ?? '');
  const [dimensions, setDimensions] = useState<Array<{ key: string; label: string; description: string }>>(
    source?.dimensions?.map(d => ({ ...d })) ?? [
      { key: 'dim_1', label: '', description: '' },
      { key: 'dim_2', label: '', description: '' },
    ]
  );

  const addDimension = () => {
    if (dimensions.length >= 10) { toast.error('Maximum 10 dimensions'); return; }
    setDimensions([...dimensions, { key: `dim_${dimensions.length + 1}`, label: '', description: '' }]);
  };

  const removeDimension = (idx: number) => {
    if (dimensions.length <= 2) { toast.error('Minimum 2 dimensions required'); return; }
    setDimensions(dimensions.filter((_, i) => i !== idx));
  };

  const updateDimension = (idx: number, field: 'label' | 'description', value: string) => {
    const updated = [...dimensions];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'label') {
      updated[idx].key = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `dim_${idx + 1}`;
    }
    setDimensions(updated);
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error('Framework name is required'); return; }
    const validDims = dimensions.filter(d => d.label.trim());
    if (validDims.length < 2) { toast.error('At least 2 dimensions with labels are required'); return; }
    onSave({ name: name.trim(), description: description.trim() || undefined, dimensions: validDims });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display text-base">
            {isEdit ? 'Edit Framework' : forkSource ? `Fork ${forkSource.name}` : 'Create Custom Framework'}
          </DialogTitle>
          {forkSource && !isEdit && (
            <p className="text-xs text-muted-foreground mt-1">
              Starting from {forkSource.name}'s dimensions. Modify as needed.
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 mt-2 pr-1">
          <div className="space-y-2">
            <Label className="text-xs">Framework Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Enterprise MEDDIC+" className="h-9 text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of when to use this framework..." className="h-9 text-xs" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Dimensions ({dimensions.length}/10)</Label>
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={addDimension}>
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>

            <div className="space-y-2">
              {dimensions.map((dim, idx) => (
                <div key={idx} className="bg-muted/20 rounded-lg p-3 border border-border/30 relative group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 rounded px-1.5 py-0.5 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <Input
                      value={dim.label}
                      onChange={(e) => updateDimension(idx, 'label', e.target.value)}
                      placeholder="Dimension name (e.g. Economic Buyer)"
                      className="h-7 text-xs flex-1"
                    />
                    <button
                      onClick={() => removeDimension(idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <Textarea
                    value={dim.description}
                    onChange={(e) => updateDimension(idx, 'description', e.target.value)}
                    placeholder="What should the AI evaluate for this dimension?"
                    className="text-[11px] min-h-[48px] resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border/30 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-display">Cancel</Button>
          <Button size="sm" className="text-xs font-display" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Framework'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<DocCategory>>(new Set<DocCategory>(['product', 'playbook', 'icp']));
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocCategory>('product');
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [activeSection, setActiveSection] = useState<'frameworks' | 'documents'>('frameworks');

  const { data: docs = [], isLoading } = trpc.knowledge.list.useQuery();
  const utils = trpc.useUtils();

  const createDoc = trpc.knowledge.create.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      toast.success('Document added to Knowledge Base.');
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
      toast.success('Document removed');
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
              Sales intelligence foundation — frameworks, playbooks, and product knowledge that power Meridian AI.
            </p>
          </div>
          {activeSection === 'documents' && (
            <Button className="font-display text-xs gap-2 shrink-0" onClick={() => setShowUpload(true)}>
              <Plus className="w-3.5 h-3.5" />
              Add Document
            </Button>
          )}
        </div>

        {/* Section tabs */}
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1 mb-5 w-fit">
          <button
            onClick={() => setActiveSection('frameworks')}
            className={`px-4 py-1.5 rounded-md text-xs font-display font-medium transition-all ${
              activeSection === 'frameworks'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Compass className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Sales Frameworks
          </button>
          <button
            onClick={() => setActiveSection('documents')}
            className={`px-4 py-1.5 rounded-md text-xs font-display font-medium transition-all ${
              activeSection === 'documents'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Documents
          </button>
        </div>

        {/* ─── Sales Frameworks Section ─── */}
        {activeSection === 'frameworks' && <SalesFrameworkSection />}

        {/* ─── Documents Section ─── */}
        {activeSection === 'documents' && (
          <>
            {/* AI context banner */}
            <div className="bg-primary/5 border border-primary/15 rounded-lg px-4 py-3 mb-5 flex items-start gap-3">
              <BookOpen className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-foreground/70 leading-relaxed">
                <span className="font-semibold text-primary">How Meridian uses this:</span> When analyzing meeting transcripts, Meridian AI cross-references your product docs, sales playbook, and ICP to generate contextually accurate deal insights.
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

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
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
                                catDocs.map(doc => {
                                  const ft = FILE_TYPE_ICONS[doc.fileType ?? 'md'] ?? FILE_TYPE_ICONS.md;
                                  return (
                                    <div
                                      key={doc.id}
                                      className="px-4 py-3 hover:bg-accent/20 transition-colors cursor-pointer group"
                                      onClick={() => doc.content && setSelectedDocId(doc.id)}
                                    >
                                      <div className="flex items-start gap-3">
                                        {/* File icon */}
                                        <div className={`w-10 h-12 rounded-md border flex flex-col items-center justify-center shrink-0 ${ft.color}`}>
                                          <span className="text-lg leading-none">{ft.icon}</span>
                                          <span className="text-[8px] font-bold uppercase mt-0.5 opacity-70">{doc.fileType ?? 'md'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-medium group-hover:text-primary transition-colors">{doc.name}</span>
                                          </div>
                                          <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">{doc.description}</p>
                                          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                            <span>{new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            {doc.fileSize && <span>{doc.fileSize}</span>}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {doc.content && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                              onClick={(e) => { e.stopPropagation(); setSelectedDocId(doc.id); }}
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                            </Button>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                            onClick={(e) => { e.stopPropagation(); deleteDoc.mutate({ id: doc.id }); }}
                                            disabled={deleteDoc.isPending}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* View Document Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDocId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-display text-base flex items-center gap-2">
              <span>{selectedDoc && (FILE_TYPE_ICONS[selectedDoc.fileType ?? 'md']?.icon ?? '📋')}</span>
              {selectedDoc?.name}
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase tracking-wide ml-1">
                {selectedDoc?.fileType ?? 'md'}
              </Badge>
            </DialogTitle>
            {selectedDoc && (
              <p className="text-xs text-muted-foreground mt-1">{selectedDoc.description}</p>
            )}
          </DialogHeader>
          {selectedDoc?.content && (
            <div className="flex-1 overflow-auto mt-3">
              <div className="bg-muted/30 rounded-lg p-5">
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
