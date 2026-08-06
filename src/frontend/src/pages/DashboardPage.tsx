import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface Canvas {
  id: string;
  workspace_mode: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

function CanvasSkeleton() {
  return (
    <div className="rounded-[12px] border border-[#0000001f] p-[24px] h-[180px] flex flex-col gap-3 animate-pulse"
         style={{ backgroundColor: 'var(--color-frosted-white)' }}>
      <div className="flex justify-between">
        <div className="h-5 w-24 rounded-full bg-[#edede8]" />
        <div className="h-5 w-5 rounded-full bg-[#edede8]" />
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <div className="h-5 w-40 rounded bg-[#edede8]" />
        <div className="h-4 w-28 rounded bg-[#edede8]" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCanvases = () => {
    setLoading(true);
    setError(null);
    api.get<{ canvases: Canvas[] }>('/api/canvases')
      .then(res => setCanvases(res.canvases || []))
      .catch(() => setError('Failed to load workspaces. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCanvases();
  }, []);

  const handleNewCanvas = async () => {
    setCreating(true);
    try {
      const res = await api.post<{ id: string }>('/api/canvas', { workspace_mode: 'analytical' });
      navigate(`/workspace/${res.id}`);
    } catch {
      setCreating(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getCanvasLabel = (canvas: Canvas) => {
    if (canvas.title) return canvas.title;
    return `${canvas.workspace_mode.charAt(0).toUpperCase() + canvas.workspace_mode.slice(1)} Workspace`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="px-6 py-[60px] max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
        <div>
          <h1
            className="text-[45px] font-medium text-[#292929] leading-[1.2] tracking-[-0.45px]"
            style={{ fontFamily: 'var(--font-switzer)' }}
          >
            {greeting()}, {user?.name?.split(' ')[0] ?? 'Thinker'}
          </h1>
          <p className="text-[17px] text-[#6f6f6e] mt-2">
            Your thinking workspaces
          </p>
        </div>

        <button
          onClick={handleNewCanvas}
          disabled={creating}
          className="shrink-0 bg-[#141414] text-[#ffffff] px-[24px] h-[48px] rounded-[200px] text-[15px] font-medium hover:bg-[#292929] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141414] focus-visible:ring-offset-2 focus-visible:ring-offset-[#edede8]"
          style={{ fontFamily: 'var(--font-switzer)' }}
        >
          {creating ? 'Creating…' : '+ New workspace'}
        </button>
      </header>

      {/* Error state */}
      {error && (
        <div className="mb-8 p-4 rounded-[12px] border border-[#e84040]/20 bg-[#e84040]/5 flex items-center justify-between gap-4">
          <p className="text-[14px] text-[#e84040]">{error}</p>
          <button
            onClick={fetchCanvases}
            className="text-[14px] text-[#e84040] underline focus:outline-none"
          >
            Retry
          </button>
        </div>
      )}

      {/* Section label */}
      <h2
        className="text-[11px] text-[#8f8f8e] uppercase tracking-wider mb-5 font-medium"
        style={{ fontFamily: 'var(--font-switzer)' }}
      >
        Recent workspaces
      </h2>

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <CanvasSkeleton key={i} />)}
        </div>
      ) : canvases.length === 0 ? (
        /* Empty state */
        <div
          className="rounded-[12px] border border-[#0000001f] p-[48px] text-center"
          style={{ backgroundColor: 'var(--color-frosted-white)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--color-warm-stone)' }}
          >
            <span className="material-symbols-outlined text-[22px] text-[#6f6f6e]">
              schema
            </span>
          </div>
          <h3 className="text-[19px] font-medium text-[#292929] mb-2">No workspaces yet</h3>
          <p className="text-[15px] text-[#6f6f6e] mb-8 max-w-[320px] mx-auto leading-relaxed">
            Create your first canvas to start mapping ideas spatially.
          </p>
          <button
            onClick={handleNewCanvas}
            disabled={creating}
            className="bg-[#141414] text-[#ffffff] px-[24px] h-[48px] rounded-[200px] text-[15px] font-medium hover:bg-[#292929] transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141414] focus-visible:ring-offset-2"
          >
            {creating ? 'Creating…' : 'Create workspace'}
          </button>
        </div>
      ) : (
        /* Canvas grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {canvases.map(canvas => (
            <div
              key={canvas.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/workspace/${canvas.id}`)}
              onKeyDown={e => e.key === 'Enter' && navigate(`/workspace/${canvas.id}`)}
              className="group rounded-[12px] border border-[#0000001f] p-[24px] h-[180px] flex flex-col cursor-pointer hover:border-[#0000003f] hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]"
              style={{ backgroundColor: 'var(--color-frosted-white)' }}
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-auto">
                <span
                  className="inline-flex items-center px-[10px] py-[3px] rounded-[6px] text-[11px] font-medium text-[#6f6f6e] uppercase tracking-wider"
                  style={{ backgroundColor: 'var(--color-linen-canvas)' }}
                >
                  {canvas.workspace_mode}
                </span>
                <span className="material-symbols-outlined text-[16px] text-[#c0c0c0] group-hover:text-[#141414] transition-colors">
                  arrow_forward
                </span>
              </div>

              {/* Bottom content */}
              <div>
                <h3
                  className="text-[17px] font-medium text-[#292929] mb-1 leading-snug truncate"
                  style={{ fontFamily: 'var(--font-switzer)' }}
                >
                  {getCanvasLabel(canvas)}
                </h3>
                <p className="text-[13px] text-[#8f8f8e]">
                  Updated {formatDate(canvas.updated_at)}
                </p>
              </div>
            </div>
          ))}

          {/* New canvas card */}
          <button
            onClick={handleNewCanvas}
            disabled={creating}
            className="group rounded-[12px] border border-dashed border-[#c0c0c0] p-[24px] h-[180px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#8f8f8e] hover:bg-[#ffffff] transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-[#dbdbd2] transition-colors"
              style={{ backgroundColor: 'var(--color-linen-canvas)' }}
            >
              <span className="material-symbols-outlined text-[20px] text-[#6f6f6e]">add</span>
            </div>
            <span className="text-[14px] text-[#6f6f6e] group-hover:text-[#292929] transition-colors font-medium">
              {creating ? 'Creating…' : 'New workspace'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
