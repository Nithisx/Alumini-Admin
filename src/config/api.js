/**
 * Central API configuration.
 * All base URLs are derived from VITE_API_BASE_URL so that switching
 * environments (dev / staging / prod) requires only a .env change.
 */

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.karpagamalumni.in/api/v1';

// Auth
export const API_LOGIN_ALUMNI   = `${API_BASE}/login/`;
export const API_LOGIN_STAFF    = `${API_BASE}/staff-login/`;
export const API_LOGIN_ADMIN    = `${API_BASE}/admin-login/`;
export const API_LOGOUT         = `${API_BASE}/logout/`;
export const API_SIGNUP         = `${API_BASE}/signup/`;
export const API_SIGNUP_OTP     = `${API_BASE}/signup-otp/`;
export const API_FORGOT_PASSWORD  = `${API_BASE}/forgot-password/`;
export const API_CHANGE_PASSWORD  = `${API_BASE}/change-password/`;

// Profile
export const API_PROFILE        = `${API_BASE}/profile/`;
export const API_SUGGESTIONS    = `${API_BASE}/suggestions`;

// Members
export const API_MEMBERS        = `${API_BASE}/members/`;
export const API_MEMBER_DETAIL  = (id) => `${API_BASE}/members/${id}/`;
export const API_DEACTIVATE_USER = `${API_BASE}/deactivate-user/`;
export const API_DELETE_USER    = `${API_BASE}/delete-user/`;

// Content
export const API_EVENTS         = `${API_BASE}/events/`;
export const API_JOBS           = `${API_BASE}/jobs/`;
export const API_ALBUMS         = `${API_BASE}/albums/`;
export const API_BUSINESS       = `${API_BASE}/business/`;
export const API_NEWS           = `${API_BASE}/news/`;
export const API_HOME           = `${API_BASE}/home/`;

// Stats
export const API_STATISTICS     = `${API_BASE}/user-statistics/`;
export const API_COUNTRY_DIST   = `${API_BASE}/country-distribution/`;

// Media helper — resolves a relative media path to a full URL
export const getMediaUrl = (uri) => {
  if (!uri) return '';
  if (
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('file://') ||
    uri.startsWith('data:') ||
    uri.startsWith('blob:')
  ) return uri;
  if (uri.startsWith('//')) return `http:${uri}`;
  const base = API_BASE.replace('/api/v1', ''); // strip the API path to get origin
  return uri.startsWith('/') ? `${base}${uri}` : `${base}/${uri}`;
};
