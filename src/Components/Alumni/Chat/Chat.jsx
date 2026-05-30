import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Send, ArrowLeft, Plus, Users, MessageSquare,
  Trash2, Globe, Eye, AlertTriangle, Check, CheckCheck,
  Clock, Pencil, X, Info, Copy, Paperclip, CornerUpLeft,
} from "lucide-react";
import { getMediaUrl } from "../../../config/api";
import { getProfilePlaceholderByGender } from "../../../lib/profilePlaceholders";

const API_HOST = "https://api.karpagamalumni.in";
const WS_HOST  = "api.karpagamalumni.in";

const getToken = () => localStorage.getItem("Token");
const authH    = () => ({ Authorization: `Token ${getToken()}`, "Content-Type": "application/json" });

const fmtTime = (ts) => {
  if (!ts) return "";
  try { return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
};

const fmtDateTime = (ts) => {
  if (!ts) return "";
  try { return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
};

const fmtLastSeen = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const diffMin = Math.floor((new Date() - d) / 60000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const photoUrl = (photoPath) => getMediaUrl(photoPath);

// Render plain text with clickable links
const renderTextWithLinks = (text, own = false) => {
  if (!text) return null;
  const parts = [];
  const urlRegex = /((https?:\/\/|www\.)[^\s<>]+)/gi;
  let lastIndex = 0;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const idx = match.index;
    if (idx > lastIndex) parts.push(text.slice(lastIndex, idx));
    let url = match[0];
    if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
    parts.push(
      <a key={`u-${idx}`} href={url} target="_blank" rel="noopener noreferrer" className={own ? "underline text-white/90 break-words" : "underline text-emerald-600 break-words"}>
        {match[0]}
      </a>
    );
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.map((p, i) => (typeof p === "string" ? <span key={`t-${i}`}>{p}</span> : p));
};

const StatusIcon = ({ status, isCommunity }) => {
  if (isCommunity) return null;
  if (status === "seen")      return <CheckCheck className="w-3.5 h-3.5 text-sky-300 inline-block ml-1" aria-label="Seen" />;
  if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-white/50 inline-block ml-1" aria-label="Delivered" />;
  if (status === "sent")      return <Check className="w-3.5 h-3.5 text-white/50 inline-block ml-1" aria-label="Sent" />;
  return <Clock className="w-3 h-3 text-white/40 inline-block ml-1" aria-label="Pending" />;
};

const SidebarStatusIcon = ({ status }) => {
  if (status === "seen")      return <CheckCheck className="w-3 h-3 text-sky-500 inline-block" aria-label="Seen" />;
  if (status === "delivered") return <CheckCheck className="w-3 h-3 text-gray-400 inline-block" aria-label="Delivered" />;
  if (status === "sent")      return <Check className="w-3 h-3 text-gray-400 inline-block" aria-label="Sent" />;
  return null;
};

const Avatar = ({ src, name, gender, size = 10, isCommunity = false }) => {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [src]);
  const cls = `w-${size} h-${size} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0`;
  if (isCommunity)
    return (
      <div className={`${cls} bg-gradient-to-br from-indigo-500 to-violet-600`}>
        <Globe className="w-5 h-5 text-white" />
      </div>
    );
  const resolvedSrc = !imgError && src ? photoUrl(src) : getProfilePlaceholderByGender(gender);
  return <img src={resolvedSrc} alt={name || "User"} className={`${cls} object-cover`} onError={() => setImgError(true)} />;
};

const MessageInfoPanel = ({ msg, onClose, isCommunity }) => {
  if (!msg) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Message Info</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-700 break-words">{renderTextWithLinks(msg.text, false)}</div>
          <div className="space-y-2 text-sm">
            <Row icon={<Clock className="w-3.5 h-3.5 text-gray-400" />} label="Sent" value={fmtDateTime(msg.timestamp)} />
            {!isCommunity && (
              <>
                <Row icon={<CheckCheck className="w-3.5 h-3.5 text-gray-400" />} label="Delivered" value={msg.delivered_at ? fmtDateTime(msg.delivered_at) : "—"} />
                <Row icon={<CheckCheck className="w-3.5 h-3.5 text-sky-400" />} label="Seen" value={msg.seen_at ? fmtDateTime(msg.seen_at) : "—"} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Row = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <span className="flex-shrink-0">{icon}</span>
    <span className="text-gray-500 w-20 flex-shrink-0">{label}</span>
    <span className="text-gray-800 font-medium">{value}</span>
  </div>
);

const ContextMenu = ({ x, y, items, onClose }) => {
  const menuRef = useRef(null);
  useEffect(() => {
    const handle = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => { document.removeEventListener("mousedown", handle); document.removeEventListener("touchstart", handle); };
  }, [onClose]);

  const menuW = 160, menuH = items.length * 40;
  const style = {
    position: "fixed",
    zIndex: 9999,
    left: Math.min(x, window.innerWidth - menuW - 8),
    top:  Math.min(y, window.innerHeight - menuH - 8),
  };

  return (
    <div ref={menuRef} style={style} className="bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden w-40 py-1" onContextMenu={(e) => e.preventDefault()}>
      {items.map((item) => (
        <button key={item.label} onClick={() => { item.action(); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition hover:bg-gray-50 ${item.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"}`}>
          {item.icon}{item.label}
        </button>
      ))}
    </div>
  );
};

const Chat = () => {
  const [selectedChat, setSelectedChat]       = useState(null);
  const [message, setMessage]                 = useState("");
  const [messages, setMessages]               = useState([]);
  const [searchQuery, setSearchQuery]         = useState("");
  const [searchResults, setSearchResults]     = useState([]);
  const [showSearch, setShowSearch]           = useState(false);
  const [rooms, setRooms]                     = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [currentUser, setCurrentUser]         = useState(null);
  const [isConnected, setIsConnected]         = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete]       = useState(null);
  const [communityRoom, setCommunityRoom]     = useState(null);
  const [showAgreement, setShowAgreement]     = useState(
    () => !localStorage.getItem("chat_agreement_accepted")
  );
  const [presenceMap, setPresenceMap]   = useState({});
  const [editingId, setEditingId]       = useState(null);
  const [editText, setEditText]         = useState("");
  const [ctxMenu, setCtxMenu]           = useState(null);
  const [infoMsg, setInfoMsg]           = useState(null);
  const [replyTo, setReplyTo]           = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const messagesEndRef    = useRef(null);
  const socketRef         = useRef(null);
  const globalSocketRef   = useRef(null);
  const inputRef          = useRef(null);
  const selectedChatIdRef = useRef(null);
  const currentUserIdRef  = useRef(null);
  const longPressTimer    = useRef(null);
  const fileInputRef      = useRef(null);
  const editInputRef      = useRef(null);

  useEffect(() => { currentUserIdRef.current = currentUser?.id || null; }, [currentUser]);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => {
    const close = () => setCtxMenu(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, []);

  const handleAcceptAgreement = () => {
    localStorage.setItem("chat_agreement_accepted", "true");
    setShowAgreement(false);
  };

  useEffect(() => {
    connectGlobalSocket();
    return () => { closeSocket(); closeGlobalSocket(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeSocket = () => {
    const ws = socketRef.current;
    if (ws) { try { ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null; ws.close(); } catch (_) {} socketRef.current = null; }
  };
  const closeGlobalSocket = () => {
    const ws = globalSocketRef.current;
    if (ws) { try { ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null; ws.close(); } catch (_) {} globalSocketRef.current = null; }
  };

  const connectGlobalSocket = () => {
    const token = getToken();
    if (!token) return;
    closeGlobalSocket();
    const ws = (() => { try { return new WebSocket(`wss://${WS_HOST}/ws/chat/?token=${encodeURIComponent(token)}`); } catch { restBootstrapFallback(); return null; } })();
    if (!ws) return;
    globalSocketRef.current = ws;

    ws.onopen = () => { try { ws.send(JSON.stringify({ action: "bootstrap" })); } catch (_) {} };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action === "bootstrap") {
          if (Array.isArray(data.rooms)) setRooms(data.rooms);
          if (data.community?.id) setCommunityRoom({ ...data.community, is_community: true, name: "Community Chat" });
          if (data.presence) setPresenceMap((prev) => ({ ...prev, ...data.presence }));
          if (data.me) setCurrentUser(data.me);
          return;
        }
        if (data.action === "room_update") {
          setRooms((prev) => {
            const idx = prev.findIndex((r) => String(r.id) === String(data.room_id));
            if (idx === -1) { loadRooms(); return prev; }
            const isOpen   = String(selectedChatIdRef.current) === String(data.room_id);
            const fromSelf = String(data.sender_id) === String(currentUserIdRef.current);
            const updated  = prev.map((r, i) =>
              i === idx ? {
                ...r,
                lastMessage: data.last_message ?? r.lastMessage,
                lastMessageTime: data.last_message_time ?? r.lastMessageTime,
                lastMessageSenderId: data.last_message_sender_id ?? r.lastMessageSenderId,
                lastMessageStatus: data.last_message_status ?? r.lastMessageStatus,
                unreadCount: isOpen || fromSelf ? 0 : (r.unreadCount || 0) + 1,
              } : r
            );
            updated.sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
            return updated;
          });
          return;
        }
        if (data.action === "room_created" && data.room?.id) {
          setRooms((prev) => prev.some((r) => String(r.id) === String(data.room.id)) ? prev : [data.room, ...prev]);
          return;
        }
        if ((data.action === "presence_update" || data.type === "presence_update") && data.user_id != null) {
          const key = String(data.user_id);
          setPresenceMap((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), is_online: !!data.is_online, last_seen: data.last_seen ?? prev[key]?.last_seen ?? null } }));
          return;
        }
        if (data.action === "incoming_message") {
          if (data.room_id && String(selectedChatIdRef.current) !== String(data.room_id)) {
            setRooms((prev) => prev.map((r) => String(r.id) === String(data.room_id) ? { ...r, unreadCount: (r.unreadCount || 0) + 1 } : r));
          }
          return;
        }
        if (data.action === "status_update" && Array.isArray(data.message_ids)) {
          setMessages((prev) => prev.map((m) =>
            data.message_ids.includes(String(m.id))
              ? { ...m, status: data.status, delivered_at: data.delivered_at || m.delivered_at, seen_at: data.seen_at || m.seen_at }
              : m
          ));
          if (data.room_id) {
            setRooms((prev) => prev.map((r) => String(r.id) === String(data.room_id) ? { ...r, lastMessageStatus: data.status } : r));
          }
          return;
        }
      } catch (_) {}
    };
    ws.onerror = () => { restBootstrapFallback(); };
    ws.onclose = (e) => {
      globalSocketRef.current = null;
      if (e.code === 1006 || !e.wasClean) { restBootstrapFallback(); setTimeout(() => { if (!globalSocketRef.current) connectGlobalSocket(); }, 4000); }
    };
  };

  const restBootstrapFallback = () => { loadRooms(); getCurrentUser(); loadCommunityChat(); };

  const getCurrentUser = async () => {
    const token = getToken();
    if (!token) return;
    try { const r = await fetch(`${API_HOST}/chat/user/me/`, { headers: authH() }); if (r.ok) { setCurrentUser(await r.json()); return; } } catch (_) {}
    try { const r = await fetch(`${API_HOST}/api/v1/user/me/`, { headers: authH() }); if (r.ok) setCurrentUser(await r.json()); } catch (_) {}
  };

  const loadRooms = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try { const r = await fetch(`${API_HOST}/chat/rooms/`, { headers: authH() }); if (r.ok) setRooms(await r.json()); }
    catch (_) {} finally { setLoading(false); }
  };

  const loadCommunityChat = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const r = await fetch(`${API_HOST}/chat/community/`, { headers: authH() });
      if (r.ok) { const d = await r.json(); if (d?.id) setCommunityRoom({ ...d, is_community: true, name: "Community Chat" }); }
    } catch (_) {}
  };

  const searchUsers = async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    try { const r = await fetch(`${API_HOST}/chat/search/?q=${encodeURIComponent(q)}`, { headers: authH() }); if (r.ok) setSearchResults(await r.json()); } catch (_) {}
  };

  const createRoom = async (userId) => {
    try {
      const r = await fetch(`${API_HOST}/chat/rooms/`, { method: "POST", headers: authH(), body: JSON.stringify({ target_user_id: userId }) });
      if (r.ok) { const room = await r.json(); setRooms((prev) => [room, ...prev.filter((x) => x.id !== room.id)]); selectChat(room); setShowSearch(false); setSearchQuery(""); setSearchResults([]); }
    } catch (_) {}
  };

  const deleteRoom = async (roomId) => {
    try {
      const r = await fetch(`${API_HOST}/chat/rooms/?room_id=${encodeURIComponent(roomId)}`, { method: "DELETE", headers: authH() });
      if (r.ok) { setRooms((prev) => prev.filter((x) => x.id !== roomId)); if (selectedChat?.id === roomId) { setSelectedChat(null); closeSocket(); setMessages([]); setIsConnected(false); } setShowDeleteModal(false); setRoomToDelete(null); }
    } catch (_) {}
  };

  const loadMessagesHTTP = async (roomId) => {
    try {
      const r = await fetch(`${API_HOST}/chat/rooms/${encodeURIComponent(roomId)}/messages/`, { headers: authH() });
      if (r.ok) setMessages((await r.json()).map((m) => ({ ...m, time: m.time || fmtTime(m.timestamp) || "" })));
    } catch (_) {}
  };

  const markSeen = useCallback(async (roomId, upToMsgId, isCommunity = false) => {
    if (!roomId && !isCommunity) return;
    const endpoint = isCommunity ? `${API_HOST}/chat/community/seen/` : `${API_HOST}/chat/rooms/${roomId}/seen/`;
    try { await fetch(endpoint, { method: "POST", headers: authH(), body: JSON.stringify(upToMsgId ? { message_id: upToMsgId } : {}) }); } catch (_) {}
  }, []);

  const fetchPresence = useCallback(async (userId) => {
    if (!userId) return;
    try { const r = await fetch(`${API_HOST}/chat/presence/${userId}/`, { headers: authH() }); if (r.ok) { const d = await r.json(); setPresenceMap((prev) => ({ ...prev, [userId]: d })); } } catch (_) {}
  }, []);

  const connectWebSocket = useCallback((roomId, isCommunity = false) => {
    const token = getToken();
    if (!token) return;
    closeSocket();
    setIsConnected(false);
    setMessages([]);

    const wsUrl = isCommunity
      ? `wss://${WS_HOST}/ws/community-chat/?token=${encodeURIComponent(token)}`
      : `wss://${WS_HOST}/ws/chat/${encodeURIComponent(roomId)}/?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => { setIsConnected(true); };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action === "message_history" && Array.isArray(data.messages)) {
          const normalized = data.messages.map((m) => ({ ...m, time: m.time || fmtTime(m.timestamp) || "" }));
          setMessages(normalized);
          const lastMsg = normalized[normalized.length - 1];
          if (lastMsg) markSeen(roomId, lastMsg.id, isCommunity);
          return;
        }
        if (data.action === "new_message" || data.type === "chat_message" || data.action === "chat_message") {
          const newMsg = {
            id: data.message_id || data.id || crypto.randomUUID(),
            text: data.message || data.text || "",
            sender: data.sender ? (typeof data.sender === "string" ? { username: data.sender } : data.sender) : null,
            time: fmtTime(data.timestamp) || new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
            timestamp: data.timestamp || new Date().toISOString(),
            status: data.status || "sent",
            delivered_at: data.delivered_at || null,
            seen_at: data.seen_at || null,
            sender_id: data.sender_id || data.sender?.id || null,
            reply_to: data.reply_to || null,
            media: data.media || null,
            media_type: data.media_type || null,
            edited: data.edited || false,
          };
          setMessages((prev) => [...prev, newMsg]);
          markSeen(roomId, newMsg.id, isCommunity);
          setRooms((prev) => {
            const updated = prev.map((r) =>
              String(r.id) === String(roomId)
                ? { ...r, lastMessage: newMsg.text, lastMessageTime: newMsg.timestamp, lastMessageSenderId: newMsg.sender_id || newMsg.sender?.id, lastMessageStatus: newMsg.status, unreadCount: 0 }
                : r
            );
            updated.sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
            return updated;
          });
          return;
        }
        if (data.action === "status_update" && Array.isArray(data.message_ids)) {
          setMessages((prev) => prev.map((m) =>
            data.message_ids.includes(String(m.id))
              ? { ...m, status: data.status, delivered_at: data.delivered_at || m.delivered_at, seen_at: data.seen_at || m.seen_at }
              : m
          ));
          return;
        }
        if (data.action === "presence_update") {
          setPresenceMap((prev) => ({ ...prev, [data.user_id]: { is_online: data.is_online, last_seen: data.last_seen } }));
          return;
        }
        if (data.action === "message_deleted") {
          setMessages((prev) => prev.filter((m) => String(m.id) !== String(data.message_id)));
          return;
        }
        if (data.action === "message_edited") {
          setMessages((prev) => prev.map((m) => String(m.id) === String(data.message_id) ? { ...m, text: data.new_text, edited: true } : m));
          return;
        }
      } catch (_) {}
    };
    ws.onerror = () => { setIsConnected(false); loadMessagesHTTP(roomId); };
    ws.onclose = (e) => { socketRef.current = null; setIsConnected(false); if (e.code === 1006 || !e.wasClean) loadMessagesHTTP(roomId); };
  }, [markSeen]);

  const selectChat = useCallback((chat) => {
    setSelectedChat(chat);
    selectedChatIdRef.current = chat?.id || null;
    setEditingId(null);
    setCtxMenu(null);
    setInfoMsg(null);
    setReplyTo(null);
    setMediaPreview(null);
    connectWebSocket(chat.id, Boolean(chat.is_community));
    setRooms((prev) => prev.map((r) => String(r.id) === String(chat.id) ? { ...r, unreadCount: 0 } : r));
    if (!chat.is_community && chat.other_user?.id && !presenceMap[chat.other_user.id]) fetchPresence(chat.other_user.id);
  }, [connectWebSocket, fetchPresence, presenceMap]);

  const sendMessage = async () => {
    if ((!message.trim() && !mediaPreview) || !socketRef.current || !isConnected) return;

    let mediaUrl = null;
    let mediaType = null;

    if (mediaPreview) {
      setUploadingMedia(true);
      try {
        const formData = new FormData();
        formData.append("file", mediaPreview.file);
        const res = await fetch(`${API_HOST}/chat/upload/`, {
          method: "POST",
          headers: { Authorization: `Token ${getToken()}` },
          body: formData,
        });
        if (res.ok) {
          const d = await res.json();
          mediaUrl = d.media_url;
          mediaType = d.media_type;
        } else {
          setUploadingMedia(false);
          return;
        }
      } catch (_) {
        setUploadingMedia(false);
        return;
      }
      setUploadingMedia(false);
    }

    const payload = { action: "send_message", room_id: selectedChat?.id, message: message.trim() };
    if (replyTo) payload.reply_to_id = replyTo.id;
    if (mediaUrl) { payload.media_url = mediaUrl; payload.media_type = mediaType; }

    socketRef.current.send(JSON.stringify(payload));
    setMessage("");
    setReplyTo(null);
    if (mediaPreview?.url) URL.revokeObjectURL(mediaPreview.url);
    setMediaPreview(null);
  };

  const startEdit = (msg) => { setEditingId(msg.id); setEditText(msg.text); setCtxMenu(null); setTimeout(() => editInputRef.current?.focus(), 50); };
  const submitEdit = () => {
    if (!editText.trim() || !socketRef.current || !isConnected) return;
    socketRef.current.send(JSON.stringify({ action: "edit_message", message_id: editingId, message: editText.trim() }));
    setEditingId(null); setEditText("");
  };
  const deleteMessage = (msgId) => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.send(JSON.stringify({ action: "delete_message", message_id: msgId }));
    setCtxMenu(null);
  };

  const openCtxMenu = (e, msg) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, msg }); };
  const onTouchStart = (e, msg) => {
    longPressTimer.current = setTimeout(() => { const t = e.touches[0]; setCtxMenu({ x: t.clientX, y: t.clientY, msg }); }, 500);
  };
  const cancelLongPress = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) return;
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File too large. Max ${isVideo ? "50 MB for videos" : "10 MB for images/GIFs"}.`);
      e.target.value = "";
      return;
    }
    const type = isVideo ? "video" : (file.type === "image/gif" ? "gif" : "image");
    const url = URL.createObjectURL(file);
    setMediaPreview({ file, url, type });
    e.target.value = "";
  };

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const mediaItem = items.find(item => item.type.startsWith("image/") || item.type.startsWith("video/"));
    if (!mediaItem) return;
    e.preventDefault();
    const file = mediaItem.getAsFile();
    if (!file) return;
    const isVideo = mediaItem.type.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File too large. Max ${isVideo ? "50 MB for videos" : "10 MB for images/GIFs"}.`);
      return;
    }
    const type = isVideo ? "video" : (mediaItem.type === "image/gif" ? "gif" : "image");
    setMediaPreview({ file, url: URL.createObjectURL(file), type });
  };

  const buildMenuItems = (msg) => {
    const own = isOwnMessage(msg);
    const canModify = canModifyMessage(msg);
    const items = [];
    items.push({ label: "Reply", icon: <CornerUpLeft className="w-3.5 h-3.5" />, action: () => { setReplyTo(msg); setTimeout(() => inputRef.current?.focus(), 50); } });
    if (own && !selectedChat?.is_community) items.push({ label: "Message Info", icon: <Info className="w-3.5 h-3.5" />, action: () => setInfoMsg(msg) });
    if (msg.text) items.push({ label: "Copy", icon: <Copy className="w-3.5 h-3.5" />, action: () => navigator.clipboard?.writeText(msg.text).catch(() => {}) });
    if (canModify && own && msg.text) items.push({ label: "Edit", icon: <Pencil className="w-3.5 h-3.5" />, action: () => startEdit(msg) });
    if (canModify) items.push({ label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, action: () => deleteMessage(msg.id) });
    return items;
  };

  const getSortedRooms = () => { const f = rooms.filter((r) => !r.is_community); return communityRoom ? [communityRoom, ...f] : f; };
  const otherUserId   = selectedChat?.other_user?.id;
  const otherPresence = otherUserId ? presenceMap[String(otherUserId)] : null;

  const presenceLabel = () => {
    if (!selectedChat) return "";
    if (selectedChat.is_community) return isConnected ? "Connected" : "Connecting…";
    if (!isConnected) return "Connecting…";
    if (otherPresence?.is_online) return "Online";
    if (otherPresence?.last_seen) return `Last seen ${fmtLastSeen(otherPresence.last_seen)}`;
    return "Connected";
  };
  const presenceDotColor = () => {
    if (!isConnected) return "bg-yellow-400 animate-pulse";
    if (!selectedChat?.is_community && otherPresence?.is_online) return "bg-emerald-500";
    if (!selectedChat?.is_community && otherPresence && !otherPresence.is_online) return "bg-gray-300";
    return "bg-emerald-500";
  };

  const isOwnMessage = (msg) => {
    if (!currentUser) return false;
    return String(msg.sender?.id) === String(currentUser.id) || msg.sender?.username === currentUser.username || (msg.sender_id && String(msg.sender_id) === String(currentUser.id));
  };
  const canModifyMessage = (msg) => {
    if (!currentUser) return false;
    if (isOwnMessage(msg)) return true;
    const role = currentUser.role || "";
    return role === "Admin" || role === "Staff" || currentUser.is_staff;
  };

  const token = getToken();
  if (!token) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-bold text-gray-800 mb-1">Authentication Required</h2>
        <p className="text-sm text-gray-500">Please log in to access chat.</p>
      </div>
    </div>
  );

  return (
    <div className="fixed left-0 right-0 top-14 bottom-0 overflow-hidden bg-gray-50" onContextMenu={(e) => e.preventDefault()}>

      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={buildMenuItems(ctxMenu.msg)} onClose={() => setCtxMenu(null)} />}

      {showAgreement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" className="bg-white w-full sm:max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Chat Usage Agreement</h2>
              <p className="text-gray-400 text-sm mt-0.5">Please read before continuing</p>
            </div>
            <div className="px-6 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
                <Eye className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Messages Are Monitored</p>
                  <p className="text-emerald-700 text-xs mt-1">All messages are monitored by Administrators for safety and compliance.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-3">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Data Disclaimer</p>
                  <p className="text-red-700 text-xs mt-1">In case any issues arise, we are not responsible for your data, content, or any consequences from using this chat.</p>
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1.5 px-1 mt-2">
                {["Your messages may be reviewed by administrators", "You are responsible for the content you share", "Use the chat responsibly and respectfully"].map((t) => (
                  <li key={t} className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => window.history.back()} className="px-4 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-semibold">Decline</button>
              <button onClick={handleAcceptAgreement} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-sm font-semibold shadow-sm">I Agree & Continue</button>
            </div>
          </div>
        </div>
      )}

      {infoMsg && <MessageInfoPanel msg={infoMsg} isCommunity={selectedChat?.is_community} onClose={() => setInfoMsg(null)} />}

      <div className="flex h-full w-full lg:max-w-5xl mx-auto lg:border-x border-gray-200 bg-white overflow-hidden">

        {/* Sidebar */}
        <div className={`${selectedChat ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-80 lg:border-r border-gray-200 min-h-0`}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h1 className="text-base font-bold text-gray-900">Messages</h1>
            <button onClick={() => setShowSearch(!showSearch)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition ${showSearch ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showSearch && (
            <div className="px-4 py-3 border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search people…" value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); searchUsers(e.target.value); }}
                  className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              {searchResults.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden max-h-48 overflow-y-auto">
                  {searchResults.map((u) => (
                    <div key={u.id} onClick={() => createRoom(u.id)}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                      <div className="relative">
                        <Avatar src={u.profile_photo} name={u.first_name || u.username} gender={u.gender} size={9} />
                        {presenceMap[u.id]?.is_online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchQuery && searchResults.length === 0 && <p className="text-center text-gray-400 text-sm py-3">No users found</p>}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="flex justify-center items-center py-10"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
            ) : getSortedRooms().length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No conversations yet</p>
                <p className="text-gray-300 text-xs mt-1">Tap + to start one</p>
              </div>
            ) : (
              getSortedRooms().map((chat) => {
                const otherUser    = chat.other_user;
                const roomPresence = otherUser ? presenceMap[String(otherUser.id)] : null;
                const isOnline     = !chat.is_community && !!roomPresence?.is_online;
                const lastTime     = chat.lastMessageTime || chat.last_message_time || chat.last_message?.timestamp;
                const isMySentMsg  = currentUser && String(chat.lastMessageSenderId) === String(currentUser.id);
                return (
                  <div key={chat.id} onClick={() => selectChat(chat)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition group relative ${selectedChat?.id === chat.id ? "bg-emerald-50" : ""}`}>
                    <div className="relative">
                      <Avatar src={chat.avatar || otherUser?.profile_photo} name={chat.name} gender={otherUser?.gender} size={12} isCommunity={chat.is_community} />
                      {isOnline && <span title="Online" className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className={`text-sm font-semibold truncate ${chat.is_community ? "text-indigo-800" : "text-gray-900"}`}>{chat.name}</p>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{fmtTime(lastTime)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 min-w-0">
                        {isMySentMsg && !chat.is_community
                          ? <SidebarStatusIcon status={chat.lastMessageStatus} />
                          : (isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />)
                        }
                        <span className="text-xs text-gray-400 truncate">
                          {chat.is_community ? "Community · All members" : (chat.lastMessage || chat.last_message?.text || "No messages yet")}
                        </span>
                      </div>
                    </div>
                    {!chat.is_community && (
                      <button onClick={(e) => { e.stopPropagation(); setRoomToDelete(chat); setShowDeleteModal(true); }}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 transition flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {chat.unreadCount > 0 && (
                      <div className="w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">{chat.unreadCount}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat window */}
        <div className={`${selectedChat ? "flex" : "hidden lg:flex"} flex-1 flex-col min-h-0 min-w-0`}>
          {selectedChat ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
                <button onClick={() => { setSelectedChat(null); closeSocket(); setMessages([]); setIsConnected(false); }}
                  className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="relative">
                  <Avatar src={selectedChat.avatar || selectedChat.other_user?.profile_photo} name={selectedChat.name} gender={selectedChat.other_user?.gender} size={9} isCommunity={selectedChat.is_community} />
                  {!selectedChat.is_community && otherPresence?.is_online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${selectedChat.is_community ? "text-indigo-800" : "text-gray-900"}`}>{selectedChat.name}</p>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${presenceDotColor()}`} />
                    <p className="text-xs text-gray-400">{presenceLabel()}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 bg-gray-50 space-y-1.5" onClick={() => setCtxMenu(null)}>
                {!isConnected && messages.length === 0 && (
                  <div className="flex justify-center">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-xl flex items-center gap-2 text-sm">
                      <div className="w-3.5 h-3.5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                      Connecting…
                      <button onClick={() => connectWebSocket(selectedChat.id, Boolean(selectedChat.is_community))} className="underline text-yellow-800 font-medium">Retry</button>
                    </div>
                  </div>
                )}
                {messages.length === 0 && isConnected && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">{selectedChat.is_community ? "Be first to say hello!" : "Start the conversation!"}</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const own       = isOwnMessage(msg);
                  const isEditing = editingId === msg.id;
                  return (
                    <div key={msg.id} className={`flex ${own ? "justify-end" : "justify-start"} group`}>
                      {!own && !selectedChat.is_community && (
                        <div className="mr-2 mt-auto mb-1">
                          <Avatar src={msg.sender?.profile_photo} name={msg.sender?.first_name || msg.sender?.username} gender={msg.sender?.gender} size={7} />
                        </div>
                      )}
                      <div className={`max-w-[72%] ${own ? "items-end" : "items-start"} flex flex-col`}>
                        {!own && selectedChat.is_community && msg.sender && (
                          <p className="text-xs text-gray-400 mb-1 px-1">{msg.sender.first_name} {msg.sender.last_name}</p>
                        )}
                        <div className="relative">
                          {isEditing ? (
                            <div className="flex items-center gap-2 bg-white border border-emerald-300 rounded-2xl px-3 py-2 shadow-sm">
                              <input ref={editInputRef} value={editText} onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") submitEdit(); if (e.key === "Escape") setEditingId(null); }}
                                className="text-sm text-gray-800 bg-transparent focus:outline-none flex-1 min-w-[120px]" />
                              <button onClick={submitEdit} className="text-emerald-600 hover:text-emerald-700 transition"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 transition"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <div
                              className={`px-3 py-2.5 rounded-2xl text-sm select-text cursor-default ${own ? (selectedChat.is_community ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-emerald-600 text-white rounded-tr-sm") : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-sm"}`}
                              onContextMenu={(e) => openCtxMenu(e, msg)}
                              onTouchStart={(e) => onTouchStart(e, msg)}
                              onTouchEnd={cancelLongPress}
                              onTouchMove={cancelLongPress}
                            >
                              {msg.reply_to && (
                                <div className={`mb-2 px-2.5 py-1.5 rounded-xl border-l-[3px] text-xs ${own ? "bg-black/20 border-white/70" : "bg-gray-50 border-emerald-400"}`}>
                                  <p className={`font-semibold truncate ${own ? "text-white/80" : "text-emerald-700"}`}>{msg.reply_to.sender_name}</p>
                                  <p className={`truncate mt-0.5 ${own ? "text-white/60" : "text-gray-500"}`}>
                                    {msg.reply_to.text || (msg.reply_to.media_type ? `[${msg.reply_to.media_type}]` : "[media]")}
                                  </p>
                                </div>
                              )}
                              {msg.media && (
                                <div className="mb-1.5 overflow-hidden rounded-xl">
                                  {msg.media_type === "video" ? (
                                    <video src={msg.media} controls className="max-w-full rounded-xl" style={{ maxHeight: 220 }} />
                                  ) : (
                                    <img src={msg.media} alt="media" className="max-w-full rounded-xl object-cover cursor-pointer"
                                      style={{ maxHeight: 220 }} onClick={() => window.open(msg.media, "_blank")} />
                                  )}
                                </div>
                              )}
                              {msg.text && <p className="break-words">{renderTextWithLinks(msg.text, own)}</p>}
                              {msg.edited && <span className={`text-[10px] italic ${own ? "text-white/50" : "text-gray-400"}`}> · edited</span>}
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className={`text-xs ${own ? "text-white/60" : "text-gray-400"}`}>{msg.time}</span>
                                {own && <StatusIcon status={msg.status} isCommunity={selectedChat.is_community} />}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-100 bg-white flex-shrink-0">
                {replyTo && (
                  <div className="px-3 pt-2 flex items-start gap-2">
                    <div className={`flex-1 border-l-[3px] px-2.5 py-1.5 rounded-r-lg bg-gray-50 ${selectedChat.is_community ? "border-indigo-400" : "border-emerald-500"}`}>
                      <p className={`text-xs font-semibold truncate ${selectedChat.is_community ? "text-indigo-700" : "text-emerald-700"}`}>
                        {replyTo.sender?.first_name || replyTo.sender?.username || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {replyTo.text || (replyTo.media_type ? `[${replyTo.media_type}]` : "[media]")}
                      </p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="p-1 mt-0.5 text-gray-400 hover:text-gray-600 transition flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {mediaPreview && (
                  <div className="px-3 pt-2">
                    <div className="relative inline-block">
                      {mediaPreview.type === "video" ? (
                        <video src={mediaPreview.url} className="h-20 rounded-xl object-cover" />
                      ) : (
                        <img src={mediaPreview.url} alt="preview" className="h-20 rounded-xl object-cover" />
                      )}
                      <button onClick={() => { URL.revokeObjectURL(mediaPreview.url); setMediaPreview(null); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="px-3 sm:px-4 py-2 sm:py-3">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 sm:px-4 py-2">
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={!isConnected}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition disabled:opacity-40">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input type="text"
                      ref={inputRef}
                      placeholder={selectedChat.is_community ? "Message the community…" : "Message…"}
                      value={message} onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      onPaste={handlePaste}
                      disabled={!isConnected}
                      className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none" />
                    <button onClick={sendMessage} disabled={(!message.trim() && !mediaPreview) || !isConnected || uploadingMedia}
                      className={`w-8 h-8 flex items-center justify-center rounded-xl transition disabled:opacity-40 ${selectedChat.is_community ? "text-indigo-600 hover:bg-indigo-50" : "text-emerald-600 hover:bg-emerald-50"}`}>
                      {uploadingMedia
                        ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Your messages</h2>
                <p className="text-sm text-gray-400 mt-1">Select a conversation or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-500" /></div>
              <div><h3 className="text-base font-bold text-gray-900">Delete Chat</h3><p className="text-xs text-gray-400">This cannot be undone</p></div>
            </div>
            <p className="text-sm text-gray-600 mb-5">Delete your chat with <span className="font-semibold">{roomToDelete?.name}</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setRoomToDelete(null); }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={() => deleteRoom(roomToDelete?.id)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
