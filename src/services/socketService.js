/**
 * socketService — the single seam for realtime (WebSocket) connections.
 *
 * Wraps the resilient auto-reconnecting socket (lib chat/resilientSocket) and
 * owns every WS URL in the app, so no store or component ever hardcodes a
 * `wss://…/ws/…` path. Auth rides the httpOnly cookie the browser attaches to
 * the upgrade request automatically — no token goes in the query string.
 *
 * Usage from a store:
 *   this.socket = socketService.connectGlobalChat({ onOpen, onMessage, onDown });
 *   this.roomSocket = socketService.connectRoom(roomId, { ... });
 */
import { getWsBase } from "../config/appConfig";
import { createResilientSocket } from "../Components/Shared/chat/resilientSocket";

/** Base wss origin, e.g. "wss://api.karpagamalumni.in" (from backend config). */
function wsBase() {
  const base = getWsBase();
  if (base) return base.replace(/\/$/, "");
  // Fallback: derive from current origin (dev / config not yet loaded).
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}`;
}

export const endpoints = {
  globalChat: () => `${wsBase()}/ws/chat/`,
  room: (roomId) => `${wsBase()}/ws/chat/${encodeURIComponent(roomId)}/`,
  community: (roomType) =>
    `${wsBase()}/ws/community-chat/?room=${encodeURIComponent(roomType)}`,
};

/**
 * Open a resilient socket to a given URL builder. `getUrl` is re-invoked on
 * every (re)connect so a socket can go dormant (return null) when logged out.
 */
function connect(getUrl, handlers = {}) {
  const sock = createResilientSocket({ getUrl, ...handlers });
  sock.connect();
  return sock;
}

export const socketService = {
  endpoints,

  connectGlobalChat(handlers, isActive = () => true) {
    return connect(() => (isActive() ? endpoints.globalChat() : null), handlers);
  },

  connectRoom(roomId, handlers, isActive = () => true) {
    return connect(() => (isActive() ? endpoints.room(roomId) : null), handlers);
  },

  connectCommunity(roomType, handlers, isActive = () => true) {
    return connect(() => (isActive() ? endpoints.community(roomType) : null), handlers);
  },
};

export default socketService;
