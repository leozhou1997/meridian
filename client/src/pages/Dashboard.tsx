import { Link } from 'wouter';
import { deals, formatCurrency, getConfidenceColor, getConfidenceBg, getStageColor, formatDate, pipelineStats } from '@/lib/data';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, ArrowRight, Clock, Target, BarChart3, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Dashboard() {
  const atRiskDeals = deals.filter(d => d.confidenceScore < 60 || d.daysInStage > 90);
  const recentSnapshots = deals
    .flatMap(d => d.snapshots.map(s => ({ ...s, dealName: d.company, dealId: d.id, dealLogo: d.logo })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const stageGroups = ['Discovery', 'Demo', 'Technical Evaluation', 'POC', 'Negotiation'].map(stage => ({
    stage,
    count: deals.filter(d => d.stage === stage).length,
    value: deals.filter(d => d.stage === stage).reduce((s, d) => s + d.value, 0),
  }));
  const maxCount = Math.max(...stageGroups.map(g => g.count), 1);

  return (
    <div className="p-6 max-w-[1200px]">
      <motion.div variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={item} className="mb-8">
          <h1 className="font-display text-2xl font-bold mb-1">Good morning, Leo</h1>
          <p className="text-muted-foreground text-sm">Here's what needs your attention today.</p>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={item} className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Pipeline', value: formatCurrency(pipelineStats.totalPipeline), icon: BarChart3, color: 'text-primary' },
            { label: 'Predictable Revenue', value: formatCurrency(pipelineStats.predictableRevenue), icon: Target, color: 'text-status-success' },
            { label: 'Avg Confidence', value: `${pipelineStats.avgConfidence}%`, icon: Shield, color: 'text-status-warning' },
            { label: 'At Risk Deals', value: `${pipelineStats.atRiskCount}`, icon: AlertTriangle, color: 'text-status-danger' },
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

        <div className="grid grid-cols-5 gap-6">
          {/* Left column — At Risk + Pipeline */}
          <div className="col-span-3 space-y-6">
            {/* At Risk Deals */}
            <motion.div variants={item}>
              <Card className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-status-danger" />
                    <CardTitle className="text-sm font-display">Deals Needing Action</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {atRiskDeals.map(deal => (
                    <Link key={deal.id} href={`/deal/${deal.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all group">
                        <img
                          src={deal.logo}
                          alt={deal.company}
                          className="w-9 h-9 rounded-md bg-white/10 object-contain p-1"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${deal.company}&background=1a1f36&color=fff&size=64`; }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium truncate">{deal.company}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStageColor(deal.stage)}`}>
                              {deal.stage}
                            </Badge>
                          </div>
                          <p className="text-xs text-status-danger/80 truncate">{deal.riskOneLiner}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono text-xs font-medium">{formatCurrency(deal.value)}</div>
                          <div className={`font-mono text-xs font-medium ${getConfidenceColor(deal.confidenceScore)}`}>
                            {deal.confidenceScore}%
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    </Link>
                  ))}
                  {atRiskDeals.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No deals at risk. Great work!
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
                    <CardTitle className="text-sm font-display">Pipeline by Stage</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stageGroups.map(group => (
                    <div key={group.stage} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-32 shrink-0 truncate">{group.stage}</span>
                      <div className="flex-1">
                        <div className="h-6 bg-muted/30 rounded overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(group.count / maxCount) * 100}%` }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="h-full bg-primary/40 rounded flex items-center px-2"
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
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right column — Recent Insights */}
          <div className="col-span-2">
            <motion.div variants={item}>
              <Card className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-status-info" />
                    <CardTitle className="text-sm font-display">Recent Insights</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {recentSnapshots.map((snap, i) => (
                    <Link key={snap.id} href={`/deal/${snap.dealId}`}>
                      <div className="p-3 rounded-lg hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-2 mb-1.5">
                          <img
                            src={snap.dealLogo}
                            alt=""
                            className="w-5 h-5 rounded bg-white/10 object-contain p-0.5"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${snap.dealName}&background=1a1f36&color=fff&size=32`; }}
                          />
                          <span className="text-xs font-medium">{snap.dealName}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(snap.date)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {snap.whatsHappening}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getConfidenceBg(snap.confidenceScore)}`}>
                            {snap.confidenceScore}%
                          </Badge>
                          {snap.confidenceChange !== 0 && (
                            <span className={`flex items-center gap-0.5 text-[10px] font-mono ${
                              snap.confidenceChange > 0 ? 'text-status-success' : 'text-status-danger'
                            }`}>
                              {snap.confidenceChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {snap.confidenceChange > 0 ? '+' : ''}{snap.confidenceChange}
                            </span>
                          )}
                        </div>
                        {i < recentSnapshots.length - 1 && <div className="border-b border-border/30 mt-3" />}
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
