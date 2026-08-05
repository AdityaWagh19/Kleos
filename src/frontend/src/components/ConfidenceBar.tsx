import type { Confidence } from '../types';

const COLORS: Record<Confidence, string> = {
  low:    '#e84040',
  medium: '#f5c842',
  high:   '#4caf7d',
};
const WIDTHS: Record<Confidence, string> = {
  low:    '33%',
  medium: '66%',
  high:   '100%',
};

export function ConfidenceBar({ confidence }: { confidence: Confidence }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 overflow-hidden"
        style={{ height: 4, background: '#565656', borderRadius: '9999px' }}
      >
        <div
          style={{
            width:        WIDTHS[confidence],
            height:       '100%',
            background:   COLORS[confidence],
            borderRadius: '9999px',
            transition:   'width 0.3s',
          }}
        />
      </div>
      <span
        className="text-[10px] font-medium uppercase tracking-[0.04em]"
        style={{ color: COLORS[confidence] }}
      >
        {confidence}
      </span>
    </div>
  );
}
