/**
 * Breadcrumb.jsx — Premium Global Navigation Trail
 *
 * Renders a polished, animated breadcrumb strip like:
 *   🏠 Dashboard  ›  Albums  ›  BE ECE
 *
 * Features:
 *  - Always visible (including on Dashboard)
 *  - Hidden only on /chat pages
 *  - Animated entry (staggered slide-in per crumb)
 *  - Hover micro-interactions on link crumbs
 *  - Role-aware icon in the home crumb
 *  - Truncation with ellipsis on very long labels
 *  - Accessible aria-label + aria-current
 */

import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useBreadcrumb } from "./BreadcrumbContext";

/* ─── Static slug → friendly label map ───────────────────────────────────── */
const ROUTE_LABELS = {
  // role roots
  admin:   "Dashboard",
  staff:   "Dashboard",
  alumni:  "Dashboard",

  // common sections
  dashboard:          "Dashboard",
  albums:             "Albums",
  members:            "Members",
  news:               "News",
  event:              "Events",
  jobs:               "Jobs",
  birthday:           "Birthdays",
  business:           "Business Directory",
  "my-profile":       "My Profile",
  "my-contribution":  "My Contribution",
  chat:               "Chat",
  map:                "Campus Map",
  students:           "Students",
  chapters:           "Chapters",
  audit:              "Audit Log",
  sendmail:           "Send Mail",
  "register-request": "Registration Requests",
  "import-members":   "Import Members",
  view:               "View",
  add:                "Add New",
  edit:               "Edit",
};

/* ─── Resolve a single URL segment to a label ───────────────────────────── */
function resolveLabel(segment, dynamicLabels) {
  if (ROUTE_LABELS[segment])   return ROUTE_LABELS[segment];
  if (dynamicLabels[segment])  return dynamicLabels[segment];
  return decodeURIComponent(segment)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Build ordered crumb array from current pathname ───────────────────── */
function buildCrumbs(pathname, dynamicLabels) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const roleRoot = segments[0];   // 'admin' | 'staff' | 'alumni'
  const roleBase = `/${roleRoot}`;

  // Always anchor with Dashboard
  const crumbs = [{ label: "Dashboard", path: `${roleBase}/dashboard`, isHome: true }];

  let builtPath = roleBase;
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    builtPath += `/${seg}`;
    if (seg === "dashboard") continue;          // skip; already the root crumb
    crumbs.push({ label: resolveLabel(seg, dynamicLabels), path: builtPath });
  }

  return crumbs;
}

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */
const HomeIcon = () => (
  <svg className="bc-home-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  </svg>
);

const ChevronIcon = () => (
  <svg className="bc-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
  </svg>
);

/* ─── Individual Crumb ───────────────────────────────────────────────────── */
function CrumbLink({ crumb, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      className="bc-item"
      style={{ "--bc-i": index }}
    >
      <Link
        to={crumb.path}
        className={`bc-link${crumb.isHome ? " bc-link--home" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {crumb.isHome && <HomeIcon />}
        <span className="bc-label">{crumb.label}</span>
        <span className={`bc-underline${hovered ? " bc-underline--on" : ""}`} />
      </Link>
      <ChevronIcon />
    </span>
  );
}

function CrumbCurrent({ crumb, index }) {
  return (
    <span
      className="bc-item bc-item--current"
      style={{ "--bc-i": index }}
      aria-current="page"
    >
      {/* Animated >> indicator */}
      <span className="bc-dbl-chevron" aria-hidden="true">
        <span className="bc-dbl-chevron__a">›</span>
        <span className="bc-dbl-chevron__b">›</span>
      </span>
      <span className="bc-label bc-label--current">
        {crumb.label}
        <span className="bc-cursor" aria-hidden="true" />
      </span>
    </span>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Breadcrumb() {
  const location = useLocation();
  const { labels } = useBreadcrumb();
  const [key, setKey] = useState(0); // force re-animate on route change

  // Re-trigger entrance animation on every route change
  useEffect(() => {
    setKey((k) => k + 1);
  }, [location.pathname]);

  // Hide only on chat pages
  if (location.pathname.includes("/chat")) return null;

  const crumbs = buildCrumbs(location.pathname, labels);
  if (crumbs.length === 0) return null;

  return (
    <nav className="bc-nav" aria-label="Breadcrumb" key={key}>
      {/* Animated accent line at bottom */}
      <span className="bc-accent-line" />

      <ol className="bc-list">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.path} className="bc-li">
              {isLast
                ? <CrumbCurrent crumb={crumb} index={index} />
                : <CrumbLink   crumb={crumb} index={index} />
              }
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
