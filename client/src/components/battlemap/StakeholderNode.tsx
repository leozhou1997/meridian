import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { SENTIMENT, ROLE_INFO } from './colors';
import { ChevronRight, User } from 'lucide-react';

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
  compact?: boolean; // Mini avatar mode for dimension lens
  onToggleExpand: (id: number) => void;
  onNodeClick: (id: number) => void;
}

/**
 * Compact mode: small avatar circle with name tooltip (used in dimension lens)
 */
function CompactStakeholder({ d }: { d: StakeholderNodeData }) {
  const sentimentStyle = SENTIMENT[d.sentiment] || SENTIMENT.unknown;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Top} id="top" className="!w-1 !h-1 !border-0 !opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-1 !h-1 !border-0 !opacity-0" />

      <div
        className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-shadow"
        style={{
          background: '#fff',
          border: `2px solid ${sentimentStyle.border}`,
          boxShadow: hovered ? `0 0 0 3px ${sentimentStyle.border}30` : '0 1px 3px rgba(0,0,0,0.08)',
        }}
        onClick={() => d.onNodeClick(d.id)}
      >
        {d.avatarUrl ? (
          <img src={d.avatarUrl} alt={d.name} className="w-full h-full object-cover rounded-full" />
        ) : (
          <span className="text-xs font-semibold" style={{ color: sentimentStyle.text }}>
            {d.name.slice(0, 2)}
          </span>
        )}
      </div>

      {/* Tooltip on hover */}
      {hovered && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-1 -translate-y-full z-50 px-2.5 py-1.5 rounded-md text-xs pointer-events-none whitespace-nowrap"
          style={{
            background: '#1e293b',
            color: '#f1f5f9',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div className="font-medium">{d.name}</div>
          <div className="text-[10px] opacity-70">{d.title}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Full mode: professional card with role badge, sentiment indicator, progress
 */
function FullStakeholder({ d }: { d: StakeholderNodeData }) {
  const sentimentStyle = SENTIMENT[d.sentiment] || SENTIMENT.unknown;
  const roleInfo = ROLE_INFO[d.role] || { label: d.role.slice(0, 3).toUpperCase(), color: '#64748b', bg: '#f8fafc' };
  const [hovered, setHovered] = useState(false);
  const progress = d.needCount > 0 ? (d.satisfiedCount / d.needCount) * 100 : 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Connection handles — invisible */}
      <Handle type="source" position={Position.Right} className="!w-1 !h-1 !border-0 !opacity-0" />
      <Handle type="target" position={Position.Left} className="!w-1 !h-1 !border-0 !opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-1 !h-1 !border-0 !opacity-0" />
      <Handle type="target" position={Position.Top} id="top" className="!w-1 !h-1 !border-0 !opacity-0" />

      <div
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg cursor-pointer transition-all duration-150"
        style={{
          background: '#ffffff',
          borderLeft: `3px solid ${sentimentStyle.border}`,
          border: `1px solid ${hovered ? '#d1d5db' : '#e5e7eb'}`,
          borderLeftWidth: 3,
          borderLeftColor: sentimentStyle.border,
          boxShadow: hovered
            ? '0 2px 8px rgba(0,0,0,0.08)'
            : '0 1px 2px rgba(0,0,0,0.04)',
          width: 230,
        }}
        onClick={() => d.onNodeClick(d.id)}
      >
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{
            background: sentimentStyle.bg,
            border: `1.5px solid ${sentimentStyle.border}40`,
          }}
        >
          {d.avatarUrl ? (
            <img src={d.avatarUrl} alt={d.name} className="w-full h-full object-cover rounded-full" />
          ) : (
            <User className="w-4 h-4" style={{ color: sentimentStyle.text }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-gray-900 truncate">{d.name}</span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-semibold tracking-wide"
              style={{
                background: roleInfo.bg,
                color: roleInfo.color,
              }}
            >
              {roleInfo.label}
            </span>
          </div>
          <div className="text-[11px] text-gray-500 truncate mt-0.5">{d.title}</div>

          {/* Progress bar */}
          {d.needCount > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: progress >= 80 ? '#16a34a' : progress >= 40 ? '#d97706' : '#dc2626',
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-400 tabular-nums">{d.satisfiedCount}/{d.needCount}</span>
            </div>
          )}
        </div>

        {/* Expand indicator */}
        {d.needCount > 0 && (
          <button
            className="p-0.5 rounded transition-transform duration-150 flex-shrink-0"
            style={{
              transform: d.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              d.onToggleExpand(d.id);
            }}
          >
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}

function StakeholderNodeComponent({ data }: NodeProps) {
  const d = data as unknown as StakeholderNodeData;

  if (d.compact) {
    return <CompactStakeholder d={d} />;
  }
  return <FullStakeholder d={d} />;
}

export const StakeholderNode = memo(StakeholderNodeComponent);
