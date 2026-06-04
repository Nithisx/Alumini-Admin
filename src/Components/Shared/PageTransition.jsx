import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * PageTransition — wraps routed content so each navigation crossfades in.
 * Remounting is driven by `transitionKey`:
 *   - In a layout, pass the full pathname so every in-app navigation animates.
 *   - At the top level, pass only the first path segment so switching sections
 *     inside a layout does NOT remount (and refetch) the whole layout.
 *
 * IMPORTANT: this animates OPACITY ONLY — deliberately no transform, filter, or
 * will-change:transform. Any of those on an ancestor turns it into the
 * containing block for `position: fixed` descendants, which would break
 * full-screen fixed layouts (e.g. the Chat page) and fixed navbars/modals.
 * Opacity does not create a containing block, so fixed positioning is safe.
 *
 * Honors prefers-reduced-motion (renders instantly, no motion).
 */
export default function PageTransition({ transitionKey, children, className }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={transitionKey}
      className={className}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
