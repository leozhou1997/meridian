import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { DIMENSION_COLORS, DEFAULT_DIMENSION_COLOR } from './colors';
import { SlidersHorizontal } from 'lucide-react';

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

  // Score to color
  const scoreColor = d.score >= 70 ? '#16a34a' : d.score >= 40 ? '#d97706' : '#dc2626';

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="source" position={Position.Right} className="!w-1 !h-1 !border-0 !opacity-0" />
      <Handle type="target" position={Position.Left} className="!w-1 !h-1 !border-0 !opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-1 !h-1 !border-0 !opacity-0" />
      <Handle type="target" position={Position.Top} id="top" className="!w-1 !h-1 !border-0 !opacity-0" />

      <div
        className="rounded-lg px-4 py-3 cursor-pointer transition-all duration-150"
        style={{
          background: '#ffffff',
          borderLeft: `3px solid ${colors.border}`,
          border: `1px solid ${hovered ? '#d1d5db' : '#e5e7eb'}`,
          borderLeftWidth: 3,
          borderLeftColor: colors.border,
          boxShadow: hovered
            ? '0 2px 8px rgba(0,0,0,0.08)'
            : '0 1px 2px rgba(0,0,0,0.04)',
          width: 220,
        }}
        onClick={() => d.onNodeClick(d.dimensionKey)}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800">
            {d.label}
          </span>
          <span
            className="text-lg font-bold tabular-nums"
            style={{ color: scoreColor }}
          >
            {d.score}
          </span>
        </div>

        {/* Score bar */}
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${d.score}%`,
              background: scoreColor,
            }}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
          <span>{d.relatedStakeholderCount} 人相关</span>
          <span>·</span>
          <span>{d.relatedActionCount} 个行动</span>
        </div>

        {/* Weight adjustment — show on hover */}
        {hovered && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <button
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
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
                  className="flex-1 h-1"
                  style={{ accentColor: colors.border }}
                />
                <span className="text-[10px] text-gray-400 w-8 text-right tabular-nums">{d.weight}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const DimensionNode = memo(DimensionNodeComponent);
