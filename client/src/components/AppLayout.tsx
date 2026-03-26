import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { trpc } from '@/lib/trpc';
import { formatCurrency, getConfidenceColor } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, LayoutDashboard, Users, FileText, MessageSquare,
  Search, LogOut, ChevronDown, ChevronRight, Settings, Sun, Moon, BookOpen, Plus,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const stages = ['Discovery', 'Demo', 'Technical Evaluation', 'POC', 'Negotiation', 'Closed Won', 'Closed Lost'] as const;

const PIPELINE_COLLAPSED_KEY = 'pipeline-sidebar-collapsed';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    new Set(['Discovery', 'Demo', 'Technical Evaluation', 'POC', 'Negotiation'])
  );

  // Determine if we're on a deal detail page
  const isDealPage = /^\/deal\/\d+/.test(location);

  // Sidebar collapsed state — auto-collapse on deal pages, remember user preference otherwise
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // On deal pages, start collapsed
    if (isDealPage) return true;
    const saved = localStorage.getItem(PIPELINE_COLLAPSED_KEY);
    return saved === 'true';
  });

  // When navigating to a deal page, auto-collapse; when leaving, restore preference
  useEffect(() => {
    if (isDealPage) {
      setIsCollapsed(true);
    } else {
      const saved = localStorage.getItem(PIPELINE_COLLAPSED_KEY);
      setIsCollapsed(saved === 'true');
    }
  }, [isDealPage]);

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      // Only persist preference when not on a deal page
      if (!isDealPage) {
        localStorage.setItem(PIPELINE_COLLAPSED_KEY, String(next));
      }
      return next;
    });
  };

  // Real data from API
  const { data: deals = [] } = trpc.deals.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const toggleStage = (stage: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  const filteredDeals = deals.filter(d =>
    (d.name?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()) ||
    (d.company?.toLowerCase() ?? '').includes(searchQuery.toLowerCase())
  );

  // Compute pipeline stats from real data
  const totalPipeline = deals.reduce((s, d) => s + (d.value ?? 0), 0);
  const predictableRevenue = deals
    .filter(d => (d.confidenceScore ?? 0) >= 70)
    .reduce((s, d) => s + (d.value ?? 0), 0);

  const navItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
    { icon: Users, label: t('nav.stakeholders'), path: '/stakeholders' },
    { icon: FileText, label: t('nav.transcripts'), path: '/transcripts' },
    { icon: BookOpen, label: t('nav.knowledge'), path: '/knowledge' },
    { icon: MessageSquare, label: t('nav.ask'), path: '/ask' },
  ];

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=4f46e5&color=fff&size=64`;

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
                onClick={toggleTheme}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
              >
                {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-display text-xs">
              {theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link href="/settings">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    location === '/settings'
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <Settings className="w-[18px] h-[18px]" />
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-display text-xs">{t('nav.settings')}</TooltipContent>
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
            <TooltipContent side="right" className="font-display text-xs">{t('nav.signout')}</TooltipContent>
          </Tooltip>

          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-sidebar-border mt-1">
            <img src={avatarUrl} alt={user?.name ?? 'User'} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Pipeline sidebar — collapsible; on deal pages it floats as overlay to avoid squeezing content */}
      <div
        className={`bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
          isDealPage
            ? `absolute left-[60px] top-0 bottom-0 z-30 shadow-2xl ${isCollapsed ? 'w-0 border-r-0' : 'w-[260px]'}`
            : `shrink-0 ${isCollapsed ? 'w-0 border-r-0' : 'w-[260px]'}`
        }`}
      >
        <div className="w-[260px] flex flex-col h-full">
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-sm font-semibold text-sidebar-foreground">{t('pipeline.overview')}</h2>
              <div className="flex items-center gap-1">
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate('/deal/new')}
                      className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-display text-xs">{t('pipeline.newDeal')}</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('pipeline.searchDeals')}
                className="h-8 pl-8 text-xs bg-sidebar-accent/50 border-sidebar-border"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {deals.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <p className="text-xs text-muted-foreground">{t('pipeline.noDeals')}</p>
                  <button
                    onClick={() => navigate('/deal/new')}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    {t('pipeline.createFirst')}
                  </button>
                </div>
              ) : (
                stages.map(stage => {
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
                                    (deal.confidenceScore ?? 0) >= 75 ? 'bg-status-success' :
                                    (deal.confidenceScore ?? 0) >= 50 ? 'bg-status-warning' : 'bg-status-danger'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium text-sidebar-foreground truncate">{deal.company}</span>
                                      <span className="text-[10px] font-mono text-muted-foreground ml-1">{formatCurrency(deal.value ?? 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                      <span className="text-[10px] text-muted-foreground">Day {deal.daysInStage ?? 0}</span>
                                      <span className={`text-[10px] font-mono font-medium ${getConfidenceColor(deal.confidenceScore ?? 0)}`}>
                                        {deal.confidenceScore ?? 0}%
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
                })
              )}
            </div>
          </ScrollArea>

          {/* Pipeline stats footer */}
          <div className="p-4 border-t border-sidebar-border space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t('pipeline.totalPipeline')}</span>
              <span className="font-mono font-medium text-foreground">{formatCurrency(totalPipeline)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t('pipeline.predictableRevenue')}</span>
              <span className="font-mono font-medium text-status-success">{formatCurrency(predictableRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop overlay — only on deal pages when pipeline is open */}
      {isDealPage && !isCollapsed && (
        <div
          className="absolute left-[60px] top-0 bottom-0 right-0 z-20 bg-background/60 backdrop-blur-[2px]"
          onClick={toggleCollapsed}
          aria-label="Close pipeline"
        />
      )}

      {/* Toggle button — on deal pages it's always visible at the left edge of main content */}
      <div className={`relative shrink-0 flex items-start pt-3 ${isDealPage ? 'z-40' : ''}`}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleCollapsed}
              className="w-5 h-8 -ml-2.5 z-10 flex items-center justify-center rounded-r-md bg-sidebar border border-l-0 border-sidebar-border text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all"
              aria-label={isCollapsed ? 'Expand pipeline' : 'Collapse pipeline'}
            >
              {isCollapsed
                ? <PanelLeftOpen className="w-3 h-3" />
                : <PanelLeftClose className="w-3 h-3" />
              }
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-display text-xs">
            {isCollapsed ? t('pipeline.show') : t('pipeline.hide')}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
