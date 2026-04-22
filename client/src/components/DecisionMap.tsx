import { useState, useMemo } from "react";
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
  Sparkles,
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
  }
> = {
  tech_validation: {
    label: "技术验证",
    labelEn: "Tech Validation",
    icon: Cog,
    color: "#3B82F6",
  },
  commercial_breakthrough: {
    label: "商务突破",
    labelEn: "Commercial",
    icon: Handshake,
    color: "#10B981",
  },
  executive_engagement: {
    label: "高层推动",
    labelEn: "Executive",
    icon: Rocket,
    color: "#EF4444",
  },
  competitive_defense: {
    label: "竞对防御",
    labelEn: "Competitive",
    icon: Shield,
    color: "#8B5CF6",
  },
  budget_advancement: {
    label: "预算推进",
    labelEn: "Budget",
    icon: DollarSign,
    color: "#F59E0B",
  },
  case_support: {
    label: "案例支撑",
    labelEn: "Case Study",
    icon: Trophy,
    color: "#EC4899",
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; labelEn: string; color: string; dotClass: string }
> = {
  completed: { label: "已完成", labelEn: "Done", color: "#10B981", dotClass: "bg-emerald-500" },
  in_progress: { label: "进行中", labelEn: "Active", color: "#3B82F6", dotClass: "bg-blue-500" },
  not_started: { label: "待启动", labelEn: "Pending", color: "#F59E0B", dotClass: "bg-amber-500" },
  blocked: { label: "阻塞", labelEn: "Blocked", color: "#EF4444", dotClass: "bg-red-500" },
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
  const outwardAngle = ((angleDeg - 90) * Math.PI) / 180;
  const baseOffset = 75;
  const stackOffset = index * 24;
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
  const { language } = useLanguage();
  const isZh = language === 'zh';

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

  // SVG dimensions — more compact
  const svgWidth = 680;
  const svgHeight = 560;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;
  const orbitRadius = 165;
  const centerRadius = 36;
  const dimNodeRadius = 28;

  const dimensionKeys = Object.keys(DIMENSION_POSITIONS);

  return (
    <div className={cn("relative w-full", className)}>
      {/* Status Legend */}
      <div className="flex items-center gap-4 mb-3 justify-end text-xs text-muted-foreground">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", cfg.dotClass)} />
            <span>{isZh ? cfg.label : cfg.labelEn}</span>
          </div>
        ))}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-visible">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full"
          style={{ overflow: "visible", aspectRatio: `${svgWidth} / ${svgHeight}` }}
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="centerGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
          </defs>

          {/* Connection lines from center to dimensions */}
          {dimensionKeys.map((key) => {
            const angle = DIMENSION_POSITIONS[key];
            const pos = polarToCartesian(cx, cy, orbitRadius, angle);
            const isHovered = hoveredDimension === key;
            const dim = dimensionMap[key];
            const statusColor = dim ? STATUS_CONFIG[dim.status]?.color || "#6B7280" : "#6B7280";

            return (
              <line
                key={`line-${key}`}
                x1={cx}
                y1={cy}
                x2={pos.x}
                y2={pos.y}
                stroke={isHovered ? statusColor : "currentColor"}
                strokeOpacity={isHovered ? 0.6 : 0.15}
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
                x={cx - 16}
                y={cy - 16}
                width={32}
                height={32}
                clipPath="circle(16px)"
              />
            ) : (
              <text
                x={cx}
                y={cy + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={16}
                fontWeight={700}
              >
                {companyName.charAt(0)}
              </text>
            )}
            <text
              x={cx}
              y={cy + centerRadius + 16}
              textAnchor="middle"
              fill="currentColor"
              className="fill-foreground"
              fontSize={12}
              fontWeight={600}
            >
              {companyName}
            </text>
          </g>

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
                      r={dimNodeRadius + 5}
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
                    x={pos.x - 10}
                    y={pos.y - 10}
                    width={20}
                    height={20}
                    style={{ pointerEvents: "none" }}
                  >
                    <div style={{ pointerEvents: "none" }}>
                      <Icon size={20} color="white" strokeWidth={2} />
                    </div>
                  </foreignObject>
                </g>

                {/* Label + status below node */}
                <text
                  x={pos.x}
                  y={pos.y + dimNodeRadius + 14}
                  textAnchor="middle"
                  fill="currentColor"
                  className="fill-foreground"
                  fontSize={11}
                  fontWeight={600}
                >
                  {isZh ? config.label : config.labelEn}
                </text>
                <g>
                  <rect
                    x={pos.x - 20}
                    y={pos.y + dimNodeRadius + 19}
                    width={40}
                    height={16}
                    rx={8}
                    fill={statusCfg.color}
                    opacity={0.12}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + dimNodeRadius + 30}
                    textAnchor="middle"
                    fill={statusCfg.color}
                    fontSize={9}
                    fontWeight={500}
                  >
                    {isZh ? statusCfg.label : statusCfg.labelEn}
                  </text>
                </g>

                {/* Action items floating near the dimension */}
                {dimActions.slice(0, 3).map((action, idx) => {
                  const offset = getActionCardOffset(angle, idx);
                  const cardX = pos.x + offset.x;
                  const cardY = pos.y + offset.y - 12;
                  const statusColor =
                    action.status === "done"
                      ? "#10B981"
                      : action.status === "in_progress" || action.status === "accepted"
                      ? "#3B82F6"
                      : action.status === "blocked"
                      ? "#EF4444"
                      : "#6B7280";
                  const statusPrefix =
                    action.status === "done"
                      ? "✓"
                      : action.status === "in_progress" || action.status === "accepted"
                      ? "▶"
                      : action.status === "blocked"
                      ? "✗"
                      : "";

                  const truncatedText =
                    action.text.length > 10
                      ? action.text.slice(0, 10) + "…"
                      : action.text;

                  return (
                    <g
                      key={action.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => onActionClick?.(action.id)}
                    >
                      <rect
                        x={cardX - 52}
                        y={cardY - 9}
                        width={104}
                        height={20}
                        rx={5}
                        fill="currentColor"
                        className="fill-card"
                        stroke={isHovered ? config.color + "40" : "currentColor"}
                        strokeOpacity={isHovered ? 1 : 0.15}
                        strokeWidth={1}
                        style={{
                          filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.06))",
                        }}
                      />
                      <text
                        x={cardX - 42}
                        y={cardY + 4}
                        fill={statusColor}
                        fontSize={9}
                        fontWeight={600}
                      >
                        {statusPrefix}
                      </text>
                      <text
                        x={cardX - 34}
                        y={cardY + 4}
                        fill="currentColor"
                        className="fill-foreground"
                        fontSize={9}
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
  );
}

export { DIMENSION_CONFIG, STATUS_CONFIG, DIMENSION_POSITIONS };
export default DecisionMap;
