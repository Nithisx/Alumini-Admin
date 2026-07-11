"use client";

import { useEffect, useRef, useState } from "react";

const MAX_DROPDOWN_ITEMS = 50;

const HighlightMatch = ({ text, query }) => {
  const q = (query || "").trim();
  const strText = String(text ?? "");
  if (!q) return <span>{strText}</span>;
  const idx = strText.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <span>{strText}</span>;
  return (
    <span>
      {strText.substring(0, idx)}
      <mark className="bg-blue-100 text-blue-800 rounded px-0.5">
        {strText.substring(idx, idx + q.length)}
      </mark>
      {strText.substring(idx + q.length)}
    </span>
  );
};

/**
 * MultiSelectAutocomplete
 * - `values`: array of selected strings
 * - `onChange(nextValues)`: invoked with the new array of values
 * - `options`: array of candidate suggestion strings (current filtered list from API)
 * - `loading`: when true, show a spinner inside the dropdown
 *
 * Behavior:
 *  - Clicking a suggestion toggles it (adds or removes from the values array).
 *  - Pressing Enter accepts the first suggestion, or the typed value if no
 *    suggestion matches. The input is cleared after each accept so the user
 *    can keep adding more values (multi-select).
 *  - Selected values appear as removable chips inside the input.
 *  - The full options list stays cached so suggestions remain meaningful
 *    even after the backend narrows the queryset.
 */
export default function MultiSelectAutocomplete({
  id,
  label,
  placeholder,
  values = [],
  onChange,
  options = [],
  loading = false,
  icon,
  filterType,
}) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Cache strategy:
  // - When no values are selected: always use the fresh (context-narrowed) options from backend.
  // - When values are selected: only expand the cache, never shrink it, so the user can
  //   continue adding more items even after the backend narrows the list for that field.
  const cachedRef = useRef([]);
  const valuesLen = (values || []).length;
  useEffect(() => {
    const fresh = options || [];
    if (fresh.length === 0) return;
    if (valuesLen === 0 || fresh.length > cachedRef.current.length) {
      cachedRef.current = fresh;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, valuesLen]);

  const computeFiltered = (q) => {
    const source = (cachedRef.current && cachedRef.current.length > 0)
      ? cachedRef.current
      : (options || []);
    const selectedSet = new Set((values || []).map((v) => String(v).toLowerCase()));
    const pool = source.filter((item) => !selectedSet.has(String(item).toLowerCase()));

    if (!q.trim()) {
      setTotalMatches(pool.length);
      setFiltered(pool.slice(0, MAX_DROPDOWN_ITEMS));
      return pool;
    }
    const needle = q.trim().toLowerCase();
    const matched = pool.filter((item) =>
      String(item).toLowerCase().includes(needle)
    );
    setTotalMatches(matched.length);
    setFiltered(matched.slice(0, MAX_DROPDOWN_ITEMS));
    return matched;
  };

  useEffect(() => {
    if (showDropdown) computeFiltered(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, values, showDropdown]);

  const addValue = (raw) => {
    const trimmed = String(raw || "").trim();
    if (!trimmed) return;
    const existing = (values || []).map((v) => v.toLowerCase());
    if (existing.includes(trimmed.toLowerCase())) {
      // toggle off if already selected
      onChange((values || []).filter((v) => v.toLowerCase() !== trimmed.toLowerCase()));
      return;
    }
    onChange([...(values || []), trimmed]);
  };

  const removeValue = (v) => {
    onChange((values || []).filter((x) => x !== v));
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    computeFiltered(val);
    setShowDropdown(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const matches = computeFiltered(query);
      if (matches.length > 0) {
        // Accept the first suggestion match only
        addValue(matches[0]);
        setQuery("");
        setShowDropdown(true);
      }
      // No match → do nothing; user must select from the dropdown
    } else if (e.key === "Backspace" && query === "" && (values || []).length > 0) {
      // Backspace on empty input pops the last chip
      onChange((values || []).slice(0, -1));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleFocus = () => {
    computeFiltered(query);
    setShowDropdown(true);
  };

  const handleClickSuggestion = (suggestion) => {
    addValue(suggestion);
    setQuery("");
    inputRef.current?.focus();
    setShowDropdown(true);
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    onChange([]);
    setQuery("");
    inputRef.current?.focus();
  };

  useEffect(() => {
    const onClickOutside = (ev) => {
      if (containerRef.current && !containerRef.current.contains(ev.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const hasValues = (values || []).length > 0;
  const isActive = hasValues || query.length > 0;

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <div
          className={`w-full border rounded-lg pl-10 pr-10 py-1.5 min-h-[42px] flex flex-wrap items-center gap-1.5 cursor-text focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all bg-white text-sm ${
            isActive
              ? "border-blue-400 bg-blue-50/30 shadow-sm shadow-blue-100"
              : "border-gray-300"
          }`}
          onClick={() => inputRef.current?.focus()}
        >
          {icon}

          {(values || []).map((v) => (
            <span
              key={`${filterType}-chip-${v}`}
              className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full px-2 py-0.5 text-xs font-medium max-w-[180px]"
              title={v}
            >
              <span className="truncate">{v}</span>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  removeValue(v);
                }}
                className="text-emerald-600 hover:text-red-600"
                aria-label={`Remove ${v}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}

          <input
            ref={inputRef}
            id={id}
            type="text"
            className="flex-1 min-w-[80px] bg-transparent outline-none text-sm py-1"
            placeholder={hasValues ? "Add more..." : placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            autoComplete="off"
          />

          {(hasValues || query) && (
            <button
              type="button"
              onMouseDown={handleClearAll}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
              title="Clear all"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {showDropdown && (
          <div
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto"
            onMouseDown={(e) => e.preventDefault()}
          >
            {loading ? (
              <div className="px-3 py-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                Loading suggestions…
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-3 text-center text-gray-500 text-sm">
                {query.trim() ? (
                  <>
                    <svg className="w-5 h-5 mx-auto mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    No matches for "<strong>{query}</strong>"
                  </>
                ) : (
                  "No options available"
                )}
              </div>
            ) : (
              <>
                {filtered.map((suggestion, index) => (
                  <div
                    key={`${filterType}-${index}-${suggestion}`}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-b-0 transition-colors group"
                    onMouseDown={() => handleClickSuggestion(suggestion)}
                  >
                    <span className="text-gray-700 group-hover:text-blue-700 transition-colors truncate block">
                      <HighlightMatch text={suggestion} query={query} />
                    </span>
                  </div>
                ))}
                {totalMatches > MAX_DROPDOWN_ITEMS && (
                  <div className="px-3 py-2 text-center text-xs text-gray-400 bg-gray-50 border-t border-gray-100 sticky bottom-0">
                    Showing {MAX_DROPDOWN_ITEMS} of {totalMatches} — type to narrow down
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { HighlightMatch };
