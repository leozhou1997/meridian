import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
import {
  Play, ThumbsUp, ThumbsDown, Edit3, Clock, Zap, ChevronDown, ChevronUp,
  BarChart3, Sparkles, Save, Plus, CheckCircle, FileText
} from 'lucide-react';
import PromptManager from '@/components/PromptManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { formatDate } from '@/lib/data';

const DEFAULT_SYSTEM_PROMPT = `You are an expert enterprise sales coach. Generate a concise, actionable pre-meeting brief for a sales representative.

The brief should include:
1. **Who They Are** - Quick summary of the stakeholder's role and background
2. **What They Care About** - Their likely priorities and pain points based on their title and context
3. **Relationship Status** - Current sentiment and engagement level
4. **Talking Points** - 3-5 specific, personalized talking points based on the context provided
5. **Watch Out For** - Key risks or sensitivities to be aware of
6. **Suggested Ask** - The specific next step or commitment to pursue in this meeting

Be direct, specific, and actionable. Avoid generic advice. Format with clear headers.`;

const DEFAULT_USER_PROMPT = `Generate a pre-meeting brief for this stakeholder:

**Stakeholder:** Sarah Chen
**Title:** VP of Engineering
**Role in Deal:** Technical Decision Maker
**Sentiment:** Positive
**Engagement Level:** High

**Deal Context:**
- Deal: Acme Corp Enterprise Platform
- Stage: Technical Evaluation
- Value: $240,000

**What We Know About Them:**
Key Insights: Focused on reducing infrastructure costs by 30% this year. Led migration from on-prem to AWS last year.
Personal Notes: Mentioned her team is burned out from the last migration. Prefers async communication.
Signals: 🏃 Runs marathons, uses it as a metaphor for long-term thinking. 📊 Data-driven, always asks for benchmarks.

**Last Meeting:** Technical deep-dive on API architecture. She asked detailed questions about rate limiting and SLA guarantees.

**Open Actions for this stakeholder:**
- Send benchmark comparison vs. competitor
- Schedule security review with her team`;

export default function AdminPlayground() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [userPrompt, setUserPrompt] = useState(DEFAULT_USER_PROMPT);
  const [output, setOutput] = useState('');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [editingOutput, setEditingOutput] = useState<{ id: number; text: string } | null>(null);

  const testPromptMutation = trpc.ai.testPrompt.useMutation({
    onSuccess: (data) => {
      setOutput(data.output);
      toast.success(`Generated in ${data.latencyMs}ms · ${data.tokensUsed} tokens`);
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  const { data: logs = [], refetch: refetchLogs } = trpc.ai.getLogs.useQuery({});

  const rateLogMutation = trpc.ai.rateLog.useMutation({
    onSuccess: () => {
      refetchLogs();
      toast.success('Feedback saved');
    },
  });

  const handleTest = () => {
    if (!systemPrompt.trim() || !userPrompt.trim()) {
      toast.error('Both system and user prompts are required');
      return;
    }
    testPromptMutation.mutate({ systemPrompt, userPrompt });
  };

  const handleRate = (id: number, rating: 'good' | 'bad' | 'edited', editedOutput?: string) => {
    rateLogMutation.mutate({ id, rating, editedOutput });
    setEditingOutput(null);
  };

  const featureLogs = logs.filter(l => l.feature !== 'playground_test');
  const playgroundLogs = logs.filter(l => l.feature === 'playground_test');

  return (
    <div className="p-6 max-w-[1400px]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl font-bold">AI Prompt Playground</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Test and iterate on AI prompts. All runs are logged for dataset accumulation.
            </p>
          </div>
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
            Admin Only
          </Badge>
        </div>

        <Tabs defaultValue="playground" className="space-y-6">
          <TabsList>
            <TabsTrigger value="playground">
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Playground
            </TabsTrigger>
            <TabsTrigger value="logs">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              AI Logs
              {logs.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {logs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="prompts">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Prompt 管理
            </TabsTrigger>
          </TabsList>

          {/* ── Playground Tab ── */}
          <TabsContent value="playground">
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Prompts */}
              <div className="space-y-4">
                <Card className="bg-card border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-display flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">S</span>
                      System Prompt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="font-mono text-xs min-h-[200px] resize-y bg-muted/30 border-border/50"
                      placeholder="You are..."
                    />
                  </CardContent>
                </Card>

                <Card className="bg-card border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-display flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center">U</span>
                      User Prompt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      className="font-mono text-xs min-h-[280px] resize-y bg-muted/30 border-border/50"
                      placeholder="Generate a brief for..."
                    />
                  </CardContent>
                </Card>

                <Button
                  onClick={handleTest}
                  disabled={testPromptMutation.isPending}
                  className="w-full gap-2"
                  size="lg"
                >
                  {testPromptMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Prompt
                    </>
                  )}
                </Button>
              </div>

              {/* Right: Output */}
              <Card className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-display flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Output
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {output ? (
                    <ScrollArea className="h-[600px]">
                      <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-foreground">
                        {output}
                      </pre>
                    </ScrollArea>
                  ) : (
                    <div className="h-[600px] flex items-center justify-center">
                      <div className="text-center">
                        <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Run a prompt to see the output here
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Logs Tab ── */}
          <TabsContent value="logs">
            <div className="space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Runs', value: logs.length },
                  { label: 'Good Outputs', value: logs.filter(l => l.rating === 'good').length },
                  { label: 'Bad Outputs', value: logs.filter(l => l.rating === 'bad').length },
                  { label: 'Edited', value: logs.filter(l => l.rating === 'edited').length },
                ].map(stat => (
                  <Card key={stat.label} className="bg-card border-border/50">
                    <CardContent className="p-4">
                      <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Log list */}
              {logs.length === 0 ? (
                <Card className="bg-card border-border/50">
                  <CardContent className="py-12 text-center">
                    <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No AI runs yet. Use the Playground to generate your first output.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <Card key={log.id} className="bg-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px] px-1.5">
                                {log.feature}
                              </Badge>
                              {log.promptVersion && (
                                <Badge variant="secondary" className="text-[10px] px-1.5">
                                  v{log.promptVersion}
                                </Badge>
                              )}
                              {log.rating && (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 ${
                                    log.rating === 'good' ? 'text-green-400 border-green-400/30' :
                                    log.rating === 'bad' ? 'text-red-400 border-red-400/30' :
                                    'text-yellow-400 border-yellow-400/30'
                                  }`}
                                >
                                  {log.rating === 'good' ? '👍 Good' : log.rating === 'bad' ? '👎 Bad' : '✏️ Edited'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {log.latencyMs}ms
                              </span>
                              <span>{log.tokensUsed} tokens</span>
                              <span>{log.modelUsed}</span>
                              <span>{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {!log.rating && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-green-400"
                                  onClick={() => handleRate(log.id, 'good')}
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                                  onClick={() => handleRate(log.id, 'bad')}
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-yellow-400"
                                  onClick={() => setEditingOutput({ id: log.id, text: log.rawOutput ?? '' })}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground"
                              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                            >
                              {expandedLog === log.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded content */}
                        {expandedLog === log.id && (
                          <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                            {log.systemPrompt && (
                              <div>
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">System Prompt</Label>
                                <pre className="mt-1 text-xs text-muted-foreground bg-muted/30 rounded p-3 whitespace-pre-wrap font-mono max-h-32 overflow-auto">
                                  {log.systemPrompt}
                                </pre>
                              </div>
                            )}
                            {log.userPrompt && (
                              <div>
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">User Prompt</Label>
                                <pre className="mt-1 text-xs text-muted-foreground bg-muted/30 rounded p-3 whitespace-pre-wrap font-mono max-h-32 overflow-auto">
                                  {log.userPrompt}
                                </pre>
                              </div>
                            )}
                            <div>
                              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Raw Output</Label>
                              {editingOutput?.id === log.id ? (
                                <div className="mt-1 space-y-2">
                                  <Textarea
                                    value={editingOutput.text}
                                    onChange={(e) => setEditingOutput({ ...editingOutput, text: e.target.value })}
                                    className="text-xs font-mono min-h-[120px] bg-muted/30"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="gap-1.5"
                                      onClick={() => handleRate(log.id, 'edited', editingOutput.text)}
                                    >
                                      <Save className="w-3 h-3" />
                                      Save Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingOutput(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <pre className="mt-1 text-xs text-foreground bg-muted/30 rounded p-3 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-auto">
                                  {log.editedOutput ?? log.rawOutput}
                                </pre>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          {/* ── Prompt Templates Tab ── */}
          <TabsContent value="prompts">
            <PromptManager />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
