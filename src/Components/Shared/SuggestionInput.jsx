import React, { useState, useEffect, useRef } from "react";

const SuggestionInput = ({
  value,
  onChange,
  onSelect,
  onFocus,
  placeholder,
  error,
  type = "text",
  required = true,
  label,
  suggestions = [],
  loading = false,
  showDropdownConditions = true,
  className="",
  inputClassName="",
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDisplay = (suggestion) =>
    typeof suggestion === 'object'
      ? (suggestion.display || suggestion.countryCode || Object.values(suggestion)[0])
      : suggestion;

  const getActual = (suggestion) =>
    typeof suggestion === 'object'
      ? (suggestion.value || suggestion.countryCode || Object.values(suggestion)[0])
      : suggestion;

  const trimmedValue = String(value ?? "").trim();

  const filteredSuggestions = suggestions.filter((suggestion) => {
    if (!value) return true;
    return String(getDisplay(suggestion)).toLowerCase().includes(String(value).toLowerCase());
  });

  const hasExactMatch = suggestions.some(
    (s) => String(getDisplay(s)).toLowerCase() === trimmedValue.toLowerCase()
  );

  const canAddNew = !loading && trimmedValue.length > 0 && !hasExactMatch;

  const handleAddNew = () => {
    if (onSelect) {
      onSelect(trimmedValue, trimmedValue);
    } else {
      onChange(trimmedValue);
    }
    setShowSuggestions(false);
  };

  const shouldShowDropdown =
    showSuggestions &&
    showDropdownConditions &&
    (loading || filteredSuggestions.length > 0 || canAddNew);

  return (
    <div className={`space-y-1 relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          error
            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300"
        } ${inputClassName}`}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onClick={() => {
          setShowSuggestions(true);
        }}
        onFocus={() => {
          if (onFocus) onFocus();
          setShowSuggestions(true);
        }}
        placeholder={placeholder}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}

      {shouldShowDropdown && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-48 overflow-auto">
          {loading && (
            <li className="px-4 py-2 text-sm text-gray-500 flex items-center justify-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span>Loading suggestions…</span>
            </li>
          )}

          {!loading &&
            filteredSuggestions.map((suggestion, index) => {
              const displayValue = getDisplay(suggestion);
              const actualValue = getActual(suggestion);

              return (
                <li
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 break-words"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevents input onBlur before click
                  }}
                  onClick={() => {
                    if (onSelect) {
                      onSelect(actualValue, suggestion);
                    } else {
                      onChange(actualValue);
                    }
                    setShowSuggestions(false);
                  }}
                >
                  {displayValue}
                </li>
              );
            })}

          {canAddNew && (
            <li className="border-t border-gray-100 bg-gray-50 sticky bottom-0">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleAddNew}
                className="w-full px-4 py-2 flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span className="truncate">Add "{trimmedValue}" as new entry</span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SuggestionInput;
