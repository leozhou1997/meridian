import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NEED_TYPE, NEED_STATUS } from './colors';
import { Pencil, Trash2, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, Ban } from 'lucide-react';

export interface NeedNodeData {
  id: number;
  title: string;
  description?: string | null;
  needType: 'organizational' | 'professional' | 'personal';
  status: 'unmet' | 'in_progress' | 'satisfied' | 'blocked';
  stakeholderId: number;
  linkedActionCount: number;
  isActionsExpanded: boolean;
  linkedActions: Array<{ id: number; action: string; isDone: boolean }>;
  onStatusCycle: (needId: number) => void;
  onEdit: (needId: number) => void;
  onDelete: (needId: number) => void;
  onToggleActions: (needId: number) => void;
}

const STATUS_ICONS = {
  unmet: Circle,
  in_progress: Clock,
  satisfied: CheckCircle2,
  blocked: Ban,
};

function NeedNodeComponent({ data }: NodeProps) {
  const d = data as unknown as NeedNodeData;
  const typeStyle = NEED_TYPE[d.needType] || NEED_TYPE.organizational;
  const statusStyle = NEED_STATUS[d.status] || NEED_STATUS.unmet;
  const StatusIcon = STATUS_ICONS[d.status] || Circle;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Left} className="!w-1 !h-1 !border-0 !opacity-0" />
      <Handle type="source" position={Position.Right} className="!w-1 !h-1 !border-0 !opacity-0" />
      <Handle type="target" position={Position.Top} id="top" className="!w-1 !h-1 !border-0 !opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-1 !h-1 !border-0 !opacity-0" />

      <div
        className="rounded-md px-3 py-2 transition-all duration-150"
        style={{
          background: typeStyle.bg,
          border: `1px solid ${hovered ? typeStyle.border : typeStyle.border + '40'}`,
          opacity: statusStyle.opacity,
          boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          width: 200,
        }}
      >
        {/* Header row */}
        <div className="flex items-start gap-2">
          {/* Status icon — clickable to cycle */}
          <button
            className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              d.onStatusCycle(d.id);
            }}
            title={`状态: ${statusStyle.label} (点击切换)`}
          >
            <StatusIcon
              className="w-3.5 h-3.5"
              style={{ color: statusStyle.color }}
            />
          </button>

          <div className="flex-1 min-w-0">
            {/* Type badge */}
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: typeStyle.border + '15', color: typeStyle.text }}
            >
              {typeStyle.label}
            </span>
            <div className="text-xs text-gray-700 mt-1 leading-tight line-clamp-2">{d.title}</div>
          </div>

          {/* Action buttons — show on hover */}
          {hovered && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                className="p-1 rounded hover:bg-gray-200/60 transition-colors"
                onClick={(e) => { e.stopPropagation(); d.onEdit(d.id); }}
                title="编辑"
              >
                <Pencil className="w-3 h-3 text-gray-400" />
              </button>
              <button
                className="p-1 rounded hover:bg-red-50 transition-colors"
                onClick={(e) => { e.stopPropagation(); d.onDelete(d.id); }}
                title="删除"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          )}
        </div>

        {/* Linked actions toggle */}
        {d.linkedActionCount > 0 && (
          <button
            className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              d.onToggleActions(d.id);
            }}
          >
            {d.isActionsExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            {d.linkedActionCount} 个行动
          </button>
        )}

        {/* Expanded actions list */}
        {d.isActionsExpanded && d.linkedActions.length > 0 && (
          <div className="mt-1 space-y-0.5 border-t border-gray-200 pt-1">
            {d.linkedActions.map((action) => (
              <div key={action.id} className="flex items-start gap-1.5 text-[10px]">
                <span className={action.isDone ? 'text-green-600' : 'text-gray-300'}>
                  {action.isDone ? '✓' : '○'}
                </span>
                <span className={`leading-tight ${action.isDone ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                  {action.action}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const NeedNode = memo(NeedNodeComponent);
