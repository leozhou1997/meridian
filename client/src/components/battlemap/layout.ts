import type { Node, Edge } from '@xyflow/react';
import { getRolePriority, NEED_TYPE, DIMENSION_COLORS, DEFAULT_DIMENSION_COLOR } from './colors';

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

interface LayoutInput {
  stakeholders: Stakeholder[];
  needs: Need[];
  actions: Action[];
  dimensions: Dimension[];
  expandedStakeholders: Set<number>;
  expandedNeeds: Set<number>;
  expandedDimensions: Set<string>;
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
    // Same priority: sort by creation time (older first)
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });
}

/**
 * People Lens Layout:
 * Stakeholders arranged vertically on the left, needs branch out to the right
 */
export function computePeopleLens(input: LayoutInput): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const sorted = sortStakeholders(input.stakeholders);
  const STAKEHOLDER_X = 50;
  const NEED_X_START = 320;
  const NEED_GAP_Y = 60;
  const STAKEHOLDER_GAP_Y = 100;

  let currentY = 50;

  for (const sh of sorted) {
    const shNeeds = input.needs.filter(n => n.stakeholderId === sh.id);
    const satisfiedCount = shNeeds.filter(n => n.status === 'satisfied').length;
    const isExpanded = input.expandedStakeholders.has(sh.id);

    // Stakeholder node
    const shNodeId = `sh-${sh.id}`;
    nodes.push({
      id: shNodeId,
      type: 'stakeholder',
      position: { x: STAKEHOLDER_X, y: currentY },
      data: {
        id: sh.id,
        name: sh.name,
        title: sh.title,
        role: sh.role,
        sentiment: sh.sentiment || 'unknown',
        avatarUrl: sh.avatarUrl,
        needCount: shNeeds.length,
        satisfiedCount,
        isExpanded,
        onToggleExpand: input.callbacks.onToggleStakeholder,
        onNodeClick: input.callbacks.onStakeholderClick,
      },
    });

    // If expanded, show needs branching to the right
    if (isExpanded && shNeeds.length > 0) {
      // Group needs by type
      const byType: Record<string, typeof shNeeds> = {};
      for (const n of shNeeds) {
        if (!byType[n.needType]) byType[n.needType] = [];
        byType[n.needType].push(n);
      }

      let needY = currentY - ((shNeeds.length - 1) * NEED_GAP_Y) / 2;

      for (const [type, typeNeeds] of Object.entries(byType)) {
        for (const need of typeNeeds) {
          const needNodeId = `need-${need.id}`;
          const linkedActions = input.actions.filter(a => a.needId === need.id);
          const isActionsExpanded = input.expandedNeeds.has(need.id);

          nodes.push({
            id: needNodeId,
            type: 'need',
            position: { x: NEED_X_START, y: needY },
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

          // Edge: stakeholder → need
          edges.push({
            id: `e-${shNodeId}-${needNodeId}`,
            source: shNodeId,
            target: needNodeId,
            type: 'needEdge',
            data: { needType: need.needType },
          });

          needY += NEED_GAP_Y;
        }
      }

      currentY += Math.max(shNeeds.length * NEED_GAP_Y, STAKEHOLDER_GAP_Y);
    } else {
      currentY += STAKEHOLDER_GAP_Y;
    }
  }

  return { nodes, edges };
}

/**
 * Dimension Lens Layout:
 * Dimensions arranged in a radial pattern around center,
 * with related stakeholders connected
 */
export function computeDimensionLens(input: LayoutInput): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const CENTER_X = 400;
  const CENTER_Y = 300;
  const DIM_RADIUS = 250;
  const SH_RADIUS = 480;

  // Place dimension nodes in a circle
  const dims = input.dimensions;
  for (let i = 0; i < dims.length; i++) {
    const angle = (i / dims.length) * 2 * Math.PI - Math.PI / 2;
    const x = CENTER_X + DIM_RADIUS * Math.cos(angle) - 100; // offset for node width
    const y = CENTER_Y + DIM_RADIUS * Math.sin(angle) - 30;

    const dim = dims[i];
    const dimKey = dim.dimensionKey;
    const relatedNeeds = input.needs.filter(n => n.dimensionKey === dimKey);
    const relatedStakeholderIds = new Set(relatedNeeds.map(n => n.stakeholderId));
    const relatedActions = input.actions.filter(a => a.dimensionKey === dimKey);

    const dimNodeId = `dim-${dimKey}`;
    nodes.push({
      id: dimNodeId,
      type: 'dimension',
      position: { x, y },
      data: {
        dimensionKey: dimKey,
        label: dim.label,
        score: dim.score,
        weight: dim.weight ?? 100,
        relatedStakeholderCount: relatedStakeholderIds.size,
        relatedActionCount: relatedActions.length,
        isExpanded: input.expandedDimensions.has(dimKey),
        onToggleExpand: input.callbacks.onDimensionToggle,
        onWeightChange: input.callbacks.onDimensionWeightChange,
        onNodeClick: input.callbacks.onDimensionClick,
      },
    });
  }

  // Place stakeholder nodes around the outer ring
  const sorted = sortStakeholders(input.stakeholders);
  for (let i = 0; i < sorted.length; i++) {
    const sh = sorted[i];
    const angle = (i / sorted.length) * 2 * Math.PI - Math.PI / 2;
    const x = CENTER_X + SH_RADIUS * Math.cos(angle) - 90;
    const y = CENTER_Y + SH_RADIUS * Math.sin(angle) - 30;

    const shNeeds = input.needs.filter(n => n.stakeholderId === sh.id);
    const satisfiedCount = shNeeds.filter(n => n.status === 'satisfied').length;
    const shNodeId = `sh-${sh.id}`;

    nodes.push({
      id: shNodeId,
      type: 'stakeholder',
      position: { x, y },
      data: {
        id: sh.id,
        name: sh.name,
        title: sh.title,
        role: sh.role,
        sentiment: sh.sentiment || 'unknown',
        avatarUrl: sh.avatarUrl,
        needCount: shNeeds.length,
        satisfiedCount,
        isExpanded: false, // Don't expand needs in dimension lens
        onToggleExpand: input.callbacks.onToggleStakeholder,
        onNodeClick: input.callbacks.onStakeholderClick,
      },
    });

    // Connect stakeholder to related dimensions
    const shDimKeys = Array.from(new Set(shNeeds.map(n => n.dimensionKey).filter(Boolean)));
    for (const dimKey of shDimKeys) {
      const dimColors = DIMENSION_COLORS[dimKey as string] || DEFAULT_DIMENSION_COLOR;
      edges.push({
        id: `e-dim-${dimKey}-sh-${sh.id}`,
        source: `dim-${dimKey}`,
        target: shNodeId,
        type: 'dimensionEdge',
        data: { color: dimColors.border },
      });
    }
  }

  return { nodes, edges };
}
