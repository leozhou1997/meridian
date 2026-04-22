/**
 * BattleMap Color System
 * 
 * Design principles:
 * - Not sci-fi, not plain — professional with clear meaning
 * - Every color conveys specific information
 * - Sufficient contrast on dark backgrounds
 * - Consistent with existing Meridian design tokens
 */

// ─── Sentiment Colors (Stakeholder stance) ─────────────────────────
// These appear as node borders and badges
export const SENTIMENT = {
  supportive: {
    border: '#22c55e',    // green-500 — clear positive
    bg: 'rgba(34,197,94,0.08)',
    text: '#4ade80',      // green-400
    label: '支持',
  },
  neutral: {
    border: '#f59e0b',    // amber-500 — caution/undecided
    bg: 'rgba(245,158,11,0.08)',
    text: '#fbbf24',      // amber-400
    label: '中立',
  },
  negative: {
    border: '#ef4444',    // red-500 — opposition/blocker
    bg: 'rgba(239,68,68,0.08)',
    text: '#f87171',      // red-400
    label: '阻碍',
  },
  unknown: {
    border: '#6b7280',    // gray-500 — not yet assessed
    bg: 'rgba(107,114,128,0.08)',
    text: '#9ca3af',      // gray-400
    label: '未知',
  },
} as const;

// ─── Need Type Colors ───────────────────────────────────────────────
// Appear as need card backgrounds and category badges
export const NEED_TYPE = {
  organizational: {
    bg: 'rgba(59,130,246,0.12)',      // blue tint
    border: '#3b82f6',                 // blue-500
    text: '#60a5fa',                   // blue-400
    label: '组织需求',
    icon: '🏢',
  },
  professional: {
    bg: 'rgba(139,92,246,0.12)',      // violet tint
    border: '#8b5cf6',                 // violet-500
    text: '#a78bfa',                   // violet-400
    label: '职业需求',
    icon: '📈',
  },
  personal: {
    bg: 'rgba(249,115,22,0.12)',      // orange tint
    border: '#f97316',                 // orange-500
    text: '#fb923c',                   // orange-400
    label: '个人需求',
    icon: '👤',
  },
} as const;

// ─── Need Status ────────────────────────────────────────────────────
export const NEED_STATUS = {
  unmet: {
    opacity: 1,
    icon: '○',
    label: '未满足',
    color: '#ef4444',
  },
  in_progress: {
    opacity: 0.75,
    icon: '◐',
    label: '推进中',
    color: '#f59e0b',
  },
  satisfied: {
    opacity: 0.5,
    icon: '●',
    label: '已满足',
    color: '#22c55e',
  },
  blocked: {
    opacity: 1,
    icon: '⊘',
    label: '受阻',
    color: '#ef4444',
  },
} as const;

// ─── Dimension Colors ───────────────────────────────────────────────
// Used in Dimension Lens view for the six MEDDIC-style dimensions
export const DIMENSION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  technical_validation: {
    bg: 'rgba(6,182,212,0.12)',
    border: '#06b6d4',    // cyan-500
    text: '#22d3ee',
  },
  business_case: {
    bg: 'rgba(34,197,94,0.12)',
    border: '#22c55e',    // green-500
    text: '#4ade80',
  },
  competitive_defense: {
    bg: 'rgba(239,68,68,0.12)',
    border: '#ef4444',    // red-500
    text: '#f87171',
  },
  champion_development: {
    bg: 'rgba(249,115,22,0.12)',
    border: '#f97316',    // orange-500
    text: '#fb923c',
  },
  executive_sponsorship: {
    bg: 'rgba(139,92,246,0.12)',
    border: '#8b5cf6',    // violet-500
    text: '#a78bfa',
  },
  budget_process: {
    bg: 'rgba(236,72,153,0.12)',
    border: '#ec4899',    // pink-500
    text: '#f472b6',
  },
};

// Fallback for custom dimensions
export const DEFAULT_DIMENSION_COLOR = {
  bg: 'rgba(148,163,184,0.12)',
  border: '#94a3b8',
  text: '#cbd5e1',
};

// ─── Edge/Connection Colors ─────────────────────────────────────────
export const EDGE = {
  needConnection: '#475569',      // slate-600 — subtle
  relationship: '#64748b',        // slate-500
  positive: '#22c55e',            // green
  negative: '#ef4444',            // red
  neutral: '#94a3b8',             // gray
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

// ─── Phase Colors (for timeline) ────────────────────────────────────
export const PHASE = {
  establish: {
    bg: 'rgba(59,130,246,0.06)',
    border: '#3b82f6',
    text: '#60a5fa',
    label: '建立据点',
  },
  expand: {
    bg: 'rgba(139,92,246,0.06)',
    border: '#8b5cf6',
    text: '#a78bfa',
    label: '扩大战果',
  },
  harvest: {
    bg: 'rgba(34,197,94,0.06)',
    border: '#22c55e',
    text: '#4ade80',
    label: '收割',
  },
} as const;
