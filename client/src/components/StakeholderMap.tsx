/**
 * StakeholderMap — Intelligence Cartography design system
 * Features:
 * - View / Edit mode toggle
 * - Drag nodes (edit mode)
 * - Add / Remove stakeholders
 * - Draw, re-route, and type-label connections
 * - Connection types: Reports To | Influences | Collaborates | Blocks
 * - localStorage persistence per deal
 * - Correct layout on deal switch (positions reset per deal)
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stakeholder, Deal } from '@/lib/data';
import { getRoleColor } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  ZoomIn, ZoomOut, Maximize2, Edit2, Eye, Plus, Trash2,
  Link2, Link2Off, Save, RotateCcw, Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

interface StakeholderMapProps {
  deal: Deal;
  onStakeholderClick?: (stakeholder: Stakeholder) => void;
  onStakeholdersChange?: (stakeholders: Stakeholder[]) => void;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

export type ConnectionType = 'reports_to' | 'influences' | 'collaborates' | 'blocks';

export interface Connection {
  id: string;
  from: string;
  to: string;
  type: ConnectionType;
}

const CONNECTION_TYPES: { value: ConnectionType; label: string; color: string; dash?: string }[] = [
  { value: 'reports_to',   label: 'Reports To',   color: 'rgba(99,130,255,0.55)',  dash: 'none' },
  { value: 'influences',   label: 'Influences',   color: 'rgba(16,185,129,0.5)',   dash: 'none' },
  { value: 'collaborates', label: 'Collaborates', color: 'rgba(245,158,11,0.5)',   dash: '6 3' },
  { value: 'blocks',       label: 'Blocks',       color: 'rgba(239,68,68,0.5)',    dash: '4 3' },
];

const NODE_W = 160;
const NODE_H = 110;

const AVATAR_POOL = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mx&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ny&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oz&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Pw&backgroundColor=ffd5dc',
];

// ── localStorage helpers ──────────────────────────────────────────────────────
function storageKey(dealId: string) { return `meridian_map_${dealId}`; }

interface PersistedMapState {
  positions: NodePosition[];
  connections: Connection[];
  stakeholders: Stakeholder[];
}

function loadState(dealId: string): PersistedMapState | null {
  try {
    const raw = localStorage.getItem(storageKey(dealId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState(dealId: string, state: PersistedMapState) {
  try { localStorage.setItem(storageKey(dealId), JSON.stringify(state)); } catch {}
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
      y: 30 + row * (NODE_H + 30),
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function StakeholderMap({ deal, onStakeholderClick, onStakeholdersChange }: StakeholderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(800);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // ── Per-deal state (reset when deal.id changes) ───────────────────────────
  const [currentDealId, setCurrentDealId] = useState(deal.id);
  const [localStakeholders, setLocalStakeholders] = useState<Stakeholder[]>([]);
  const [positions, setPositions] = useState<NodePosition[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  // Load or initialise state when deal changes
  useEffect(() => {
    setCurrentDealId(deal.id);
    setMode('view');
    setConnectingFrom(null);
    setSelectedConnId(null);

    const saved = loadState(deal.id);
    if (saved) {
      setLocalStakeholders(saved.stakeholders);
      setPositions(saved.positions);
      setConnections(saved.connections);
    } else {
      const stks = deal.stakeholders;
      const pos = computeInitialPositions(stks, deal.buyingStages, containerW || 800);
      // build default connections from adjacency
      const defConns = buildDefaultConnections(stks, deal.buyingStages);
      setLocalStakeholders(stks);
      setPositions(pos);
      setConnections(defConns);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal.id]);

  // Observe container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      setContainerW(entries[0].contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Drag state ────────────────────────────────────────────────────────────
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, nx: 0, ny: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // ── Connection drawing state ──────────────────────────────────────────────
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [pendingConnType, setPendingConnType] = useState<ConnectionType>('reports_to');

  // ── Connection editing state ──────────────────────────────────────────────
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);
  const [connEditPopup, setConnEditPopup] = useState<{ connId: string; x: number; y: number } | null>(null);

  const getPos = useCallback((id: string) => positions.find(p => p.id === id), [positions]);

  // ── Save to localStorage ──────────────────────────────────────────────────
  const handleSave = () => {
    saveState(currentDealId, { positions, connections, stakeholders: localStakeholders });
    toast.success('Map saved');
  };

  // ── Reset layout ──────────────────────────────────────────────────────────
  const handleReset = () => {
    const pos = computeInitialPositions(localStakeholders, deal.buyingStages, containerW);
    setPositions(pos);
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
    setDragStart({ mx: e.clientX, my: e.clientY, nx: pos.x, ny: pos.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const dx = (e.clientX - dragStart.mx) / zoom;
    const dy = (e.clientY - dragStart.my) / zoom;
    setPositions(prev => prev.map(p =>
      p.id === dragging ? { ...p, x: dragStart.nx + dx, y: dragStart.ny + dy } : p
    ));
  }, [dragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  // ── Node click ────────────────────────────────────────────────────────────
  const handleNodeClick = (e: React.MouseEvent, stakeholder: Stakeholder) => {
    e.stopPropagation();
    setConnEditPopup(null);

    if (mode === 'edit' && connectingFrom) {
      if (connectingFrom === stakeholder.id) {
        setConnectingFrom(null);
        return;
      }
      // Toggle connection
      const exists = connections.find(
        c => (c.from === connectingFrom && c.to === stakeholder.id) ||
             (c.from === stakeholder.id && c.to === connectingFrom)
      );
      if (exists) {
        setConnections(prev => prev.filter(c => c.id !== exists.id));
        toast('Connection removed');
      } else {
        setConnections(prev => [...prev, {
          id: nanoid(8),
          from: connectingFrom,
          to: stakeholder.id,
          type: pendingConnType,
        }]);
        toast(`"${pendingConnType.replace('_', ' ')}" connection added`);
      }
      setConnectingFrom(null);
      return;
    }

    setSelectedNodeId(prev => prev === stakeholder.id ? null : stakeholder.id);
    onStakeholderClick?.(stakeholder);
  };

  // ── Connection line click (edit mode) ─────────────────────────────────────
  const handleConnClick = (e: React.MouseEvent, connId: string) => {
    if (mode !== 'edit') return;
    e.stopPropagation();
    setSelectedConnId(connId);
    setConnEditPopup({ connId, x: e.clientX, y: e.clientY });
  };

  // ── Add / Remove stakeholder ──────────────────────────────────────────────
  const handleAddStakeholder = () => {
    const newS: Stakeholder = {
      id: `s-${nanoid(6)}`,
      name: 'New Contact',
      title: 'Title',
      role: 'Influencer',
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
    setLocalStakeholders(prev => {
      const updated = prev.filter(s => s.id !== id);
      onStakeholdersChange?.(updated);
      return updated;
    });
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    setPositions(prev => prev.filter(p => p.id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    toast('Stakeholder removed');
  };

  // ── Connection endpoint re-routing ────────────────────────────────────────
  const [reroutingConn, setReroutingConn] = useState<{ connId: string; end: 'from' | 'to' } | null>(null);

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
      return reroutingConn.end === 'from'
        ? { ...c, from: stakeholderId }
        : { ...c, to: stakeholderId };
    }));
    setReroutingConn(null);
    toast('Connection re-routed');
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const sentimentDot = (s: string) =>
    s === 'Positive' ? '#10b981' : s === 'Neutral' ? '#f59e0b' : '#ef4444';

  const connConfig = (type: ConnectionType) =>
    CONNECTION_TYPES.find(t => t.value === type) ?? CONNECTION_TYPES[0];

  const stageOrder = deal.buyingStages;

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      {/* Stage column headers */}
      <div className="absolute top-0 left-0 right-0 flex border-b border-border/30 bg-card/80 backdrop-blur-sm z-10">
        {stageOrder.map((stage, i) => (
          <div key={stage} className="flex-1 text-center py-2.5 border-r border-border/20 last:border-r-0">
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Stage {i + 1}</div>
            <div className="text-xs font-display font-medium mt-0.5">{stage}</div>
          </div>
        ))}
      </div>

      {/* Top-right controls */}
      <div className="absolute top-14 right-3 z-20 flex flex-col gap-1.5">
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
          <button
            key={i}
            onClick={btn.action}
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-12 right-3 z-20 flex flex-col gap-1.5"
          >
            {/* Save */}
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-medium hover:bg-emerald-700 transition-colors shadow-md"
            >
              <Save className="w-3 h-3" /> Save Map
            </button>

            {/* Add Person */}
            <button
              onClick={handleAddStakeholder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors shadow-md"
            >
              <Plus className="w-3 h-3" /> Add Person
            </button>

            {/* Draw Link — with type selector */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  if (connectingFrom) { setConnectingFrom(null); toast('Connection mode cancelled'); }
                  else { setConnectingFrom('__pending__'); toast('Select connection type below, then click two people'); }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors shadow-md ${
                  connectingFrom
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-muted border border-border/50 hover:bg-muted/80'
                }`}
              >
                {connectingFrom ? <Link2Off className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                {connectingFrom ? 'Cancel Link' : 'Draw Link'}
              </button>

              {/* Connection type selector (shown when draw mode active) */}
              <AnimatePresence>
                {connectingFrom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-0.5 overflow-hidden"
                  >
                    {CONNECTION_TYPES.map(ct => (
                      <button
                        key={ct.value}
                        onClick={() => setPendingConnType(ct.value)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] transition-colors ${
                          pendingConnType === ct.value
                            ? 'bg-card border border-primary/50 text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <div className="w-4 h-px" style={{ background: ct.color, borderTop: ct.dash !== 'none' ? `1px dashed ${ct.color}` : undefined }} />
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

      {/* Connecting / re-routing hint banner */}
      <AnimatePresence>
        {(connectingFrom && connectingFrom !== '__pending__') && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-[58px] left-1/2 -translate-x-1/2 z-30 bg-amber-500/90 text-white text-[10px] px-3 py-1 rounded-full shadow-md"
          >
            Click another person to link — or click same person to cancel
          </motion.div>
        )}
        {reroutingConn && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
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
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className="fixed z-50 bg-card border border-border/60 rounded-xl shadow-2xl p-3 w-52"
            style={{ left: Math.min(connEditPopup.x, window.innerWidth - 220), top: Math.min(connEditPopup.y, window.innerHeight - 260) }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-display font-semibold">Edit Connection</span>
              <button onClick={() => setConnEditPopup(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
            </div>

            {/* Type selector */}
            <div className="mb-3">
              <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Relationship Type</div>
              <div className="flex flex-col gap-1">
                {CONNECTION_TYPES.map(ct => {
                  const conn = connections.find(c => c.id === connEditPopup.connId);
                  const isActive = conn?.type === ct.value;
                  return (
                    <button
                      key={ct.value}
                      onClick={() => {
                        setConnections(prev => prev.map(c =>
                          c.id === connEditPopup.connId ? { ...c, type: ct.value } : c
                        ));
                      }}
                      className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] transition-colors ${
                        isActive ? 'bg-primary/10 text-primary border border-primary/30' : 'hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className="w-5 h-px shrink-0" style={{ background: ct.color }} />
                      {ct.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Re-route endpoints */}
            <div className="mb-3">
              <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Re-route Endpoint</div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleRerouteClick(connEditPopup.connId, 'from')}
                  className="flex-1 text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                >
                  Change Source
                </button>
                <button
                  onClick={() => handleRerouteClick(connEditPopup.connId, 'to')}
                  className="flex-1 text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                >
                  Change Target
                </button>
              </div>
            </div>

            {/* Delete connection */}
            <button
              onClick={() => {
                setConnections(prev => prev.filter(c => c.id !== connEditPopup.connId));
                setConnEditPopup(null);
                toast('Connection deleted');
              }}
              className="w-full text-[10px] px-2 py-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              Delete Connection
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div
        className="absolute inset-0 top-[52px] overflow-auto"
        style={{ cursor: dragging ? 'grabbing' : (connectingFrom || reroutingConn) ? 'crosshair' : 'default' }}
        onClick={() => { setConnEditPopup(null); }}
      >
        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none">
          <defs>
            <pattern id="dotgrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.7" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotgrid)" />
        </svg>

        {/* Column dividers */}
        {stageOrder.map((_, i) => i === 0 ? null : (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-border/10"
            style={{ left: `${(i / stageOrder.length) * 100}%` }}
          />
        ))}

        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: '100%',
            minHeight: '100%',
            position: 'relative',
          }}
        >
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

              // Midpoint for label
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2 - 8;

              return (
                <g key={conn.id}>
                  {/* Invisible wide hit area */}
                  <path
                    d={`M ${x1} ${y1} C ${cpx1} ${y1}, ${cpx2} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="12"
                    style={{ cursor: mode === 'edit' ? 'pointer' : 'default' }}
                    onClick={(e) => handleConnClick(e as unknown as React.MouseEvent, conn.id)}
                  />
                  {/* Visible line */}
                  <path
                    d={`M ${x1} ${y1} C ${cpx1} ${y1}, ${cpx2} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={isSelected ? 'rgba(255,255,255,0.7)' : cfg.color}
                    strokeWidth={isSelected ? 2 : 1.5}
                    strokeDasharray={cfg.dash === 'none' ? undefined : cfg.dash}
                    markerEnd={`url(#arrow-${conn.type})`}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Relationship label on line */}
                  {mode === 'edit' && (
                    <text
                      x={mx} y={my}
                      textAnchor="middle"
                      fontSize="9"
                      fill={cfg.color}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {cfg.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Stakeholder nodes */}
          {localStakeholders.map((stakeholder, idx) => {
            const pos = getPos(stakeholder.id);
            if (!pos) return null;
            const isSelected = selectedNodeId === stakeholder.id;
            const isDragging = dragging === stakeholder.id;
            const isConnSrc = connectingFrom === stakeholder.id;
            const isPendingConn = connectingFrom === '__pending__';
            const isRerouting = !!reroutingConn;

            return (
              <motion.div
                key={stakeholder.id}
                className={`absolute select-none ${isDragging ? 'z-30' : 'z-20'}`}
                style={{ left: pos.x, top: pos.y, width: NODE_W }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: isDragging ? 1.04 : 1 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                onMouseDown={(e) => handleMouseDown(e, stakeholder.id)}
              >
                <Card
                  className={`bg-card border transition-all duration-150 ${
                    mode === 'edit' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  } ${
                    isConnSrc
                      ? 'border-amber-400/80 shadow-lg shadow-amber-400/20 ring-1 ring-amber-400/30'
                      : (isPendingConn || isRerouting)
                        ? 'border-blue-400/60 hover:border-blue-400/90 hover:shadow-md hover:shadow-blue-400/10'
                        : isSelected
                          ? 'border-primary/60 shadow-lg shadow-primary/10 ring-1 ring-primary/20'
                          : isDragging
                            ? 'border-primary/40 shadow-xl'
                            : 'border-border/50 hover:border-border/80 hover:shadow-md'
                  }`}
                  onClick={(e) => {
                    if (reroutingConn) { handleRerouteTarget(e, stakeholder.id); return; }
                    if (connectingFrom === '__pending__') { setConnectingFrom(stakeholder.id); return; }
                    handleNodeClick(e, stakeholder);
                  }}
                >
                  <div className="p-3">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="relative shrink-0">
                        <img
                          src={stakeholder.avatar}
                          alt={stakeholder.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-background"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(stakeholder.name)}&background=1a1f36&color=fff&size=44`;
                          }}
                        />
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card"
                          style={{ backgroundColor: sentimentDot(stakeholder.sentiment) }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold leading-tight truncate">{stakeholder.name}</div>
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
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${getRoleColor(stakeholder.role)}`}>
                        {stakeholder.role}
                      </Badge>
                      {stakeholder.engagement === 'Low' && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-status-warning/10 text-status-warning border-status-warning/30">
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 text-[10px] text-muted-foreground bg-card/90 backdrop-blur-sm rounded-md px-3 py-2 border border-border/30 flex-wrap">
        {CONNECTION_TYPES.map(ct => (
          <div key={ct.value} className="flex items-center gap-1.5">
            <div className="w-5 h-px" style={{ background: ct.color }} />
            <span>{ct.label}</span>
          </div>
        ))}
        <div className="w-px h-3 bg-border/40 mx-0.5" />
        {[
          { color: '#10b981', label: 'Positive' },
          { color: '#f59e0b', label: 'Neutral' },
          { color: '#ef4444', label: 'Negative' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
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
