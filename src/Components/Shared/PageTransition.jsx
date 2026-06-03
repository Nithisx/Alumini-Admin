import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * PageTransition — wraps routed content so each navigation animates in with a
 * smooth fade + subtle rise. Remounting is driven by `transitionKey`:
 *   - In a layout, pass the full pathname so every in-app navigation animates.
 *   - At the top level, pass only the first path segment so switching sections
 *     inside a layout does NOT remount (and refetch) the whole layout.
 *
 * Honors prefers-reduced-motion (renders instantly, no motion).
 */
export default function PageTransition({ transitionKey, children, className }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={transitionKey}
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.36, ease: [0.4, 0, 0.2, 1] }}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}
