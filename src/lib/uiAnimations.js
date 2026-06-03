/**
 * uiAnimations.js — global scroll-reveal enrichment.
 *
 * Adds a gentle "fade + rise" entrance to card-like elements as they scroll
 * into view, across every page, without editing individual components.
 *
 * Safety guarantees:
 *  - If IntersectionObserver is unavailable, or the user prefers reduced
 *    motion, nothing is hidden — the module no-ops.
 *  - The hidden state (.reveal-init) is only applied to elements that are
 *    simultaneously handed to a working observer, and a fallback timer reveals
 *    anything still hidden after a few seconds. Content can never be stranded.
 */

const REVEAL_SELECTOR = [
  '[class*="rounded-2xl"][class*="shadow"]',
  '[class*="rounded-xl"][class*="shadow"]',
  'section[class*="rounded"]',
  '.reveal-title',
].join(",");

const SKIP_SELECTOR =
  '[class*="fixed"], [class*="inset-0"], .image-viewer-overlay, .image-crop-overlay';

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function reveal(el) {
  el.classList.remove("reveal-init");
  el.classList.add("reveal-in");
}

export function initUiAnimations() {
  if (typeof window === "undefined") return;
  if (prefersReducedMotion) return;
  if (!("IntersectionObserver" in window)) return;

  const seen = new WeakSet();

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
  );

  const register = (root = document) => {
    const nodes = root.querySelectorAll
      ? root.querySelectorAll(REVEAL_SELECTOR)
      : [];
    let batch = 0;
    nodes.forEach((el) => {
      if (seen.has(el)) return;
      if (el.closest(SKIP_SELECTOR)) return;
      seen.add(el);
      el.classList.add("reveal-init");
      // Subtle staggered cascade within the current batch.
      el.style.transitionDelay = `${Math.min(batch * 45, 240)}ms`;
      batch += 1;
      observer.observe(el);
    });
  };

  const start = () => {
    register(document);

    // Catch dynamically rendered content (SPA route changes, async lists).
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType === 1) register(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Absolute safety net: never leave anything hidden.
    setTimeout(() => {
      document
        .querySelectorAll(".reveal-init")
        .forEach((el) => reveal(el));
    }, 4000);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
