/**
 * Central API endpoint registry.
 *
 * Bases (origin / REST / chat host / WS) come from config/appConfig.js, which
 * reads Vite env vars at BUILD time. The backend's /api/v1/config/ bootstrap is
 * gone, so there is no async config load and no network hop before first paint.
 */
import { API_ORIGIN as ORIGIN, API_BASE as BASE, CHAT_HOST as CHAT, WS_BASE as WS } from './appConfig';

export const API_ORIGIN = ORIGIN;
export const API_BASE = BASE;

// Auth
export const API_LOGIN_ALUMNI   = `${API_BASE}/login/`;
export const API_LOGIN_STAFF    = `${API_BASE}/staff-login/`;
export const API_LOGIN_ADMIN    = `${API_BASE}/admin-login/`;
export const API_LOGOUT         = `${API_BASE}/logout/`;
export const API_SIGNUP         = `${API_BASE}/signup/`;
export const API_SIGNUP_OTP     = `${API_BASE}/signup-otp/`;
export const API_FORGOT_PASSWORD  = `${API_BASE}/forgot-password/`;
export const API_CHANGE_PASSWORD  = `${API_BASE}/change-password/`;
export const API_TOKEN_REFRESH  = `${API_BASE}/auth/refresh/`;
export const API_GOOGLE_OAUTH   = `${API_BASE}/auth/google/`;
export const API_GOOGLE_SIGNUP  = `${API_BASE}/auth/google/signup/`;
export const API_ME_PERMISSIONS = `${API_BASE}/me/permissions/`;

// Profile
export const API_PROFILE        = `${API_BASE}/profile/`;
export const API_SUGGESTIONS    = `${API_BASE}/suggestions`;
export const API_USER_COURSES   = `${API_BASE}/user-courses/`;
export const API_USER_COURSE    = (id) => `${API_BASE}/user-courses/${id}/`;

// Admin: manage courses on behalf of a user
export const API_ADMIN_USER_COURSES = (userId) => `${API_BASE}/profile/${userId}/courses/`;
export const API_ADMIN_USER_COURSE  = (userId, courseId) => `${API_BASE}/profile/${userId}/courses/${courseId}/`;
export const API_ADMIN_USER_UPDATE  = (userId) => `${API_BASE}/profile/${userId}/update/`;

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
export const API_DEVELOPER_SHOWCASE = `${API_BASE}/developer-showcase/`;

// Stats
export const API_STATISTICS     = `${API_BASE}/user-statistics/`;
export const API_COUNTRY_DIST   = `${API_BASE}/country-distribution/`;
export const API_CITY_STATE_CHAPTERS = `${API_BASE}/city-state-chapters/`;
export const API_CHAPTER_MEMBERS = `${API_BASE}/chapter-members/`;

// Map / locations
export const API_USER_LOCATIONS = `${API_BASE}/user_locations/`;
export const API_MAP_SCATTER    = `${API_BASE}/map-scatter/`;
export const API_MAP_USER_SEARCH = `${API_BASE}/map-user-search/`;
export const API_USER_MAP_LOCATION = `${API_BASE}/user-map-location/`;

// Birthdays
export const API_BIRTHDAYS      = `${API_BASE}/birthdays/`;

// Students
export const API_STUDENTS       = `${API_BASE}/students/`;

// Signup approval queue
export const API_APPROVE_SIGNUP        = `${API_BASE}/Approve-signup/`;
export const API_APPROVE_SIGNUP_DETAIL = (id) => `${API_BASE}/Approve-signup/${id}/`;
export const API_CHECK_USERNAME = (username) => `${API_BASE}/check-username/?username=${encodeURIComponent(username)}`;

// Email
// Sendmail feature disabled — no longer offered
// export const API_EMAIL_SUGGESTIONS = (query) => `${API_BASE}/email-suggestions/?query=${encodeURIComponent(query)}`;
// export const API_SEND_EMAIL     = `${API_BASE}/send-email/`;

// Events (extra)
export const API_EVENT_DETAIL   = (id) => `${API_BASE}/events/${id}/`;

// Albums (extra)
export const API_ALBUM_DETAIL   = (id) => `${API_BASE}/albums/${id}/`;

// News (extra)
export const API_NEWS_DETAIL    = (id) => `${API_BASE}/news/${id}/`;

// Jobs (extra)
export const API_JOB_DETAIL     = (id) => `${API_BASE}/jobs/${id}/`;

// ── Engagement: Share / Like / Comment / Reply ────────────────────────────

// Public share resolver (no auth needed)
export const API_SHARE_RESOLVE   = (token) => `${API_BASE}/share/${token}/`;
export const API_SHARE_TARGETS   = (token) => `${API_BASE}/share/${token}/targets/`;

// Events
export const API_EVENT_SHARE     = (id) => `${API_BASE}/events/${id}/share/`;
export const API_EVENT_LIKE      = (id) => `${API_BASE}/events/${id}/like/`;
export const API_EVENT_COMMENTS  = (id) => `${API_BASE}/events/${id}/comments/`;
export const API_EVENT_COMMENT   = (id) => `${API_BASE}/events/comments/${id}/`;
export const API_EVENT_COMMENT_REPLIES = (commentId) => `${API_BASE}/events/comments/${commentId}/replies/`;
export const API_EVENT_COMMENT_REPLY   = (id) => `${API_BASE}/events/comments/replies/${id}/`;

// Jobs (reaction endpoint already exists; adding share + reply)
export const API_JOB_SHARE       = (id) => `${API_BASE}/jobs/${id}/share/`;
export const API_JOB_COMMENT_REPLIES = (commentId) => `${API_BASE}/jobs/comments/${commentId}/replies/`;
export const API_JOB_COMMENT_REPLY   = (id) => `${API_BASE}/jobs/comments/replies/${id}/`;

// News
export const API_NEWS_SHARE      = (id) => `${API_BASE}/news/${id}/share/`;
export const API_NEWS_LIKE       = (id) => `${API_BASE}/news/${id}/like/`;
export const API_NEWS_COMMENTS   = (id) => `${API_BASE}/news/${id}/comments/`;
export const API_NEWS_COMMENT    = (id) => `${API_BASE}/news/comments/${id}/`;
export const API_NEWS_COMMENT_REPLIES = (commentId) => `${API_BASE}/news/comments/${commentId}/replies/`;
export const API_NEWS_COMMENT_REPLY   = (id) => `${API_BASE}/news/comments/replies/${id}/`;

// Business
export const API_BUSINESS_SHARE     = (id) => `${API_BASE}/businesses/${id}/share/`;
export const API_BUSINESS_LIKE      = (id) => `${API_BASE}/businesses/${id}/like/`;
export const API_BUSINESS_COMMENTS  = (id) => `${API_BASE}/businesses/${id}/comments/`;
export const API_BUSINESS_COMMENT   = (id) => `${API_BASE}/businesses/comments/${id}/`;
export const API_BUSINESS_COMMENT_REPLIES = (commentId) => `${API_BASE}/businesses/comments/${commentId}/replies/`;
export const API_BUSINESS_COMMENT_REPLY   = (id) => `${API_BASE}/businesses/comments/replies/${id}/`;

// ── Chat ──────────────────────────────────────────────────────────────────────

const CHAT_HOST = CHAT;
export const API_CHAT_HOST = CHAT_HOST;

const WS_BASE = WS;

export const API_CHAT_ROOMS          = `${CHAT_HOST}/chat/rooms/`;
export const API_CHAT_ROOM_MESSAGES  = (roomId) => `${CHAT_HOST}/chat/rooms/${roomId}/messages/`;
export const API_CHAT_ROOM_MESSAGE   = (roomId, msgId) => `${CHAT_HOST}/chat/rooms/${roomId}/messages/${msgId}/`;
export const API_CHAT_MARK_SEEN      = (roomId) => `${CHAT_HOST}/chat/rooms/${roomId}/seen/`;
export const API_CHAT_SEARCH         = `${CHAT_HOST}/chat/search/`;
export const API_CHAT_COMMUNITY      = `${CHAT_HOST}/chat/community/`;
export const API_CHAT_COMMUNITY_MESSAGES = `${CHAT_HOST}/chat/community/messages/`;
export const API_CHAT_ME             = `${CHAT_HOST}/chat/user/me/`;
export const API_CHAT_PRESENCE       = (userId) => `${CHAT_HOST}/chat/presence/${userId}/`;
export const API_CHAT_PRESENCE_BULK  = `${CHAT_HOST}/chat/presence/bulk/`;
export const API_PORTAL_SHARE        = `${API_BASE}/share/portal/`;

export const WS_CHAT_URL = (roomId, token) =>
  `${WS_BASE}/ws/chat/${encodeURIComponent(roomId)}/?token=${encodeURIComponent(token)}`;
export const WS_COMMUNITY_URL = (token, room = "general") =>
  `${WS_BASE}/ws/community-chat/?token=${encodeURIComponent(token)}&room=${encodeURIComponent(room)}`;

// Media helper — resolves a relative media path to a full URL
export const getMediaUrl = (uri) => {
  if (!uri) return '';
  const input = String(uri).trim();
  if (!input) return '';
  if (
    input.startsWith('http://') ||
    input.startsWith('https://') ||
    input.startsWith('file://') ||
    input.startsWith('data:') ||
    input.startsWith('blob:')
  ) return input;

  const origin = API_BASE.replace(/\/api\/v1\/?$/, '');
  if (input.startsWith('//')) return `${window.location.protocol}${input}`;
  if (input.startsWith('/api/')) return `${origin}${input}`;
  if (input.startsWith('/media/')) return `${origin}/api/v1${input}`;
  if (input.startsWith('/')) return `${origin}${input}`;

  // Most profile and cover image fields are returned as media-relative paths.
  if (input.startsWith('media/')) return `${origin}/api/v1/${input}`;
  return `${origin}/api/v1/media/${input}`;
};

// ── Notifications & Web Push ──────────────────────────────────────────────────
export const API_PUSH_REGISTER         = `${API_BASE}/push/register/`;
export const API_PUSH_UNREGISTER       = `${API_BASE}/push/unregister/`;
export const API_NOTIFICATIONS            = `${API_BASE}/notifications/`;
export const API_NOTIFICATION_READ        = (id) => `${API_BASE}/notifications/${id}/read/`;
export const API_NOTIFICATION_READ_ALL    = `${API_BASE}/notifications/read-all/`;
export const API_NOTIFICATION_DELETE      = (id) => `${API_BASE}/notifications/${id}/`;
export const API_NOTIFICATION_CLEAR_ALL   = `${API_BASE}/notifications/clear-all/`;

// ── Audit logs (admin) ────────────────────────────────────────────────────────
export const API_AUDIT_LOGS              = `${API_BASE}/audit-logs/`;
export const API_AUDIT_LOG_DETAIL        = (id) => `${API_BASE}/audit-logs/${id}/`;
export const API_AUDIT_LOG_FILTERS       = `${API_BASE}/audit-logs/filters/`;

// ── Developer Endorsements ────────────────────────────────────────────────────
export const API_ENDORSEMENTS            = `${API_BASE}/endorsements/`;
export const API_ENDORSEMENT_USER        = (userId) => `${API_BASE}/endorsements/user/${userId}/`;
export const API_ENDORSEMENT_DELETE      = (id) => `${API_BASE}/endorsements/${id}/`;

// ── RBAC ──────────────────────────────────────────────────────────────────────
export const API_RBAC_PERMISSIONS        = `${API_BASE}/rbac/permissions/`;
export const API_RBAC_ROLES              = `${API_BASE}/rbac/roles/`;
export const API_RBAC_ROLE_PERMISSIONS   = (roleName) => `${API_BASE}/rbac/roles/${encodeURIComponent(roleName)}/permissions/`;
export const API_RBAC_ROLE_DETAIL        = (roleName) => `${API_BASE}/rbac/roles/${encodeURIComponent(roleName)}/`;
export const API_RBAC_USER_ROLE          = (userId) => `${API_BASE}/rbac/users/${userId}/role/`;
export const API_RBAC_USER_PERMISSIONS   = (userId) => `${API_BASE}/rbac/users/${userId}/permissions/`;



