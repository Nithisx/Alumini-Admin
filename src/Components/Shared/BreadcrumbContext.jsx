/**
 * BreadcrumbContext.jsx
 *
 * Provides a simple context that allows deeply nested pages to register a
 * human-readable label for a dynamic URL segment (e.g. an album title or a
 * member's name) so the breadcrumb strip can display the real name instead
 * of the raw URL param / ID.
 *
 * Usage in a page component:
 *   const { setBreadcrumbLabel } = useBreadcrumb();
 *   useEffect(() => { if (albumTitle) setBreadcrumbLabel(albumId, albumTitle); }, [albumTitle]);
 */

import React, { createContext, useContext, useState, useCallback } from "react";

const BreadcrumbContext = createContext({
  labels: {},
  setBreadcrumbLabel: () => {},
  clearBreadcrumbLabel: () => {},
});

export function BreadcrumbProvider({ children }) {
  const [labels, setLabels] = useState({});

  const setBreadcrumbLabel = useCallback((key, label) => {
    setLabels((prev) => {
      // Avoid unnecessary re-renders if nothing changed
      if (prev[String(key)] === label) return prev;
      return { ...prev, [String(key)]: label };
    });
  }, []);

  const clearBreadcrumbLabel = useCallback((key) => {
    setLabels((prev) => {
      const next = { ...prev };
      delete next[String(key)];
      return next;
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ labels, setBreadcrumbLabel, clearBreadcrumbLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

/** Hook: read the context (for the Breadcrumb component itself) */
export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}
