import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Send, ArrowLeft, Plus, Users, MessageSquare,
  Trash2, Globe, Eye, AlertTriangle, Check, CheckCheck,
  Clock, Pencil, X, MoreVertical, Info,
} from "lucide-react";
import { getMediaUrl } from "../../../config/api";
import { getProfilePlaceholderByGender } from "../../../lib/profilePlaceholders";

const API_HOST = "https://api.karpagamalumni.in";
const WS_HOST  = "api.karpagamalumni.in";

const getToken = () => localStorage.getItem("Token");
const authH    = () => ({ Authorization: `Token ${getToken()}`, "Content-Type": "application/json" });

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtTime = (ts) => {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
};

const fmtDateTime = (ts) => {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
};

const fmtLastSeen = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const photoUrl = (photoPath) => getMediaUrl(photoPath);

// ── Message Status Icon ───────────────────────────────────────────────────────

const StatusIcon = ({ status, isCommunity }) => {
  if (isCommunity) return null;
  if (status === "seen")
    return <CheckCheck className="w-3.5 h-3.5 text-sky-300 inline-block ml-1" aria-label="Seen" />;
  if (status === "delivered")
    return <CheckCheck className="w-3.5 h-3.5 text-white/50 inline-block ml-1" aria-label="Delivered" />;
  if (status === "sent")
    return <Check className="w-3.5 h-3.5 text-white/50 inline-block ml-1" aria-label="Sent" />;
  return <Clock className="w-3 h-3 text-white/40 inline-block ml-1" aria-label="Pending" />;
};

// ── Avatar ────────────────────────────────────────────────────────────────────

const Avatar = ({ src, name, gender, size = 10, isCommunity = false }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const cls = `w-${size} h-${size} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0`;
  if (isCommunity)
    return (
      <div className={`${cls} bg-gradient-to-br from-indigo-500 to-violet-600`}>
        <Globe className="w-5 h-5 text-white" />
      </div>
    );

  const resolvedSrc = !imgError && src ? photoUrl(src) : getProfilePlaceholderByGender(gender);
  return (
    <img
      src={resolvedSrc}
      alt={name || "User"}
      className={`${cls} object-cover`}
      onError={() => setImgError(true)}
    />
  );
};

// ── Message Info Panel ────────────────────────────────────────────────────────

const MessageInfoPanel = ({ msg, onClose }) => {
  if (!msg) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Message Info</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-700 break-words">
            {msg.text}
          </div>
          <div className="space-y-2 text-sm">
            <Row icon={<Clock className="w-3.5 h-3.5 text-gray-400" />} label="Sent" value={fmtDateTime(msg.timestamp)} />
            <Row
              icon={<CheckCheck className="w-3.5 h-3.5 text-gray-400" />}
              label="Delivered"
              value={msg.delivered_at ? fmtDateTime(msg.delivered_at) : "—"}
            />
            <Row
              icon={<CheckCheck className="w-3.5 h-3.5 text-sky-400" />}
              label="Seen"
              value={msg.seen_at ? fmtDateTime(msg.seen_at) : "—"}
            />
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

// ── Main Component ────────────────────────────────────────────────────────────

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

  // Presence: map of userId → { is_online, last_seen }
  const [presenceMap, setPresenceMap]   = useState({});

  // Edit state
  const [editingId, setEditingId]       = useState(null);
  const [editText, setEditText]         = useState("");

  // Message context menu
  const [menuMsgId, setMenuMsgId]       = useState(null);

  // Message info modal
  const [infoMsg, setInfoMsg]           = useState(null);

  const messagesEndRef = useRef(null);
  const socketRef      = useRef(null);  // per-room socket
  const globalSocketRef = useRef(null); // long-lived global socket (rooms list, presence, notifications)
  const inputRef       = useRef(null);
  const selectedChatIdRef = useRef(null);
  const currentUserIdRef = useRef(null);

  // Keep the currentUser id available inside the WS message handler
  useEffect(() => {
    currentUserIdRef.current = currentUser?.id || null;
  }, [currentUser]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // ── Agreement ──────────────────────────────────────────────────────────────
  const handleAcceptAgreement = () => {
    localStorage.setItem("chat_agreement_accepted", "true");
    setShowAgreement(false);
  };

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    connectGlobalSocket();
    return () => { closeSocket(); closeGlobalSocket(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeSocket = () => {
    const ws = socketRef.current;
    if (ws) {
      try {
        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
        ws.close();
      } catch (_) {}
      socketRef.current = null;
    }
  };

  const closeGlobalSocket = () => {
    const ws = globalSocketRef.current;
    if (ws) {
      try {
        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
        ws.close();
      } catch (_) {}
      globalSocketRef.current = null;
    }
  };

  // ── Global WebSocket: rooms list + presence + notifications ────────────────
  const connectGlobalSocket = () => {
    const token = getToken();
    if (!token) return;
    closeGlobalSocket();

    const wsUrl = `wss://${WS_HOST}/ws/chat/?token=${encodeURIComponent(token)}`;
    let ws;
    try { ws = new WebSocket(wsUrl); } catch { restBootstrapFallback(); return; }
    globalSocketRef.current = ws;

    ws.onopen = () => {
      try { ws.send(JSON.stringify({ action: "bootstrap" })); } catch (_) {}
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.action === "bootstrap") {
          if (Array.isArray(data.rooms)) setRooms(data.rooms);
          if (data.community?.id) {
            setCommunityRoom({ ...data.community, is_community: true, name: "Community Chat" });
          }
          if (data.presence && typeof data.presence === "object") {
            setPresenceMap((prev) => ({ ...prev, ...data.presence }));
          }
          if (data.me) setCurrentUser(data.me);
          return;
        }

        if (data.action === "room_update") {
          setRooms((prev) => {
            const idx = prev.findIndex((r) => String(r.id) === String(data.room_id));
            if (idx === -1) {
              // Room not in list yet — refetch in the background to grab it
              loadRooms();
              return prev;
            }
            const isOpen = String(selectedChatIdRef.current) === String(data.room_id);
            const fromSelf = String(data.sender_id) === String(currentUserIdRef.current);
            const updated = prev.map((r, i) =>
              i === idx
                ? {
                    ...r,
                    lastMessage: data.last_message ?? r.lastMessage,
                    lastMessageTime: data.last_message_time ?? r.lastMessageTime,
                    unreadCount: isOpen || fromSelf
                      ? 0
                      : (r.unreadCount || 0) + 1,
                  }
                : r
            );
            updated.sort((a, b) =>
              new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
            );
            return updated;
          });
          return;
        }

        if (data.action === "room_created" && data.room?.id) {
          setRooms((prev) =>
            prev.some((r) => String(r.id) === String(data.room.id))
              ? prev
              : [data.room, ...prev]
          );
          return;
        }

        // Presence: accept both action and bare type form. Normalise key to string.
        if ((data.action === "presence_update" || data.type === "presence_update") && data.user_id != null) {
          const key = String(data.user_id);
          setPresenceMap((prev) => ({
            ...prev,
            [key]: {
              ...(prev[key] || {}),
              is_online: !!data.is_online,
              last_seen: data.last_seen ?? prev[key]?.last_seen ?? null,
            },
          }));
          return;
        }

        if (data.action === "incoming_message") {
          // The per-room socket (if open for this room) handles the actual
          // message render via "chat_message". This branch is a safety net
          // for when the user is NOT in the room — just nudge the rooms list
          // refresh so the unread count picks it up even if room_update was
          // delayed or lost.
          if (data.room_id && String(selectedChatIdRef.current) !== String(data.room_id)) {
            setRooms((prev) => prev.map((r) =>
              String(r.id) === String(data.room_id)
                ? { ...r, unreadCount: (r.unreadCount || 0) + 1 }
                : r
            ));
          }
          return;
        }
      } catch (_) {}
    };

    ws.onerror = () => { restBootstrapFallback(); };
    ws.onclose = (e) => {
      // Fall back to REST if WS isn't reachable; reconnect on transient drops
      if (e.code === 1006 || !e.wasClean) {
        restBootstrapFallback();
        setTimeout(() => { if (!globalSocketRef.current) connectGlobalSocket(); }, 4000);
      }
    };
  };

  // ── REST fallback (only used if WS is unavailable) ─────────────────────────
  const restBootstrapFallback = () => {
    loadRooms();
    getCurrentUser();
    loadCommunityChat();
  };

  // ── API helpers ────────────────────────────────────────────────────────────
  const getCurrentUser = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const r = await fetch(`${API_HOST}/chat/user/me/`, { headers: authH() });
      if (r.ok) { setCurrentUser(await r.json()); return; }
    } catch (_) {}
    // fallback to alumni profile endpoint
    try {
      const r = await fetch(`${API_HOST}/api/v1/user/me/`, { headers: authH() });
      if (r.ok) setCurrentUser(await r.json());
    } catch (_) {}
  };

  const loadRooms = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_HOST}/chat/rooms/`, { headers: authH() });
      if (r.ok) setRooms(await r.json());
    } catch (_) {} finally { setLoading(false); }
  };

  const loadCommunityChat = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const r = await fetch(`${API_HOST}/chat/community/`, { headers: authH() });
      if (r.ok) {
        const data = await r.json();
        if (data?.id) setCommunityRoom({ ...data, is_community: true, name: "Community Chat" });
      }
    } catch (_) {}
  };

  const searchUsers = async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const r = await fetch(`${API_HOST}/chat/search/?q=${encodeURIComponent(q)}`, { headers: authH() });
      if (r.ok) setSearchResults(await r.json());
    } catch (_) {}
  };

  const createRoom = async (userId) => {
    try {
      const r = await fetch(`${API_HOST}/chat/rooms/`, {
        method: "POST", headers: authH(),
        body: JSON.stringify({ target_user_id: userId }),
      });
      if (r.ok) {
        const room = await r.json();
        setRooms((prev) => [room, ...prev.filter((x) => x.id !== room.id)]);
        selectChat(room);
        setShowSearch(false); setSearchQuery(""); setSearchResults([]);
      }
    } catch (_) {}
  };

  const deleteRoom = async (roomId) => {
    try {
      const r = await fetch(
        `${API_HOST}/chat/rooms/?room_id=${encodeURIComponent(roomId)}`,
        { method: "DELETE", headers: authH() }
      );
      if (r.ok) {
        setRooms((prev) => prev.filter((x) => x.id !== roomId));
        if (selectedChat?.id === roomId) {
          setSelectedChat(null); closeSocket(); setMessages([]); setIsConnected(false);
        }
        setShowDeleteModal(false); setRoomToDelete(null);
      }
    } catch (_) {}
  };

  const loadMessagesHTTP = async (roomId) => {
    try {
      const r = await fetch(`${API_HOST}/chat/rooms/${encodeURIComponent(roomId)}/messages/`, { headers: authH() });
      if (r.ok) {
        const msgs = await r.json();
        setMessages(msgs.map((m) => ({
          ...m,
          time: m.time || fmtTime(m.timestamp) || fmtTime(m.delivered_at) || "",
        })));
      }
    } catch (_) {}
  };

  const markSeen = useCallback(async (roomId, upToMsgId, isCommunity = false) => {
    if (!roomId && !isCommunity) return;
    const endpoints = isCommunity
      ? [`${API_HOST}/chat/community/seen/`]
      : [`${API_HOST}/chat/rooms/${roomId}/seen/`];

    for (const endpoint of endpoints) {
      try {
        const r = await fetch(endpoint, {
          method: "POST",
          headers: authH(),
          body: JSON.stringify(upToMsgId ? { message_id: upToMsgId } : {}),
        });
        if (r.ok) return;
      } catch (_) {}
    }
  }, []);

  // Fetch presence for a single user — stable, no deps on presenceMap
  const fetchPresence = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const r = await fetch(`${API_HOST}/chat/presence/${userId}/`, { headers: authH() });
      if (r.ok) {
        const data = await r.json();
        setPresenceMap((prev) => ({ ...prev, [userId]: data }));
      }
    } catch (_) {}
  }, []);

  // Presence is delivered via the global WS bootstrap + presence_update pushes.
  // REST fetchPresence is kept only as a per-user fallback (e.g. opening a chat
  // before the bootstrap arrived).

  // ── WebSocket ──────────────────────────────────────────────────────────────
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

        // History batch
        if (data.action === "message_history" && Array.isArray(data.messages)) {
          const normalized = data.messages.map((m) => ({
            ...m,
            time: m.time || fmtTime(m.timestamp) || fmtTime(m.delivered_at) || "",
          }));
          setMessages(normalized);
          const lastMsg = normalized[normalized.length - 1];
          if (lastMsg) markSeen(roomId, lastMsg.id, isCommunity);
          return;
        }

        // New incoming message
        if (data.action === "new_message" || data.type === "chat_message" || data.action === "chat_message") {
          const newMsg = {
            id: data.message_id || data.id || crypto.randomUUID(),
            text: data.message || data.text || "",
            sender: data.sender
              ? typeof data.sender === "string" ? { username: data.sender } : data.sender
              : null,
            time: fmtTime(data.timestamp) || new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
            timestamp: data.timestamp || new Date().toISOString(),
            status: data.status || "sent",
            delivered_at: data.delivered_at || null,
            seen_at: data.seen_at || null,
            sender_id: data.sender_id || data.sender?.id || null,
          };
          setMessages((prev) => [...prev, newMsg]);
          markSeen(roomId, newMsg.id, isCommunity);
          setRooms((prev) => {
            const updated = prev.map((r) =>
              String(r.id) === String(roomId)
                ? { ...r, lastMessage: newMsg.text, lastMessageTime: newMsg.timestamp, unreadCount: 0 }
                : r
            );
            updated.sort((a, b) =>
              new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
            );
            return updated;
          });
          return;
        }

        // Status update (sent → delivered → seen)
        if (data.action === "status_update" && Array.isArray(data.message_ids)) {
          setMessages((prev) => prev.map((m) =>
            data.message_ids.includes(String(m.id))
              ? {
                  ...m,
                  status: data.status,
                  delivered_at: data.delivered_at || m.delivered_at,
                  seen_at: data.seen_at || m.seen_at,
                }
              : m
          ));
          return;
        }

        // Presence update
        if (data.action === "presence_update") {
          setPresenceMap((prev) => ({
            ...prev,
            [data.user_id]: { is_online: data.is_online, last_seen: data.last_seen },
          }));
          return;
        }

        // Message deleted
        if (data.action === "message_deleted") {
          setMessages((prev) => prev.filter((m) => String(m.id) !== String(data.message_id)));
          return;
        }

        // Message edited
        if (data.action === "message_edited") {
          setMessages((prev) => prev.map((m) =>
            String(m.id) === String(data.message_id)
              ? { ...m, text: data.new_text, edited: true }
              : m
          ));
          return;
        }

      } catch (_) {}
    };

    ws.onerror = () => { setIsConnected(false); loadMessagesHTTP(roomId); };
    ws.onclose = (e) => {
      setIsConnected(false);
      if (e.code === 1006 || !e.wasClean) loadMessagesHTTP(roomId);
    };
  }, [markSeen]);

  const selectChat = useCallback((chat) => {
    setSelectedChat(chat);
    selectedChatIdRef.current = chat?.id || null;
    setEditingId(null);
    setMenuMsgId(null);
    setInfoMsg(null);
    connectWebSocket(chat.id, Boolean(chat.is_community));
    // Opening a room means we've read it — clear its unread badge locally
    setRooms((prev) => prev.map((r) =>
      String(r.id) === String(chat.id) ? { ...r, unreadCount: 0 } : r
    ));
    if (!chat.is_community && chat.other_user?.id && !presenceMap[chat.other_user.id]) {
      fetchPresence(chat.other_user.id);
    }
  }, [connectWebSocket, fetchPresence, presenceMap]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!message.trim() || !socketRef.current || !isConnected) return;
    socketRef.current.send(JSON.stringify({
      action: "send_message",
      room_id: selectedChat?.id,
      message: message.trim(),
    }));
    setMessage("");
  };

  // ── Edit / Delete via WS ───────────────────────────────────────────────────
  const startEdit = (msg) => {
    setEditingId(msg.id);
    setEditText(msg.text);
    setMenuMsgId(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submitEdit = () => {
    if (!editText.trim() || !socketRef.current || !isConnected) return;
    socketRef.current.send(JSON.stringify({
      action: "edit_message",
      message_id: editingId,
      message: editText.trim(),
    }));
    setEditingId(null);
    setEditText("");
  };

  const deleteMessage = (msgId) => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.send(JSON.stringify({
      action: "delete_message",
      message_id: msgId,
    }));
    setMenuMsgId(null);
  };

  // ── Room list ──────────────────────────────────────────────────────────────
  const getSortedRooms = () => {
    const filtered = rooms.filter((r) => !r.is_community);
    return communityRoom ? [communityRoom, ...filtered] : filtered;
  };

  // Presence for active chat header
  const otherUserId   = selectedChat?.other_user?.id;
  const otherPresence = otherUserId ? presenceMap[String(otherUserId)] : null;

  const presenceLabel = () => {
    if (!selectedChat) return "";
    if (selectedChat.is_community) return isConnected ? "Connected" : "Connecting…";
    if (!isConnected) return "Connecting…";
    if (otherPresence?.is_online) return "Online";
    if (otherPresence?.last_seen) return `Last seen ${fmtLastSeen(otherPresence.last_seen)}`;
    // presence fetch not resolved yet — show generic connected
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
    return (
      String(msg.sender?.id) === String(currentUser.id) ||
      msg.sender?.username === currentUser.username ||
      (msg.sender_id && String(msg.sender_id) === String(currentUser.id))
    );
  };

  const canModifyMessage = (msg) => {
    if (!currentUser) return false;
    if (isOwnMessage(msg)) return true;
    const role = currentUser.role || "";
    return role === "Admin" || role === "Staff" || currentUser.is_staff;
  };

  const token = getToken();
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-1">Authentication Required</h2>
          <p className="text-sm text-gray-500">Please log in to access chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-[calc(100dvh-56px-56px)] lg:h-[calc(100dvh-56px)] overflow-hidden">

      {/* ── Agreement modal ── */}
      {showAgreement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="chat-agree-title"
            className="bg-white w-full sm:max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 id="chat-agree-title" className="text-base font-bold text-gray-900">Chat Usage Agreement</h2>
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
                  <p className="text-red-700 text-xs mt-1">
                    In case any issues arise during the use of the portal's chat feature, we are not responsible for your data, content, or any consequences arising from the use of this chat service.
                  </p>
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1.5 px-1 mt-2">
                {[
                  "Your messages may be reviewed by administrators",
                  "You are responsible for the content you share",
                  "We are not liable for data, content, or chat-related consequences",
                  "Use the chat responsibly and respectfully",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => window.history.back()}
                className="px-4 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-semibold">
                Decline
              </button>
              <button onClick={handleAcceptAgreement}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-sm font-semibold shadow-sm">
                I Agree & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Message Info Modal ── */}
      {infoMsg && <MessageInfoPanel msg={infoMsg} onClose={() => setInfoMsg(null)} />}

      <div className="flex h-full w-full lg:max-w-5xl mx-auto lg:border-x border-gray-200 bg-white overflow-hidden">

        {/* ── Left: conversation list ── */}
        <div className={`${selectedChat ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-80 lg:border-r border-gray-200 min-h-0`}>

          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h1 className="text-base font-bold text-gray-900">Messages</h1>
            <button onClick={() => setShowSearch(!showSearch)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition ${showSearch ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* User search */}
          {showSearch && (
            <div className="px-4 py-3 border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" placeholder="Search people…" value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); searchUsers(e.target.value); }}
                  className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden max-h-48 overflow-y-auto">
                  {searchResults.map((u) => (
                    <div key={u.id} onClick={() => createRoom(u.id)}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                      <div className="relative">
                        <Avatar src={u.profile_photo} name={u.first_name || u.username} gender={u.gender} size={9} />
                        {presenceMap[u.id]?.is_online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchQuery && searchResults.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-3">No users found</p>
              )}
            </div>
          )}

          {/* Room list (the only scrollable region on the sidebar) */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              </div>
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
                // last message time: prefer explicit field, fall back to last_message_time from API
                const lastTime = chat.lastMessageTime || chat.last_message_time || chat.last_message?.timestamp;
                return (
                  <div key={chat.id}
                    onClick={() => selectChat(chat)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition group relative ${selectedChat?.id === chat.id ? "bg-emerald-50" : ""}`}
                  >
                    <div className="relative">
                      <Avatar
                        src={chat.avatar || otherUser?.profile_photo}
                        name={chat.name}
                        gender={otherUser?.gender}
                        size={12}
                        isCommunity={chat.is_community}
                      />
                      {isOnline && (
                        <span
                          title="Online"
                          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className={`text-sm font-semibold truncate ${chat.is_community ? "text-indigo-800" : "text-gray-900"}`}>
                          {chat.name}
                        </p>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{fmtTime(lastTime)}</span>
                      </div>
                      <p className="text-xs truncate mt-0.5 flex items-center gap-1">
                        {isOnline && (
                          <span className="text-emerald-600 font-medium">● Online</span>
                        )}
                        <span className="text-gray-400 truncate">
                          {chat.is_community
                            ? "Community · All members"
                            : (chat.lastMessage || chat.last_message?.text || "No messages yet")}
                        </span>
                      </p>
                    </div>

                    {!chat.is_community && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setRoomToDelete(chat); setShowDeleteModal(true); }}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 transition flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {chat.unreadCount > 0 && (
                      <div className="w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: chat window ── */}
        <div className={`${selectedChat ? "flex" : "hidden lg:flex"} flex-1 flex-col min-h-0 min-w-0`}>
          {selectedChat ? (
            <>
              {/* Chat top bar (sticky-feel: stays put while messages scroll) */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
                <button onClick={() => { setSelectedChat(null); closeSocket(); setMessages([]); setIsConnected(false); }}
                  className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="relative">
                  <Avatar
                    src={selectedChat.avatar || selectedChat.other_user?.profile_photo}
                    name={selectedChat.name}
                    gender={selectedChat.other_user?.gender}
                    size={9}
                    isCommunity={selectedChat.is_community}
                  />
                  {!selectedChat.is_community && otherPresence?.is_online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${selectedChat.is_community ? "text-indigo-800" : "text-gray-900"}`}>
                    {selectedChat.name}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${presenceDotColor()}`} />
                    <p className="text-xs text-gray-400">{presenceLabel()}</p>
                  </div>
                </div>
              </div>

              {/* Messages (the only scrollable region in the chat panel) */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 bg-gray-50 space-y-1.5"
                onClick={() => setMenuMsgId(null)}>

                {!isConnected && messages.length === 0 && (
                  <div className="flex justify-center">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-xl flex items-center gap-2 text-sm">
                      <div className="w-3.5 h-3.5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                      Connecting…
                      <button
                        onClick={() => connectWebSocket(selectedChat.id, Boolean(selectedChat.is_community))}
                        className="underline text-yellow-800 font-medium"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}

                {messages.length === 0 && isConnected && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">
                      {selectedChat.is_community ? "Be first to say hello!" : "Start the conversation!"}
                    </p>
                  </div>
                )}

                {messages.map((msg) => {
                  const own       = isOwnMessage(msg);
                  const canModify = canModifyMessage(msg);
                  const isEditing = editingId === msg.id;
                  const showMenu  = menuMsgId === msg.id;

                  return (
                    <div key={msg.id} className={`flex ${own ? "justify-end" : "justify-start"} group`}>
                      {/* Other user avatar — DM only */}
                      {!own && !selectedChat.is_community && (
                        <div className="mr-2 mt-auto mb-1">
                          <Avatar
                            src={msg.sender?.profile_photo}
                            name={msg.sender?.first_name || msg.sender?.username}
                            gender={msg.sender?.gender}
                            size={7}
                          />
                        </div>
                      )}

                      <div className={`max-w-[72%] ${own ? "items-end" : "items-start"} flex flex-col`}>
                        {/* Sender name — community non-own messages */}
                        {!own && selectedChat.is_community && msg.sender && (
                          <p className="text-xs text-gray-400 mb-1 px-1">
                            {msg.sender.first_name} {msg.sender.last_name}
                          </p>
                        )}

                        <div className="relative">
                          {/* Context menu button */}
                          {canModify && !isEditing && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setMenuMsgId(showMenu ? null : msg.id); }}
                              className={`absolute top-1 ${own ? "-left-7" : "-right-7"} opacity-0 group-hover:opacity-100 transition w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-gray-700 z-10`}
                            >
                              <MoreVertical className="w-3 h-3" />
                            </button>
                          )}

                          {/* Context menu */}
                          {showMenu && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute ${own ? "right-0" : "left-0"} top-8 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden w-36`}
                            >
                              {/* Message Info — own DM messages only */}
                              {own && !selectedChat.is_community && (
                                <button
                                  onClick={() => { setInfoMsg(msg); setMenuMsgId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                                >
                                  <Info className="w-3.5 h-3.5" /> Message Info
                                </button>
                              )}
                              {isOwnMessage(msg) && (
                                <button onClick={() => startEdit(msg)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                                  <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                              )}
                              <button onClick={() => deleteMessage(msg.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}

                          {/* Bubble */}
                          {isEditing ? (
                            <div className="flex items-center gap-2 bg-white border border-emerald-300 rounded-2xl px-3 py-2 shadow-sm">
                              <input
                                ref={inputRef}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") submitEdit();
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                                className="text-sm text-gray-800 bg-transparent focus:outline-none flex-1 min-w-[120px]"
                              />
                              <button onClick={submitEdit} className="text-emerald-600 hover:text-emerald-700 transition">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 transition">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                              own
                                ? selectedChat.is_community
                                  ? "bg-indigo-600 text-white rounded-tr-sm"
                                  : "bg-emerald-600 text-white rounded-tr-sm"
                                : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-sm"
                            }`}>
                              <p className="break-words">{msg.text}</p>
                              {msg.edited && (
                                <span className={`text-[10px] italic ${own ? "text-white/50" : "text-gray-400"}`}> · edited</span>
                              )}
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

              {/* Message input (pinned to bottom; never scrolls with messages) */}
              <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-100 bg-white flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 sm:px-4 py-2">
                  <input
                    type="text"
                    placeholder={selectedChat.is_community ? "Message the community…" : "Message…"}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    disabled={!isConnected}
                    className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                  />
                  <button onClick={sendMessage} disabled={!message.trim() || !isConnected}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition disabled:opacity-40 ${
                      selectedChat.is_community ? "text-indigo-600 hover:bg-indigo-50" : "text-emerald-600 hover:bg-emerald-50"
                    }`}>
                    <Send className="w-4 h-4" />
                  </button>
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

      {/* Delete room modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete Chat</h3>
                <p className="text-xs text-gray-400">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Delete your chat with <span className="font-semibold">{roomToDelete?.name}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setRoomToDelete(null); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={() => deleteRoom(roomToDelete?.id)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
