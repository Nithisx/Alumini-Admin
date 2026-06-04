import React, { useEffect, useRef } from "react";

/**
 * ScrambleText — renders text that starts as scrambled glyphs (random
 * characters, monospace font, varied colors, blur) and smoothly resolves
 * character-by-character into the final styling of the element.
 *
 * Props:
 *  - text      : the final string to resolve to
 *  - className : classes for the wrapper (final font/size/color/gradient)
 *  - gradient  : true when the wrapper uses bg-clip-text gradient text. In that
 *                mode the scramble runs at the ELEMENT level (plain text), since
 *                bg-clip-text gradients don't render across inline-block spans.
 *  - duration  : total scramble duration (ms)
 *  - delay     : start delay (ms)
 *  - as        : wrapper tag (default "span")
 *
 * Honors prefers-reduced-motion (renders the final text instantly).
 */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!<>-_\\/[]{}=+*^?#§";
const COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444"];
const SPACE = " ";

export default function ScrambleText({
  text,
  className = "",
  gradient = false,
  duration = 1500,
  delay = 0,
  as: Tag = "span",
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const chars = Array.from(text);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Per-char reveal sweeps left→right; each char scrambles then locks.
    const reveal = duration * 0.55;
    const meta = chars.map((ch, i) => {
      const start = delay + (i / Math.max(chars.length, 1)) * reveal;
      const end = start + duration * 0.45 + Math.random() * 220;
      return { ch, start, end };
    });
    const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

    let raf;
    const t0 = performance.now();

    // ── Gradient mode: scramble at element level so bg-clip-text stays intact.
    if (gradient) {
      if (reduce) {
        el.textContent = text;
        return;
      }
      el.textContent = "";
      el.classList.add("sc-el-scrambling");
      const tick = (now) => {
        const t = now - t0;
        let out = "";
        let done = true;
        for (const m of meta) {
          if (m.ch === " ") out += SPACE;
          else if (t < m.start) { out += SPACE; done = false; }
          else if (t < m.end) { out += rnd(); done = false; }
          else out += m.ch;
        }
        if (done) {
          el.textContent = text;
          el.classList.remove("sc-el-scrambling");
          el.classList.add("sc-el-done");
        } else {
          el.textContent = out;
          raf = requestAnimationFrame(tick);
        }
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    // ── Solid mode: per-char spans with colorful, jittery scramble.
    el.textContent = "";
    const spans = chars.map((ch) => {
      const s = document.createElement("span");
      s.className = "sc-char";
      s.textContent = ch === " " ? SPACE : ch;
      el.appendChild(s);
      return s;
    });
    if (reduce) {
      spans.forEach((s) => s.classList.add("sc-done"));
      return;
    }

    const tick = (now) => {
      const t = now - t0;
      let done = true;
      for (let i = 0; i < meta.length; i++) {
        const m = meta[i];
        const span = spans[i];
        if (m.ch === " ") continue;
        if (t < m.start) {
          done = false;
          span.textContent = SPACE;
        } else if (t < m.end) {
          done = false;
          span.textContent = rnd();
          span.classList.add("sc-scrambling");
          span.style.setProperty("--sc-rot", `${(Math.random() * 22 - 11).toFixed(1)}deg`);
          span.style.color = COLORS[(Math.random() * COLORS.length) | 0];
        } else if (!span.classList.contains("sc-done")) {
          span.textContent = m.ch;
          span.classList.remove("sc-scrambling");
          span.classList.add("sc-done");
          span.style.removeProperty("--sc-rot");
          span.style.color = "";
        }
      }
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, gradient, duration, delay]);

  return <Tag ref={ref} className={className} aria-label={text} />;
}
