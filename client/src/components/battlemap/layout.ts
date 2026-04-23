import type { Node, Edge } from '@xyflow/react';
import { getRolePriority, DIMENSION_COLORS, DEFAULT_DIMENSION_COLOR } from './colors';

interface Stakeholder {
  id: number;
  name: string;
  title: string;
  role: string;
  sentiment: string;
  avatarUrl?: string | null;
  createdAt?: string | number | null;
}

interface Need {
  id: number;
  stakeholderId: number;
  needType: string;
  title: string;
  description?: string | null;
  status: string;
  dimensionKey?: string | null;
}

interface Action {
  id: number;
  action: string;
  isDone: boolean;
  stakeholderId?: number | null;
  needId?: number | null;
  dimensionKey?: string | null;
}

interface Dimension {
  dimensionKey: string;
  label: string;
  score: number;
  weight?: number;
}

export interface LayoutInput {
  stakeholders: Stakeholder[];
  needs: Need[];
  actions: Action[];
  dimensions: Dimension[];
  expandedStakeholders: Set<number>;
  expandedNeeds: Set<number>;
  expandedDimensions: Set<string>;
  isZh: boolean;
  callbacks: {
    onToggleStakeholder: (id: number) => void;
    onStakeholderClick: (id: number) => void;
    onNeedStatusCycle: (id: number) => void;
    onNeedEdit: (id: number) => void;
    onNeedDelete: (id: number) => void;
    onToggleNeedActions: (id: number) => void;
    onDimensionToggle: (key: string) => void;
    onDimensionWeightChange: (key: string, weight: number) => void;
    onDimensionClick: (key: string) => void;
  };
}

/**
 * Sort stakeholders by role priority (fixed order), then by creation time
 */
function sortStakeholders(stakeholders: Stakeholder[]): Stakeholder[] {
  return [...stakeholders].sort((a, b) => {
    const pa = getRolePriority(a.role);
    const pb = getRolePriority(b.role);
    if (pa !== pb) return pa - pb;
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });
}

// ─── Layout constants ───────────────────────────────────────────────
const STAKEHOLDER_COL_X = 40;          // Left column for stakeholder cards
const NEED_COL_X = 310;               // Right column for need cards
const STAKEHOLDER_NODE_H = 72;        // Approximate stakeholder node height
const NEED_NODE_H = 48;               // Approximate need node height
const ROW_GAP = 16;                   // Gap between rows
const NEED_GAP = 8;                   // Gap between need cards
const SECTION_GAP = 24;               // Extra gap between expanded/collapsed sections

/**
 * People Lens Layout v2:
 * Fixed two-column layout.
 * Left column: stakeholders sorted by role priority (top = most important)
 * Right column: needs aligned to their stakeholder's row
 * No dragging, no free-floating. Positions are deterministic.
 */
export function computePeopleLens(input: LayoutInput): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const sorted = sortStakeholders(input.stakeholders);
  let currentY = 20;

  for (const sh of sorted) {
    const shNeeds = input.needs.filter(n => n.stakeholderId === sh.id);
    // Progress: count completed actions linked to this stakeholder's dimensions
    const shDimKeys = new Set(shNeeds.map(n => n.dimensionKey).filter(Boolean));
    const relatedActions = input.actions.filter(a => {
      if (a.stakeholderId === sh.id) return true; // directly linked
      if (a.dimensionKey && shDimKeys.has(a.dimensionKey)) return true; // linked via dimension
      return false;
    });
    const totalActions = relatedActions.length;
    const doneActions = relatedActions.filter(a => a.isDone).length;
    // Also count satisfied needs
    const satisfiedNeeds = shNeeds.filter(n => n.status === 'satisfied' || n.status === 'in_progress').length;
    // Combined progress: use actions if available, fall back to needs
    const progressTotal = totalActions > 0 ? totalActions : shNeeds.length;
    const progressDone = totalActions > 0 ? doneActions : satisfiedNeeds;
    const isExpanded = input.expandedStakeholders.has(sh.id);

    const shNodeId = `sh-${sh.id}`;
    const shY = currentY;

    // Stakeholder node — fixed position in left column
    nodes.push({
      id: shNodeId,
      type: 'stakeholder',
      position: { x: STAKEHOLDER_COL_X, y: shY },
      draggable: false,
      data: {
        id: sh.id,
        name: sh.name,
        title: sh.title,
        role: sh.role,
        sentiment: sh.sentiment || 'unknown',
        avatarUrl: sh.avatarUrl,
        needCount: progressTotal,
        satisfiedCount: progressDone,
        isExpanded,
        isZh: input.isZh,
        onToggleExpand: input.callbacks.onToggleStakeholder,
        onNodeClick: input.callbacks.onStakeholderClick,
      },
    });

    if (isExpanded && shNeeds.length > 0) {
      // Group needs by type for visual grouping
      const byType: Record<string, typeof shNeeds> = {};
      for (const n of shNeeds) {
        if (!byType[n.needType]) byType[n.needType] = [];
        byType[n.needType].push(n);
      }

      let needY = shY;
      const allNeeds = Object.values(byType).flat();

      for (const need of allNeeds) {
        const needNodeId = `need-${need.id}`;
        const linkedActions = input.actions.filter(a => a.needId === need.id);
        const isActionsExpanded = input.expandedNeeds.has(need.id);

        nodes.push({
          id: needNodeId,
          type: 'need',
          position: { x: NEED_COL_X, y: needY },
          draggable: false,
          data: {
            id: need.id,
            title: need.title,
            description: need.description,
            needType: need.needType,
            status: need.status,
            stakeholderId: need.stakeholderId,
            linkedActionCount: linkedActions.length,
            isActionsExpanded,
            linkedActions: linkedActions.map(a => ({ id: a.id, action: a.action, isDone: a.isDone })),
            onStatusCycle: input.callbacks.onNeedStatusCycle,
            onEdit: input.callbacks.onNeedEdit,
            onDelete: input.callbacks.onNeedDelete,
            onToggleActions: input.callbacks.onToggleNeedActions,
          },
        });

        // Edge: stakeholder → need (subtle connector)
        edges.push({
          id: `e-${shNodeId}-${needNodeId}`,
          source: shNodeId,
          target: needNodeId,
          type: 'needEdge',
          data: { needType: need.needType },
        });

        // Calculate height for this need node
        const actionHeight = isActionsExpanded ? linkedActions.length * 22 + 8 : 0;
        needY += NEED_NODE_H + actionHeight + NEED_GAP;
      }

      // The row height is the max of stakeholder height and total needs height
      const needsBlockHeight = needY - shY;
      currentY += Math.max(STAKEHOLDER_NODE_H, needsBlockHeight) + SECTION_GAP;
    } else {
      currentY += STAKEHOLDER_NODE_H + ROW_GAP;
    }
  }

  return { nodes, edges };
}

/**
 * Dimension Lens Layout v2:
 * 2x3 grid of dimension cards (fixed positions).
 * Below each dimension, related stakeholder avatars shown as small nodes.
 */
export function computeDimensionLens(input: LayoutInput): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const dims = input.dimensions;
  const COLS = 3;
  const CARD_W = 220;
  const CARD_H = 100;
  const GAP_X = 32;
  const GAP_Y = 40;
  const START_X = 40;
  const START_Y = 20;
  const SH_OFFSET_Y = CARD_H + 16; // stakeholder mini-nodes below dimension

  for (let i = 0; i < dims.length; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = START_X + col * (CARD_W + GAP_X);
    const y = START_Y + row * (CARD_H + GAP_Y + 60); // extra space for stakeholder avatars

    const dim = dims[i];
    const dimKey = dim.dimensionKey;
    const relatedNeeds = input.needs.filter(n => n.dimensionKey === dimKey);
    const relatedStakeholderIds = Array.from(new Set(relatedNeeds.map(n => n.stakeholderId)));
    const relatedActions = input.actions.filter(a => a.dimensionKey === dimKey);

    const dimNodeId = `dim-${dimKey}`;
    nodes.push({
      id: dimNodeId,
      type: 'dimension',
      position: { x, y },
      draggable: false,
      data: {
        dimensionKey: dimKey,
        label: dim.label,
        score: dim.score,
        weight: dim.weight ?? 100,
        relatedStakeholderCount: relatedStakeholderIds.length,
        relatedActionCount: relatedActions.length,
        isExpanded: input.expandedDimensions.has(dimKey),
        onToggleExpand: input.callbacks.onDimensionToggle,
        onWeightChange: input.callbacks.onDimensionWeightChange,
        onNodeClick: input.callbacks.onDimensionClick,
      },
    });

    // Place related stakeholder mini-nodes below the dimension card
    const relatedShs = input.stakeholders.filter(s => relatedStakeholderIds.includes(s.id));
    const sorted = sortStakeholders(relatedShs);
    for (let si = 0; si < sorted.length; si++) {
      const sh = sorted[si];
      const shNeeds = input.needs.filter(n => n.stakeholderId === sh.id);
      // Progress via actions for dimension lens too
      const shDimKeys = new Set(shNeeds.map(n => n.dimensionKey).filter(Boolean));
      const shRelatedActions = input.actions.filter(a => {
        if (a.stakeholderId === sh.id) return true;
        if (a.dimensionKey && shDimKeys.has(a.dimensionKey)) return true;
        return false;
      });
      const shTotalActions = shRelatedActions.length;
      const shDoneActions = shRelatedActions.filter(a => a.isDone).length;
      const shSatisfiedNeeds = shNeeds.filter(n => n.status === 'satisfied' || n.status === 'in_progress').length;
      const shProgressTotal = shTotalActions > 0 ? shTotalActions : shNeeds.length;
      const shProgressDone = shTotalActions > 0 ? shDoneActions : shSatisfiedNeeds;
      const shNodeId = `dim-${dimKey}-sh-${sh.id}`;
      const shX = x + si * 56; // compact spacing for mini avatars

      nodes.push({
        id: shNodeId,
        type: 'stakeholder',
        position: { x: shX, y: y + SH_OFFSET_Y },
        draggable: false,
        data: {
          id: sh.id,
          name: sh.name,
          title: sh.title,
          role: sh.role,
          sentiment: sh.sentiment || 'unknown',
          avatarUrl: sh.avatarUrl,
          needCount: shProgressTotal,
          satisfiedCount: shProgressDone,
          isExpanded: false,
          isZh: input.isZh,
          compact: true, // Signal to render as mini avatar
          onToggleExpand: input.callbacks.onToggleStakeholder,
          onNodeClick: input.callbacks.onStakeholderClick,
        },
      });

      // Edge: dimension → stakeholder
      const dimColors = DIMENSION_COLORS[dimKey] || DEFAULT_DIMENSION_COLOR;
      edges.push({
        id: `e-${dimNodeId}-${shNodeId}`,
        source: dimNodeId,
        target: shNodeId,
        type: 'dimensionEdge',
        sourceHandle: 'bottom',
        targetHandle: 'top',
        data: { color: dimColors.border },
      });
    }
  }

  return { nodes, edges };
}
