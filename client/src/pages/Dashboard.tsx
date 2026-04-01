import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { formatCurrency, getConfidenceColor, getConfidenceBg, getStageColor, formatDate } from '@/lib/data';
import { useAuth } from '@/_core/hooks/useAuth';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, ArrowRight, Clock, Target, BarChart3, Shield, Plus, Sparkles, Search, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { CompanyLogo } from '@/components/Avatars';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();

  const { data: deals = [], isLoading } = trpc.deals.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const { data: companyProfile } = trpc.onboarding.getCompanyProfile.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const { data: overdueActions = [] } = trpc.nextActions.listOverdue.useQuery(undefined, {
    refetchOnWindowFocus: true,
  });

  const atRiskDeals = deals.filter(d => (d.confidenceScore ?? 0) < 60 || (d.daysInStage ?? 0) > 90);
  const totalPipeline = deals.reduce((s, d) => s + (d.value ?? 0), 0);
  const predictableRevenue = deals.filter(d => (d.confidenceScore ?? 0) >= 70).reduce((s, d) => s + (d.value ?? 0), 0);
  const avgConfidence = deals.length > 0
    ? Math.round(deals.reduce((s, d) => s + (d.confidenceScore ?? 0), 0) / deals.length)
    : 0;

  const stageGroups = ['Discovery', 'Demo', 'Technical Evaluation', 'POC', 'Negotiation'].map(stage => ({
    stage,
    count: deals.filter(d => d.stage === stage).length,
    value: deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value ?? 0), 0),
  }));
  const maxCount = Math.max(...stageGroups.map(g => g.count), 1);
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const filteredDeals = selectedStage ? deals.filter(d => d.stage === selectedStage) : deals;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-[1200px]">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  // If no company profile AND no deals, show onboarding prompt
  const needsOnboarding = !isLoading && !companyProfile && deals.length === 0;

  if (needsOnboarding) {
    return (
      <div className="p-6 max-w-[800px] mx-auto">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-3">
              {language === 'zh' ? `欢迎使用 Meridian, ${firstName}` : `Welcome to Meridian, ${firstName}`}
            </h1>
            <p className="text-muted-foreground text-base mb-8 max-w-md mx-auto">
              {language === 'zh'
                ? '让我们先设置你的公司档案，这样 AI 就能更好地理解你的业务和销售流程'
                : 'Let\'s set up your company profile so AI can better understand your business and sales process'}
            </p>
            <Button onClick={() => navigate('/onboarding')} size="lg" className="px-8 h-12 text-base">
              <Building2 className="w-5 h-5 mr-2" />
              {language === 'zh' ? '开始设置' : 'Get Started'}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Empty state: profile exists but no deals
  const hasNoDeals = !isLoading && deals.length === 0 && companyProfile;

  if (hasNoDeals) {
    return (
      <div className="p-6 max-w-[800px] mx-auto">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="mb-6">
            <h1 className="font-display text-2xl font-bold mb-1">{t('dashboard.greeting')}, {firstName}</h1>
            <p className="text-sm text-muted-foreground">
              {language === 'zh'
                ? `公司档案已设置完成（${companyProfile.companyName}）。现在创建你的第一个交易吧！`
                : `Company profile set up (${companyProfile.companyName}). Create your first Deal!`}
            </p>
          </motion.div>

          <motion.div variants={item} className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">
              {language === 'zh' ? '创建你的第一个交易' : 'Create your first Deal'}
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              {language === 'zh'
                ? '输入目标客户的网址，AI Agent 将自动爬取信息、分析公司、识别关键决策者，并生成完整的 Deal Map'
                : 'Enter the target customer URL. AI Agent will crawl, analyze, identify stakeholders, and generate a complete Deal Map'}
            </p>
            <Button onClick={() => navigate('/deal/new')} size="lg" className="px-8 h-12 text-base">
              <Plus className="w-5 h-5 mr-2" />
              {language === 'zh' ? '新建交易' : 'New Deal'}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1200px]">
      <motion.div variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={item} className="mb-6 md:mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold mb-1">{t('dashboard.greeting')}, {firstName}</h1>
            <p className="text-muted-foreground text-sm hidden md:block">
              {t('dashboard.attention')}
            </p>
          </div>
          <Button onClick={() => navigate('/deal/new')} size="sm" className="gap-1.5 shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'zh' ? '新建交易' : 'New Deal'}</span>
          </Button>
        </motion.div>

        {/* Overdue Actions Banner */}
        {overdueActions.length > 0 && (
          <motion.div variants={item} className="mb-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold">
                  {language === 'zh' ? `${overdueActions.length} 个逾期行动需要关注` : `${overdueActions.length} overdue action${overdueActions.length > 1 ? 's' : ''} need attention`}
                </span>
                <div className="text-[11px] text-red-400/70 mt-0.5 truncate">
                  {overdueActions.slice(0, 2).map(a => a.text).join(' · ')}{overdueActions.length > 2 ? (language === 'zh' ? ` +${overdueActions.length - 2} 更多` : ` +${overdueActions.length - 2} more`) : ''}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* KPI Cards */}
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {[
            { label: t('dashboard.totalPipeline'), value: formatCurrency(totalPipeline), icon: BarChart3, color: 'text-primary' },
            { label: t('dashboard.predictableRevenue'), value: formatCurrency(predictableRevenue), icon: Target, color: 'text-status-success' },
            { label: t('dashboard.avgConfidence'), value: `${avgConfidence}%`, icon: Shield, color: 'text-status-warning' },
            { label: t('dashboard.atRiskDeals'), value: `${atRiskDeals.length}`, icon: AlertTriangle, color: 'text-status-danger' },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <div className={`font-display text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
          {/* Left column — At Risk + Pipeline */}
          <div className="md:col-span-3 space-y-4 md:space-y-6">
            {/* At Risk Deals */}
            <motion.div variants={item}>
              <Card className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-status-danger" />
                    <CardTitle className="text-sm font-display">{t('dashboard.dealsNeedingAction')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {atRiskDeals.map(deal => (
                    <Link key={deal.id} href={`/deal/${deal.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all group">
                        <CompanyLogo name={deal.company} logoUrl={deal.logo} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium truncate">{deal.company}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStageColor(deal.stage)}`}>
                              {deal.stage}
                            </Badge>
                          </div>
                          <p className="text-xs text-status-danger/80 truncate">{deal.riskOneLiner ?? (language === 'zh' ? '需要关注' : 'Needs attention')}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono text-xs font-medium">{formatCurrency(deal.value ?? 0)}</div>
                          <div className={`font-mono text-xs font-medium ${getConfidenceColor(deal.confidenceScore ?? 0)}`}>
                            {deal.confidenceScore ?? 0}%
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    </Link>
                  ))}
                  {atRiskDeals.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      {language === 'zh' ? '没有风险交易，做得好！' : 'No deals at risk. Great work!'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Pipeline Bar Chart */}
            <motion.div variants={item}>
              <Card className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-display">{t('dashboard.pipelineByStage')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stageGroups.map(group => (
                    <div
                      key={group.stage}
                      className={`flex items-center gap-3 px-2 py-1 -mx-2 rounded-lg cursor-pointer transition-all ${
                        selectedStage === group.stage
                          ? 'bg-primary/10 ring-1 ring-primary/30'
                          : 'hover:bg-muted/40'
                      }`}
                      onClick={() => setSelectedStage(selectedStage === group.stage ? null : group.stage)}
                    >
                      <span className={`text-xs w-32 shrink-0 truncate ${
                        selectedStage === group.stage ? 'text-primary font-medium' : 'text-muted-foreground'
                      }`}>{group.stage}</span>
                      <div className="flex-1">
                        <div className="h-6 bg-muted/30 rounded overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(group.count / maxCount) * 100}%` }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className={`h-full rounded flex items-center px-2 ${
                              selectedStage === group.stage ? 'bg-primary/60' : 'bg-primary/40'
                            }`}
                          >
                            <span className="text-[10px] font-mono font-medium text-primary-foreground">
                              {group.count}
                            </span>
                          </motion.div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-16 text-right">{formatCurrency(group.value)}</span>
                    </div>
                  ))}
                  {selectedStage && (
                    <button
                      onClick={() => setSelectedStage(null)}
                      className="text-[10px] text-primary hover:text-primary/80 transition-colors mt-1"
                    >
                      {language === 'zh' ? '清除筛选' : 'Clear filter'}
                    </button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right column — All Deals */}
          <div className="md:col-span-2">
            <motion.div variants={item}>
              <Card className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-display">{t('dashboard.allDeals')}</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {selectedStage ? (
                        <span className="text-primary font-medium">{filteredDeals.length} in {selectedStage}</span>
                      ) : (
                        <>{deals.length} {t('dashboard.total')}</>
                      )}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 p-3">
                  {filteredDeals.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      {selectedStage
                        ? (language === 'zh' ? `${selectedStage} 阶段暂无 Deal` : `No deals in ${selectedStage}`)
                        : (language === 'zh' ? '暂无 Deal' : 'No deals yet')}
                    </p>
                  ) : (
                    filteredDeals.slice(0, 10).map(deal => (
                      <Link key={deal.id} href={`/deal/${deal.id}`}>
                        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/40 transition-all">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            (deal.confidenceScore ?? 0) >= 75 ? 'bg-status-success' :
                            (deal.confidenceScore ?? 0) >= 50 ? 'bg-status-warning' : 'bg-status-danger'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium truncate">{deal.company}</span>
                              <span className="text-[10px] font-mono text-muted-foreground ml-1">{formatCurrency(deal.value ?? 0)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{deal.stage}</span>
                              <span className={`text-[10px] font-mono font-medium ${getConfidenceColor(deal.confidenceScore ?? 0)}`}>
                                {deal.confidenceScore ?? 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
