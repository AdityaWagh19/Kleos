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
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setExportError(null);
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
      setExportError(`Export failed: ${String(err)}`);
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
          className="fixed inset-0 z-50 flex items-center justify-center font-switzer"
          style={{ background: 'rgba(237, 237, 232, 0.4)', backdropFilter: 'blur(2px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            style={{ width: 400, background: 'var(--color-frosted-white)', border: '1px solid var(--color-warm-stone)', borderRadius: '12px', padding: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-charcoal-body)', margin: 0 }}>Export Canvas</h3>
              <button onClick={onClose} className="material-symbols-outlined hover:text-gray-800 transition-colors"
                      style={{ fontSize: '20px', color: 'var(--color-slate-caption)' }}>close</button>
            </div>

            {/* Format */}
            <p style={{ fontSize: '11px', color: 'var(--color-slate-caption)', textTransform: 'uppercase',
                        letterSpacing: '0.04em', marginBottom: 8, fontWeight: 600 }}>Format</p>
            <div className="flex gap-2 mb-6">
              {(['markdown', 'pdf'] as ExportFormat[]).map(f => (
                <button key={f} onClick={() => setFormat(f)}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '6px',
                          fontSize: '12px', fontWeight: 500,
                          background: format === f ? 'var(--color-graphite-ink)' : 'transparent',
                          color:      format === f ? 'var(--color-frosted-white)' : 'var(--color-slate-caption)',
                          border:     format === f ? '1px solid var(--color-graphite-ink)' : '1px solid var(--color-warm-stone)',
                          transition: 'all 0.2s',
                        }}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Content type */}
            <p style={{ fontSize: '11px', color: 'var(--color-slate-caption)', textTransform: 'uppercase',
                        letterSpacing: '0.04em', marginBottom: 8, fontWeight: 600 }}>Content</p>
            {TYPES.map(({ value, label, desc }) => (
              <button key={value} onClick={() => setType(value)}
                      className="w-full text-left px-3 py-2.5 mb-2 transition-colors"
                      style={{
                        borderRadius: '6px', fontSize: '12px',
                        background:   type === value ? '#ffffff' : 'transparent',
                        border:       type === value ? '1px solid var(--color-warm-stone)' : '1px solid transparent',
                        boxShadow:    type === value ? '0 2px 8px rgba(0,0,0,0.02)' : 'none',
                      }}>
                <span style={{ color: 'var(--color-charcoal-body)', fontWeight: 600 }}>{label}</span>
                <span style={{ color: 'var(--color-slate-caption)', marginLeft: 8 }}>{desc}</span>
              </button>
            ))}

            {/* PDF progress bar */}
            {loading && format === 'pdf' && (
              <div className="mb-3 mt-4">
                <div style={{ height: 4, background: 'var(--color-warm-stone)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', background: 'var(--color-graphite-ink)', borderRadius: '9999px' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--color-slate-caption)', marginTop: 6, fontWeight: 500 }}>
                  Generating PDF...
                </p>
              </div>
            )}

            {exportError && (
              <div role="alert" className="mt-4" style={{ color: 'var(--color-error, #d44)', fontSize: '12px' }}>
                {exportError}
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full mt-6 py-3 transition-all hover:bg-[#292929]"
              style={{
                background:   'var(--color-graphite-ink)',
                color:        'var(--color-frosted-white)',
                fontSize:     '14px',
                fontWeight:   600,
                borderRadius: '6px',
                opacity:      loading ? 0.7 : 1,
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
