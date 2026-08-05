import { useState } from 'react';
import type { Branch } from '../types';
import { api } from '../services/api';

interface Props {
  canvasId: string;
  branches: Branch[];
  activeBranchId: string;
  compareMode: boolean;
  onBranchSwitch: (branchId: string) => void;
  onCompare: (branchA: string, branchB: string) => void;
  onBranchCreated: (branch: Branch) => void;
}

export function BranchRail({
  canvasId, branches, activeBranchId, compareMode,
  onBranchSwitch, onCompare, onBranchCreated,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState('');

  const createBranch = async () => {
    if (!newName.trim()) return;
    const result = await api.post<{ branch_id: string }>(
      `/api/canvas/${canvasId}/branch`,
      { name: newName.trim() }
    );
    const b: Branch = {
      id: result.branch_id, canvas_id: canvasId,
      name: newName.trim(), created_at: new Date().toISOString(), status: 'active',
    };
    onBranchCreated(b);
    onBranchSwitch(result.branch_id);
    setCreating(false);
    setNewName('');
  };

  return (
    <div
      className="flex items-center px-3 gap-1.5 overflow-x-auto shrink-0"
      style={{ height: '36px', background: '#1a1a1a', borderBottom: '1px solid #2b2b2b' }}
    >
      {branches.map(branch => (
        <div key={branch.id} className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onBranchSwitch(branch.id)}
            className="px-2.5 py-1 transition-colors"
            style={{
              fontSize:     '11px',
              fontWeight:   500,
              borderRadius: '4px',
              background:   activeBranchId === branch.id ? '#2b2b2b' : 'transparent',
              color:        activeBranchId === branch.id ? '#f9f9f9' : '#9c9c9c',
              border:       activeBranchId === branch.id ? '1px solid #e5ff5d' : '1px solid transparent',
            }}
          >
            {branch.name}
            {branch.status === 'committed' && (
              <span className="material-symbols-outlined ml-1" style={{ fontSize: '10px', color: '#4caf7d' }}>check</span>
            )}
          </button>

          {activeBranchId !== branch.id && (
            <button
              onClick={() => onCompare(activeBranchId, branch.id)}
              title={`Compare with ${branch.name}`}
              style={{ color: '#9c9c9c', padding: '0 2px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>compare_arrows</span>
            </button>
          )}
        </div>
      ))}

      {creating ? (
        <div className="flex items-center gap-1 ml-1">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createBranch(); if (e.key === 'Escape') setCreating(false); }}
            placeholder="Branch name..."
            autoFocus
            className="px-2 py-0.5 outline-none"
            style={{ background: '#111111', border: '1px solid #e5ff5d', borderRadius: '4px',
                     fontSize: '11px', color: '#f9f9f9', width: 112 }}
          />
          <button onClick={createBranch} style={{ fontSize: '10px', fontWeight: 500, color: '#e5ff5d' }}>
            Create
          </button>
          <button onClick={() => setCreating(false)} style={{ fontSize: '10px', color: '#9c9c9c' }}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          title="Create branch (B)"
          style={{ color: '#9c9c9c', marginLeft: 4 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>fork_right</span>
        </button>
      )}

      {compareMode && (
        <span
          className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-[0.04em]"
          style={{ color: '#f5c842', whiteSpace: 'nowrap' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>compare</span>
          Compare Mode
        </span>
      )}
    </div>
  );
}
