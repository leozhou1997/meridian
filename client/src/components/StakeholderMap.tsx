/**
 * StakeholderMap — Intelligence Cartography design system
 * v7 Features (2026-03):
 * - FIX: Drag-to-edit bug — modal only opens on true click (movement < 5px)
 * - FIX: Collision detection — iterative multi-pass resolution prevents overlap
 * - NEW: Connection line labels shown in BOTH View and Edit modes
 * - NEW: Expandable interaction history at bottom of each card (mini accordion)
 * - NEW: Drag handle icon visible in Edit mode on each card
 * - NEW: Edit mode activates dotted background pattern (stronger visual cue)
 * - NEW: Stage column dividers are more prominent with colored zone headers
 * - KEEP: All v6 features (heat bars, hover tooltip, click modal, zoom, localStorage)
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stakeholder, Deal } from '@/lib/data';
import { getRoleColor } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ZoomIn, ZoomOut, Maximize2, Edit2, Eye, Plus, Trash2,
  Link2, Link2Off, Save, X, Check, Camera, Mail, Flame,
  GripVertical, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

interface StakeholderMapProps {
  deal: Deal;
  onStakeholderClick?: (stakeholder: Stakeholder) => void;
  onStakeholdersChange?: (stakeholders: Stakeholder[]) => void;
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
  { value: 'reports_to',   label: 'Reports To',   color: 'rgba(99,130,255,0.7)',   dash: 'none' },
  { value: 'influences',   label: 'Influences',   color: 'rgba(16,185,129,0.65)',  dash: 'none' },
  { value: 'collaborates', label: 'Collaborates', color: 'rgba(245,158,11,0.65)',  dash: '6 3' },
  { value: 'blocks',       label: 'Blocks',       color: 'rgba(239,68,68,0.7)',    dash: '4 3' },
];

const NODE_W = 200;
const NODE_H = 140;   // base height without expanded interactions
const CARD_GAP = 20;  // minimum gap between card edges

const AVATAR_POOL = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mx&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ny&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oz&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Pw&backgroundColor=ffd5dc',
];

// ── localStorage helpers ──────────────────────────────────────────────────────
function storageKey(dealId: string) { return `meridian_map_v2_${dealId}`; }

interface PersistedMapState {
  positions: NodePosition[];
  connections: Connection[];
}

function loadState(dealId: string): PersistedMapState | null {
  try {
    const raw = localStorage.getItem(storageKey(dealId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const { positions, connections } = parsed;
    if (!Array.isArray(positions)) return null;
    return { positions, connections: connections ?? [] };
  } catch { return null; }
}

function saveState(dealId: string, state: PersistedMapState) {
  try {
    localStorage.setItem(storageKey(dealId), JSON.stringify({
      positions: state.positions,
      connections: state.connections,
    }));
  } catch {}
}

// ── Heat score calculation ────────────────────────────────────────────────────
function computeHeatScore(
  stakeholderName: string,
  interactions: Deal['interactions'],
  window: HeatWindow,
  maxCount: number,
): number {
  const days = window === 'L7D' ? 7 : window === 'L14D' ? 14 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const count = interactions.filter(i => {
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

// ── Auto-layout ───────────────────────────────────────────────────────────────
function computeInitialPositions(
  stakeholders: Stakeholder[],
  stages: string[],
  containerW: number,
): NodePosition[] {
  const colW = containerW / Math.max(stages.length, 1);
  const stageSlots: Record<string, number> = {};
  return stakeholders.map(s => {
    const stageIdx = stages.indexOf(s.stage || '');
    const col = stageIdx >= 0 ? stageIdx : 0;
    const key = s.stage || '__none__';
    stageSlots[key] = (stageSlots[key] ?? 0);
    const row = stageSlots[key];
    stageSlots[key] = row + 1;
    return {
      id: s.id,
      x: col * colW + (colW - NODE_W) / 2,
      y: 40 + row * (NODE_H + 36),
    };
  });
}

// ── Collision resolution (multi-pass iterative) ───────────────────────────────
/**
 * Given a set of positions and the id of the card being dragged to (rawX, rawY),
 * resolve all overlaps by pushing OTHER cards away. Returns updated positions.
 * We run up to MAX_PASSES iterations to handle chain reactions.
 */
function resolveCollisions(
  positions: NodePosition[],
  draggingId: string,
  rawX: number,
  rawY: number,
  maxX: number,
): NodePosition[] {
  // Start with the dragged card at its new position
  let result = positions.map(p =>
    p.id === draggingId ? { ...p, x: rawX, y: rawY } : p
  );

  const MAX_PASSES = 8;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let anyOverlap = false;
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        const overlapX = Math.abs(a.x - b.x) < NODE_W + CARD_GAP;
        const overlapY = Math.abs(a.y - b.y) < NODE_H + CARD_GAP;
        if (!overlapX || !overlapY) continue;

        anyOverlap = true;
        // The dragged card is fixed; push the other one
        // If neither is the dragged card, push both symmetrically
        const aIsDragged = a.id === draggingId;
        const bIsDragged = b.id === draggingId;

        const sepX = NODE_W + CARD_GAP - Math.abs(a.x - b.x);
        const sepY = NODE_H + CARD_GAP - Math.abs(a.y - b.y);

        // Resolve along the axis with less penetration
        if (sepX < sepY) {
          const pushX = sepX / 2;
          const dirX = a.x <= b.x ? -1 : 1;
          if (!aIsDragged) result[i] = { ...a, x: Math.max(0, Math.min(a.x + dirX * pushX, maxX)) };
          if (!bIsDragged) result[j] = { ...b, x: Math.max(0, Math.min(b.x - dirX * pushX, maxX)) };
        } else {
          const pushY = sepY / 2;
          const dirY = a.y <= b.y ? -1 : 1;
          if (!aIsDragged) result[i] = { ...a, y: Math.max(0, a.y + dirY * pushY) };
          if (!bIsDragged) result[j] = { ...b, y: Math.max(0, b.y - dirY * pushY) };
        }
      }
    }
    if (!anyOverlap) break;
  }

  return result;
}

// ── Sentiment helpers ─────────────────────────────────────────────────────────
const sentimentDot = (s: string) =>
  s === 'Positive' ? '#10b981' : s === 'Neutral' ? '#f59e0b' : '#ef4444';

const sentimentLabel = (s: string) =>
  s === 'Positive' ? 'text-emerald-400' : s === 'Neutral' ? 'text-amber-400' : 'text-red-400';

// ── Component ─────────────────────────────────────────────────────────────────
export default function StakeholderMap({ deal, onStakeholderClick, onStakeholdersChange }: StakeholderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(800);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [heatWindow, setHeatWindow] = useState<HeatWindow>('L14D');

  // ── Per-deal state ────────────────────────────────────────────────────────
  const [currentDealId, setCurrentDealId] = useState(deal.id);
  const [localStakeholders, setLocalStakeholders] = useState<Stakeholder[]>([]);
  const [positions, setPositions] = useState<NodePosition[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  // ── Hover tooltip state ───────────────────────────────────────────────────
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // ── Expanded interaction history on cards ─────────────────────────────────
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

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

    const stks = deal.stakeholders;
    setLocalStakeholders(stks);

    const actualW = containerRef.current?.getBoundingClientRect().width || containerW || 900;
    const saved = loadState(deal.id);

    if (saved && saved.positions.length > 0) {
      const validIds = new Set(stks.map(s => s.id));
      const validPositions = saved.positions.filter(p => validIds.has(p.id));
      if (validPositions.length === stks.length) {
        setPositions(validPositions);
        setConnections(saved.connections ?? []);
      } else {
        setPositions(computeInitialPositions(stks, deal.buyingStages, actualW));
        setConnections(buildDefaultConnections(stks, deal.buyingStages));
      }
    } else {
      setPositions(computeInitialPositions(stks, deal.buyingStages, actualW));
      setConnections(buildDefaultConnections(stks, deal.buyingStages));
    }
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
      return deal.interactions.filter(i => {
        const d = new Date(i.date);
        return d >= cutoff && i.keyParticipant.toLowerCase().includes(s.name.split(' ')[0].toLowerCase());
      }).length;
    }),
    1
  );

  const getHeat = (s: Stakeholder) => computeHeatScore(s.name, deal.interactions, heatWindow, maxTouchpoints);

  const getTouchpointCount = (s: Stakeholder) => {
    const days = heatWindow === 'L7D' ? 7 : heatWindow === 'L14D' ? 14 : 30;
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    return deal.interactions.filter(i => {
      const d = new Date(i.date);
      return d >= cutoff && i.keyParticipant.toLowerCase().includes(s.name.split(' ')[0].toLowerCase());
    }).length;
  };

  const getStakeholderInteractions = (s: Stakeholder) =>
    deal.interactions
      .filter(i => i.keyParticipant.toLowerCase().includes(s.name.split(' ')[0].toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ── Drag state ────────────────────────────────────────────────────────────
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, nx: 0, ny: 0 });
  const [dragMoved, setDragMoved] = useState(false); // track if significant movement occurred
  const [zoom, setZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // ── Connection drawing state ──────────────────────────────────────────────
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [pendingConnType, setPendingConnType] = useState<ConnectionType>('reports_to');
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);
  const [connEditPopup, setConnEditPopup] = useState<{ connId: string; x: number; y: number } | null>(null);
  const [reroutingConn, setReroutingConn] = useState<{ connId: string; end: 'from' | 'to' } | null>(null);

  const getPos = useCallback((id: string) => positions.find(p => p.id === id), [positions]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    saveState(currentDealId, { positions, connections });
    toast.success('Map saved');
  };

  const handleReset = () => {
    setPositions(computeInitialPositions(localStakeholders, deal.buyingStages, containerW));
    setZoom(1);
  };

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (mode !== 'edit') return;
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

    // Mark as "moved" if displacement > 5px (distinguishes click from drag)
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

  // On mouseup: if no significant movement occurred, treat as a click → open modal
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (dragging && !dragMoved) {
      // True click — find the stakeholder and open modal
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

    // In edit mode, clicks are handled by mouseup (drag-click distinction)
    // In view mode, open modal directly
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
      stage: deal.buyingStages[0],
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
  const stageOrder = deal.buyingStages;

  const ALL_ROLES = ['Champion', 'Decision Maker', 'Influencer', 'Blocker', 'User', 'Evaluator'];

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      {/* Stage column headers — more prominent in edit mode */}
      <div className={`absolute top-0 left-0 right-0 flex border-b z-10 transition-colors duration-300 ${
        mode === 'edit'
          ? 'border-primary/30 bg-primary/5 backdrop-blur-sm'
          : 'border-border/30 bg-card/80 backdrop-blur-sm'
      }`}>
        {stageOrder.map((stage, i) => (
          <div key={stage} className={`flex-1 text-center py-2.5 border-r last:border-r-0 transition-colors ${
            mode === 'edit' ? 'border-primary/20' : 'border-border/20'
          }`}>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Stage {i + 1}</div>
            <div className="text-xs font-display font-medium mt-0.5">{stage}</div>
          </div>
        ))}
      </div>

      {/* Top-right controls */}
      <div className="absolute top-14 right-3 z-20 flex flex-col gap-1.5">
        {/* Heat window selector */}
        <div className="flex rounded-lg overflow-hidden border border-border/50 bg-muted/80 mb-1">
          {(['L7D', 'L14D', 'L30D'] as HeatWindow[]).map(w => (
            <button
              key={w}
              onClick={() => setHeatWindow(w)}
              className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium transition-colors ${
                heatWindow === w ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {w === heatWindow && <Flame className="w-2.5 h-2.5 text-orange-400" />}
              {w}
            </button>
          ))}
        </div>

        {/* View / Edit toggle */}
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

        {/* Zoom controls */}
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

      {/* Canvas */}
      <div
        className="absolute inset-0 top-[52px] overflow-auto"
        style={{ cursor: dragging ? 'grabbing' : (connectingFrom || reroutingConn) ? 'crosshair' : 'default' }}
        onClick={() => { setConnEditPopup(null); setHoveredId(null); }}
      >
        {/* Background: subtle dot grid always; denser + colored in edit mode */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: mode === 'edit' ? 0.12 : 0.04 }}>
          <defs>
            <pattern id="dotgrid-view" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.7" fill="currentColor" />
            </pattern>
            <pattern id="dotgrid-edit" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="8" cy="8" r="1" fill={mode === 'edit' ? 'hsl(var(--primary))' : 'currentColor'} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${mode === 'edit' ? 'dotgrid-edit' : 'dotgrid-view'})`} />
        </svg>

        {/* Column dividers — more visible in edit mode */}
        {stageOrder.map((_, i) => i === 0 ? null : (
          <div key={i}
            className={`absolute top-0 bottom-0 transition-all duration-300 ${
              mode === 'edit'
                ? 'w-px bg-primary/20'
                : 'w-px bg-border/15'
            }`}
            style={{ left: `${(i / stageOrder.length) * 100}%` }}
          />
        ))}

        {/* Stage zone backgrounds in edit mode */}
        {mode === 'edit' && stageOrder.map((_, i) => (
          <div key={i}
            className="absolute top-0 bottom-0 transition-opacity duration-300"
            style={{
              left: `${(i / stageOrder.length) * 100}%`,
              width: `${(1 / stageOrder.length) * 100}%`,
              background: i % 2 === 0
                ? 'rgba(var(--primary-rgb, 99,102,241), 0.015)'
                : 'transparent',
            }}
          />
        ))}

        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: '100%', minHeight: '100%', position: 'relative' }}>
          {/* SVG connections */}
          <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible', pointerEvents: mode === 'edit' ? 'all' : 'none' }}>
            <defs>
              {CONNECTION_TYPES.map(ct => (
                <marker key={ct.value} id={`arrow-${ct.value}`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill={ct.color} />
                </marker>
              ))}
            </defs>
            {connections.map(conn => {
              const fromPos = getPos(conn.from);
              const toPos = getPos(conn.to);
              if (!fromPos || !toPos) return null;
              const x1 = fromPos.x + NODE_W / 2;
              const y1 = fromPos.y + NODE_H / 2;
              const x2 = toPos.x + NODE_W / 2;
              const y2 = toPos.y + NODE_H / 2;
              const cpx1 = x1 + (x2 - x1) * 0.4;
              const cpx2 = x1 + (x2 - x1) * 0.6;
              const cfg = connConfig(conn.type);
              const isSelected = selectedConnId === conn.id;
              // Label position: midpoint of the bezier curve (approximate)
              const mx = (x1 + cpx1 + cpx2 + x2) / 4;
              const my = (y1 + y1 + y2 + y2) / 4 - 10;
              return (
                <g key={conn.id}>
                  {/* Wide invisible hit area */}
                  <path d={`M ${x1} ${y1} C ${cpx1} ${y1}, ${cpx2} ${y2}, ${x2} ${y2}`}
                    fill="none" stroke="transparent" strokeWidth="14"
                    style={{ cursor: mode === 'edit' ? 'pointer' : 'default' }}
                    onClick={(e) => handleConnClick(e as unknown as React.MouseEvent, conn.id)}
                  />
                  {/* Visible line */}
                  <path d={`M ${x1} ${y1} C ${cpx1} ${y1}, ${cpx2} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={isSelected ? 'rgba(255,255,255,0.8)' : cfg.color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeDasharray={cfg.dash === 'none' ? undefined : cfg.dash}
                    markerEnd={`url(#arrow-${conn.type})`}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Label — shown in BOTH view and edit mode */}
                  <text
                    x={mx} y={my}
                    textAnchor="middle"
                    fontSize="9"
                    fill={cfg.color}
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
                    isConnSrc
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
                      {/* Bar track */}
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
                    {interactions.length > 0 && (
                      <div className="mt-2 border-t border-border/20 pt-2">
                        <button
                          className="w-full flex items-center justify-between text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCardId(isExpanded ? null : stakeholder.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()} // prevent drag from triggering
                        >
                          <span className="font-medium uppercase tracking-wider">
                            {interactions.length} interaction{interactions.length !== 1 ? 's' : ''}
                          </span>
                          {isExpanded
                            ? <ChevronUp className="w-3 h-3" />
                            : <ChevronDown className="w-3 h-3" />
                          }
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-1.5 space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                                {interactions.slice(0, 5).map(i => (
                                  <div key={i.id} className="p-1.5 rounded bg-muted/30 border border-border/20">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span className="text-[9px] font-medium text-foreground/80">{i.type}</span>
                                      <span className="text-[9px] text-muted-foreground ml-auto">{i.date.slice(5)}</span>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground leading-relaxed line-clamp-2">{i.summary}</p>
                                  </div>
                                ))}
                                {interactions.length > 5 && (
                                  <div className="text-[9px] text-muted-foreground/60 text-center py-0.5">
                                    +{interactions.length - 5} more — click card to view all
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
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
          const recentInteractions = deal.interactions
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
                          <span className="text-[10px] text-muted-foreground/60 ml-auto shrink-0">{i.date.slice(5)}</span>
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
            <div className="w-5 h-px" style={{ background: ct.color }} />
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
          const allInteractions = deal.interactions
            .filter(i => i.keyParticipant.toLowerCase().includes(s.name.split(' ')[0].toLowerCase()))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          return (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-background/60 backdrop-blur-md"
                onClick={() => { setModalStakeholder(null); setIsEditingModal(false); }}
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-h-[80vh] overflow-hidden rounded-2xl bg-card border border-border/60 shadow-2xl flex flex-col"
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
                          <button
                            onClick={() => fileInputRef.current?.click()}
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
                  {/* Sentiment + Roles */}
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

                  {/* Roles */}
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Roles</div>
                    {isEditingModal ? (
                      <div className="flex flex-wrap gap-2">
                        {ALL_ROLES.map(r => {
                          const active = editRoles.includes(r);
                          return (
                            <button key={r}
                              onClick={() => setEditRoles(prev =>
                                active ? prev.filter(x => x !== r) : [...prev, r]
                              )}
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

                  {/* Engagement heat */}
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

                  {/* Key insights */}
                  {s.keyInsights && (
                    <div>
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Insights</div>
                      <p className="text-[12px] text-foreground/80 leading-relaxed">{s.keyInsights}</p>
                    </div>
                  )}

                  {/* Interaction history — full list in modal */}
                  {allInteractions.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Interaction History ({allInteractions.length})
                      </div>
                      <div className="space-y-2">
                        {allInteractions.map(i => (
                          <div key={i.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[11px] font-medium">{i.type}</span>
                                <span className="text-[10px] text-muted-foreground">{i.date}</span>
                                <span className="text-[10px] text-muted-foreground ml-auto">{i.duration}m</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">{i.summary}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
