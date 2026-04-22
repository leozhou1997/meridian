import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { DIMENSION_COLORS, DEFAULT_DIMENSION_COLOR } from './colors';
import { SlidersHorizontal, ChevronDown, ChevronRight } from 'lucide-react';

export interface DimensionNodeData {
  dimensionKey: string;
  label: string;
  score: number; // 0-100
  weight: number; // 0-100, default 100
  relatedStakeholderCount: number;
  relatedActionCount: number;
  isExpanded: boolean;
  onToggleExpand: (key: string) => void;
  onWeightChange: (key: string, weight: number) => void;
  onNodeClick: (key: string) => void;
}

function DimensionNodeComponent({ data }: NodeProps) {
  const d = data as unknown as DimensionNodeData;
  const colors = DIMENSION_COLORS[d.dimensionKey] || DEFAULT_DIMENSION_COLOR;
  const [hovered, setHovered] = useState(false);
  const [showWeightSlider, setShowWeightSlider] = useState(false);

  // Score to color gradient
  const scoreColor = d.score >= 70 ? '#22c55e' : d.score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-slate-500 !border-0 opacity-0" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-slate-500 !border-0 opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-slate-500 !border-0 opacity-0" />
      <Handle type="target" position={Position.Top} id="top" className="!w-2 !h-2 !bg-slate-500 !border-0 opacity-0" />

      <div
        className="rounded-xl px-4 py-3 cursor-pointer transition-all duration-200"
        style={{
          background: hovered ? 'rgba(30,41,59,0.95)' : colors.bg,
          border: `2px solid ${colors.border}`,
          boxShadow: hovered
            ? `0 0 20px ${colors.border}40, 0 4px 12px rgba(0,0,0,0.3)`
            : `0 2px 8px rgba(0,0,0,0.15)`,
          minWidth: 200,
        }}
        onClick={() => d.onNodeClick(d.dimensionKey)}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: colors.text }}>
            {d.label}
          </span>
          {d.relatedStakeholderCount > 0 && (
            <button
              className="p-0.5 rounded hover:bg-slate-700/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                d.onToggleExpand(d.dimensionKey);
              }}
            >
              {d.isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}
        </div>

        {/* Score bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${d.score}%`,
                background: `linear-gradient(90deg, ${scoreColor}80, ${scoreColor})`,
              }}
            />
          </div>
          <span className="text-xs font-mono font-bold" style={{ color: scoreColor }}>
            {d.score}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
          <span>{d.relatedStakeholderCount} 人相关</span>
          <span>{d.relatedActionCount} 个行动</span>
        </div>

        {/* Weight adjustment */}
        {hovered && (
          <div className="mt-2 pt-2 border-t border-slate-700/50">
            <button
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowWeightSlider(!showWeightSlider);
              }}
            >
              <SlidersHorizontal className="w-3 h-3" />
              权重: {d.weight}%
            </button>
            {showWeightSlider && (
              <div className="mt-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="range"
                  min={10}
                  max={200}
                  value={d.weight}
                  onChange={(e) => d.onWeightChange(d.dimensionKey, Number(e.target.value))}
                  className="flex-1 h-1 accent-slate-400"
                  style={{ accentColor: colors.border }}
                />
                <span className="text-[10px] text-slate-400 w-8 text-right">{d.weight}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const DimensionNode = memo(DimensionNodeComponent);
