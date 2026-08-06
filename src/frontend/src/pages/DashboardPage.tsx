import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface Canvas {
  id: string;
  workspace_mode: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      api.get<{ canvases: Canvas[] }>('/api/canvases')
        .then(res => setCanvases(res.canvases || []))
        .catch(err => console.error('Failed to fetch canvases:', err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleNewCanvas = async () => {
    setCreating(true);
    try {
      const res = await api.post<{ id: string; branch_id: string }>('/api/canvas', { workspace_mode: 'analytical' });
      navigate(`/workspace/${res.id}`);
    } catch (err) {
      console.error('Failed to create canvas:', err);
      setCreating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#edede8] flex items-center justify-center">
        <p className="text-[14px] text-[#6f6f6e] font-medium tracking-tight">Loading Dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#edede8]">
      <main className="pt-[100px] px-6 max-w-[1200px] mx-auto w-full pb-[100px]">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-[45px] font-medium text-[#292929] leading-[1.2] tracking-[-0.45px]">
              Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user.name?.split(' ')[0] || 'Thinker'}
            </h1>
            <p className="text-[19px] text-[#6f6f6e] mt-2 leading-[1.4]">
              Select a workspace or start a new thread.
            </p>
          </div>
          
          <button 
            onClick={handleNewCanvas}
            disabled={creating}
            className="bg-[#141414] text-[#ffffff] px-[24px] h-[48px] rounded-[200px] text-[16px] font-medium hover:bg-[#292929] transition-colors focus:outline-none focus:ring-2 focus:ring-[#000000] focus:ring-offset-2 focus:ring-offset-[#edede8] disabled:opacity-50 whitespace-nowrap"
          >
            {creating ? 'Creating...' : '+ New Canvas'}
          </button>
        </header>

        <section>
          <h2 className="text-[16px] text-[#8f8f8e] uppercase tracking-wider mb-6 font-medium">Recent Workspaces</h2>
          
          {canvases.length === 0 ? (
            <div className="bg-[#ffffff] rounded-[12px] p-[48px] border border-[#0000001f] shadow-sm text-center">
              <span className="material-symbols-outlined text-[48px] text-[#c0c0c0] mb-4">dataset</span>
              <h3 className="text-[19px] font-medium text-[#292929] mb-2">No workspaces yet</h3>
              <p className="text-[16px] text-[#6f6f6e] mb-6">Create a new canvas to start mapping your ideas.</p>
              <button 
                onClick={handleNewCanvas}
                className="bg-[#dbdbd2] text-[#292929] px-[24px] h-[48px] rounded-[200px] text-[16px] font-medium hover:bg-[#c0c0c0] transition-colors focus:outline-none focus:ring-2 focus:ring-[#000000] focus:ring-offset-2 focus:ring-offset-[#ffffff]"
              >
                Create Canvas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {canvases.map(canvas => (
                <div 
                  key={canvas.id}
                  onClick={() => navigate(`/workspace/${canvas.id}`)}
                  className="bg-[#ffffff] rounded-[12px] p-[24px] border border-[#0000001f] shadow-sm hover:shadow-md cursor-pointer transition-shadow group flex flex-col h-[200px]"
                >
                  <div className="flex items-center justify-between mb-auto">
                    <span className="inline-block px-3 py-1 bg-[#edede8] rounded-[6px] text-[12px] font-medium text-[#353535] capitalize">
                      {canvas.workspace_mode} Mode
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-[#8f8f8e] group-hover:text-[#141414] transition-colors">
                      arrow_forward
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-[19px] font-medium text-[#292929] mb-2 leading-[1.4]">
                      Untitled Workspace
                    </h3>
                    <p className="text-[14px] text-[#6f6f6e]">
                      Last updated {new Date(canvas.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
