/**
 * StakeholderMap — Intelligence Cartography design system
 * Supports View mode (read-only) and Edit mode (drag, add/remove nodes, edit connections)
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stakeholder, Deal } from '@/lib/data';
import { getRoleColor } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut, Maximize2, Edit2, Eye, Plus, Trash2, Link2, Link2Off } from 'lucide-react';
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

interface Connection {
  from: string;
  to: string;
  type: 'critical' | 'support';
}

const NODE_W = 160;
const NODE_H = 110;

const AVATAR_POOL = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=A&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=B&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=C&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=D&backgroundColor=ffd5dc',
];

export default function StakeholderMap({ deal, onStakeholderClick, onStakeholdersChange }: StakeholderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 500 });
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // Local stakeholder state (editable copy)
  const [localStakeholders, setLocalStakeholders] = useState<Stakeholder[]>(deal.stakeholders);

  // Sync when deal changes from outside
  useEffect(() => {
    setLocalStakeholders(deal.stakeholders);
  }, [deal.id]);

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height - 52 });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Compute initial positions
  const initialPositions = useMemo(() => {
    const stageOrder = deal.buyingStages;
    const colW = containerSize.w / stageOrder.length;
    const stageSlots: Record<string, number> = {};

    return localStakeholders.map(s => {
      const stageIdx = stageOrder.indexOf(s.stage || '');
      const col = stageIdx >= 0 ? stageIdx : 0;
      stageSlots[s.stage || ''] = stageSlots[s.stage || ''] || 0;
      const row = stageSlots[s.stage || ''];
      stageSlots[s.stage || ''] = row + 1;
      return {
        id: s.id,
        x: col * colW + (colW - NODE_W) / 2,
        y: 30 + row * (NODE_H + 30),
      };
    });
  }, [localStakeholders, deal.buyingStages, containerSize.w]);

  const [positions, setPositions] = useState<NodePosition[]>(initialPositions);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, nx: 0, ny: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Manual connections (edit mode)
  const [manualConnections, setManualConnections] = useState<Connection[]>([]);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null); // id of node being connected

  // Sync positions when stakeholders change
  useEffect(() => {
    setPositions(prev => {
      const existing = new Map(prev.map(p => [p.id, p]));
      return initialPositions.map(ip => existing.get(ip.id) || ip);
    });
  }, [initialPositions]);

  const getPos = useCallback((id: string) => positions.find(p => p.id === id), [positions]);

  // Auto-derived connections (view mode)
  const autoConnections = useMemo<Connection[]>(() => {
    const result: Connection[] = [];
    const stageOrder = deal.buyingStages;
    localStakeholders.forEach(s1 => {
      localStakeholders.forEach(s2 => {
        if (s1.id >= s2.id) return;
        const idx1 = stageOrder.indexOf(s1.stage || '');
        const idx2 = stageOrder.indexOf(s2.stage || '');
        if (Math.abs(idx1 - idx2) <= 1 && idx1 >= 0 && idx2 >= 0) {
          result.push({
            from: s1.id,
            to: s2.id,
            type: s1.role === 'Blocker' || s2.role === 'Blocker' ? 'critical' : 'support',
          });
        }
      });
    });
    return result;
  }, [localStakeholders, deal.buyingStages]);

  const activeConnections = mode === 'edit' ? manualConnections : autoConnections;

  // Initialize manual connections from auto when entering edit mode
  useEffect(() => {
    if (mode === 'edit') {
      setManualConnections(autoConnections);
    }
  }, [mode]);

  // Drag handlers — only in edit mode (or always for view mode dragging)
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (connectingFrom) return; // don't drag while connecting
    e.preventDefault();
    e.stopPropagation();
    const pos = getPos(id);
    if (!pos) return;
    setDragging(id);
    setDragStart({ mx: e.clientX, my: e.clientY, nx: pos.x, ny: pos.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const dx = (e.clientX - dragStart.mx) / zoom;
    const dy = (e.clientY - dragStart.my) / zoom;
    setPositions(prev =>
      prev.map(p =>
        p.id === dragging
          ? { ...p, x: dragStart.nx + dx, y: dragStart.ny + dy }
          : p
      )
    );
  }, [dragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Node click — handle both selection and connection drawing
  const handleNodeClick = (e: React.MouseEvent, stakeholder: Stakeholder) => {
    e.stopPropagation();

    if (mode === 'edit' && connectingFrom) {
      // Complete connection
      if (connectingFrom !== stakeholder.id) {
        const exists = manualConnections.some(
          c => (c.from === connectingFrom && c.to === stakeholder.id) ||
               (c.from === stakeholder.id && c.to === connectingFrom)
        );
        if (exists) {
          // Remove existing connection
          setManualConnections(prev =>
            prev.filter(c =>
              !(c.from === connectingFrom && c.to === stakeholder.id) &&
              !(c.from === stakeholder.id && c.to === connectingFrom)
            )
          );
          toast('Connection removed');
        } else {
          const fromStakeholder = localStakeholders.find(s => s.id === connectingFrom);
          setManualConnections(prev => [
            ...prev,
            {
              from: connectingFrom,
              to: stakeholder.id,
              type: fromStakeholder?.role === 'Blocker' || stakeholder.role === 'Blocker' ? 'critical' : 'support',
            },
          ]);
          toast('Connection added');
        }
      }
      setConnectingFrom(null);
      return;
    }

    setSelectedId(prev => prev === stakeholder.id ? null : stakeholder.id);
    onStakeholderClick?.(stakeholder);
  };

  // Add new stakeholder
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

    // Add position for new node
    setPositions(prev => [
      ...prev,
      { id: newS.id, x: 20, y: 20 + prev.length * (NODE_H + 20) },
    ]);
    toast('New stakeholder added — click to edit their profile');
  };

  // Remove stakeholder
  const handleRemoveStakeholder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = localStakeholders.filter(s => s.id !== id);
    setLocalStakeholders(updated);
    setManualConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    setPositions(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(null);
    onStakeholdersChange?.(updated);
    toast('Stakeholder removed');
  };

  const sentimentDot = (sentiment: string) =>
    sentiment === 'Positive' ? '#10b981' : sentiment === 'Neutral' ? '#f59e0b' : '#ef4444';

  const stageOrder = deal.buyingStages;

  // Effective stakeholders for rendering
  const renderStakeholders = localStakeholders;

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      {/* Stage headers */}
      <div className="absolute top-0 left-0 right-0 flex border-b border-border/30 bg-card/80 backdrop-blur-sm z-10">
        {stageOrder.map((stage, i) => (
          <div key={stage} className="flex-1 text-center py-2.5 border-r border-border/20 last:border-r-0">
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Stage {i + 1}</div>
            <div className="text-xs font-display font-medium mt-0.5">{stage}</div>
          </div>
        ))}
      </div>

      {/* Top-right controls: mode toggle + zoom */}
      <div className="absolute top-14 right-3 z-20 flex flex-col gap-1.5">
        {/* View / Edit toggle */}
        <div className="flex rounded-lg overflow-hidden border border-border/50 bg-muted/80">
          <button
            onClick={() => { setMode('view'); setConnectingFrom(null); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
              mode === 'view' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="w-3 h-3" />
            View
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
              mode === 'edit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        </div>

        {/* Zoom controls */}
        {[
          { icon: ZoomIn, action: () => setZoom(z => Math.min(z + 0.15, 1.5)) },
          { icon: ZoomOut, action: () => setZoom(z => Math.max(z - 0.15, 0.5)) },
          { icon: Maximize2, action: () => { setZoom(1); setPositions(initialPositions); } },
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

      {/* Edit mode toolbar — bottom-right */}
      <AnimatePresence>
        {mode === 'edit' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-12 right-3 z-20 flex flex-col gap-1.5"
          >
            <button
              onClick={handleAddStakeholder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors shadow-md"
            >
              <Plus className="w-3 h-3" />
              Add Person
            </button>
            <button
              onClick={() => {
                if (connectingFrom) {
                  setConnectingFrom(null);
                  toast('Connection mode cancelled');
                } else {
                  setConnectingFrom('__pending__');
                  toast('Click a person to start connecting, then click another to link them');
                }
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connecting mode hint */}
      <AnimatePresence>
        {connectingFrom && connectingFrom !== '__pending__' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-[58px] left-1/2 -translate-x-1/2 z-30 bg-amber-500/90 text-white text-[10px] px-3 py-1 rounded-full shadow-md"
          >
            Click another person to connect — or click same person to cancel
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div
        className="absolute inset-0 top-[52px] overflow-auto"
        style={{ cursor: dragging ? 'grabbing' : connectingFrom ? 'crosshair' : 'default' }}
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
        {stageOrder.map((_, i) => {
          if (i === 0) return null;
          return (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-border/10"
              style={{ left: `${(i / stageOrder.length) * 100}%` }}
            />
          );
        })}

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
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="rgba(99,130,255,0.35)" />
              </marker>
              <marker id="arrowhead-critical" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="rgba(239,68,68,0.4)" />
              </marker>
            </defs>
            {activeConnections.map(conn => {
              const fromPos = getPos(conn.from);
              const toPos = getPos(conn.to);
              if (!fromPos || !toPos) return null;
              const x1 = fromPos.x + NODE_W / 2;
              const y1 = fromPos.y + NODE_H / 2;
              const x2 = toPos.x + NODE_W / 2;
              const y2 = toPos.y + NODE_H / 2;
              const cpx1 = x1 + (x2 - x1) * 0.4;
              const cpx2 = x1 + (x2 - x1) * 0.6;
              const isCritical = conn.type === 'critical';

              return (
                <g key={`${conn.from}-${conn.to}`}>
                  <path
                    d={`M ${x1} ${y1} C ${cpx1} ${y1}, ${cpx2} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={isCritical ? 'rgba(239,68,68,0.35)' : 'rgba(99,130,255,0.3)'}
                    strokeWidth="1.5"
                    strokeDasharray={isCritical ? '6 4' : 'none'}
                    markerEnd={isCritical ? 'url(#arrowhead-critical)' : 'url(#arrowhead)'}
                  />
                </g>
              );
            })}
          </svg>

          {/* Stakeholder nodes */}
          {renderStakeholders.map((stakeholder, idx) => {
            const pos = getPos(stakeholder.id);
            if (!pos) return null;
            const isSelected = selectedId === stakeholder.id;
            const isDragging = dragging === stakeholder.id;
            const isConnectingSource = connectingFrom === stakeholder.id;
            const isPendingConnect = connectingFrom === '__pending__';

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
                    isConnectingSource
                      ? 'border-amber-400/80 shadow-lg shadow-amber-400/20 ring-1 ring-amber-400/30'
                      : isPendingConnect
                        ? 'border-blue-400/60 hover:border-blue-400/90 hover:shadow-md hover:shadow-blue-400/10'
                        : isSelected
                          ? 'border-primary/60 shadow-lg shadow-primary/10 ring-1 ring-primary/20'
                          : isDragging
                            ? 'border-primary/40 shadow-xl'
                            : 'border-border/50 hover:border-border/80 hover:shadow-md'
                  }`}
                  onClick={(e) => {
                    if (connectingFrom === '__pending__') {
                      // Start connecting from this node
                      setConnectingFrom(stakeholder.id);
                      return;
                    }
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
                      {/* Remove button in edit mode */}
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
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-4 text-[10px] text-muted-foreground bg-card/90 backdrop-blur-sm rounded-md px-3 py-2 border border-border/30">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-px bg-blue-400/40" />
          <span>Supporting</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-px border-t border-dashed border-red-400/50" />
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Positive</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Neutral</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Negative</span>
        </div>
      </div>
    </div>
  );
}
