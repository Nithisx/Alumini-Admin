import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatedCard } from "./primitives";

/**
 * ImageGallery — the standard image viewer used across detail pages.
 * Main image + prev/next + counter + thumbnail strip, plus an animated
 * fullscreen lightbox with keyboard navigation (← → Esc) and scroll lock.
 *
 * Props:
 *   images : array of resolved image URLs (strings)
 *   title  : alt-text prefix
 *   className : optional wrapper classes
 */
export default function ImageGallery({ images = [], title = "Image", className = "" }) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const reduce = useReducedMotion();

  const count = images.length;
  const hasMany = count > 1;

  const next = (e) => {
    e?.stopPropagation();
    setIndex((i) => (i === count - 1 ? 0 : i + 1));
  };
  const prev = (e) => {
    e?.stopPropagation();
    setIndex((i) => (i === 0 ? count - 1 : i - 1));
  };

  const openFullscreen = (i) => {
    setIndex(i);
    setFullscreen(true);
  };
  const closeFullscreen = () => setFullscreen(false);

  // scroll lock + keyboard nav while the lightbox is open
  useEffect(() => {
    if (!fullscreen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.keyCode === 27) closeFullscreen();
      else if (e.keyCode === 37) prev();
      else if (e.keyCode === 39) next();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "auto";
    };
  }, [fullscreen, count]);

  if (count === 0) return null;

  const current = images[index];

  return (
    <>
      <AnimatedCard className={`overflow-hidden ${className}`} hover={false}>
        {/* main image */}
        <div className="relative bg-gray-900">
          <motion.img
            key={current}
            src={current}
            alt={`${title} — ${index + 1}`}
            initial={reduce ? false : { opacity: 0.4, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="object-contain w-full max-h-[28rem] mx-auto cursor-zoom-in"
            onClick={() => openFullscreen(index)}
          />

          {hasMany && (
            <>
              <button
                onClick={prev}
                aria-label="Previous image"
                className="absolute top-1/2 left-3 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={next}
                aria-label="Next image"
                className="absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
              >
                <ChevronRight size={22} />
              </button>
              <div className="absolute top-3 right-3 px-2.5 py-1 text-xs text-white rounded-md bg-black/40">
                {index + 1} / {count}
              </div>
            </>
          )}
        </div>

        {/* thumbnails */}
        {hasMany && (
          <div className="p-3 bg-gray-100">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`flex-shrink-0 rounded overflow-hidden transition-all duration-200 ${
                    i === index ? "ring-2 ring-emerald-600 scale-105" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${i + 1}`} className="object-cover w-20 h-14" />
                </button>
              ))}
            </div>
          </div>
        )}
      </AnimatedCard>

      {/* fullscreen lightbox */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeFullscreen}
          >
            <button
              onClick={closeFullscreen}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="absolute top-4 left-4 px-3 py-1 text-sm text-white rounded-lg bg-black/40">
              {index + 1} / {count}
            </div>

            {hasMany && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            <motion.img
              key={current}
              src={current}
              alt={`${title} — fullscreen`}
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="object-contain max-h-full max-w-full p-4"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
