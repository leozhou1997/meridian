import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { formatCurrency, getConfidenceColor, getStageColor } from '@/lib/data';
import { useLanguage } from '@/contexts/LanguageContext';
import { CompanyLogo } from '@/components/Avatars';
import { motion } from 'framer-motion';
import {
  Search, Plus, Filter, ArrowUpDown, Building2, Calendar,
  TrendingUp, ChevronDown, ChevronRight, MoreHorizontal, Eye
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const stages = ['Discovery', 'Demo', 'Technical Evaluation', 'POC', 'Negotiation', 'Closed Won', 'Closed Lost'] as const;

type ViewMode = 'table' | 'board';
type SortField = 'company' | 'value' | 'confidenceScore' | 'daysInStage' | 'updatedAt';
type SortDir = 'asc' | 'desc';

export default function Deals() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const { data: deals = [], isLoading } = trpc.deals.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    new Set(['Discovery', 'Demo', 'Technical Evaluation', 'POC', 'Negotiation'])
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filteredDeals = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return deals
      .filter(d =>
        (d.name?.toLowerCase() ?? '').includes(q) ||
        (d.company?.toLowerCase() ?? '').includes(q)
      )
      .sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1;
        const av = a[sortField] ?? 0;
        const bv = b[sortField] ?? 0;
        if (typeof av === 'string' && typeof bv === 'string') return mul * av.localeCompare(bv);
        return mul * ((av as number) - (bv as number));
      });
  }, [deals, searchQuery, sortField, sortDir]);

  const totalPipeline = deals.reduce((s, d) => s + (d.value ?? 0), 0);
  const avgConfidence = deals.length > 0
    ? Math.round(deals.reduce((s, d) => s + (d.confidenceScore ?? 0), 0) / deals.length)
    : 0;
  const activeDeals = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length;

  const toggleStage = (stage: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card/30 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Deals</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeDeals} active deals &middot; {formatCurrency(totalPipeline)} total pipeline &middot; {avgConfidence}% avg confidence
            </p>
          </div>
          <Button size="sm" onClick={() => navigate('/deal/new')} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            New Deal
          </Button>
        </div>

        {/* Search & filters bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals by company or name..."
              className="h-8 pl-9 text-xs"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-7 text-xs px-2.5"
            >
              Table
            </Button>
            <Button
              variant={viewMode === 'board' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('board')}
              className="h-7 text-xs px-2.5"
            >
              Board
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'table' ? (
          <TableView
            deals={filteredDeals}
            sortField={sortField}
            sortDir={sortDir}
            toggleSort={toggleSort}
            navigate={navigate}
          />
        ) : (
          <BoardView
            deals={filteredDeals}
            expandedStages={expandedStages}
            toggleStage={toggleStage}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  );
}

/* ── Table View ── */
function TableView({
  deals,
  sortField,
  sortDir,
  toggleSort,
  navigate,
}: {
  deals: any[];
  sortField: SortField;
  sortDir: SortDir;
  toggleSort: (f: SortField) => void;
  navigate: (path: string) => void;
}) {
  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : 'opacity-30'}`} />
    </button>
  );

  return (
    <div className="px-6 py-3">
      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_100px_100px_80px_40px] gap-4 px-3 py-2 border-b border-border/50">
        <SortHeader field="company">Company / Deal</SortHeader>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Stage</div>
        <SortHeader field="value">Value</SortHeader>
        <SortHeader field="confidenceScore">Confidence</SortHeader>
        <SortHeader field="daysInStage">Days</SortHeader>
        <div />
      </div>

      {/* Table rows */}
      {deals.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No deals found. Create your first deal to get started.
        </div>
      ) : (
        deals.map((deal, i) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <div
              onClick={() => navigate(`/deal/${deal.id}`)}
              className="grid grid-cols-[2fr_1fr_100px_100px_80px_40px] gap-4 px-3 py-3 border-b border-border/30 hover:bg-card/50 cursor-pointer transition-colors rounded-md"
            >
              {/* Company / Deal */}
              <div className="flex items-center gap-3 min-w-0">
                <CompanyLogo name={deal.company ?? ''} logoUrl={deal.logo} size="sm" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{deal.company}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{deal.name}</div>
                </div>
              </div>

              {/* Stage */}
              <div className="flex items-center">
                <Badge variant="outline" className={`text-[10px] ${getStageColor(deal.stage)}`}>
                  {deal.stage}
                </Badge>
              </div>

              {/* Value */}
              <div className="flex items-center">
                <span className="text-sm font-mono font-medium text-foreground">
                  {formatCurrency(deal.value ?? 0)}
                </span>
              </div>

              {/* Confidence */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      (deal.confidenceScore ?? 0) >= 75 ? 'bg-emerald-500' :
                      (deal.confidenceScore ?? 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${deal.confidenceScore ?? 0}%` }}
                  />
                </div>
                <span className={`text-xs font-mono ${getConfidenceColor(deal.confidenceScore ?? 0)}`}>
                  {deal.confidenceScore ?? 0}%
                </span>
              </div>

              {/* Days in stage */}
              <div className="flex items-center">
                <span className={`text-xs font-mono ${(deal.daysInStage ?? 0) > 30 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {deal.daysInStage ?? 0}d
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs">
                    <DropdownMenuItem onClick={() => navigate(`/deal/${deal.id}`)}>
                      <Eye className="w-3.5 h-3.5 mr-2" /> View Deal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}

/* ── Board View (Kanban-style) ── */
function BoardView({
  deals,
  expandedStages,
  toggleStage,
  navigate,
}: {
  deals: any[];
  expandedStages: Set<string>;
  toggleStage: (s: string) => void;
  navigate: (path: string) => void;
}) {
  return (
    <div className="flex gap-4 p-4 overflow-x-auto h-full">
      {stages.filter(s => s !== 'Closed Won' && s !== 'Closed Lost').map(stage => {
        const stageDeals = deals.filter(d => d.stage === stage);
        const stageValue = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0);

        return (
          <div key={stage} className="w-[260px] shrink-0 flex flex-col">
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">{stage}</span>
                <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                  {stageDeals.length}
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {formatCurrency(stageValue)}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 overflow-y-auto pb-4">
              {stageDeals.map(deal => (
                <Card
                  key={deal.id}
                  className="cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => navigate(`/deal/${deal.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CompanyLogo name={deal.company ?? ''} logoUrl={deal.logo} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground truncate">{deal.company}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{deal.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-medium">{formatCurrency(deal.value ?? 0)}</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          (deal.confidenceScore ?? 0) >= 75 ? 'bg-emerald-500' :
                          (deal.confidenceScore ?? 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span className={`text-[10px] font-mono ${getConfidenceColor(deal.confidenceScore ?? 0)}`}>
                          {deal.confidenceScore ?? 0}%
                        </span>
                      </div>
                    </div>
                    {deal.riskOneLiner && (
                      <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2">{deal.riskOneLiner}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {stageDeals.length === 0 && (
                <div className="text-center py-8 text-[10px] text-muted-foreground">
                  No deals
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
