import { useState, useMemo, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Trash2, Copy,
  Eye, Search, ChevronDown, ChevronRight, File, FileCheck, Layers, Target,
  Compass, Zap, Shield, BarChart3, X, GripVertical,
  Upload, FileText, Loader2, AlertCircle, RefreshCw, CheckCircle2
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

const CATEGORIES_I18N = {
  product: {
    en: { label: 'Product', description: 'Product docs, feature guides, battle cards' },
    zh: { label: '产品文档', description: '产品文档、功能指南、竞品对比卡' },
  },
  playbook: {
    en: { label: 'Sales Playbook', description: 'Sales methodology, objection handling, demo scripts' },
    zh: { label: '销售手册', description: '销售方法论、异议处理、演示脚本' },
  },
  icp: {
    en: { label: 'ICP & Personas', description: 'Ideal customer profiles, buyer personas, use cases' },
    zh: { label: 'ICP & 客户画像', description: '理想客户画像、买家角色、使用场景' },
  },
};

const CATEGORY_META: Record<DocCategory, { icon: typeof Layers; color: string; bg: string }> = {
  product: { icon: Layers, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  playbook: { icon: FileCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  icp: { icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};

const FILE_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  pdf: { icon: '📄', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  doc: { icon: '📝', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  docx: { icon: '📝', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  xlsx: { icon: '📊', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  md: { icon: '📋', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  txt: { icon: '📃', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
};

const MODEL_ICONS: Record<string, typeof Compass> = {
  meddic: Compass,
  bant: BarChart3,
  spiced: Zap,
  meddicc: Shield,
};

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.xlsx,.xls,.txt,.md';
const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB

// ─── Sales Framework Section ────────────────────────────────────────────────

function SalesFrameworkSection() {
  const { language, t } = useLanguage();
  const isZh = language === 'zh';
  const { data: models = [], isLoading } = trpc.salesModels.list.useQuery();
  const utils = trpc.useUtils();

  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<SalesModel | null>(null);
  const [forkSource, setForkSource] = useState<SalesModel | null>(null);

  const createModel = trpc.salesModels.create.useMutation({
    onSuccess: () => {
      utils.salesModels.list.invalidate();
      toast.success(isZh ? '自定义框架已创建' : 'Custom framework created');
      setShowCreateDialog(false);
      setForkSource(null);
    },
    onError: () => toast.error(isZh ? '创建框架失败' : 'Failed to create framework'),
  });

  const updateModel = trpc.salesModels.update.useMutation({
    onSuccess: () => {
      utils.salesModels.list.invalidate();
      toast.success(isZh ? '框架已更新' : 'Framework updated');
      setEditingModel(null);
    },
    onError: () => toast.error(isZh ? '更新框架失败' : 'Failed to update framework'),
  });

  const deleteModel = trpc.salesModels.delete.useMutation({
    onSuccess: () => {
      utils.salesModels.list.invalidate();
      toast.success(isZh ? '框架已删除' : 'Framework deleted');
    },
    onError: () => toast.error(isZh ? '删除框架失败' : 'Failed to delete framework'),
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
            <h2 className="font-display text-sm font-semibold">{isZh ? '销售框架' : 'Sales Frameworks'}</h2>
            <p className="text-xs text-muted-foreground">{isZh ? '指导 AI 分析的销售方法论' : 'Qualification methodologies that guide AI analysis'}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-display gap-1.5"
          onClick={() => { setForkSource(null); setShowCreateDialog(true); }}
        >
          <Plus className="w-3 h-3" />
          {isZh ? '自定义框架' : 'Custom Framework'}
        </Button>
      </div>

      {/* AI context */}
      <div className="bg-violet-500/5 border border-violet-500/15 rounded-lg px-4 py-2.5 flex items-start gap-3">
        <Compass className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-foreground/60 leading-relaxed">
          {isZh
            ? '当您为交易选择一个框架时，Meridian AI 会围绕该框架的维度进行结构化分析 — 评估每个维度、识别差距，并推荐与方法论一致的行动。'
            : 'When you select a framework on a deal, Meridian AI structures its analysis around that framework\'s dimensions — scoring each dimension, identifying gaps, and recommending actions aligned with the methodology.'}
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
                    {isZh ? '内置' : 'Built-in'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{model.description}</p>
              </div>
              <span className="text-xs text-muted-foreground mr-2">{model.dimensions.length} {isZh ? '个维度' : 'dimensions'}</span>
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
                            <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 rounded px-1.5 py-0.5">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setForkSource(model);
                          setShowCreateDialog(true);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                        {isZh ? '复制并自定义' : 'Fork & Customize'}
                      </Button>
                      <span className="text-[10px] text-muted-foreground">
                        {isZh ? `基于 ${model.name} 创建变体` : `Create a variant based on ${model.name}`}
                      </span>
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
                    {isZh ? '自定义' : 'Custom'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{model.description}</p>
              </div>
              <span className="text-xs text-muted-foreground mr-2">{model.dimensions.length} {isZh ? '个维度' : 'dimensions'}</span>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingModel(model);
                        }}
                      >
                        {isZh ? '编辑' : 'Edit'}
                      </Button>
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
                        {isZh ? '复制' : 'Fork'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive gap-1.5 ml-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (model.id) deleteModel.mutate({ id: model.id });
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                        {isZh ? '删除' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}

      {/* Create / Edit Dialog */}
      <FrameworkDialog
        open={showCreateDialog || !!editingModel}
        onClose={() => { setShowCreateDialog(false); setEditingModel(null); setForkSource(null); }}
        model={editingModel}
        forkSource={forkSource}
        onSave={(data) => {
          if (editingModel?.id) {
            updateModel.mutate({ id: editingModel.id, ...data });
          } else {
            createModel.mutate(data);
          }
        }}
        isPending={createModel.isPending || updateModel.isPending}
      />
    </div>
  );
}

// ─── Framework Dialog ──────────────────────────────────────────────────────

function FrameworkDialog({
  open,
  onClose,
  model,
  forkSource,
  onSave,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  model: SalesModel | null;
  forkSource: SalesModel | null;
  onSave: (data: { name: string; description: string; dimensions: Array<{ key: string; label: string; description: string }> }) => void;
  isPending: boolean;
}) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const isEdit = !!model;
  const source = model ?? forkSource;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dimensions, setDimensions] = useState<Array<{ key: string; label: string; description: string }>>([]);

  // Reset form when dialog opens
  const prevOpen = useRef(false);
  if (open && !prevOpen.current) {
    if (source) {
      setName(isEdit ? source.name : `${source.name} (${isZh ? '自定义' : 'Custom'})`);
      setDescription(source.description);
      setDimensions([...source.dimensions]);
    } else {
      setName('');
      setDescription('');
      setDimensions([{ key: 'dim_1', label: '', description: '' }]);
    }
  }
  prevOpen.current = open;

  const addDimension = () => {
    setDimensions(prev => [...prev, { key: `dim_${prev.length + 1}`, label: '', description: '' }]);
  };

  const removeDimension = (index: number) => {
    setDimensions(prev => prev.filter((_, i) => i !== index));
  };

  const updateDimension = (index: number, field: 'label' | 'description', value: string) => {
    setDimensions(prev => prev.map((d, i) => i === index ? { ...d, [field]: value, key: field === 'label' ? value.toLowerCase().replace(/\s+/g, '_') : d.key } : d));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit
              ? (isZh ? '编辑框架' : 'Edit Framework')
              : forkSource
                ? (isZh ? `基于 ${forkSource.name} 创建` : `Fork from ${forkSource.name}`)
                : (isZh ? '创建自定义框架' : 'Create Custom Framework')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-xs">{isZh ? '框架名称' : 'Framework Name'}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={isZh ? '例如：MEDDPICC' : 'e.g. MEDDPICC'} className="h-9 text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{isZh ? '描述' : 'Description'}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={isZh ? '简要描述此框架...' : 'Brief description...'} className="min-h-[60px] text-xs" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{isZh ? '维度' : 'Dimensions'}</Label>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={addDimension}>
                <Plus className="w-3 h-3" /> {isZh ? '添加' : 'Add'}
              </Button>
            </div>
            {dimensions.map((dim, i) => (
              <div key={i} className="flex gap-2 items-start bg-muted/20 rounded-lg p-2.5 border border-border/30">
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground mt-2 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Input value={dim.label} onChange={e => updateDimension(i, 'label', e.target.value)} placeholder={isZh ? '维度名称' : 'Dimension name'} className="h-7 text-xs" />
                  <Input value={dim.description} onChange={e => updateDimension(i, 'description', e.target.value)} placeholder={isZh ? '描述' : 'Description'} className="h-7 text-xs" />
                </div>
                <button onClick={() => removeDimension(i)} className="mt-1.5 text-muted-foreground hover:text-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button
            className="w-full text-xs font-display"
            onClick={() => onSave({ name, description, dimensions })}
            disabled={isPending || !name.trim()}
          >
            {isPending
              ? (isZh ? '保存中...' : 'Saving...')
              : isEdit
                ? (isZh ? '保存更改' : 'Save Changes')
                : (isZh ? '创建框架' : 'Create Framework')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Processing Status Badge ────────────────────────────────────────────────

function ProcessingBadge({ status, isZh }: { status: string; isZh: boolean }) {
  switch (status) {
    case 'processing':
      return (
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-1 text-blue-400 border-blue-500/30 animate-pulse">
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
          {isZh ? 'AI 解析中' : 'AI Parsing'}
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-1 text-emerald-400 border-emerald-500/30">
          <CheckCircle2 className="w-2.5 h-2.5" />
          {isZh ? '已解析' : 'Parsed'}
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-1 text-red-400 border-red-500/30">
          <AlertCircle className="w-2.5 h-2.5" />
          {isZh ? '解析失败' : 'Failed'}
        </Badge>
      );
    default:
      return null;
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function KnowledgeBase() {
  const { language } = useLanguage();
  const isZh = language === 'zh';

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<DocCategory>>(new Set<DocCategory>(['product', 'playbook', 'icp']));
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocCategory>('product');
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [activeSection, setActiveSection] = useState<'frameworks' | 'documents'>('frameworks');

  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: docs = [], isLoading } = trpc.knowledge.list.useQuery(undefined, {
    refetchInterval: (query) => {
      // Auto-refresh if any doc is still processing
      const data = query.state.data;
      if (Array.isArray(data) && data.some((d: any) => d.processingStatus === 'processing')) return 3000;
      return false;
    },
  });
  const utils = trpc.useUtils();

  const createDoc = trpc.knowledge.create.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      toast.success(isZh ? '文档已添加到知识库' : 'Document added to Knowledge Base');
      resetUploadForm();
    },
    onError: () => toast.error(isZh ? '添加文档失败' : 'Failed to add document'),
  });

  const uploadDoc = trpc.knowledge.upload.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      toast.success(isZh ? '文件已上传，AI 正在解析内容...' : 'File uploaded, AI is parsing content...');
      resetUploadForm();
    },
    onError: (err) => toast.error(isZh ? `上传失败: ${err.message}` : `Upload failed: ${err.message}`),
  });

  const retryExtraction = trpc.knowledge.retryExtraction.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      toast.success(isZh ? '正在重新解析...' : 'Re-parsing...');
    },
    onError: () => toast.error(isZh ? '重新解析失败' : 'Retry failed'),
  });

  const deleteDoc = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      toast.success(isZh ? '文档已删除' : 'Document removed');
    },
    onError: () => toast.error(isZh ? '删除文档失败' : 'Failed to delete document'),
  });

  const resetUploadForm = () => {
    setShowUpload(false);
    setUploadName('');
    setUploadDesc('');
    setUploadContent('');
    setSelectedFile(null);
    setUploadMode('file');
  };

  const toggleCategory = (cat: DocCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // File handling
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(isZh ? '文件大小不能超过 16MB' : 'File size must be under 16MB');
      return;
    }
    setSelectedFile(file);
    if (!uploadName.trim()) {
      setUploadName(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!uploadName.trim()) {
      toast.error(isZh ? '请输入文档名称' : 'Please enter a document name');
      return;
    }

    if (uploadMode === 'file' && selectedFile) {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        uploadDoc.mutate({
          name: uploadName,
          category: uploadCategory,
          description: uploadDesc || undefined,
          fileName: selectedFile.name,
          mimeType: selectedFile.type || 'application/octet-stream',
          fileData: base64,
        });
      };
      reader.readAsDataURL(selectedFile);
    } else if (uploadMode === 'text' && uploadContent.trim()) {
      createDoc.mutate({
        name: uploadName,
        category: uploadCategory,
        description: uploadDesc || undefined,
        fileType: 'md',
        content: uploadContent,
        fileSize: `${Math.round(uploadContent.length / 1024 * 10) / 10} KB`,
      });
    } else {
      toast.error(isZh ? '请选择文件或输入内容' : 'Please select a file or enter content');
    }
  };

  const filteredDocs = (cat: DocCategory) =>
    docs.filter(d =>
      d.category === cat &&
      (d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       (d.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const selectedDoc = selectedDocId ? docs.find(d => d.id === selectedDocId) : null;

  const categories = (['product', 'playbook', 'icp'] as DocCategory[]).map(id => ({
    id,
    ...(CATEGORIES_I18N[id][language] ?? CATEGORIES_I18N[id].en),
    ...CATEGORY_META[id],
  }));

  return (
    <div className="p-6 max-w-[960px]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-display text-2xl font-bold mb-1">{isZh ? '知识库' : 'Knowledge Base'}</h1>
            <p className="text-muted-foreground text-sm">
              {isZh
                ? '销售智能基础 — 框架、手册和产品知识，驱动 Meridian AI。'
                : 'Sales intelligence foundation — frameworks, playbooks, and product knowledge that power Meridian AI.'}
            </p>
          </div>
          {activeSection === 'documents' && (
            <Button className="font-display text-xs gap-2 shrink-0" onClick={() => setShowUpload(true)}>
              <Plus className="w-3.5 h-3.5" />
              {isZh ? '添加文档' : 'Add Document'}
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
            {isZh ? '销售框架' : 'Sales Frameworks'}
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
            {isZh ? '文档' : 'Documents'}
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
                <span className="font-semibold text-primary">{isZh ? 'Meridian 如何使用：' : 'How Meridian uses this:'}</span>{' '}
                {isZh
                  ? '分析会议记录时，Meridian AI 会交叉引用您的产品文档、销售手册和 ICP，生成精准的交易洞察。'
                  : 'When analyzing meeting transcripts, Meridian AI cross-references your product docs, sales playbook, and ICP to generate contextually accurate deal insights.'}
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isZh ? '搜索文档...' : 'Search documents...'}
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
                {categories.map(cat => {
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
                          {catDocs.length} {isZh ? '个文档' : (catDocs.length !== 1 ? 'docs' : 'doc')}
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
                                  <p className="text-xs">
                                    {isZh ? `暂无文档。添加您的第一个${cat.label}文档。` : `No documents yet. Add your first ${cat.label.toLowerCase()} document.`}
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3 text-xs font-display gap-1.5"
                                    onClick={() => { setUploadCategory(cat.id); setShowUpload(true); }}
                                  >
                                    <Plus className="w-3 h-3" />
                                    {isZh ? `添加${cat.label}` : `Add ${cat.label}`}
                                  </Button>
                                </div>
                              ) : (
                                catDocs.map(doc => {
                                  const ft = FILE_TYPE_ICONS[doc.fileType ?? 'md'] ?? FILE_TYPE_ICONS.md;
                                  const hasContent = doc.content || doc.extractedContent;
                                  const isProcessing = doc.processingStatus === 'processing';
                                  const isFailed = doc.processingStatus === 'failed';

                                  return (
                                    <div
                                      key={doc.id}
                                      className="px-4 py-3 hover:bg-accent/20 transition-colors cursor-pointer group"
                                      onClick={() => hasContent && setSelectedDocId(doc.id)}
                                    >
                                      <div className="flex items-start gap-3">
                                        {/* File icon */}
                                        <div className={`w-10 h-12 rounded-md border flex flex-col items-center justify-center shrink-0 ${ft.color}`}>
                                          <span className="text-lg leading-none">{ft.icon}</span>
                                          <span className="text-[8px] font-bold uppercase mt-0.5 opacity-70">{doc.fileType ?? 'md'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                            <span className="text-sm font-medium group-hover:text-primary transition-colors">{doc.name}</span>
                                            {doc.fileUrl && <ProcessingBadge status={doc.processingStatus ?? 'completed'} isZh={isZh} />}
                                          </div>
                                          {doc.description && (
                                            <p className="text-xs text-muted-foreground leading-relaxed mb-1.5 line-clamp-2">{doc.description}</p>
                                          )}
                                          {doc.originalFileName && (
                                            <p className="text-[10px] text-muted-foreground/60 mb-1.5 flex items-center gap-1">
                                              <FileText className="w-2.5 h-2.5" />
                                              {doc.originalFileName}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                            <span>{new Date(doc.createdAt).toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            {doc.fileSize && <span>{doc.fileSize}</span>}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {isFailed && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0 text-amber-400 hover:text-amber-300"
                                              onClick={(e) => { e.stopPropagation(); retryExtraction.mutate({ id: doc.id }); }}
                                              title={isZh ? '重新解析' : 'Retry parsing'}
                                            >
                                              <RefreshCw className="w-3.5 h-3.5" />
                                            </Button>
                                          )}
                                          {hasContent && (
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
              {selectedDoc?.fileUrl && (
                <ProcessingBadge status={selectedDoc.processingStatus ?? 'completed'} isZh={isZh} />
              )}
            </DialogTitle>
            {selectedDoc && (
              <div className="space-y-1 mt-1">
                {selectedDoc.description && (
                  <p className="text-xs text-muted-foreground">{selectedDoc.description}</p>
                )}
                {selectedDoc.originalFileName && (
                  <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                    <FileText className="w-2.5 h-2.5" />
                    {isZh ? '原始文件：' : 'Original file: '}{selectedDoc.originalFileName}
                    {selectedDoc.fileSize && ` (${selectedDoc.fileSize})`}
                  </p>
                )}
              </div>
            )}
          </DialogHeader>
          {selectedDoc && (
            <div className="flex-1 overflow-auto mt-3">
              {/* Show extracted content if available, otherwise show manual content */}
              {(selectedDoc.extractedContent || selectedDoc.content) && (
                <div className="space-y-3">
                  {selectedDoc.extractedContent && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-1 text-blue-400 border-blue-500/30">
                          <Zap className="w-2.5 h-2.5" />
                          {isZh ? 'AI 解析内容' : 'AI Extracted Content'}
                        </Badge>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-5">
                        <pre className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap font-body">
                          {selectedDoc.extractedContent}
                        </pre>
                      </div>
                    </div>
                  )}
                  {selectedDoc.content && !selectedDoc.extractedContent && (
                    <div className="bg-muted/30 rounded-lg p-5">
                      <pre className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap font-body">
                        {selectedDoc.content}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              {selectedDoc.processingStatus === 'processing' && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-400" />
                  <p className="text-sm">{isZh ? 'AI 正在解析文档内容...' : 'AI is parsing document content...'}</p>
                  <p className="text-xs mt-1">{isZh ? '这可能需要几秒钟' : 'This may take a few seconds'}</p>
                </div>
              )}
              {selectedDoc.processingStatus === 'failed' && !selectedDoc.extractedContent && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mb-3 text-red-400" />
                  <p className="text-sm">{isZh ? '文档解析失败' : 'Document parsing failed'}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs gap-1.5"
                    onClick={() => retryExtraction.mutate({ id: selectedDoc.id })}
                    disabled={retryExtraction.isPending}
                  >
                    <RefreshCw className="w-3 h-3" />
                    {isZh ? '重新解析' : 'Retry'}
                  </Button>
                </div>
              )}
              {/* Link to original file */}
              {selectedDoc.fileUrl && (
                <div className="mt-4 pt-3 border-t border-border/30">
                  <a
                    href={selectedDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1.5"
                  >
                    <FileText className="w-3 h-3" />
                    {isZh ? '下载原始文件' : 'Download original file'}
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={(open) => { if (!open) resetUploadForm(); else setShowUpload(true); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{isZh ? '添加到知识库' : 'Add to Knowledge Base'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs">{isZh ? '分类' : 'Category'}</Label>
              <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as DocCategory)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document Name */}
            <div className="space-y-2">
              <Label className="text-xs">{isZh ? '文档名称' : 'Document Name'}</Label>
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder={isZh ? '例如：Q2 销售手册' : 'e.g. Q2 Sales Playbook'}
                className="h-9 text-xs"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-xs">{isZh ? '描述（可选）' : 'Description (optional)'}</Label>
              <Input
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder={isZh ? '简要描述此文档...' : 'Brief description of this document...'}
                className="h-9 text-xs"
              />
            </div>

            {/* Upload mode toggle */}
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1 w-fit">
              <button
                onClick={() => setUploadMode('file')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  uploadMode === 'file'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Upload className="w-3 h-3 inline mr-1 -mt-0.5" />
                {isZh ? '上传文件' : 'Upload File'}
              </button>
              <button
                onClick={() => setUploadMode('text')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  uploadMode === 'text'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-3 h-3 inline mr-1 -mt-0.5" />
                {isZh ? '粘贴文本' : 'Paste Text'}
              </button>
            </div>

            {/* File upload area */}
            {uploadMode === 'file' && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {selectedFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className={`w-10 h-12 rounded-md border flex flex-col items-center justify-center shrink-0 ${
                      FILE_TYPE_ICONS[selectedFile.name.split('.').pop() ?? '']?.color ?? 'text-gray-400 bg-gray-500/10 border-gray-500/20'
                    }`}>
                      <span className="text-lg leading-none">
                        {FILE_TYPE_ICONS[selectedFile.name.split('.').pop() ?? '']?.icon ?? '📄'}
                      </span>
                      <span className="text-[8px] font-bold uppercase mt-0.5 opacity-70">
                        {selectedFile.name.split('.').pop()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      dragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:border-primary/50 hover:bg-muted/20'
                    }`}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-3 ${dragActive ? 'text-primary' : 'text-muted-foreground/40'}`} />
                    <p className="text-sm font-medium mb-1">
                      {isZh ? '拖放文件到此处，或点击选择' : 'Drag & drop a file here, or click to select'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {isZh ? '支持 PDF、Word、Excel、TXT、Markdown（最大 16MB）' : 'PDF, Word, Excel, TXT, Markdown (max 16MB)'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Text input area */}
            {uploadMode === 'text' && (
              <div className="space-y-2">
                <Textarea
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder={isZh
                    ? '粘贴文档内容。Meridian AI 将使用此内容来辅助交易分析...'
                    : 'Paste document content here. Meridian AI will use this to inform deal analysis...'}
                  className="min-h-[160px] text-xs font-mono"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetUploadForm} className="text-xs font-display">
                {isZh ? '取消' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                className="text-xs font-display gap-1.5"
                onClick={handleUpload}
                disabled={createDoc.isPending || uploadDoc.isPending || (uploadMode === 'file' && !selectedFile) || (uploadMode === 'text' && !uploadContent.trim())}
              >
                {(createDoc.isPending || uploadDoc.isPending) ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> {isZh ? '上传中...' : 'Uploading...'}</>
                ) : (
                  <><Upload className="w-3 h-3" /> {isZh ? '添加到知识库' : 'Add to Knowledge Base'}</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
