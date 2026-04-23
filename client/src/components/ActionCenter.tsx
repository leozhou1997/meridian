import { useState, useMemo, useCallback } from "react";
import {
  Cog,
  Handshake,
  Rocket,
  Shield,
  DollarSign,
  Trophy,
  Check,
  Circle,
  AlertTriangle,
  Play,
  ChevronDown,
  ChevronRight,
  Plus,
  Sparkles,
  Loader2,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Streamdown } from "streamdown";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActionItem {
  id: number;
  text: string;
  status: string;
  dimensionKey?: string | null;
  priority?: string;
}

interface DimensionData {
  id: number;
  dimensionKey: string;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  aiSummary?: string | null;
}

interface ActionCenterProps {
  dimensions: DimensionData[];
  actions: ActionItem[];
  selectedDimension?: string | null;
  onDimensionSelect?: (key: string | null) => void;
  onActionToggle?: (actionId: number, newStatus: string) => void;
  onAddAction?: (dimensionKey: string) => void;
  onAiDeepDive?: (dimensionKey: string) => Promise<void>;
  className?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const DIMENSION_META: Record<
  string,
  { label: string; labelEn: string; icon: typeof Cog; color: string }
> = {
  need_discovery: { label: "需求确认", labelEn: "Need Discovery", icon: Target, color: "#2563EB" },
  value_proposition: { label: "价值论证", labelEn: "Value Proposition", icon: Trophy, color: "#059669" },
  commercial_close: { label: "商务突破", labelEn: "Commercial Close", icon: Handshake, color: "#D97706" },
  relationship_penetration: { label: "关系渗透", labelEn: "Relationships", icon: Users, color: "#7C3AED" },
  tech_validation: { label: "技术验证", labelEn: "Tech Validation", icon: Cog, color: "#3B82F6" },
  competitive_defense: { label: "竞争防御", labelEn: "Competitive", icon: Shield, color: "#8B5CF6" },
};

const STATUS_META: Record<string, { label: string; labelEn: string; color: string }> = {
  completed: { label: "已完成", labelEn: "Done", color: "#10B981" },
  in_progress: { label: "进行中", labelEn: "Active", color: "#3B82F6" },
  not_started: { label: "待启动", labelEn: "Pending", color: "#F59E0B" },
  blocked: { label: "阻塞", labelEn: "Blocked", color: "#EF4444" },
};

// ─── Penetration Phases ─────────────────────────────────────────────────────

interface Phase {
  key: string;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  dimensions: string[];
  color: string;
}

const PENETRATION_PHASES: Phase[] = [
  {
    key: "discover",
    label: "探索需求",
    labelEn: "Discover Needs",
    description: "采集客户痛点，建立关系网络",
    descriptionEn: "Uncover pain points, build relationships",
    dimensions: ["need_discovery", "relationship_penetration"],
    color: "#2563EB",
  },
  {
    key: "prove",
    label: "论证价值",
    labelEn: "Prove Value",
    description: "验证方案可行性，论证业务价值",
    descriptionEn: "Validate solution, prove business value",
    dimensions: ["value_proposition", "tech_validation"],
    color: "#059669",
  },
  {
    key: "close",
    label: "推进成交",
    labelEn: "Drive to Close",
    description: "推动商务谈判，应对竞争压力",
    descriptionEn: "Drive commercial negotiation, handle competition",
    dimensions: ["commercial_close", "competitive_defense"],
    color: "#D97706",
  },
];

const ACTION_STATUS_ICON: Record<string, { icon: typeof Check; className: string }> = {
  done: { icon: Check, className: "text-emerald-500" },
  in_progress: { icon: Play, className: "text-blue-500" },
  accepted: { icon: Play, className: "text-blue-500" },
  blocked: { icon: AlertTriangle, className: "text-red-500" },
  pending: { icon: Circle, className: "text-muted-foreground" },
};

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  high: { label: "高", className: "bg-red-500/10 text-red-600" },
  medium: { label: "中", className: "bg-amber-500/10 text-amber-600" },
  low: { label: "低", className: "bg-slate-500/10 text-slate-500" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ActionCenter({
  dimensions,
  actions,
  selectedDimension,
  onDimensionSelect,
  onActionToggle,
  onAddAction,
  onAiDeepDive,
  className,
}: ActionCenterProps) {
  const { language } = useLanguage();
  const isZh = language === "zh";

  // Track which dimensions are expanded
  const initialExpanded = useMemo(() => {
    const set = new Set<string>();
    for (const d of dimensions) {
      if (d.status !== "completed") set.add(d.dimensionKey);
    }
    return set;
  }, []);
  const [expandedDims, setExpandedDims] = useState<Set<string>>(initialExpanded);

  // Track which dimensions are loading AI deep-dive
  const [loadingDeepDive, setLoadingDeepDive] = useState<Set<string>>(new Set());

  // Track which dimensions have expanded AI summary
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());

  const dimensionMap = useMemo(() => {
    const map: Record<string, DimensionData> = {};
    for (const d of dimensions) map[d.dimensionKey] = d;
    return map;
  }, [dimensions]);

  const actionsByDimension = useMemo(() => {
    const map: Record<string, ActionItem[]> = {};
    for (const phase of PENETRATION_PHASES) {
      for (const key of phase.dimensions) map[key] = [];
    }
    for (const a of actions) {
      const key = a.dimensionKey || "unassigned";
      if (map[key]) map[key].push(a);
    }
    return map;
  }, [actions]);

  const toggleExpand = useCallback((key: string) => {
    setExpandedDims((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleSummary = useCallback((key: string) => {
    setExpandedSummaries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleDeepDive = useCallback(async (dimKey: string) => {
    if (!onAiDeepDive) return;
    setLoadingDeepDive((prev) => new Set(prev).add(dimKey));
    try {
      await onAiDeepDive(dimKey);
      // Auto-expand the summary after generation
      setExpandedSummaries((prev) => new Set(prev).add(dimKey));
    } finally {
      setLoadingDeepDive((prev) => {
        const next = new Set(prev);
        next.delete(dimKey);
        return next;
      });
    }
  }, [onAiDeepDive]);

  // Overall progress
  const totalActions = actions.length;
  const doneActions = actions.filter((a) => a.status === "done").length;

  // Phase progress
  const getPhaseProgress = (phase: Phase) => {
    let total = 0;
    let done = 0;
    for (const dimKey of phase.dimensions) {
      const dimActions = actionsByDimension[dimKey] || [];
      total += dimActions.length;
      done += dimActions.filter((a) => a.status === "done").length;
    }
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  // Current phase (first phase with incomplete work)
  const currentPhaseIdx = PENETRATION_PHASES.findIndex((phase) => {
    const progress = getPhaseProgress(phase);
    return progress.pct < 100;
  });

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex-shrink-0 pb-3 border-b border-border/50 mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">
            {isZh ? "渗透路径" : "Penetration Path"}
          </h3>
          <span className="text-[10px] text-muted-foreground">
            {doneActions}/{totalActions} {isZh ? "行动已完成" : "actions done"}
          </span>
        </div>
        {/* Phase progress bar */}
        <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-muted/50">
          {PENETRATION_PHASES.map((phase, idx) => {
            const progress = getPhaseProgress(phase);
            const isCurrent = idx === currentPhaseIdx;
            return (
              <div
                key={phase.key}
                className="relative flex-1 rounded-full overflow-hidden"
                style={{ backgroundColor: phase.color + "20" }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{
                    width: `${progress.pct}%`,
                    backgroundColor: phase.color,
                    opacity: isCurrent ? 1 : 0.6,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5">
          {PENETRATION_PHASES.map((phase, idx) => {
            const isCurrent = idx === currentPhaseIdx;
            const progress = getPhaseProgress(phase);
            return (
              <span
                key={phase.key}
                className={cn(
                  "text-[9px]",
                  isCurrent ? "text-foreground font-semibold" : "text-muted-foreground"
                )}
              >
                {isZh ? phase.label : phase.labelEn}
                {" "}
                <span className="opacity-60">{progress.pct}%</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Phase groups */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {PENETRATION_PHASES.map((phase, phaseIdx) => {
          const isCurrent = phaseIdx === currentPhaseIdx;
          const isPast = phaseIdx < currentPhaseIdx;
          const isFuture = phaseIdx > currentPhaseIdx;
          const progress = getPhaseProgress(phase);

          return (
            <div key={phase.key} className="space-y-1.5">
              {/* Phase header */}
              <div className="flex items-center gap-2 px-1">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0",
                    isPast && "opacity-60"
                  )}
                  style={{ backgroundColor: phase.color }}
                >
                  {isPast ? "✓" : phaseIdx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isCurrent ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {isZh ? phase.label : phase.labelEn}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {isZh ? "当前阶段" : "Current"}
                      </span>
                    )}
                    {isFuture && (
                      <span className="text-[9px] text-muted-foreground/60">
                        {isZh ? "下一步" : "Next"}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {isZh ? phase.description : phase.descriptionEn}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {progress.done}/{progress.total}
                </span>
              </div>

              {/* Dimensions in this phase */}
              <div className={cn("space-y-1 pl-3", isFuture && "opacity-60")}>
                {phase.dimensions.map((dimKey) => {
                  const meta = DIMENSION_META[dimKey];
                  const dim = dimensionMap[dimKey];
                  const dimActions = actionsByDimension[dimKey] || [];
                  const isExpanded = expandedDims.has(dimKey);
                  const statusMeta = dim ? STATUS_META[dim.status] : STATUS_META.not_started;
                  const Icon = meta.icon;
                  const doneCount = dimActions.filter((a) => a.status === "done").length;
                  const isSelected = selectedDimension === dimKey;
                  const isDeepDiveLoading = loadingDeepDive.has(dimKey);
                  const isSummaryExpanded = expandedSummaries.has(dimKey);

                  return (
                    <div
                      key={dimKey}
                      id={`dim-${dimKey}`}
                      className={cn(
                        "rounded-lg border transition-colors",
                        isSelected
                          ? "border-primary/30 bg-primary/5"
                          : "border-border/40 bg-card/50 hover:border-border/60"
                      )}
                    >
                      {/* Dimension header */}
                      <div className="flex items-center gap-2 px-3 py-2">
                        <button
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                          onClick={() => toggleExpand(dimKey)}
                        >
                          <div
                            className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center"
                            style={{ backgroundColor: meta.color + "18" }}
                          >
                            <Icon size={12} style={{ color: meta.color }} />
                          </div>
                          <span className="text-xs font-semibold text-foreground truncate">
                            {isZh ? meta.label : meta.labelEn}
                          </span>
                          <span
                            className="text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              color: statusMeta.color,
                              backgroundColor: statusMeta.color + "15",
                            }}
                          >
                            {isZh ? statusMeta.label : statusMeta.labelEn}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-auto mr-1">
                            {doneCount}/{dimActions.length}
                          </span>
                          {isExpanded ? (
                            <ChevronDown size={12} className="text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />
                          )}
                        </button>
                        {/* AI Deep Dive button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] gap-1 flex-shrink-0 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeepDive(dimKey);
                          }}
                          disabled={isDeepDiveLoading}
                        >
                          {isDeepDiveLoading ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <Sparkles size={10} />
                          )}
                          {isZh ? "AI 深入" : "AI Dive"}
                        </Button>
                      </div>

                      {/* AI Summary (expandable) */}
                      {dim?.aiSummary && (
                        <div className="px-3 pb-1">
                          <button
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            onClick={() => toggleSummary(dimKey)}
                          >
                            <Sparkles size={9} className="text-primary/60" />
                            {isSummaryExpanded
                              ? (isZh ? "收起 AI 分析" : "Collapse AI analysis")
                              : (isZh ? "查看 AI 分析" : "View AI analysis")}
                          </button>
                          {isSummaryExpanded && (
                            <div className="mt-1.5 mb-1 p-2.5 rounded-md bg-primary/5 border border-primary/10 prose prose-sm prose-invert max-w-none [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-[11px] [&_h3]:font-semibold [&_h3]:mt-1.5 [&_h3]:mb-0.5 [&_p]:text-[11px] [&_p]:leading-relaxed [&_p]:my-0.5 [&_ul]:text-[11px] [&_ul]:my-0.5 [&_ul]:pl-4 [&_li]:my-0 [&_strong]:text-foreground [&_ol]:text-[11px] [&_ol]:my-0.5 [&_ol]:pl-4">
                              <Streamdown>{dim.aiSummary}</Streamdown>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action items */}
                      {isExpanded && (
                        <div className="px-3 pb-2.5 space-y-1">
                          {dimActions.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground italic py-1 pl-8">
                              {isZh ? "暂无行动项" : "No action items"}
                            </p>
                          ) : (
                            dimActions.map((action) => {
                              const statusIcon =
                                ACTION_STATUS_ICON[action.status] || ACTION_STATUS_ICON.pending;
                              const StatusIcon = statusIcon.icon;
                              const priorityBadge = action.priority
                                ? PRIORITY_BADGE[action.priority]
                                : null;
                              const isDone = action.status === "done";

                              return (
                                <div
                                  key={action.id}
                                  className={cn(
                                    "flex items-start gap-2 py-1.5 px-2 rounded-md group cursor-pointer hover:bg-muted/50 transition-colors",
                                    isDone && "opacity-60"
                                  )}
                                  onClick={() =>
                                    onActionToggle?.(action.id, isDone ? "pending" : "done")
                                  }
                                >
                                  <StatusIcon
                                    size={13}
                                    className={cn("flex-shrink-0 mt-0.5", statusIcon.className)}
                                  />
                                  <span
                                    className={cn(
                                      "text-xs text-foreground leading-snug flex-1",
                                      isDone && "line-through"
                                    )}
                                  >
                                    {action.text}
                                  </span>
                                  {priorityBadge && !isDone && (
                                    <span
                                      className={cn(
                                        "text-[9px] font-medium px-1.5 py-0.5 rounded flex-shrink-0",
                                        priorityBadge.className
                                      )}
                                    >
                                      {isZh ? priorityBadge.label : action.priority}
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          )}
                          {/* Add action button */}
                          <button
                            className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors py-1 pl-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddAction?.(dimKey);
                            }}
                          >
                            <Plus size={10} />
                            {isZh ? "添加行动" : "Add action"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ActionCenter;
