import { useState, useMemo, useCallback } from "react";
import {
  Building2,
  Briefcase,
  Heart,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Loader2,
  Plus,
  Check,
  Circle,
  AlertTriangle,
  Play,
  Crown,
  Shield,
  Users,
  UserCheck,
  UserX,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { StakeholderAvatar } from "@/components/Avatars";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StakeholderNeed {
  id: number;
  stakeholderId: number;
  needType: "organizational" | "professional" | "personal";
  title: string;
  description?: string | null;
  status: "unmet" | "in_progress" | "satisfied" | "blocked";
  dimensionKey?: string | null;
  priority: "critical" | "important" | "nice_to_have";
  aiGenerated?: boolean;
  sortOrder?: number;
}

export interface StakeholderInfo {
  id: number;
  name: string;
  title?: string | null;
  role: string;
  sentiment: string;
  engagement?: string;
  avatar?: string | null;
}

export interface ActionItem {
  id: number;
  text: string;
  status: string;
  dimensionKey?: string | null;
  priority?: string;
  stakeholderId?: number | null;
  needId?: number | null;
}

interface BattleMapProps {
  stakeholders: StakeholderInfo[];
  needs: StakeholderNeed[];
  actions: ActionItem[];
  isGenerating?: boolean;
  onGenerate?: () => void;
  onNeedStatusChange?: (needId: number, newStatus: StakeholderNeed["status"]) => void;
  onActionToggle?: (actionId: number, newStatus: string) => void;
  onAddNeed?: (stakeholderId: number) => void;
  className?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const NEED_TYPE_CONFIG: Record<
  string,
  { label: string; labelEn: string; icon: typeof Building2; bg: string; border: string; text: string; dot: string }
> = {
  organizational: {
    label: "组织需求",
    labelEn: "Org Need",
    icon: Building2,
    bg: "bg-blue-500/8",
    border: "border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    dot: "#3B82F6",
  },
  professional: {
    label: "职业需求",
    labelEn: "Career Need",
    icon: Briefcase,
    bg: "bg-violet-500/8",
    border: "border-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
    dot: "#8B5CF6",
  },
  personal: {
    label: "个人需求",
    labelEn: "Personal",
    icon: Heart,
    bg: "bg-amber-500/8",
    border: "border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    dot: "#F59E0B",
  },
};

const NEED_STATUS_CONFIG: Record<
  string,
  { label: string; labelEn: string; color: string; icon: typeof Check }
> = {
  satisfied: { label: "已满足", labelEn: "Satisfied", color: "#10B981", icon: Check },
  in_progress: { label: "推进中", labelEn: "In Progress", color: "#3B82F6", icon: Play },
  unmet: { label: "未满足", labelEn: "Unmet", color: "#F59E0B", icon: Circle },
  blocked: { label: "受阻", labelEn: "Blocked", color: "#EF4444", icon: AlertTriangle },
};

const NEED_PRIORITY_CONFIG: Record<string, { label: string; labelEn: string; className: string }> = {
  critical: { label: "关键", labelEn: "Critical", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  important: { label: "重要", labelEn: "Important", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  nice_to_have: { label: "加分", labelEn: "Nice", className: "bg-slate-500/10 text-slate-500" },
};

const ROLE_SORT_ORDER: Record<string, number> = {
  "Decision Maker": 0,
  "Champion": 1,
  "Influencer": 2,
  "Evaluator": 3,
  "Blocker": 4,
  "User": 5,
  "Gatekeeper": 6,
};

const ROLE_ICON: Record<string, typeof Crown> = {
  "Decision Maker": Crown,
  "Champion": Shield,
  "Influencer": Users,
  "Evaluator": UserCheck,
  "Blocker": UserX,
  "User": User,
  "Gatekeeper": User,
};

const SENTIMENT_CONFIG: Record<string, { label: string; labelEn: string; color: string; bg: string }> = {
  Positive: { label: "支持", labelEn: "Positive", color: "#10B981", bg: "bg-emerald-500/10" },
  Neutral: { label: "中立", labelEn: "Neutral", color: "#F59E0B", bg: "bg-amber-500/10" },
  Negative: { label: "反对", labelEn: "Negative", color: "#EF4444", bg: "bg-red-500/10" },
  Unknown: { label: "未知", labelEn: "Unknown", color: "#6B7280", bg: "bg-slate-500/10" },
};

const DIMENSION_LABELS: Record<string, { zh: string; en: string }> = {
  tech_validation: { zh: "技术验证", en: "Tech" },
  commercial_breakthrough: { zh: "商务突破", en: "Commercial" },
  executive_engagement: { zh: "高层推动", en: "Executive" },
  competitive_defense: { zh: "竞对防御", en: "Competitive" },
  budget_advancement: { zh: "预算推进", en: "Budget" },
  case_support: { zh: "案例支撑", en: "Case Study" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function BattleMap({
  stakeholders,
  needs,
  actions,
  isGenerating,
  onGenerate,
  onNeedStatusChange,
  onActionToggle,
  onAddNeed,
  className,
}: BattleMapProps) {
  const { language } = useLanguage();
  const isZh = language === "zh";

  // Track expanded stakeholders
  const [expandedStakeholders, setExpandedStakeholders] = useState<Set<number>>(() => {
    // Default: expand all stakeholders
    return new Set(stakeholders.map((s) => s.id));
  });

  // Track expanded needs (to show linked actions)
  const [expandedNeeds, setExpandedNeeds] = useState<Set<number>>(new Set());

  // Sort stakeholders: by role tier (Decision Maker first), then by creation order (stable)
  const sortedStakeholders = useMemo(() => {
    return [...stakeholders].sort((a, b) => {
      const aOrder = ROLE_SORT_ORDER[a.role] ?? 99;
      const bOrder = ROLE_SORT_ORDER[b.role] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.id - b.id; // stable: earlier-added first
    });
  }, [stakeholders]);

  // Group needs by stakeholder
  const needsByStakeholder = useMemo(() => {
    const map: Record<number, StakeholderNeed[]> = {};
    for (const s of stakeholders) map[s.id] = [];
    for (const n of needs) {
      if (map[n.stakeholderId]) map[n.stakeholderId].push(n);
    }
    return map;
  }, [stakeholders, needs]);

  // Group actions by needId
  const actionsByNeed = useMemo(() => {
    const map: Record<number, ActionItem[]> = {};
    for (const a of actions) {
      if (a.needId) {
        if (!map[a.needId]) map[a.needId] = [];
        map[a.needId].push(a);
      }
    }
    return map;
  }, [actions]);

  // Actions by stakeholder (for those without needId)
  const actionsByStakeholder = useMemo(() => {
    const map: Record<number, ActionItem[]> = {};
    for (const a of actions) {
      if (a.stakeholderId && !a.needId) {
        if (!map[a.stakeholderId]) map[a.stakeholderId] = [];
        map[a.stakeholderId].push(a);
      }
    }
    return map;
  }, [actions]);

  const toggleStakeholder = useCallback((id: number) => {
    setExpandedStakeholders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleNeed = useCallback((id: number) => {
    setExpandedNeeds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Overall stats
  const totalNeeds = needs.length;
  const satisfiedNeeds = needs.filter((n) => n.status === "satisfied").length;
  const blockedNeeds = needs.filter((n) => n.status === "blocked").length;
  const criticalUnmet = needs.filter((n) => n.priority === "critical" && n.status === "unmet").length;

  // Per-stakeholder progress
  const getStakeholderProgress = (stakeholderId: number) => {
    const sNeeds = needsByStakeholder[stakeholderId] || [];
    const total = sNeeds.length;
    const satisfied = sNeeds.filter((n) => n.status === "satisfied").length;
    const blocked = sNeeds.filter((n) => n.status === "blocked").length;
    return { total, satisfied, blocked, pct: total > 0 ? Math.round((satisfied / total) * 100) : 0 };
  };

  const cycleNeedStatus = useCallback(
    (needId: number, currentStatus: string) => {
      if (!onNeedStatusChange) return;
      const cycle: Record<string, StakeholderNeed["status"]> = {
        unmet: "in_progress",
        in_progress: "satisfied",
        satisfied: "unmet",
        blocked: "in_progress",
      };
      onNeedStatusChange(needId, cycle[currentStatus] || "unmet");
    },
    [onNeedStatusChange]
  );

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex-shrink-0 pb-3 border-b border-border/50 mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">
            {isZh ? "战役态势" : "Battle Map"}
          </h3>
          <div className="flex items-center gap-2">
            {totalNeeds > 0 && (
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {criticalUnmet > 0 && (
                  <span className="text-red-500 font-medium">
                    {criticalUnmet} {isZh ? "关键未满足" : "critical unmet"}
                  </span>
                )}
                {blockedNeeds > 0 && (
                  <span className="text-amber-500">
                    {blockedNeeds} {isZh ? "受阻" : "blocked"}
                  </span>
                )}
                <span>
                  {satisfiedNeeds}/{totalNeeds} {isZh ? "已满足" : "satisfied"}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-[10px] gap-1"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={11} className="animate-spin" />
                  {isZh ? "分析中..." : "Analyzing..."}
                </>
              ) : (
                <>
                  <Sparkles size={11} />
                  {totalNeeds > 0
                    ? (isZh ? "重新分析" : "Re-analyze")
                    : (isZh ? "AI 分析需求" : "AI Analyze")}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Overall progress bar */}
        {totalNeeds > 0 && (
          <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-muted/50">
            {sortedStakeholders.map((s) => {
              const progress = getStakeholderProgress(s.id);
              if (progress.total === 0) return null;
              const sentimentCfg = SENTIMENT_CONFIG[s.sentiment] || SENTIMENT_CONFIG.Unknown;
              return (
                <div
                  key={s.id}
                  className="relative rounded-full overflow-hidden"
                  style={{
                    flex: progress.total,
                    backgroundColor: sentimentCfg.color + "15",
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${progress.pct}%`,
                      backgroundColor: sentimentCfg.color,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Need type legend */}
        {totalNeeds > 0 && (
          <div className="flex gap-3 mt-2">
            {(Object.entries(NEED_TYPE_CONFIG) as [string, typeof NEED_TYPE_CONFIG.organizational][]).map(
              ([key, cfg]) => {
                const count = needs.filter((n) => n.needType === key).length;
                if (count === 0) return null;
                return (
                  <div key={key} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <div
                      className="w-2 h-2 rounded-sm"
                      style={{ backgroundColor: cfg.dot }}
                    />
                    <span>{isZh ? cfg.label : cfg.labelEn}</span>
                    <span className="opacity-60">({count})</span>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {totalNeeds === 0 && !isGenerating && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <Users size={20} className="text-primary" />
          </div>
          <h4 className="text-sm font-semibold text-foreground mb-1">
            {isZh ? "战役态势图" : "Battle Map"}
          </h4>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-4">
            {isZh
              ? "分析每个关键人物的需求和攻略路径。点击「AI 分析需求」自动生成，或手动添加。"
              : "Analyze each stakeholder's needs and engagement path. Click 'AI Analyze' to auto-generate, or add manually."}
          </p>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            <Sparkles size={13} />
            {isZh ? "AI 分析需求" : "AI Analyze Needs"}
          </Button>
        </div>
      )}

      {/* Generating state */}
      {totalNeeds === 0 && isGenerating && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <Loader2 size={24} className="animate-spin text-primary mb-3" />
          <p className="text-xs text-muted-foreground">
            {isZh ? "正在分析关键人物需求..." : "Analyzing stakeholder needs..."}
          </p>
        </div>
      )}

      {/* Swimlanes */}
      {totalNeeds > 0 && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {sortedStakeholders.map((stakeholder) => {
            const sNeeds = needsByStakeholder[stakeholder.id] || [];
            const sActions = actionsByStakeholder[stakeholder.id] || [];
            const isExpanded = expandedStakeholders.has(stakeholder.id);
            const progress = getStakeholderProgress(stakeholder.id);
            const sentimentCfg = SENTIMENT_CONFIG[stakeholder.sentiment] || SENTIMENT_CONFIG.Unknown;
            const RoleIcon = ROLE_ICON[stakeholder.role] || User;

            // Group needs by type
            const needsByType = {
              organizational: sNeeds.filter((n) => n.needType === "organizational"),
              professional: sNeeds.filter((n) => n.needType === "professional"),
              personal: sNeeds.filter((n) => n.needType === "personal"),
            };

            if (sNeeds.length === 0 && sActions.length === 0) return null;

            return (
              <div
                key={stakeholder.id}
                className="rounded-lg border border-border/40 bg-card/50 overflow-hidden"
              >
                {/* Stakeholder header (swimlane label) */}
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
                  onClick={() => toggleStakeholder(stakeholder.id)}
                >
                  <StakeholderAvatar
                    name={stakeholder.name}
                    avatarUrl={stakeholder.avatar}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {stakeholder.name}
                      </span>
                      <RoleIcon size={11} className="text-muted-foreground flex-shrink-0" />
                      <span className="text-[9px] text-muted-foreground truncate">
                        {stakeholder.role}
                      </span>
                    </div>
                    {stakeholder.title && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {stakeholder.title}
                      </p>
                    )}
                  </div>

                  {/* Sentiment badge */}
                  <span
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      color: sentimentCfg.color,
                      backgroundColor: sentimentCfg.color + "15",
                    }}
                  >
                    {isZh ? sentimentCfg.label : sentimentCfg.labelEn}
                  </span>

                  {/* Progress indicator */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-12 h-1.5 rounded-full overflow-hidden bg-muted/50">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${progress.pct}%`,
                          backgroundColor: sentimentCfg.color,
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground w-8 text-right">
                      {progress.satisfied}/{progress.total}
                    </span>
                  </div>

                  {isExpanded ? (
                    <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight size={13} className="text-muted-foreground flex-shrink-0" />
                  )}
                </button>

                {/* Expanded: needs grouped by type */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2">
                    {(["organizational", "professional", "personal"] as const).map((needType) => {
                      const typeNeeds = needsByType[needType];
                      if (typeNeeds.length === 0) return null;
                      const typeCfg = NEED_TYPE_CONFIG[needType];
                      const TypeIcon = typeCfg.icon;

                      return (
                        <div key={needType}>
                          {/* Need type header */}
                          <div className="flex items-center gap-1.5 mb-1 pl-1">
                            <div
                              className="w-1.5 h-1.5 rounded-sm"
                              style={{ backgroundColor: typeCfg.dot }}
                            />
                            <span className={cn("text-[10px] font-medium", typeCfg.text)}>
                              {isZh ? typeCfg.label : typeCfg.labelEn}
                            </span>
                          </div>

                          {/* Need cards */}
                          <div className="space-y-1">
                            {typeNeeds.map((need) => {
                              const statusCfg = NEED_STATUS_CONFIG[need.status] || NEED_STATUS_CONFIG.unmet;
                              const StatusIcon = statusCfg.icon;
                              const priorityCfg = NEED_PRIORITY_CONFIG[need.priority] || NEED_PRIORITY_CONFIG.important;
                              const isNeedExpanded = expandedNeeds.has(need.id);
                              const linkedActions = actionsByNeed[need.id] || [];
                              const dimLabel = need.dimensionKey
                                ? DIMENSION_LABELS[need.dimensionKey]
                                : null;

                              return (
                                <div
                                  key={need.id}
                                  className={cn(
                                    "rounded-md border transition-colors",
                                    typeCfg.bg,
                                    typeCfg.border
                                  )}
                                >
                                  {/* Need row */}
                                  <div className="flex items-start gap-2 px-2.5 py-2">
                                    {/* Status icon — clickable to cycle */}
                                    <button
                                      className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cycleNeedStatus(need.id, need.status);
                                      }}
                                      title={isZh ? "点击切换状态" : "Click to cycle status"}
                                    >
                                      <StatusIcon
                                        size={13}
                                        style={{ color: statusCfg.color }}
                                      />
                                    </button>

                                    {/* Need content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span
                                          className={cn(
                                            "text-xs font-medium text-foreground",
                                            need.status === "satisfied" && "line-through opacity-60"
                                          )}
                                        >
                                          {need.title}
                                        </span>
                                        <span
                                          className={cn(
                                            "text-[8px] font-medium px-1 py-0.5 rounded",
                                            priorityCfg.className
                                          )}
                                        >
                                          {isZh ? priorityCfg.label : priorityCfg.labelEn}
                                        </span>
                                        {dimLabel && (
                                          <span className="text-[8px] text-muted-foreground bg-muted/50 px-1 py-0.5 rounded">
                                            {isZh ? dimLabel.zh : dimLabel.en}
                                          </span>
                                        )}
                                      </div>
                                      {need.description && (
                                        <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                                          {need.description}
                                        </p>
                                      )}
                                    </div>

                                    {/* Expand linked actions */}
                                    {linkedActions.length > 0 && (
                                      <button
                                        className="flex-shrink-0 text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                                        onClick={() => toggleNeed(need.id)}
                                      >
                                        <span>{linkedActions.length}</span>
                                        {isNeedExpanded ? (
                                          <ChevronDown size={10} />
                                        ) : (
                                          <ChevronRight size={10} />
                                        )}
                                      </button>
                                    )}
                                  </div>

                                  {/* Linked actions */}
                                  {isNeedExpanded && linkedActions.length > 0 && (
                                    <div className="px-2.5 pb-2 ml-5 space-y-0.5 border-t border-border/20 pt-1.5">
                                      {linkedActions.map((action) => {
                                        const isDone = action.status === "done";
                                        return (
                                          <div
                                            key={action.id}
                                            className={cn(
                                              "flex items-center gap-1.5 text-[10px] py-0.5 cursor-pointer hover:text-foreground transition-colors",
                                              isDone
                                                ? "text-muted-foreground line-through"
                                                : "text-foreground"
                                            )}
                                            onClick={() =>
                                              onActionToggle?.(
                                                action.id,
                                                isDone ? "pending" : "done"
                                              )
                                            }
                                          >
                                            {isDone ? (
                                              <Check size={9} className="text-emerald-500 flex-shrink-0" />
                                            ) : (
                                              <Circle size={9} className="text-muted-foreground flex-shrink-0" />
                                            )}
                                            <span className="truncate">{action.text}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Unlinked actions for this stakeholder */}
                    {sActions.length > 0 && (
                      <div className="pt-1 border-t border-border/20">
                        <span className="text-[9px] text-muted-foreground mb-1 block">
                          {isZh ? "其他行动" : "Other Actions"}
                        </span>
                        {sActions.map((action) => {
                          const isDone = action.status === "done";
                          return (
                            <div
                              key={action.id}
                              className={cn(
                                "flex items-center gap-1.5 text-[10px] py-0.5 cursor-pointer hover:text-foreground transition-colors",
                                isDone ? "text-muted-foreground line-through" : "text-foreground"
                              )}
                              onClick={() =>
                                onActionToggle?.(action.id, isDone ? "pending" : "done")
                              }
                            >
                              {isDone ? (
                                <Check size={9} className="text-emerald-500 flex-shrink-0" />
                              ) : (
                                <Circle size={9} className="text-muted-foreground flex-shrink-0" />
                              )}
                              <span className="truncate">{action.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add need button */}
                    <button
                      className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors py-0.5 pl-1"
                      onClick={() => onAddNeed?.(stakeholder.id)}
                    >
                      <Plus size={10} />
                      {isZh ? "添加需求" : "Add need"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BattleMap;
