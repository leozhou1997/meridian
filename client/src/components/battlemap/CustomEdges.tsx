import { memo } from 'react';
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { EDGE, NEED_TYPE } from './colors';

/**
 * NeedEdge: connects stakeholder → need node
 * Subtle line, color matches the need type
 */
function NeedEdgeComponent(props: EdgeProps) {
  const needType = (props.data?.needType as string) || 'organizational';
  const typeColors = NEED_TYPE[needType as keyof typeof NEED_TYPE] || NEED_TYPE.organizational;

  const [edgePath] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 8,
  });

  return (
    <BaseEdge
      id={props.id}
      path={edgePath}
      style={{
        stroke: typeColors.border,
        strokeWidth: 1,
        strokeOpacity: 0.3,
      }}
    />
  );
}

/**
 * RelationshipEdge: connects stakeholder ↔ stakeholder
 */
function RelationshipEdgeComponent(props: EdgeProps) {
  const relType = (props.data?.relationType as string) || 'neutral';
  const color = relType === 'positive' ? EDGE.positive
    : relType === 'negative' ? EDGE.negative
    : EDGE.neutral;

  const [edgePath] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 12,
  });

  return (
    <BaseEdge
      id={props.id}
      path={edgePath}
      style={{
        stroke: color,
        strokeWidth: 1,
        strokeOpacity: 0.25,
        strokeDasharray: '4 3',
      }}
    />
  );
}

/**
 * DimensionEdge: connects dimension → stakeholder in dimension lens
 * Very subtle vertical connector
 */
function DimensionEdgeComponent(props: EdgeProps) {
  const color = (props.data?.color as string) || EDGE.neutral;

  const [edgePath] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 6,
  });

  return (
    <BaseEdge
      id={props.id}
      path={edgePath}
      style={{
        stroke: color,
        strokeWidth: 1,
        strokeOpacity: 0.25,
      }}
    />
  );
}

export const NeedEdge = memo(NeedEdgeComponent);
export const RelationshipEdge = memo(RelationshipEdgeComponent);
export const DimensionEdge = memo(DimensionEdgeComponent);
