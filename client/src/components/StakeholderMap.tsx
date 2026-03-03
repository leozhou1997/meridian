import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Stakeholder, Deal } from '@/lib/data';
import { getRoleColor } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface StakeholderMapProps {
  deal: Deal;
  onStakeholderClick?: (stakeholder: Stakeholder) => void;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

const NODE_W = 160;
const NODE_H = 110;

export default function StakeholderMap({ deal, onStakeholderClick }: StakeholderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 500 });

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height - 52 }); // subtract header
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Compute initial positions based on stage columns
  const initialPositions = useMemo(() => {
    const stageOrder = deal.buyingStages;
    const colW = containerSize.w / stageOrder.length;
    const stageSlots: Record<string, number> = {};

    return deal.stakeholders.map(s => {
      const stageIdx = stageOrder.indexOf(s.stage || '');
      const col = stageIdx >= 0 ? stageIdx : 0;
      stageSlots[s.stage || ''] = (stageSlots[s.stage || ''] || 0);
      const row = stageSlots[s.stage || ''];
      stageSlots[s.stage || ''] = row + 1;

      return {
        id: s.id,
        x: col * colW + (colW - NODE_W) / 2,
        y: 30 + row * (NODE_H + 30),
      };
    });
  }, [deal.stakeholders, deal.buyingStages, containerSize.w]);

  const [positions, setPositions] = useState<NodePosition[]>(initialPositions);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, nx: 0, ny: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sync positions when deal changes
  useEffect(() => {
    setPositions(initialPositions);
  }, [initialPositions]);

  const getPos = useCallback((id: string) => positions.find(p => p.id === id), [positions]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
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

  // Connections
  const connections = useMemo(() => {
    const result: { from: string; to: string; type: 'critical' | 'support' }[] = [];
    const stageOrder = deal.buyingStages;
    deal.stakeholders.forEach(s1 => {
      deal.stakeholders.forEach(s2 => {
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
  }, [deal.stakeholders, deal.buyingStages]);

  const sentimentDot = (sentiment: string) =>
    sentiment === 'Positive' ? '#10b981' : sentiment === 'Neutral' ? '#f59e0b' : '#ef4444';

  const stageOrder = deal.buyingStages;

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

      {/* Zoom controls */}
      <div className="absolute top-16 right-3 z-20 flex flex-col gap-1">
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

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 top-[52px] overflow-auto"
        style={{ cursor: dragging ? 'grabbing' : 'default' }}
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
              const isCritical = conn.type === 'critical';

              return (
                <g key={`${conn.from}-${conn.to}`}>
                  <path
                    d={`M ${x1} ${y1} C ${cpx1} ${y1}, ${cpx2} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={isCritical ? 'rgba(239,68,68,0.25)' : 'rgba(99,130,255,0.2)'}
                    strokeWidth="1.5"
                    strokeDasharray={isCritical ? '6 4' : 'none'}
                  />
                  <circle
                    cx={x2} cy={y2} r="3"
                    fill={isCritical ? 'rgba(239,68,68,0.4)' : 'rgba(99,130,255,0.35)'}
                  />
                </g>
              );
            })}
          </svg>

          {/* Stakeholder nodes */}
          {deal.stakeholders.map((stakeholder, idx) => {
            const pos = getPos(stakeholder.id);
            if (!pos) return null;
            const isSelected = selectedId === stakeholder.id;
            const isDragging = dragging === stakeholder.id;

            return (
              <motion.div
                key={stakeholder.id}
                className={`absolute select-none ${isDragging ? 'z-30' : 'z-20'}`}
                style={{ left: pos.x, top: pos.y, width: NODE_W }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: isDragging ? 1.04 : 1 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                onMouseDown={(e) => handleMouseDown(e, stakeholder.id)}
              >
                <Card
                  className={`bg-card border transition-all duration-150 cursor-grab active:cursor-grabbing ${
                    isSelected
                      ? 'border-primary/60 shadow-lg shadow-primary/10 ring-1 ring-primary/20'
                      : isDragging
                        ? 'border-primary/40 shadow-xl'
                        : 'border-border/50 hover:border-border/80 hover:shadow-md'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(isSelected ? null : stakeholder.id);
                    onStakeholderClick?.(stakeholder);
                  }}
                >
                  <div className="p-3">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="relative shrink-0">
                        <img
                          src={stakeholder.avatar}
                          alt={stakeholder.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-background"
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
