import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Memory, MemoryScope } from '../types';

export interface MemoryWithFreshness extends Memory {
  freshness?: { age_label: string; stale: boolean };
}

export function useMemory(canvasId: string) {
  const [memories, setMemories] = useState<MemoryWithFreshness[]>([]);
  const [loading, setLoading]   = useState(false);

  const loadMemories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<MemoryWithFreshness[]>(`/api/canvas/${canvasId}/memory`);
      setMemories(data);
    } finally {
      setLoading(false);
    }
  }, [canvasId]);

  const archiveMemory = useCallback(async (memoryId: string) => {
    await api.delete(`/api/canvas/${canvasId}/memory/${memoryId}`);
    setMemories(prev => prev.filter(m => m.id !== memoryId));
  }, [canvasId]);

  const updateMemory = useCallback(async (memoryId: string, text: string) => {
    await api.put(`/api/canvas/${canvasId}/memory/${memoryId}`, { text });
    setMemories(prev => prev.map(m => m.id === memoryId ? { ...m, text } : m));
  }, [canvasId]);

  const ratifyMemory = useCallback(async (memoryId: string, scope: MemoryScope) => {
    await api.post(`/api/canvas/${canvasId}/memory/${memoryId}/ratify`, { scope });
    await loadMemories();
  }, [canvasId, loadMemories]);

  const tier0 = memories.filter(m => m.tier === 0 && !m.quarantined && !m.rejected);
  const tier1 = memories.filter(m => m.tier === 1 && !m.quarantined && !m.rejected);
  const tier2 = memories.filter(m => m.tier === 2 &&  m.quarantined && !m.rejected);
  const tier3 = memories.filter(m => m.tier === 3 && !m.quarantined && !m.rejected);

  return { memories, loading, loadMemories, archiveMemory, updateMemory, ratifyMemory, tier0, tier1, tier2, tier3 };
}
