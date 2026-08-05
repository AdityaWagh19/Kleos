import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ExportFormat = 'markdown' | 'pdf';
type ExportType   = 'full' | 'decision_summary' | 'research_notes';

interface Props {
  open: boolean;
  canvasId: string;
  branchId: string;
  onClose: () => void;
}

const TYPES: Array<{ value: ExportType; label: string; desc: string }> = [
  { value: 'full',             label: 'Full Canvas',       desc: 'Everything' },
  { value: 'decision_summary', label: 'Decision Summary',  desc: 'Problem, Assumptions, Evidence, Decisions' },
  { value: 'research_notes',   label: 'Research Notes',    desc: 'Evidence, Questions, Reasoning' },
];

export function ExportDialog({ open, canvasId, branchId, onClose }: Props) {
  const [format,   setFormat]   = useState<ExportFormat>('markdown');
  const [type,     setType]     = useState<ExportType>('decision_summary');
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    setLoading(true);
    const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
    const qs   = `branch_id=${branchId}&export_type=${type}`;

    try {
      if (format === 'markdown') {
        window.open(`${base}/api/canvas/${canvasId}/export/markdown?${qs}`, '_blank');
      } else {
        // PDF — stream download
        setProgress(10);
        const resp = await fetch(
          `${base}/api/canvas/${canvasId}/export/pdf?${qs}`,
          { method: 'POST' }
        );
        setProgress(80);
        if (!resp.ok) throw new Error(await resp.text());
        const blob = await resp.blob();
        setProgress(100);
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'kleos-export.pdf';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert(`Export failed: ${err}`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(17,17,17,0.8)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            style={{ width: 384, background: '#1a1a1a', border: '1px solid #2b2b2b', borderRadius: '12px', padding: 20 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#f9f9f9', margin: 0 }}>Export Canvas</h3>
              <button onClick={onClose} className="material-symbols-outlined"
                      style={{ fontSize: '18px', color: '#9c9c9c' }}>close</button>
            </div>

            {/* Format */}
            <p style={{ fontSize: '11px', color: '#9c9c9c', textTransform: 'uppercase',
                        letterSpacing: '0.04em', marginBottom: 8 }}>Format</p>
            <div className="flex gap-2 mb-4">
              {(['markdown', 'pdf'] as ExportFormat[]).map(f => (
                <button key={f} onClick={() => setFormat(f)}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '4px',
                          fontSize: '12px', fontWeight: 500,
                          background: format === f ? '#e5ff5d' : 'transparent',
                          color:      format === f ? '#111111' : '#9c9c9c',
                          border:     format === f ? '1px solid #e5ff5d' : '1px solid #565656',
                        }}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Content type */}
            <p style={{ fontSize: '11px', color: '#9c9c9c', textTransform: 'uppercase',
                        letterSpacing: '0.04em', marginBottom: 8 }}>Content</p>
            {TYPES.map(({ value, label, desc }) => (
              <button key={value} onClick={() => setType(value)}
                      className="w-full text-left px-3 py-2 mb-1.5 transition-colors"
                      style={{
                        borderRadius: '4px', fontSize: '12px',
                        background:   type === value ? '#2b2b2b' : 'transparent',
                        border:       type === value ? '1px solid #565656' : '1px solid transparent',
                      }}>
                <span style={{ color: '#f9f9f9', fontWeight: 500 }}>{label}</span>
                <span style={{ color: '#9c9c9c', marginLeft: 8 }}>{desc}</span>
              </button>
            ))}

            {/* PDF progress bar */}
            {loading && format === 'pdf' && (
              <div className="mb-3 mt-3">
                <div style={{ height: 4, background: '#2b2b2b', borderRadius: '9999px', overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', background: '#e5ff5d', borderRadius: '9999px' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p style={{ fontSize: '11px', color: '#9c9c9c', marginTop: 4 }}>
                  Generating PDF...
                </p>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full mt-4 py-2.5 transition-opacity"
              style={{
                background:   '#e5ff5d',
                color:        '#111111',
                fontSize:     '13px',
                fontWeight:   500,
                borderRadius: '4px',
                opacity:      loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Generating...' : 'Export'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
