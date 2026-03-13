import React, { useState, useEffect, useRef } from "react";

const SuggestionInput = ({
  value,
  onChange,
  onSelect,
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

  const filteredSuggestions = suggestions.filter((suggestion) => {
    if (!value) return true;
    const displayValue = typeof suggestion === 'object' ? 
      (suggestion.display || suggestion.countryCode || Object.values(suggestion)[0]) : 
      suggestion;
    return String(displayValue).toLowerCase().includes(String(value).toLowerCase());
  });

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
          if (!showSuggestions && filteredSuggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      {showSuggestions && showDropdownConditions && (filteredSuggestions.length > 0) && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-48 overflow-auto">
          {loading ? (
             <li className="px-4 py-2 text-sm text-gray-500 flex justify-center">
                 <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
             </li>
          ) : (
            filteredSuggestions.map((suggestion, index) => {
              const displayValue = typeof suggestion === 'object' ? 
                  (suggestion.display || suggestion.countryCode || Object.values(suggestion)[0]) : 
                  suggestion;
              const actualValue = typeof suggestion === 'object' ? 
                  (suggestion.value || suggestion.countryCode || Object.values(suggestion)[0]) : 
                  suggestion;
                  
              return (
                <li
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 break-words"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevents input onBlur before click
                  }}
                  onClick={(e) => {
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
            })
          )}
        </ul>
      )}
    </div>
  );
};

export default SuggestionInput;
