import { useMemo } from "react";
import {
  Cog,
  Handshake,
  Rocket,
  Shield,
  DollarSign,
  Trophy,
  Check,
  Play,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DimensionData {
  id: number;
  dimensionKey: string;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  aiSummary?: string | null;
  notes?: string | null;
}

export interface ActionItem {
  id: number;
  text: string;
  status: string;
  dimensionKey?: string | null;
  priority?: string;
}

export interface DecisionMapProps {
  companyName: string;
  companyLogo?: string | null;
  dimensions: DimensionData[];
  actions: ActionItem[];
  selectedDimension?: string | null;
  onDimensionClick?: (dimensionKey: string) => void;
  className?: string;
}

// ─── Dimension Config (exported for use by ActionCenter etc.) ────────────────

export const DIMENSION_CONFIG: Record<
  string,
  { label: string; labelEn: string; icon: typeof Cog; color: string }
> = {
  tech_validation: { label: "技术验证", labelEn: "Tech Validation", icon: Cog, color: "#3B82F6" },
  commercial_breakthrough: { label: "商务突破", labelEn: "Commercial", icon: Handshake, color: "#10B981" },
  executive_engagement: { label: "高层推动", labelEn: "Executive", icon: Rocket, color: "#EF4444" },
  competitive_defense: { label: "竞对防御", labelEn: "Competitive", icon: Shield, color: "#8B5CF6" },
  budget_advancement: { label: "预算推进", labelEn: "Budget", icon: DollarSign, color: "#F59E0B" },
  case_support: { label: "案例支撑", labelEn: "Case Study", icon: Trophy, color: "#EC4899" },
};

export const DIMENSION_ORDER = [
  "tech_validation",
  "commercial_breakthrough",
  "executive_engagement",
  "competitive_defense",
  "budget_advancement",
  "case_support",
];

export const STATUS_CONFIG: Record<
  string,
  { label: string; labelEn: string; icon: typeof Check; color: string; bg: string }
> = {
  completed: { label: "已完成", labelEn: "Done", icon: Check, color: "#10B981", bg: "bg-emerald-500/10" },
  in_progress: { label: "进行中", labelEn: "Active", icon: Play, color: "#3B82F6", bg: "bg-blue-500/10" },
  not_started: { label: "待启动", labelEn: "Pending", icon: Clock, color: "#9CA3AF", bg: "bg-muted/50" },
  blocked: { label: "阻塞", labelEn: "Blocked", icon: AlertTriangle, color: "#EF4444", bg: "bg-red-500/10" },
};

// Keep for backward compat (used in DealDetail)
export const DIMENSION_POSITIONS: Record<string, number> = {
  tech_validation: 30,
  executive_engagement: 90,
  case_support: 150,
  budget_advancement: 210,
  competitive_defense: 270,
  commercial_breakthrough: 330,
};

// ─── Compact Vertical Decision Map ───────────────────────────────────────────

export function DecisionMap({
  dimensions,
  actions,
  selectedDimension,
  onDimensionClick,
  className,
}: DecisionMapProps) {
  const { language } = useLanguage();
  const isZh = language === "zh";

  const dimensionMap = useMemo(() => {
    const map: Record<string, DimensionData> = {};
    for (const d of dimensions) map[d.dimensionKey] = d;
    return map;
  }, [dimensions]);

  const actionCountByDim = useMemo(() => {
    const counts: Record<string, { total: number; done: number }> = {};
    for (const key of DIMENSION_ORDER) counts[key] = { total: 0, done: 0 };
    for (const a of actions) {
      const key = a.dimensionKey || "";
      if (counts[key]) {
        counts[key].total++;
        if (a.status === "done") counts[key].done++;
      }
    }
    return counts;
  }, [actions]);

  const totalDone = dimensions.filter((d) => d.status === "completed").length;
  const totalBlocked = dimensions.filter((d) => d.status === "blocked").length;

  return (
    <div className={cn("space-y-0.5", className)}>
      {/* Overall progress bar */}
      <div className="flex items-center gap-2 px-1 mb-1.5">
        <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden flex gap-px">
          {DIMENSION_ORDER.map((key) => {
            const dim = dimensionMap[key];
            const status = dim?.status || "not_started";
            const statusCfg = STATUS_CONFIG[status];
            return (
              <div
                key={key}
                className="h-full flex-1 first:rounded-l-full last:rounded-r-full transition-all"
                style={{
                  backgroundColor: statusCfg.color,
                  opacity: status === "not_started" ? 0.2 : 0.75,
                }}
              />
            );
          })}
        </div>
        <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
          {totalDone}/6
        </span>
      </div>

      {/* Dimension rows */}
      {DIMENSION_ORDER.map((key) => {
        const meta = DIMENSION_CONFIG[key];
        const dim = dimensionMap[key];
        const status = dim?.status || "not_started";
        const statusCfg = STATUS_CONFIG[status];
        const StatusIcon = statusCfg.icon;
        const DimIcon = meta.icon;
        const counts = actionCountByDim[key];
        const isSelected = selectedDimension === key;
        const progress = counts.total > 0 ? (counts.done / counts.total) * 100 : 0;

        return (
          <button
            key={key}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all",
              isSelected
                ? "bg-primary/8 ring-1 ring-primary/20"
                : "hover:bg-muted/40"
            )}
            onClick={() => onDimensionClick?.(key)}
          >
            {/* Dimension icon */}
            <div
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: meta.color + "18" }}
            >
              <DimIcon size={13} style={{ color: meta.color }} strokeWidth={2} />
            </div>

            {/* Label + mini progress */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-foreground truncate leading-tight">
                  {isZh ? meta.label : meta.labelEn}
                </span>
              </div>
              <div className="h-1 rounded-full bg-muted/30 mt-0.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(progress, counts.total > 0 ? 4 : 0)}%`,
                    backgroundColor: status === "blocked" ? "#EF4444" : meta.color,
                  }}
                />
              </div>
            </div>

            {/* Status + count */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <StatusIcon size={10} style={{ color: statusCfg.color }} />
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {counts.done}/{counts.total}
              </span>
            </div>
          </button>
        );
      })}

      {/* Blocked warning */}
      {totalBlocked > 0 && (
        <div className="flex items-center gap-1 px-2 pt-1">
          <AlertTriangle size={10} className="text-red-500 flex-shrink-0" />
          <span className="text-[10px] text-red-500 font-medium">
            {totalBlocked} {isZh ? "个维度阻塞" : "blocked"}
          </span>
        </div>
      )}
    </div>
  );
}

export default DecisionMap;
