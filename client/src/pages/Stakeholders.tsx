import { useState } from 'react';
import { deals, getRoleColor, getSentimentColor } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';

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

export default function Stakeholders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDeals, setExpandedDeals] = useState<Set<string>>(new Set(deals.map(d => d.id)));

  const toggleDeal = (dealId: string) => {
    setExpandedDeals(prev => {
      const next = new Set(prev);
      if (next.has(dealId)) next.delete(dealId);
      else next.add(dealId);
      return next;
    });
  };

  const filteredDeals = deals.map(deal => ({
    ...deal,
    filteredStakeholders: deal.stakeholders.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.company.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(d => d.filteredStakeholders.length > 0);

  const totalStakeholders = deals.reduce((sum, d) => sum + d.stakeholders.length, 0);

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

        {/* Grouped by Deal */}
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
                  <img
                    src={deal.logo}
                    alt=""
                    className="w-7 h-7 rounded bg-white/10 object-contain p-0.5 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${deal.company}&background=1a1f36&color=fff&size=28`; }}
                  />
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
                            const displayRoles = s.roles?.length ? s.roles : [s.role];

                            return (
                              <Link key={`${deal.id}-${s.id}`} href={`/deal/${deal.id}`}>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-accent/40 transition-all cursor-pointer border border-transparent hover:border-border/50">
                                  <img
                                    src={s.avatar}
                                    alt={s.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-border/40 shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${s.name}&background=2a3050&color=fff&size=40`; }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{s.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{s.title}</div>
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                      {displayRoles.slice(0, 2).map(r => (
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

          {filteredDeals.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No stakeholders match your search.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
