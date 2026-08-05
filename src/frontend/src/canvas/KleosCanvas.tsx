import ReactFlow, {
  Background,
  Controls,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { BaseNode } from './nodes/BaseNode';
import { KleosEdgeComponent } from './KleosEdge';
import { ClusterBackground } from './clusters/ClusterBackground';
import { BranchRailStub } from '../components/BranchRailStub';
import { useCanvas } from '../hooks/useCanvas';

// nodeTypes must be defined outside render to avoid react-flow warnings
const nodeTypes: NodeTypes = {
  idea:        BaseNode as NodeTypes[string],
  evidence:    BaseNode as NodeTypes[string],
  assumption:  BaseNode as NodeTypes[string],
  question:    BaseNode as NodeTypes[string],
  constraint:  BaseNode as NodeTypes[string],
  insight:     BaseNode as NodeTypes[string],
  decision:    BaseNode as NodeTypes[string],
  source:      BaseNode as NodeTypes[string],
  cluster:     ClusterBackground as NodeTypes[string],
};

const edgeTypes: EdgeTypes = {
  kleos: KleosEdgeComponent as EdgeTypes[string],
};

interface Props {
  canvasId: string;
}

export function KleosCanvas({ canvasId }: Props) {
  const { nodes, edges } = useCanvas(canvasId);

  return (
    <div className="flex flex-col h-full w-full" style={{ background: '#111111' }}>
      <BranchRailStub />
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
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
    </div>
  );
}
