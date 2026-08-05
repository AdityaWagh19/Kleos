import type { ProvenanceType } from '../types';

const BADGE_CONFIG: Record<
  ProvenanceType,
  { color: string; icon: string; label: string; title: string }
> = {
  document:     { color: '#4a90d9', icon: 'description', label: 'DOC',   title: 'Sourced from a dropped document' },
  core_memory:  { color: '#4caf7d', icon: 'memory',      label: 'MEM',   title: 'Drawn from Core Memory (Tier 0)' },
  ai_inference: { color: '#f5c842', icon: 'psychology',  label: 'INF',   title: 'Derived from canvas context' },
  parametric:   { color: '#e84040', icon: 'warning',     label: 'PAR',   title: 'AI parametric knowledge — no source document. Hallucination risk.' },
  user_created: { color: '#f9f9f9', icon: 'person',      label: 'YOU',   title: 'Created directly by you' },
  voice_input:  { color: '#e5ff5d', icon: 'mic',         label: 'VOICE', title: 'Created via voice command' },
};

interface Props {
  type: ProvenanceType;
  className?: string;
  showTooltip?: boolean;
}

export function ProvenanceBadge({ type, className = '', showTooltip = true }: Props) {
  const config = BADGE_CONFIG[type];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium tracking-[0.04em] ${className}`}
      style={{
        background: `${config.color}18`,
        border:     `1px solid ${config.color}60`,
        color:      config.color,
      }}
      title={showTooltip ? config.title : undefined}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>
        {config.icon}
      </span>
      {config.label}
    </span>
  );
}
