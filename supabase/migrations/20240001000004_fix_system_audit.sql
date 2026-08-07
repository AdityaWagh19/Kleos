-- Fixes for Kleos Workspace System Audit issues

-- DB-03: Enable RLS on all tables
ALTER TABLE canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- (Backend uses service_role key which bypasses RLS, securing against anon leaks)

-- DB-01: updated_at trigger for canvases
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_canvas_updated_at
BEFORE UPDATE ON canvases
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DB-02: edges.label missing column
ALTER TABLE edges ADD COLUMN IF NOT EXISTS label TEXT;

-- M-05: nodes.memory_scope missing 'source'
ALTER TABLE nodes DROP CONSTRAINT nodes_memory_scope_check;
ALTER TABLE nodes ADD CONSTRAINT nodes_memory_scope_check CHECK (memory_scope IN ('session','workspace','global','source'));

-- M-06: events.event_type missing log types
ALTER TABLE events DROP CONSTRAINT events_event_type_check;
ALTER TABLE events ADD CONSTRAINT events_event_type_check CHECK (event_type IN (
  'node_created','node_deleted','edge_created','edge_deleted','merge',
  'branch_created','branch_committed','assumption_overridden',
  'memory_accepted','memory_rejected','mode_changed',
  'quick_override_set','voice_command_received',
  'node_text_updated', 'node_position_updated', 'node_pinned',
  'reasoning_feedback', 'session_audit_triggered'
));

-- DB-04: memories.canvas_id cascade fix for tiered memories
ALTER TABLE memories DROP CONSTRAINT memories_canvas_id_fkey;
ALTER TABLE memories ADD CONSTRAINT memories_canvas_id_fkey FOREIGN KEY (canvas_id) REFERENCES canvases(id) ON DELETE CASCADE;
