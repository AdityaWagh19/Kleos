import { useState } from 'react';
import type { KleosNode } from '../types';

interface Props {
  nodes: KleosNode[];
  onNodeSelect: (id: string) => void;
}

export function CanvasLeftRail({ nodes, onNodeSelect }: Props) {
  const [expanded, setExpanded] = useState(true);

  // Group nodes by type
  const nodeGroups = nodes.reduce((acc, node) => {
    const t = node.type;
    if (!acc[t]) acc[t] = [];
    acc[t].push(node);
    return acc;
  }, {} as Record<string, KleosNode[]>);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'idea': return 'lightbulb';
      case 'evidence': return 'description';
      case 'assumption': return 'psychology_alt';
      case 'question': return 'help_outline';
      case 'constraint': return 'block';
      case 'insight': return 'flare';
      case 'decision': return 'gavel';
      case 'source': return 'folder';
      default: return 'article';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'idea': return '#4a90d9';
      case 'evidence': return '#9a73d1';
      case 'assumption': return '#f5c842';
      case 'question': return '#e84040';
      case 'constraint': return '#e84040';
      case 'insight': return '#7dcfb6';
      case 'decision': return '#4a90d9';
      case 'source': return 'var(--color-slate-caption)';
      default: return 'var(--color-charcoal-body)';
    }
  };

  if (!expanded) {
    return (
      <div 
        className="h-full w-12 flex flex-col items-center py-4 border-r transition-all z-30 shrink-0"
        style={{ background: 'var(--color-frosted-white)', borderColor: 'var(--color-warm-stone)' }}
      >
        <button
          onClick={() => setExpanded(true)}
          className="material-symbols-outlined p-2 rounded hover:bg-gray-100 transition-colors mb-4"
          style={{ color: 'var(--color-charcoal-body)' }}
          title="Expand Navigator"
          aria-label="Expand Node Navigator"
        >
          chevron_right
        </button>

        {/* Mini indicators */}
        <div className="flex flex-col gap-3">
          {Object.entries(nodeGroups).map(([type, groupNodes]) => (
            <div
              key={type}
              className="relative group flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 cursor-pointer"
              title={`${groupNodes.length} ${type}s`}
              onClick={() => setExpanded(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: getTypeColor(type) }}>
                {getTypeIcon(type)}
              </span>
              <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-gray-200 text-gray-700 w-4 h-4 rounded-full flex items-center justify-center">
                {groupNodes.length}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full w-64 flex flex-col border-r transition-all z-30 shadow-sm shrink-0"
      style={{ background: 'var(--color-frosted-white)', borderColor: 'var(--color-warm-stone)', fontFamily: 'var(--font-switzer)' }}
    >
      <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--color-warm-stone)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-charcoal-body)' }}>Navigator</h2>
        <button
          onClick={() => setExpanded(false)}
          className="material-symbols-outlined p-1 rounded hover:bg-gray-100 transition-colors"
          style={{ color: 'var(--color-charcoal-body)' }}
          title="Collapse"
          aria-label="Collapse Node Navigator"
        >
          chevron_left
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {Object.entries(nodeGroups).map(([type, groupNodes]) => (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: getTypeColor(type) }}>
                {getTypeIcon(type)}
              </span>
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-slate-caption)' }}>
                {type}s ({groupNodes.length})
              </h3>
            </div>
            <div className="space-y-1">
              {groupNodes.map(node => (
                <button
                  key={node.id}
                  onClick={() => onNodeSelect(node.id)}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-100 truncate transition-colors"
                  style={{ color: 'var(--color-charcoal-body)' }}
                  title={node.text}
                >
                  {node.text}
                </button>
              ))}
            </div>
          </div>
        ))}
        {nodes.length === 0 && (
          <p className="text-xs text-gray-400 italic p-2">Canvas is empty</p>
        )}
      </div>
    </div>
  );
}
