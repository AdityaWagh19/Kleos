import { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
  type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { BaseNode } from './nodes/BaseNode';
import { KleosEdgeComponent } from './KleosEdge';
import { ClusterBackground } from './clusters/ClusterBackground';
import { useCanvas } from '../hooks/useCanvas';
import { EdgeConnectionDialog } from './EdgeConnectionDialog';
import { NodeContextMenu } from './NodeContextMenu';

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
  branchId: string;
  onNodesLoaded?: (count: number) => void;
  onNodeSelect?: (nodeIds: string[]) => void;
}

export function KleosCanvas({ canvasId, branchId, onNodesLoaded, onNodeSelect }: Props) {
  const {
    nodes, edges,
    persistNodePosition, deleteNode, createEdge, mergeNodes, pinNode
  } = useCanvas(canvasId, branchId);

  const { fitView } = useReactFlow();
  const hasFitView = useRef(false);

  // Connection Dialog State
  const [connectingEdge, setConnectingEdge] = useState<Connection | null>(null);

  // Node Context Menu State
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number; pinned: boolean; text: string } | null>(null);

  // Track selected node IDs for context menu merge action
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  const onSelectionChange = useCallback(({ nodes }: { nodes: any[] }) => {
    const ids = nodes.map(n => n.id);
    setSelectedNodeIds(ids);
    if (onNodeSelect) onNodeSelect(ids);
  }, [onNodeSelect]);

  // Editing state (passed via data to BaseNode if needed, but handled globally here for MVP)
  // For true inline editing, BaseNode handles it internally via its own state.

  const handleInit = useCallback(() => {
    if (nodes.length > 0 && !hasFitView.current) {
      fitView({ padding: 0.2 });
      hasFitView.current = true;
      if (onNodesLoaded) onNodesLoaded(nodes.length);
    }
  }, [nodes.length, fitView, onNodesLoaded]);

  const onConnect = useCallback((connection: Connection) => {
    setConnectingEdge(connection);
  }, []);

  const onNodeDragStop: NodeMouseHandler = useCallback((_, node) => {
    persistNodePosition(node.id, node.position.x, node.position.y);
  }, [persistNodePosition]);

  const onNodeContextMenu: NodeMouseHandler = useCallback((e, node) => {
    e.preventDefault();
    setContextMenu({
      id: node.id,
      text: node.data.text,
      x: e.clientX,
      y: e.clientY,
      pinned: node.data.pinned,
    });
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div className="flex-1 relative" style={{ background: 'var(--color-linen-canvas)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onInit={handleInit}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="var(--color-warm-stone)"
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
        />
        <Controls
          style={{
            background:   'var(--color-frosted-white)',
            border:       '1px solid var(--color-warm-stone)',
            borderRadius: '8px',
            boxShadow:    '0 2px 8px rgba(0,0,0,0.05)',
            fill:         'var(--color-charcoal-body)',
          }}
        />
        <MiniMap 
          nodeStrokeColor="var(--color-warm-stone)"
          nodeColor="var(--color-frosted-white)"
          maskColor="rgba(237, 237, 232, 0.6)"
          style={{
            background: 'var(--color-frosted-white)',
            border: '1px solid var(--color-warm-stone)',
            borderRadius: '8px',
          }}
        />
      </ReactFlow>

      {/* Edge Connection Dialog */}
      <EdgeConnectionDialog
        open={!!connectingEdge}
        connection={connectingEdge}
        onConfirm={(type, confidence, label) => {
          if (connectingEdge?.source && connectingEdge?.target) {
            createEdge(connectingEdge.source, connectingEdge.target, type, confidence, label);
          }
          setConnectingEdge(null);
        }}
        onCancel={() => setConnectingEdge(null)}
      />

      {/* Node Context Menu */}
      {contextMenu && (
        <NodeContextMenu
          nodeId={contextMenu.id}
          nodeText={contextMenu.text}
          x={contextMenu.x}
          y={contextMenu.y}
          isPinned={contextMenu.pinned}
          selectedNodeIds={selectedNodeIds.includes(contextMenu.id) ? selectedNodeIds : [contextMenu.id]}
          onEdit={() => { /* Handled inline via BaseNode */ }}
          onPin={() => pinNode(contextMenu.id, !contextMenu.pinned)}
          onDelete={() => deleteNode(contextMenu.id)}
          onMerge={() => { if (selectedNodeIds.length > 1) mergeNodes(selectedNodeIds); }}
          onCreateEdgeFrom={() => { /* Start connection drag manually if needed */ }}
          onViewProvenance={() => { /* Open provenance popover */ }}
          onAskAI={() => { /* Put text in chat bar */ }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
