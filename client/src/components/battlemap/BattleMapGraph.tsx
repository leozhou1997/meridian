import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { StakeholderNode } from './StakeholderNode';
import { NeedNode } from './NeedNode';
import { DimensionNode } from './DimensionNode';
import { NeedEdge, RelationshipEdge, DimensionEdge } from './CustomEdges';
import { computePeopleLens, computeDimensionLens } from './layout';
import { Users, Layers, Sparkles } from 'lucide-react';

// Register custom node/edge types
const nodeTypes = {
  stakeholder: StakeholderNode,
  need: NeedNode,
  dimension: DimensionNode,
};

const edgeTypes = {
  needEdge: NeedEdge,
  relationshipEdge: RelationshipEdge,
  dimensionEdge: DimensionEdge,
};

export interface BattleMapGraphProps {
  stakeholders: Array<{
    id: number;
    name: string;
    title: string;
    role: string;
    sentiment: string;
    avatarUrl?: string | null;
    createdAt?: string | number | null;
  }>;
  needs: Array<{
    id: number;
    stakeholderId: number;
    needType: string;
    title: string;
    description?: string | null;
    status: string;
    dimensionKey?: string | null;
  }>;
  actions: Array<{
    id: number;
    action: string;
    isDone: boolean;
    stakeholderId?: number | null;
    needId?: number | null;
    dimensionKey?: string | null;
  }>;
  dimensions: Array<{
    dimensionKey: string;
    label: string;
    score: number;
    weight?: number;
  }>;
  isZh: boolean;
  onNeedStatusCycle: (needId: number) => void;
  onNeedEdit: (needId: number) => void;
  onNeedDelete: (needId: number) => void;
  onStakeholderClick: (id: number) => void;
  onAiGenerate: () => void;
  onDimensionWeightChange?: (key: string, weight: number) => void;
  isGenerating: boolean;
}

type Lens = 'people' | 'dimension';

export function BattleMapGraph({
  stakeholders,
  needs,
  actions,
  dimensions,
  isZh,
  onNeedStatusCycle,
  onNeedEdit,
  onNeedDelete,
  onStakeholderClick,
  onAiGenerate,
  onDimensionWeightChange,
  isGenerating,
}: BattleMapGraphProps) {
  const [lens, setLens] = useState<Lens>('people');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([] as Edge[]);
  const [expandedStakeholders, setExpandedStakeholders] = useState<Set<number>>(new Set());
  const [expandedNeeds, setExpandedNeeds] = useState<Set<number>>(new Set());
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Callbacks
  const toggleStakeholder = useCallback((id: number) => {
    setExpandedStakeholders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleNeedActions = useCallback((id: number) => {
    setExpandedNeeds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleDimension = useCallback((key: string) => {
    setExpandedDimensions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleDimensionWeightChange = useCallback((key: string, weight: number) => {
    onDimensionWeightChange?.(key, weight);
  }, [onDimensionWeightChange]);

  const handleDimensionClick = useCallback((key: string) => {
    toggleDimension(key);
  }, [toggleDimension]);

  // Compute layout
  const layoutInput = useMemo(() => ({
    stakeholders,
    needs,
    actions,
    dimensions,
    expandedStakeholders,
    expandedNeeds,
    expandedDimensions,
    callbacks: {
      onToggleStakeholder: toggleStakeholder,
      onStakeholderClick,
      onNeedStatusCycle,
      onNeedEdit,
      onNeedDelete,
      onToggleNeedActions: toggleNeedActions,
      onDimensionToggle: toggleDimension,
      onDimensionWeightChange: handleDimensionWeightChange,
      onDimensionClick: handleDimensionClick,
    },
  }), [
    stakeholders, needs, actions, dimensions,
    expandedStakeholders, expandedNeeds, expandedDimensions,
    toggleStakeholder, onStakeholderClick, onNeedStatusCycle,
    onNeedEdit, onNeedDelete, toggleNeedActions, toggleDimension,
    handleDimensionWeightChange, handleDimensionClick,
  ]);

  // Recompute nodes/edges when data or lens changes
  useEffect(() => {
    const result = lens === 'people'
      ? computePeopleLens(layoutInput)
      : computeDimensionLens(layoutInput);

    if (isTransitioning) {
      setNodes(prev => prev.map(n => ({ ...n, style: { ...n.style, opacity: 0, transition: 'opacity 0.15s' } })));
      setTimeout(() => {
        setNodes(result.nodes);
        setEdges(result.edges);
        setIsTransitioning(false);
      }, 150);
    } else {
      setNodes(result.nodes);
      setEdges(result.edges);
    }
  }, [layoutInput, lens, isTransitioning]);

  // Lens switch handler
  const switchLens = useCallback((newLens: Lens) => {
    if (newLens === lens) return;
    setIsTransitioning(true);
    setLens(newLens);
  }, [lens]);

  // Empty state
  if (stakeholders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-16">
        <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
          <Users className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-700 mb-1.5">
          {isZh ? '暂无决策人数据' : 'No stakeholders yet'}
        </h3>
        <p className="text-sm text-gray-400 mb-6 max-w-sm">
          {isZh
            ? '添加决策人后，AI 将自动分析他们的需求和关切'
            : 'Add stakeholders to generate the battle map with AI-analyzed needs'}
        </p>
      </div>
    );
  }

  // Needs empty state (stakeholders exist but no needs)
  const showNeedsEmpty = needs.length === 0 && stakeholders.length > 0;

  return (
    <div className="relative w-full h-full" style={{ minHeight: 500 }}>
      {/* Toolbar — clean, light, inline with Meridian */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1 py-1 shadow-sm">
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            lens === 'people'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => switchLens('people')}
        >
          <Users className="w-3.5 h-3.5" />
          {isZh ? '人物视角' : 'People'}
        </button>
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            lens === 'dimension'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => switchLens('dimension')}
        >
          <Layers className="w-3.5 h-3.5" />
          {isZh ? '维度视角' : 'Dimensions'}
        </button>

        <div className="w-px h-4 bg-gray-200 mx-0.5" />

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
          onClick={onAiGenerate}
          disabled={isGenerating}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating
            ? (isZh ? '分析中...' : 'Analyzing...')
            : (isZh ? 'AI 分析' : 'AI Analyze')}
        </button>
      </div>

      {/* Needs empty overlay */}
      {showNeedsEmpty && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1.5">
              {isZh ? '需要 AI 分析决策人需求' : 'AI analysis needed'}
            </h3>
            <p className="text-xs text-gray-400 mb-4 max-w-xs">
              {isZh
                ? '点击下方按钮，AI 将基于会议记录和决策人信息，自动分析每个人的核心需求'
                : 'Click below to let AI analyze each stakeholder\'s needs'}
            </p>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
              onClick={onAiGenerate}
              disabled={isGenerating}
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating
                ? (isZh ? 'AI 正在分析...' : 'Analyzing...')
                : (isZh ? 'AI 分析需求' : 'AI Analyze Needs')}
            </button>
          </div>
        </div>
      )}

      {/* React Flow Canvas — clean, no background dots, no minimap, no controls */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      />
    </div>
  );
}
