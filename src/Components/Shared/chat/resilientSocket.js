// Resilient WebSocket wrapper shared by all role Chat components.
//
// Problem it solves: a dropped WebSocket (proxy/Cloudflare idle timeout, laptop
// sleep, tab backgrounded, network blip) used to stay dead — the chat list and
// open conversation went silent until a manual page refresh. This wrapper keeps
// the connection alive and self-heals:
//   • auto-reconnect on ANY close (exponential backoff, capped)
//   • heartbeat ping every PING_INTERVAL_MS to defeat idle timeouts + detect
//     zombie ("half-open") sockets via a missed pong
//   • reviveIfNeeded() so the host can re-establish on tab refocus / network back
//
// The server answers {action:"ping"} with {action:"pong"}. Missed-pong detection
// only kicks in AFTER the first pong is seen, so an older backend without the
// pong handler never triggers false reconnects (the ping still acts as keepalive).

export const PING_INTERVAL_MS = 25000;
export const reconnectDelay = (attempt) => Math.min(30000, 1000 * 2 ** Math.min(attempt, 5));

export function createResilientSocket({ getUrl, onOpen, onMessage, onDown }) {
  let ws = null;
  let pingTimer = null;
  let reconnectTimer = null;
  let attempt = 0;
  let awaitingPong = false;
  let pongSupported = false;
  let stopped = false;

  const clearTimers = () => {
    if (pingTimer)      { clearInterval(pingTimer); pingTimer = null; }
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  };

  const detach = () => {
    if (!ws) return;
    try { ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null; ws.close(); } catch { /* ignore */ }
    ws = null;
  };

  const revive = () => { clearTimers(); detach(); scheduleReconnect(); };

  const startPing = () => {
    if (pingTimer) clearInterval(pingTimer);
    awaitingPong = false;
    pingTimer = setInterval(() => {
      if (!ws || ws.readyState !== WebSocket.OPEN) { revive(); return; }
      if (pongSupported && awaitingPong)            { revive(); return; } // missed pong → zombie
      awaitingPong = true;
      try { ws.send(JSON.stringify({ action: "ping" })); } catch { revive(); }
    }, PING_INTERVAL_MS);
  };

  function scheduleReconnect() {
    if (reconnectTimer || stopped) return;
    const delay = reconnectDelay(attempt++);
    reconnectTimer = setTimeout(() => { reconnectTimer = null; open(); }, delay);
  }

  function open() {
    if (stopped) return;
    clearTimers();
    detach();
    const url = getUrl();
    if (!url) return;
    let sock;
    try { sock = new WebSocket(url); } catch { scheduleReconnect(); return; }
    ws = sock;
    sock.onopen = () => { attempt = 0; startPing(); try { onOpen && onOpen(); } catch { /* ignore */ } };
    sock.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data && data.action === "pong") { pongSupported = true; awaitingPong = false; return; }
      try { onMessage && onMessage(data); } catch { /* ignore */ }
    };
    sock.onerror = () => {};
    sock.onclose = () => {
      clearTimers();
      ws = null;
      try { onDown && onDown(); } catch { /* ignore */ }
      scheduleReconnect();
    };
  }

  return {
    connect() { stopped = false; attempt = 0; open(); },
    close()   { stopped = true; clearTimers(); detach(); },
    reviveIfNeeded() {
      if (stopped) return;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
      clearTimers(); detach(); attempt = 0; open();
    },
    isOpen() { return !!ws && ws.readyState === WebSocket.OPEN; },
    send(payload) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      try { ws.send(typeof payload === "string" ? payload : JSON.stringify(payload)); return true; }
      catch { return false; }
    },
  };
}
