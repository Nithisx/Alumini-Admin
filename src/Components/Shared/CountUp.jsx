import React, { useEffect, useRef, useState } from "react";

/**
 * CountUp — animates a number from 0 to its target value when it scrolls into
 * view. Non-numeric values render unchanged. Respects prefers-reduced-motion.
 *
 * Usage: <CountUp value={data.total_users} />  or  <CountUp value="1,240" />
 */
export default function CountUp({ value, duration = 1400, className }) {
  // Parse a numeric target out of the incoming value (handles "1,240", "12+").
  const raw = value == null ? "" : String(value);
  const numeric = Number(raw.replace(/[^\d.-]/g, ""));
  const isNumber = raw.trim() !== "" && Number.isFinite(numeric);
  const suffix = isNumber ? raw.replace(/[\d.,\s-]/g, "") : "";
  const decimals = isNumber && raw.includes(".") ? (raw.split(".")[1] || "").length : 0;

  const [display, setDisplay] = useState(isNumber ? 0 : raw);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!isNumber) {
      setDisplay(raw);
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const format = (n) =>
      n.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

    if (prefersReduced || !("IntersectionObserver" in window)) {
      setDisplay(format(numeric));
      return;
    }

    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(format(numeric * eased));
        if (t < 1) requestAnimationFrame(tick);
        else setDisplay(format(numeric));
      };
      requestAnimationFrame(tick);
    };

    const el = ref.current;
    if (!el) {
      run();
      return;
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run();
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [raw, numeric, isNumber, decimals, duration]);

  return (
    <span ref={ref} className={className}>
      {isNumber ? `${display}${suffix}` : display}
    </span>
  );
}
