import { useMemo } from "react";
import {
  Cog,
  Handshake,
  Shield,
  Check,
  Play,
  AlertTriangle,
  Clock,
  Search,
  TrendingUp,
  Users,
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
  { label: string; labelEn: string; icon: typeof Cog; color: string; nature: 'critical' | 'parallel' | 'side' }
> = {
  need_discovery: { label: "需求确认", labelEn: "Need Discovery", icon: Search, color: "#2563EB", nature: 'critical' },
  value_proposition: { label: "价值论证", labelEn: "Value Proposition", icon: TrendingUp, color: "#059669", nature: 'critical' },
  commercial_close: { label: "商务突破", labelEn: "Commercial Close", icon: Handshake, color: "#D97706", nature: 'critical' },
  relationship_penetration: { label: "关系渗透", labelEn: "Relationship", icon: Users, color: "#7C3AED", nature: 'parallel' },
  tech_validation: { label: "技术验证", labelEn: "Tech Validation", icon: Cog, color: "#0891B2", nature: 'side' },
  competitive_defense: { label: "竞争防御", labelEn: "Competitive", icon: Shield, color: "#DC2626", nature: 'side' },
};

export const DIMENSION_ORDER = [
  "need_discovery",
  "value_proposition",
  "commercial_close",
  "relationship_penetration",
  "tech_validation",
  "competitive_defense",
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
  need_discovery: 30,
  value_proposition: 90,
  commercial_close: 150,
  relationship_penetration: 210,
  tech_validation: 270,
  competitive_defense: 330,
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
