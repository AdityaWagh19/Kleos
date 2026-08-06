-- Kleos — Canvas Workspace V2 Migration
-- Additive only. No destructive changes.
-- Run after: 20240001000002_canvas_title_and_user_settings.sql

-- ── 1. Add updated_at to nodes ──────────────────────────────────────────────

ALTER TABLE nodes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Auto-update trigger
CREATE OR REPLACE FUNCTION kleos_update_nodes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nodes_updated_at ON nodes;
CREATE TRIGGER trg_nodes_updated_at
  BEFORE UPDATE ON nodes
  FOR EACH ROW EXECUTE FUNCTION kleos_update_nodes_updated_at();

-- ── 2. Fix memory_scope on nodes to include 'source' ────────────────────────
-- TypeScript types/index.ts already has 'source' — the DB was missing it.

ALTER TABLE nodes
  DROP CONSTRAINT IF EXISTS nodes_memory_scope_check;

ALTER TABLE nodes
  ADD CONSTRAINT nodes_memory_scope_check
  CHECK (memory_scope IN ('session', 'workspace', 'global', 'source'));

-- ── 3. Add created_by and label to edges ────────────────────────────────────

ALTER TABLE edges
  ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT 'ai'
    CHECK (created_by IN ('user', 'ai'));

ALTER TABLE edges
  ADD COLUMN IF NOT EXISTS label TEXT;

-- ── 4. Expand event_type CHECK to include user-action events ────────────────

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_event_type_check;

ALTER TABLE events
  ADD CONSTRAINT events_event_type_check
  CHECK (event_type IN (
    'node_created',
    'node_deleted',
    'node_text_updated',
    'node_position_updated',
    'node_pinned',
    'edge_created',
    'edge_deleted',
    'merge',
    'branch_created',
    'branch_committed',
    'assumption_overridden',
    'memory_accepted',
    'memory_rejected',
    'mode_changed',
    'quick_override_set',
    'voice_command_received',
    'reasoning_feedback'
  ));

-- ── 5. Performance indexes ───────────────────────────────────────────────────

-- For fast assumption lookup (GET /canvas/:id/assumptions)
CREATE INDEX IF NOT EXISTS idx_nodes_canvas_type
  ON nodes(canvas_id, type);

-- For activity log (GET /canvas/:id/activity)
CREATE INDEX IF NOT EXISTS idx_events_canvas_type_ts
  ON events(canvas_id, event_type, timestamp DESC);

-- For branch-scoped node lookup with branch_id filter support
CREATE INDEX IF NOT EXISTS idx_nodes_branch
  ON nodes(branch_id);

CREATE INDEX IF NOT EXISTS idx_edges_branch
  ON edges(branch_id);
