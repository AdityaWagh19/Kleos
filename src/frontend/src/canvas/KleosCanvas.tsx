import { useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { BaseNode } from './nodes/BaseNode';
import { KleosEdgeComponent } from './KleosEdge';
import { ClusterBackground } from './clusters/ClusterBackground';
import { useCanvas } from '../hooks/useCanvas';

// Defined at module level — never recreated on re-render (fixes react-flow warning #002)
const NODE_TYPES = {
  idea:       BaseNode,
  evidence:   BaseNode,
  assumption: BaseNode,
  question:   BaseNode,
  constraint: BaseNode,
  insight:    BaseNode,
  decision:   BaseNode,
  source:     BaseNode,
  cluster:    ClusterBackground,
} as const;

const EDGE_TYPES = {
  kleos: KleosEdgeComponent,
} as const;

interface Props {
  canvasId: string;
}

export function KleosCanvas({ canvasId }: Props) {
  const { nodes, edges, loadCanvas } = useCanvas(canvasId);

  // Listen for reload events triggered by TextInputBar after compilation
  const handleReload = useCallback(() => { loadCanvas(); }, [loadCanvas]);
  useEffect(() => {
    window.addEventListener('kleos:reload-canvas', handleReload);
    return () => window.removeEventListener('kleos:reload-canvas', handleReload);
  }, [handleReload]);

  // Initial load
  useEffect(() => { loadCanvas(); }, [loadCanvas]);

  return (
    <div className="flex-1 relative" style={{ background: '#111111' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        fitView
        style={{ background: '#111111' }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background
          color="#2b2b2b"
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
        />
        <Controls
          style={{
            background:   '#2b2b2b',
            border:       '1px solid #565656',
            borderRadius: '8px',
          }}
        />
      </ReactFlow>
    </div>
  );
}
