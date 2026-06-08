export const DASHBOARD_THEME = {
  page: "min-h-screen bg-gray-50 pb-20 lg:pb-0",
  hero: "bg-white border-b border-gray-100",
  content: "w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-6 space-y-8",

  loadingPage: "min-h-screen flex items-center justify-center bg-gray-50",
  loadingWrap: "flex flex-col items-center gap-5",
  loadingSpinner: "w-14 h-14 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin",
  loadingText: "text-gray-500 text-sm font-semibold tracking-wide",

  errorPanel: "bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border border-gray-100",
  errorIconWrap: "w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4",
  errorTitle: "text-lg font-bold text-gray-800 mb-2",
  errorBody: "text-gray-500 text-sm mb-6 leading-relaxed",
  retryButton: "w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all active:scale-95",

  statsGrid: "grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 pb-1",
  statButton: "w-full flex flex-col items-center justify-start gap-2 group",
  statIcon: "w-16 h-16 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-all duration-300 ring-2 ring-white ring-offset-2 ring-offset-gray-50 stat-icon-glow",
  statCount: "text-base font-bold text-gray-800 leading-none",
  statLabel: "text-xs text-gray-500 mt-0.5 font-medium",

  sectionHeader: "flex items-center justify-between mb-3",
  sectionTitle: "reveal-title text-base font-bold text-gray-900",
  sectionAction: "text-sm font-semibold text-emerald-600 hover:text-emerald-700",

  mediaGrid: "grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden",
  mediaTile: "relative aspect-square cursor-pointer group overflow-hidden bg-gray-100",
  mediaImage: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",

  panelCard: "bg-white rounded-2xl border border-gray-100 shadow-sm",
  eventList: "space-y-3",
  eventCard: "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow",

  memberList: "bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50",
  memberRow: "flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors",
  memberAvatar: "w-10 h-10 rounded-full object-cover ring-2 ring-emerald-100",
};
