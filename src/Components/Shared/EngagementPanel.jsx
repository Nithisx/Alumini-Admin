/**
 * EngagementPanel
 *
 * Props
 * ─────
 *   contentType  : "events" | "jobs" | "news" | "businesses"
 *   contentId    : number
 *   postOwnerId  : number | null  – user.id of the post author
 *   canModerate  : boolean        – true for staff/admin (full edit+delete on any comment)
 *   currentUserId: number | null  – id of the logged-in user
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Heart, MessageCircle, Share2, Send, Reply, Pencil, Trash2, X, Check, Copy, ChevronDown, ChevronUp, Linkedin, Instagram } from "lucide-react";
import { toast } from "react-toastify";

const API_ROOT = "https://api.karpagamalumni.in/api/v1";
const getToken = () => localStorage.getItem("Token");
const authHeaders = () => ({ Authorization: `Token ${getToken()}`, "Content-Type": "application/json" });

const ALLOWED_SHARE_MODES = ["link", "status", "story", "post"];
const ALLOWED_SHARE_PLATFORMS = ["generic", "native", "whatsapp", "instagram", "facebook", "x", "linkedin", "telegram"];

// ── tiny helpers ─────────────────────────────────────────────────────────────

const getPhotoUrl = (p) => {
  if (!p) return "";
  return p.startsWith("http") ? p : `${API_ROOT.replace("/api/v1", "")}${p}`;
};

const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Compare timestamps at second-level precision to avoid false "edited" from sub-second diffs
const wasEdited = (created_at, updated_at) => {
  if (!created_at || !updated_at) return false;
  return Math.floor(new Date(created_at) / 1000) !== Math.floor(new Date(updated_at) / 1000);
};

const normalizeShareTargets = (rawTargets) => {
  if (!rawTargets) return [];

  const inferPlatformAndMode = (id, value = {}) => {
    const key = String(id || "").toLowerCase();
    const type = String(value.type || value.mode || "").toLowerCase();

    if (key === "copy_link") return { platform: "generic", mode: "link" };
    if (key === "native_share") return { platform: "native", mode: "link" };

    if (key.includes("whatsapp")) {
      return { platform: "whatsapp", mode: type || (key.includes("status") ? "status" : "post") };
    }
    if (key.includes("instagram")) {
      return { platform: "instagram", mode: type || (key.includes("story") ? "story" : "post") };
    }
    if (key.includes("facebook")) return { platform: "facebook", mode: type || "post" };
    if (key.startsWith("x_")) return { platform: "x", mode: type || "post" };
    if (key.includes("linkedin")) return { platform: "linkedin", mode: type || "post" };
    if (key.includes("telegram")) return { platform: "telegram", mode: type || "post" };

    return { platform: value.platform || "generic", mode: type || "link" };
  };

  if (Array.isArray(rawTargets)) {
    return rawTargets
      .filter((item) => item && typeof item === "object")
      .map((item, index) => {
        const id = item.id || item.key || `${item.platform || "target"}-${item.mode || "link"}-${index}`;
        const inferred = inferPlatformAndMode(id, item);
        return {
          id,
          label: item.label || item.title || item.name || "Share",
          platform: inferred.platform,
          mode: inferred.mode,
          type: item.type || inferred.mode,
          url: item.url || item.href || item.deep_link || item.intent_url || "",
          appUrl: item.app_url || "",
          text: item.text || "",
          note: item.note || "",
          payload: item.payload || item.share_payload || {},
        };
      });
  }

  return Object.entries(rawTargets)
    .filter(([, value]) => value && typeof value === "object")
    .map(([key, value], index) => {
      const id = key || `${value.platform || "target"}-${index}`;
      const inferred = inferPlatformAndMode(id, value);
      return {
        id,
        label: value.label || value.title || key,
        platform: inferred.platform,
        mode: inferred.mode,
        type: value.type || inferred.mode,
        url: value.url || value.href || value.deep_link || value.intent_url || "",
        appUrl: value.app_url || "",
        text: value.text || "",
        note: value.note || "",
        payload: value.payload || value.share_payload || {},
      };
    });
};

const isExternalUrl = (value) => typeof value === "string" && /^(https?:|whatsapp:|instagram:|tg:|fb:|x:)/i.test(value);

const normalizePlatformLabel = (platform) => {
  if (!platform) return "Share";
  const cleaned = String(platform).trim().toLowerCase();
  if (cleaned === "x") return "X";
  return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
};

const Avatar = ({ user, size = 8 }) => {
  const initials = ((user?.first_name?.[0] || "") + (user?.last_name?.[0] || "")).toUpperCase() || "?";
  return user?.profile_photo ? (
    <img src={getPhotoUrl(user.profile_photo)} alt={initials} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`w-${size} h-${size} rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-700 font-semibold text-xs`}>{initials}</div>
  );
};

// ── Reply item ────────────────────────────────────────────────────────────────

const ReplyItem = ({ reply, contentType, canModerate, isPostOwner, currentUserId, onDeleted, onEdited }) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.reply);

  const isOwn = reply.user?.id === currentUserId;
  // Post owner and admin can delete any reply; only own-reply owner can edit
  const canDelete = isOwn || canModerate || isPostOwner;
  const canEdit = isOwn || canModerate;

  const saveEdit = async () => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`${API_ROOT}/${contentType}/comments/replies/${reply.id}/`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ reply: editText.trim() }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      onEdited(updated);
      setEditing(false);
    } catch {
      toast.error("Failed to update reply.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this reply?")) return;
    try {
      const res = await fetch(`${API_ROOT}/${contentType}/comments/replies/${reply.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      onDeleted(reply.id);
    } catch {
      toast.error("Failed to delete reply.");
    }
  };

  return (
    <div className="flex gap-2 py-2 pl-8">
      <Avatar user={reply.user} size={6} />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-800">{reply.user?.first_name} {reply.user?.last_name}</span>
            <span className="text-xs text-gray-400">{timeAgo(reply.created_at)}</span>
            {wasEdited(reply.created_at, reply.updated_at) && (
              <span className="text-xs text-gray-400 italic">(edited)</span>
            )}
          </div>
          {editing ? (
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-400"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
                autoFocus
              />
              <button onClick={saveEdit} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
            </div>
          ) : (
            <p className="text-sm text-gray-700 break-words">{reply.reply}</p>
          )}
        </div>
        {(canDelete || canEdit) && !editing && (
          <div className="flex gap-3 mt-1 ml-2">
            {canEdit && (
              <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <Pencil size={10} /> Edit
              </button>
            )}
            {canDelete && (
              <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                <Trash2 size={10} /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Comment item ──────────────────────────────────────────────────────────────

const CommentItem = ({ comment, contentType, canModerate, isPostOwner, currentUserId, onDeleted, onEdited }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment);
  const replyInputRef = useRef(null);

  const isOwn = comment.user?.id === currentUserId;
  // Post owner and admin can delete any comment; only comment owner can edit
  const canDelete = isOwn || canModerate || isPostOwner;
  const canEdit = isOwn || canModerate;

  useEffect(() => {
    if (showReplyInput) replyInputRef.current?.focus();
  }, [showReplyInput]);

  const saveEdit = async () => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`${API_ROOT}/${contentType}/comments/${comment.id}/`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ comment: editText.trim() }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      onEdited(updated);
      setEditing(false);
    } catch {
      toast.error("Failed to update comment.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this comment and all its replies?")) return;
    try {
      const res = await fetch(`${API_ROOT}/${contentType}/comments/${comment.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      onDeleted(comment.id);
    } catch {
      toast.error("Failed to delete comment.");
    }
  };

  const submitReply = async () => {
    const text = replyText.trim();
    if (!text) return;
    try {
      const res = await fetch(`${API_ROOT}/${contentType}/comments/${comment.id}/replies/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reply: text }),
      });
      if (!res.ok) throw new Error();
      const newReply = await res.json();
      setReplies((prev) => [...prev, newReply]);
      setReplyText("");
      setShowReplyInput(false);
      setShowReplies(true);
    } catch {
      toast.error("Failed to post reply.");
    }
  };

  const replyCount = replies.length;

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex gap-3 py-3">
        <Avatar user={comment.user} size={8} />
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-800">{comment.user?.first_name} {comment.user?.last_name}</span>
              <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
              {wasEdited(comment.created_at, comment.updated_at) && (
                <span className="text-xs text-gray-400 italic">(edited)</span>
              )}
            </div>
            {editing ? (
              <div className="flex gap-2 items-center">
                <input
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-400"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
                  autoFocus
                />
                <button onClick={saveEdit} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
              </div>
            ) : (
              <p className="text-sm text-gray-700 break-words">{comment.comment}</p>
            )}
          </div>

          {/* Action bar */}
          <div className="flex gap-4 mt-1 ml-2 items-center flex-wrap">
            <button
              onClick={() => setShowReplyInput((v) => !v)}
              className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              <Reply size={12} /> Reply
            </button>
            {replyCount > 0 && (
              <button
                onClick={() => setShowReplies((v) => !v)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </button>
            )}
            {!editing && (
              <>
                {canEdit && (
                  <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <Pencil size={10} /> Edit
                  </button>
                )}
                {canDelete && (
                  <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                    <Trash2 size={10} /> Delete
                  </button>
                )}
              </>
            )}
          </div>

          {/* Reply input */}
          {showReplyInput && (
            <div className="flex gap-2 mt-2 pl-2">
              <input
                ref={replyInputRef}
                className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                placeholder="Write a reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitReply(); if (e.key === "Escape") setShowReplyInput(false); }}
              />
              <button
                onClick={submitReply}
                disabled={!replyText.trim()}
                className="w-8 h-8 rounded-full bg-green-600 disabled:bg-gray-300 text-white flex items-center justify-center hover:bg-green-700 transition-colors flex-shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          )}

          {/* Nested replies */}
          {showReplies && replies.length > 0 && (
            <div className="mt-1">
              {replies.map((r) => (
                <ReplyItem
                  key={r.id}
                  reply={r}
                  contentType={contentType}
                  canModerate={canModerate}
                  isPostOwner={isPostOwner}
                  currentUserId={currentUserId}
                  onDeleted={(rid) => setReplies((prev) => prev.filter((x) => x.id !== rid))}
                  onEdited={(updated) => setReplies((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main EngagementPanel ──────────────────────────────────────────────────────

const EngagementPanel = ({ contentType, contentId, postOwnerId = null, canModerate = false, currentUserId = null }) => {
  const [liked, setLiked] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [shareUrl, setShareUrl] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [showShareActions, setShowShareActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [totalShares, setTotalShares] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [shareMode, setShareMode] = useState("link");
  const [sharePlatform, setSharePlatform] = useState("generic");
  const [shareMessage, setShareMessage] = useState("Check this post");
  const [shareTargets, setShareTargets] = useState([]);

  const commentInputRef = useRef(null);

  const isJobs = contentType === "jobs";

  // Alumni who own the post have the same delete rights as admin, but not edit rights on others' comments
  const isPostOwner = postOwnerId != null && currentUserId != null && postOwnerId === currentUserId;

  // ── fetch initial counts ────────────────────────────────────────────────
  useEffect(() => {
    if (!contentId) return;

    const likeUrl = isJobs
      ? `${API_ROOT}/jobs/${contentId}/react/`
      : `${API_ROOT}/${contentType}/${contentId}/like/`;
    fetch(likeUrl, { method: "GET", headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        setLiked(!!d.liked);
        setTotalLikes(d.total_likes ?? 0);
      })
      .catch(() => {});

    // Comment count — also pre-load comments so we can show them immediately
    fetch(`${API_ROOT}/${contentType}/${contentId}/comments/`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setComments(d);
          setTotalComments(d.length);
        }
      })
      .catch(() => {});

    fetch(`${API_ROOT}/${contentType}/${contentId}/share/`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setTotalShares(d.total_shares ?? 0))
      .catch(() => {});
  }, [contentId, contentType, isJobs]);

  // ── load / refresh comments ─────────────────────────────────────────────
  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`${API_ROOT}/${contentType}/${contentId}/comments/`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(data);
      setTotalComments(data.length);
    } catch {
      toast.error("Failed to load comments.");
    } finally {
      setCommentsLoading(false);
    }
  }, [contentType, contentId]);

  const toggleComments = () => {
    setShowComments((v) => {
      if (!v) loadComments();
      return !v;
    });
  };

  useEffect(() => {
    if (showComments) commentInputRef.current?.focus();
  }, [showComments]);

  // ── like toggle ─────────────────────────────────────────────────────────
  const toggleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const url = isJobs
        ? `${API_ROOT}/jobs/${contentId}/react/`
        : `${API_ROOT}/${contentType}/${contentId}/like/`;
      const res = await fetch(url, { method: "POST", headers: authHeaders() });
      const d = await res.json();
      setLiked(d.liked);
      setTotalLikes(d.total_likes ?? 0);
    } catch {
      toast.error("Failed to update like.");
    } finally {
      setLikeLoading(false);
    }
  };

  // ── post comment ─────────────────────────────────────────────────────────
  const submitComment = async () => {
    const text = newComment.trim();
    if (!text) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`${API_ROOT}/${contentType}/${contentId}/comments/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ comment: text }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setComments((prev) => [...prev, created]);
      setTotalComments((n) => n + 1);
      setNewComment("");
    } catch {
      toast.error("Failed to post comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const copyShareLink = useCallback(async (url = shareUrl) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Share link copied.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }, [shareUrl]);

  const openShareTarget = useCallback(async (target) => {
    if (!target) return;

    const payload = target.payload && typeof target.payload === "object" ? target.payload : {};
    const payloadUrl = payload.url || payload.link || payload.deep_link || payload.app_url || "";
    const targetUrl = target.appUrl || target.url || payloadUrl;

    if (target.platform === "native") {
      if (!navigator.share) {
        if (shareUrl) {
          await copyShareLink(shareUrl);
          toast.info("Native share unavailable. Link copied instead.");
        }
        return;
      }
      try {
        await navigator.share({
          title: payload.title || "Karpagam Alumni",
          text: target.text || payload.text || shareMessage || "Check this post",
          url: payload.url || shareUrl || "",
        });
      } catch {
        // User canceled native share or API is blocked.
      }
      return;
    }

    if (target.platform === "generic" || target.id === "copy" || target.id === "copy_link" || target.mode === "copy") {
      await copyShareLink(targetUrl || shareUrl);
      return;
    }

    if ((target.platform === "instagram" || target.id === "whatsapp_status") && shareUrl) {
      await copyShareLink(shareUrl);
    }

    if (isExternalUrl(targetUrl)) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      if (target.note) {
        toast.info(target.note);
      } else if (target.platform === "instagram" || target.platform === "whatsapp") {
        toast.info("Use the opened app/site to complete your story/status posting.");
      }
      return;
    }

    if (shareUrl) {
      await copyShareLink(shareUrl);
      toast.info(`${normalizePlatformLabel(target.platform)} handoff prepared. Paste the copied link to publish.`);
    }
  }, [copyShareLink, shareMessage, shareUrl]);

  const fetchTargetsByToken = useCallback(async (token) => {
    if (!token) return [];
    try {
      const res = await fetch(`${API_ROOT}/share/${token}/targets/`);
      if (!res.ok) return [];
      const data = await res.json();
      return normalizeShareTargets(data?.share_links?.targets || data?.targets || data);
    } catch {
      return [];
    }
  }, []);

  const requestShareLinks = useCallback(async ({ mode, platform, message, openNativeIfAvailable = false } = {}) => {
    if (shareLoading) return;
    const nextMode = ALLOWED_SHARE_MODES.includes(mode) ? mode : shareMode;
    const nextPlatform = ALLOWED_SHARE_PLATFORMS.includes(platform) ? platform : sharePlatform;

    setShareLoading(true);
    try {
      const body = {
        message: typeof message === "string" ? message : shareMessage,
        share_mode: nextMode,
        share_platform: nextPlatform,
      };

      const res = await fetch(`${API_ROOT}/${contentType}/${contentId}/share/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();

      const data = await res.json();
      const token = data?.share?.token || data?.token;
      const url = token ? `${window.location.origin}/share/${token}` : shareUrl;
      const canonicalUrl = data?.share_links?.canonical_url || url;
      if (canonicalUrl) setShareUrl(canonicalUrl);

      let normalizedTargets = normalizeShareTargets(data?.share_links?.targets || data?.targets);
      if (!normalizedTargets.length && token) {
        normalizedTargets = await fetchTargetsByToken(token);
      }

      setShareTargets(normalizedTargets);
      setTotalShares((prev) => (typeof data?.total_shares === "number" ? data.total_shares : prev + 1));
      setShowShareActions(true);

      if (openNativeIfAvailable && normalizedTargets.length) {
        const nativeTarget = normalizedTargets.find((item) => item.platform === "native");
        if (nativeTarget) {
          await openShareTarget(nativeTarget);
        }
      }
    } catch {
      toast.error("Failed to generate share link.");
    } finally {
      setShareLoading(false);
    }
  }, [contentId, contentType, fetchTargetsByToken, openShareTarget, shareLoading, shareMessage, shareMode, sharePlatform, shareUrl]);

  // ── share ────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    await requestShareLinks({ mode: shareMode, platform: sharePlatform, message: shareMessage, openNativeIfAvailable: true });
  };

  return (
    <div className="border-t border-gray-100 mt-2">
      {/* Action bar */}
      <div className="flex items-center gap-1 px-4 py-2">
        {/* Like */}
        <button
          onClick={toggleLike}
          disabled={likeLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
            ${liked ? "bg-red-50 text-red-500" : "text-gray-500 hover:bg-gray-100"}`}
        >
          <Heart size={16} className={liked ? "fill-red-500 text-red-500" : ""} />
          <span>{totalLikes > 0 ? totalLikes : ""} Like</span>
        </button>

        {/* Comment */}
        <button
          onClick={toggleComments}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
            ${showComments ? "bg-green-50 text-green-600" : "text-gray-500 hover:bg-gray-100"}`}
        >
          <MessageCircle size={16} />
          <span>{totalComments > 0 ? totalComments : ""} Comment</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          disabled={shareLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all duration-200 ml-auto"
        >
          <Share2 size={16} />
          <span>{totalShares > 0 ? totalShares : ""} Share</span>
        </button>
      </div>

      {/* Share actions */}
      {showShareActions && shareUrl && (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500 mb-2">Share this content</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
            <select
              value={shareMode}
              onChange={(e) => setShareMode(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              {ALLOWED_SHARE_MODES.map((mode) => (
                <option key={mode} value={mode}>{normalizePlatformLabel(mode)}</option>
              ))}
            </select>
            <select
              value={sharePlatform}
              onChange={(e) => setSharePlatform(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              {ALLOWED_SHARE_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>{normalizePlatformLabel(platform)}</option>
              ))}
            </select>
            <button
              onClick={() => requestShareLinks({ mode: shareMode, platform: sharePlatform, message: shareMessage })}
              disabled={shareLoading}
              className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:bg-gray-300"
            >
              {shareLoading ? "Loading..." : "Refresh targets"}
            </button>
          </div>
          <input
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            placeholder="Optional share message"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3"
          />
          <div className="flex flex-wrap gap-2">
            {shareTargets.map((target) => (
              <button
                key={target.id}
                onClick={() => openShareTarget(target)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
              >
                {target.platform === "linkedin" ? <Linkedin size={14} /> : null}
                {target.platform === "instagram" ? <Instagram size={14} /> : null}
                {target.platform === "generic" ? <Copy size={14} /> : null}
                {target.label || `${normalizePlatformLabel(target.platform)} ${normalizePlatformLabel(target.mode)}`}
              </button>
            ))}
            <button
              onClick={() => openShareTarget({ id: "copy", platform: "generic", mode: "copy", label: "Copy link", url: shareUrl })}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 break-all">{shareUrl}</p>
        </div>
      )}

      {/* Comment section */}
      {showComments && (
        <div className="border-t border-gray-100 px-4 pt-3 pb-4">
          {/* New comment input */}
          <div className="flex gap-2 mb-4">
            <input
              ref={commentInputRef}
              className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
              placeholder="Write a comment…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }}
            />
            <button
              onClick={submitComment}
              disabled={!newComment.trim() || submittingComment}
              className="w-9 h-9 rounded-full bg-green-600 disabled:bg-gray-300 text-white flex items-center justify-center hover:bg-green-700 transition-colors flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </div>

          {/* Comments list */}
          {commentsLoading ? (
            <div className="text-center py-4 text-sm text-gray-400">Loading comments…</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-400">No comments yet. Be the first!</div>
          ) : (
            <div>
              {comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  contentType={contentType}
                  canModerate={canModerate}
                  isPostOwner={isPostOwner}
                  currentUserId={currentUserId}
                  onDeleted={(id) => { setComments((prev) => prev.filter((x) => x.id !== id)); setTotalComments((n) => n - 1); }}
                  onEdited={(updated) => setComments((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EngagementPanel;
