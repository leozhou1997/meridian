import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Shield,
  Target,
  Users,
  Zap,
  Crown,
  Eye,
  Ban,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StakeholderInfo {
  id: number;
  name: string;
  title?: string | null;
  role: string;
  sentiment: string;
  engagement: string;
  avatar?: string | null;
  keyInsights?: string | null;
  personalNotes?: string | null;
}

export interface StakeholderNeedInfo {
  id: number;
  stakeholderId: number;
  needType: "organizational" | "professional" | "personal";
  title: string;
  status: string;
  dimensionKey?: string | null;
  priority?: string;
}

export interface AIInsight {
  text: string;
  type?: "warning" | "opportunity" | "info";
}

export interface StakeholderSidebarProps {
  stakeholders: StakeholderInfo[];
  needs?: StakeholderNeedInfo[];
  aiInsights?: AIInsight[];
  onStakeholderClick?: (id: number) => void;
  isZh?: boolean;
  className?: string;
}

// ─── Role Config ────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<
  string,
  { label: string; labelZh: string; icon: typeof Crown; color: string; bg: string; tier: number }
> = {
  "Decision Maker": {
    label: "Decision Maker",
    labelZh: "决策者",
    icon: Crown,
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
    tier: 1,
  },
  Champion: {
    label: "Champion",
    labelZh: "支持者",
    icon: Shield,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    tier: 2,
  },
  Influencer: {
    label: "Influencer",
    labelZh: "影响者",
    icon: Zap,
    color: "text-cyan-600",
    bg: "bg-cyan-50 border-cyan-200",
    tier: 3,
  },
  Evaluator: {
    label: "Evaluator",
    labelZh: "评估者",
    icon: Eye,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    tier: 4,
  },
  User: {
    label: "User",
    labelZh: "终端用户",
    icon: UserCheck,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    tier: 5,
  },
  Blocker: {
    label: "Blocker",
    labelZh: "阻碍者",
    icon: Ban,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    tier: 6,
  },
};

// ─── Sentiment Config ───────────────────────────────────────────────────────

const SENTIMENT_CONFIG: Record<
  string,
  { label: string; labelZh: string; dot: string; textColor: string }
> = {
  Positive: { label: "Supportive", labelZh: "支持", dot: "bg-emerald-500", textColor: "text-emerald-600" },
  support: { label: "Supportive", labelZh: "支持", dot: "bg-emerald-500", textColor: "text-emerald-600" },
  Neutral: { label: "Neutral", labelZh: "中立", dot: "bg-gray-400", textColor: "text-gray-500" },
  neutral: { label: "Neutral", labelZh: "中立", dot: "bg-gray-400", textColor: "text-gray-500" },
  Negative: { label: "Resistant", labelZh: "阻碍", dot: "bg-red-500", textColor: "text-red-600" },
  blocker: { label: "Resistant", labelZh: "阻碍", dot: "bg-red-500", textColor: "text-red-600" },
  leaning: { label: "Leaning", labelZh: "倾向", dot: "bg-amber-500", textColor: "text-amber-600" },
  unknown: { label: "Unknown", labelZh: "未知", dot: "bg-slate-300", textColor: "text-slate-400" },
};

// ─── Engagement Config ──────────────────────────────────────────────────────

const ENGAGEMENT_LEVELS: Record<string, { label: string; labelZh: string; bars: number }> = {
  High: { label: "High", labelZh: "高", bars: 3 },
  high: { label: "High", labelZh: "高", bars: 3 },
  Medium: { label: "Medium", labelZh: "中", bars: 2 },
  medium: { label: "Medium", labelZh: "中", bars: 2 },
  Low: { label: "Low", labelZh: "低", bars: 1 },
  low: { label: "Low", labelZh: "低", bars: 1 },
  None: { label: "None", labelZh: "无", bars: 0 },
  none: { label: "None", labelZh: "无", bars: 0 },
};

// ─── Dimension Labels ───────────────────────────────────────────────────────

const DIM_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  need_discovery: { zh: "需求", en: "Need", color: "#2563EB" },
  value_proposition: { zh: "价值", en: "Value", color: "#059669" },
  commercial_close: { zh: "商务", en: "Comm", color: "#D97706" },
  relationship_penetration: { zh: "关系", en: "Rel", color: "#7C3AED" },
  tech_validation: { zh: "技术", en: "Tech", color: "#0891B2" },
  competitive_defense: { zh: "竞争", en: "Comp", color: "#DC2626" },
};

// ─── Engagement Bars ────────────────────────────────────────────────────────

function EngagementBars({ level }: { level: string }) {
  const cfg = ENGAGEMENT_LEVELS[level] || ENGAGEMENT_LEVELS.None;
  return (
    <div className="flex items-end gap-[2px] h-3">
      {[1, 2, 3].map((bar) => (
        <div
          key={bar}
          className={cn(
            "w-[3px] rounded-sm transition-colors",
            bar <= cfg.bars ? "bg-foreground/40" : "bg-foreground/10"
          )}
          style={{ height: `${bar * 4}px` }}
        />
      ))}
    </div>
  );
}

// ─── Need Type Config ───────────────────────────────────────────────────────

const NEED_TYPE_CONFIG: Record<string, { label: string; labelZh: string; color: string }> = {
  organizational: { label: "Org", labelZh: "组织", color: "text-blue-600" },
  professional: { label: "Prof", labelZh: "职业", color: "text-violet-600" },
  personal: { label: "Personal", labelZh: "个人", color: "text-amber-600" },
};

// ─── Stakeholder Card ───────────────────────────────────────────────────────

function StakeholderCard({
  stakeholder,
  needs,
  isZh,
  isExpanded,
  onToggle,
  onClick,
}: {
  stakeholder: StakeholderInfo;
  needs: StakeholderNeedInfo[];
  isZh: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
}) {
  const roleCfg = ROLE_CONFIG[stakeholder.role] || ROLE_CONFIG.User;
  const sentimentCfg = SENTIMENT_CONFIG[stakeholder.sentiment] || SENTIMENT_CONFIG.unknown;
  const RoleIcon = roleCfg.icon;

  // Group needs by dimension
  const needsByDim = useMemo(() => {
    const map: Record<string, StakeholderNeedInfo[]> = {};
    for (const n of needs) {
      const key = n.dimensionKey || "_none";
      if (!map[key]) map[key] = [];
      map[key].push(n);
    }
    return map;
  }, [needs]);

  // Unique dimensions this stakeholder is involved in
  const involvedDimensions = useMemo(() => {
    const dims = new Set<string>();
    for (const n of needs) {
      if (n.dimensionKey) dims.add(n.dimensionKey);
    }
    return Array.from(dims);
  }, [needs]);

  // Needs summary counts
  const needsSummary = useMemo(() => {
    const total = needs.length;
    const satisfied = needs.filter((n) => n.status === "satisfied").length;
    const blocked = needs.filter((n) => n.status === "blocked").length;
    const critical = needs.filter((n) => n.priority === "critical").length;
    return { total, satisfied, blocked, critical };
  }, [needs]);

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        "bg-card hover:bg-accent/30",
        isExpanded ? "border-border shadow-sm" : "border-transparent"
      )}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer"
        onClick={onClick}
      >
        {/* Avatar with sentiment indicator */}
        <div className="relative shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={stakeholder.avatar || undefined} alt={stakeholder.name} />
            <AvatarFallback className="text-[10px] font-medium bg-muted">
              {stakeholder.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card",
              sentimentCfg.dot
            )}
          />
        </div>

        {/* Name + title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground truncate">
              {stakeholder.name}
            </span>
            <EngagementBars level={stakeholder.engagement} />
          </div>
          <div className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
            {stakeholder.title || (isZh ? roleCfg.labelZh : roleCfg.label)}
          </div>
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-1 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-1.5 py-0 h-[18px] font-medium border gap-0.5",
              roleCfg.bg,
              roleCfg.color
            )}
          >
            <RoleIcon size={9} />
            {isZh ? roleCfg.labelZh : roleCfg.label}
          </Badge>
        </div>

        {/* Expand toggle */}
        {needs.length > 0 && (
          <button
            className="shrink-0 p-0.5 rounded hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* Dimension involvement chips (always visible if has needs) */}
      {involvedDimensions.length > 0 && !isExpanded && (
        <div className="flex items-center gap-1 px-2.5 pb-2 flex-wrap">
          {involvedDimensions.map((dimKey) => {
            const dimCfg = DIM_LABELS[dimKey];
            if (!dimCfg) return null;
            return (
              <span
                key={dimKey}
                className="text-[8px] font-medium px-1.5 py-[1px] rounded-full border"
                style={{
                  color: dimCfg.color,
                  borderColor: `${dimCfg.color}30`,
                  backgroundColor: `${dimCfg.color}08`,
                }}
              >
                {isZh ? dimCfg.zh : dimCfg.en}
              </span>
            );
          })}
          {needsSummary.total > 0 && (
            <span className="text-[8px] text-muted-foreground ml-auto">
              {needsSummary.satisfied}/{needsSummary.total}
              {isZh ? " 需求满足" : " needs met"}
            </span>
          )}
        </div>
      )}

      {/* Expanded: needs detail */}
      {isExpanded && needs.length > 0 && (
        <div className="px-2.5 pb-2.5 space-y-1.5 border-t border-border/30 pt-2">
          {/* Needs summary bar */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              {isZh ? "需求" : "Needs"}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden flex">
              {needsSummary.satisfied > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${(needsSummary.satisfied / needsSummary.total) * 100}%` }}
                />
              )}
              {needsSummary.blocked > 0 && (
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${(needsSummary.blocked / needsSummary.total) * 100}%` }}
                />
              )}
            </div>
            <span className="text-[9px] text-muted-foreground tabular-nums">
              {needsSummary.satisfied}/{needsSummary.total}
            </span>
          </div>

          {/* Individual needs */}
          {Object.entries(needsByDim).map(([dimKey, dimNeeds]) => {
            const dimCfg = DIM_LABELS[dimKey] || DIM_LABELS._none;
            return (
              <div key={dimKey}>
                {dimKey !== "_none" && dimCfg && (
                  <div className="flex items-center gap-1 mb-0.5">
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: dimCfg?.color || "#9CA3AF" }}
                    />
                    <span
                      className="text-[8px] font-semibold uppercase tracking-wider"
                      style={{ color: dimCfg?.color || "#9CA3AF" }}
                    >
                      {isZh ? dimCfg?.zh : dimCfg?.en}
                    </span>
                  </div>
                )}
                {dimNeeds.map((need) => {
                  const typeCfg = NEED_TYPE_CONFIG[need.needType] || NEED_TYPE_CONFIG.organizational;
                  const statusDot =
                    need.status === "satisfied"
                      ? "bg-emerald-500"
                      : need.status === "blocked"
                        ? "bg-red-500"
                        : need.status === "in_progress"
                          ? "bg-blue-500"
                          : "bg-gray-300";
                  return (
                    <div
                      key={need.id}
                      className="flex items-start gap-1.5 pl-2"
                    >
                      <div className={cn("w-1.5 h-1.5 rounded-full mt-[5px] shrink-0", statusDot)} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-foreground/80 leading-tight line-clamp-1">
                          {need.title}
                        </span>
                      </div>
                      <span className={cn("text-[8px] shrink-0", typeCfg.color)}>
                        {isZh ? typeCfg.labelZh : typeCfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function StakeholderSidebar({
  stakeholders,
  needs = [],
  aiInsights = [],
  onStakeholderClick,
  isZh = true,
  className,
}: StakeholderSidebarProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Sort stakeholders by role tier (Decision Maker first, Blocker last)
  const sortedStakeholders = useMemo(() => {
    return [...stakeholders].sort((a, b) => {
      const tierA = ROLE_CONFIG[a.role]?.tier ?? 99;
      const tierB = ROLE_CONFIG[b.role]?.tier ?? 99;
      return tierA - tierB;
    });
  }, [stakeholders]);

  // Group needs by stakeholder
  const needsByStakeholder = useMemo(() => {
    const map: Record<number, StakeholderNeedInfo[]> = {};
    for (const n of needs) {
      if (!map[n.stakeholderId]) map[n.stakeholderId] = [];
      map[n.stakeholderId].push(n);
    }
    return map;
  }, [needs]);

  // Quick stats
  const stats = useMemo(() => {
    const supporters = stakeholders.filter(
      (s) => s.sentiment === "Positive" || s.sentiment === "support"
    ).length;
    const blockers = stakeholders.filter(
      (s) => s.sentiment === "Negative" || s.sentiment === "blocker"
    ).length;
    return { total: stakeholders.length, supporters, blockers };
  }, [stakeholders]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with stats */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-muted-foreground" />
            <h3 className="text-xs font-semibold text-foreground">
              {isZh ? "决策人" : "Decision Makers"}
            </h3>
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {stats.total}{isZh ? "人" : ""}
          </span>
        </div>

        {/* Quick sentiment summary */}
        <div className="flex items-center gap-3 mt-1.5">
          {stats.supporters > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">
                {stats.supporters} {isZh ? "支持" : "support"}
              </span>
            </div>
          )}
          {stats.blockers > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[10px] text-red-600 font-medium">
                {stats.blockers} {isZh ? "阻碍" : "resist"}
              </span>
            </div>
          )}
          {stats.total - stats.supporters - stats.blockers > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              <span className="text-[10px] text-muted-foreground font-medium">
                {stats.total - stats.supporters - stats.blockers} {isZh ? "中立" : "neutral"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stakeholder list */}
      <ScrollArea className="flex-1 min-h-0 px-1.5">
        <div className="space-y-0.5 pb-2">
          {sortedStakeholders.map((s) => (
            <StakeholderCard
              key={s.id}
              stakeholder={s}
              needs={needsByStakeholder[s.id] || []}
              isZh={isZh}
              isExpanded={expandedId === s.id}
              onToggle={() => setExpandedId((prev) => (prev === s.id ? null : s.id))}
              onClick={() => onStakeholderClick?.(s.id)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* AI Quick Insights */}
      {aiInsights.length > 0 && (
        <div className="border-t border-border/30 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={11} className="text-amber-500" />
            <span className="text-[10px] font-semibold text-foreground">
              {isZh ? "AI 洞察" : "AI Insights"}
            </span>
          </div>
          <div className="space-y-1.5">
            {aiInsights.map((insight, idx) => {
              const dotClass =
                insight.type === "warning"
                  ? "bg-red-500"
                  : insight.type === "opportunity"
                    ? "bg-emerald-500"
                    : "bg-blue-500";
              return (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", dotClass)} />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {insight.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default StakeholderSidebar;
