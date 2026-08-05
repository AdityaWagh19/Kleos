import type { ProvenanceType } from '../types';

const FILTER_OPTIONS: Array<{ type: ProvenanceType; label: string; color: string }> = [
  { type: 'document',     label: 'Docs',   color: '#4a90d9' },
  { type: 'core_memory',  label: 'Memory', color: '#4caf7d' },
  { type: 'ai_inference', label: 'AI',     color: '#f5c842' },
  { type: 'parametric',   label: 'AI*',    color: '#e84040' },
  { type: 'voice_input',  label: 'Voice',  color: '#e5ff5d' },
  { type: 'user_created', label: 'You',    color: '#f9f9f9' },
];

interface Props {
  activeFilter: ProvenanceType | null;
  onFilter:     (type: ProvenanceType | null) => void;
}

export function SourceFilter({ activeFilter, onFilter }: Props) {
  return (
    <div className="flex items-center gap-1">
      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#9c9c9c' }}>
        filter_list
      </span>
      {FILTER_OPTIONS.map(({ type, label, color }) => {
        const active = activeFilter === type;
        return (
          <button
            key={type}
            onClick={() => onFilter(active ? null : type)}
            title={`Filter by ${label}`}
            className="px-1.5 py-0.5 transition-all"
            style={{
              fontSize:     '9px',
              fontWeight:   500,
              borderRadius: '4px',
              background:   active ? `${color}25` : 'transparent',
              border:       `1px solid ${active ? color : '#565656'}`,
              color:        active ? color : '#9c9c9c',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
