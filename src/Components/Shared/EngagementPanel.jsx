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
import { Heart, MessageCircle, Share2, Send, Reply, Pencil, Trash2, X, Check, Copy, ChevronDown, ChevronUp, Link2, ArrowLeft, Search, Users } from "lucide-react";
import { toast } from "react-toastify";

const API_ROOT = "https://api.karpagamalumni.in/api/v1";
const getToken = () => localStorage.getItem("Token");
const authHeaders = () => ({ Authorization: `Token ${getToken()}`, "Content-Type": "application/json" });

const ALLOWED_SHARE_MODES = ["link", "status", "story", "post", "portal"];
const ALLOWED_SHARE_PLATFORMS = ["generic", "native", "whatsapp", "instagram", "facebook", "x", "linkedin", "telegram", "portal"];

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
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

// ── Platform icon SVGs (inline, no extra deps) ───────────────────────────────

const WhatsAppIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.374 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.826L.057 23.859c-.073.262.148.494.413.437l6.226-1.437A11.935 11.935 0 0012 24c6.626 0 12-5.373 12-12S18.626 0 12 0zm0 21.818a9.82 9.82 0 01-5.002-1.369l-.358-.213-3.714.857.899-3.593-.236-.374A9.82 9.82 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182S21.818 6.578 21.818 12 17.422 21.818 12 21.818z"/>
  </svg>
);

const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const FacebookIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const XIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.732-8.857L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TelegramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const NativeShareIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const PortalIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
    <path d="M16 8v8h-2V8h2zM10 8v8H8V8h2z" fill="none"/>
    <circle cx="9" cy="7" r="1.5"/>
    <circle cx="15" cy="7" r="1.5"/>
    <path d="M12 13a3 3 0 100-6 3 3 0 000 6zm0-4.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
    <path d="M17.5 17c0-1.93-2.46-3.5-5.5-3.5S6.5 15.07 6.5 17h11z"/>
  </svg>
);

// ── Portal Share Modal ────────────────────────────────────────────────────────

const PortalShareModal = ({ open, onClose, shareUrl, shareMessage, shareToken, contentType, contentId }) => {
  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState([]);
  const [searching, setSearching]     = useState(false);
  const [sending, setSending]         = useState(null); // userId being sent to
  const [sent, setSent]               = useState({});   // userId → true
  const [shareToAll, setShareToAll]   = useState(false);
  const [sendingAll, setSendingAll]   = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => { if (!open) { setQuery(""); setResults([]); setSent({}); setShareToAll(false); } }, [open]);

  const searchUsers = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const token = localStorage.getItem("Token");
      const r = await fetch(
        `https://api.karpagamalumni.in/chat/search/?q=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" } }
      );
      if (r.ok) setResults(await r.json());
    } catch (_) {} finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(query), 300);
    return () => clearTimeout(t);
  }, [query, searchUsers]);

  const sendToUser = async (userId) => {
    if (sent[userId] || sending === userId) return;
    setSending(userId);
    try {
      const token = localStorage.getItem("Token");
      const r = await fetch("https://api.karpagamalumni.in/api/v1/share/portal/", {
        method: "POST",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ token: shareToken, target: "chat", target_user_id: userId }),
      });
      if (r.ok) {
        setSent((prev) => ({ ...prev, [userId]: true }));
        toast.success("Shared via chat!");
      } else {
        toast.error("Failed to send.");
      }
    } catch (_) { toast.error("Failed to send."); } finally { setSending(null); }
  };

  const sendToCommunity = async () => {
    if (sendingAll) return;
    setSendingAll(true);
    try {
      const token = localStorage.getItem("Token");
      const r = await fetch("https://api.karpagamalumni.in/api/v1/share/portal/", {
        method: "POST",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ token: shareToken, target: "community" }),
      });
      if (r.ok) { setShareToAll(true); toast.success("Shared to Community Chat!"); }
      else toast.error("Failed to share to community.");
    } catch (_) { toast.error("Failed to share to community."); } finally { setSendingAll(false); }
  };

  if (!open) return null;

  return (
    <div ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "85vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <Users size={16} className="text-emerald-600" />
            </div>
            <span className="text-base font-semibold text-gray-900">Share with Members</span>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 70px)" }}>
          {/* Community broadcast */}
          <div className="px-5 pt-4 pb-3">
            <button onClick={sendToCommunity} disabled={shareToAll || sendingAll}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition text-sm font-medium
                ${shareToAll ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700"}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <Users size={17} className="text-white" />
              </div>
              <div className="text-left flex-1">
                <p className={shareToAll ? "text-emerald-700 font-semibold" : "text-gray-900 font-semibold"}>
                  {shareToAll ? "Posted to Community Chat ✓" : "Post to Community Chat"}
                </p>
                <p className="text-xs text-gray-400">Visible to all portal members</p>
              </div>
              {sendingAll && <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />}
            </button>
          </div>

          <div className="px-5 pb-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Or send to a specific member</p>
            {/* Search */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or username…"
                className="w-full bg-gray-100 rounded-xl pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>

          {/* Results */}
          <div className="px-5 pb-5 space-y-2">
            {searching && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!searching && query && results.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">No members found</p>
            )}
            {!searching && !query && (
              <p className="text-center text-gray-400 text-sm py-4">Type a name to search</p>
            )}
            {results.map((u) => {
              const isSent = sent[u.id];
              const isSending = sending === u.id;
              const initials = ((u.first_name?.[0] || "") + (u.last_name?.[0] || "")).toUpperCase() || "?";
              return (
                <div key={u.id} className="flex items-center gap-3 py-2 px-1">
                  {u.profile_photo ? (
                    <img src={u.profile_photo.startsWith("http") ? u.profile_photo : `https://api.karpagamalumni.in${u.profile_photo}`}
                      alt={initials} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-700 font-semibold text-sm">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-gray-400 truncate">@{u.username}</p>
                  </div>
                  <button onClick={() => sendToUser(u.id)} disabled={isSent || isSending}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1
                      ${isSent ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
                    {isSending ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : isSent ? <><Check size={11} /> Sent</>
                      : "Send"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Share Sheet Modal ─────────────────────────────────────────────────────────

const PLATFORM_META = {
  whatsapp: {
    label: "WhatsApp",
    icon: WhatsAppIcon,
    color: "#25D366",
    bg: "#E8F9EE",
    modes: [
      { id: "whatsapp_post", mode: "post", label: "Message" },
      { id: "whatsapp_status", mode: "status", label: "Status" },
    ],
  },
  instagram: {
    label: "Instagram",
    icon: InstagramIcon,
    color: "#E1306C",
    bg: "#FDE8F0",
    modes: [
      { id: "instagram_story", mode: "story", label: "Story" },
      { id: "instagram_post", mode: "post", label: "Post" },
    ],
  },
  facebook: {
    label: "Facebook",
    icon: FacebookIcon,
    color: "#1877F2",
    bg: "#E8F0FE",
    modes: [{ id: "facebook_post", mode: "post", label: "Share" }],
  },
  x: {
    label: "X",
    icon: XIcon,
    color: "#000000",
    bg: "#F0F0F0",
    modes: [{ id: "x_post", mode: "post", label: "Post" }],
  },
  linkedin: {
    label: "LinkedIn",
    icon: LinkedInIcon,
    color: "#0A66C2",
    bg: "#E8F0FE",
    modes: [{ id: "linkedin_post", mode: "post", label: "Share" }],
  },
  telegram: {
    label: "Telegram",
    icon: TelegramIcon,
    color: "#0088cc",
    bg: "#E5F4FC",
    modes: [{ id: "telegram_post", mode: "post", label: "Send" }],
  },
  native: {
    label: "More",
    icon: NativeShareIcon,
    color: "#6B7280",
    bg: "#F3F4F6",
    modes: [{ id: "native_share", mode: "link", label: "Share" }],
  },
  portal: {
    label: "Members",
    icon: PortalIcon,
    color: "#059669",
    bg: "#ECFDF5",
    modes: [
      { id: "portal_chat", mode: "portal", label: "Send to Member" },
      { id: "portal_community", mode: "portal", label: "Community Chat" },
    ],
  },
};

const PLATFORM_ORDER = ["portal", "whatsapp", "instagram", "facebook", "x", "linkedin", "telegram", "native"];

const ShareSheet = ({
  open,
  onClose,
  shareUrl,
  shareTargets,
  shareMessage,
  onMessageChange,
  shareLoading,
  onOpenTarget,
  onCopyLink,
  copied,
  onRefresh,
  onOpenPortal,
}) => {
  const overlayRef = useRef(null);
  const sheetRef = useRef(null);
  const [activePlatform, setActivePlatform] = useState(null);

  useEffect(() => {
    if (!open) {
      setActivePlatform(null);
    }
  }, [open]);

  // close on outside click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Find targets per platform+mode
  const findTarget = useCallback((targetId) => {
    return shareTargets.find((t) => t.id === targetId) || null;
  }, [shareTargets]);

  const handlePlatformClick = (platform) => {
    if (platform === "portal") {
      onOpenPortal?.();
      return;
    }
    const meta = PLATFORM_META[platform];
    if (!meta) return;
    if (meta.modes.length === 1) {
      const target = findTarget(meta.modes[0].id);
      if (target) {
        onOpenTarget(target);
      } else {
        onRefresh({ platform, mode: meta.modes[0].mode });
        toast.info(`Opening ${meta.label}…`);
      }
    } else {
      setActivePlatform(platform === activePlatform ? null : platform);
    }
  };

  const handleModeClick = (platform, modeEntry) => {
    const target = findTarget(modeEntry.id);
    if (target) {
      onOpenTarget(target);
    } else {
      onRefresh({ platform, mode: modeEntry.mode });
      toast.info(`Opening ${PLATFORM_META[platform]?.label} ${modeEntry.label}…`);
    }
    setActivePlatform(null);
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
    >
      <div
        ref={sheetRef}
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "92vh" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          {activePlatform ? (
            <button
              onClick={() => setActivePlatform(null)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <span className="text-base font-semibold text-gray-900">Share</span>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 110px)" }}>
          {/* Sub-mode picker */}
          {activePlatform && PLATFORM_META[activePlatform] ? (
            <div className="px-5 py-6">
              {(() => {
                const meta = PLATFORM_META[activePlatform];
                const Icon = meta.icon;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: meta.bg, color: meta.color }}>
                        <Icon size={26} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{meta.label}</p>
                        <p className="text-xs text-gray-400">Choose where to share</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {meta.modes.map((modeEntry) => (
                        <button
                          key={modeEntry.id}
                          onClick={() => handleModeClick(activePlatform, modeEntry)}
                          className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                        >
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: meta.bg, color: meta.color }}>
                            <Icon size={22} />
                          </div>
                          <span className="text-sm font-medium text-gray-800">{modeEntry.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <>
              {/* Share message input */}
              <div className="px-5 pt-4 pb-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Add a message (optional)</p>
                <textarea
                  value={shareMessage}
                  onChange={(e) => onMessageChange(e.target.value)}
                  placeholder="Say something about this post…"
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-green-300 bg-gray-50"
                />
              </div>

              {/* Copy link row */}
              {shareUrl && (
                <div className="px-5 pb-3">
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <Link2 size={15} className="text-gray-400 flex-shrink-0" />
                    <span className="flex-1 text-xs text-gray-500 truncate">{shareUrl}</span>
                    <button
                      onClick={() => onCopyLink()}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex-shrink-0"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              {/* Platform grid */}
              <div className="px-5 pb-6">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Share to</p>
                <div className="grid grid-cols-4 gap-3">
                  {PLATFORM_ORDER.map((platform) => {
                    const meta = PLATFORM_META[platform];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    const hasMultipleModes = meta.modes.length > 1;
                    return (
                      <button
                        key={platform}
                        onClick={() => handlePlatformClick(platform)}
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95 group-hover:scale-105"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          <Icon size={28} />
                        </div>
                        <span className="text-[11px] font-medium text-gray-600 text-center leading-tight">
                          {meta.label}
                          {hasMultipleModes && <span className="block text-[10px] text-gray-400">Tap to choose</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Loading state */}
              {shareLoading && (
                <div className="flex items-center justify-center gap-2 pb-4 text-sm text-gray-400">
                  <svg className="animate-spin h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Preparing share links…
                </div>
              )}
            </>
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
  const [shareToken, setShareToken]     = useState(null);
  const [showPortalModal, setShowPortalModal] = useState(false);

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
      if (token) setShareToken(token);

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
    // Open sheet immediately if we already have a URL, otherwise fetch first
    if (shareUrl && shareTargets.length > 0) {
      setShowShareActions(true);
      return;
    }
    await requestShareLinks({ mode: shareMode, platform: sharePlatform, message: shareMessage });
  };

  const handleSheetRefresh = useCallback(({ platform, mode } = {}) => {
    requestShareLinks({
      mode: mode || shareMode,
      platform: platform || sharePlatform,
      message: shareMessage,
    });
  }, [requestShareLinks, shareMode, sharePlatform, shareMessage]);

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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all duration-200 ml-auto disabled:opacity-50"
        >
          {shareLoading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <Share2 size={16} />
          )}
          <span>{totalShares > 0 ? totalShares : ""} Share</span>
        </button>
      </div>

      {/* Share Sheet */}
      <ShareSheet
        open={showShareActions}
        onClose={() => setShowShareActions(false)}
        shareUrl={shareUrl}
        shareTargets={shareTargets}
        shareMessage={shareMessage}
        onMessageChange={setShareMessage}
        shareLoading={shareLoading}
        onOpenTarget={openShareTarget}
        onCopyLink={() => copyShareLink(shareUrl)}
        copied={copied}
        onRefresh={handleSheetRefresh}
        onOpenPortal={() => { setShowShareActions(false); setShowPortalModal(true); }}
      />

      {/* Portal Members Share Modal */}
      <PortalShareModal
        open={showPortalModal}
        onClose={() => setShowPortalModal(false)}
        shareUrl={shareUrl}
        shareMessage={shareMessage}
        shareToken={shareToken}
        contentType={contentType}
        contentId={contentId}
      />

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
