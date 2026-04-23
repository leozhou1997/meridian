import { memo, useMemo } from 'react';
import { getRolePriority, SENTIMENT, PHASE } from './colors';
import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';

interface Stakeholder {
  id: number;
  name: string;
  title: string;
  role: string;
  sentiment: string;
}

interface Action {
  id: number;
  action: string;
  isDone: boolean;
  stakeholderId?: number | null;
  dimensionKey?: string | null;
  phase?: string | null;
  priority?: string | null;
  createdAt?: string | number | null;
}

interface TimelinePanelProps {
  stakeholders: Stakeholder[];
  actions: Action[];
  isZh: boolean;
}

const PHASE_LABELS: Record<string, { zh: string; en: string }> = {
  establish: { zh: '建立据点', en: 'Establish' },
  expand: { zh: '扩大战果', en: 'Expand' },
  harvest: { zh: '收割成果', en: 'Harvest' },
};

const PHASE_ORDER = ['establish', 'expand', 'harvest'];

function TimelinePanelComponent({ stakeholders, actions, isZh }: TimelinePanelProps) {
  const sorted = useMemo(() =>
    [...stakeholders].sort((a, b) => getRolePriority(a.role) - getRolePriority(b.role)),
    [stakeholders]
  );

  const actionsByStakeholder = useMemo(() => {
    const map = new Map<number, Map<string, typeof actions>>();
    for (const sh of sorted) {
      const shActions = actions.filter(a => a.stakeholderId === sh.id);
      const byPhase = new Map<string, typeof actions>();
      for (const phase of PHASE_ORDER) {
        byPhase.set(phase, shActions.filter(a => (a.phase || 'establish') === phase));
      }
      const unassigned = shActions.filter(a => !a.phase || !PHASE_ORDER.includes(a.phase));
      const existing = byPhase.get('establish') || [];
      byPhase.set('establish', [...existing, ...unassigned.filter(a => !existing.includes(a))]);
      map.set(sh.id, byPhase);
    }
    return map;
  }, [sorted, actions]);

  const phaseProgress = useMemo(() => {
    const result: Record<string, { total: number; done: number }> = {};
    for (const phase of PHASE_ORDER) {
      const phaseActions = actions.filter(a => (a.phase || 'establish') === phase);
      result[phase] = {
        total: phaseActions.length,
        done: phaseActions.filter(a => a.isDone).length,
      };
    }
    return result;
  }, [actions]);

  const currentPhase = useMemo(() => {
    for (const phase of PHASE_ORDER) {
      const p = phaseProgress[phase];
      if (p && p.total > 0 && p.done < p.total) return phase;
    }
    return 'harvest';
  }, [phaseProgress]);

  if (sorted.length === 0 || actions.length === 0) return null;

  return (
    <div
      className="w-full border-t border-gray-200 pt-3 mt-2"
      style={{ maxHeight: 220, overflowY: 'auto' }}
    >
      {/* Phase headers */}
      <div className="flex items-center mb-2 pl-[120px]">
        {PHASE_ORDER.map((phase) => {
          const p = phaseProgress[phase] || { total: 0, done: 0 };
          const isCurrent = phase === currentPhase;
          const phaseColor = PHASE[phase as keyof typeof PHASE] || PHASE.establish;
          return (
            <div
              key={phase}
              className="flex-1 flex items-center gap-2 px-2"
            >
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium"
                style={{
                  background: isCurrent ? phaseColor.bg : 'transparent',
                  color: isCurrent ? phaseColor.text : '#9ca3af',
                  border: `1px solid ${isCurrent ? phaseColor.border + '40' : '#e5e7eb'}`,
                }}
              >
                {isCurrent && <Clock className="w-3 h-3" />}
                {isZh ? PHASE_LABELS[phase]?.zh : PHASE_LABELS[phase]?.en}
              </div>
              <span className="text-[10px] text-gray-400 tabular-nums">
                {p.done}/{p.total}
              </span>
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: p.total > 0 ? `${(p.done / p.total) * 100}%` : '0%',
                    background: phaseColor.border,
                    opacity: 0.5,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Swimlanes */}
      {sorted.map(sh => {
        const sentimentColor = SENTIMENT[sh.sentiment as keyof typeof SENTIMENT] || SENTIMENT.unknown;
        const shPhases = actionsByStakeholder.get(sh.id);

        return (
          <div key={sh.id} className="flex items-start mb-0.5 group">
            {/* Stakeholder label */}
            <div className="w-[120px] flex-shrink-0 flex items-center gap-2 pr-2 py-1">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: sentimentColor.border }}
              />
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-gray-700 truncate">{sh.name}</div>
                <div className="text-[9px] text-gray-400 truncate">{sh.title}</div>
              </div>
            </div>

            {/* Phase columns */}
            <div className="flex flex-1">
              {PHASE_ORDER.map(phase => {
                const phaseActions = shPhases?.get(phase) || [];
                const isCurrent = phase === currentPhase;

                return (
                  <div
                    key={phase}
                    className="flex-1 flex items-center gap-1 px-2 py-1 min-h-[28px]"
                    style={{
                      background: isCurrent ? 'rgba(59,130,246,0.03)' : 'transparent',
                      borderLeft: '1px solid #f3f4f6',
                    }}
                  >
                    {phaseActions.map(action => (
                      <div
                        key={action.id}
                        className="group/action relative"
                        title={action.action}
                      >
                        {action.isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500/70" />
                        ) : action.priority === 'high' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-gray-300" />
                        )}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-[10px] text-white bg-gray-800 whitespace-nowrap opacity-0 group-hover/action:opacity-100 transition-opacity pointer-events-none z-50 max-w-[200px] truncate shadow-lg">
                          {action.action}
                        </div>
                      </div>
                    ))}
                    {phaseActions.length === 0 && (
                      <span className="text-[10px] text-gray-300">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const TimelinePanel = memo(TimelinePanelComponent);
