import { useState, useCallback } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import { NEED_TYPE, NEED_STATUS } from './colors';

interface NeedEditDialogProps {
  need: {
    id: number;
    title: string;
    description?: string | null;
    needType: string;
    status: string;
  };
  isZh: boolean;
  onSave: (id: number, data: { title: string; description: string; needType: string; status: string }) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

const NEED_TYPES = ['organizational', 'professional', 'personal'] as const;
const STATUSES = ['unmet', 'in_progress', 'satisfied', 'blocked'] as const;

export function NeedEditDialog({ need, isZh, onSave, onDelete, onClose }: NeedEditDialogProps) {
  const [title, setTitle] = useState(need.title);
  const [description, setDescription] = useState(need.description || '');
  const [needType, setNeedType] = useState(need.needType);
  const [status, setStatus] = useState(need.status);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = useCallback(() => {
    if (!title.trim()) return;
    onSave(need.id, { title: title.trim(), description: description.trim(), needType, status });
  }, [need.id, title, description, needType, status, onSave]);

  const handleDelete = useCallback(() => {
    if (showDeleteConfirm) {
      onDelete(need.id);
    } else {
      setShowDeleteConfirm(true);
    }
  }, [need.id, showDeleteConfirm, onDelete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl p-5 bg-white border border-gray-200 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">
            {isZh ? '编辑需求' : 'Edit Need'}
          </h3>
          <button
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="mb-3">
          <label className="block text-[11px] font-medium text-gray-500 mb-1">
            {isZh ? '标题' : 'Title'}
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-gray-800 bg-white border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none transition-colors"
            placeholder={isZh ? '需求标题...' : 'Need title...'}
          />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label className="block text-[11px] font-medium text-gray-500 mb-1">
            {isZh ? '描述' : 'Description'}
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm text-gray-800 bg-white border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none transition-colors resize-none"
            placeholder={isZh ? '详细描述...' : 'Detailed description...'}
          />
        </div>

        {/* Need Type */}
        <div className="mb-3">
          <label className="block text-[11px] font-medium text-gray-500 mb-1">
            {isZh ? '需求类型' : 'Need Type'}
          </label>
          <div className="flex gap-2">
            {NEED_TYPES.map(type => {
              const typeColors = NEED_TYPE[type];
              const isSelected = needType === type;
              return (
                <button
                  key={type}
                  className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    background: isSelected ? typeColors.bg : '#f9fafb',
                    border: `1px solid ${isSelected ? typeColors.border : '#e5e7eb'}`,
                    color: isSelected ? typeColors.text : '#9ca3af',
                  }}
                  onClick={() => setNeedType(type)}
                >
                  {typeColors.icon} {typeColors.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className="mb-5">
          <label className="block text-[11px] font-medium text-gray-500 mb-1">
            {isZh ? '状态' : 'Status'}
          </label>
          <div className="flex gap-2">
            {STATUSES.map(s => {
              const statusInfo = NEED_STATUS[s];
              const isSelected = status === s;
              return (
                <button
                  key={s}
                  className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    background: isSelected ? `${statusInfo.color}10` : '#f9fafb',
                    border: `1px solid ${isSelected ? statusInfo.color + '40' : '#e5e7eb'}`,
                    color: isSelected ? statusInfo.color : '#9ca3af',
                  }}
                  onClick={() => setStatus(s)}
                >
                  {statusInfo.icon} {statusInfo.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showDeleteConfirm
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
            onClick={handleDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {showDeleteConfirm
              ? (isZh ? '确认删除' : 'Confirm Delete')
              : (isZh ? '删除' : 'Delete')}
          </button>

          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={onClose}
            >
              {isZh ? '取消' : 'Cancel'}
            </button>
            <button
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50 shadow-sm"
              onClick={handleSave}
              disabled={!title.trim()}
            >
              <Save className="w-3.5 h-3.5" />
              {isZh ? '保存' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
