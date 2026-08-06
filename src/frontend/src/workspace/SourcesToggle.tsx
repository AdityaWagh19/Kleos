import { useState } from 'react';

interface Props {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  sources: { id: string; name: string }[];
}

export function SourcesToggle({ activeFilter, onFilterChange, sources }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-6 right-6 z-40 font-switzer">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-colors ${
            activeFilter ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            {activeFilter ? 'filter_alt' : 'folder'}
          </span>
          Sources
          {activeFilter && (
            <span
              className="material-symbols-outlined hover:text-red-400 ml-1"
              style={{ fontSize: '14px' }}
              onClick={(e) => {
                e.stopPropagation();
                onFilterChange(null);
              }}
            >
              close
            </span>
          )}
        </button>

        {open && (
          <div
            className="absolute bottom-full right-0 mb-2 w-48 rounded-lg shadow-lg border overflow-hidden"
            style={{ background: 'var(--color-frosted-white)', borderColor: 'var(--color-warm-stone)' }}
          >
            <div className="p-2 border-b" style={{ borderColor: 'var(--color-warm-stone)' }}>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Filter by Source</h4>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {sources.length === 0 ? (
                <p className="p-3 text-xs text-gray-400 italic">No sources dropped yet.</p>
              ) : (
                sources.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onFilterChange(s.id === activeFilter ? null : s.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                      s.id === activeFilter ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                    }`}
                    style={{ color: 'var(--color-charcoal-body)' }}
                  >
                    {s.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
