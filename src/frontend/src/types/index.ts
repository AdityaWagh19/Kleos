// Kleos — Core domain types
// Source of truth for all FE/BE communication contracts.
// Defined in Phase 1 so all subsequent phases can implement against stable types.

export type NodeType =
  | 'idea'
  | 'evidence'
  | 'assumption'
  | 'question'
  | 'constraint'
  | 'insight'
  | 'decision'
  | 'source';

export type ProvenanceType =
  | 'document'
  | 'core_memory'
  | 'ai_inference'
  | 'parametric'
  | 'user_created'
  | 'voice_input';

export type Confidence = 'low' | 'medium' | 'high';
export type RelationType = 'supports' | 'contradicts' | 'depends_on' | 'derived_from';
export type InputModality = 'text' | 'voice' | 'drop';
export type WorkspaceMode = 'analytical' | 'creative' | 'critical' | 'strategic';
export type MemoryTier = 0 | 1 | 2 | 3;
export type MemoryScope = 'global' | 'workspace' | 'session' | 'source';
export type BranchStatus = 'active' | 'committed' | 'discarded';

// Status Pill — 3 mutually exclusive states
export type StatusPillState = 'working' | 'listening' | 'ready';

export interface ProvenanceDetail {
  source_id?: string;
  artifact_name?: string;
  page?: number;
  memory_tier?: MemoryTier;
  voice_transcript_segment?: string;
}

export interface KleosNode {
  id: string;
  type: NodeType;
  text: string;
  confidence: Confidence;
  provenance_type: ProvenanceType;
  provenance_detail: ProvenanceDetail;
  memory_scope?: MemoryScope;
  memory_tier?: MemoryTier;
  /**
   * Pre-computed at node creation time.
   * Lists IDs of nodes that depend on this node (used by Impact Halo).
   * NEVER recompute on hover — must be O(1) lookup.
   */
  impact_nodes: string[];
  position: { x: number; y: number };
  pinned: boolean;
  cluster_id?: string;
  branch_id: string;
  created_at: string;
  created_by: 'user' | 'ai';
  input_modality: InputModality;
  workspace_mode_at_creation: WorkspaceMode;
  // Runtime-only UI state (not persisted)
  isImpacted?: boolean;
  dimmed?: boolean;
  error?: string;
  onRetry?: () => void;
  entranceDelay?: number;
}

export interface KleosEdge {
  id: string;
  source: string;
  target: string;
  type: RelationType;
  confidence: Confidence;
}

export interface Memory {
  id: string;
  tier: MemoryTier;
  scope: MemoryScope;
  text: string;
  provenance: Record<string, unknown>;
  canvas_id?: string;
  created_at: string;
  last_used?: string;
  quarantined: boolean;
  archived: boolean;
  rejected: boolean;
}

export interface Branch {
  id: string;
  canvas_id: string;
  name: string;
  created_at: string;
  status: BranchStatus;
}

export interface CanvasState {
  canvas: {
    id: string;
    workspace_mode: WorkspaceMode;
    incognito_mode: boolean;
  };
  nodes: KleosNode[];
  edges: KleosEdge[];
  branches: Branch[];
}

export interface ReasoningStep {
  step: number;
  action: string;
  detail: string;
  confidence: Confidence;
}

export interface CompilationOutput {
  nodes: Array<
    Omit<KleosNode, 'position' | 'pinned' | 'cluster_id' | 'branch_id' | 'created_at' | 'created_by' | 'workspace_mode_at_creation'>
  >;
  reasoning_steps: ReasoningStep[];
  contradictions: Array<{ node_a: string; node_b: string; explanation: string }>;
  proposed_memories: Array<{ tier: 2; text: string; trigger: string }>;
}

export interface Assumption {
  node_id: string;
  statement: string;
  confidence: Confidence;
  provenance_type: ProvenanceType;
  impact_nodes: string[];
}

export interface ActivityEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  author: 'user' | 'ai';
  input_modality: InputModality;
  workspace_mode: WorkspaceMode;
}
