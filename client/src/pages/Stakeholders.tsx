import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';
import { CompanyLogo, StakeholderAvatar } from '@/components/Avatars';

const SENTIMENT_ICON = {
  Positive: TrendingUp,
  Neutral: Minus,
  Negative: TrendingDown,
};

const SENTIMENT_COLOR = {
  Positive: 'text-status-success',
  Neutral: 'text-muted-foreground',
  Negative: 'text-status-danger',
};

const ROLE_COLORS: Record<string, string> = {
  'Economic Buyer':    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Champion':          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Technical Buyer':   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'End User':          'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'Blocker':           'bg-red-500/10 text-red-400 border-red-500/20',
  'Influencer':        'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Coach':             'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

function getRoleColor(role: string) {
  return ROLE_COLORS[role] ?? 'bg-muted/50 text-muted-foreground border-border/50';
}

export default function Stakeholders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDeals, setExpandedDeals] = useState<Set<number>>(new Set());

  const { data: deals = [], isLoading: dealsLoading } = trpc.deals.list.useQuery();
  const { data: allStakeholders = [], isLoading: stakeholdersLoading } = trpc.stakeholders.listAll.useQuery();

  const isLoading = dealsLoading || stakeholdersLoading;

  const toggleDeal = (dealId: number) => {
    setExpandedDeals(prev => {
      const next = new Set(prev);
      if (next.has(dealId)) next.delete(dealId);
      else next.add(dealId);
      return next;
    });
  };

  // Group stakeholders by deal
  const stakeholdersByDeal = allStakeholders.reduce((acc, s) => {
    if (!acc[s.dealId]) acc[s.dealId] = [];
    acc[s.dealId].push(s);
    return acc;
  }, {} as Record<number, typeof allStakeholders>);

  const filteredDeals = deals.map(deal => ({
    ...deal,
    filteredStakeholders: (stakeholdersByDeal[deal.id] ?? []).filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.company.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(d => d.filteredStakeholders.length > 0);

  const totalStakeholders = allStakeholders.length;

  return (
    <div className="p-6 max-w-[960px]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold mb-1">Stakeholders</h1>
          <p className="text-muted-foreground text-sm">
            {totalStakeholders} contacts across {deals.length} deals
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, title, or company..."
            className="pl-10 h-9 text-sm"
          />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        )}

        {/* Grouped by Deal */}
        {!isLoading && (
          <div className="space-y-3">
            {filteredDeals.map(deal => {
              const isExpanded = expandedDeals.has(deal.id);
              const positiveCount = deal.filteredStakeholders.filter(s => s.sentiment === 'Positive').length;
              const negativeCount = deal.filteredStakeholders.filter(s => s.sentiment === 'Negative').length;

              return (
                <Card key={deal.id} className="bg-card border-border/50 overflow-hidden">
                  {/* Deal header */}
                  <button
                    onClick={() => toggleDeal(deal.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
                  >
                    <CompanyLogo name={deal.company} logoUrl={deal.logo} size="sm" />
                    <div className="flex-1 min-w-0">
                      <span className="font-display text-sm font-semibold">{deal.company}</span>
                      <span className="text-xs text-muted-foreground ml-2">{deal.stage}</span>
                    </div>

                    {/* Sentiment summary */}
                    <div className="flex items-center gap-2 mr-2">
                      {positiveCount > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-status-success">
                          <TrendingUp className="w-3 h-3" />{positiveCount}
                        </span>
                      )}
                      {negativeCount > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-status-danger">
                          <TrendingDown className="w-3 h-3" />{negativeCount}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {deal.filteredStakeholders.length} contact{deal.filteredStakeholders.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>

                  {/* Stakeholder grid */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="border-t border-border/40 p-3">
                          <div className="grid grid-cols-2 gap-2">
                            {deal.filteredStakeholders.map(s => {
                              const SentimentIcon = SENTIMENT_ICON[s.sentiment] ?? Minus;
                              const sentimentColor = SENTIMENT_COLOR[s.sentiment] ?? 'text-muted-foreground';
                              const roles = Array.isArray(s.roles) ? (s.roles as string[]) : (s.role ? [s.role] : []);

                              return (
                                <Link key={`${deal.id}-${s.id}`} href={`/deal/${deal.id}`}>
                                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-accent/40 transition-all cursor-pointer border border-transparent hover:border-border/50">
                                    <StakeholderAvatar name={s.name} avatarUrl={s.avatar} size="md" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate">{s.name}</div>
                                      <div className="text-xs text-muted-foreground truncate">{s.title}</div>
                                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                        {roles.slice(0, 2).map(r => (
                                          <Badge key={r} variant="outline" className={`text-[9px] px-1.5 py-0 ${getRoleColor(r)}`}>
                                            {r}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div className={`shrink-0 ${sentimentColor}`}>
                                      <SentimentIcon className="w-4 h-4" />
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}

            {filteredDeals.length === 0 && !isLoading && (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {searchQuery ? 'No stakeholders match your search.' : 'No stakeholders yet. Add them from the Deal Detail page.'}
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
