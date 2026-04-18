/**
 * EngagementPanel
 *
 * Renders Like / Comment (with nested replies) / Share for any content type.
 *
 * Props
 * ─────
 *   contentType  : "events" | "jobs" | "news" | "businesses"
 *   contentId    : number
 *   canModerate  : boolean  – true when current user is admin/staff (enables edit/delete on any comment)
 *   currentUserId: number   – id of the logged-in user (used to show own edit/delete)
 *
 * For Jobs the like toggle is handled via the existing /jobs/<id>/react/ endpoint.
 * All other types use the new /…/<id>/like/ toggle endpoint.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Heart, MessageCircle, Share2, Send, Reply, Pencil, Trash2, X, Check, Copy, ChevronDown, ChevronUp, Linkedin, Instagram } from "lucide-react";
import { toast } from "react-toastify";
import { API_SHARE_PREVIEW } from "../../config/api";

const API_ROOT = "https://api.karpagamalumni.in/api/v1";
const getToken = () => localStorage.getItem("Token");
const authHeaders = () => ({ Authorization: `Token ${getToken()}`, "Content-Type": "application/json" });

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

const Avatar = ({ user, size = 8 }) => {
  const initials = ((user?.first_name?.[0] || "") + (user?.last_name?.[0] || "")).toUpperCase() || "?";
  return user?.profile_photo ? (
    <img src={getPhotoUrl(user.profile_photo)} alt={initials} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`w-${size} h-${size} rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-700 font-semibold text-xs`}>{initials}</div>
  );
};

// ── Reply item ────────────────────────────────────────────────────────────────

const ReplyItem = ({ reply, contentType, canModerate, currentUserId, onDeleted, onEdited }) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.reply);

  const isOwn = reply.user?.id === currentUserId;
  const canAct = isOwn || canModerate;

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
            {reply.updated_at !== reply.created_at && <span className="text-xs text-gray-400 italic">(edited)</span>}
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
        {canAct && !editing && (
          <div className="flex gap-3 mt-1 ml-2">
            {isOwn && (
              <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <Pencil size={10} /> Edit
              </button>
            )}
            <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
              <Trash2 size={10} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Comment item ──────────────────────────────────────────────────────────────

const CommentItem = ({ comment, contentType, canModerate, currentUserId, onDeleted, onEdited }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment);
  const replyInputRef = useRef(null);

  const isOwn = comment.user?.id === currentUserId;
  const canAct = isOwn || canModerate;

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
              {comment.updated_at !== comment.created_at && <span className="text-xs text-gray-400 italic">(edited)</span>}
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
            {canAct && !editing && (
              <>
                {isOwn && (
                  <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <Pencil size={10} /> Edit
                  </button>
                )}
                <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                  <Trash2 size={10} /> Delete
                </button>
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

const EngagementPanel = ({ contentType, contentId, canModerate = false, currentUserId = null }) => {
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

  const commentInputRef = useRef(null);

  // Jobs use the existing reaction endpoint; all others use the new like toggle
  const isJobs = contentType === "jobs";

  // ── fetch initial counts ────────────────────────────────────────────────
  useEffect(() => {
    if (!contentId) return;

    // Like state
    if (!isJobs) {
      fetch(`${API_ROOT}/${contentType}/${contentId}/like/`, {
        method: "GET",
        headers: authHeaders(),
      })
        .then((r) => r.json())
        .then((d) => {
          setLiked(!!d.liked);
          setTotalLikes(d.total_likes ?? 0);
        })
        .catch(() => {});
    } else {
      // For jobs, load from the job detail which has reaction count + user reaction
      fetch(`${API_ROOT}/jobs/${contentId}/`, { headers: authHeaders() })
        .then((r) => r.json())
        .then((d) => {
          setTotalLikes(d.total_reactions ?? 0);
          // Check if the current user has reacted
          fetch(`${API_ROOT}/jobs/${contentId}/react/`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ reaction: { like: 0 } }),
          })
            .then((r) => r.json())
            .then((rd) => {
              // This is a toggle — we used 0 to check state without changing it
              // Actually just read from reactions data if available
              setLiked(false); // Will be updated when user interacts
            })
            .catch(() => {});
        })
        .catch(() => {});
    }

    // Comment count
    fetch(`${API_ROOT}/${contentType}/${contentId}/comments/`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setTotalComments(Array.isArray(d) ? d.length : 0))
      .catch(() => {});

    // Share count
    fetch(`${API_ROOT}/${contentType}/${contentId}/share/`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setTotalShares(d.total_shares ?? 0))
      .catch(() => {});
  }, [contentId, contentType, isJobs]);

  // ── load comments when panel opens ─────────────────────────────────────
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
      if (isJobs) {
        const res = await fetch(`${API_ROOT}/jobs/${contentId}/react/`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ reaction: { like: liked ? 0 : 1 } }),
        });
        const d = await res.json();
        const newTotal = Object.values(d.reaction || {}).reduce((a, b) => a + b, 0);
        setTotalLikes(newTotal);
        setLiked(!liked);
      } else {
        const res = await fetch(`${API_ROOT}/${contentType}/${contentId}/like/`, {
          method: "POST",
          headers: authHeaders(),
        });
        const d = await res.json();
        setLiked(d.liked);
        setTotalLikes(d.total_likes);
      }
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

  const openShareTarget = useCallback(async (platform) => {
    if (!shareUrl) return;

    if (platform === "copy") {
      await copyShareLink(shareUrl);
      return;
    }

    if (platform === "instagram") {
      await copyShareLink(shareUrl);
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      toast.info("Link copied. Paste it in Instagram.");
      return;
    }

    const encoded = encodeURIComponent(shareUrl);
    const targetMap = {
      whatsapp: `https://wa.me/?text=${encoded}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    };
    const target = targetMap[platform];
    if (target) {
      window.open(target, "_blank", "noopener,noreferrer");
    }
  }, [copyShareLink, shareUrl]);

  // ── share ────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (shareLoading) return;
    setShareLoading(true);
    try {
      const res = await fetch(`${API_ROOT}/${contentType}/${contentId}/share/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ message: "" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const url = API_SHARE_PREVIEW(data.token);
      setShareUrl(url);
      setTotalShares((n) => n + 1);

      if (navigator.share) {
        try {
          await navigator.share({
            title: "Karpagam Alumni",
            text: "Check this out",
            url,
          });
          setShowShareActions(false);
          return;
        } catch {
          // User cancelled or the platform could not open native share sheet.
        }
      }

      setShowShareActions(true);
    } catch {
      toast.error("Failed to generate share link.");
    } finally {
      setShareLoading(false);
    }
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

      {/* Share actions (no modal popup) */}
      {showShareActions && shareUrl && (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500 mb-2">Share this link</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openShareTarget("whatsapp")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-green-50 text-green-700 hover:bg-green-100 text-sm"
            >
              <span className="font-semibold">WA</span>
              WhatsApp
            </button>
            <button
              onClick={() => openShareTarget("linkedin")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm"
            >
              <Linkedin size={14} />
              LinkedIn
            </button>
            <button
              onClick={() => openShareTarget("instagram")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-pink-50 text-pink-700 hover:bg-pink-100 text-sm"
            >
              <Instagram size={14} />
              Instagram
            </button>
            <button
              onClick={() => openShareTarget("copy")}
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
