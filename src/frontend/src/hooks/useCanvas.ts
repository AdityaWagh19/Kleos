import { useState, useCallback, useRef } from 'react';
import { type Node, type Edge } from 'reactflow';
import { api } from '../services/api';
import type { KleosNode, KleosEdge, CanvasState, MemoryScope, StatusPillState } from '../types';

export function useCanvas(canvasId: string) {
  const [nodes, setNodes]   = useState<Node<KleosNode>[]>([]);
  const [edges, setEdges]   = useState<Edge[]>([]);
  const [status, setStatus] = useState<StatusPillState>('ready');

  // Impact Halo state — pre-computed, never computed on hover
  const [impactedNodeIds, setImpactedNodeIds] = useState<Set<string>>(new Set());

  // Active source filter (dims non-matching nodes)
  const [activeSourceFilter, setActiveSourceFilter] = useState<string | null>(null);

  // Track node IDs created during current compilation (for Stop revert)
  const compilingNodeIds = useRef<string[]>([]);

  const loadCanvas = useCallback(async () => {
    const state = await api.get<CanvasState>(`/api/canvas/${canvasId}`);
    setNodes(state.nodes.map(toReactFlowNode));
    setEdges(state.edges.map(toReactFlowEdge));
  }, [canvasId]);

  /** Add newly compiled nodes with staggered entrance animation */
  const addNodes = useCallback((newNodes: KleosNode[]) => {
    compilingNodeIds.current = newNodes.map(n => n.id);
    setNodes(prev => [
      ...prev,
      ...newNodes.map((n, i) =>
        toReactFlowNode({ ...n, entranceDelay: i * 0.06 })
      ),
    ]);
  }, []);

  /** Add edges to canvas */
  const addEdges = useCallback((newEdges: KleosEdge[]) => {
    setEdges(prev => [...prev, ...newEdges.map(toReactFlowEdge)]);
  }, []);

  /**
   * Activate Impact Halo — O(1) lookup, never recomputed.
   * impact_nodes is pre-computed at node creation time and stored in the DB.
   */
  const activateImpactHalo = useCallback(
    (_assumptionNodeId: string, impactNodes: string[]) => {
      setImpactedNodeIds(new Set(impactNodes));
    },
    [],
  );

  const clearImpactHalo = useCallback(() => {
    setImpactedNodeIds(new Set());
  }, []);

  /** Stop: remove all nodes created during current compilation */
  const revertCompilation = useCallback(() => {
    const ids = new Set(compilingNodeIds.current);
    setNodes(prev => prev.filter(n => !ids.has(n.id)));
    compilingNodeIds.current = [];
  }, []);

  /** Update a node's scope chip value */
  const updateNodeScope = useCallback(
    async (nodeId: string, newScope: MemoryScope) => {
      await api.put(`/api/canvas/${canvasId}/node/${nodeId}/scope`, { scope: newScope });
      setNodes(prev =>
        prev.map(n =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, memory_scope: newScope } }
            : n
        )
      );
    },
    [canvasId],
  );

  // Derive nodes with impact halo + source filter applied
  const displayNodes = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      isImpacted: impactedNodeIds.has(n.id),
      dimmed: activeSourceFilter !== null && n.data.provenance_type !== activeSourceFilter,
    },
  }));

  return {
    nodes: displayNodes,
    edges,
    status,
    setStatus,
    loadCanvas,
    addNodes,
    addEdges,
    activateImpactHalo,
    clearImpactHalo,
    revertCompilation,
    updateNodeScope,
    activeSourceFilter,
    setActiveSourceFilter,
  };
}

function toReactFlowNode(n: KleosNode): Node<KleosNode> {
  return {
    id:       n.id,
    type:     n.type,    // maps to nodeTypes in KleosCanvas
    position: n.position,
    data:     n,
  };
}

function toReactFlowEdge(e: KleosEdge): Edge {
  return {
    id:     e.id,
    source: e.source,
    target: e.target,
    type:   'kleos',
    data:   e,
  };
}
