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
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ZoomIn, ZoomOut, Maximize2, Edit2, Eye, Plus, Trash2,
  Link2, Link2Off, Save, X, Check, Camera, Mail, Flame,
  GripVertical, ChevronDown, ChevronUp, Pencil, Clock, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

interface StakeholderMapProps {
  deal: Deal;
  onStakeholderClick?: (stakeholder: Stakeholder) => void;
  onStakeholdersChange?: (stakeholders: Stakeholder[]) => void;
  highlightedStakeholderId?: number | null;
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

const NODE_W = 200;
// Realistic card height including avatar row, badges, heat bar, interaction toggle
// Used ONLY for collision math — must be >= actual rendered height
const NODE_H = 230;
const CARD_GAP = 24; // minimum gap between card edges

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
    const { positions, connections, localInteractions } = parsed;
    if (!Array.isArray(positions)) return null;
    return {
      positions,
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
): NodePosition[] {
  // Pin the dragged card; copy all others
  let result = positions.map(p =>
    p.id === draggingId ? { ...p, x: rawX, y: rawY } : { ...p }
  );

  // Separation needed to have no overlap
  const needSepX = NODE_W + CARD_GAP;
  const needSepY = cardH + CARD_GAP;

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

// ── Auto-layout ───────────────────────────────────────────────────────────────
function computeInitialPositions(
  stakeholders: Stakeholder[],
  _stages: string[],
  containerW: number,
): NodePosition[] {
  // Concentric circle layout
  const centerX = containerW / 2 - NODE_W / 2;
  const centerY = 320; // vertical center of the map area

  if (stakeholders.length === 0) return [];

  // Group stakeholders by ring
  const rings: Stakeholder[][] = [[], [], []];
  stakeholders.forEach(s => {
    const ring = getRing(s.role);
    rings[ring].push(s);
  });

  // Ring radii — scale based on container width
  const baseRadius = Math.min(containerW * 0.18, 180);
  const ringRadii = [
    baseRadius,           // inner ring
    baseRadius * 1.8,     // middle ring
    baseRadius * 2.5,     // outer ring
  ];

  const raw: NodePosition[] = [];

  rings.forEach((ringStakeholders, ringIdx) => {
    if (ringStakeholders.length === 0) return;
    const radius = ringRadii[ringIdx];
    const angleStep = (2 * Math.PI) / ringStakeholders.length;
    // Start from top (-PI/2) and distribute evenly
    const startAngle = -Math.PI / 2;

    ringStakeholders.forEach((s, i) => {
      const angle = startAngle + i * angleStep;
      raw.push({
        id: s.id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });
  });

  // Run a full collision pass on initial layout too
  const maxX = containerW - NODE_W;
  return resolveCollisions(raw, null, 0, 0, maxX);
}

// ── Sentiment helpers ─────────────────────────────────────────────────────────
const sentimentDot = (s: string) =>
  s === 'Positive' ? '#10b981' : s === 'Neutral' ? '#f59e0b' : '#ef4444';

const sentimentLabel = (s: string) =>
  s === 'Positive' ? 'text-emerald-400' : s === 'Neutral' ? 'text-amber-400' : 'text-red-400';

// ── Component ─────────────────────────────────────────────────────────────────
export default function StakeholderMap({ deal, onStakeholderClick, onStakeholdersChange, highlightedStakeholderId }: StakeholderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(800);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [heatWindow, setHeatWindow] = useState<HeatWindow>('L14D');

  // ── Per-deal state ────────────────────────────────────────────────────────
  const [currentDealId, setCurrentDealId] = useState(deal.id);
  const [localStakeholders, setLocalStakeholders] = useState<Stakeholder[]>([]);
  const [positions, setPositions] = useState<NodePosition[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  // Local meetings — editable copy of deal.meetings + user-added ones
  const [localInteractions, setLocalInteractions] = useState<Meeting[]>([]);

  // ── Hover tooltip state ───────────────────────────────────────────────────
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // ── Expanded interaction history on cards ─────────────────────────────────
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  // Editing a specific interaction entry: { interactionId, field }
  const [editingInteraction, setEditingInteraction] = useState<string | null>(null);

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
    const maxX = actualW - NODE_W;
    const saved = loadState(deal.id);

    if (saved && saved.positions.length > 0) {
      const validIds = new Set(stks.map(s => s.id));
      const validPositions = saved.positions.filter(p => validIds.has(p.id));
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
    setPositions(computeInitialPositions(stks, deal.buyingStages ?? [], actualW));
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
  const [zoom, setZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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
    const state: PersistedMapState = { positions, connections, localInteractions };
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
    const maxX = containerW - NODE_W;
    setPositions(resolveCollisions(p, null, 0, 0, maxX));
    setConnections(c);
    setLocalInteractions(li);
    setShowHistory(false);
    toast.success(`Restored: ${version.label}`);
  };

  const handleReset = () => {
    setPositions(computeInitialPositions(localStakeholders, Array.isArray(deal.buyingStages) ? deal.buyingStages : [], containerW));
    setZoom(1);
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
    const maxX = (containerW / zoom) - NODE_W;
    const clampedX = Math.max(0, Math.min(rawX, maxX));
    const clampedY = Math.max(0, rawY);

    setPositions(prev => resolveCollisions(prev, dragging, clampedX, clampedY, maxX));
  }, [dragging, dragStart, zoom, containerW, dragMoved]);

  const handleMouseUp = useCallback(() => {
    if (dragging && !dragMoved) {
      const stakeholder = localStakeholders.find(s => s.id === dragging);
      if (stakeholder) {
        setHoveredId(null);
        setModalStakeholder(stakeholder);
        setIsEditingModal(false);
        setEditName(stakeholder.name);
        setEditTitle(stakeholder.title);
        setEditSentiment(stakeholder.sentiment);
        setEditRoles(stakeholder.roles ?? [stakeholder.role]);
        onStakeholderClick?.(stakeholder);
      }
    }
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

  // ── Node click (view mode) ────────────────────────────────────────────────
  const handleNodeClick = (e: React.MouseEvent, stakeholder: Stakeholder) => {
    e.stopPropagation();
    setConnEditPopup(null);

    if (mode === 'edit' && connectingFrom) {
      if (connectingFrom === stakeholder.id) { setConnectingFrom(null); return; }
      const exists = connections.find(
        c => (c.from === connectingFrom && c.to === stakeholder.id) ||
             (c.from === stakeholder.id && c.to === connectingFrom)
      );
      if (exists) {
        setConnections(prev => prev.filter(c => c.id !== exists.id));
        toast('Connection removed');
      } else {
        setConnections(prev => [...prev, { id: nanoid(8), from: connectingFrom, to: stakeholder.id, type: pendingConnType }]);
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
      {/* Concentric circle ring labels */}
      <div className="absolute top-2 left-3 z-10 flex items-center gap-3 text-[10px] text-muted-foreground bg-card/80 backdrop-blur-sm rounded-md px-3 py-2 border border-border/30">
        {RING_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: RING_COLORS[i].replace(/[\d.]+\)$/, '0.6)'), backgroundColor: RING_COLORS[i] }} />
            <span className="font-medium">{label}</span>
          </div>
        ))}
      </div>

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

        {[
          { icon: ZoomIn,    action: () => setZoom(z => Math.min(z + 0.15, 1.8)) },
          { icon: ZoomOut,   action: () => setZoom(z => Math.max(z - 0.15, 0.4)) },
          { icon: Maximize2, action: handleReset },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action}
            className="w-7 h-7 rounded bg-muted/80 border border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <btn.icon className="w-3.5 h-3.5" />
          </button>
        ))}
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
        className="absolute inset-0 top-0 overflow-auto"
        style={{ cursor: dragging ? 'grabbing' : (connectingFrom || reroutingConn) ? 'crosshair' : 'default' }}
        onClick={() => { setConnEditPopup(null); setHoveredId(null); }}
        onMouseDown={() => {
          if (mode === 'view' && !dragging) {
            // Drag hint detected in card's onMouseDown
          }
        }}
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

        {/* Concentric circle rings */}
        {(() => {
          const cx = containerW / 2;
          const cy = 320 + NODE_H / 2;
          const baseR = Math.min(containerW * 0.18, 180);
          const radii = [baseR, baseR * 1.8, baseR * 2.5];
          return (
            <svg className="absolute inset-0 w-full pointer-events-none" style={{ height: '100%', overflow: 'visible' }}>
              {/* Rings from outer to inner */}
              {[...radii].reverse().map((r, revIdx) => {
                const idx = radii.length - 1 - revIdx;
                return (
                  <g key={idx}>
                    <circle cx={cx} cy={cy} r={r + NODE_W / 2 + 30}
                      fill={RING_COLORS[idx]}
                      stroke={RING_COLORS[idx].replace(/[\d.]+\)$/, '0.3)')}
                      strokeWidth="1"
                      strokeDasharray="6 4"
                    />
                  </g>
                );
              })}
              {/* Center deal node */}
              <circle cx={cx} cy={cy} r={28} fill="hsl(var(--primary))" opacity="0.15" />
              <circle cx={cx} cy={cy} r={20} fill="hsl(var(--primary))" opacity="0.25" />
              <circle cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" opacity="0.8" />
              <text x={cx} y={cy + 42} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" fontWeight="600" opacity="0.6" style={{ fontFamily: 'var(--font-mono, monospace)' }}>DEAL</text>
            </svg>
          );
        })()}

        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: '100%', minHeight: '100%', position: 'relative' }}>
          {/* SVG connections */}
          <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible', pointerEvents: mode === 'edit' ? 'all' : 'none' }}>
            <defs>
              {CONNECTION_TYPES.map(ct => (
                <marker
                  key={ct.value}
                  id={`arrow-${ct.value}`}
                  markerWidth="12" markerHeight="10"
                  refX="11" refY="5"
                  orient="auto"
                >
                  {/* Bold filled arrowhead */}
                  <polygon points="0 0, 12 5, 0 10" fill={ct.color} />
                </marker>
              ))}
            </defs>
            {connections.map(conn => {
              const fromPos = getPos(conn.from);
              const toPos = getPos(conn.to);
              if (!fromPos || !toPos) return null;

              const fx = fromPos.x + NODE_W / 2;
              const fy = fromPos.y + NODE_H / 2;
              const tx = toPos.x + NODE_W / 2;
              const ty = toPos.y + NODE_H / 2;

              // Bezier control points
              const cpx1 = fx + (tx - fx) * 0.4;
              const cpx2 = fx + (tx - fx) * 0.6;

              const cfg = connConfig(conn.type);
              const isSelected = selectedConnId === conn.id;

              // True midpoint of cubic bezier at t=0.5
              const t = 0.5;
              const mt = 1 - t;
              const mx = mt*mt*mt*fx + 3*mt*mt*t*cpx1 + 3*mt*t*t*cpx2 + t*t*t*tx;
              const my = mt*mt*mt*fy + 3*mt*mt*t*fy  + 3*mt*t*t*ty  + t*t*t*ty;

              // Direction angle at midpoint for the arrowhead
              // Derivative of cubic bezier at t=0.5
              const dxdt = 3*mt*mt*(cpx1-fx) + 6*mt*t*(cpx2-cpx1) + 3*t*t*(tx-cpx2);
              const dydt = 3*mt*mt*(fy-fy)   + 6*mt*t*(ty-fy)     + 3*t*t*(ty-ty);
              const angle = Math.atan2(dydt, dxdt) * 180 / Math.PI;

              return (
                <g key={conn.id}>
                  {/* Wide invisible hit area */}
                  <path d={`M ${fx} ${fy} C ${cpx1} ${fy}, ${cpx2} ${ty}, ${tx} ${ty}`}
                    fill="none" stroke="transparent" strokeWidth="14"
                    style={{ cursor: mode === 'edit' ? 'pointer' : 'default' }}
                    onClick={(e) => handleConnClick(e as unknown as React.MouseEvent, conn.id)}
                  />
                  {/* Visible line — no markerEnd, arrowhead drawn manually at midpoint */}
                  <path d={`M ${fx} ${fy} C ${cpx1} ${fy}, ${cpx2} ${ty}, ${tx} ${ty}`}
                    fill="none"
                    stroke={isSelected ? 'rgba(255,255,255,0.9)' : cfg.color}
                    strokeWidth={isSelected ? 3 : 2}
                    strokeDasharray={cfg.dash === 'none' ? undefined : cfg.dash}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Source dot at FROM end */}
                  <circle
                    cx={fx} cy={fy} r={isSelected ? 5 : 4}
                    fill={isSelected ? 'rgba(255,255,255,0.9)' : cfg.color}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Arrowhead at TRUE midpoint of the bezier curve */}
                  <polygon
                    points="-7,-4 6,0 -7,4"
                    fill={isSelected ? 'rgba(255,255,255,0.9)' : cfg.color}
                    transform={`translate(${mx},${my}) rotate(${angle})`}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Label — plain text, no background, offset above midpoint */}
                  <text
                    x={mx} y={my - 10}
                    textAnchor="middle"
                    fontSize="9"
                    fill={cfg.color}
                    fontWeight="600"
                    opacity="0.85"
                    style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'var(--font-mono, monospace)' }}
                  >
                    {cfg.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Stakeholder nodes */}
          {localStakeholders.map((stakeholder, idx) => {
            const pos = getPos(stakeholder.id);
            if (!pos) return null;
            const isDragging = dragging === stakeholder.id;
            const isConnSrc = connectingFrom === stakeholder.id;
            const isPendingConn = connectingFrom === '__pending__';
            const isRerouting = !!reroutingConn;
            const heat = getHeat(stakeholder);
            const heatColor = getHeatColor(heat);
            const touchpoints = getTouchpointCount(stakeholder);
            const interactions = getStakeholderInteractions(stakeholder);
            const isExpanded = expandedCardId === stakeholder.id;
            const isHighlighted = highlightedStakeholderId != null && (
              String(highlightedStakeholderId) === String(stakeholder.id) ||
              Number(stakeholder.id) === highlightedStakeholderId
            );

            return (
              <motion.div
                key={stakeholder.id}
                className={`absolute select-none ${isDragging ? 'z-30' : 'z-20'}`}
                style={{ left: pos.x, top: pos.y, width: NODE_W }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: isDragging ? 1.04 : 1 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                onMouseDown={(e) => handleMouseDown(e, stakeholder.id)}
                onMouseEnter={(e) => {
                  if (mode === 'edit' && dragging) return;
                  setHoveredId(stakeholder.id);
                  setHoverPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredId(null)}
              >
                <Card
                  className={`bg-card border transition-all duration-150 ${
                    mode === 'edit' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  } ${
                    isHighlighted
                      ? 'border-primary/80 shadow-xl shadow-primary/25 ring-2 ring-primary/40 scale-105'
                      : isConnSrc
                        ? 'border-amber-400/80 shadow-lg shadow-amber-400/20 ring-1 ring-amber-400/30'
                        : (isPendingConn || isRerouting)
                          ? 'border-blue-400/60 hover:border-blue-400/90'
                          : isDragging
                            ? 'border-primary/40 shadow-xl'
                            : 'border-border/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5'
                  }`}
                  onClick={(e) => {
                    if (reroutingConn) { handleRerouteTarget(e, stakeholder.id); return; }
                    if (connectingFrom === '__pending__') { setConnectingFrom(stakeholder.id); return; }
                    handleNodeClick(e, stakeholder);
                  }}
                >
                  <div className="p-3.5">
                    {/* Drag handle — only visible in edit mode */}
                    {mode === 'edit' && (
                      <div className="flex items-center justify-center mb-1.5 -mt-1 opacity-40 hover:opacity-70 transition-opacity">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}

                    {/* Avatar + name row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative shrink-0">
                        <img
                          src={stakeholder.avatar}
                          alt={stakeholder.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-background"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(stakeholder.name)}&background=1a1f36&color=fff&size=48`;
                          }}
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card"
                          style={{ backgroundColor: sentimentDot(stakeholder.sentiment) }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold leading-tight truncate">{stakeholder.name}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">{stakeholder.title}</div>
                      </div>
                      {mode === 'edit' && (
                        <button
                          onClick={(e) => handleRemoveStakeholder(stakeholder.id, e)}
                          className="shrink-0 w-5 h-5 rounded flex items-center justify-center bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Role badges */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(stakeholder.roles ?? [stakeholder.role]).slice(0, 2).map(r => (
                        <Badge key={r} variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${getRoleColor(r as Stakeholder['role'])}`}>
                          {r}
                        </Badge>
                      ))}
                    </div>

                    {/* Heat bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5" style={{ color: heatColor }} />
                          <span className="text-[9px] text-muted-foreground font-mono">{heatWindow}</span>
                        </div>
                        <span className="text-[9px] font-medium" style={{ color: heatColor }}>
                          {touchpoints > 0 ? `${touchpoints} touchpoint${touchpoints !== 1 ? 's' : ''}` : 'No contact'}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: heatColor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${heat * 100}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="text-[9px] text-muted-foreground">{getHeatLabel(heat)}</div>
                    </div>

                    {/* Expandable interaction history */}
                    <div className="mt-2 border-t border-border/20 pt-2">
                      <div className="flex items-center justify-between">
                        <button
                          className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCardId(isExpanded ? null : stakeholder.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <span className="font-medium uppercase tracking-wider">
                            {interactions.length} interaction{interactions.length !== 1 ? 's' : ''}
                          </span>
                          {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                        </button>
                        {/* Add interaction button */}
                        <button
                          className="w-4 h-4 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            addInteraction(stakeholder.name);
                            setExpandedCardId(stakeholder.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          title="Add interaction"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-1.5 space-y-2 max-h-64 overflow-y-auto pr-0.5">
                              {interactions.slice(0, 8).map(interaction => {
                                const isEditingThis = editingInteraction === interaction.id;
                                return (
                                  <div
                                    key={interaction.id}
                                    className={`rounded-lg border transition-colors ${
                                      isEditingThis
                                        ? 'bg-muted/50 border-primary/30 p-2'
                                        : 'bg-muted/20 border-border/20 p-1.5'
                                    }`}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    {isEditingThis ? (
                                      /* ── Edit mode for this interaction ── */
                                      <div className="space-y-1.5">
                                        {/* Type + Date row */}
                                        <div className="flex gap-1.5">
                                          <select
                                            value={interaction.type}
                                            onChange={(e) => updateInteraction(interaction.id, { type: e.target.value as Interaction['type'] })}
                                            className="flex-1 text-[9px] bg-background border border-border/50 rounded px-1.5 py-1 text-foreground"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {INTERACTION_TYPES.map(t => (
                                              <option key={t} value={t}>{t}</option>
                                            ))}
                                          </select>
                                          <input
                                            type="date"
                                            value={typeof interaction.date === 'string' ? interaction.date : new Date(interaction.date).toISOString().slice(0, 10)}
                                            onChange={(e) => updateInteraction(interaction.id, { date: e.target.value })}
                                            className="w-24 text-[9px] bg-background border border-border/50 rounded px-1.5 py-1 text-foreground"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                        {/* Duration */}
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                                          <input
                                            type="number"
                                            value={interaction.duration}
                                            onChange={(e) => updateInteraction(interaction.id, { duration: Number(e.target.value) })}
                                            className="w-14 text-[9px] bg-background border border-border/50 rounded px-1.5 py-1 text-foreground"
                                            min={1}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-[9px] text-muted-foreground">min</span>
                                        </div>
                                        {/* Notes / summary */}
                                        <textarea
                                          value={interaction.summary}
                                          onChange={(e) => updateInteraction(interaction.id, { summary: e.target.value })}
                                          placeholder="Notes..."
                                          rows={2}
                                          className="w-full text-[9px] bg-background border border-border/50 rounded px-1.5 py-1 text-foreground resize-none leading-relaxed"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        {/* Save / Delete row */}
                                        <div className="flex gap-1">
                                          <button
                                            className="flex-1 flex items-center justify-center gap-1 text-[9px] py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); setEditingInteraction(null); }}
                                          >
                                            <Check className="w-2.5 h-2.5" /> Done
                                          </button>
                                          <button
                                            className="flex items-center justify-center w-6 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); deleteInteraction(interaction.id); }}
                                          >
                                            <Trash2 className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      /* ── Read mode for this interaction ── */
                                      <div>
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                          <span className="text-[9px] font-semibold text-foreground/80 truncate">{interaction.type}</span>
                                          <div className="flex items-center gap-1 ml-auto shrink-0">
                                            <Calendar className="w-2.5 h-2.5 text-muted-foreground/60" />
                                            <span className="text-[9px] text-muted-foreground">{(typeof interaction.date === 'string' ? interaction.date : new Date(interaction.date).toISOString().slice(0, 10)).slice(5)}</span>
                                            <Clock className="w-2.5 h-2.5 text-muted-foreground/60 ml-1" />
                                            <span className="text-[9px] text-muted-foreground">{interaction.duration}m</span>
                                            <button
                                              className="ml-1 w-4 h-4 rounded flex items-center justify-center hover:bg-muted/60 transition-colors"
                                              onClick={(e) => { e.stopPropagation(); setEditingInteraction(interaction.id); }}
                                            >
                                              <Pencil className="w-2.5 h-2.5 text-muted-foreground/60 hover:text-foreground" />
                                            </button>
                                          </div>
                                        </div>
                                        {interaction.summary && (
                                          <p className="text-[9px] text-muted-foreground leading-relaxed line-clamp-2">{interaction.summary}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {interactions.length > 8 && (
                                <div className="text-[9px] text-muted-foreground/60 text-center py-0.5">
                                  +{interactions.length - 8} more — open profile to view all
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {hoveredId && !modalStakeholder && (() => {
          const s = localStakeholders.find(x => x.id === hoveredId);
          if (!s) return null;
          const heat = getHeat(s);
          const touchpoints = getTouchpointCount(s);
          const recentInteractions = localInteractions
            .filter(i => i.keyParticipant.toLowerCase().includes(s.name.split(' ')[0].toLowerCase()))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3);

          const tooltipW = 260;
          const left = hoverPos.x + 16 + tooltipW > window.innerWidth
            ? hoverPos.x - tooltipW - 8
            : hoverPos.x + 16;
          const top = Math.min(hoverPos.y - 20, window.innerHeight - 320);

          return (
            <motion.div
              key={hoveredId}
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 pointer-events-none"
              style={{ left, top, width: tooltipW }}
            >
              <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-xl shadow-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img src={s.avatar} alt={s.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-background"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1a1f36&color=fff&size=40`; }}
                  />
                  <div>
                    <div className="text-[13px] font-semibold">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">{s.title}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sentimentDot(s.sentiment) }} />
                    <span className={`text-[11px] font-medium ${sentimentLabel(s.sentiment)}`}>{s.sentiment}</span>
                  </div>
                  {(s.roles ?? [s.role]).map(r => (
                    <Badge key={r} variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${getRoleColor(r as Stakeholder['role'])}`}>{r}</Badge>
                  ))}
                </div>
                <div className="mb-3 p-2 rounded-lg bg-muted/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1">
                      <Flame className="w-3 h-3" style={{ color: getHeatColor(heat) }} />
                      <span className="text-[10px] font-medium">Engagement ({heatWindow})</span>
                    </div>
                    <span className="text-[10px]" style={{ color: getHeatColor(heat) }}>{touchpoints} touchpoints</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${heat * 100}%`, background: getHeatColor(heat) }} />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1">{getHeatLabel(heat)}</div>
                </div>
                {s.keyInsights && (
                  <div className="mb-3">
                    <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Key Insight</div>
                    <div className="text-[11px] text-foreground/80 leading-relaxed line-clamp-3">{s.keyInsights}</div>
                  </div>
                )}
                {recentInteractions.length > 0 && (
                  <div>
                    <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Recent Touchpoints</div>
                    <div className="space-y-1">
                      {recentInteractions.map(i => (
                        <div key={i.id} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                          <span className="text-[10px] text-muted-foreground truncate">{i.type}</span>
                          <span className="text-[10px] text-muted-foreground/60 ml-auto shrink-0">{(typeof i.date === 'string' ? i.date : new Date(i.date).toISOString().slice(0, 10)).slice(5)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 pt-2 border-t border-border/30 text-[9px] text-muted-foreground/60 text-center">
                  Click to view & edit full profile
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

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

      {/* ── Stakeholder Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalStakeholder && (() => {
          const s = modalStakeholder;
          const heat = getHeat(s);
          const touchpoints = getTouchpointCount(s);
          const allInteractions = localInteractions
            .filter(i => i.keyParticipant.toLowerCase().includes(s.name.split(' ')[0].toLowerCase()))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          return (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-background/60 backdrop-blur-md"
                onClick={() => { setModalStakeholder(null); setIsEditingModal(false); }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] max-h-[82vh] overflow-hidden rounded-2xl bg-card border border-border/60 shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={s.avatar} alt={s.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-background"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1a1f36&color=fff&size=56`; }}
                      />
                      {isEditingModal && (
                        <>
                          <button onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                          >
                            <Camera className="w-4 h-4 text-white" />
                          </button>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card"
                        style={{ backgroundColor: sentimentDot(s.sentiment) }}
                      />
                    </div>
                    <div>
                      {isEditingModal ? (
                        <Input value={editName} onChange={e => setEditName(e.target.value)}
                          className="h-7 text-sm font-semibold mb-1 bg-muted/50 border-border/50"
                        />
                      ) : (
                        <div className="text-[15px] font-semibold">{s.name}</div>
                      )}
                      {isEditingModal ? (
                        <Input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                          className="h-6 text-xs bg-muted/50 border-border/50"
                        />
                      ) : (
                        <div className="text-[12px] text-muted-foreground">{s.title}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditingModal ? (
                      <>
                        <button onClick={handleModalSave}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                        >
                          <Check className="w-3 h-3" /> Save
                        </button>
                        <button onClick={() => setIsEditingModal(false)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setIsEditingModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    )}
                    <button onClick={() => { setModalStakeholder(null); setIsEditingModal(false); }}
                      className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Modal body */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Decision Stance</div>
                      {isEditingModal ? (
                        <div className="flex gap-2">
                          {(['Positive', 'Neutral', 'Negative'] as const).map(sent => (
                            <button key={sent} onClick={() => setEditSentiment(sent)}
                              className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors border ${
                                editSentiment === sent
                                  ? sent === 'Positive' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                    : sent === 'Neutral' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                    : 'bg-red-500/20 border-red-500/50 text-red-400'
                                  : 'bg-muted/40 border-border/30 text-muted-foreground hover:bg-muted/60'
                              }`}
                            >
                              {sent}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sentimentDot(s.sentiment) }} />
                          <span className={`text-[13px] font-medium ${sentimentLabel(s.sentiment)}`}>{s.sentiment}</span>
                        </div>
                      )}
                    </div>
                    {s.email && (
                      <div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contact</div>
                        <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 text-[11px] text-primary hover:underline">
                          <Mail className="w-3 h-3" /> {s.email}
                        </a>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Roles</div>
                    {isEditingModal ? (
                      <div className="flex flex-wrap gap-2">
                        {ALL_ROLES.map(r => {
                          const active = editRoles.includes(r);
                          return (
                            <button key={r}
                              onClick={() => setEditRoles(prev => active ? prev.filter(x => x !== r) : [...prev, r])}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border ${
                                active ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-muted/40 border-border/30 text-muted-foreground hover:bg-muted/60'
                              }`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(s.roles ?? [s.role]).map(r => (
                          <Badge key={r} variant="outline" className={`text-[11px] px-2 py-0.5 ${getRoleColor(r as Stakeholder['role'])}`}>{r}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5" style={{ color: getHeatColor(heat) }} />
                        <span className="text-[11px] font-semibold">Engagement Heat ({heatWindow})</span>
                      </div>
                      <span className="text-[11px] font-medium" style={{ color: getHeatColor(heat) }}>
                        {touchpoints} touchpoints · {getHeatLabel(heat)}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${heat * 100}%`, background: getHeatColor(heat) }} />
                    </div>
                  </div>

                  {s.keyInsights && (
                    <div>
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Insights</div>
                      <p className="text-[12px] text-foreground/80 leading-relaxed">{s.keyInsights}</p>
                    </div>
                  )}

                  {/* Full interaction history in modal — also editable */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Interaction History ({allInteractions.length})
                      </div>
                      <button
                        onClick={() => addInteraction(s.name)}
                        className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {allInteractions.map(interaction => {
                        const isEditingThis = editingInteraction === interaction.id;
                        return (
                          <div key={interaction.id}
                            className={`rounded-lg border transition-colors ${
                              isEditingThis
                                ? 'bg-muted/50 border-primary/30 p-3'
                                : 'bg-muted/20 border-border/20 p-2.5'
                            }`}
                          >
                            {isEditingThis ? (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <select
                                    value={interaction.type}
                                    onChange={(e) => updateInteraction(interaction.id, { type: e.target.value as Interaction['type'] })}
                                    className="flex-1 text-[11px] bg-background border border-border/50 rounded px-2 py-1.5 text-foreground"
                                  >
                                    {INTERACTION_TYPES.map(t => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="date"
                                    value={typeof interaction.date === 'string' ? interaction.date : new Date(interaction.date).toISOString().slice(0, 10)}
                                    onChange={(e) => updateInteraction(interaction.id, { date: e.target.value })}
                                    className="text-[11px] bg-background border border-border/50 rounded px-2 py-1.5 text-foreground"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                                  <input
                                    type="number"
                                    value={interaction.duration}
                                    onChange={(e) => updateInteraction(interaction.id, { duration: Number(e.target.value) })}
                                    className="w-16 text-[11px] bg-background border border-border/50 rounded px-2 py-1.5 text-foreground"
                                    min={1}
                                  />
                                  <span className="text-[11px] text-muted-foreground">minutes</span>
                                </div>
                                <textarea
                                  value={interaction.summary}
                                  onChange={(e) => updateInteraction(interaction.id, { summary: e.target.value })}
                                  placeholder="Meeting notes..."
                                  rows={3}
                                  className="w-full text-[11px] bg-background border border-border/50 rounded px-2 py-1.5 text-foreground resize-none leading-relaxed"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingInteraction(null)}
                                    className="flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                  >
                                    <Check className="w-3 h-3" /> Save
                                  </button>
                                  <button
                                    onClick={() => deleteInteraction(interaction.id)}
                                    className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-[11px]"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[11px] font-medium">{interaction.type}</span>
                                    <span className="text-[10px] text-muted-foreground">{(typeof interaction.date === 'string' ? interaction.date : new Date(interaction.date).toISOString().slice(0, 10)).slice(5)}</span>
                                    <span className="text-[10px] text-muted-foreground ml-auto">{interaction.duration}m</span>
                                    <button
                                      onClick={() => setEditingInteraction(interaction.id)}
                                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted/60 transition-colors"
                                    >
                                      <Pencil className="w-3 h-3 text-muted-foreground/60" />
                                    </button>
                                  </div>
                                  {interaction.summary && (
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">{interaction.summary}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {allInteractions.length === 0 && (
                        <div className="text-[11px] text-muted-foreground/60 text-center py-4">
                          No interactions yet — click Add to record one
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

// ── Default connections builder ───────────────────────────────────────────────
function buildDefaultConnections(stakeholders: Stakeholder[], stages: string[]): Connection[] {
  const result: Connection[] = [];
  stakeholders.forEach(s1 => {
    stakeholders.forEach(s2 => {
      if (s1.id >= s2.id) return;
      const idx1 = stages.indexOf(s1.stage || '');
      const idx2 = stages.indexOf(s2.stage || '');
      if (idx1 < 0 || idx2 < 0) return;
      if (Math.abs(idx1 - idx2) <= 1) {
        result.push({
          id: nanoid(8),
          from: s1.id,
          to: s2.id,
          type: s1.role === 'Blocker' || s2.role === 'Blocker' ? 'blocks' : 'reports_to',
        });
      }
    });
  });
  return result;
}
