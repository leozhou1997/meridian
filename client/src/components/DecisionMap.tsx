import { useMemo, useState } from "react";
import {
  Cog,
  Handshake,
  Rocket,
  Shield,
  DollarSign,
  Trophy,
  Check,
  Play,
  X,
  Circle,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
  onDimensionClick?: (dimensionKey: string) => void;
  onActionClick?: (actionId: number) => void;
  className?: string;
}

// ─── Dimension Config ────────────────────────────────────────────────────────

const DIMENSION_CONFIG: Record<
  string,
  {
    label: string;
    labelEn: string;
    icon: typeof Cog;
    color: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
  }
> = {
  tech_validation: {
    label: "技术验证",
    labelEn: "Tech Validation",
    icon: Cog,
    color: "#3B82F6",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
  },
  commercial_breakthrough: {
    label: "商务突破",
    labelEn: "Commercial",
    icon: Handshake,
    color: "#10B981",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
  },
  executive_engagement: {
    label: "高层推动",
    labelEn: "Executive",
    icon: Rocket,
    color: "#EF4444",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
  },
  competitive_defense: {
    label: "竞对防御",
    labelEn: "Competitive",
    icon: Shield,
    color: "#8B5CF6",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    textColor: "text-violet-700",
  },
  budget_advancement: {
    label: "预算推进",
    labelEn: "Budget",
    icon: DollarSign,
    color: "#F59E0B",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
  },
  case_support: {
    label: "案例支撑",
    labelEn: "Case Study",
    icon: Trophy,
    color: "#EC4899",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    textColor: "text-pink-700",
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dotClass: string }
> = {
  completed: { label: "已完成", color: "#10B981", dotClass: "bg-emerald-500" },
  in_progress: { label: "进行中", color: "#3B82F6", dotClass: "bg-blue-500" },
  not_started: { label: "待启动", color: "#F59E0B", dotClass: "bg-amber-500" },
  blocked: { label: "阻塞", color: "#EF4444", dotClass: "bg-red-500" },
};

const ACTION_STATUS_ICON: Record<string, { icon: typeof Check; className: string }> = {
  done: { icon: Check, className: "text-emerald-600" },
  in_progress: { icon: Play, className: "text-blue-600" },
  blocked: { icon: X, className: "text-red-600" },
  accepted: { icon: Play, className: "text-blue-600" },
};

// ─── Dimension positions (angle in degrees, 0 = top, clockwise) ─────────────

const DIMENSION_POSITIONS: Record<string, number> = {
  tech_validation: 30,
  executive_engagement: 90,
  case_support: 150,
  budget_advancement: 210,
  competitive_defense: 270,
  commercial_breakthrough: 330,
};

// ─── Helper: polar to cartesian ──────────────────────────────────────────────

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

// ─── Action Card Positions (offset from dimension node) ──────────────────────

function getActionCardOffset(
  angleDeg: number,
  index: number
): { x: number; y: number } {
  // Position action cards outward from the dimension node
  const outwardAngle = ((angleDeg - 90) * Math.PI) / 180;
  const baseOffset = 95;
  const stackOffset = index * 28;
  return {
    x: Math.cos(outwardAngle) * baseOffset,
    y: Math.sin(outwardAngle) * baseOffset + stackOffset,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DecisionMap({
  companyName,
  companyLogo,
  dimensions,
  actions,
  onDimensionClick,
  onActionClick,
  className,
}: DecisionMapProps) {
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null);

  // Map dimensions by key for quick lookup
  const dimensionMap = useMemo(() => {
    const map: Record<string, DimensionData> = {};
    for (const d of dimensions) {
      map[d.dimensionKey] = d;
    }
    return map;
  }, [dimensions]);

  // Group actions by dimension
  const actionsByDimension = useMemo(() => {
    const map: Record<string, ActionItem[]> = {};
    for (const a of actions) {
      const key = a.dimensionKey || "unassigned";
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [actions]);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 650;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;
  const orbitRadius = 200;
  const centerRadius = 42;
  const dimNodeRadius = 32;

  const dimensionKeys = Object.keys(DIMENSION_POSITIONS);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("relative w-full", className)}>
        {/* Status Legend */}
        <div className="flex items-center gap-4 mb-4 justify-end text-xs text-muted-foreground">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", cfg.dotClass)} />
              <span>{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* SVG Canvas */}
        <div className="relative w-full overflow-visible" style={{ paddingBottom: `${(svgHeight / svgWidth) * 100}%` }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="absolute inset-0 w-full h-full"
            style={{ overflow: "visible" }}
          >
            {/* Connection lines from center to dimensions */}
            {dimensionKeys.map((key) => {
              const angle = DIMENSION_POSITIONS[key];
              const pos = polarToCartesian(cx, cy, orbitRadius, angle);
              const isHovered = hoveredDimension === key;
              const dim = dimensionMap[key];
              const statusColor = dim ? STATUS_CONFIG[dim.status]?.color || "#D1D5DB" : "#D1D5DB";

              return (
                <line
                  key={`line-${key}`}
                  x1={cx}
                  y1={cy}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={isHovered ? statusColor : "#E5E7EB"}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  strokeDasharray={isHovered ? "none" : "6 4"}
                  style={{ transition: "all 0.3s ease" }}
                />
              );
            })}

            {/* Center node */}
            <g>
              <circle
                cx={cx}
                cy={cy}
                r={centerRadius}
                fill="url(#centerGradient)"
                style={{ filter: "drop-shadow(0 4px 12px rgba(99, 102, 241, 0.25))" }}
              />
              {companyLogo ? (
                <image
                  href={companyLogo}
                  x={cx - 20}
                  y={cy - 20}
                  width={40}
                  height={40}
                  clipPath="circle(20px)"
                />
              ) : (
                <text
                  x={cx}
                  y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={18}
                  fontWeight={700}
                >
                  {companyName.charAt(0)}
                </text>
              )}
              <text
                x={cx}
                y={cy + centerRadius + 18}
                textAnchor="middle"
                fill="#374151"
                fontSize={13}
                fontWeight={600}
              >
                {companyName}
              </text>
            </g>

            {/* Gradient definitions */}
            <defs>
              <linearGradient id="centerGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#4F46E5" />
              </linearGradient>
            </defs>

            {/* Dimension nodes */}
            {dimensionKeys.map((key) => {
              const config = DIMENSION_CONFIG[key];
              const angle = DIMENSION_POSITIONS[key];
              const pos = polarToCartesian(cx, cy, orbitRadius, angle);
              const dim = dimensionMap[key];
              const status = dim?.status || "not_started";
              const statusCfg = STATUS_CONFIG[status];
              const isHovered = hoveredDimension === key;
              const Icon = config.icon;
              const dimActions = actionsByDimension[key] || [];

              return (
                <g key={key}>
                  {/* Dimension circle */}
                  <g
                    style={{ cursor: "pointer", transition: "transform 0.2s ease" }}
                    onMouseEnter={() => setHoveredDimension(key)}
                    onMouseLeave={() => setHoveredDimension(null)}
                    onClick={() => onDimensionClick?.(key)}
                  >
                    {/* Outer glow on hover */}
                    {isHovered && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={dimNodeRadius + 6}
                        fill="none"
                        stroke={config.color}
                        strokeWidth={2}
                        opacity={0.3}
                      />
                    )}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={dimNodeRadius}
                      fill={config.color}
                      opacity={isHovered ? 1 : 0.9}
                      style={{
                        filter: isHovered
                          ? `drop-shadow(0 4px 12px ${config.color}40)`
                          : "drop-shadow(0 2px 6px rgba(0,0,0,0.12))",
                        transition: "all 0.2s ease",
                      }}
                    />
                    {/* Icon */}
                    <foreignObject
                      x={pos.x - 12}
                      y={pos.y - 12}
                      width={24}
                      height={24}
                    >
                      <Icon size={24} color="white" strokeWidth={2} />
                    </foreignObject>
                  </g>

                  {/* Label + status below node */}
                  <text
                    x={pos.x}
                    y={pos.y + dimNodeRadius + 16}
                    textAnchor="middle"
                    fill="#374151"
                    fontSize={12}
                    fontWeight={600}
                  >
                    {config.label}
                  </text>
                  <g>
                    <rect
                      x={pos.x - 22}
                      y={pos.y + dimNodeRadius + 22}
                      width={44}
                      height={18}
                      rx={9}
                      fill={statusCfg.color}
                      opacity={0.12}
                    />
                    <text
                      x={pos.x}
                      y={pos.y + dimNodeRadius + 34}
                      textAnchor="middle"
                      fill={statusCfg.color}
                      fontSize={10}
                      fontWeight={500}
                    >
                      {statusCfg.label}
                    </text>
                  </g>

                  {/* Action items floating near the dimension */}
                  {dimActions.slice(0, 3).map((action, idx) => {
                    const offset = getActionCardOffset(angle, idx);
                    const cardX = pos.x + offset.x;
                    const cardY = pos.y + offset.y - 14;
                    const actionStatus = ACTION_STATUS_ICON[action.status];
                    const statusPrefix =
                      action.status === "done"
                        ? "✓"
                        : action.status === "in_progress" || action.status === "accepted"
                        ? "▶"
                        : action.status === "blocked"
                        ? "✗"
                        : "";
                    const statusColor =
                      action.status === "done"
                        ? "#10B981"
                        : action.status === "in_progress" || action.status === "accepted"
                        ? "#3B82F6"
                        : action.status === "blocked"
                        ? "#EF4444"
                        : "#6B7280";

                    const truncatedText =
                      action.text.length > 12
                        ? action.text.slice(0, 12) + "…"
                        : action.text;

                    return (
                      <g
                        key={action.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => onActionClick?.(action.id)}
                      >
                        <rect
                          x={cardX - 60}
                          y={cardY - 10}
                          width={120}
                          height={22}
                          rx={6}
                          fill="white"
                          stroke={isHovered ? config.color + "40" : "#E5E7EB"}
                          strokeWidth={1}
                          style={{
                            filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.06))",
                          }}
                        />
                        <text
                          x={cardX - 48}
                          y={cardY + 4}
                          fill={statusColor}
                          fontSize={10}
                          fontWeight={600}
                        >
                          {statusPrefix}
                        </text>
                        <text
                          x={cardX - 38}
                          y={cardY + 4}
                          fill="#374151"
                          fontSize={10}
                          fontWeight={400}
                        >
                          {truncatedText}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </TooltipProvider>
  );
}

export { DIMENSION_CONFIG, STATUS_CONFIG, DIMENSION_POSITIONS };
export default DecisionMap;
