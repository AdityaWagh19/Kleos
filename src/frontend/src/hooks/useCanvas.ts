import { useState, useCallback, useRef, useEffect } from 'react';
import { type Node, type Edge, type Connection } from 'reactflow';
import { api } from '../services/api';
import type { KleosNode, KleosEdge, CanvasState, MemoryScope, StatusPillState, RelationType, Confidence } from '../types';

export function useCanvas(canvasId: string, branchId: string) {
  const [nodes, setNodes] = useState<Node<KleosNode>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [status, setStatus] = useState<StatusPillState>('ready');

  const [impactedNodeIds, setImpactedNodeIds] = useState<Set<string>>(new Set());
  const [activeSourceFilter, setActiveSourceFilter] = useState<string | null>(null);
  const compilingNodeIds = useRef<string[]>([]);

  const loadCanvas = useCallback(async () => {
    if (!canvasId) return;
    const url = branchId ? `/api/canvas/${canvasId}?branch_id=${branchId}` : `/api/canvas/${canvasId}`;
    const state = await api.get<CanvasState>(url);
    setNodes(state.nodes.map(toReactFlowNode));
    setEdges(state.edges.map(toReactFlowEdge));
  }, [canvasId, branchId]);

  // Reload canvas when branch changes
  useEffect(() => {
    loadCanvas();
  }, [loadCanvas]);

  const addNodes = useCallback((newNodes: KleosNode[]) => {
    compilingNodeIds.current = newNodes.map(n => n.id);
    setNodes(prev => [
      ...prev,
      ...newNodes.map((n, i) => toReactFlowNode({ ...n, entranceDelay: i * 0.06 })),
    ]);
  }, []);

  const addEdges = useCallback((newEdges: KleosEdge[]) => {
    setEdges(prev => [...prev, ...newEdges.map(toReactFlowEdge)]);
  }, []);

  const activateImpactHalo = useCallback((_assumptionNodeId: string, impactNodes: string[]) => {
    setImpactedNodeIds(new Set(impactNodes));
  }, []);

  const clearImpactHalo = useCallback(() => {
    setImpactedNodeIds(new Set());
  }, []);

  const revertCompilation = useCallback(() => {
    const ids = new Set(compilingNodeIds.current);
    setNodes(prev => prev.filter(n => !ids.has(n.id)));
    compilingNodeIds.current = [];
  }, []);

  const updateNodeScope = useCallback(async (nodeId: string, newScope: MemoryScope) => {
    await api.put(`/api/canvas/${canvasId}/node/${nodeId}/scope`, { scope: newScope });
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, memory_scope: newScope } } : n));
  }, [canvasId]);

  const persistNodePosition = useCallback(async (nodeId: string, x: number, y: number) => {
    // Optimistic UI update already handled by ReactFlow, just sync to DB
    await api.patch(`/api/canvas/${canvasId}/node/${nodeId}/position`, { x, y });
  }, [canvasId]);

  const updateNodeText = useCallback(async (nodeId: string, text: string) => {
    await api.patch(`/api/canvas/${canvasId}/node/${nodeId}/text`, { text });
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, text } } : n));
  }, [canvasId]);

  const pinNode = useCallback(async (nodeId: string, pinned: boolean) => {
    await api.patch(`/api/canvas/${canvasId}/node/${nodeId}/pin`, { pinned });
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, pinned } } : n));
  }, [canvasId]);

  const deleteNode = useCallback(async (nodeId: string) => {
    await api.delete(`/api/canvas/${canvasId}/node/${nodeId}`);
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [canvasId]);

  const createEdge = useCallback(async (sourceId: string, targetId: string, type: RelationType, confidence: Confidence, label?: string) => {
    const res = await api.post<{ id: string }>(`/api/canvas/${canvasId}/edge`, {
      source_id: sourceId,
      target_id: targetId,
      type,
      confidence,
      label,
      branch_id: branchId
    });
    const newEdge: KleosEdge = { id: res.id, source: sourceId, target: targetId, type, confidence, label };
    setEdges(prev => [...prev, toReactFlowEdge(newEdge)]);
  }, [canvasId, branchId]);

  const deleteEdge = useCallback(async (edgeId: string) => {
    await api.delete(`/api/canvas/${canvasId}/edge/${edgeId}`);
    setEdges(prev => prev.filter(e => e.id !== edgeId));
  }, [canvasId]);

  const mergeNodes = useCallback(async (nodeIds: string[]) => {
    await api.post(`/api/canvas/${canvasId}/merge`, { node_ids: nodeIds, branch_id: branchId });
    await loadCanvas(); // Reload whole canvas as this deletes multiple and creates one
  }, [canvasId, branchId, loadCanvas]);

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
    persistNodePosition,
    updateNodeText,
    pinNode,
    deleteNode,
    createEdge,
    deleteEdge,
    mergeNodes,
    activeSourceFilter,
    setActiveSourceFilter,
  };
}

function toReactFlowNode(n: KleosNode): Node<KleosNode> {
  return {
    id:       n.id,
    type:     n.type,
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
