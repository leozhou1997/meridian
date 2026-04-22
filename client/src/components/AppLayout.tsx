import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { formatCurrency, getConfidenceColor, getStageName } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, LayoutDashboard, Users, FileText, MessageSquare,
  Search, LogOut, ChevronDown, ChevronRight, Settings, BookOpen, Plus,
  PanelLeftClose, ChevronLeft, Briefcase, Camera, Mic, StickyNote, X, Upload, Check
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

const stages = ['Discovery', 'Demo', 'Technical Evaluation', 'POC', 'Negotiation', 'Closed Won', 'Closed Lost'] as const;

// ── Pipeline sidebar context ──
interface PipelineCtx {
  isCollapsed: boolean;
  toggle: () => void;
  hasPipeline: boolean;
}
export const PipelineContext = createContext<PipelineCtx>({ isCollapsed: true, toggle: () => {}, hasPipeline: false });
export const usePipeline = () => useContext(PipelineContext);

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    new Set(['Discovery', 'Demo', 'Technical Evaluation', 'POC', 'Negotiation'])
  );

  // Pipeline sidebar ONLY on Deal detail pages (/deal/:id)
  const isDealPage = /^\/deal\/\d+/.test(location);
  const hasPipeline = isDealPage;

  // Sidebar state: default collapsed — user opens manually via toggle button
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggle = () => setIsCollapsed(prev => !prev);

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

  const totalPipeline = deals.reduce((s, d) => s + (d.value ?? 0), 0);
  const predictableRevenue = deals
    .filter(d => (d.confidenceScore ?? 0) >= 70)
    .reduce((s, d) => s + (d.value ?? 0), 0);

  const navItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard' },
    { icon: Briefcase, label: t('nav.deals') || 'Deals', path: '/deals' },
    { icon: Users, label: t('nav.stakeholders'), path: '/stakeholders' },
    { icon: FileText, label: t('nav.dealRoom') || 'Deal Room', path: '/deal-room' },
    { icon: BookOpen, label: t('nav.knowledge'), path: '/knowledge' },
    { icon: MessageSquare, label: t('nav.ask'), path: '/ask' },
  ];

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=4f46e5&color=fff&size=64`;

  return (
    <PipelineContext.Provider value={{ isCollapsed, toggle, hasPipeline }}>
      <div className="h-screen flex overflow-hidden bg-background pb-0 md:pb-0">
        {/* ── Icon sidebar (Layer 1 — highest z-index, desktop only) ── */}
        <div className="hidden md:flex w-[60px] bg-sidebar border-r border-sidebar-border flex-col items-center py-4 shrink-0 z-40 relative">
          <Link href="/dashboard">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 hover:bg-primary/20 transition-colors overflow-hidden">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663267900177/PHTFs288hUf3yaW9yWMkJw/meridian-logo-cropped_69e86f90.png"
                alt="Meridian"
                className="h-7 w-auto brightness-0 dark:invert opacity-80"
              />
            </div>
          </Link>

          <nav className="flex-1 flex flex-col items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.path || (item.path !== '/dashboard' && item.path !== '/' && location.startsWith(item.path));
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

            {/* New Deal button */}
            <div className="my-2 w-10 h-px bg-sidebar-border" />
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href="/deal/new">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/30 transition-all duration-200">
                    <Plus className="w-[18px] h-[18px]" />
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-display text-xs">
                {t('nav.newDeal') || 'New Deal'}
              </TooltipContent>
            </Tooltip>
          </nav>

          <div className="flex flex-col items-center gap-2">
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

          {/* ── Edge-tab handle: protruding tab on right edge of icon sidebar ── */}
          {/* Only visible on Deal pages when Pipeline sidebar is collapsed */}
          {hasPipeline && isCollapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={toggle}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full
                    w-5 h-14 rounded-r-md
                    bg-sidebar border border-l-0 border-sidebar-border
                    flex items-center justify-center
                    text-muted-foreground hover:text-foreground hover:bg-sidebar-accent
                    transition-all duration-200 shadow-md
                    z-50"
                  aria-label="Open deal switcher"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-display text-xs">
                {t('pipeline.show') || 'Show Deal Switcher'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* ── Pipeline sidebar (Layer 2 — overlays content on Deal pages) ── */}
        {hasPipeline && (
          <>
            <div
              className={`bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out overflow-hidden
                absolute left-[60px] top-0 bottom-0 z-30 shadow-2xl
                ${isCollapsed ? 'w-0 border-r-0' : 'w-[260px]'}`}
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
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={toggle}
                            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-all"
                          >
                            <PanelLeftClose className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-display text-xs">
                          {t('pipeline.hide') || 'Hide'}
                        </TooltipContent>
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
                              className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded"
                            >
                              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              <span>{getStageName(stage, language === 'zh')}</span>
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
                                    <Link href={`/deal/${deal.id}`} onClick={() => { if (!isActive) setIsCollapsed(true); }}>
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
                                            <span className="text-[10px] text-muted-foreground">{language === 'zh' ? `第 ${deal.daysInStage ?? 0} 天` : `Day ${deal.daysInStage ?? 0}`}</span>
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

            {/* Backdrop overlay — click to close */}
            {!isCollapsed && (
              <div
                className="absolute left-[60px] top-0 bottom-0 right-0 z-20 bg-background/60 backdrop-blur-[2px]"
                onClick={toggle}
                aria-label="Close pipeline"
              />
            )}
          </>
        )}

        {/* ── Main content (Layer 3) ── */}
        <main className="flex-1 overflow-auto min-w-0 pb-[60px] md:pb-0">
          {children}
        </main>

        {/* ── Mobile Bottom Navigation ── */}
        <MobileBottomNav navItems={navItems} location={location} />

        {/* ── Quick Capture FAB (mobile only) ── */}
        <QuickCaptureFAB deals={deals} />
      </div>
    </PipelineContext.Provider>
  );
}

// ── Reusable Pipeline toggle button — used in DealDetail header ──
export function PipelineToggleButton({ className = '' }: { className?: string }) {
  const { isCollapsed, toggle, hasPipeline } = usePipeline();
  const { t } = useLanguage();

  if (!hasPipeline) return null;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          onClick={toggle}
          className={`flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all ${className}`}
          aria-label={isCollapsed ? 'Show pipeline' : 'Hide pipeline'}
        >
          {isCollapsed
            ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            : <PanelLeftClose className="w-3.5 h-3.5 text-muted-foreground" />
          }
          <span className="text-muted-foreground">{isCollapsed ? t('pipeline.show') || 'Pipeline' : t('pipeline.hide') || 'Hide'}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="font-display text-xs">
        {isCollapsed ? t('pipeline.show') || 'Show pipeline sidebar' : t('pipeline.hide') || 'Hide pipeline sidebar'}
      </TooltipContent>
    </Tooltip>
  );
}

// ── Mobile Bottom Navigation ──────────────────────────────────────────────────
interface MobileBottomNavProps {
  navItems: { icon: React.ComponentType<{ className?: string }>; label: string; path: string }[];
  location: string;
}

function MobileBottomNav({ navItems, location }: MobileBottomNavProps) {
  const { t } = useLanguage();
  // Show 5 items on mobile: Dashboard, Deals, Ask, Stakeholders, Settings
  const mobileItems = [
    navItems.find(n => n.path === '/'),
    navItems.find(n => n.path === '/deals'),
    navItems.find(n => n.path === '/ask'),
    navItems.find(n => n.path === '/stakeholders'),
    { icon: Settings, label: t('nav.settings'), path: '/settings' },
  ].filter(Boolean) as typeof navItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border">
      <div className="flex items-center justify-around h-[60px] px-2">
        {mobileItems.map((item) => {
          const isActive = location === item.path || (item.path !== '/dashboard' && item.path !== '/' && location.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path}>
              <div className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? 'text-primary'
                  : 'text-sidebar-foreground/50'
              }`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ── Quick Capture FAB (mobile only) ──────────────────────────────────────────
interface Deal {
  id: number;
  name?: string | null;
  company?: string | null;
}

interface QuickCaptureFABProps {
  deals: Deal[];
}

function QuickCaptureFAB({ deals }: QuickCaptureFABProps) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'menu' | 'note' | 'photo' | 'voice'>('menu');
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [, navigate] = useLocation();

  const addMeetingMutation = trpc.meetings.create.useMutation();
  const transcribeAndCreateMutation = trpc.meetings.transcribeAndCreate.useMutation();
  const [transcribeStatus, setTranscribeStatus] = useState<'idle' | 'uploading' | 'transcribing' | 'done' | 'error'>('idle');
  const [transcribedText, setTranscribedText] = useState('');

  const reset = () => {
    setMode('menu');
    setSelectedDealId(null);
    setNoteText('');
    setPhotoCaption('');
    setPhotoFile(null);
    setIsRecording(false);
    setIsSubmitting(false);
    setTranscribeStatus('idle');
    setTranscribedText('');
    audioChunksRef.current = [];
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const handleSubmitNote = async () => {
    if (!selectedDealId || !noteText.trim()) return;
    setIsSubmitting(true);
    try {
      await addMeetingMutation.mutateAsync({
        dealId: selectedDealId,
        type: 'Note',
        summary: noteText.trim(),
        date: new Date(),
        keyParticipant: undefined,
        duration: 0,
      });
      close();
      navigate(`/deal/${selectedDealId}`);
    } catch {
      setIsSubmitting(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoFile(file);
  };

  const handleSubmitPhoto = async () => {
    if (!selectedDealId || !photoFile) return;
    setIsSubmitting(true);
    try {
      await addMeetingMutation.mutateAsync({
        dealId: selectedDealId,
        type: 'Screenshot',
        summary: photoCaption || `Screenshot: ${photoFile.name}`,
        date: new Date(),
        keyParticipant: undefined,
        duration: 0,
      });
      close();
      navigate(`/deal/${selectedDealId}`);
    } catch {
      setIsSubmitting(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start();
      setIsRecording(true);
    } catch {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSubmitVoice = async () => {
    if (!selectedDealId || audioChunksRef.current.length === 0) return;
    setIsSubmitting(true);
    setTranscribeStatus('uploading');
    try {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      // Convert blob to base64 for server upload
      const arrayBuffer = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = '';
      uint8.forEach(b => binary += String.fromCharCode(b));
      const audioBase64 = btoa(binary);

      setTranscribeStatus('transcribing');
      const result = await transcribeAndCreateMutation.mutateAsync({
        dealId: selectedDealId,
        audioBase64,
        mimeType: 'audio/webm',
      });
      setTranscribedText(result.transcriptText);
      setTranscribeStatus('done');
      // Brief pause so user can see the transcript
      await new Promise(r => setTimeout(r, 1500));
      close();
      navigate(`/deal/${selectedDealId}`);
    } catch {
      setTranscribeStatus('error');
      setIsSubmitting(false);
    }
  };

  const DealSelector = () => (
    <div className="mb-4">
      <label className="text-xs text-muted-foreground mb-1.5 block">{isZh ? '选择交易' : 'Select Deal'}</label>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {deals.map(d => (
          <button
            key={d.id}
            onClick={() => setSelectedDealId(d.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              selectedDealId === d.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 hover:bg-muted text-foreground'
            }`}
          >
            <div className="font-medium">{d.company}</div>
            {d.name && <div className="text-[11px] opacity-70 truncate">{d.name}</div>}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* FAB button — mobile only, above bottom nav */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-[72px] right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
        aria-label="Quick capture"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Bottom sheet */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-[60] bg-black/50"
              onClick={close}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-2xl shadow-2xl"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="px-5 pb-8 pt-2">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-semibold">
                    {mode === 'menu' ? (isZh ? '快速记录' : 'Quick Capture') :
                     mode === 'note' ? (isZh ? '文字笔记' : 'Text Note') :
                     mode === 'photo' ? (isZh ? '照片 / 截图' : 'Photo / Screenshot') :
                     (isZh ? '语音笔记' : 'Voice Note')}
                  </h3>
                  <button onClick={close} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mode: menu */}
                {mode === 'menu' && (
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setMode('note')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted active:scale-95 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <StickyNote className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-xs font-medium">{isZh ? '文字笔记' : 'Text Note'}</span>
                    </button>
                    <button
                      onClick={() => { setMode('photo'); fileInputRef.current?.click(); }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted active:scale-95 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-green-400" />
                      </div>
                      <span className="text-xs font-medium">{isZh ? '照片' : 'Photo'}</span>
                    </button>
                    <button
                      onClick={() => setMode('voice')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted active:scale-95 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Mic className="w-5 h-5 text-red-400" />
                      </div>
                      <span className="text-xs font-medium">{isZh ? '语音' : 'Voice'}</span>
                    </button>
                  </div>
                )}

                {/* Mode: note */}
                {mode === 'note' && (
                  <div>
                    <DealSelector />
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder={isZh ? '发生了什么？关键要点、异议、下一步...' : 'What happened? Key takeaways, objections, next steps...'}
                      className="w-full h-28 px-3 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                    <button
                      onClick={handleSubmitNote}
                      disabled={!selectedDealId || !noteText.trim() || isSubmitting}
                      className="mt-3 w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-all"
                    >
                      {isSubmitting ? (isZh ? '保存中...' : 'Saving...') : (isZh ? '保存笔记' : 'Save Note')}
                    </button>
                  </div>
                )}

                {/* Mode: photo */}
                {mode === 'photo' && (
                  <div>
                    <DealSelector />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                    {photoFile ? (
                      <div className="mb-3 p-3 rounded-xl bg-muted/50 border border-border/50 flex items-center gap-3">
                        <Camera className="w-5 h-5 text-green-400 shrink-0" />
                        <span className="text-sm text-foreground truncate">{photoFile.name}</span>
                        <button onClick={() => setPhotoFile(null)} className="ml-auto">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-20 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 text-muted-foreground mb-3"
                      >
                        <Upload className="w-5 h-5" />
                        <span className="text-xs">{isZh ? '点击选择照片' : 'Tap to select photo'}</span>
                      </button>
                    )}
                    <input
                      value={photoCaption}
                      onChange={e => setPhotoCaption(e.target.value)}
                      placeholder={isZh ? '说明（可选）' : 'Caption (optional)'}
                      className="w-full h-10 px-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary mb-3"
                    />
                    <button
                      onClick={handleSubmitPhoto}
                      disabled={!selectedDealId || !photoFile || isSubmitting}
                      className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-all"
                    >
                      {isSubmitting ? (isZh ? '保存中...' : 'Saving...') : (isZh ? '保存照片' : 'Save Photo')}
                    </button>
                  </div>
                )}

                {/* Mode: voice */}
                {mode === 'voice' && (
                  <div>
                    <DealSelector />
                    <div className="flex flex-col items-center gap-4 py-4">
                      {isRecording ? (
                        <>
                          <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center animate-pulse">
                            <Mic className="w-7 h-7 text-red-400" />
                          </div>
                          <p className="text-sm text-muted-foreground">{isZh ? '录音中... 点击停止' : 'Recording... tap to stop'}</p>
                          <button
                            onClick={stopRecording}
                            className="w-full h-11 rounded-xl bg-red-500 text-white text-sm font-medium active:scale-[0.98] transition-all"
                          >
                            {isZh ? '停止录音' : 'Stop Recording'}
                          </button>
                        </>
                      ) : audioChunksRef.current.length > 0 ? (
                        <>
                          {/* Transcription status */}
                          {transcribeStatus === 'uploading' && (
                            <>
                              <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500/50 flex items-center justify-center animate-pulse">
                                <Upload className="w-7 h-7 text-blue-400" />
                              </div>
                              <p className="text-sm text-muted-foreground">{isZh ? '上传音频中...' : 'Uploading audio...'}</p>
                            </>
                          )}
                          {transcribeStatus === 'transcribing' && (
                            <>
                              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center animate-pulse">
                                <Mic className="w-7 h-7 text-primary" />
                              </div>
                              <p className="text-sm text-muted-foreground">{isZh ? 'AI 转录中...' : 'Transcribing with AI...'}</p>
                            </>
                          )}
                          {transcribeStatus === 'done' && transcribedText && (
                            <>
                              <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                                <Check className="w-7 h-7 text-green-400" />
                              </div>
                              <div className="w-full bg-muted/40 rounded-lg p-3">
                                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-1">{isZh ? '转录内容' : 'Transcript'}</p>
                                <p className="text-xs text-foreground/80 leading-relaxed line-clamp-4">{transcribedText}</p>
                              </div>
                              <p className="text-xs text-green-400">{isZh ? '已保存！正在跳转...' : 'Saved! Redirecting to deal...'}</p>
                            </>
                          )}
                          {transcribeStatus === 'error' && (
                            <p className="text-sm text-red-400">{isZh ? '转录失败，请重试。' : 'Transcription failed. Please try again.'}</p>
                          )}
                          {transcribeStatus === 'idle' && (
                            <>
                              <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                                <Check className="w-7 h-7 text-green-400" />
                              </div>
                              <p className="text-sm text-muted-foreground">{isZh ? '录音已就绪' : 'Recording ready'}</p>
                            </>
                          )}
                          {transcribeStatus === 'idle' && (
                            <button
                              onClick={handleSubmitVoice}
                              disabled={!selectedDealId || isSubmitting}
                              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-all"
                            >
                              {isZh ? '转录并保存' : 'Transcribe & Save'}
                            </button>
                          )}
                          {transcribeStatus === 'idle' && (
                            <button onClick={() => { audioChunksRef.current = []; }} className="text-xs text-muted-foreground underline">
                              {isZh ? '重新录音' : 'Re-record'}
                            </button>
                          )}
                          {transcribeStatus === 'error' && (
                            <button
                              onClick={() => { setTranscribeStatus('idle'); setIsSubmitting(false); }}
                              className="w-full h-11 rounded-xl bg-muted text-foreground text-sm font-medium active:scale-[0.98] transition-all"
                            >
                              {isZh ? '重试' : 'Try Again'}
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <Mic className="w-7 h-7 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">{isZh ? '点击开始录音' : 'Tap to start recording'}</p>
                          <button
                            onClick={startRecording}
                            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-all"
                          >
                            {isZh ? '开始录音' : 'Start Recording'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
