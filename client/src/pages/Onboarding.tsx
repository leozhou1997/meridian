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
  Globe, ArrowRight, ArrowLeft, Check,
  Loader2, Building2, Target, Users, Sparkles,
  CheckCircle2, Upload
} from 'lucide-react';

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = [
    { en: 'Your Company', zh: '你的公司' },
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
                  {language === 'zh' ? `第 ${step} 步` : `Step ${step}`}
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
  const { language } = useLanguage();
  const [step, setStep] = useState(1);

  // M7: Guard — redirect if already onboarded
  const { data: existingProfile, isLoading: profileLoading } = trpc.onboarding.getCompanyProfile.useQuery();
  if (!profileLoading && existingProfile) {
    // Already onboarded, redirect to dashboard
    navigate('/', { replace: true });
    return null;
  }

  // Step 1: Your Company Info
  const [companyUrl, setCompanyUrl] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [companyAnalysis, setCompanyAnalysis] = useState<{
    companyName: string;
    description: string;
    industry: string;
    products: string[];
    targetMarket: string;
    headquarters: string;
    estimatedSize: string;
    keyDifferentiator: string;
  } | null>(null);

  // Step 2: Sales Process
  const defaultStagesEn = ['Discovery', 'Demo', 'Technical Evaluation', 'POC', 'Negotiation'];
  const defaultStagesZh = ['需求发现', '产品演示', '技术评估', 'POC验证', '商务谈判'];
  const [salesStages, setSalesStages] = useState(
    language === 'zh' ? defaultStagesZh : defaultStagesEn
  );
  const [avgDealSize, setAvgDealSize] = useState('');
  const [avgDealCycle, setAvgDealCycle] = useState('');
  const [salesTeamSize, setSalesTeamSize] = useState('');

  // Step 3: ICP
  const [icpIndustries, setIcpIndustries] = useState('');
  const [icpCompanySize, setIcpCompanySize] = useState('');
  const [icpTitles, setIcpTitles] = useState('');
  const [icpPainPoints, setIcpPainPoints] = useState('');

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  const analyzeCompany = trpc.onboarding.analyzeCompanyUrl.useMutation();
  const saveProfile = trpc.onboarding.saveCompanyProfile.useMutation();

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
      toast.error(err.message || (language === 'zh' ? '分析失败' : 'Analysis failed'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [companyUrl, knowledgeBase, analyzeCompany, language]);

  // Final: Save company profile and go to dashboard
  const handleFinish = useCallback(async () => {
    if (!companyAnalysis?.companyName) {
      toast.error(language === 'zh' ? '请先分析公司网站' : 'Please analyze your company website first');
      return;
    }
    setIsSaving(true);
    try {
      await saveProfile.mutateAsync({
        companyName: companyAnalysis.companyName,
        companyWebsite: companyUrl.trim(),
        companyDescription: companyAnalysis.description,
        industry: companyAnalysis.industry,
        products: companyAnalysis.products,
        targetMarket: companyAnalysis.targetMarket,
        headquarters: companyAnalysis.headquarters || undefined,
        estimatedSize: companyAnalysis.estimatedSize || undefined,
        keyDifferentiator: companyAnalysis.keyDifferentiator || undefined,
        salesStages,
        avgDealSize: avgDealSize || undefined,
        avgDealCycle: avgDealCycle || undefined,
        salesTeamSize: salesTeamSize || undefined,
        icpIndustries: icpIndustries || undefined,
        icpCompanySize: icpCompanySize || undefined,
        icpTitles: icpTitles || undefined,
        icpPainPoints: icpPainPoints || undefined,
        knowledgeBaseText: knowledgeBase || undefined,
      });
      toast.success(language === 'zh' ? '公司档案已保存！欢迎使用 Meridian' : 'Company profile saved! Welcome to Meridian');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || (language === 'zh' ? '保存失败' : 'Failed to save profile'));
    } finally {
      setIsSaving(false);
    }
  }, [companyAnalysis, companyUrl, salesStages, avgDealSize, avgDealCycle, salesTeamSize, icpIndustries, icpCompanySize, icpTitles, icpPainPoints, knowledgeBase, saveProfile, language, navigate]);

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
        <div className="mt-8 space-y-3 text-xs text-muted-foreground/70">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary/50" />
            <span>{language === 'zh' ? '告诉我们你的公司和产品' : 'Tell us about your company & product'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary/50" />
            <span>{language === 'zh' ? 'AI 将学习你的销售方法论' : 'AI learns your sales methodology'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary/50" />
            <span>{language === 'zh' ? '开始创建你的第一个 Deal' : 'Start creating your first Deal'}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
        <div className="w-full max-w-2xl">
          {/* Skip / Back to Dashboard */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => navigate('/')}
            >
              {language === 'zh' ? '跳过，稍后设置' : 'Skip, set up later'}
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          <StepIndicator current={step} total={3} />

          {/* Step 1: Your Company */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                  {language === 'zh' ? '告诉我们关于你的公司' : 'Tell us about your company'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh'
                    ? '输入你的公司网址，AI 将自动分析并建立知识库'
                    : 'Enter your company website, AI will analyze and build your knowledge base'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {language === 'zh' ? '你的公司网址' : 'Your company website'}
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

                {/* Analysis loading */}
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

                {/* Analysis result */}
                {companyAnalysis && !isAnalyzing && (
                  <Card className="border-green-500/30 bg-green-500/5">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
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
                        {companyAnalysis.keyDifferentiator && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">{language === 'zh' ? '核心优势' : 'Key Differentiator'}:</span>
                            <p className="font-medium text-foreground">{companyAnalysis.keyDifferentiator}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {language === 'zh' ? '补充产品知识库（可选）' : 'Additional product knowledge (optional)'}
                  </label>
                  <Textarea
                    value={knowledgeBase}
                    onChange={(e) => setKnowledgeBase(e.target.value)}
                    placeholder={language === 'zh'
                      ? '粘贴产品文档、销售资料、公司介绍等任何有助于AI理解你产品的内容...'
                      : 'Paste product documentation, sales materials, company intro, or any content that helps AI understand your product...'}
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {language === 'zh' ? '支持粘贴文本内容' : 'Paste text content'}
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
                  {language === 'zh' ? '定义你的销售流程' : 'Define your sales process'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh'
                    ? '帮助 Meridian 理解你的销售阶段和团队结构'
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
                  {language === 'zh' ? '定义你的理想客户画像 (ICP)' : 'Define your Ideal Customer Profile'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh'
                    ? '帮助 Meridian 更精准地分析和匹配你的目标客户'
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
                  disabled={isSaving}
                  className="px-8 bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {language === 'zh' ? '正在保存...' : 'Saving...'}
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
