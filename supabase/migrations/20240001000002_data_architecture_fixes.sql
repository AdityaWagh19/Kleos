-- Migration: Data Architecture & Schema Fixes (DB-01, DB-02, DB-04, M-05, M-06)

-- DB-01: updated_at trigger for canvases
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_canvases_updated_at ON canvases;
CREATE TRIGGER update_canvases_updated_at
    BEFORE UPDATE ON canvases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- DB-02: Add missing label column to edges table
ALTER TABLE edges ADD COLUMN IF NOT EXISTS label TEXT;

-- DB-04: ON DELETE CASCADE for canvas-linked memories
ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_canvas_id_fkey;
ALTER TABLE memories ADD CONSTRAINT memories_canvas_id_fkey
    FOREIGN KEY (canvas_id) REFERENCES canvases(id) ON DELETE CASCADE;

-- M-05: Update DB CHECK for memory_scope in nodes table to include 'source'
ALTER TABLE nodes DROP CONSTRAINT IF EXISTS nodes_memory_scope_check;
ALTER TABLE nodes ADD CONSTRAINT nodes_memory_scope_check
    CHECK (memory_scope IN ('session','workspace','global','source'));

-- M-06: Update DB CHECK for event_type in events table to include all missing UI/compilation events
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;
