"use client";

/**
 * Renders a compact summary of all active filters as removable chips.
 * Hidden when nothing is active.
 *
 * Props:
 *  - filters: [{ key, label, values: string[], onRemove(value), onClear() }]
 *  - onClearAll(): clears every filter at once
 */
export default function ActiveFilterChips({ filters = [], onClearAll }) {
  const active = filters.filter((f) => (f.values || []).length > 0);
  if (active.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">
        Active filters
      </span>
      {active.flatMap((f) =>
        (f.values || []).map((v) => (
          <span
            key={`${f.key}-${v}`}
            className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full pl-2.5 pr-1 py-0.5 text-xs font-medium"
            title={`${f.label}: ${v}`}
          >
            <span className="text-emerald-600 font-semibold">{f.label}:</span>
            <span className="truncate max-w-[160px]">{v}</span>
            <button
              type="button"
              onClick={() => f.onRemove(v)}
              className="w-4 h-4 inline-flex items-center justify-center rounded-full hover:bg-red-100 text-emerald-700 hover:text-red-600 transition-colors"
              aria-label={`Remove filter ${f.label} = ${v}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))
      )}
      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="ml-auto text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
