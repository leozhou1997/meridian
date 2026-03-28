/**
 * StakeholderMap — Intelligence Cartography design system
 * v9 Changes (2026-03):
 * - FIX: Card overlap — NODE_H corrected to 230 (actual rendered height), initial layout
 *        runs a full collision pass, saved positions also validated on load
 * - IMPROVED: Connection lines — source circle dot + larger bolder arrowhead,
 *             line thickness 2px, direction unmistakable
 * - NEW: Expandable interaction history shows full editable transcript entries
 *        (type dropdown, date, duration, notes textarea) stored in local state per deal
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stakeholder, Deal, Interaction, Meeting } from '@/lib/data';
import { getRoleColor } from '@/lib/data';
import { StakeholderAvatar } from '@/components/Avatars';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ZoomIn, ZoomOut, Maximize2, Edit2, Eye, Plus, Trash2,
  Link2, Link2Off, Save, X, Check, Camera, Mail, Flame,
  GripVertical, ChevronDown, ChevronUp, Pencil, Clock, Calendar,
  Layers, LayoutGrid, RotateCcw, MessageSquare, Image, FileText, Mic, Send, Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

interface StakeholderMapProps {
  deal: Deal;
  onStakeholderClick?: (stakeholder: Stakeholder) => void;
  onStakeholdersChange?: (stakeholders: Stakeholder[]) => void;
  onBuyingStagesChange?: (stages: string[]) => void;
  highlightedStakeholderId?: number | null;
  initialZoom?: number;
  isMobile?: boolean;
}

interface NodePosition { id: string; x: number; y: number; }

export type ConnectionType = 'reports_to' | 'influences' | 'collaborates' | 'blocks';

export interface Connection {
  id: string;
  from: string;
  to: string;
  type: ConnectionType;
}

type HeatWindow = 'L7D' | 'L14D' | 'L30D';

const CONNECTION_TYPES: { value: ConnectionType; label: string; color: string; dash?: string }[] = [
  { value: 'reports_to',   label: 'Reports To',   color: 'rgba(99,130,255,0.85)',  dash: 'none' },
  { value: 'influences',   label: 'Influences',   color: 'rgba(16,185,129,0.85)',  dash: 'none' },
  { value: 'collaborates', label: 'Collaborates', color: 'rgba(245,158,11,0.85)',  dash: '6 3' },
  { value: 'blocks',       label: 'Blocks',       color: 'rgba(239,68,68,0.9)',    dash: '4 3' },
];

// Collapsed card dimensions (used for layout math — the default resting size)
const NODE_W = 148;
const NODE_H = 108;
const CARD_GAP = 32; // minimum gap between card edges (more room for connection lines)

type ViewLayout = 'concentric' | 'stages';


const AVATAR_POOL = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mx&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ny&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oz&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Pw&backgroundColor=ffd5dc',
];

const INTERACTION_TYPES = [
  'Discovery Call', 'Demo', 'Technical Review', 'POC Check-in',
  'Negotiation', 'Executive Briefing', 'Follow-up',
] as const;

// ── localStorage helpers ──────────────────────────────────────────────────────
function storageKey(dealId: string) { return `meridian_map_v3_${dealId}`; }
function historyKey(dealId: string) { return `meridian_map_history_${dealId}`; }

interface PersistedMapState {
  positions: NodePosition[];
  circlePositions?: NodePosition[];
  stagePositions?: NodePosition[];
  connections: Connection[];
  localInteractions: Interaction[];
}

interface MapVersion {
  id: string;
  label: string;
  savedAt: string; // ISO string
  state: PersistedMapState;
}

function loadHistory(dealId: string): MapVersion[] {
  try {
    const raw = localStorage.getItem(historyKey(dealId));
    if (!raw) return [];
    return JSON.parse(raw) as MapVersion[];
  } catch { return []; }
}

function saveHistory(dealId: string, versions: MapVersion[]) {
  try {
    // Keep max 20 versions
    const trimmed = versions.slice(0, 20);
    localStorage.setItem(historyKey(dealId), JSON.stringify(trimmed));
  } catch {}
}

function loadState(dealId: string): PersistedMapState | null {
  try {
    const raw = localStorage.getItem(storageKey(dealId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const { positions, circlePositions, stagePositions, connections, localInteractions } = parsed;
    if (!Array.isArray(positions)) return null;
    return {
      positions,
      circlePositions: circlePositions ?? undefined,
      stagePositions: stagePositions ?? undefined,
      connections: connections ?? [],
      localInteractions: localInteractions ?? [],
    };
  } catch { return null; }
}

function saveState(dealId: string, state: PersistedMapState) {
  try {
    localStorage.setItem(storageKey(dealId), JSON.stringify(state));
  } catch {}
}

// ── Heat score calculation ────────────────────────────────────────────────────
function computeHeatScore(
  stakeholderName: string,
  interactions: Deal['meetings'],
  window: HeatWindow,
  maxCount: number,
): number {
  const days = window === 'L7D' ? 7 : window === 'L14D' ? 14 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const count = (interactions ?? []).filter(i => {
    const d = new Date(i.date);
    return d >= cutoff && i.keyParticipant.toLowerCase().includes(stakeholderName.split(' ')[0].toLowerCase());
  }).length;
  if (maxCount === 0) return 0;
  return Math.min(count / maxCount, 1);
}

function getHeatColor(score: number): string {
  if (score === 0) return 'rgba(100,116,139,0.3)';
  if (score < 0.3) return 'rgba(59,130,246,0.6)';
  if (score < 0.6) return 'rgba(245,158,11,0.7)';
  return 'rgba(239,68,68,0.85)';
}

function getHeatLabel(score: number): string {
  if (score === 0) return 'No contact';
  if (score < 0.3) return 'Low';
  if (score < 0.6) return 'Moderate';
  if (score < 0.85) return 'Active';
  return 'Hot';
}

// ── Collision resolution ──────────────────────────────────────────────────────
/**
 * Iterative force-based collision resolution.
 * When draggingId is provided, that card is pinned at (rawX, rawY) and all others
 * are pushed away. When draggingId is null (initial layout pass), all cards are
 * pushed symmetrically.
 */
function resolveCollisions(
  positions: NodePosition[],
  draggingId: string | null,
  rawX: number,
  rawY: number,
  maxX: number,
  cardH: number = NODE_H,
  cardW: number = NODE_W,
  gap: number = CARD_GAP,
): NodePosition[] {
  // Pin the dragged card; copy all others
  let result = positions.map(p =>
    p.id === draggingId ? { ...p, x: rawX, y: rawY } : { ...p }
  );

  // Separation needed to have no overlap
  const needSepX = cardW + gap;
  const needSepY = cardH + gap;

  // Run up to 40 full sweeps — each sweep resolves every overlapping pair once.
  // After each individual push we immediately re-read the updated positions so
  // downstream pairs see the corrected coordinates.
  const MAX_PASSES = 40;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let anyOverlap = false;
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        if (dx >= needSepX || dy >= needSepY) continue; // no overlap

        anyOverlap = true;
        const aFixed = a.id === draggingId;
        const bFixed = b.id === draggingId;

        const overlapX = needSepX - dx; // how much to push in X
        const overlapY = needSepY - dy; // how much to push in Y

        // Always push along the axis with LESS required separation
        // (i.e. the axis where cards are closest to being separated)
        if (overlapX <= overlapY) {
          // Push horizontally — a is to the left of b (or equal → push b right)
          const dirA = a.x <= b.x ? -1 : 1; // direction to push a
          if (aFixed && bFixed) continue;
          if (aFixed) {
            result[j] = { ...b, x: Math.max(0, Math.min(b.x - dirA * overlapX, maxX)) };
          } else if (bFixed) {
            result[i] = { ...a, x: Math.max(0, Math.min(a.x + dirA * overlapX, maxX)) };
          } else {
            const half = overlapX / 2;
            result[i] = { ...a, x: Math.max(0, Math.min(a.x + dirA * half, maxX)) };
            result[j] = { ...b, x: Math.max(0, Math.min(b.x - dirA * half, maxX)) };
          }
        } else {
          // Push vertically
          const dirA = a.y <= b.y ? -1 : 1;
          if (aFixed && bFixed) continue;
          if (aFixed) {
            result[j] = { ...b, y: Math.max(0, b.y - dirA * overlapY) };
          } else if (bFixed) {
            result[i] = { ...a, y: Math.max(0, a.y + dirA * overlapY) };
          } else {
            const half = overlapY / 2;
            result[i] = { ...a, y: Math.max(0, a.y + dirA * half) };
            result[j] = { ...b, y: Math.max(0, b.y - dirA * half) };
          }
        }
      }
    }
    if (!anyOverlap) break;
  }

  return result;
}

// ── Ring assignment ──────────────────────────────────────────────────────────
// Inner ring (0): Decision Makers, Champions
// Middle ring (1): Influencers, Evaluators, Users
// Outer ring (2): Blockers, unknown roles
function getRing(role: string): number {
  const r = role.toLowerCase();
  if (r.includes('decision') || r.includes('champion') || r.includes('economic')) return 0;
  if (r.includes('influencer') || r.includes('evaluator') || r.includes('user')) return 1;
  if (r.includes('blocker')) return 2;
  return 1; // default to middle
}

const RING_LABELS = ['Decision Makers', 'Influencers', 'Blockers'];
const RING_COLORS = [
  'rgba(99,130,255,0.12)',  // inner — blue tint
  'rgba(16,185,129,0.08)',  // middle — green tint
  'rgba(239,68,68,0.06)',   // outer — red tint
];

// ── Auto-layout ─────────────────────────────────────────────────────────────────────────

// Ring geometry — shared between card layout and SVG background rendering
interface RingGeometry {
  cx: number;   // center x (pixels)
  cy: number;   // center y (pixels)
  radii: number[];  // scaled radius for each ring [inner, middle, outer]
}

function computeRingGeometry(
  stakeholders: Stakeholder[],
  containerW: number,
  nodeWOverride?: number,
  nodeHOverride?: number,
): RingGeometry {
  const nodeW = nodeWOverride ?? NODE_W;
  const nodeH = nodeHOverride ?? NODE_H;
  const gap = CARD_GAP;

  const rings: Stakeholder[][] = [[], [], []];
  stakeholders.forEach(s => {
    const ring = getRing(s.role);
    rings[ring].push(s);
  });

  const minCardSpacing = nodeW + gap;
  function minRadiusForCount(n: number): number {
    if (n <= 1) return 0;
    return (n * minCardSpacing) / (2 * Math.PI);
  }

  const BASE_INNER = 200;
  const RING_GAP = 140;

  const ringRadii: number[] = [];
  let prevOuter = 0;
  for (let i = 0; i < 3; i++) {
    const n = rings[i].length;
    if (n === 0) {
      ringRadii.push(prevOuter + RING_GAP);
      prevOuter = ringRadii[i];
      continue;
    }
    const minR = minRadiusForCount(n);
    const r = Math.max(i === 0 ? BASE_INNER : prevOuter + RING_GAP, minR);
    ringRadii.push(r);
    prevOuter = r;
  }

  const maxRadius = Math.max(...ringRadii.filter((_, i) => rings[i].length > 0));
  const cx = containerW / 2;
  const SIDE_MARGIN = 40;
  const availableRadius = cx - nodeW / 2 - SIDE_MARGIN;
  const scaleFactor = maxRadius > availableRadius ? availableRadius / maxRadius : 1;
  const scaledRadii = ringRadii.map(r => r * scaleFactor);
  const scaledMaxRadius = maxRadius * scaleFactor;
  const TOP_MARGIN = 80;
  const cy = scaledMaxRadius + nodeH / 2 + TOP_MARGIN;

  return { cx, cy, radii: scaledRadii };
}

function computeConcentricPositions(
  stakeholders: Stakeholder[],
  containerW: number,
  nodeWOverride?: number,
  nodeHOverride?: number,
): NodePosition[] {
  const nodeW = nodeWOverride ?? NODE_W;
  const nodeH = nodeHOverride ?? NODE_H;

  if (stakeholders.length === 0) return [];

  const rings: Stakeholder[][] = [[], [], []];
  stakeholders.forEach(s => {
    const ring = getRing(s.role);
    rings[ring].push(s);
  });

  // Use shared geometry function
  const { cx, cy, radii: scaledRadii } = computeRingGeometry(stakeholders, containerW, nodeW, nodeH);

  const raw: NodePosition[] = [];

  rings.forEach((ringStakeholders, ringIdx) => {
    if (ringStakeholders.length === 0) return;
    const radius = scaledRadii[ringIdx];
    const n = ringStakeholders.length;
    const angleStep = (2 * Math.PI) / n;

    // Rotate start angle per ring to spread cards better:
    // Ring 0 (inner): start at top (-π/2)
    // Ring 1 (middle): offset by half step to interleave with inner ring
    // Ring 2 (outer): offset by quarter step
    const ringOffsets = [-Math.PI / 2, -Math.PI / 2 + angleStep / 2, -Math.PI / 2 + angleStep / 3];
    const startAngle = ringOffsets[ringIdx] ?? -Math.PI / 2;

    ringStakeholders.forEach((s, i) => {
      const angle = startAngle + i * angleStep;
      raw.push({
        id: String(s.id),
        x: cx + radius * Math.cos(angle) - nodeW / 2,
        y: cy + radius * Math.sin(angle) - nodeH / 2,
      });
    });
  });

  // Clamp to visible area (no negative y, no overflow right)
  const maxX = containerW - nodeW;
  const clamped = raw.map(p => ({
    ...p,
    x: Math.max(0, Math.min(p.x, maxX)),
    y: Math.max(0, p.y),
  }));

  return resolveCollisions(clamped, null, 0, 0, maxX, nodeH);
}

// Map stakeholder roles to approximate buying journey stages
function inferStageForRole(role: string, stages: string[]): number {
  const r = role.toLowerCase();
  const n = stages.length;
  // Champions and Users are typically engaged early
  if (r.includes('champion') || r.includes('user')) return Math.min(1, n - 1);
  // Evaluators are mid-process
  if (r.includes('evaluator') || r.includes('influencer')) return Math.min(Math.floor(n * 0.4), n - 1);
  // Decision Makers engage later
  if (r.includes('decision')) return Math.min(Math.floor(n * 0.6), n - 1);
  // Blockers can appear at any stage, place mid-late
  if (r.includes('blocker')) return Math.min(Math.floor(n * 0.5), n - 1);
  return 0;
}

function computeStagePositions(
  stakeholders: Stakeholder[],
  stages: string[],
  containerW: number,
  nodeWOverride?: number,
  nodeHOverride?: number,
): NodePosition[] {
  const nodeW = nodeWOverride ?? NODE_W;
  const nodeH = nodeHOverride ?? NODE_H;
  const gap = CARD_GAP;

  if (stakeholders.length === 0 || stages.length === 0) return [];

  const colWidth = containerW / stages.length;
  const raw: NodePosition[] = [];

  // Group stakeholders by stage column
  const columnBuckets: Stakeholder[][] = stages.map(() => []);
  stakeholders.forEach(s => {
    // First try exact stage match
    const exactIdx = stages.findIndex(st => st === s.stage);
    if (exactIdx >= 0) {
      columnBuckets[exactIdx].push(s);
    } else {
      // Infer stage from role
      const inferredIdx = inferStageForRole(
        (s.roles && s.roles.length > 0 ? s.roles[0] : s.role) || 'User',
        stages
      );
      columnBuckets[inferredIdx].push(s);
    }
  });

  columnBuckets.forEach((bucket, colIdx) => {
    const colCenterX = colIdx * colWidth + colWidth / 2 - nodeW / 2;
    bucket.forEach((s, rowIdx) => {
      raw.push({
        id: String(s.id),
        x: colCenterX,
        y: 80 + rowIdx * (nodeH + gap),
      });
    });
  });

  const maxX = containerW - nodeW;
  return resolveCollisions(raw, null, 0, 0, maxX, nodeH);
}

function computeInitialPositions(
  stakeholders: Stakeholder[],
  stages: string[],
  containerW: number,
  layout: ViewLayout = 'concentric',
  nodeWOverride?: number,
  nodeHOverride?: number,
): NodePosition[] {
  if (layout === 'stages' && stages.length > 0) {
    return computeStagePositions(stakeholders, stages, containerW, nodeWOverride, nodeHOverride);
  }
  return computeConcentricPositions(stakeholders, containerW, nodeWOverride, nodeHOverride);
}

// ── Sentiment helpers ─────────────────────────────────────────────────────────
const sentimentDot = (s: string) =>
  s === 'Positive' ? '#10b981' : s === 'Neutral' ? '#f59e0b' : '#ef4444';

const sentimentLabel = (s: string) =>
  s === 'Positive' ? 'text-emerald-400' : s === 'Neutral' ? 'text-amber-400' : 'text-red-400';

// ── Component ─────────────────────────────────────────────────────────────────
// Mobile-compact node dimensions
const NODE_W_MOBILE = 72;
const NODE_H_MOBILE = 82;

export default function StakeholderMap({ deal, onStakeholderClick, onStakeholdersChange, onBuyingStagesChange, highlightedStakeholderId, initialZoom, isMobile = false }: StakeholderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(800);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [heatWindow, setHeatWindow] = useState<HeatWindow>('L14D');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('concentric');
  // ── Per-deal state ────────────────────────────────────────────────────────
  const [currentDealId, setCurrentDealId] = useState(deal.id);
  // Independent position caches for each layout
  const circlePositionsRef = useRef<NodePosition[]>([]);
  const stagePositionsRef = useRef<NodePosition[]>([]);
  // Editing stage title inline
  const [editingStageIdx, setEditingStageIdx] = useState<number | null>(null);
  const [editingStageName, setEditingStageName] = useState('');
  const [localStakeholders, setLocalStakeholders] = useState<Stakeholder[]>([]);
  const [positions, setPositions] = useState<NodePosition[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  // Local meetings — editable copy of deal.meetings + user-added ones
  const [localInteractions, setLocalInteractions] = useState<Meeting[]>([]);

  // ── Hover tooltip state ───────────────────────────────────────────────────
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // ── Hovered card ID (for hover-expand card design) ────────────────────────
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  // ── Hovered connection (for hover-only labels) ────────────────────────────
  const [hoveredConnId, setHoveredConnId] = useState<string | null>(null);
  // ── Hovered ring index (for legend highlight) ────────────────────────────
  const [hoveredRingIdx, setHoveredRingIdx] = useState<number | null>(null);
  // ── Newly added stakeholder ID (for auto-pan) ────────────────────────────
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  // ── Expanded interaction history on cards ─────────────────────────────────
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  // Editing a specific interaction entry: { interactionId, field }
  const [editingInteraction, setEditingInteraction] = useState<string | null>(null);

  // ── Add Interaction Modal (contextual, opens from card hover) ────────────
  const [addModalStakeholder, setAddModalStakeholder] = useState<Stakeholder | null>(null);

  // ── Click modal state ─────────────────────────────────────────────────────
  const [modalStakeholder, setModalStakeholder] = useState<Stakeholder | null>(null);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editSentiment, setEditSentiment] = useState<'Positive' | 'Neutral' | 'Negative'>('Neutral');
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load or initialise state when deal changes
  useEffect(() => {
    setCurrentDealId(deal.id);
    setMode('view');
    setConnectingFrom(null);
    setSelectedConnId(null);
    setSelectedNodeId(null);
    setHoveredId(null);
    setModalStakeholder(null);
    setExpandedCardId(null);
    setEditingInteraction(null);

    const stks = deal.stakeholders;
    setLocalStakeholders(stks);

    const actualW = containerRef.current?.getBoundingClientRect().width || containerW || 900;
    const effectiveNodeW = isMobile ? NODE_W_MOBILE : NODE_W;
    const effectiveNodeH = isMobile ? NODE_H_MOBILE : NODE_H;
    const maxX = actualW - effectiveNodeW;
    const saved = loadState(deal.id);

    if (saved && saved.positions.length > 0) {
      const validIds = new Set(stks.map(s => String(s.id)));
      // Restore per-layout position caches
      if (saved.circlePositions && saved.circlePositions.length > 0) {
        circlePositionsRef.current = saved.circlePositions.filter(p => validIds.has(String(p.id)));
      }
      if (saved.stagePositions && saved.stagePositions.length > 0) {
        stagePositionsRef.current = saved.stagePositions.filter(p => validIds.has(String(p.id)));
      }
      const validPositions = saved.positions.filter(p => validIds.has(String(p.id)));
      if (validPositions.length === stks.length) {
        // Run collision pass on loaded positions too
        setPositions(resolveCollisions(validPositions, null, 0, 0, maxX));
        setConnections(saved.connections ?? []);
        setLocalInteractions(saved.localInteractions?.length
          ? saved.localInteractions
          : [...(deal.meetings ?? [])]);
        return;
      }
    }
    // Fresh start — compute initial positions for current layout
    const freshPositions = computeInitialPositions(stks, deal.buyingStages ?? [], actualW, viewLayout, effectiveNodeW, effectiveNodeH);
    setPositions(freshPositions);
    if (viewLayout === 'concentric') circlePositionsRef.current = freshPositions;
    else stagePositionsRef.current = freshPositions;
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setConnections(buildDefaultConnections(stks, deal.buyingStages ?? []));
    setLocalInteractions([...(deal.meetings ?? [])]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal.id]);

  // Observe container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => setContainerW(entries[0].contentRect.width));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Auto-pan to newly added stakeholder ────────────────────────────
  useEffect(() => {
    if (!newlyAddedId) return;
    const pos = positions.find(p => p.id === newlyAddedId);
    if (!pos) return;
    // Get viewport dimensions from the container element
    const containerEl = containerRef.current;
    const viewportW = containerEl?.clientWidth ?? containerW;
    const viewportH = containerEl?.clientHeight ?? 500;
    const nodeW = NODE_W;
    const nodeH = NODE_H;
    // Center the new card in the viewport
    const targetPanX = viewportW / 2 - (pos.x + nodeW / 2) * zoom;
    const targetPanY = viewportH / 2 - (pos.y + nodeH / 2) * zoom;
    setPanOffset({ x: targetPanX, y: targetPanY });
    setNewlyAddedId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newlyAddedId, positions]);

  // ── Heat scores ───────────────────────────────────────────────────────────
  const maxTouchpoints = Math.max(
    ...localStakeholders.map(s => {
      const days = heatWindow === 'L7D' ? 7 : heatWindow === 'L14D' ? 14 : 30;
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
      return localInteractions.filter(i => {
        const d = new Date(i.date);
        return d >= cutoff && i.keyParticipant.toLowerCase().includes(s.name.split(' ')[0].toLowerCase());
      }).length;
    }),
    1
  );

  const getHeat = (s: Stakeholder) => computeHeatScore(s.name, localInteractions, heatWindow, maxTouchpoints);

  const getTouchpointCount = (s: Stakeholder) => {
    const days = heatWindow === 'L7D' ? 7 : heatWindow === 'L14D' ? 14 : 30;
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    return localInteractions.filter(i => {
      const d = new Date(i.date);
      return d >= cutoff && i.keyParticipant.toLowerCase().includes(s.name.split(' ')[0].toLowerCase());
    }).length;
  };

  const getStakeholderInteractions = (s: Stakeholder) =>
    localInteractions
      .filter(i => i.keyParticipant.toLowerCase().includes(s.name.split(' ')[0].toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ── Drag state ────────────────────────────────────────────────────────────
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, nx: 0, ny: 0 });
  const [dragMoved, setDragMoved] = useState(false);
  const [zoom, setZoom] = useState(initialZoom ?? 1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // ── Pan state ─────────────────────────────────────────────────────────────
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  // ── Connection drawing state ──────────────────────────────────────────────
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [pendingConnType, setPendingConnType] = useState<ConnectionType>('reports_to');
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);
  const [connEditPopup, setConnEditPopup] = useState<{ connId: string; x: number; y: number } | null>(null);
  const [reroutingConn, setReroutingConn] = useState<{ connId: string; end: 'from' | 'to' } | null>(null);

  const getPos = useCallback((id: string) => positions.find(p => p.id === id), [positions]);

  // ── Version history state ────────────────────────────────────────────────
  const [mapHistory, setMapHistory] = useState<MapVersion[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history when deal changes
  useEffect(() => {
    setMapHistory(loadHistory(deal.id));
    setShowHistory(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal.id]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    // Update the current layout's cache before saving
    if (viewLayout === 'concentric') circlePositionsRef.current = positions;
    else stagePositionsRef.current = positions;
    const state: PersistedMapState = {
      positions,
      circlePositions: circlePositionsRef.current,
      stagePositions: stagePositionsRef.current,
      connections,
      localInteractions,
    };
    saveState(currentDealId, state);
    // Push to history
    const version: MapVersion = {
      id: nanoid(6),
      label: `Version ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      savedAt: new Date().toISOString(),
      state,
    };
    const updated = [version, ...mapHistory];
    setMapHistory(updated);
    saveHistory(currentDealId, updated);
    toast.success('Map saved — version snapshot created');
  };

  const handleRestoreVersion = (version: MapVersion) => {
    const { positions: p, connections: c, localInteractions: li } = version.state;
    const nodeW = NODE_W;
    const nodeH = NODE_H;
    const cardGap = CARD_GAP;
    const maxX = containerW - nodeW;
    setPositions(resolveCollisions(p, null, 0, 0, maxX, nodeH, nodeW, cardGap));
    setConnections(c);
    setLocalInteractions(li);
    setShowHistory(false);
    toast.success(`Restored: ${version.label}`);
  };

  const handleReset = () => {
    // Clear localStorage cache so positions are fully recalculated from scratch
    try {
      localStorage.removeItem(storageKey(deal.id));
      localStorage.removeItem(historyKey(deal.id));
    } catch {}
    // Also clear the in-memory layout caches
    circlePositionsRef.current = [];
    stagePositionsRef.current = [];
    const freshPositions = computeInitialPositions(localStakeholders, Array.isArray(deal.buyingStages) ? deal.buyingStages : [], containerW, viewLayout);
    setPositions(freshPositions);
    setConnections(buildDefaultConnections(localStakeholders, Array.isArray(deal.buyingStages) ? deal.buyingStages : []));
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    toast.success('Layout reset to default');
  };

  // Switch between concentric and stage layouts
  const handleLayoutSwitch = (newLayout: ViewLayout) => {
    if (newLayout === viewLayout) return;
    // Save current layout's positions before switching
    if (viewLayout === 'concentric') circlePositionsRef.current = positions;
    else stagePositionsRef.current = positions;

    setViewLayout(newLayout);
    const actualW = containerRef.current?.getBoundingClientRect().width || containerW;
    const stages = Array.isArray(deal.buyingStages) ? deal.buyingStages : [];

    // Try to restore saved positions for the target layout
    const cached = newLayout === 'concentric' ? circlePositionsRef.current : stagePositionsRef.current;
    const validIds = new Set(localStakeholders.map(s => String(s.id)));
    const validCached = cached.filter(p => validIds.has(String(p.id)));

    const effNodeW = isMobile ? NODE_W_MOBILE : NODE_W;
    const effNodeH = isMobile ? NODE_H_MOBILE : NODE_H;
    if (validCached.length === localStakeholders.length) {
      const cardGap = CARD_GAP;
      const maxX = actualW - effNodeW;
      setPositions(resolveCollisions(validCached, null, 0, 0, maxX, effNodeH, effNodeW, cardGap));
    } else {
      // No cached positions — compute fresh layout
      const fresh = computeInitialPositions(localStakeholders, stages, actualW, newLayout, effNodeW, effNodeH);
      setPositions(fresh);
      if (newLayout === 'concentric') circlePositionsRef.current = fresh;
      else stagePositionsRef.current = fresh;
    }
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (mode !== 'edit') {
      // In view mode, show a hint after a short drag attempt
      const startX = e.clientX;
      const startY = e.clientY;
      const onMove = (mv: MouseEvent) => {
        if (Math.abs(mv.clientX - startX) > 8 || Math.abs(mv.clientY - startY) > 8) {
          toast('Switch to Edit mode to rearrange cards', { id: 'edit-hint', duration: 2500 });
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        }
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return;
    }
    if (connectingFrom) return;
    e.preventDefault(); e.stopPropagation();
    const pos = getPos(id);
    if (!pos) return;
    setDragging(id);
    setDragMoved(false);
    setDragStart({ mx: e.clientX, my: e.clientY, nx: pos.x, ny: pos.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const dx = (e.clientX - dragStart.mx) / zoom;
    const dy = (e.clientY - dragStart.my) / zoom;

    if (!dragMoved && (Math.abs(e.clientX - dragStart.mx) > 5 || Math.abs(e.clientY - dragStart.my) > 5)) {
      setDragMoved(true);
    }

    const rawX = dragStart.nx + dx;
    const rawY = dragStart.ny + dy;
    const nodeW = NODE_W;
    const nodeH = NODE_H;
    const cardGap = CARD_GAP;
    const maxX = (containerW / zoom) - nodeW;
    const clampedX = Math.max(0, Math.min(rawX, maxX));
    const clampedY = Math.max(0, rawY);

    setPositions(prev => resolveCollisions(prev, dragging, clampedX, clampedY, maxX, nodeH, nodeW, cardGap));
  }, [dragging, dragStart, zoom, containerW, dragMoved]);

  const handleMouseUp = useCallback(() => {
    // Note: if !dragMoved (i.e. it was a click, not a drag), the click event
    // will naturally fire on the node and be handled by handleNodeClick.
    // We do NOT call onStakeholderClick here to avoid double-firing.
    setDragging(null);
    setDragMoved(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, dragMoved, localStakeholders]);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  // ── Pan handlers ───────────────────────────────────────────────────────────
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan when clicking the canvas background (not a card or button)
    if ((e.target as HTMLElement).closest('.stakeholder-node, button, input, select, [role="dialog"]')) return;
    if (dragging || connectingFrom || reroutingConn) return;
    if (e.button !== 0) return;
    isPanningRef.current = true;
    panStartRef.current = { mx: e.clientX, my: e.clientY, ox: panOffset.x, oy: panOffset.y };
    e.preventDefault();
  }, [dragging, connectingFrom, reroutingConn, panOffset]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return;
      const dx = e.clientX - panStartRef.current.mx;
      const dy = e.clientY - panStartRef.current.my;
      setPanOffset({ x: panStartRef.current.ox + dx, y: panStartRef.current.oy + dy });
    };
    const onUp = () => { isPanningRef.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // ── Node click (view mode) ────────────────────────────────────────────────
  const handleNodeClick = (e: React.MouseEvent, stakeholder: Stakeholder) => {
    e.stopPropagation();
    setConnEditPopup(null);

    if (mode === 'edit' && connectingFrom) {
      const sid = String(stakeholder.id);
      if (connectingFrom === sid) { setConnectingFrom(null); return; }
      const exists = connections.find(
        c => (c.from === connectingFrom && c.to === sid) ||
             (c.from === sid && c.to === connectingFrom)
      );
      if (exists) {
        setConnections(prev => prev.filter(c => c.id !== exists.id));
        toast('Connection removed');
      } else {
        setConnections(prev => [...prev, { id: nanoid(8), from: connectingFrom, to: sid, type: pendingConnType }]);
        toast(`"${pendingConnType.replace('_', ' ')}" connection added`);
      }
      setConnectingFrom(null);
      return;
    }

    if (mode === 'view') {
      setHoveredId(null);
      setModalStakeholder(stakeholder);
      setIsEditingModal(false);
      setEditName(stakeholder.name);
      setEditTitle(stakeholder.title);
      setEditSentiment(stakeholder.sentiment);
      setEditRoles(stakeholder.roles ?? [stakeholder.role]);
      onStakeholderClick?.(stakeholder);
    }
  };

  // ── Modal save ────────────────────────────────────────────────────────────
  const handleModalSave = () => {
    if (!modalStakeholder) return;
    const updated: Stakeholder = {
      ...modalStakeholder,
      name: editName,
      title: editTitle,
      sentiment: editSentiment,
      role: (editRoles[0] as Stakeholder['role']) ?? modalStakeholder.role,
      roles: editRoles,
    };
    setLocalStakeholders(prev => prev.map(s => s.id === updated.id ? updated : s));
    setModalStakeholder(updated);
    setIsEditingModal(false);
    onStakeholdersChange?.(localStakeholders.map(s => s.id === updated.id ? updated : s));
    toast.success('Profile updated');
  };

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !modalStakeholder) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const updated = { ...modalStakeholder, avatar: dataUrl };
      setLocalStakeholders(prev => prev.map(s => s.id === updated.id ? updated : s));
      setModalStakeholder(updated);
    };
    reader.readAsDataURL(file);
  };

  // ── Interaction editing helpers ───────────────────────────────────────────
  const updateInteraction = (id: string, patch: Partial<Interaction>) => {
    setLocalInteractions(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const addInteraction = (stakeholderName: string) => {
    const newI: Interaction = {
      id: nanoid(8),
      dealId: deal.id,
      date: new Date().toISOString().slice(0, 10),
      type: 'Follow-up',
      keyParticipant: stakeholderName,
      summary: '',
      duration: 30,
    };
    setLocalInteractions(prev => [newI, ...prev]);
    setEditingInteraction(newI.id);
    toast('New interaction added — fill in the details');
  };

  const deleteInteraction = (id: string) => {
    setLocalInteractions(prev => prev.filter(i => i.id !== id));
    if (editingInteraction === id) setEditingInteraction(null);
  };

  // ── Connection handlers ───────────────────────────────────────────────────
  const handleConnClick = (e: React.MouseEvent, connId: string) => {
    if (mode !== 'edit') return;
    e.stopPropagation();
    setSelectedConnId(connId);
    setConnEditPopup({ connId, x: e.clientX, y: e.clientY });
  };

  const handleAddStakeholder = () => {
    const newS: Stakeholder = {
      id: `s-${nanoid(6)}`,
      name: 'New Contact',
      title: 'Title',
      role: 'Influencer',
      roles: ['Influencer'],
      sentiment: 'Neutral',
      engagement: 'Medium',
      avatar: AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)],
      stage: (Array.isArray(deal.buyingStages) ? deal.buyingStages[0] : undefined) ?? '',
    };
    const updated = [...localStakeholders, newS];
    setLocalStakeholders(updated);
    onStakeholdersChange?.(updated);
    setPositions(prev => [...prev, { id: newS.id, x: 20, y: 20 + prev.length * (NODE_H + 20) }]);
    setNewlyAddedId(String(newS.id));
    toast('New stakeholder added — click to edit their profile');
  };

  const handleRemoveStakeholder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalStakeholders(prev => { const u = prev.filter(s => s.id !== id); onStakeholdersChange?.(u); return u; });
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    setPositions(prev => prev.filter(p => p.id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    toast('Stakeholder removed');
  };

  const handleRerouteClick = (connId: string, end: 'from' | 'to') => {
    setConnEditPopup(null);
    setReroutingConn({ connId, end });
    toast(`Click a person to reconnect the ${end === 'from' ? 'source' : 'target'} of this link`);
  };

  const handleRerouteTarget = (e: React.MouseEvent, stakeholderId: string) => {
    if (!reroutingConn) return;
    e.stopPropagation();
    setConnections(prev => prev.map(c => {
      if (c.id !== reroutingConn.connId) return c;
      return reroutingConn.end === 'from' ? { ...c, from: stakeholderId } : { ...c, to: stakeholderId };
    }));
    setReroutingConn(null);
    toast('Connection re-routed');
  };

  const connConfig = (type: ConnectionType) => CONNECTION_TYPES.find(t => t.value === type) ?? CONNECTION_TYPES[0];
  const stageOrder = Array.isArray(deal.buyingStages) ? deal.buyingStages : [];
  const ALL_ROLES = ['Champion', 'Decision Maker', 'Influencer', 'Blocker', 'User', 'Evaluator'];

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      {/* Concentric circle ring labels — only shown in Circles mode */}
      {viewLayout === 'concentric' && (
        <div className="absolute top-2 left-3 z-10 flex items-center gap-3 text-[10px] bg-card/80 backdrop-blur-sm rounded-md px-3 py-2 border border-border/30">
          {RING_LABELS.map((label, i) => {
            const ringBaseColors = ['#6382ff', '#10b981', '#ef4444'];
            const isHovered = hoveredRingIdx === i;
            return (
              <div
                key={label}
                className="flex items-center gap-1.5 cursor-default transition-all duration-150"
                style={{ opacity: hoveredRingIdx !== null && !isHovered ? 0.35 : 1 }}
                onMouseEnter={() => setHoveredRingIdx(i)}
                onMouseLeave={() => setHoveredRingIdx(null)}
              >
                <div
                  className="w-3 h-3 rounded-full border-2 transition-all duration-150"
                  style={{
                    borderColor: ringBaseColors[i],
                    backgroundColor: isHovered ? ringBaseColors[i] : RING_COLORS[i],
                    boxShadow: isHovered ? `0 0 6px ${ringBaseColors[i]}80` : 'none',
                  }}
                />
                <span
                  className="font-medium transition-colors duration-150"
                  style={{ color: isHovered ? ringBaseColors[i] : undefined }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Top-right controls */}
      <div className="absolute top-14 right-3 z-20 flex flex-col gap-1.5">
        <div className="flex rounded-lg overflow-hidden border border-border/50 bg-muted/80 mb-1">
          {(['L7D', 'L14D', 'L30D'] as HeatWindow[]).map(w => (
            <button key={w} onClick={() => setHeatWindow(w)}
              className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium transition-colors ${
                heatWindow === w ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {w === heatWindow && <Flame className="w-2.5 h-2.5 text-orange-400" />}
              {w}
            </button>
          ))}
        </div>

        {/* Layout switch: Concentric vs Stages */}
        <div className="flex rounded-lg overflow-hidden border border-border/50 bg-muted/80">
          <button
            onClick={() => handleLayoutSwitch('concentric')}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
              viewLayout === 'concentric' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Concentric circle layout"
          >
            <Layers className="w-3 h-3" /> Circles
          </button>
          <button
            onClick={() => handleLayoutSwitch('stages')}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
              viewLayout === 'stages' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Stage-based column layout"
          >
            <LayoutGrid className="w-3 h-3" /> Stages
          </button>
        </div>

        {/* View / Edit mode */}
        <div className="flex rounded-lg overflow-hidden border border-border/50 bg-muted/80">
          <button
            onClick={() => { setMode('view'); setConnectingFrom(null); setConnEditPopup(null); setReroutingConn(null); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
              mode === 'view' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="w-3 h-3" /> View
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
              mode === 'edit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        </div>

        {/* Zoom controls + Reset */}
        <div className="flex gap-1">
          <button onClick={() => setZoom(z => Math.min(z + 0.15, 1.8))}
            className="w-7 h-7 rounded bg-muted/80 border border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(z => Math.max(z - 0.15, 0.4))}
            className="w-7 h-7 rounded bg-muted/80 border border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleReset}
            className="w-7 h-7 rounded bg-muted/80 border border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
            title="Reset layout & zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Edit mode toolbar */}
      <AnimatePresence>
        {mode === 'edit' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-12 right-3 z-20 flex flex-col gap-1.5"
          >
            <button onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-medium hover:bg-emerald-700 transition-colors shadow-md"
            >
              <Save className="w-3 h-3" /> Save Map
            </button>
            <button
              onClick={() => setShowHistory(h => !h)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors shadow-md ${
                showHistory ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border/50 hover:bg-muted/80'
              }`}
            >
              <Clock className="w-3 h-3" /> History {mapHistory.length > 0 && `(${mapHistory.length})`}
            </button>
            <button onClick={handleAddStakeholder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors shadow-md"
            >
              <Plus className="w-3 h-3" /> Add Person
            </button>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  if (connectingFrom) { setConnectingFrom(null); toast('Connection mode cancelled'); }
                  else { setConnectingFrom('__pending__'); toast('Select connection type, then click two people'); }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors shadow-md ${
                  connectingFrom ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-muted border border-border/50 hover:bg-muted/80'
                }`}
              >
                {connectingFrom ? <Link2Off className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                {connectingFrom ? 'Cancel Link' : 'Draw Link'}
              </button>
              <AnimatePresence>
                {connectingFrom && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-0.5 overflow-hidden"
                  >
                    {CONNECTION_TYPES.map(ct => (
                      <button key={ct.value} onClick={() => setPendingConnType(ct.value)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] transition-colors ${
                          pendingConnType === ct.value ? 'bg-card border border-primary/50 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <div className="w-4 h-px" style={{ background: ct.color }} />
                        {ct.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint banners */}
      <AnimatePresence>
        {(connectingFrom && connectingFrom !== '__pending__') && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-[58px] left-1/2 -translate-x-1/2 z-30 bg-amber-500/90 text-white text-[10px] px-3 py-1 rounded-full shadow-md"
          >
            Click another person to link — or click same person to cancel
          </motion.div>
        )}
        {reroutingConn && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-[58px] left-1/2 -translate-x-1/2 z-30 bg-blue-500/90 text-white text-[10px] px-3 py-1 rounded-full shadow-md"
          >
            Click a person to re-route the {reroutingConn.end === 'from' ? 'source' : 'target'} end
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection edit popup */}
      <AnimatePresence>
        {connEditPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
            className="fixed z-50 bg-card border border-border/60 rounded-xl shadow-2xl p-3 w-52"
            style={{ left: Math.min(connEditPopup.x, window.innerWidth - 220), top: Math.min(connEditPopup.y, window.innerHeight - 260) }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-display font-semibold">Edit Connection</span>
              <button onClick={() => setConnEditPopup(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
            </div>
            <div className="mb-3">
              <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Relationship Type</div>
              {CONNECTION_TYPES.map(ct => {
                const conn = connections.find(c => c.id === connEditPopup.connId);
                const isActive = conn?.type === ct.value;
                return (
                  <button key={ct.value}
                    onClick={() => setConnections(prev => prev.map(c => c.id === connEditPopup.connId ? { ...c, type: ct.value } : c))}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] transition-colors w-full ${
                      isActive ? 'bg-primary/10 text-primary border border-primary/30' : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <div className="w-5 h-px shrink-0" style={{ background: ct.color }} />
                    {ct.label}
                  </button>
                );
              })}
            </div>
            <div className="mb-3">
              <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Re-route Endpoint</div>
              <div className="flex gap-1.5">
                <button onClick={() => handleRerouteClick(connEditPopup.connId, 'from')}
                  className="flex-1 text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                >Change Source</button>
                <button onClick={() => handleRerouteClick(connEditPopup.connId, 'to')}
                  className="flex-1 text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                >Change Target</button>
              </div>
            </div>
            <button
              onClick={() => { setConnections(prev => prev.filter(c => c.id !== connEditPopup.connId)); setConnEditPopup(null); toast('Connection deleted'); }}
              className="w-full text-[10px] px-2 py-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >Delete Connection</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Version History Panel */}
      <AnimatePresence>
        {showHistory && mode === 'edit' && (
          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
            className="absolute bottom-12 right-36 z-30 w-64 bg-card border border-border/60 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-display font-semibold">Version History</span>
              </div>
              <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {mapHistory.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-[10px] text-muted-foreground/60">No saved versions yet</p>
                  <p className="text-[9px] text-muted-foreground/40 mt-0.5">Click "Save Map" to create a snapshot</p>
                </div>
              ) : (
                mapHistory.map((v, idx) => (
                  <div key={v.id} className="flex items-center justify-between px-3 py-2 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="text-[10px] font-medium truncate">{v.label}</div>
                      {idx === 0 && (
                        <span className="text-[8px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium">Latest</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRestoreVersion(v)}
                      className="shrink-0 text-[9px] px-2 py-1 rounded bg-muted hover:bg-primary/20 hover:text-primary transition-colors font-medium"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div
        className="absolute inset-0 top-0 overflow-hidden"
        style={{
          cursor: dragging ? 'grabbing'
            : isPanningRef.current ? 'grabbing'
            : (connectingFrom || reroutingConn) ? 'crosshair'
            : 'grab'
        }}
        onClick={() => { setConnEditPopup(null); setHoveredId(null); }}
        onMouseDown={handleCanvasMouseDown}
      >
        {/* Background dot grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.1 }}>
          <defs>
            <pattern id="dotgrid-unified" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.8" fill="hsl(var(--primary))" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotgrid-unified)" />
        </svg>

        <div style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, transformOrigin: 'top left', width: '100%', minHeight: '100%', position: 'relative' }}>
          {/* Layout background: Concentric rings OR Stage columns */}
          {viewLayout === 'concentric' ? (() => {
            const nodeW = NODE_W;
            const { cx, cy, radii } = computeRingGeometry(localStakeholders, containerW);
            const ringBaseColors = ['#6382ff', '#10b981', '#ef4444'];
            return (
              <svg className="absolute inset-0 w-full pointer-events-none" style={{ height: '100%', overflow: 'visible' }}>
                <defs>
                  {ringBaseColors.map((color, idx) => (
                    <radialGradient key={idx} id={`ring-glow-${idx}`} cx="50%" cy="50%" r="50%">
                      <stop offset="70%" stopColor={color} stopOpacity="0" />
                      <stop offset="100%" stopColor={color} stopOpacity="0.25" />
                    </radialGradient>
                  ))}
                </defs>
                {[...radii].reverse().map((r, revIdx) => {
                  const idx = radii.length - 1 - revIdx;
                  const isRingHovered = hoveredRingIdx === idx;
                  const isOtherHovered = hoveredRingIdx !== null && hoveredRingIdx !== idx;
                  const ringR = r + nodeW / 2 + 30;
                  return (
                    <g key={idx} style={{ transition: 'opacity 0.2s' }} opacity={isOtherHovered ? 0.3 : 1}>
                      {/* Base fill */}
                      <circle cx={cx} cy={cy} r={ringR}
                        fill={RING_COLORS[idx]}
                        stroke={isRingHovered
                          ? ringBaseColors[idx]
                          : RING_COLORS[idx].replace(/[\d.]+\)$/, '0.3)')}
                        strokeWidth={isRingHovered ? 1.5 : 1}
                        strokeDasharray="6 4"
                        style={{ transition: 'stroke 0.2s, stroke-width 0.2s, fill 0.2s' }}
                      />
                      {/* Glow ring on hover */}
                      {isRingHovered && (
                        <circle cx={cx} cy={cy} r={ringR}
                          fill="none"
                          stroke={ringBaseColors[idx]}
                          strokeWidth="12"
                          strokeOpacity="0.15"
                          style={{ filter: `blur(4px)` }}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            );
          })() : (
            /* Stage column lanes — colored vertical rectangles with editable titles */
            <div className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
              <div className="flex w-full h-full">
                {stageOrder.map((stage, i) => {
                  const laneColors = [
                    { bg: 'rgba(99,130,255,0.06)', border: 'rgba(99,130,255,0.18)', header: 'rgba(99,130,255,0.14)', text: '#6382ff' },
                    { bg: 'rgba(16,185,129,0.05)', border: 'rgba(16,185,129,0.16)', header: 'rgba(16,185,129,0.12)', text: '#10b981' },
                    { bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.16)', header: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
                    { bg: 'rgba(239,68,68,0.04)',  border: 'rgba(239,68,68,0.14)',  header: 'rgba(239,68,68,0.10)',  text: '#ef4444' },
                    { bg: 'rgba(168,85,247,0.05)', border: 'rgba(168,85,247,0.16)', header: 'rgba(168,85,247,0.12)', text: '#a855f7' },
                  ];
                  const lc = laneColors[i % laneColors.length];
                  const isEditingThis = editingStageIdx === i;
                  return (
                    <div
                      key={stage}
                      className="flex-1 relative flex flex-col"
                      style={{
                        backgroundColor: lc.bg,
                        borderRight: i < stageOrder.length - 1 ? `1px solid ${lc.border}` : 'none',
                        pointerEvents: 'none',
                      }}
                    >
                      {/* Lane header */}
                      <div
                        className="flex flex-col items-center justify-center py-3 px-2"
                        style={{ backgroundColor: lc.header, borderBottom: `1px solid ${lc.border}`, pointerEvents: 'auto', minHeight: 56 }}
                      >
                        <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: lc.text, opacity: 0.7 }}>
                          Stage {i + 1}
                        </div>
                        {isEditingThis ? (
                          <input
                            autoFocus
                            value={editingStageName}
                            onChange={e => setEditingStageName(e.target.value)}
                            onBlur={() => {
                              if (editingStageName.trim() && editingStageName !== stage) {
                                const newStages = [...stageOrder];
                                newStages[i] = editingStageName.trim();
                                onBuyingStagesChange?.(newStages);
                              }
                              setEditingStageIdx(null);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                if (editingStageName.trim() && editingStageName !== stage) {
                                  const newStages = [...stageOrder];
                                  newStages[i] = editingStageName.trim();
                                  onBuyingStagesChange?.(newStages);
                                }
                                setEditingStageIdx(null);
                              } else if (e.key === 'Escape') {
                                setEditingStageIdx(null);
                              }
                            }}
                            className="text-[11px] font-semibold text-center bg-transparent border-b outline-none w-full max-w-[120px]"
                            style={{ color: lc.text, borderColor: lc.text }}
                          />
                        ) : (
                          <div
                            className="text-[11px] font-semibold text-center cursor-text hover:opacity-80 transition-opacity px-1 rounded"
                            style={{ color: lc.text }}
                            title="Click to rename stage"
                            onClick={() => {
                              setEditingStageIdx(i);
                              setEditingStageName(stage);
                            }}
                          >
                            {stage}
                          </div>
                        )}
                      </div>
                      {/* Lane body */}
                      <div className="flex-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* SVG connections — rendered BEFORE cards so lines stay BEHIND cards (z-10 < z-20) */}
          {(() => {
            const svgPE: React.CSSProperties['pointerEvents'] = mode === 'edit' ? 'all' : 'none';
            const connNodeW = isMobile ? NODE_W_MOBILE : NODE_W;
            const connNodeH = isMobile ? NODE_H_MOBILE : NODE_H;

            // Compute the point on the edge of a card rectangle that is closest to a target point
            const getEdgePoint = (cardX: number, cardY: number, targetX: number, targetY: number) => {
              const cx = cardX + connNodeW / 2;
              const cy = cardY + connNodeH / 2;
              const dx = targetX - cx;
              const dy = targetY - cy;
              if (dx === 0 && dy === 0) return { x: cx, y: cy };
              const halfW = connNodeW / 2 + 6; // +6px gap from card edge
              const halfH = connNodeH / 2 + 6;
              const scaleX = halfW / Math.abs(dx);
              const scaleY = halfH / Math.abs(dy);
              const scale = Math.min(scaleX, scaleY);
              return { x: cx + dx * scale, y: cy + dy * scale };
            };

            return (
              <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible', pointerEvents: svgPE, zIndex: 10 }}>
                <defs>
                  {CONNECTION_TYPES.map(ct => (
                    <marker
                      key={ct.value}
                      id={`arrow-${ct.value}`}
                      markerWidth="12" markerHeight="10"
                      refX="10" refY="5"
                      orient="auto"
                    >
                      <polygon points="0 1, 11 5, 0 9" fill={ct.color} opacity="0.9" />
                    </marker>
                  ))}
                  {/* Glow filters for hovered connections */}
                  {CONNECTION_TYPES.map(ct => (
                    <filter key={`glow-${ct.value}`} id={`glow-${ct.value}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 12 -4" result="glow" />
                      <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  ))}
                </defs>
                {connections.map(conn => {
                  const fromPos = getPos(conn.from);
                  const toPos = getPos(conn.to);
                  if (!fromPos || !toPos) return null;

                  // Card centers
                  const fcx = fromPos.x + connNodeW / 2;
                  const fcy = fromPos.y + connNodeH / 2;
                  const tcx = toPos.x + connNodeW / 2;
                  const tcy = toPos.y + connNodeH / 2;

                  // Edge-to-edge: start from edge of source card toward target center,
                  // end at edge of target card toward source center
                  const from = getEdgePoint(fromPos.x, fromPos.y, tcx, tcy);
                  const to   = getEdgePoint(toPos.x,   toPos.y,   fcx, fcy);

                  // Cubic bezier control points — arc that bows perpendicular to the line
                  const lineDx = to.x - from.x;
                  const lineDy = to.y - from.y;
                  const lineLen = Math.sqrt(lineDx * lineDx + lineDy * lineDy) || 1;
                  // Perpendicular unit vector (rotated 90° clockwise)
                  const perpX = lineDy / lineLen;
                  const perpY = -lineDx / lineLen;
                  // Adaptive bow: larger for short connections so arc is always visible
                  // Short (<120px): large bow (80-100px). Long (>300px): moderate bow (60-80px).
                  const bow = lineLen < 120
                    ? Math.max(lineLen * 0.7, 80)   // short: very pronounced arc
                    : lineLen < 250
                      ? Math.max(lineLen * 0.35, 60) // medium: moderate arc
                      : Math.min(lineLen * 0.22, 80); // long: gentle arc
                  // Mid-point of the straight line
                  const midX = (from.x + to.x) / 2;
                  const midY = (from.y + to.y) / 2;
                  // Control points pulled toward the perpendicular mid-bow
                  const cpx1 = from.x + (midX - from.x) * 0.6 + perpX * bow * 0.5;
                  const cpy1 = from.y + (midY - from.y) * 0.6 + perpY * bow * 0.5;
                  const cpx2 = to.x + (midX - to.x) * 0.6 + perpX * bow * 0.5;
                  const cpy2 = to.y + (midY - to.y) * 0.6 + perpY * bow * 0.5;

                  // Midpoint on bezier at t=0.5 for label/dot placement
                  const t = 0.5;
                  const mt = 1 - t;
                  const mx = mt*mt*mt*from.x + 3*mt*mt*t*cpx1 + 3*mt*t*t*cpx2 + t*t*t*to.x;
                  const my = mt*mt*mt*from.y + 3*mt*mt*t*cpy1 + 3*mt*t*t*cpy2 + t*t*t*to.y;

                  const cfg = connConfig(conn.type);
                  const isSelected = selectedConnId === conn.id;
                  const isHovered = hoveredConnId === conn.id;
                  const showLabel = isSelected || isHovered;
                  const pathD = `M ${from.x} ${from.y} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${to.x} ${to.y}`;

                  return (
                    <g key={conn.id}>
                      {/* Glow layer on hover */}
                      {isHovered && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke={cfg.color}
                          strokeWidth="6"
                          opacity="0.25"
                          style={{ pointerEvents: 'none', filter: `blur(3px)` }}
                        />
                      )}
                      {/* Wide invisible hit area for hover/click */}
                      <path
                        d={pathD}
                        fill="none" stroke="transparent" strokeWidth="18"
                        style={{ cursor: mode === 'edit' ? 'pointer' : 'default', pointerEvents: 'stroke' }}
                        onMouseEnter={() => setHoveredConnId(conn.id)}
                        onMouseLeave={() => setHoveredConnId(null)}
                        onClick={(e) => handleConnClick(e as unknown as React.MouseEvent, conn.id)}
                      />
                      {/* Visible line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isSelected ? 'rgba(255,255,255,0.9)' : cfg.color}
                        strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.8}
                        strokeDasharray={cfg.dash === 'none' ? undefined : cfg.dash}
                        opacity={isSelected || isHovered ? 1 : 0.7}
                        markerEnd={`url(#arrow-${conn.type})`}
                        style={{ pointerEvents: 'none', transition: 'opacity 0.15s, stroke-width 0.15s' }}
                      />
                      {/* Always-visible type indicator dot at midpoint */}
                      {!showLabel && (
                        <circle
                          cx={mx} cy={my} r={isHovered ? 6 : 4.5}
                          fill={cfg.color}
                          opacity={isHovered ? 1 : 0.75}
                          stroke="hsl(var(--card))" strokeWidth="1.5"
                          style={{ pointerEvents: 'none', transition: 'r 0.15s, opacity 0.15s' }}
                        />
                      )}
                      {/* Label pill — visible on hover or selection */}
                      {showLabel && (
                        <>
                          <rect
                            x={mx - 36} y={my - 12}
                            width="72" height="20" rx="10"
                            fill={cfg.color} opacity="0.15"
                            style={{ pointerEvents: 'none' }}
                          />
                          <rect
                            x={mx - 36} y={my - 12}
                            width="72" height="20" rx="10"
                            fill="none"
                            stroke={cfg.color} strokeWidth="1"
                            opacity="0.5"
                            style={{ pointerEvents: 'none' }}
                          />
                          <text x={mx} y={my + 3} textAnchor="middle" fontSize="10"
                            fill={cfg.color} fontWeight="700"
                            style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'var(--font-sans, sans-serif)', letterSpacing: '0.03em' }}
                          >
                            {cfg.label.toUpperCase()}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            );
          })()}
          {/* Empty state — shown when no stakeholders exist */}
          {localStakeholders.length === 0 && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              style={{ zIndex: 15 }}
            >
              <div className="flex flex-col items-center gap-4 text-center px-8 py-10 rounded-2xl border border-dashed border-border/40 bg-card/40 backdrop-blur-sm max-w-xs">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/60">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    <circle cx="19" cy="8" r="3" />
                    <path d="M22 14c0-2.5-1.8-4.5-4-5" />
                    <circle cx="5" cy="8" r="3" />
                    <path d="M2 14c0-2.5 1.8-4.5 4-5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground/80 mb-1">No stakeholders yet</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Switch to <span className="font-medium text-foreground/70">Edit mode</span> and click
                    <span className="font-medium text-primary/80"> + Add Stakeholder</span> to start
                    mapping the buying committee for this deal.
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Stakeholder nodes — z-20 base, z-30 when dragging */}
          {localStakeholders.map((stakeholder, idx) => {
            const pos = getPos(String(stakeholder.id));
            if (!pos) return null;
            const isDragging = dragging === String(stakeholder.id);
            const isConnSrc = connectingFrom === String(stakeholder.id);
            const isPendingConn = connectingFrom === '__pending__';
            const isRerouting = !!reroutingConn;
            const heat = getHeat(stakeholder);
            const heatColor = getHeatColor(heat);
            const touchpoints = getTouchpointCount(stakeholder);
            const interactions = getStakeholderInteractions(stakeholder);
            const isExpanded = expandedCardId === String(stakeholder.id);
            const isHighlighted = highlightedStakeholderId != null && (
              String(highlightedStakeholderId) === String(stakeholder.id) ||
              Number(stakeholder.id) === highlightedStakeholderId
            );

            // ── Ring hover dim: if a ring legend is hovered, dim cards not in that ring ──
            const cardRingIdx = getRing(stakeholder.role ?? '');
            const isRingDimmed = hoveredRingIdx !== null && hoveredRingIdx !== cardRingIdx;

            // ── Hover-expand card design ──
            // In view mode: collapsed by default, expands on hover
            // In edit mode: always expanded for drag/drop usability
            const cardId = String(stakeholder.id);
            const isCardHovered = hoveredCardId === cardId;
            const isCardExpanded = mode === 'edit' || isCardHovered;

            // ── Mobile compact node ──────────────────────────────────────────
            if (isMobile) {
              const roleColorClass = getRoleColor(stakeholder.role as any);
              // Extract border color from role color class for the ring
              const ringColor = stakeholder.role?.toLowerCase().includes('decision') || stakeholder.role?.toLowerCase().includes('champion')
                ? '#6382ff'
                : stakeholder.role?.toLowerCase().includes('blocker')
                  ? '#ef4444'
                  : stakeholder.role?.toLowerCase().includes('influencer')
                    ? '#10b981'
                    : '#f59e0b';
              return (
                <motion.div
                  key={stakeholder.id}
                  className={`absolute select-none z-20 stakeholder-node flex flex-col items-center`}
                  style={{ left: pos.x, top: pos.y, width: NODE_W_MOBILE }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: isRingDimmed ? 0.2 : 1, scale: isHighlighted ? 1.1 : 1 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  onClick={(e) => { e.stopPropagation(); handleNodeClick(e, stakeholder); }}
                >
                  {/* Avatar ring */}
                  <div
                    className="relative"
                    style={{
                      width: 52, height: 52,
                      borderRadius: '50%',
                      border: `2.5px solid ${ringColor}`,
                      boxShadow: isHighlighted ? `0 0 0 3px ${ringColor}40` : 'none',
                      overflow: 'hidden',
                      background: 'hsl(var(--card))',
                    }}
                  >
                    <StakeholderAvatar name={stakeholder.name} avatarUrl={stakeholder.avatar} size="sm" className="w-full h-full" />
                    {/* Sentiment dot */}
                    <div
                      className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2"
                      style={{ backgroundColor: sentimentDot(stakeholder.sentiment), borderColor: 'hsl(var(--card))' }}
                    />
                  </div>
                  {/* Name */}
                  <div className="mt-1 text-center" style={{ width: NODE_W_MOBILE }}>
                    <div className="text-[10px] font-semibold leading-tight truncate px-1" style={{ color: 'hsl(var(--foreground))' }}>
                      {stakeholder.name.split(' ')[0]}
                    </div>
                    <div className="text-[8px] leading-tight truncate px-1" style={{ color: ringColor, opacity: 0.9 }}>
                      {stakeholder.role}
                    </div>
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={stakeholder.id}
                className={`absolute select-none ${isDragging ? 'z-30' : isCardHovered ? 'z-25' : 'z-20'} stakeholder-node`}
                style={{ left: pos.x, top: pos.y, width: NODE_W }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: isRingDimmed ? 0.15 : 1, scale: isDragging ? 1.04 : isHighlighted ? 1.05 : 1 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                onMouseDown={(e) => handleMouseDown(e, cardId)}
                onMouseEnter={() => {
                  if (mode === 'edit' && dragging) return;
                  setHoveredCardId(cardId);
                  setHoveredId(cardId);
                }}
                onMouseLeave={() => {
                  setHoveredCardId(null);
                  setHoveredId(null);
                }}
              >
                <Card
                  className={`bg-card border transition-all duration-150 ${
                    mode === 'edit' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  } ${
                    isHighlighted
                      ? 'border-primary/80 shadow-xl shadow-primary/25 ring-2 ring-primary/40'
                      : isConnSrc
                        ? 'border-amber-400/80 shadow-lg shadow-amber-400/20 ring-1 ring-amber-400/30'
                        : (isPendingConn || isRerouting)
                          ? 'border-blue-400/60 hover:border-blue-400/90'
                          : isDragging
                            ? 'border-primary/40 shadow-xl'
                            : isCardHovered
                              ? 'border-primary/40 shadow-xl shadow-primary/10'
                              : 'border-border/50 hover:border-primary/30'
                  }`}
                  onClick={(e) => {
                    if (reroutingConn) { handleRerouteTarget(e, cardId); return; }
                    if (connectingFrom === '__pending__') { setConnectingFrom(cardId); return; }
                    handleNodeClick(e, stakeholder);
                  }}
                >
                  <CardContent className="p-2">
                    {/* ── Row 1: avatar + name + role badge + sentiment dot ── */}
                    <div className="flex items-center gap-1.5">
                      <div className="relative shrink-0">
                        <StakeholderAvatar name={stakeholder.name} avatarUrl={stakeholder.avatar} size="sm" className="border-2 border-background" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card"
                          style={{ backgroundColor: sentimentDot(stakeholder.sentiment) }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold leading-tight truncate">{stakeholder.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {(stakeholder.roles ?? [stakeholder.role]).slice(0, 1).map(r => (
                            <Badge key={r} variant="outline" className={`text-[8px] px-1 py-0 h-3.5 leading-none ${getRoleColor(r as Stakeholder['role'])}`}>
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {mode === 'edit' && (
                        <button
                          onClick={(e) => handleRemoveStakeholder(stakeholder.id, e)}
                          className="shrink-0 w-4 h-4 rounded flex items-center justify-center bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    {/* ── Row 2: job title ── */}
                    {stakeholder.title && (
                      <div className="text-[9px] text-muted-foreground mt-1 truncate leading-tight">{stakeholder.title}</div>
                    )}

                    {/* ── Row 3: heat bar (always visible) ── */}
                    <div className="mt-1.5">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Flame className="w-2.5 h-2.5 shrink-0" style={{ color: heatColor }} />
                        <div className="flex-1 h-1 rounded-full bg-muted/60 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: heatColor }}
                            initial={{ width: 0 }}
                            animate={{ width: `${heat * 100}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        </div>
                        <span className="text-[9px] font-medium shrink-0" style={{ color: heatColor }}>
                          {touchpoints > 0 ? `${touchpoints}tp` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* ── Row 4: interaction count (always visible) + hover auto-expand ── */}
                    <div className="border-t border-border/20 mt-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                          {interactions.length} interaction{interactions.length !== 1 ? 's' : ''}
                        </span>
                        {isCardHovered && (
                          <button
                            className="flex items-center gap-0.5 text-[9px] text-primary hover:text-primary/80 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddModalStakeholder(stakeholder);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            title="Add content for this person"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>

                      {/* Auto-expand recent 3 interactions on hover */}
                      <AnimatePresence>
                        {isCardHovered && interactions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-1.5 space-y-1">
                              {interactions.slice(0, 3).map(interaction => (
                                <div
                                  key={interaction.id}
                                  className="rounded-md bg-muted/20 border border-border/20 px-1.5 py-1"
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-semibold text-foreground/80 truncate flex-1">{interaction.type}</span>
                                    <span className="text-[8px] text-muted-foreground shrink-0">
                                      {(typeof interaction.date === 'string' ? interaction.date : new Date(interaction.date).toISOString().slice(0, 10)).slice(5)}
                                    </span>
                                  </div>
                                  {interaction.summary && (
                                    <p className="text-[8px] text-muted-foreground leading-snug line-clamp-1 mt-0.5">{interaction.summary}</p>
                                  )}
                                </div>
                              ))}
                              {interactions.length > 3 && (
                                <div className="text-[8px] text-muted-foreground/50 text-center">
                                  +{interactions.length - 3} more
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>


      {/* ── Add Interaction Modal ── */}
      {addModalStakeholder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setAddModalStakeholder(null)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl w-[440px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <div>
                <h3 className="font-display text-sm font-semibold">Add Content</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">For {addModalStakeholder.name} — {addModalStakeholder.title}</p>
              </div>
              <button onClick={() => setAddModalStakeholder(null)} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <AddInteractionForm
              stakeholder={addModalStakeholder}
              onSubmit={(type, title, description) => {
                const newI: Interaction = {
                  id: nanoid(8),
                  dealId: deal.id,
                  date: new Date().toISOString().slice(0, 10),
                  type: type as Interaction['type'],
                  keyParticipant: addModalStakeholder.name,
                  summary: `[${title}] ${description}`,
                  duration: 30,
                };
                setLocalInteractions(prev => [newI, ...prev]);
                setAddModalStakeholder(null);
                toast.success(`Added to ${addModalStakeholder.name}'s interactions`);
              }}
              onCancel={() => setAddModalStakeholder(null)}
            />
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 text-[10px] text-muted-foreground bg-card/90 backdrop-blur-sm rounded-md px-3 py-2 border border-border/30 flex-wrap">
        {CONNECTION_TYPES.map(ct => (
          <div key={ct.value} className="flex items-center gap-1.5">
            {/* Source dot */}
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ct.color }} />
            {/* Line */}
            <div className="w-4 h-0.5" style={{ background: ct.color }} />
            {/* Arrowhead indicator */}
            <div className="w-0 h-0 border-t-[3px] border-b-[3px] border-l-[5px] border-t-transparent border-b-transparent shrink-0"
              style={{ borderLeftColor: ct.color }} />
            <span>{ct.label}</span>
          </div>
        ))}
        <div className="w-px h-3 bg-border/40 mx-0.5" />
        {[{ color: '#10b981', label: 'Positive' }, { color: '#f59e0b', label: 'Neutral' }, { color: '#ef4444', label: 'Negative' }].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
          </div>
        ))}
        <div className="w-px h-3 bg-border/40 mx-0.5" />
         <div className="flex items-center gap-1.5">
          <Flame className="w-3 h-3 text-orange-400" />
          <span>Heat = {heatWindow} touchpoints</span>
        </div>
      </div>
    </div>
  );
}

// ── Add Interaction Form (used in modal) ─────────────────────────────────────────
const CONTENT_TYPES = [
  { value: 'meeting', label: 'Meeting Notes', icon: MessageSquare, desc: 'Record meeting notes or paste transcript' },
  { value: 'screenshot', label: 'Screenshot', icon: Image, desc: 'Upload a conversation screenshot or image' },
  { value: 'document', label: 'Document / PDF', icon: FileText, desc: 'Attach a PDF, proposal, or document' },
  { value: 'recording', label: 'Video / Audio', icon: Mic, desc: 'Upload a recording file' },
  { value: 'note', label: 'Quick Note', icon: Pencil, desc: 'Add a freeform text note' },
] as const;

function AddInteractionForm({ stakeholder, onSubmit, onCancel }: {
  stakeholder: Stakeholder;
  onSubmit: (type: string, title: string, description: string) => void;
  onCancel: () => void;
}) {
  const [selectedType, setSelectedType] = useState<string>('meeting');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');

  const selected = CONTENT_TYPES.find(t => t.value === selectedType)!;

  return (
    <div className="p-5 space-y-4">
      {/* Type selector */}
      <div className="grid grid-cols-5 gap-1.5">
        {CONTENT_TYPES.map(ct => {
          const Icon = ct.icon;
          const isActive = selectedType === ct.value;
          return (
            <button
              key={ct.value}
              onClick={() => setSelectedType(ct.value)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-[10px] transition-all ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="leading-tight text-center">{ct.label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground">{selected.desc}</p>

      {/* Title */}
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={selectedType === 'meeting' ? 'e.g. Discovery Call with VP Sales' : 'Brief title...'}
          className="w-full mt-1 text-xs bg-background border border-border/50 rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Content area - varies by type */}
      {(selectedType === 'screenshot' || selectedType === 'document' || selectedType === 'recording') ? (
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">File</label>
          <div className="mt-1 border-2 border-dashed border-border/40 rounded-lg p-6 text-center hover:border-primary/30 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
            {fileName ? (
              <p className="text-xs text-foreground">{fileName}</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Drop file here or click to browse</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  {selectedType === 'screenshot' ? 'PNG, JPG, WebP' : selectedType === 'document' ? 'PDF, DOCX' : 'MP3, WAV, MP4, WebM'}
                </p>
              </>
            )}
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept={selectedType === 'screenshot' ? 'image/*' : selectedType === 'document' ? '.pdf,.docx' : 'audio/*,video/*'}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) setFileName(f.name);
              }}
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {selectedType === 'meeting' ? 'Meeting Notes / Transcript' : 'Note'}
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={selectedType === 'meeting' ? 'Paste meeting notes or key takeaways...' : 'Write your note...'}
            rows={4}
            className="w-full mt-1 text-xs bg-background border border-border/50 rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none leading-relaxed"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs rounded-md border border-border/50 text-muted-foreground hover:bg-muted/30 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit(selectedType === 'meeting' ? 'Follow-up' : 'Email', title || selected.label, description || fileName || '')}
          disabled={!title && !description && !fileName}
          className="px-4 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          <Send className="w-3 h-3" />
          Save
        </button>
      </div>
    </div>
  );
}

// ── Default connections builder ───────────────────────────────────────────────────
function buildDefaultConnections(stakeholders: Stakeholder[], _stages: string[]): Connection[] {
  const result: Connection[] = [];

  // Build role-based default connections:
  // Decision Makers are the hub — everyone connects to them
  // Champions influence Decision Makers
  // Influencers influence Decision Makers or Champions
  // Blockers block Decision Makers
  // Users report to Champions or Influencers

  const byRole = (role: string) => stakeholders.filter(s => s.role === role);
  const decisionMakers = byRole('Decision Maker');
  const champions = byRole('Champion');
  const influencers = byRole('Influencer');
  const blockers = byRole('Blocker');
  const users = byRole('User');

  const addConn = (from: Stakeholder, to: Stakeholder, type: Connection['type']) => {
    result.push({ id: nanoid(8), from: String(from.id), to: String(to.id), type });
  };

  // Champions influence Decision Makers
  champions.forEach(c => decisionMakers.forEach(d => addConn(c, d, 'influences')));

  // Influencers influence Champions (or Decision Makers if no Champions)
  influencers.forEach(inf => {
    const targets = champions.length > 0 ? champions : decisionMakers;
    targets.forEach(t => addConn(inf, t, 'influences'));
  });

  // Blockers block Decision Makers
  blockers.forEach(b => decisionMakers.forEach(d => addConn(b, d, 'blocks')));

  // Users report to Champions (or influencers if no champions)
  users.forEach(u => {
    const targets = champions.length > 0 ? champions : influencers;
    targets.forEach(t => addConn(u, t, 'reports_to'));
  });

  // If no role-based connections were created (e.g., all same role), connect adjacent pairs
  if (result.length === 0 && stakeholders.length > 1) {
    for (let i = 0; i < stakeholders.length - 1; i++) {
      addConn(stakeholders[i], stakeholders[i + 1], 'collaborates');
    }
  }

  return result;
}
