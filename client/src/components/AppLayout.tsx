import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { deals, formatCurrency, getConfidenceColor, pipelineStats } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, LayoutDashboard, Users, FileText, MessageSquare,
  Search, LogOut, ChevronDown, ChevronRight, Settings
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

const stages = ['Discovery', 'Demo', 'Technical Evaluation', 'POC', 'Negotiation', 'Closed Won', 'Closed Lost'] as const;

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    new Set(stages.filter(s => deals.some(d => d.stage === s)).slice(0, 5))
  );

  const toggleStage = (stage: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  const filteredDeals = deals.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Stakeholders', path: '/stakeholders' },
    { icon: FileText, label: 'Transcripts', path: '/transcripts' },
    { icon: MessageSquare, label: 'Ask Meridian', path: '/ask' },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Icon sidebar */}
      <div className="w-[60px] bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 shrink-0">
        <Link href="/">
          <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center mb-6 hover:bg-primary/30 transition-colors">
            <Compass className="w-5 h-5 text-primary" />
          </div>
        </Link>

        <nav className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link href={item.path}>
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      }`}
                    >
                      <item.icon className="w-[18px] h-[18px]" />
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-display text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-2">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => toast('Settings coming soon')}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
              >
                <Settings className="w-[18px] h-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-display text-xs">Settings</TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="w-[18px] h-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-display text-xs">Sign out</TooltipContent>
          </Tooltip>

          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-sidebar-border mt-1">
            <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Pipeline sidebar */}
      <div className="w-[260px] bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="font-display text-sm font-semibold text-sidebar-foreground mb-3">Pipeline Overview</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals..."
              className="h-8 pl-8 text-xs bg-sidebar-accent/50 border-sidebar-border"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {stages.map(stage => {
              const stageDeals = filteredDeals.filter(d => d.stage === stage);
              if (stageDeals.length === 0) return null;
              const isExpanded = expandedStages.has(stage);

              return (
                <div key={stage} className="mb-1">
                  <button
                    onClick={() => toggleStage(stage)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded"
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <span>{stage}</span>
                    <span className="ml-auto text-[10px] bg-muted rounded px-1.5 py-0.5">{stageDeals.length}</span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && stageDeals.map(deal => {
                      const isActive = location === `/deal/${deal.id}`;
                      return (
                        <motion.div
                          key={deal.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Link href={`/deal/${deal.id}`}>
                            <div
                              className={`flex items-center gap-2.5 px-2 py-2 rounded-md mx-1 mb-0.5 transition-all duration-150 ${
                                isActive
                                  ? 'bg-sidebar-accent border border-sidebar-border'
                                  : 'hover:bg-sidebar-accent/50'
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full shrink-0 ${
                                deal.confidenceScore >= 75 ? 'bg-status-success' :
                                deal.confidenceScore >= 50 ? 'bg-status-warning' : 'bg-status-danger'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-sidebar-foreground truncate">{deal.company}</span>
                                  <span className="text-[10px] font-mono text-muted-foreground ml-1">{formatCurrency(deal.value)}</span>
                                </div>
                                <div className="flex items-center justify-between mt-0.5">
                                  <span className="text-[10px] text-muted-foreground">Day {deal.daysInStage}</span>
                                  <span className={`text-[10px] font-mono font-medium ${getConfidenceColor(deal.confidenceScore)}`}>
                                    {deal.confidenceScore}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Pipeline stats footer */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total Pipeline</span>
            <span className="font-mono font-medium text-foreground">{formatCurrency(pipelineStats.totalPipeline)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Predictable Revenue</span>
            <span className="font-mono font-medium text-status-success">{formatCurrency(pipelineStats.predictableRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
