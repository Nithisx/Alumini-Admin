/**
 * motion.js — shared framer-motion primitives for the standardized UI kit.
 *
 * Reduced-motion safety: every wrapper checks `useReducedMotion()` and renders a
 * plain element (no motion) when the user prefers reduced motion.
 *
 * Fixed-positioning safety (see memory `fixed-positioning-containing-block`):
 * transform-based variants (riseIn / scaleIn / stagger) must only ever be applied
 * to LEAF items (cards, rows, tiles) — never to an ancestor of a `position: fixed`
 * descendant. For page roots / sticky headers use `fadeIn` (opacity only), which
 * does not create a containing block.
 */
import React from "react";
import { motion, useReducedMotion } from "framer-motion";

// Smooth ease-out curve shared across the kit.
export const EASE = [0.22, 1, 0.36, 1];

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
};

export const riseIn = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.42, ease: EASE } },
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -18 },
  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
};

export const staggerContainer = (stagger = 0.06, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

// Alias kept for readability at call sites.
export const staggerItem = riseIn;

const VARIANTS = { fadeIn, riseIn, scaleIn, slideInLeft };
const resolveVariant = (v) => (typeof v === "string" ? VARIANTS[v] || riseIn : v || riseIn);

/**
 * MotionList — a stagger container. Children that are <MotionItem> animate in
 * sequence as the list scrolls into view. Renders a plain element under
 * reduced-motion.
 */
export function MotionList({
  as = "div",
  children,
  className,
  stagger = 0.06,
  delay = 0,
  amount = 0.1,
  once = true,
  ...rest
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Plain = as;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      variants={staggerContainer(stagger, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/**
 * MotionItem — a single staggered child. Inherits the animation trigger from a
 * parent <MotionList>. Safe to give transform variants (leaf elements only).
 */
export function MotionItem({ as = "div", children, className, variant = riseIn, ...rest }) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Plain = as;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }
  const Comp = motion[as] || motion.div;
  return (
    <Comp className={className} variants={resolveVariant(variant)} {...rest}>
      {children}
    </Comp>
  );
}

/**
 * Reveal — animates a single element into view on scroll. Use `fadeIn` (opacity)
 * when the element is an ancestor of a fixed descendant; transform variants are
 * fine for ordinary leaf content (banners, cards).
 */
export function Reveal({
  as = "div",
  variant = riseIn,
  className,
  children,
  amount = 0.18,
  once = true,
  ...rest
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Plain = as;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      variants={resolveVariant(variant)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export { motion, useReducedMotion };
