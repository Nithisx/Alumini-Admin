/**
 * ChatStore — rooms, messages, presence, and the two WebSockets.
 *
 * Chat.jsx used to own ~450 lines of socket wiring, REST fallbacks and message
 * reducers. All of it lives here now; the component renders store state and
 * calls store actions.
 *
 * Two sockets, deliberately:
 *   global — one per session. Carries the rooms list, presence, delivery
 *            receipts and incoming-message notifications for EVERY room, so the
 *            sidebar stays live while you're looking at a different chat.
 *   room   — one per open conversation. Carries that room's history + messages.
 *
 * Both go through services/socketService, which owns the URLs. Auth rides the
 * httpOnly cookie the browser attaches to the WS upgrade — no token in the query
 * string (that leaked the credential into proxy/server logs, and broke outright
 * once the stored credential became a JWT rather than a DRF token key).
 *
 * Sockets are self-healing (resilientSocket: heartbeat + backoff reconnect).
 * `onDown` falls back to REST so the UI still updates on a dead socket — the
 * "messages only appear after refresh" class of bug.
 */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import socketService from "../../services/socketService";
import {
  API_CHAT_ME,
  API_CHAT_ROOMS,
  API_CHAT_COMMUNITY,
  API_CHAT_SEARCH,
  API_CHAT_ROOM_MESSAGES,
  API_CHAT_PRESENCE,
  API_CHAT_HOST,
} from "../../config/api";
import { getRole } from "../../lib/authToken";

const ADMIN_ROOMS_URL = `${API_CHAT_HOST}/chat/admin/rooms/`;
const UPLOAD_URL = `${API_CHAT_HOST}/chat/upload/`;
const roomSeenUrl = (roomId) => `${API_CHAT_HOST}/chat/rooms/${roomId}/seen/`;
const COMMUNITY_SEEN_URL = `${API_CHAT_HOST}/chat/community/seen/`;

const fmtTime = (ts) => {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

/** History and live messages arrive in different shapes; render one. */
const normalizeHistory = (m) => ({
  ...m,
  time: m.time || fmtTime(m.timestamp) || fmtTime(m.delivered_at) || "",
});

const normalizeIncoming = (data) => ({
  id: data.message_id || data.id || crypto.randomUUID(),
  text: data.message || data.text || "",
  sender: data.sender
    ? typeof data.sender === "string"
      ? { username: data.sender }
      : data.sender
    : null,
  time:
    fmtTime(data.timestamp) ||
    new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  timestamp: data.timestamp || new Date().toISOString(),
  status: data.status || "sent",
  delivered_at: data.delivered_at || null,
  seen_at: data.seen_at || null,
  sender_id: data.sender_id || data.sender?.id || null,
  reply_to: data.reply_to || null,
  media: data.media || null,
  media_type: data.media_type || null,
  edited: data.edited || false,
});

const byRecency = (a, b) =>
  new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0);

export default class ChatStore {
  rooms = [];
  communityRooms = [];
  allRooms = [];          // admin spectate list
  allRoomsLoading = false;
  messages = [];
  presence = {};
  currentUser = null;
  activeRoomId = null;
  connected = false;
  loading = false;

  _globalSocket = null;
  _roomSocket = null;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, {
      root: false,
      _globalSocket: false,
      _roomSocket: false,
    });
  }

  get isAuthed() {
    return Boolean(getRole());
  }

  get currentUserId() {
    return this.currentUser?.id ?? null;
  }

  // ── Global socket (session-wide) ─────────────────────────────────────────
  connectGlobal() {
    if (!this.isAuthed) return;
    this.disconnectGlobal();
    this._globalSocket = socketService.connectGlobalChat(
      {
        onOpen: () => this._globalSocket?.send({ action: "bootstrap" }),
        onDown: () => this.bootstrapViaRest(), // socket dead → keep UI fresh
        onMessage: (data) => this.handleGlobalMessage(data),
      },
      () => this.isAuthed
    );
  }

  disconnectGlobal() {
    this._globalSocket?.close();
    this._globalSocket = null;
  }

  /** Mobile/laptop sleep and proxy idle-timeouts leave sockets silently dead. */
  reviveSockets() {
    this._globalSocket?.reviveIfNeeded();
    this._roomSocket?.reviveIfNeeded();
  }

  handleGlobalMessage(data) {
    runInAction(() => {
      switch (data.action ?? data.type) {
        case "bootstrap":
          if (Array.isArray(data.rooms)) this.rooms = data.rooms;
          if (Array.isArray(data.communities)) {
            this.communityRooms = data.communities.map((c) => ({ ...c, is_community: true }));
          } else if (data.community?.id) {
            this.communityRooms = [{ ...data.community, is_community: true, name: "Community Chat" }];
          }
          if (data.presence && typeof data.presence === "object") {
            this.presence = { ...this.presence, ...data.presence };
          }
          if (data.me) this.currentUser = data.me;
          break;

        case "room_update": {
          const idx = this.rooms.findIndex((r) => String(r.id) === String(data.room_id));
          if (idx === -1) {
            // A room we don't know about yet — resync rather than drop the event.
            this.loadRooms();
            break;
          }
          const fromSelf = String(data.sender_id) === String(this.currentUserId);
          this.rooms = this.rooms
            .map((r, i) =>
              i === idx
                ? {
                    ...r,
                    lastMessage: data.last_message ?? r.lastMessage,
                    lastMessageTime: data.last_message_time ?? r.lastMessageTime,
                    lastMessageSenderId: data.last_message_sender_id ?? r.lastMessageSenderId,
                    lastMessageStatus: data.last_message_status ?? r.lastMessageStatus,
                    // Our own message can't be unread to us.
                    ...(fromSelf ? { unreadCount: 0 } : {}),
                  }
                : r
            )
            .sort(byRecency);
          break;
        }

        case "room_created":
          if (data.room?.id && !this.rooms.some((r) => String(r.id) === String(data.room.id))) {
            this.rooms = [data.room, ...this.rooms];
          }
          break;

        case "presence_update":
          if (data.user_id != null) {
            const key = String(data.user_id);
            this.presence = {
              ...this.presence,
              [key]: {
                ...(this.presence[key] || {}),
                is_online: !!data.is_online,
                last_seen: data.last_seen ?? this.presence[key]?.last_seen ?? null,
              },
            };
          }
          break;

        case "incoming_message":
          if (data.room_id) {
            // The open room's own socket appends the message; here we only keep
            // the sidebar (preview + unread badge + order) current.
            const isOpen = String(this.activeRoomId) === String(data.room_id);
            this.rooms = this.rooms
              .map((r) =>
                String(r.id) === String(data.room_id)
                  ? {
                      ...r,
                      ...(data.last_message != null ? { lastMessage: data.last_message } : {}),
                      ...(data.last_message_time != null ? { lastMessageTime: data.last_message_time } : {}),
                      ...(data.sender_id != null ? { lastMessageSenderId: data.sender_id } : {}),
                      unreadCount: isOpen ? (r.unreadCount || 0) : (r.unreadCount || 0) + 1,
                    }
                  : r
              )
              .sort(byRecency);
          }
          break;

        case "status_update":
          // Delivery/seen receipts are pushed to the SENDER via their user group,
          // so they arrive on the global socket even for the room that's open.
          if (Array.isArray(data.message_ids)) {
            this.messages = this.messages.map((m) =>
              data.message_ids.map(String).includes(String(m.id))
                ? {
                    ...m,
                    status: data.status,
                    delivered_at: data.delivered_at || m.delivered_at,
                    seen_at: data.seen_at || m.seen_at,
                  }
                : m
            );
            if (data.room_id) {
              this.rooms = this.rooms.map((r) =>
                String(r.id) === String(data.room_id)
                  ? { ...r, lastMessageStatus: data.status }
                  : r
              );
            }
          }
          break;

        default:
          break;
      }
    });
  }

  // ── Room socket (per open conversation) ──────────────────────────────────
  openRoom(roomId, { isCommunity = false, roomName = "" } = {}) {
    if (!this.isAuthed) return;
    this.closeRoom();
    runInAction(() => {
      this.activeRoomId = roomId;
      this.messages = [];
      this.connected = false;
      // Opening a room clears its badge.
      this.rooms = this.rooms.map((r) =>
        String(r.id) === String(roomId) ? { ...r, unreadCount: 0 } : r
      );
    });

    const handlers = {
      onOpen: () => runInAction(() => { this.connected = true; }),
      onDown: () => {
        runInAction(() => { this.connected = false; });
        this.loadMessages(roomId); // REST fallback so history still shows
      },
      onMessage: (data) => this.handleRoomMessage(data, roomId, isCommunity),
    };

    this._roomSocket = isCommunity
      ? socketService.connectCommunity(
          roomName === "Developer Community" ? "developer" : "general",
          handlers,
          () => this.isAuthed
        )
      : socketService.connectRoom(roomId, handlers, () => this.isAuthed);
  }

  closeRoom() {
    this._roomSocket?.close();
    this._roomSocket = null;
    runInAction(() => {
      this.activeRoomId = null;
      this.messages = [];
      this.connected = false;
    });
  }

  handleRoomMessage(data, roomId, isCommunity) {
    const action = data.action ?? data.type;

    if (action === "message_history" && Array.isArray(data.messages)) {
      const normalized = data.messages.map(normalizeHistory);
      runInAction(() => { this.messages = normalized; });
      const last = normalized[normalized.length - 1];
      if (last) this.markSeen(roomId, last.id, isCommunity);
      return;
    }

    if (action === "new_message" || action === "chat_message") {
      const msg = normalizeIncoming(data);
      runInAction(() => {
        this.messages = [...this.messages, msg];
        this.rooms = this.rooms
          .map((r) =>
            String(r.id) === String(roomId)
              ? {
                  ...r,
                  lastMessage: msg.text,
                  lastMessageTime: msg.timestamp,
                  lastMessageSenderId: msg.sender_id || msg.sender?.id,
                  lastMessageStatus: msg.status,
                  unreadCount: 0, // the room is open, so it's read
                }
              : r
          )
          .sort(byRecency);
      });
      this.markSeen(roomId, msg.id, isCommunity);
      return;
    }

    runInAction(() => {
      switch (action) {
        case "status_update":
          if (Array.isArray(data.message_ids)) {
            this.messages = this.messages.map((m) =>
              data.message_ids.map(String).includes(String(m.id))
                ? {
                    ...m,
                    status: data.status,
                    delivered_at: data.delivered_at || m.delivered_at,
                    seen_at: data.seen_at || m.seen_at,
                  }
                : m
            );
          }
          break;

        case "presence_update":
          if (data.user_id != null) {
            this.presence = {
              ...this.presence,
              [String(data.user_id)]: { is_online: data.is_online, last_seen: data.last_seen },
            };
          }
          break;

        case "message_deleted":
          this.messages = this.messages.filter(
            (m) => String(m.id) !== String(data.message_id)
          );
          break;

        case "message_edited":
          this.messages = this.messages.map((m) =>
            String(m.id) === String(data.message_id)
              ? { ...m, text: data.new_text, edited: true }
              : m
          );
          break;

        default:
          break;
      }
    });
  }

  // ── Actions (the room socket carries them; REST is only a fallback) ───────
  /** Uploads the media first if there is any, then sends. → true if it went out. */
  async sendMessage({ text = "", replyToId = null, media = null } = {}) {
    if (!this.activeRoomId) return false;

    let mediaUrl = null;
    let mediaType = null;
    if (media) {
      const uploaded = await this.uploadMedia(media);
      mediaUrl = uploaded.media_url;
      mediaType = uploaded.media_type;
    }

    const payload = {
      action: "send_message",
      room_id: this.activeRoomId,
      message: text.trim(),
    };
    if (replyToId) payload.reply_to_id = replyToId;
    if (mediaUrl) {
      payload.media_url = mediaUrl;
      payload.media_type = mediaType;
    }

    return Boolean(this._roomSocket?.send(payload));
  }

  editMessage(messageId, text) {
    return Boolean(
      this._roomSocket?.send({ action: "edit_message", message_id: messageId, message: text })
    );
  }

  deleteMessage(messageId) {
    return Boolean(this._roomSocket?.send({ action: "delete_message", message_id: messageId }));
  }

  /** Fire-and-forget read receipt. */
  async markSeen(roomId, upToMessageId, isCommunity = false) {
    if (!roomId && !isCommunity) return;
    try {
      await api.post(
        isCommunity ? COMMUNITY_SEEN_URL : roomSeenUrl(roomId),
        upToMessageId ? { message_id: upToMessageId } : {}
      );
    } catch { /* non-fatal */ }
  }

  uploadMedia(file) {
    const form = new FormData();
    form.append("file", file);
    return api.upload(UPLOAD_URL, form, { raw: true });
  }

  // ── Rooms (REST) ─────────────────────────────────────────────────────────
  async loadRooms() {
    if (!this.isAuthed) return;
    this.loading = true;
    try {
      const data = await api.get(API_CHAT_ROOMS, { raw: true });
      if (Array.isArray(data)) runInAction(() => { this.rooms = data; });
    } catch { /* non-fatal */ } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  async loadCommunityRooms() {
    if (!this.isAuthed) return;
    try {
      const d = await api.get(API_CHAT_COMMUNITY, { raw: true });
      runInAction(() => {
        if (Array.isArray(d)) {
          this.communityRooms = d.map((c) => ({ ...c, is_community: true }));
        } else if (d?.id) {
          this.communityRooms = [{ ...d, is_community: true, name: "Community Chat" }];
        }
      });
    } catch { /* non-fatal */ }
  }

  async loadCurrentUser() {
    if (!this.isAuthed) return;
    try {
      const me = await api.get(API_CHAT_ME, { raw: true });
      runInAction(() => { this.currentUser = me; });
    } catch { /* non-fatal */ }
  }

  /** Everything the bootstrap frame would have given us, over REST. */
  async bootstrapViaRest() {
    if (!this.isAuthed) return;
    await Promise.all([
      this.loadCurrentUser(),
      this.loadRooms(),
      this.loadCommunityRooms(),
    ]);
  }

  /** Admin spectate: every room in the system (needs chat.spectate). */
  async loadAllRooms() {
    this.allRoomsLoading = true;
    try {
      const data = await api.get(ADMIN_ROOMS_URL, { raw: true });
      runInAction(() => { this.allRooms = Array.isArray(data) ? data : data?.results || []; });
    } catch { /* non-fatal */ } finally {
      runInAction(() => { this.allRoomsLoading = false; });
    }
  }

  /** Open (or reuse) a 1:1 room with `userId`. Returns the room. */
  async createRoom(userId) {
    const room = await api.post(API_CHAT_ROOMS, { target_user_id: userId }, { raw: true });
    runInAction(() => {
      this.rooms = [room, ...this.rooms.filter((r) => String(r.id) !== String(room.id))];
    });
    return room;
  }

  async deleteRoom(roomId) {
    await api.delete(`${API_CHAT_ROOMS}?room_id=${encodeURIComponent(roomId)}`);
    runInAction(() => {
      this.rooms = this.rooms.filter((r) => String(r.id) !== String(roomId));
    });
    if (String(this.activeRoomId) === String(roomId)) this.closeRoom();
  }

  async loadMessages(roomId) {
    this.loading = true;
    try {
      const data = await api.get(API_CHAT_ROOM_MESSAGES(roomId), { raw: true });
      const list = Array.isArray(data) ? data : data?.results || [];
      runInAction(() => { this.messages = list.map(normalizeHistory); });
    } catch { /* non-fatal */ } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  async searchUsers(q) {
    if (!q?.trim()) return [];
    try {
      const data = await api.get(API_CHAT_SEARCH, { params: { q }, raw: true });
      return Array.isArray(data) ? data : data?.results || [];
    } catch {
      return [];
    }
  }

  async fetchPresence(userId) {
    if (!userId) return null;
    try {
      const data = await api.get(API_CHAT_PRESENCE(userId), { raw: true });
      runInAction(() => {
        this.presence = { ...this.presence, [String(userId)]: data };
      });
      return data;
    } catch {
      return null;
    }
  }

  /** Tear everything down (logout / unmount). */
  dispose() {
    this.closeRoom();
    this.disconnectGlobal();
    runInAction(() => {
      this.rooms = [];
      this.communityRooms = [];
      this.allRooms = [];
      this.messages = [];
      this.presence = {};
      this.currentUser = null;
      this.activeRoomId = null;
      this.connected = false;
    });
  }
}
