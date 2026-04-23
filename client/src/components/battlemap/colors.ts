/**
 * BattleMap Color System v2
 * 
 * Design principles:
 * - Light professional theme matching Meridian's design language
 * - Uses Meridian CSS variables where possible (oklch palette)
 * - Semantic colors: green=supportive, amber=neutral, red=negative
 * - Subtle, not flashy — information density over decoration
 */

// ─── Sentiment Colors (Stakeholder stance) ─────────────────────────
// Light-theme: colored left border accent + subtle tinted background
export const SENTIMENT = {
  supportive: {
    border: '#16a34a',    // green-600 — professional green
    bg: '#f0fdf4',        // green-50
    text: '#15803d',      // green-700
    label: '支持',
    labelEn: 'Supportive',
  },
  neutral: {
    border: '#d97706',    // amber-600
    bg: '#fffbeb',        // amber-50
    text: '#b45309',      // amber-700
    label: '中立',
    labelEn: 'Neutral',
  },
  negative: {
    border: '#dc2626',    // red-600
    bg: '#fef2f2',        // red-50
    text: '#b91c1c',      // red-700
    label: '阻碍',
    labelEn: 'Blocker',
  },
  unknown: {
    border: '#9ca3af',    // gray-400
    bg: '#f9fafb',        // gray-50
    text: '#6b7280',      // gray-500
    label: '未知',
    labelEn: 'Unknown',
  },
} as const;

// ─── Need Type Colors ───────────────────────────────────────────────
// Light-theme pill/badge colors
export const NEED_TYPE = {
  organizational: {
    bg: '#eff6ff',                     // blue-50
    border: '#3b82f6',                 // blue-500
    text: '#1d4ed8',                   // blue-700
    label: '组织需求',
    labelEn: 'Org',
    icon: '🏢',
  },
  professional: {
    bg: '#f5f3ff',                     // violet-50
    border: '#8b5cf6',                 // violet-500
    text: '#6d28d9',                   // violet-700
    label: '职业需求',
    labelEn: 'Prof',
    icon: '📈',
  },
  personal: {
    bg: '#fff7ed',                     // orange-50
    border: '#f97316',                 // orange-500
    text: '#c2410c',                   // orange-700
    label: '个人需求',
    labelEn: 'Personal',
    icon: '👤',
  },
} as const;

// ─── Need Status ────────────────────────────────────────────────────
export const NEED_STATUS = {
  unmet: {
    opacity: 1,
    icon: '○',
    label: '未满足',
    color: '#dc2626',     // red-600
  },
  in_progress: {
    opacity: 0.85,
    icon: '◐',
    label: '推进中',
    color: '#d97706',     // amber-600
  },
  satisfied: {
    opacity: 0.6,
    icon: '●',
    label: '已满足',
    color: '#16a34a',     // green-600
  },
  blocked: {
    opacity: 1,
    icon: '⊘',
    label: '受阻',
    color: '#dc2626',
  },
} as const;

// ─── Dimension Colors ───────────────────────────────────────────────
// Light-theme: subtle tinted backgrounds with professional accent borders
export const DIMENSION_COLORS: Record<string, { bg: string; border: string; text: string; lightBg: string }> = {
  need_discovery: {
    bg: '#eff6ff',        // blue-50
    border: '#2563eb',    // blue-600
    text: '#1e40af',      // blue-800
    lightBg: '#dbeafe',   // blue-100
  },
  value_proposition: {
    bg: '#ecfdf5',        // emerald-50
    border: '#059669',    // emerald-600
    text: '#065f46',      // emerald-800
    lightBg: '#d1fae5',   // emerald-100
  },
  commercial_close: {
    bg: '#fffbeb',        // amber-50
    border: '#d97706',    // amber-600
    text: '#92400e',      // amber-800
    lightBg: '#fde68a',   // amber-200
  },
  relationship_penetration: {
    bg: '#f5f3ff',        // violet-50
    border: '#7c3aed',    // violet-600
    text: '#5b21b6',      // violet-800
    lightBg: '#ddd6fe',   // violet-100
  },
  tech_validation: {
    bg: '#ecfeff',        // cyan-50
    border: '#0891b2',    // cyan-600
    text: '#155e75',      // cyan-800
    lightBg: '#cffafe',   // cyan-100
  },
  competitive_defense: {
    bg: '#fef2f2',        // red-50
    border: '#dc2626',    // red-600
    text: '#991b1b',      // red-800
    lightBg: '#fecaca',   // red-100
  },
};

// Fallback for custom dimensions
export const DEFAULT_DIMENSION_COLOR = {
  bg: '#f8fafc',          // slate-50
  border: '#64748b',      // slate-500
  text: '#334155',        // slate-700
  lightBg: '#e2e8f0',    // slate-200
};

// ─── Edge/Connection Colors ─────────────────────────────────────────
export const EDGE = {
  needConnection: '#cbd5e1',      // slate-300 — very subtle
  relationship: '#94a3b8',        // slate-400
  positive: '#16a34a',            // green-600
  negative: '#dc2626',            // red-600
  neutral: '#9ca3af',             // gray-400
} as const;

// ─── Role Priority (for fixed sort order) ───────────────────────────
export const ROLE_PRIORITY: Record<string, number> = {
  'Decision Maker': 1,
  'Champion': 2,
  'Economic Buyer': 3,
  'Influencer': 4,
  'Evaluator': 5,
  'Gatekeeper': 6,
  'User': 7,
  'Blocker': 8,
};

export function getRolePriority(role: string): number {
  return ROLE_PRIORITY[role] ?? 99;
}

// ─── Role display info ──────────────────────────────────────────────
export const ROLE_INFO: Record<string, { label: string; labelEn: string; color: string; bg: string }> = {
  'Decision Maker': { label: '决策者', labelEn: 'DM', color: '#7c3aed', bg: '#f5f3ff' },
  'Champion': { label: '支持者', labelEn: 'CH', color: '#16a34a', bg: '#f0fdf4' },
  'Economic Buyer': { label: '预算方', labelEn: 'EB', color: '#0891b2', bg: '#ecfeff' },
  'Influencer': { label: '影响者', labelEn: 'INF', color: '#2563eb', bg: '#eff6ff' },
  'Evaluator': { label: '评估者', labelEn: 'EV', color: '#d97706', bg: '#fffbeb' },
  'Gatekeeper': { label: '把关人', labelEn: 'GK', color: '#64748b', bg: '#f8fafc' },
  'User': { label: '使用者', labelEn: 'USR', color: '#64748b', bg: '#f8fafc' },
  'Blocker': { label: '阻碍者', labelEn: 'BLK', color: '#dc2626', bg: '#fef2f2' },
};

// ─── Phase Colors (for timeline) ────────────────────────────────────
export const PHASE = {
  establish: {
    bg: '#eff6ff',        // blue-50
    border: '#3b82f6',
    text: '#1d4ed8',
    label: '建立据点',
  },
  expand: {
    bg: '#f5f3ff',        // violet-50
    border: '#8b5cf6',
    text: '#6d28d9',
    label: '扩大战果',
  },
  harvest: {
    bg: '#f0fdf4',        // green-50
    border: '#22c55e',
    text: '#15803d',
    label: '收割成果',
  },
} as const;
