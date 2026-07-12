/**
 * ChatStore — rooms, messages, presence, and the two WebSockets.
 *
 * Chat.jsx used to own ~400 lines of socket wiring, REST fallbacks and message
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

export default class ChatStore {
  rooms = [];
  communityRooms = [];
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

  handleGlobalMessage(data) {
    runInAction(() => {
      switch (data.action) {
        case "bootstrap":
          if (Array.isArray(data.rooms)) this.rooms = data.rooms;
          if (Array.isArray(data.communities)) {
            this.communityRooms = data.communities.map((c) => ({ ...c, is_community: true }));
          } else if (data.community?.id) {
            this.communityRooms = [{ ...data.community, is_community: true, name: "Community Chat" }];
          }
          if (data.presence) this.presence = { ...this.presence, ...data.presence };
          if (data.me) this.currentUser = data.me;
          break;

        case "room_update": {
          const idx = this.rooms.findIndex((r) => String(r.id) === String(data.room_id));
          if (idx >= 0) {
            const room = {
              ...this.rooms[idx],
              last_message: data.last_message,
              last_message_time: data.last_message_time,
            };
            // Move the touched room to the top, like every chat app.
            this.rooms = [room, ...this.rooms.filter((_, i) => i !== idx)];
          }
          break;
        }

        case "room_created":
          if (data.room && !this.rooms.some((r) => String(r.id) === String(data.room.id))) {
            this.rooms = [data.room, ...this.rooms];
          }
          break;

        case "presence_update":
          this.presence = {
            ...this.presence,
            [String(data.user_id)]: { is_online: data.is_online, last_seen: data.last_seen },
          };
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
    });

    const handlers = {
      onOpen: () => runInAction(() => { this.connected = true; }),
      onDown: () => {
        runInAction(() => { this.connected = false; });
        this.loadMessages(roomId); // REST fallback so history still shows
      },
      onMessage: (data) => this.handleRoomMessage(data),
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
  }

  handleRoomMessage(data) {
    runInAction(() => {
      switch (data.action) {
        case "message_history":
          this.messages = data.messages || [];
          break;
        case "new_message":
          this.messages = [...this.messages, data];
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
        case "status_update":
          this.messages = this.messages.map((m) =>
            (data.message_ids || []).map(String).includes(String(m.id))
              ? { ...m, status: data.status }
              : m
          );
          break;
        default:
          break;
      }
    });
  }

  // ── Actions (prefer the socket; REST is the fallback) ────────────────────
  sendMessage({ text, replyToId = null, mediaUrl = null, mediaType = null }) {
    if (!this.activeRoomId) return false;
    return Boolean(
      this._roomSocket?.send({
        action: "send_message",
        message: text,
        reply_to_id: replyToId,
        media_url: mediaUrl,
        media_type: mediaType,
      })
    );
  }

  editMessage(messageId, text) {
    return Boolean(this._roomSocket?.send({ action: "edit_message", message_id: messageId, message: text }));
  }

  deleteMessage(messageId) {
    return Boolean(this._roomSocket?.send({ action: "delete_message", message_id: messageId }));
  }

  markSeen(messageId) {
    return Boolean(
      this._roomSocket?.send({ action: "mark_seen", message_id: messageId, room_id: this.activeRoomId })
    );
  }

  createRoom(targetUserId) {
    return Boolean(this._globalSocket?.send({ action: "create_room", target_user_id: targetUserId }));
  }

  uploadMedia(file) {
    const form = new FormData();
    form.append("file", file);
    return api.upload(`${API_CHAT_HOST}/chat/upload/`, form, { raw: true });
  }

  // ── REST (bootstrap fallback + history) ──────────────────────────────────
  async bootstrapViaRest() {
    if (!this.isAuthed) return;
    try {
      const [me, rooms, community] = await Promise.all([
        api.get(API_CHAT_ME, { raw: true }).catch(() => null),
        api.get(API_CHAT_ROOMS, { raw: true }).catch(() => []),
        api.get(API_CHAT_COMMUNITY, { raw: true }).catch(() => null),
      ]);
      runInAction(() => {
        if (me) this.currentUser = me;
        if (Array.isArray(rooms)) this.rooms = rooms;
        if (community) {
          const list = Array.isArray(community) ? community : [community];
          this.communityRooms = list.map((c) => ({ ...c, is_community: true }));
        }
      });
    } catch { /* non-fatal: the socket may recover on its own */ }
  }

  async loadMessages(roomId) {
    this.loading = true;
    try {
      const data = await api.get(API_CHAT_ROOM_MESSAGES(roomId), { raw: true });
      runInAction(() => {
        this.messages = Array.isArray(data) ? data : data?.results || [];
      });
    } catch { /* non-fatal */ } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  searchUsers(q) {
    return api.get(API_CHAT_SEARCH, { params: { q }, raw: true });
  }

  async fetchPresence(userId) {
    const data = await api.get(API_CHAT_PRESENCE(userId), { raw: true });
    runInAction(() => {
      this.presence = { ...this.presence, [String(userId)]: data };
    });
    return data;
  }

  /** Tear everything down (logout / unmount). */
  dispose() {
    this.closeRoom();
    this.disconnectGlobal();
    runInAction(() => {
      this.rooms = [];
      this.communityRooms = [];
      this.messages = [];
      this.presence = {};
      this.currentUser = null;
      this.activeRoomId = null;
      this.connected = false;
    });
  }
}
