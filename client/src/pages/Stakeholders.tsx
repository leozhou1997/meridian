import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus,
  Plus, Trash2, Save, X, Edit2, Mail, Linkedin, StickyNote, UserCircle, AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StakeholderAvatar } from '@/components/Avatars';
import { CompanyLogo } from '@/components/Avatars';
import { toast } from 'sonner';

// ─── Constants ──────────────────────────────────────────────────────────────

const ROLES = ['Champion', 'Decision Maker', 'Influencer', 'Blocker', 'User', 'Evaluator'] as const;
const SENTIMENTS = ['Positive', 'Neutral', 'Negative'] as const;
const ENGAGEMENTS = ['High', 'Medium', 'Low'] as const;

type RoleType = typeof ROLES[number];
type SentimentType = typeof SENTIMENTS[number];
type EngagementType = typeof ENGAGEMENTS[number];

const SENTIMENT_ICON: Record<string, any> = {
  Positive: TrendingUp,
  Neutral: Minus,
  Negative: TrendingDown,
};

const SENTIMENT_COLOR: Record<string, string> = {
  Positive: 'text-emerald-400',
  Neutral: 'text-muted-foreground',
  Negative: 'text-red-400',
};

const SENTIMENT_BG: Record<string, string> = {
  Positive: 'bg-emerald-500/10 border-emerald-500/30',
  Neutral: 'bg-muted/50 border-border/50',
  Negative: 'bg-red-500/10 border-red-500/30',
};

const ROLE_COLORS: Record<string, string> = {
  'Champion':        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Decision Maker':  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Influencer':      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Blocker':         'bg-red-500/10 text-red-400 border-red-500/20',
  'User':            'bg-green-500/10 text-green-400 border-green-500/20',
  'Evaluator':       'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const ENGAGEMENT_COLORS: Record<string, string> = {
  'High':   'text-emerald-400',
  'Medium': 'text-amber-400',
  'Low':    'text-red-400',
};

function getRoleColor(role: string) {
  return ROLE_COLORS[role] ?? 'bg-muted/50 text-muted-foreground border-border/50';
}

// ─── Inline Edit Field ──────────────────────────────────────────────────────

function InlineField({ label, value, onSave, type = 'text', options }: {
  label: string;
  value: string;
  onSave: (val: string) => void;
  type?: 'text' | 'select' | 'textarea';
  options?: readonly string[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    if (draft.trim() !== value) onSave(draft.trim());
    setEditing(false);
  };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (!editing) {
    return (
      <div className="group flex items-start gap-2 py-1">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider w-20 shrink-0 pt-0.5">{label}</span>
        <div className="flex-1 min-w-0 flex items-center gap-1">
          {type === 'select' ? (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${label === 'Role' ? getRoleColor(value) : label === 'Sentiment' ? SENTIMENT_BG[value] ?? '' : ''}`}>
              {value || '—'}
            </Badge>
          ) : (
            <span className="text-xs text-foreground/80 truncate">{value || <span className="text-muted-foreground/40 italic">Empty</span>}</span>
          )}
          <button onClick={() => { setDraft(value); setEditing(true); }} className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-muted/50 transition-all shrink-0">
            <Edit2 className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <div className="flex items-start gap-2 py-1">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider w-20 shrink-0 pt-1">{label}</span>
        <div className="flex-1 flex flex-wrap gap-1">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onSave(opt); setEditing(false); }}
              className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${opt === value ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50'}`}
            >
              {opt}
            </button>
          ))}
          <button onClick={cancel} className="text-[10px] px-1.5 py-0.5 text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="flex items-start gap-2 py-1">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider w-20 shrink-0 pt-1">{label}</span>
        <div className="flex-1">
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') cancel(); }}
            className="w-full text-xs bg-muted/30 border border-border/50 rounded-md px-2 py-1.5 text-foreground resize-none min-h-[60px] focus:outline-none focus:border-primary/40"
            rows={3}
          />
          <div className="flex gap-1 mt-1">
            <button onClick={save} className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary hover:bg-primary/30">Save</button>
            <button onClick={cancel} className="text-[10px] px-2 py-0.5 rounded bg-muted/30 text-muted-foreground hover:bg-muted/50">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 py-1">
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider w-20 shrink-0 pt-1">{label}</span>
      <div className="flex-1 flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
          className="flex-1 text-xs bg-muted/30 border border-border/50 rounded-md px-2 py-1 text-foreground focus:outline-none focus:border-primary/40"
        />
      </div>
    </div>
  );
}

// ─── Add Stakeholder Form ───────────────────────────────────────────────────

function AddStakeholderForm({ dealId, onClose }: { dealId: number; onClose: () => void }) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [role, setRole] = useState<RoleType>('User');
  const [sentiment, setSentiment] = useState<SentimentType>('Neutral');

  const utils = trpc.useUtils();
  const createMutation = trpc.stakeholders.create.useMutation({
    onSuccess: () => {
      utils.stakeholders.listAll.invalidate();
      utils.stakeholders.listByDeal.invalidate({ dealId });
      toast.success('Stakeholder added');
      onClose();
    },
    onError: () => toast.error('Failed to add stakeholder'),
  });

  const handleSubmit = () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    createMutation.mutate({ dealId, name: name.trim(), title: title.trim(), role, sentiment });
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      <div className="p-3 bg-primary/5 border-t border-primary/20 space-y-2">
        <div className="flex items-center gap-2">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name *" className="h-7 text-xs flex-1" autoFocus />
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="h-7 text-xs flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex flex-wrap gap-1">
            {ROLES.map(r => (
              <button key={r} onClick={() => setRole(r)} className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${r === role ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {SENTIMENTS.map(s => (
              <button key={s} onClick={() => setSentiment(s)} className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${s === sentiment ? `${SENTIMENT_BG[s]} ${SENTIMENT_COLOR[s]}` : 'bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 text-[10px] px-2">Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending} className="h-6 text-[10px] px-3">
            {createMutation.isPending ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Stakeholder Row (expandable with inline editing) ───────────────────────

function StakeholderRow({ stakeholder, dealId }: { stakeholder: any; dealId: number }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const utils = trpc.useUtils();
  const updateMutation = trpc.stakeholders.update.useMutation({
    onSuccess: () => {
      utils.stakeholders.listAll.invalidate();
      utils.stakeholders.listByDeal.invalidate({ dealId });
      toast.success('Updated');
    },
    onError: () => toast.error('Update failed'),
  });
  const deleteMutation = trpc.stakeholders.delete.useMutation({
    onSuccess: () => {
      utils.stakeholders.listAll.invalidate();
      utils.stakeholders.listByDeal.invalidate({ dealId });
      toast.success('Stakeholder removed');
    },
    onError: () => toast.error('Delete failed'),
  });

  const save = useCallback((field: string, value: string) => {
    updateMutation.mutate({ id: stakeholder.id, [field]: value });
  }, [stakeholder.id]);

  const SentimentIcon = SENTIMENT_ICON[stakeholder.sentiment] ?? Minus;
  const sentimentColor = SENTIMENT_COLOR[stakeholder.sentiment] ?? 'text-muted-foreground';
  const roles = Array.isArray(stakeholder.roles) ? (stakeholder.roles as string[]) : (stakeholder.role ? [stakeholder.role] : []);

  return (
    <div className="border-b border-border/20 last:border-b-0">
      {/* Summary row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-colors text-left"
      >
        <StakeholderAvatar name={stakeholder.name} avatarUrl={stakeholder.avatar} size="sm" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{stakeholder.name}</span>
          {stakeholder.title && <span className="text-xs text-muted-foreground ml-2">{stakeholder.title}</span>}
        </div>
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {roles.slice(0, 2).map(r => (
            <Badge key={r} variant="outline" className={`text-[9px] px-1.5 py-0 ${getRoleColor(r)}`}>{r}</Badge>
          ))}
        </div>
        {/* On mobile, show just the primary role badge */}
        <div className="flex sm:hidden items-center gap-1 shrink-0">
          {roles.slice(0, 1).map(r => (
            <Badge key={r} variant="outline" className={`text-[9px] px-1.5 py-0 ${getRoleColor(r)}`}>{r}</Badge>
          ))}
        </div>
        <div className={`shrink-0 ${sentimentColor}`}>
          <SentimentIcon className="w-3.5 h-3.5" />
        </div>
        <span className={`hidden sm:inline text-[10px] shrink-0 ${ENGAGEMENT_COLORS[stakeholder.engagement] ?? 'text-muted-foreground'}`}>
          {stakeholder.engagement}
        </span>
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
        }
      </button>

      {/* Expanded inline editor */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 ml-10 border-l-2 border-primary/20 space-y-0.5">
              <InlineField label="Name" value={stakeholder.name} onSave={v => save('name', v)} />
              <InlineField label="Title" value={stakeholder.title ?? ''} onSave={v => save('title', v)} />
              <InlineField label="Role" value={stakeholder.role} onSave={v => save('role', v)} type="select" options={ROLES} />
              <InlineField label="Sentiment" value={stakeholder.sentiment} onSave={v => save('sentiment', v)} type="select" options={SENTIMENTS} />
              <InlineField label="Engagement" value={stakeholder.engagement ?? 'Medium'} onSave={v => save('engagement', v)} type="select" options={ENGAGEMENTS} />
              <InlineField label="Email" value={stakeholder.email ?? ''} onSave={v => save('email', v)} />
              <InlineField label="LinkedIn" value={stakeholder.linkedIn ?? ''} onSave={v => save('linkedIn', v)} />
              <InlineField label="Notes" value={stakeholder.personalNotes ?? ''} onSave={v => save('personalNotes', v)} type="textarea" />
              <InlineField label="Insights" value={stakeholder.keyInsights ?? ''} onSave={v => save('keyInsights', v)} type="textarea" />

              {/* Delete */}
              <div className="pt-2 flex items-center gap-2">
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1 text-[10px] text-red-400/60 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" /> Remove stakeholder
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-red-400">Confirm removal?</span>
                    <button onClick={() => deleteMutation.mutate({ id: stakeholder.id })} className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">Yes, remove</button>
                    <button onClick={() => setConfirmDelete(false)} className="text-[10px] px-2 py-0.5 rounded bg-muted/30 text-muted-foreground hover:bg-muted/50">Cancel</button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function Stakeholders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDeals, setExpandedDeals] = useState<Set<number>>(new Set());
  const [addingToDeal, setAddingToDeal] = useState<number | null>(null);

  const { data: deals = [], isLoading: dealsLoading } = trpc.deals.list.useQuery();
  const { data: allStakeholders = [], isLoading: stakeholdersLoading } = trpc.stakeholders.listAll.useQuery();

  const isLoading = dealsLoading || stakeholdersLoading;

  const toggleDeal = (dealId: number) => {
    setExpandedDeals(prev => {
      const next = new Set(prev);
      if (next.has(dealId)) next.delete(dealId);
      else next.add(dealId);
      return next;
    });
  };

  // Group stakeholders by deal
  const stakeholdersByDeal = allStakeholders.reduce((acc, s) => {
    if (!acc[s.dealId]) acc[s.dealId] = [];
    acc[s.dealId].push(s);
    return acc;
  }, {} as Record<number, typeof allStakeholders>);

  const filteredDeals = deals.map(deal => ({
    ...deal,
    filteredStakeholders: (stakeholdersByDeal[deal.id] ?? []).filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.role ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(d => searchQuery ? d.filteredStakeholders.length > 0 : true);

  const totalStakeholders = allStakeholders.length;

  return (
    <div className="p-4 md:p-6 max-w-[960px]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold mb-1">Stakeholder Directory</h1>
          <p className="text-muted-foreground text-sm">
            Manage {totalStakeholders} contacts across {deals.length} deals. Click any person to edit their profile inline.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, title, role, or company..."
            className="pl-10 h-9 text-sm"
          />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        )}

        {/* Grouped by Deal */}
        {!isLoading && (
          <div className="space-y-3">
            {filteredDeals.map(deal => {
              const isExpanded = expandedDeals.has(deal.id);
              const allDealStakeholders = stakeholdersByDeal[deal.id] ?? [];
              const positiveCount = allDealStakeholders.filter(s => s.sentiment === 'Positive').length;
              const negativeCount = allDealStakeholders.filter(s => s.sentiment === 'Negative').length;

              return (
                <Card key={deal.id} className="bg-card border-border/50 overflow-hidden">
                  {/* Deal header */}
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleDeal(deal.id)}
                      className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
                    >
                      <CompanyLogo name={deal.company} logoUrl={deal.logo} size="sm" />
                      <div className="flex-1 min-w-0">
                        <span className="font-display text-sm font-semibold">{deal.company}</span>
                        <span className="text-xs text-muted-foreground ml-2">{deal.stage}</span>
                      </div>

                      {/* Sentiment summary */}
                      <div className="flex items-center gap-2 mr-2">
                        {positiveCount > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-emerald-400">
                            <TrendingUp className="w-3 h-3" />{positiveCount}
                          </span>
                        )}
                        {negativeCount > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-red-400">
                            <TrendingDown className="w-3 h-3" />{negativeCount}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {allDealStakeholders.length} contact{allDealStakeholders.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </button>
                    {/* Add stakeholder button */}
                    {isExpanded && (
                      <button
                        onClick={() => setAddingToDeal(addingToDeal === deal.id ? null : deal.id)}
                        className="mr-3 flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/10"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    )}
                  </div>

                  {/* Stakeholder list */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="border-t border-border/40">
                          {/* Add form */}
                          <AnimatePresence>
                            {addingToDeal === deal.id && (
                              <AddStakeholderForm dealId={deal.id} onClose={() => setAddingToDeal(null)} />
                            )}
                          </AnimatePresence>

                          {/* Stakeholder rows */}
                          {deal.filteredStakeholders.length > 0 ? (
                            deal.filteredStakeholders.map(s => (
                              <StakeholderRow key={s.id} stakeholder={s} dealId={deal.id} />
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-xs text-muted-foreground/60">
                              {searchQuery ? 'No matches in this deal.' : 'No stakeholders yet.'}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}

            {filteredDeals.length === 0 && !isLoading && (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {searchQuery ? 'No stakeholders match your search.' : 'No stakeholders yet. Add them from the Deal Detail page.'}
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
