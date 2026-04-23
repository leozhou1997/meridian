import { useMemo, useState } from "react";
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
  ListTodo,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DimensionInfo {
  id?: number;
  dimensionKey: string;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  aiSummary?: string | null;
  aiDigest?: string | null;
  [key: string]: any;
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

function computeStageProgress(status: string): number {
  switch (status) {
    case 'completed': return 100;
    case 'in_progress': return 50;
    case 'blocked': return 25;
    default: return 0;
  }
}

function computeActionStats(actions: ActionInfo[], dimensionKey: string) {
  const dimActions = actions.filter((a) => a.dimensionKey === dimensionKey);
  const total = dimActions.length;
  const done = dimActions.filter((a) => a.status === "done").length;
  return { total, done };
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

// ─── Detail Modal ───────────────────────────────────────────────────────────

function DetailModal({
  isOpen,
  onClose,
  label,
  aiSummary,
  textColor,
}: {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  aiSummary: string;
  textColor: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className={cn("text-sm font-bold", textColor)}>{label}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap prose prose-xs max-w-none">
            {aiSummary}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dimension Card ─────────────────────────────────────────────────────────

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
  stageProgress,
  actionStats,
  relatedStakeholders,
  aiSummary,
  aiDigest,
  isZh,
  onViewDetail,
  onJumpToTodo,
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
  stageProgress: number;
  actionStats: { total: number; done: number };
  relatedStakeholders: StakeholderInfo[];
  aiSummary?: string | null;
  aiDigest?: string | null;
  isZh: boolean;
  onViewDetail?: () => void;
  onJumpToTodo?: () => void;
  compact?: boolean;
}) {
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const StatusIcon = statusCfg.icon;
  const [showDetail, setShowDetail] = useState(false);

  // Display text: prefer aiDigest, fall back to first sentence of aiSummary
  const digestText = aiDigest || (aiSummary ? aiSummary.split(/[。.！!？?\n]/)[0] + (aiSummary.includes('。') ? '。' : '.') : null);

  return (
    <>
      <div
        className={cn(
          "w-full text-left rounded-lg border transition-all",
          bgLight,
          borderColor,
          compact ? "p-2.5" : "p-3.5"
        )}
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

        {/* Stage progress bar */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              {isZh ? "阶段进度" : "Stage"}
            </span>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {actionStats.total > 0 ? (
                <>{isZh ? `${actionStats.done}/${actionStats.total} 行动` : `${actionStats.done}/${actionStats.total} actions`}</>
              ) : null}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(stageProgress, status !== 'not_started' ? 3 : 0)}%`,
                backgroundColor: status === "blocked" ? "#EF4444" : color,
              }}
            />
          </div>
        </div>

        {/* AI Digest — condensed 1-2 sentence summary */}
        {digestText && !compact && (
          <p className="mt-2 text-[10px] text-muted-foreground/80 leading-relaxed line-clamp-2">
            {digestText}
          </p>
        )}

        {/* Related stakeholders */}
        {relatedStakeholders.length > 0 && !compact && (
          <div className="mt-1.5 flex items-center gap-1 flex-wrap">
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

        {/* Action buttons: View Detail + Jump to Todo */}
        {!compact && (aiSummary || actionStats.total > 0) && (
          <div className="mt-2.5 flex items-center gap-2">
            {aiSummary && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-black/5"
              >
                <Eye size={10} />
                {isZh ? "查看详情" : "Details"}
              </button>
            )}
            {actionStats.total > 0 && onJumpToTodo && (
              <button
                onClick={(e) => { e.stopPropagation(); onJumpToTodo(); }}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-black/5"
              >
                <ListTodo size={10} />
                {isZh ? "行动项" : "Actions"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <DetailModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        label={label}
        aiSummary={aiSummary || ""}
        textColor={textColor}
      />
    </>
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

  const riskSignals = useMemo(() => {
    const signals: string[] = [];
    for (const cp of CRITICAL_PATH) {
      const dim = dimMap[cp.key];
      if (!dim || dim.status === "not_started") {
        signals.push(isZh ? `${cp.label}尚未启动` : `${cp.labelEn} not started`);
      }
      if (dim?.status === "blocked") {
        signals.push(isZh ? `${cp.label}被阻塞` : `${cp.labelEn} is blocked`);
      }
    }
    const relDim = dimMap["relationship_penetration"];
    if (!relDim || relDim.status === "not_started") {
      signals.push(isZh ? "关系渗透尚未启动" : "No relationship progress");
    }
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
      {/* ── AI Generate button (health score is now in sticky header above) ── */}
      {onAiGenerate && (
        <div className="flex items-center justify-between px-1">
          <div />
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
        </div>
      )}

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
            const stageProgress = computeStageProgress(status);
            const actionStats = computeActionStats(actions, cp.key);
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
                  stageProgress={stageProgress}
                  actionStats={actionStats}
                  relatedStakeholders={related}
                  aiSummary={dim?.aiSummary}
                  aiDigest={dim?.aiDigest}
                  isZh={isZh}
                  onViewDetail={() => {}}
                  onJumpToTodo={() => onDimensionClick?.(cp.key)}
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
          const stageProgress = computeStageProgress(status);
          const actionStats = computeActionStats(actions, pt.key);
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
              stageProgress={stageProgress}
              actionStats={actionStats}
              relatedStakeholders={related}
              aiSummary={dim?.aiSummary}
              aiDigest={dim?.aiDigest}
              isZh={isZh}
              onViewDetail={() => {}}
              onJumpToTodo={() => onDimensionClick?.(pt.key)}
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
            const actionStats = computeActionStats(actions, sq.key);
            const related = getStakeholdersForDimension(needs, stakeholders, sq.key);
            const stageProgress = computeStageProgress(status);
            const isNA = status === "not_started" && actionStats.total === 0 && !dim?.aiSummary;

            const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
            const StatusIcon = statusCfg.icon;

            // Digest for side quests
            const digestText = dim?.aiDigest || (dim?.aiSummary ? dim.aiSummary.split(/[。.！!？?\n]/)[0] + (dim.aiSummary.includes('。') ? '。' : '.') : null);

            return (
              <SideQuestCard
                key={sq.key}
                sq={sq}
                dim={dim}
                status={status}
                stageProgress={stageProgress}
                actionStats={actionStats}
                related={related}
                isNA={isNA}
                digestText={digestText}
                isZh={isZh}
                onDimensionClick={onDimensionClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Side quest card as separate component to manage its own detail modal state
function SideQuestCard({
  sq,
  dim,
  status,
  stageProgress,
  actionStats,
  related,
  isNA,
  digestText,
  isZh,
  onDimensionClick,
}: {
  sq: typeof SIDE_QUESTS[0];
  dim: DimensionInfo | undefined;
  status: string;
  stageProgress: number;
  actionStats: { total: number; done: number };
  related: StakeholderInfo[];
  isNA: boolean;
  digestText: string | null;
  isZh: boolean;
  onDimensionClick?: (key: string) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const StatusIcon = statusCfg.icon;

  return (
    <>
      <div
        className={cn(
          "w-full text-left rounded-lg border transition-all p-2.5",
          isNA ? "bg-muted/20 border-border/30" : sq.bgLight,
          isNA ? "" : sq.borderColor,
          "hover:shadow-sm"
        )}
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
              <StatusIcon size={10} style={{ color: statusCfg.color }} />
              <span className="text-[10px] font-medium tabular-nums" style={{ color: sq.color }}>
                {actionStats.done}/{actionStats.total}
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
                  width: `${Math.max(stageProgress, status !== 'not_started' ? 3 : 0)}%`,
                  backgroundColor: status === "blocked" ? "#EF4444" : sq.color,
                }}
              />
            </div>
          </div>
        )}

        {/* AI Digest for side quests */}
        {digestText && !isNA && (
          <p className="mt-1.5 text-[10px] text-muted-foreground/80 leading-relaxed line-clamp-2">
            {digestText}
          </p>
        )}

        {/* Related stakeholders */}
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

        {/* Action buttons */}
        {!isNA && (dim?.aiSummary || actionStats.total > 0) && (
          <div className="mt-2 flex items-center gap-2">
            {dim?.aiSummary && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded-md hover:bg-black/5"
              >
                <Eye size={9} />
                {isZh ? "详情" : "Details"}
              </button>
            )}
            {actionStats.total > 0 && onDimensionClick && (
              <button
                onClick={(e) => { e.stopPropagation(); onDimensionClick(sq.key); }}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded-md hover:bg-black/5"
              >
                <ListTodo size={9} />
                {isZh ? "行动项" : "Actions"}
              </button>
            )}
          </div>
        )}
      </div>

      <DetailModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        label={isZh ? sq.label : sq.labelEn}
        aiSummary={dim?.aiSummary || ""}
        textColor={sq.textColor}
      />
    </>
  );
}

export default DealScorecard;
