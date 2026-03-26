import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Globe, Upload, ArrowRight, ArrowLeft, Check,
  Loader2, Building2, Target, Users, Sparkles,
  CheckCircle2
} from 'lucide-react';

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = [
    { en: 'Product Info', zh: '产品信息' },
    { en: 'Sales Process', zh: '销售流程' },
    { en: 'Define ICP', zh: '定义ICP' },
  ];
  const { language } = useLanguage();

  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <Check className="w-5 h-5" /> : step}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-xs font-medium ${isActive || isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Step {step}:
                </p>
                <p className={`text-xs ${isActive || isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {language === 'zh' ? labels[i].zh : labels[i].en}
                </p>
              </div>
            </div>
            {step < total && (
              <div className={`w-24 h-0.5 mx-2 mt-[-20px] transition-all duration-300 ${
                isDone ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Onboarding Component ───────────────────────────────────────────────

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { language, t } = useLanguage();
  const [step, setStep] = useState(1);

  // Step 1: Product Info
  const [companyUrl, setCompanyUrl] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [companyAnalysis, setCompanyAnalysis] = useState<{
    companyName: string;
    description: string;
    industry: string;
    products: string[];
    targetMarket: string;
  } | null>(null);

  // Step 2: Sales Process
  const [salesStages, setSalesStages] = useState([
    'Discovery', 'Demo', 'Technical Evaluation', 'POC', 'Negotiation'
  ]);
  const [avgDealSize, setAvgDealSize] = useState('');
  const [avgDealCycle, setAvgDealCycle] = useState('');
  const [salesTeamSize, setSalesTeamSize] = useState('');

  // Step 3: ICP
  const [icpIndustries, setIcpIndustries] = useState('');
  const [icpCompanySize, setIcpCompanySize] = useState('');
  const [icpTitles, setIcpTitles] = useState('');
  const [icpPainPoints, setIcpPainPoints] = useState('');

  // Creating state
  const [isCreating, setIsCreating] = useState(false);

  const analyzeCompany = trpc.onboarding.analyzeCompanyUrl.useMutation();
  const createDealFromUrl = trpc.onboarding.createDealFromUrl.useMutation();

  // Step 1: Analyze company URL
  const handleAnalyzeUrl = useCallback(async () => {
    if (!companyUrl.trim()) {
      toast.error(language === 'zh' ? '请输入公司网址' : 'Please enter a company website');
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await analyzeCompany.mutateAsync({ url: companyUrl.trim(), knowledgeBase: knowledgeBase.trim() || undefined });
      setCompanyAnalysis(result);
      toast.success(language === 'zh' ? '公司信息分析完成！' : 'Company analysis complete!');
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [companyUrl, knowledgeBase, analyzeCompany, language]);

  // Final: Create workspace and first deal
  const handleFinish = useCallback(async () => {
    setIsCreating(true);
    try {
      const result = await createDealFromUrl.mutateAsync({
        companyUrl: companyUrl.trim(),
        companyName: companyAnalysis?.companyName || '',
        companyDescription: companyAnalysis?.description || '',
        industry: companyAnalysis?.industry || '',
        products: companyAnalysis?.products || [],
        targetMarket: companyAnalysis?.targetMarket || '',
        salesProcess: {
          stages: salesStages,
          avgDealSize: avgDealSize || undefined,
          avgDealCycle: avgDealCycle || undefined,
          teamSize: salesTeamSize || undefined,
        },
        icp: {
          industries: icpIndustries || undefined,
          companySize: icpCompanySize || undefined,
          titles: icpTitles || undefined,
          painPoints: icpPainPoints || undefined,
        },
      });
      toast.success(language === 'zh' ? '工作区创建成功！正在生成利益相关者地图...' : 'Workspace created! Generating stakeholder map...');
      // Navigate to the new deal
      navigate(`/deal/${result.dealId}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  }, [companyUrl, companyAnalysis, salesStages, avgDealSize, avgDealCycle, salesTeamSize, icpIndustries, icpCompanySize, icpTitles, icpPainPoints, createDealFromUrl, language, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-[320px] bg-primary/5 border-r border-border flex-col items-center justify-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">MERIDIAN</h1>
        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          {language === 'zh'
            ? 'AI驱动的销售智能平台\n帮助您的团队赢得更多复杂交易'
            : 'AI-powered Sales Intelligence\nHelping your team win more complex deals'}
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
        <div className="w-full max-w-2xl">
          <StepIndicator current={step} total={3} />

          {/* Step 1: Product Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                  {language === 'zh' ? '输入您的产品信息' : 'Enter your product info'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh'
                    ? '我们将分析您的公司网站，自动提取关键信息'
                    : "We'll analyze your company website and extract key information automatically"}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {language === 'zh' ? '输入公司网址' : 'Enter your company website'}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={companyUrl}
                        onChange={(e) => setCompanyUrl(e.target.value)}
                        placeholder="https://www.yourcompany.com"
                        className="pl-10 h-11"
                      />
                    </div>
                    <Button
                      onClick={handleAnalyzeUrl}
                      disabled={isAnalyzing || !companyUrl.trim()}
                      className="h-11 px-4"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Analysis result */}
                {isAnalyzing && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {language === 'zh' ? '正在分析公司网站...' : 'Analyzing company website...'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'zh' ? '提取公司信息、产品和市场定位' : 'Extracting company info, products, and market positioning'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {companyAnalysis && !isAnalyzing && (
                  <Card className="border-status-success/30 bg-status-success/5">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-status-success" />
                        <span className="text-sm font-medium text-foreground">
                          {language === 'zh' ? '分析完成' : 'Analysis Complete'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">{language === 'zh' ? '公司名称' : 'Company'}:</span>
                          <p className="font-medium text-foreground">{companyAnalysis.companyName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{language === 'zh' ? '行业' : 'Industry'}:</span>
                          <p className="font-medium text-foreground">{companyAnalysis.industry}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">{language === 'zh' ? '描述' : 'Description'}:</span>
                          <p className="font-medium text-foreground">{companyAnalysis.description}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">{language === 'zh' ? '产品/服务' : 'Products/Services'}:</span>
                          <p className="font-medium text-foreground">{companyAnalysis.products.join(', ')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {language === 'zh' ? '上传产品知识库（可选）' : 'Upload your product Knowledge base (optional)'}
                  </label>
                  <Textarea
                    value={knowledgeBase}
                    onChange={(e) => setKnowledgeBase(e.target.value)}
                    placeholder={language === 'zh'
                      ? '粘贴产品文档、销售资料或任何有助于AI理解您产品的内容...'
                      : 'Paste product documentation, sales materials, or any content that helps AI understand your product...'}
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {language === 'zh' ? '支持粘贴文本或拖拽文件' : 'Paste text or drag & drop files'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(2)} className="px-6">
                  {language === 'zh' ? '下一步' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Sales Process */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                  {language === 'zh' ? '输入您的销售流程' : 'Enter your sales process'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh'
                    ? '帮助Meridian理解您的销售阶段和团队结构'
                    : 'Help Meridian understand your sales stages and team structure'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {language === 'zh' ? '销售阶段' : 'Sales Stages'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {salesStages.map((stage, i) => (
                      <div key={i} className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-xs font-medium">
                        <span>{i + 1}.</span>
                        <Input
                          value={stage}
                          onChange={(e) => {
                            const next = [...salesStages];
                            next[i] = e.target.value;
                            setSalesStages(next);
                          }}
                          className="h-5 w-auto min-w-[80px] border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => setSalesStages([...salesStages, ''])}
                      className="text-xs text-primary hover:text-primary/80 px-2 py-1"
                    >
                      + {language === 'zh' ? '添加阶段' : 'Add Stage'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      {language === 'zh' ? '平均交易规模' : 'Avg Deal Size'}
                    </label>
                    <Input
                      value={avgDealSize}
                      onChange={(e) => setAvgDealSize(e.target.value)}
                      placeholder="$100K"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      {language === 'zh' ? '平均成交周期' : 'Avg Deal Cycle'}
                    </label>
                    <Input
                      value={avgDealCycle}
                      onChange={(e) => setAvgDealCycle(e.target.value)}
                      placeholder={language === 'zh' ? '90天' : '90 days'}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      {language === 'zh' ? '销售团队规模' : 'Team Size'}
                    </label>
                    <Input
                      value={salesTeamSize}
                      onChange={(e) => setSalesTeamSize(e.target.value)}
                      placeholder="5-10"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '上一步' : 'Back'}
                </Button>
                <Button onClick={() => setStep(3)} className="px-6">
                  {language === 'zh' ? '下一步' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Define ICP */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                  {language === 'zh' ? '定义您的理想客户画像 (ICP)' : 'Define your ICP'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh'
                    ? '帮助Meridian更好地识别和分析您的目标客户'
                    : 'Help Meridian better identify and analyze your target customers'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    <Building2 className="w-4 h-4 inline mr-1.5" />
                    {language === 'zh' ? '目标行业' : 'Target Industries'}
                  </label>
                  <Textarea
                    value={icpIndustries}
                    onChange={(e) => setIcpIndustries(e.target.value)}
                    placeholder={language === 'zh'
                      ? '例如：制造业、汽车、钢铁、有色金属回收...'
                      : 'e.g., Manufacturing, Automotive, Steel, Non-ferrous Metal Recycling...'}
                    className="min-h-[60px] resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    <Target className="w-4 h-4 inline mr-1.5" />
                    {language === 'zh' ? '目标公司规模' : 'Target Company Size'}
                  </label>
                  <Input
                    value={icpCompanySize}
                    onChange={(e) => setIcpCompanySize(e.target.value)}
                    placeholder={language === 'zh' ? '例如：500+员工，年收入>1亿' : 'e.g., 500+ employees, >$100M revenue'}
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    <Users className="w-4 h-4 inline mr-1.5" />
                    {language === 'zh' ? '目标决策者职位' : 'Target Decision Maker Titles'}
                  </label>
                  <Textarea
                    value={icpTitles}
                    onChange={(e) => setIcpTitles(e.target.value)}
                    placeholder={language === 'zh'
                      ? '例如：采购总监、供应链VP、可持续发展负责人...'
                      : 'e.g., VP of Procurement, Supply Chain Director, Head of Sustainability...'}
                    className="min-h-[60px] resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {language === 'zh' ? '客户痛点' : 'Customer Pain Points'}
                  </label>
                  <Textarea
                    value={icpPainPoints}
                    onChange={(e) => setIcpPainPoints(e.target.value)}
                    placeholder={language === 'zh'
                      ? '例如：废料定价不透明、全球供应商匹配困难、合规风险...'
                      : 'e.g., Opaque scrap pricing, difficulty matching global suppliers, compliance risks...'}
                    className="min-h-[60px] resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '上一步' : 'Back'}
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={isCreating}
                  className="px-8 bg-primary hover:bg-primary/90"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {language === 'zh' ? '正在创建...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {language === 'zh' ? '开始使用 Meridian' : 'Launch Meridian'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
