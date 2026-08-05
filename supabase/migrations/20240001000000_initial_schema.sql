-- Kleos — Initial Schema Migration
-- Run: supabase db push

-- Canvases
CREATE TABLE canvases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_mode TEXT NOT NULL DEFAULT 'analytical'
    CHECK (workspace_mode IN ('analytical', 'creative', 'critical', 'strategic')),
  incognito_mode BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Branches
CREATE TABLE branches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'main',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'committed', 'discarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Nodes
CREATE TABLE nodes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'idea','evidence','assumption','question',
    'constraint','insight','decision','source'
  )),
  text TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium'
    CHECK (confidence IN ('low','medium','high')),
  provenance_type TEXT NOT NULL
    CHECK (provenance_type IN (
      'document','core_memory','ai_inference',
      'parametric','user_created','voice_input'
    )),
  provenance_detail JSONB DEFAULT '{}',
  memory_scope TEXT CHECK (memory_scope IN ('session','workspace','global')),
  memory_tier INTEGER CHECK (memory_tier IN (0,1,2,3)),
  impact_nodes JSONB NOT NULL DEFAULT '[]',
  position JSONB NOT NULL DEFAULT '{"x":0,"y":0}',
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  cluster_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'ai' CHECK (created_by IN ('user','ai')),
  input_modality TEXT NOT NULL DEFAULT 'text'
    CHECK (input_modality IN ('text','voice','drop')),
  workspace_mode_at_creation TEXT DEFAULT 'analytical'
);

-- Edges
CREATE TABLE edges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('supports','contradicts','depends_on','derived_from')),
  confidence TEXT NOT NULL DEFAULT 'medium'
    CHECK (confidence IN ('low','medium','high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Memories (Four-Tier Architecture with PS06 quarantine enforcement)
-- Tier 0: Core (global, permanent)
-- Tier 1: Session/Workspace (canvas-scoped, scope column distinguishes)
-- Tier 2: Inferred (quarantined=TRUE until user ratifies — NEVER in LLM context while quarantined)
-- Tier 3: Source (tied to dropped artifacts)
CREATE TABLE memories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tier INTEGER NOT NULL CHECK (tier IN (0,1,2,3)),
  scope TEXT NOT NULL DEFAULT 'session'
    CHECK (scope IN ('global','workspace','session','source')),
  text TEXT NOT NULL,
  provenance JSONB DEFAULT '{}',
  canvas_id TEXT REFERENCES canvases(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used TIMESTAMPTZ,
  quarantined BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  rejected BOOLEAN NOT NULL DEFAULT FALSE
);

-- Events (Activity Log + Thinking Timeline + Rewind verb)
CREATE TABLE events (
  event_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'node_created','node_deleted','edge_created','merge',
    'branch_created','branch_committed','assumption_overridden',
    'memory_accepted','memory_rejected','mode_changed',
    'quick_override_set','voice_command_received'
  )),
  author TEXT NOT NULL DEFAULT 'ai' CHECK (author IN ('user','ai')),
  input_modality TEXT DEFAULT 'text'
    CHECK (input_modality IN ('text','voice','drop')),
  affected_node_ids JSONB DEFAULT '[]',
  delta JSONB DEFAULT '{}',
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL,
  workspace_mode TEXT DEFAULT 'analytical'
);

-- Artifacts (Supabase Storage file references)
CREATE TABLE artifacts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_nodes_canvas_branch ON nodes(canvas_id, branch_id);
CREATE INDEX idx_edges_canvas_branch ON edges(canvas_id, branch_id);
CREATE INDEX idx_memories_canvas_tier ON memories(canvas_id, tier);
CREATE INDEX idx_memories_quarantined ON memories(quarantined) WHERE quarantined = TRUE;
CREATE INDEX idx_events_canvas ON events(canvas_id, timestamp DESC);
