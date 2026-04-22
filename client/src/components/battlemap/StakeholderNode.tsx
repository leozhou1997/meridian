import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { SENTIMENT, getRolePriority } from './colors';
import { ChevronDown, ChevronRight, User } from 'lucide-react';

export interface StakeholderNodeData {
  id: number;
  name: string;
  title: string;
  role: string;
  sentiment: 'supportive' | 'neutral' | 'negative' | 'unknown';
  avatarUrl?: string | null;
  needCount: number;
  satisfiedCount: number;
  isExpanded: boolean;
  onToggleExpand: (id: number) => void;
  onNodeClick: (id: number) => void;
}

function StakeholderNodeComponent({ data }: NodeProps) {
  const d = data as unknown as StakeholderNodeData;
  const sentimentStyle = SENTIMENT[d.sentiment] || SENTIMENT.unknown;
  const [hovered, setHovered] = useState(false);

  const progress = d.needCount > 0 ? (d.satisfiedCount / d.needCount) * 100 : 0;

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Connection handles */}
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-slate-500 !border-0 opacity-0" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-slate-500 !border-0 opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-slate-500 !border-0 opacity-0" />
      <Handle type="target" position={Position.Top} id="top" className="!w-2 !h-2 !bg-slate-500 !border-0 opacity-0" />

      {/* Main node card */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200"
        style={{
          background: hovered ? 'rgba(30,41,59,0.95)' : 'rgba(15,23,42,0.9)',
          border: `2px solid ${sentimentStyle.border}`,
          boxShadow: hovered
            ? `0 0 20px ${sentimentStyle.border}40, 0 4px 12px rgba(0,0,0,0.3)`
            : `0 2px 8px rgba(0,0,0,0.2)`,
          minWidth: 180,
        }}
        onClick={() => d.onNodeClick(d.id)}
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{
            border: `2px solid ${sentimentStyle.border}`,
            background: sentimentStyle.bg,
          }}
        >
          {d.avatarUrl ? (
            <img src={d.avatarUrl} alt={d.name} className="w-full h-full object-cover rounded-full" />
          ) : (
            <User className="w-5 h-5" style={{ color: sentimentStyle.text }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100 truncate">{d.name}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: sentimentStyle.bg,
                color: sentimentStyle.text,
                border: `1px solid ${sentimentStyle.border}40`,
              }}
            >
              {sentimentStyle.label}
            </span>
          </div>
          <div className="text-xs text-slate-400 truncate mt-0.5">{d.title}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{d.role}</div>

          {/* Progress bar */}
          {d.needCount > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: progress >= 80 ? '#22c55e' : progress >= 40 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-500">{d.satisfiedCount}/{d.needCount}</span>
            </div>
          )}
        </div>

        {/* Expand toggle */}
        {d.needCount > 0 && (
          <button
            className="p-1 rounded hover:bg-slate-700/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              d.onToggleExpand(d.id);
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

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-50 px-3 py-2 rounded-lg text-xs pointer-events-none"
          style={{
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(100,116,139,0.3)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <div className="text-slate-300">
            {d.needCount > 0
              ? `${d.needCount} 个需求 · ${d.satisfiedCount} 已满足`
              : '暂无需求分析'}
          </div>
        </div>
      )}
    </div>
  );
}

export const StakeholderNode = memo(StakeholderNodeComponent);
