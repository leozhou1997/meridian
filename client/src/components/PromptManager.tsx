import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Save, ChevronDown, ChevronUp, CheckCircle, FileText, Code, Variable, Copy, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

/* ── Variable metadata: describes what each {{var}} means ── */
const VARIABLE_DOCS: Record<string, Record<string, string>> = {
  brief_generation: {
    '{{stakeholderName}}': 'Name of the stakeholder',
    '{{stakeholderTitle}}': 'Job title of the stakeholder',
    '{{stakeholderRole}}': 'Role in the deal (e.g. Decision Maker, Champion)',
    '{{sentiment}}': 'Current sentiment (Positive/Neutral/Negative)',
    '{{engagement}}': 'Engagement level (High/Medium/Low)',
    '{{dealName}}': 'Name of the deal',
    '{{dealStage}}': 'Current deal stage',
    '{{dealValue}}': 'Deal value in currency',
    '{{signals}}': 'Extracted personal/professional signals',
    '{{meetingNotes}}': 'Recent meeting notes and transcripts',
    '{{openActions}}': 'Open action items for this stakeholder',
  },
  signal_extraction: {
    '{{transcript}}': 'Meeting transcript text to extract signals from',
    '{{stakeholderName}}': 'Name of the stakeholder',
  },
  deal_insight_evidence: {
    '{{dealName}}': 'Name of the deal',
    '{{dealStage}}': 'Current deal stage',
    '{{dealValue}}': 'Deal value',
    '{{confidenceScore}}': 'AI confidence score (0-100)',
    '{{companyInfo}}': 'Company profile information',
    '{{stakeholders}}': 'List of stakeholders with roles and sentiment',
    '{{meetings}}': 'Meeting history with notes',
    '{{actions}}': 'Open action items',
    '{{sellerContext}}': 'Seller\'s company context from knowledge base',
    '{{salesModelDimensions}}': 'Custom sales model evaluation dimensions',
  },
  deal_insight_early: {
    '{{dealName}}': 'Name of the deal',
    '{{dealStage}}': 'Current deal stage',
    '{{dealValue}}': 'Deal value',
    '{{confidenceScore}}': 'AI confidence score (0-100)',
    '{{companyInfo}}': 'Company profile information',
    '{{stakeholders}}': 'List of stakeholders with roles and sentiment',
    '{{sellerContext}}': 'Seller\'s company context from knowledge base',
    '{{salesModelDimensions}}': 'Custom sales model evaluation dimensions',
  },
  deal_chat: {
    '{{dealContext}}': 'Full deal context including stakeholders, meetings, actions',
    '{{sellerContext}}': 'Seller\'s company context from knowledge base',
    '{{userMessage}}': 'The user\'s chat message',
  },
  company_profile_analysis: {
    '{{url}}': 'Company website URL to analyze',
  },
  stakeholder_generation: {
    '{{companyName}}': 'Target company name',
    '{{companyDescription}}': 'Description of the target company',
    '{{sellerContext}}': 'Seller\'s company context from knowledge base',
  },
  initial_deal_insight: {
    '{{dealName}}': 'Name of the deal',
    '{{companyName}}': 'Target company name',
    '{{companyDescription}}': 'Description of the target company',
    '{{stakeholders}}': 'Generated stakeholder list',
    '{{sellerContext}}': 'Seller\'s company context from knowledge base',
  },
};

/* ── Feature display names ── */
const FEATURE_LABELS: Record<string, string> = {
  brief_generation: '会前简报生成',
  signal_extraction: '信号提取',
  deal_insight_evidence: '交易洞察（证据模式）',
  deal_insight_early: '交易洞察（假设模式）',
  deal_chat: 'Ask Meridian 对话',
  company_profile_analysis: '公司档案分析',
  stakeholder_generation: '利益相关方生成',
  initial_deal_insight: '初始交易洞察',
  pre_meeting_brief: '会前简报（旧版）',
};

/* ── Extract {{variables}} from prompt text ── */
function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{[^}]+\}\}/g);
  return matches ? Array.from(new Set(matches)) : [];
}

interface PromptTemplate {
  id: number;
  feature: string;
  version: string;
  isActive: boolean;
  systemPrompt: string;
  userPromptTemplate: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function PromptManager() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<{
    id: number;
    systemPrompt: string;
    userPromptTemplate: string;
    description: string;
  } | null>(null);

  const { data: prompts = [], refetch } = trpc.ai.getPrompts.useQuery({ feature: undefined });

  const updateMutation = trpc.ai.updatePrompt.useMutation({
    onSuccess: () => {
      refetch();
      setEditingPrompt(null);
      toast.success('Prompt 已保存');
    },
    onError: (err) => toast.error(`保存失败: ${err.message}`),
  });

  const setActiveMutation = trpc.ai.setActivePrompt.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('已设为激活版本');
    },
    onError: (err) => toast.error(`操作失败: ${err.message}`),
  });

  // Group prompts by feature
  const grouped = useMemo(() => {
    const map = new Map<string, PromptTemplate[]>();
    (prompts as PromptTemplate[]).forEach(p => {
      const list = map.get(p.feature) || [];
      list.push(p);
      map.set(p.feature, list);
    });
    return map;
  }, [prompts]);

  const handleStartEdit = (p: PromptTemplate) => {
    setEditingPrompt({
      id: p.id,
      systemPrompt: p.systemPrompt,
      userPromptTemplate: p.userPromptTemplate,
      description: p.description || '',
    });
    setExpandedId(p.id);
  };

  const handleSave = () => {
    if (!editingPrompt) return;
    updateMutation.mutate({
      id: editingPrompt.id,
      systemPrompt: editingPrompt.systemPrompt,
      userPromptTemplate: editingPrompt.userPromptTemplate,
      description: editingPrompt.description,
    });
  };

  const handleInsertVariable = (variable: string, field: 'systemPrompt' | 'userPromptTemplate') => {
    if (!editingPrompt) return;
    setEditingPrompt({
      ...editingPrompt,
      [field]: editingPrompt[field] + ' ' + variable,
    });
    toast.info(`已插入 ${variable}`);
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-display font-bold text-foreground">{grouped.size}</div>
            <div className="text-xs text-muted-foreground mt-1">功能模块</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-display font-bold text-foreground">{prompts.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Prompt 版本总数</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-display font-bold text-green-500">
              {(prompts as PromptTemplate[]).filter(p => p.isActive).length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">激活版本</div>
          </CardContent>
        </Card>
      </div>

      {/* Prompt list by feature */}
      {Array.from(grouped.entries()).map(([feature, versions]) => (
        <div key={feature} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-sm">
              {FEATURE_LABELS[feature] || feature}
            </h3>
            <Badge variant="outline" className="text-[10px] px-1.5 font-mono">
              {feature}
            </Badge>
            <span className="text-[11px] text-muted-foreground">
              · {versions.length} 个版本
            </span>
          </div>

          {versions.map((p) => {
            const isExpanded = expandedId === p.id;
            const isEditing = editingPrompt?.id === p.id;
            const allVars = extractVariables(
              (isEditing ? editingPrompt.systemPrompt : p.systemPrompt) + ' ' +
              (isEditing ? editingPrompt.userPromptTemplate : p.userPromptTemplate)
            );
            const varDocs = VARIABLE_DOCS[feature] || {};

            return (
              <Card key={p.id} className={`bg-card border-border/50 ${p.isActive ? 'ring-1 ring-green-500/30' : ''}`}>
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {p.isActive && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px] px-1.5 shrink-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          激活
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
                        {p.version}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {p.description || '无描述'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!p.isActive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-green-600 hover:text-green-500"
                          onClick={() => setActiveMutation.mutate({ id: p.id, feature: p.feature })}
                        >
                          设为激活
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => handleStartEdit(p)}
                      >
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-border/50 pt-4">
                      {/* Dynamic variables panel */}
                      {allVars.length > 0 && (
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Variable className="w-4 h-4 text-blue-500" />
                            <Label className="text-xs font-semibold">动态变量</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-3 h-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">这些变量会在运行时被实际数据替换。<br/>点击变量可插入到编辑区。</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {allVars.map(v => (
                              <Tooltip key={v}>
                                <TooltipTrigger asChild>
                                  <button
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors
                                      ${isEditing
                                        ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 cursor-pointer'
                                        : 'bg-muted text-muted-foreground cursor-default'
                                      }`}
                                    onClick={() => isEditing && handleInsertVariable(v, 'userPromptTemplate')}
                                  >
                                    <Code className="w-3 h-3" />
                                    {v}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  <p className="text-xs">{varDocs[v] || '动态变量'}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* System Prompt */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center">S</span>
                            System Prompt
                          </Label>
                          {!isEditing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[10px] gap-1 text-muted-foreground"
                              onClick={() => handleCopyPrompt(p.systemPrompt)}
                            >
                              <Copy className="w-3 h-3" /> 复制
                            </Button>
                          )}
                        </div>
                        {isEditing ? (
                          <Textarea
                            value={editingPrompt!.systemPrompt}
                            onChange={(e) => setEditingPrompt({ ...editingPrompt!, systemPrompt: e.target.value })}
                            className="font-mono text-xs min-h-[200px] resize-y bg-muted/20 border-border/50"
                          />
                        ) : (
                          <pre className="text-xs text-muted-foreground bg-muted/20 rounded p-3 whitespace-pre-wrap font-mono max-h-48 overflow-auto">
                            {p.systemPrompt}
                          </pre>
                        )}
                      </div>

                      {/* User Prompt Template */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-blue-500/20 text-blue-500 text-[9px] font-bold flex items-center justify-center">U</span>
                            User Prompt 模板
                          </Label>
                          {!isEditing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[10px] gap-1 text-muted-foreground"
                              onClick={() => handleCopyPrompt(p.userPromptTemplate)}
                            >
                              <Copy className="w-3 h-3" /> 复制
                            </Button>
                          )}
                        </div>
                        {isEditing ? (
                          <Textarea
                            value={editingPrompt!.userPromptTemplate}
                            onChange={(e) => setEditingPrompt({ ...editingPrompt!, userPromptTemplate: e.target.value })}
                            className="font-mono text-xs min-h-[200px] resize-y bg-muted/20 border-border/50"
                          />
                        ) : (
                          <pre className="text-xs text-muted-foreground bg-muted/20 rounded p-3 whitespace-pre-wrap font-mono max-h-48 overflow-auto">
                            {p.userPromptTemplate}
                          </pre>
                        )}
                      </div>

                      {/* Description (editable) */}
                      {isEditing && (
                        <div>
                          <Label className="text-xs font-semibold mb-1.5 block">描述</Label>
                          <Textarea
                            value={editingPrompt!.description}
                            onChange={(e) => setEditingPrompt({ ...editingPrompt!, description: e.target.value })}
                            className="text-xs min-h-[60px] resize-y bg-muted/20 border-border/50"
                            placeholder="描述这个 prompt 的用途..."
                          />
                        </div>
                      )}

                      {/* Save / Cancel buttons */}
                      {isEditing && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? (
                              <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            保存修改
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingPrompt(null)}
                          >
                            取消
                          </Button>
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="text-[10px] text-muted-foreground flex gap-4 pt-1 border-t border-border/30">
                        <span>ID: {p.id}</span>
                        <span>创建: {new Date(p.createdAt).toLocaleDateString('zh-CN')}</span>
                        <span>更新: {new Date(p.updatedAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}

      {prompts.length === 0 && (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12 text-center">
            <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">暂无 Prompt 模板。请先运行 seed 脚本初始化。</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
