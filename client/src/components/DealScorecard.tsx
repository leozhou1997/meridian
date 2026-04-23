import { useMemo } from "react";
import {
  Search,
  TrendingUp,
  Handshake,
  Users,
  Cog,
  Shield,
  ArrowRight,
  Check,
  Play,
  AlertTriangle,
  Clock,
  ChevronRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DimensionInfo {
  id?: number;
  dimensionKey: string;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  aiSummary?: string | null;
  [key: string]: any; // Allow extra DB fields
}

interface ActionInfo {
  id: number;
  text: string;
  status: string;
  dimensionKey?: string | null;
}

interface StakeholderInfo {
  id: number;
  name: string;
  title?: string | null;
  role: string;
  sentiment: string;
}

interface NeedInfo {
  id: number;
  stakeholderId: number;
  dimensionKey?: string | null;
  status: string;
}

export interface DealScorecardProps {
  dimensions: DimensionInfo[];
  actions: ActionInfo[];
  stakeholders: StakeholderInfo[];
  needs: NeedInfo[];
  isZh: boolean;
  onDimensionClick?: (key: string) => void;
  onAiGenerate?: () => void;
  isGenerating?: boolean;
}

// ─── Dimension Metadata ──────────────────────────────────────────────────────

const CRITICAL_PATH = [
  {
    key: "need_discovery",
    label: "需求确认",
    labelEn: "Need Discovery",
    icon: Search,
    color: "#2563EB",
    bgLight: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    accentBg: "bg-blue-100",
    description: "客户痛点与需求采集",
    descriptionEn: "Pain points & needs",
  },
  {
    key: "value_proposition",
    label: "价值论证",
    labelEn: "Value Proposition",
    icon: TrendingUp,
    color: "#059669",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
    accentBg: "bg-emerald-100",
    description: "ROI 与业务价值论证",
    descriptionEn: "ROI & business value",
  },
  {
    key: "commercial_close",
    label: "商务突破",
    labelEn: "Commercial Close",
    icon: Handshake,
    color: "#D97706",
    bgLight: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    accentBg: "bg-amber-100",
    description: "合同谈判与商务推进",
    descriptionEn: "Contract & negotiation",
  },
];

const PARALLEL_TRACK = {
  key: "relationship_penetration",
  label: "关系渗透",
  labelEn: "Relationships",
  icon: Users,
  color: "#7C3AED",
  bgLight: "bg-violet-50",
  borderColor: "border-violet-200",
  textColor: "text-violet-700",
  accentBg: "bg-violet-100",
  description: "贯穿全程 · 决策人关系网络",
  descriptionEn: "Ongoing · decision-maker network",
};

const SIDE_QUESTS = [
  {
    key: "tech_validation",
    label: "技术验证",
    labelEn: "Tech Validation",
    icon: Cog,
    color: "#0891B2",
    bgLight: "bg-cyan-50",
    borderColor: "border-cyan-200",
    textColor: "text-cyan-700",
    accentBg: "bg-cyan-100",
  },
  {
    key: "competitive_defense",
    label: "竞争防御",
    labelEn: "Competitive",
    icon: Shield,
    color: "#DC2626",
    bgLight: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    accentBg: "bg-red-100",
  },
];

// ─── Status Helpers ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; labelEn: string; icon: typeof Check; color: string }> = {
  completed: { label: "已完成", labelEn: "Done", icon: Check, color: "#10B981" },
  in_progress: { label: "进行中", labelEn: "Active", icon: Play, color: "#3B82F6" },
  not_started: { label: "未启动", labelEn: "Not Started", icon: Clock, color: "#9CA3AF" },
  blocked: { label: "阻塞", labelEn: "Blocked", icon: AlertTriangle, color: "#EF4444" },
};

function computeProgress(actions: ActionInfo[], dimensionKey: string) {
  const dimActions = actions.filter((a) => a.dimensionKey === dimensionKey);
  const total = dimActions.length;
  const done = dimActions.filter((a) => a.status === "done").length;
  return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

function getStakeholdersForDimension(
  needs: NeedInfo[],
  stakeholders: StakeholderInfo[],
  dimensionKey: string
): StakeholderInfo[] {
  const stakeholderIds = new Set(
    needs.filter((n) => n.dimensionKey === dimensionKey).map((n) => n.stakeholderId)
  );
  return stakeholders.filter((s) => stakeholderIds.has(s.id));
}

// ─── Health Score ────────────────────────────────────────────────────────────

function computeHealthScore(dimensions: DimensionInfo[], actions: ActionInfo[]): number {
  // Weighted: critical path 60% (20% each), parallel 25%, side quests 15% (7.5% each)
  const weights: Record<string, number> = {
    need_discovery: 0.20,
    value_proposition: 0.20,
    commercial_close: 0.20,
    relationship_penetration: 0.25,
    tech_validation: 0.075,
    competitive_defense: 0.075,
  };

  let score = 0;
  for (const dim of dimensions) {
    const w = weights[dim.dimensionKey] || 0;
    const prog = computeProgress(actions, dim.dimensionKey);
    // Status contributes 40%, action progress contributes 60%
    const statusScore =
      dim.status === "completed" ? 100 :
      dim.status === "in_progress" ? 50 :
      dim.status === "blocked" ? 10 : 0;
    const dimScore = statusScore * 0.4 + prog.pct * 0.6;
    score += dimScore * w;
  }
  return Math.round(score);
}

function healthColor(score: number): string {
  if (score >= 70) return "#10B981"; // green
  if (score >= 40) return "#F59E0B"; // amber
  return "#EF4444"; // red
}

function healthLabel(score: number, isZh: boolean): string {
  if (score >= 70) return isZh ? "进展良好" : "On Track";
  if (score >= 40) return isZh ? "需要关注" : "Needs Attention";
  return isZh ? "风险较高" : "At Risk";
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function DimensionCard({
  dimKey,
  label,
  description,
  Icon,
  color,
  bgLight,
  borderColor,
  textColor,
  accentBg,
  status,
  progress,
  relatedStakeholders,
  aiSummary,
  isZh,
  onClick,
  compact = false,
}: {
  dimKey: string;
  label: string;
  description?: string;
  Icon: typeof Search;
  color: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
  accentBg: string;
  status: string;
  progress: { total: number; done: number; pct: number };
  relatedStakeholders: StakeholderInfo[];
  aiSummary?: string | null;
  isZh: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const StatusIcon = statusCfg.icon;

  return (
    <button
      className={cn(
        "w-full text-left rounded-lg border transition-all group",
        bgLight,
        borderColor,
        "hover:shadow-sm hover:border-opacity-80",
        compact ? "p-2.5" : "p-3.5"
      )}
      onClick={onClick}
    >
      {/* Header: icon + label + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn("rounded-md flex items-center justify-center flex-shrink-0", accentBg,
              compact ? "w-7 h-7" : "w-8 h-8"
            )}
          >
            <Icon size={compact ? 14 : 16} style={{ color }} strokeWidth={2} />
          </div>
          <div>
            <h4 className={cn("font-semibold leading-tight", textColor, compact ? "text-xs" : "text-sm")}>
              {label}
            </h4>
            {description && !compact && (
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <StatusIcon size={12} style={{ color: statusCfg.color }} />
          <span className="text-[10px] font-medium" style={{ color: statusCfg.color }}>
            {isZh ? statusCfg.label : statusCfg.labelEn}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">
            {isZh ? "行动进度" : "Actions"}
          </span>
          <span className="text-[10px] font-medium tabular-nums" style={{ color }}>
            {progress.done}/{progress.total}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(progress.pct, progress.total > 0 ? 3 : 0)}%`,
              backgroundColor: status === "blocked" ? "#EF4444" : color,
            }}
          />
        </div>
      </div>

      {/* Related stakeholders */}
      {relatedStakeholders.length > 0 && !compact && (
        <div className="mt-2 flex items-center gap-1 flex-wrap">
          {relatedStakeholders.slice(0, 4).map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-white/60 rounded px-1.5 py-0.5"
            >
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                s.sentiment === "Positive" || s.sentiment === "support" ? "bg-emerald-400" :
                s.sentiment === "Negative" || s.sentiment === "blocker" ? "bg-red-400" :
                "bg-gray-300"
              )} />
              {s.name}
            </span>
          ))}
          {relatedStakeholders.length > 4 && (
            <span className="text-[10px] text-muted-foreground">
              +{relatedStakeholders.length - 4}
            </span>
          )}
        </div>
      )}

      {/* AI Summary snippet */}
      {aiSummary && !compact && (
        <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed line-clamp-2 italic">
          {aiSummary}
        </p>
      )}

      {/* Click hint */}
      <div className="mt-2 flex items-center gap-0.5 text-[10px] text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
        <ChevronRight size={10} />
        <span>{isZh ? "查看详情" : "View details"}</span>
      </div>
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DealScorecard({
  dimensions,
  actions,
  stakeholders,
  needs,
  isZh,
  onDimensionClick,
  onAiGenerate,
  isGenerating,
}: DealScorecardProps) {
  const dimMap = useMemo(() => {
    const m: Record<string, DimensionInfo> = {};
    for (const d of dimensions) m[d.dimensionKey] = d;
    return m;
  }, [dimensions]);

  const healthScore = useMemo(
    () => computeHealthScore(dimensions, actions),
    [dimensions, actions]
  );

  const riskSignals = useMemo(() => {
    const signals: string[] = [];
    // Check critical path gaps
    for (const cp of CRITICAL_PATH) {
      const dim = dimMap[cp.key];
      if (!dim || dim.status === "not_started") {
        signals.push(
          isZh
            ? `${cp.label}尚未启动`
            : `${cp.labelEn} not started`
        );
      }
      if (dim?.status === "blocked") {
        signals.push(
          isZh
            ? `${cp.label}被阻塞`
            : `${cp.labelEn} is blocked`
        );
      }
    }
    // Check relationship coverage
    const relDim = dimMap["relationship_penetration"];
    if (!relDim || relDim.status === "not_started") {
      signals.push(isZh ? "关系渗透尚未启动" : "No relationship progress");
    }
    // Check if any decision maker is negative
    const negDM = stakeholders.find(
      (s) => s.role === "Decision Maker" && (s.sentiment === "Negative" || s.sentiment === "blocker")
    );
    if (negDM) {
      signals.push(isZh ? `决策者 ${negDM.name} 态度消极` : `Decision Maker ${negDM.name} is negative`);
    }
    return signals.slice(0, 3);
  }, [dimMap, stakeholders, isZh]);

  return (
    <div className="h-full flex flex-col gap-4 overflow-auto">
      {/* ── Top: Health Score Bar ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          {/* Score circle */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="24" cy="24" r="20"
                fill="none"
                stroke={healthColor(healthScore)}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(healthScore / 100) * 125.6} 125.6`}
              />
            </svg>
            <span className="absolute text-sm font-bold tabular-nums" style={{ color: healthColor(healthScore) }}>
              {healthScore}
            </span>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              {isZh ? "项目健康度" : "Deal Health"}
            </div>
            <div className="text-xs font-medium" style={{ color: healthColor(healthScore) }}>
              {healthLabel(healthScore, isZh)}
            </div>
          </div>
        </div>

        {/* AI Generate button */}
        {onAiGenerate && (
          <Button
            size="sm"
            variant="outline"
            disabled={isGenerating}
            onClick={onAiGenerate}
            className="h-7 gap-1.5 text-xs"
          >
            {isGenerating ? (
              <><Loader2 size={12} className="animate-spin" />{isZh ? "分析中..." : "Analyzing..."}</>
            ) : (
              <><Sparkles size={12} />{isZh ? "AI 分析" : "AI Analysis"}</>
            )}
          </Button>
        )}
      </div>

      {/* ── Risk Signals ── */}
      {riskSignals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {riskSignals.map((signal, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"
            >
              <AlertTriangle size={10} />
              {signal}
            </span>
          ))}
        </div>
      )}

      {/* ── Critical Path: Need Discovery → Value Proposition → Commercial Close ── */}
      <div className="px-1">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {isZh ? "关键路径" : "CRITICAL PATH"}
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="grid grid-cols-3 gap-2 items-stretch">
          {CRITICAL_PATH.map((cp, idx) => {
            const dim = dimMap[cp.key];
            const status = dim?.status || "not_started";
            const progress = computeProgress(actions, cp.key);
            const related = getStakeholdersForDimension(needs, stakeholders, cp.key);

            return (
              <div key={cp.key} className="flex items-stretch gap-1">
                <DimensionCard
                  dimKey={cp.key}
                  label={isZh ? cp.label : cp.labelEn}
                  description={isZh ? cp.description : cp.descriptionEn}
                  Icon={cp.icon}
                  color={cp.color}
                  bgLight={cp.bgLight}
                  borderColor={cp.borderColor}
                  textColor={cp.textColor}
                  accentBg={cp.accentBg}
                  status={status}
                  progress={progress}
                  relatedStakeholders={related}
                  aiSummary={dim?.aiSummary}
                  isZh={isZh}
                  onClick={() => onDimensionClick?.(cp.key)}
                />
                {idx < CRITICAL_PATH.length - 1 && (
                  <div className="flex items-center flex-shrink-0 px-0.5">
                    <ArrowRight size={14} className="text-muted-foreground/30" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Parallel Track: Relationship Penetration ── */}
      <div className="px-1">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {isZh ? "平行线 · 贯穿全程" : "PARALLEL TRACK"}
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        {(() => {
          const pt = PARALLEL_TRACK;
          const dim = dimMap[pt.key];
          const status = dim?.status || "not_started";
          const progress = computeProgress(actions, pt.key);
          const related = getStakeholdersForDimension(needs, stakeholders, pt.key);

          return (
            <DimensionCard
              dimKey={pt.key}
              label={isZh ? pt.label : pt.labelEn}
              description={isZh ? pt.description : pt.descriptionEn}
              Icon={pt.icon}
              color={pt.color}
              bgLight={pt.bgLight}
              borderColor={pt.borderColor}
              textColor={pt.textColor}
              accentBg={pt.accentBg}
              status={status}
              progress={progress}
              relatedStakeholders={related}
              aiSummary={dim?.aiSummary}
              isZh={isZh}
              onClick={() => onDimensionClick?.(pt.key)}
            />
          );
        })()}
      </div>

      {/* ── Side Quests: Tech Validation + Competitive Defense ── */}
      <div className="px-1">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {isZh ? "辅助线 · 按需启用" : "SIDE TRACKS"}
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SIDE_QUESTS.map((sq) => {
            const dim = dimMap[sq.key];
            const status = dim?.status || "not_started";
            const progress = computeProgress(actions, sq.key);
            const related = getStakeholdersForDimension(needs, stakeholders, sq.key);

            // If no actions and not started, show as N/A
            const isNA = status === "not_started" && progress.total === 0;

            return (
              <button
                key={sq.key}
                className={cn(
                  "w-full text-left rounded-lg border transition-all p-2.5 group",
                  isNA ? "bg-muted/20 border-border/30" : sq.bgLight,
                  isNA ? "" : sq.borderColor,
                  "hover:shadow-sm"
                )}
                onClick={() => onDimensionClick?.(sq.key)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded flex items-center justify-center",
                      isNA ? "bg-muted/40" : sq.accentBg
                    )}>
                      <sq.icon size={13} style={{ color: isNA ? "#9CA3AF" : sq.color }} strokeWidth={2} />
                    </div>
                    <span className={cn(
                      "text-xs font-semibold",
                      isNA ? "text-muted-foreground" : sq.textColor
                    )}>
                      {isZh ? sq.label : sq.labelEn}
                    </span>
                  </div>
                  {isNA ? (
                    <span className="text-[10px] text-muted-foreground/50 font-medium">N/A</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      {(() => {
                        const sc = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
                        const SI = sc.icon;
                        return <SI size={10} style={{ color: sc.color }} />;
                      })()}
                      <span className="text-[10px] font-medium tabular-nums" style={{ color: sq.color }}>
                        {progress.done}/{progress.total}
                      </span>
                    </div>
                  )}
                </div>

                {!isNA && (
                  <div className="mt-2">
                    <div className="h-1 rounded-full bg-black/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(progress.pct, progress.total > 0 ? 3 : 0)}%`,
                          backgroundColor: status === "blocked" ? "#EF4444" : sq.color,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Related stakeholders for side quests */}
                {related.length > 0 && !isNA && (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    {related.slice(0, 3).map((s) => (
                      <span
                        key={s.id}
                        className="text-[9px] text-muted-foreground bg-white/60 rounded px-1 py-0.5"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DealScorecard;
