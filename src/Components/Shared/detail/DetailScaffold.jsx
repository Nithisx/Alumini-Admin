import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion"; // eslint-disable-line no-unused-vars
import ScrambleText from "../ScrambleText";
import { containerVariants, itemVariants, Icons } from "./primitives";

/* ─── state screens ──────────────────────────────────────────────────────── */

const CenteredState = ({ children }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">{children}</div>
);

const LoadingState = ({ label }) => (
  <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
    {/* hero skeleton */}
    <div className="bg-gradient-to-br from-emerald-600 to-green-700">
      <div className="container mx-auto px-4 py-8">
        <div className="h-8 w-28 rounded-lg bg-white/20 animate-pulse" />
        <div className="mt-5 h-8 w-2/3 max-w-md rounded-lg bg-white/25 animate-pulse" />
        <div className="mt-3 h-4 w-40 rounded bg-white/15 animate-pulse" />
      </div>
    </div>
    {/* body skeleton */}
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="h-64 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
        <div className="lg:col-span-4">
          <div className="h-72 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
    <p className="text-center text-sm text-emerald-700 font-medium animate-pulse">{label}</p>
  </div>
);

/* ─── scaffold ───────────────────────────────────────────────────────────── */

/**
 * DetailScaffold — the standard chrome for every "view a specific item" page.
 *
 * Props:
 *   loading / error / notFound : which state to render
 *   loadingLabel, errorTitle/errorMessage, notFoundTitle/notFoundMessage
 *   backFallback : path to go to when there is no browser history
 *   onBack       : optional override for the back handler
 *   backLabel    : back button text (default "Go back")
 *   title, subtitle, titleScramble (default true)
 *   meta         : array of nodes rendered as a chip row in the hero
 *   actions      : node rendered top-right of the hero (admin/owner actions)
 *   sidebar      : node — when present the body becomes a 2-column grid
 *   children     : main column content (cards should use AnimatedCard/InfoCard)
 */
export default function DetailScaffold({
  loading = false,
  error = null,
  notFound = false,
  loadingLabel = "Loading…",
  errorTitle = "Something went wrong",
  errorMessage,
  notFoundTitle = "Not found",
  notFoundMessage = "The item you're looking for doesn't exist or has been removed.",
  backFallback = "/",
  onBack,
  backLabel = "Go back",
  title,
  subtitle,
  titleScramble = true,
  meta,
  actions,
  sidebar,
  children,
}) {
  const navigate = useNavigate();
  useReducedMotion();

  const handleBack = () => {
    if (onBack) return onBack();
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }
    navigate(backFallback);
  };

  if (loading) return <LoadingState label={loadingLabel} />;

  if (error) {
    return (
      <CenteredState>
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border-l-4 border-red-500 max-w-md w-full">
          <div className="text-5xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{errorTitle}</h2>
          <p className="text-gray-500 text-sm">{errorMessage || String(error)}</p>
          <button onClick={handleBack} className="mt-5 bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
            {backLabel}
          </button>
        </div>
      </CenteredState>
    );
  }

  if (notFound) {
    return (
      <CenteredState>
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm max-w-sm w-full">
          <div className="text-5xl mb-3">🔍</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{notFoundTitle}</h2>
          <p className="text-gray-500 text-sm">{notFoundMessage}</p>
          <button onClick={handleBack} className="mt-5 bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
            {backLabel}
          </button>
        </div>
      </CenteredState>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      {/* ── hero banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-600 to-green-700 text-white shadow-md">
        {/* decorative graphics */}
        <div className="pointer-events-none absolute -top-16 -right-10 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative container mx-auto px-4 py-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">

              {title && (
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight break-words">
                  {titleScramble ? (
                    <ScrambleText text={String(title)} duration={1100} />
                  ) : (
                    title
                  )}
                </h1>
              )}

              {subtitle && <p className="mt-1 text-emerald-50/90 text-sm sm:text-base">{subtitle}</p>}

              {meta && meta.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm">
                  {meta.map((m, i) => (
                    <React.Fragment key={i}>{m}</React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {actions && <div className="flex flex-wrap gap-2 justify-end shrink-0">{actions}</div>}
          </div>
        </div>
      </div>

      {/* ── body ── */}
      <motion.div
        className="container mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {sidebar ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-8 space-y-6">{children}</div>
            <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
              {sidebar}
            </motion.div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">{children}</div>
        )}
      </motion.div>
    </div>
  );
}
