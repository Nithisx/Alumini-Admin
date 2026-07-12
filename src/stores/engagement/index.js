/**
 * EngagementStore — likes, comments, replies, views and shares.
 *
 * Every feed item (news, events, jobs, albums, business) hangs the same
 * engagement endpoints off its own content type, so the URL shapes live here
 * once instead of being rebuilt in EngagementPanel/EngagementStats.
 *
 * The panel is instantiated once per feed item and keeps its own view state
 * (open/closed, draft text); this store owns the network and nothing else, so
 * dozens of mounted panels don't fight over one shared observable list.
 *
 * NB: jobs uses /react/ where every other type uses /like/ — a backend quirk
 * that used to be re-derived at each call site.
 */
import api from "../../services/apiClient";
import { API_BASE, API_CHAT_SEARCH, API_PORTAL_SHARE } from "../../config/api";

export default class EngagementStore {
  constructor(root) {
    this.root = root;
  }

  likeUrl(contentType, contentId) {
    return contentType === "jobs"
      ? `${API_BASE}/jobs/${contentId}/react/`
      : `${API_BASE}/${contentType}/${contentId}/like/`;
  }

  commentsUrl = (t, id) => `${API_BASE}/${t}/${id}/comments/`;
  commentUrl = (t, commentId) => `${API_BASE}/${t}/comments/${commentId}/`;
  repliesUrl = (t, commentId) => `${API_BASE}/${t}/comments/${commentId}/replies/`;
  replyUrl = (t, replyId) => `${API_BASE}/${t}/comments/replies/${replyId}/`;
  shareUrl = (t, id) => `${API_BASE}/${t}/${id}/share/`;

  // ── likes ────────────────────────────────────────────────────────────────
  /** → { liked, total_likes } */
  fetchLikes(contentType, contentId) {
    return api.get(this.likeUrl(contentType, contentId), { raw: true });
  }

  /** POST toggles; → { liked, total_likes } */
  toggleLike(contentType, contentId) {
    return api.post(this.likeUrl(contentType, contentId), undefined, { raw: true });
  }

  // ── comments & replies ───────────────────────────────────────────────────
  async fetchComments(contentType, contentId) {
    const data = await api.get(this.commentsUrl(contentType, contentId), { raw: true });
    return Array.isArray(data) ? data : data?.results || [];
  }

  addComment(contentType, contentId, comment) {
    return api.post(this.commentsUrl(contentType, contentId), { comment }, { raw: true });
  }

  /** PUT, not PATCH — the comment endpoint expects the full representation. */
  editComment(contentType, commentId, comment) {
    return api.raw("put", this.commentUrl(contentType, commentId), { data: { comment } });
  }

  deleteComment(contentType, commentId) {
    return api.delete(this.commentUrl(contentType, commentId));
  }

  addReply(contentType, commentId, reply) {
    return api.post(this.repliesUrl(contentType, commentId), { reply }, { raw: true });
  }

  editReply(contentType, replyId, reply) {
    return api.raw("put", this.replyUrl(contentType, replyId), { data: { reply } });
  }

  deleteReply(contentType, replyId) {
    return api.delete(this.replyUrl(contentType, replyId));
  }

  // ── views ────────────────────────────────────────────────────────────────
  async fetchViewers(contentType, contentId) {
    const data = await api.get(`${API_BASE}/${contentType}/${contentId}/viewers/`, { raw: true });
    return Array.isArray(data) ? data : [];
  }

  // ── shares ───────────────────────────────────────────────────────────────
  /** → { total_shares } */
  fetchShareCount(contentType, contentId) {
    return api.get(this.shareUrl(contentType, contentId), { raw: true });
  }

  /** Mints a share token + the per-platform target links. */
  createShare(contentType, contentId, { message, share_mode, share_platform }) {
    return api.post(
      this.shareUrl(contentType, contentId),
      { message, share_mode, share_platform },
      { raw: true }
    );
  }

  /** The targets for an already-minted token (the create response can omit them). */
  async fetchShareTargets(token) {
    if (!token) return null;
    try {
      return await api.get(`${API_BASE}/share/${token}/targets/`, { raw: true });
    } catch {
      return null;
    }
  }

  /** Directory search used by the "share into a chat" picker. */
  async searchUsers(q) {
    if (!q?.trim()) return [];
    try {
      const data = await api.get(`${API_CHAT_SEARCH}?q=${encodeURIComponent(q)}`, { raw: true });
      return Array.isArray(data) ? data : data?.results || [];
    } catch {
      return [];
    }
  }

  shareToChat(token, targetUserId) {
    return api.post(API_PORTAL_SHARE, { token, target: "chat", target_user_id: targetUserId }, { raw: true });
  }

  shareToCommunity(token) {
    return api.post(API_PORTAL_SHARE, { token, target: "community" }, { raw: true });
  }
}
