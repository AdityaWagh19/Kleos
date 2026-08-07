-- ============================================================
-- Kleos — Consolidated Migration Script
-- Paste this entire file into Supabase Dashboard → SQL Editor
-- Fully idempotent: safe to re-run multiple times.
-- ============================================================

-- ── 1. CORE TABLES (create if missing) ──────────────────────

CREATE TABLE IF NOT EXISTS canvases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT,
  workspace_mode TEXT NOT NULL DEFAULT 'analytical'
    CHECK (workspace_mode IN ('analytical', 'creative', 'critical', 'strategic')),
  incognito_mode BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'main',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'committed', 'discarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'idea','evidence','assumption','question',
    'constraint','insight','decision','source','problem_statement'
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
  memory_scope TEXT CHECK (memory_scope IN ('session','workspace','global','source')),
  memory_tier INTEGER CHECK (memory_tier IN (0,1,2,3)),
  impact_nodes JSONB NOT NULL DEFAULT '[]',
  position JSONB NOT NULL DEFAULT '{"x":0,"y":0}',
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  cluster_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'ai' CHECK (created_by IN ('user','ai')),
  input_modality TEXT NOT NULL DEFAULT 'text'
    CHECK (input_modality IN ('text','voice','drop')),
  workspace_mode_at_creation TEXT DEFAULT 'analytical'
);

CREATE TABLE IF NOT EXISTS edges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('supports','contradicts','depends_on','derived_from')),
  confidence TEXT NOT NULL DEFAULT 'medium'
    CHECK (confidence IN ('low','medium','high')),
  label TEXT,
  created_by TEXT NOT NULL DEFAULT 'ai' CHECK (created_by IN ('user','ai')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tier INTEGER NOT NULL CHECK (tier IN (0,1,2,3)),
  scope TEXT NOT NULL DEFAULT 'session'
    CHECK (scope IN ('global','workspace','session','source')),
  text TEXT NOT NULL,
  provenance JSONB DEFAULT '{}',
  canvas_id TEXT REFERENCES canvases(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used TIMESTAMPTZ,
  quarantined BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  rejected BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'ai' CHECK (author IN ('user','ai')),
  input_modality TEXT DEFAULT 'text'
    CHECK (input_modality IN ('text','voice','drop')),
  affected_node_ids JSONB DEFAULT '[]',
  delta JSONB DEFAULT '{}',
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL,
  workspace_mode TEXT DEFAULT 'analytical'
);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. ADDITIVE COLUMN CHANGES ───────────────────────────────

ALTER TABLE edges   ADD COLUMN IF NOT EXISTS label      TEXT;
ALTER TABLE edges   ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT 'ai';
ALTER TABLE canvases ADD COLUMN IF NOT EXISTS title     TEXT;
ALTER TABLE nodes   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ── 3. CONSTRAINT REPAIRS ────────────────────────────────────

-- M-05: nodes.memory_scope — add 'source' value
ALTER TABLE nodes DROP CONSTRAINT IF EXISTS nodes_memory_scope_check;
ALTER TABLE nodes ADD CONSTRAINT nodes_memory_scope_check
  CHECK (memory_scope IN ('session','workspace','global','source'));

-- nodes.type — add 'problem_statement'
ALTER TABLE nodes DROP CONSTRAINT IF EXISTS nodes_type_check;
ALTER TABLE nodes ADD CONSTRAINT nodes_type_check
  CHECK (type IN (
    'idea','evidence','assumption','question',
    'constraint','insight','decision','source','problem_statement'
  ));

-- M-06: events.event_type — full expanded set
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;
ALTER TABLE events ADD CONSTRAINT events_event_type_check
  CHECK (event_type IN (
    'node_created','node_deleted','edge_created','edge_deleted','merge',
    'branch_created','branch_committed','assumption_overridden',
    'memory_accepted','memory_rejected','mode_changed',
    'quick_override_set','voice_command_received',
    'node_text_updated','node_position_updated','node_pinned',
    'reasoning_feedback','session_audit_triggered'
  ));

-- DB-04: memories.canvas_id ON DELETE CASCADE
ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_canvas_id_fkey;
ALTER TABLE memories ADD CONSTRAINT memories_canvas_id_fkey
  FOREIGN KEY (canvas_id) REFERENCES canvases(id) ON DELETE CASCADE;

-- ── 4. TRIGGERS ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION kleos_update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_canvases_updated_at ON canvases;
CREATE TRIGGER trg_canvases_updated_at
  BEFORE UPDATE ON canvases
  FOR EACH ROW EXECUTE FUNCTION kleos_update_updated_at();

DROP TRIGGER IF EXISTS trg_nodes_updated_at ON nodes;
CREATE TRIGGER trg_nodes_updated_at
  BEFORE UPDATE ON nodes
  FOR EACH ROW EXECUTE FUNCTION kleos_update_updated_at();

-- ── 5. ROW LEVEL SECURITY (DB-03) ───────────────────────────

ALTER TABLE canvases  ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS canvases_service_role ON canvases;
CREATE POLICY canvases_service_role ON canvases
  USING (auth.role() = 'service_role');

-- ── 6. PERFORMANCE INDEXES ───────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_nodes_canvas_branch   ON nodes(canvas_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_nodes_canvas_type     ON nodes(canvas_id, type);
CREATE INDEX IF NOT EXISTS idx_nodes_branch          ON nodes(branch_id);
CREATE INDEX IF NOT EXISTS idx_edges_canvas_branch   ON edges(canvas_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_edges_branch          ON edges(branch_id);
CREATE INDEX IF NOT EXISTS idx_memories_canvas_tier  ON memories(canvas_id, tier);
CREATE INDEX IF NOT EXISTS idx_memories_quarantined  ON memories(quarantined) WHERE quarantined = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_canvas         ON events(canvas_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_canvas_type_ts ON events(canvas_id, event_type, timestamp DESC);
