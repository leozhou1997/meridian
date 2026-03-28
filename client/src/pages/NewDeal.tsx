import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Globe, ArrowLeft, Loader2, Sparkles,
  CheckCircle2, Search, Users, Brain,
  MapPin, FileText, Wifi, Bot,
  ChevronRight
} from 'lucide-react';

// ─── AI Agent Animation Steps ────────────────────────────────────────────────

interface AgentStep {
  id: string;
  icon: React.ReactNode;
  labelEn: string;
  labelZh: string;
  detailEn: string;
  detailZh: string;
  durationMs: number;
}

const AGENT_STEPS: AgentStep[] = [
  {
    id: 'connect',
    icon: <Wifi className="w-4 h-4" />,
    labelEn: 'Connecting to target',
    labelZh: '正在连接目标网站',
    detailEn: 'Establishing secure connection to company website...',
    detailZh: '正在建立与公司网站的安全连接...',
    durationMs: 2000,
  },
  {
    id: 'crawl',
    icon: <Globe className="w-4 h-4" />,
    labelEn: 'Crawling website',
    labelZh: '正在爬取网站信息',
    detailEn: 'Scanning pages, extracting company information, products, and news...',
    detailZh: '扫描页面，提取公司信息、产品和新闻...',
    durationMs: 3000,
  },
  {
    id: 'analyze',
    icon: <Brain className="w-4 h-4" />,
    labelEn: 'AI analyzing company',
    labelZh: 'AI 正在分析公司',
    detailEn: 'Cross-referencing with your company profile and ICP to find entry points...',
    detailZh: '结合你的公司档案和ICP寻找切入点...',
    durationMs: 4000,
  },
  {
    id: 'stakeholders',
    icon: <Users className="w-4 h-4" />,
    labelEn: 'Identifying key people',
    labelZh: '正在识别关键决策者',
    detailEn: 'Searching for decision makers, champions, and influencers on LinkedIn...',
    detailZh: '在LinkedIn上搜索决策者、推动者和影响者...',
    durationMs: 4000,
  },
  {
    id: 'map',
    icon: <MapPin className="w-4 h-4" />,
    labelEn: 'Building Deal Map',
    labelZh: '正在构建 Deal Map',
    detailEn: 'Mapping stakeholders to buying stages and generating relationship insights...',
    detailZh: '将利益相关者映射到购买阶段，生成关系洞察...',
    durationMs: 3000,
  },
  {
    id: 'insights',
    icon: <FileText className="w-4 h-4" />,
    labelEn: 'Generating insights',
    labelZh: '正在生成洞察',
    detailEn: 'Creating initial deal intelligence, risks, and recommended next steps...',
    detailZh: '创建初始交易洞察、风险评估和建议的下一步行动...',
    durationMs: 2000,
  },
];

function AgentAnimation({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) {
  const { language } = useLanguage();
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  useEffect(() => {
    if (currentStep >= 0 && currentStep < AGENT_STEPS.length) {
      const step = AGENT_STEPS[currentStep];
      const label = language === 'zh' ? step.labelZh : step.labelEn;
      setTerminalLines(prev => [...prev, `> ${label}...`]);

      // Add detail line after a short delay
      const timer = setTimeout(() => {
        const detail = language === 'zh' ? step.detailZh : step.detailEn;
        setTerminalLines(prev => [...prev, `  ${detail}`]);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [currentStep, language]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  return (
    <div className="space-y-4">
      {/* Agent header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {language === 'zh' ? 'Meridian AI Agent' : 'Meridian AI Agent'}
          </h3>
          <p className="text-xs text-primary animate-pulse">
            {language === 'zh' ? '正在工作中...' : 'Working...'}
          </p>
        </div>
      </div>

      {/* Step progress */}
      <div className="space-y-2">
        {AGENT_STEPS.map((step, i) => {
          const isActive = i === currentStep;
          const isDone = completedSteps.has(i);
          const isPending = i > currentStep;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-500 ${
                isActive ? 'bg-primary/10 border border-primary/20' :
                isDone ? 'bg-green-500/5 border border-green-500/10' :
                'opacity-40'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                isDone ? 'bg-green-500 text-white' :
                isActive ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                 isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                 step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${isDone ? 'text-green-500' : isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {language === 'zh' ? step.labelZh : step.labelEn}
                </p>
                {isActive && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 animate-pulse">
                    {language === 'zh' ? step.detailZh : step.detailEn}
                  </p>
                )}
              </div>
              {isDone && (
                <span className="text-[10px] text-green-500 font-medium">
                  {language === 'zh' ? '完成' : 'Done'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal-style log */}
      <div className="mt-4 rounded-lg bg-black/80 border border-border/50 overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 border-b border-border/30">
          <div className="w-2 h-2 rounded-full bg-red-500/70" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/70" />
          <div className="w-2 h-2 rounded-full bg-green-500/70" />
          <span className="text-[10px] text-muted-foreground ml-2 font-mono">agent-console</span>
        </div>
        <div ref={terminalRef} className="p-3 max-h-[120px] overflow-y-auto">
          {terminalLines.map((line, i) => (
            <p key={i} className="text-[10px] font-mono text-green-400/80 leading-relaxed">
              {line}
            </p>
          ))}
          <span className="text-[10px] font-mono text-green-400 animate-pulse">_</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main NewDeal Component ──────────────────────────────────────────────────

export default function NewDeal() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();

  // Input state
  const [targetUrl, setTargetUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [targetAnalysis, setTargetAnalysis] = useState<{
    companyName: string;
    description: string;
    industry: string;
    products: string[];
    targetMarket: string;
    headquarters: string;
    estimatedSize: string;
    keyDifferentiator: string;
    sellerAngle: string;
  } | null>(null);

  // Agent animation state
  const [isCreating, setIsCreating] = useState(false);
  const [agentStep, setAgentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const analyzeTarget = trpc.onboarding.analyzeTargetCompany.useMutation();
  const createDeal = trpc.onboarding.createDealFromUrl.useMutation();

  // Analyze target company
  const handleAnalyze = useCallback(async () => {
    if (!targetUrl.trim()) {
      toast.error(language === 'zh' ? '请输入目标客户网址' : 'Please enter target company URL');
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await analyzeTarget.mutateAsync({ url: targetUrl.trim() });
      setTargetAnalysis(result);
      toast.success(language === 'zh' ? '目标公司分析完成！' : 'Target company analysis complete!');
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [targetUrl, analyzeTarget, language]);

  // Run agent animation and create deal
  const handleCreateDeal = useCallback(async () => {
    if (!targetAnalysis) return;
    setIsCreating(true);
    setAgentStep(0);
    setCompletedSteps(new Set());

    // Run animation steps in sequence
    let currentStep = 0;
    const runNextStep = () => {
      return new Promise<void>((resolve) => {
        if (currentStep >= AGENT_STEPS.length) {
          resolve();
          return;
        }
        setAgentStep(currentStep);
        setTimeout(() => {
          setCompletedSteps(prev => new Set(Array.from(prev).concat(currentStep)));
          currentStep++;
          setAgentStep(currentStep);
          resolve();
        }, AGENT_STEPS[currentStep].durationMs);
      });
    };

    // Start the actual API call in parallel with animation
    const dealPromise = createDeal.mutateAsync({
      targetCompanyUrl: targetUrl.trim(),
      targetCompanyName: targetAnalysis.companyName,
      targetCompanyDescription: targetAnalysis.description,
      targetIndustry: targetAnalysis.industry,
      targetProducts: targetAnalysis.products,
      targetMarket: targetAnalysis.targetMarket,
      targetHeadquarters: targetAnalysis.headquarters,
    });

    // Run animation steps
    for (let i = 0; i < AGENT_STEPS.length; i++) {
      await runNextStep();
    }

    // Wait for the actual deal creation to complete
    try {
      const result = await dealPromise;
      toast.success(language === 'zh'
        ? `Deal Map 已生成！发现 ${result.stakeholderCount} 个关键利益相关者`
        : `Deal Map generated! Found ${result.stakeholderCount} key stakeholders`);

      // Small delay for the user to see the completion
      setTimeout(() => {
        navigate(`/deal/${result.dealId}`);
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create deal');
      setIsCreating(false);
      setAgentStep(-1);
    }
  }, [targetAnalysis, targetUrl, createDeal, language, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Top bar */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            {language === 'zh' ? '返回' : 'Back'}
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-bold text-foreground">
            {language === 'zh' ? '创建新 Deal' : 'Create New Deal'}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {!isCreating ? (
          /* ─── Input Phase ─── */
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                {language === 'zh' ? '输入目标客户' : 'Enter Target Customer'}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {language === 'zh'
                  ? '输入目标客户的网址，AI Agent 将自动爬取信息、分析公司、识别关键决策者，并生成完整的 Deal Map'
                  : 'Enter the target customer URL. AI Agent will crawl the website, analyze the company, identify key stakeholders, and generate a complete Deal Map'}
              </p>
            </div>

            {/* URL Input */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {language === 'zh' ? '目标客户网址' : 'Target customer website'}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://www.targetcompany.com"
                    className="pl-10 h-12 text-base"
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  />
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !targetUrl.trim()}
                  className="h-12 px-6"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      {language === 'zh' ? '分析' : 'Analyze'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Analysis loading */}
            {isAnalyzing && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {language === 'zh' ? '正在分析目标公司...' : 'Analyzing target company...'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'zh' ? '提取公司信息、产品和市场定位' : 'Extracting company info, products, and market positioning'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis result */}
            {targetAnalysis && !isAnalyzing && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-bold text-foreground">{targetAnalysis.companyName}</span>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {targetAnalysis.industry}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">{targetAnalysis.description}</p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {targetAnalysis.headquarters && (
                      <div>
                        <span className="text-muted-foreground">{language === 'zh' ? '总部' : 'HQ'}:</span>
                        <p className="font-medium text-foreground">{targetAnalysis.headquarters}</p>
                      </div>
                    )}
                    {targetAnalysis.estimatedSize && (
                      <div>
                        <span className="text-muted-foreground">{language === 'zh' ? '规模' : 'Size'}:</span>
                        <p className="font-medium text-foreground">{targetAnalysis.estimatedSize}</p>
                      </div>
                    )}
                    {targetAnalysis.products.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">{language === 'zh' ? '产品/服务' : 'Products'}:</span>
                        <p className="font-medium text-foreground">{targetAnalysis.products.join(', ')}</p>
                      </div>
                    )}
                    {targetAnalysis.sellerAngle && (
                      <div className="col-span-2 bg-primary/5 rounded-lg p-2 border border-primary/10">
                        <span className="text-primary font-medium">
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          {language === 'zh' ? '切入点' : 'Entry Angle'}:
                        </span>
                        <p className="font-medium text-foreground mt-0.5">{targetAnalysis.sellerAngle}</p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleCreateDeal}
                    className="w-full h-11 mt-2"
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    {language === 'zh' ? '启动 AI Agent — 生成 Deal Map' : 'Launch AI Agent — Generate Deal Map'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* ─── Agent Working Phase ─── */
          <div className="max-w-lg mx-auto">
            <AgentAnimation currentStep={agentStep} completedSteps={completedSteps} />
          </div>
        )}
      </div>
    </div>
  );
}
