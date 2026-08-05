import ReactFlow, { Background, Controls, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';

export function KleosCanvas() {
  return (
    <div className="w-full h-full" style={{ background: '#111111' }}>
      <ReactFlow
        nodes={[]}
        edges={[]}
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
            background: '#2b2b2b',
            border: '1px solid #565656',
            borderRadius: '8px',
          }}
        />
      </ReactFlow>
    </div>
  );
}
