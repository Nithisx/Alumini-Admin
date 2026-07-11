/**
 * uiTheme.js — per-section visual identity used by the shared UI kit
 * (PageHeader, PageHero, EmptyState, cards). Each section gets a consistent
 * accent color, soft background, gradient and chip styling so every page in
 * every role reads as part of one design system.
 *
 * All values are Tailwind class strings (same convention as dashboardTheme.js).
 */
export const SECTION_THEME = {
  home: {
    iconBg: "bg-emerald-100 text-emerald-600",
    softBg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    gradient: "from-emerald-500 to-teal-600",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  events: {
    iconBg: "bg-violet-100 text-violet-600",
    softBg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-200",
    gradient: "from-violet-500 to-purple-600",
    chip: "bg-violet-50 text-violet-700 border-violet-100",
  },
  jobs: {
    iconBg: "bg-blue-100 text-blue-600",
    softBg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-200",
    gradient: "from-blue-500 to-indigo-600",
    chip: "bg-blue-50 text-blue-700 border-blue-100",
  },
  albums: {
    iconBg: "bg-pink-100 text-pink-600",
    softBg: "bg-pink-50",
    text: "text-pink-700",
    ring: "ring-pink-200",
    gradient: "from-pink-500 to-rose-600",
    chip: "bg-pink-50 text-pink-700 border-pink-100",
  },
  news: {
    iconBg: "bg-amber-100 text-amber-600",
    softBg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    gradient: "from-amber-500 to-orange-600",
    chip: "bg-amber-50 text-amber-700 border-amber-100",
  },
  members: {
    iconBg: "bg-emerald-100 text-emerald-600",
    softBg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    gradient: "from-emerald-500 to-green-600",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  birthday: {
    iconBg: "bg-rose-100 text-rose-600",
    softBg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
    gradient: "from-rose-500 to-pink-600",
    chip: "bg-rose-50 text-rose-700 border-rose-100",
  },
  business: {
    iconBg: "bg-indigo-100 text-indigo-600",
    softBg: "bg-indigo-50",
    text: "text-indigo-700",
    ring: "ring-indigo-200",
    gradient: "from-indigo-500 to-blue-600",
    chip: "bg-indigo-50 text-indigo-700 border-indigo-100",
  },
  profile: {
    iconBg: "bg-teal-100 text-teal-600",
    softBg: "bg-teal-50",
    text: "text-teal-700",
    ring: "ring-teal-200",
    gradient: "from-teal-500 to-emerald-600",
    chip: "bg-teal-50 text-teal-700 border-teal-100",
  },
  uploads: {
    iconBg: "bg-emerald-100 text-emerald-600",
    softBg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    gradient: "from-emerald-500 to-teal-600",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  chat: {
    iconBg: "bg-emerald-100 text-emerald-600",
    softBg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    gradient: "from-emerald-500 to-teal-600",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  audit: {
    iconBg: "bg-slate-100 text-slate-600",
    softBg: "bg-slate-50",
    text: "text-slate-700",
    ring: "ring-slate-200",
    gradient: "from-slate-600 to-gray-700",
    chip: "bg-slate-50 text-slate-700 border-slate-100",
  },
  import: {
    iconBg: "bg-cyan-100 text-cyan-600",
    softBg: "bg-cyan-50",
    text: "text-cyan-700",
    ring: "ring-cyan-200",
    gradient: "from-cyan-500 to-teal-600",
    chip: "bg-cyan-50 text-cyan-700 border-cyan-100",
  },
  requests: {
    iconBg: "bg-orange-100 text-orange-600",
    softBg: "bg-orange-50",
    text: "text-orange-700",
    ring: "ring-orange-200",
    gradient: "from-orange-500 to-amber-600",
    chip: "bg-orange-50 text-orange-700 border-orange-100",
  },
  mail: {
    iconBg: "bg-sky-100 text-sky-600",
    softBg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-200",
    gradient: "from-sky-500 to-blue-600",
    chip: "bg-sky-50 text-sky-700 border-sky-100",
  },
  map: {
    iconBg: "bg-green-100 text-green-600",
    softBg: "bg-green-50",
    text: "text-green-700",
    ring: "ring-green-200",
    gradient: "from-green-500 to-emerald-600",
    chip: "bg-green-50 text-green-700 border-green-100",
  },
  students: {
    iconBg: "bg-fuchsia-100 text-fuchsia-600",
    softBg: "bg-fuchsia-50",
    text: "text-fuchsia-700",
    ring: "ring-fuchsia-200",
    gradient: "from-fuchsia-500 to-purple-600",
    chip: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
  },
};

export const DEFAULT_SECTION_THEME = SECTION_THEME.home;

/** Resolve a section theme by key, accepting either a key string or a theme object. */
export function getSectionTheme(section) {
  if (!section) return DEFAULT_SECTION_THEME;
  if (typeof section === "object") return section;
  return SECTION_THEME[section] || DEFAULT_SECTION_THEME;
}
