/**
 * WebSocketService — manages WS lifecycle + reconnect for admin activity feed
 */
class WebSocketServiceClass {
  constructor() {
    this.ws = null;
    this.listeners = [];
    this.reconnectDelay = 2000;
    this.maxDelay = 30000;
    this.shouldReconnect = false;
    this._pingInterval = null;
  }

  connect(onEvent) {
    this.shouldReconnect = true;
    this.listeners = [onEvent];
    this._connect();
  }

  _connect() {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host;
    const url = `${protocol}://${host}/ws/admin/activity`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("[AdminWS] Connected to activity feed");
        this.reconnectDelay = 2000; // reset backoff
        this._startPing();
      };

      this.ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "pong") return;
          this.listeners.forEach((fn) => fn(data));
        } catch (_) {}
      };

      this.ws.onclose = () => {
        console.log("[AdminWS] Disconnected");
        this._stopPing();
        if (this.shouldReconnect) {
          setTimeout(() => this._connect(), this.reconnectDelay);
          this.reconnectDelay = Math.min(
            this.reconnectDelay * 1.5,
            this.maxDelay,
          );
        }
      };

      this.ws.onerror = (err) => {
        console.warn("[AdminWS] Error:", err);
        this.ws.close();
      };
    } catch (e) {
      console.warn("[AdminWS] Could not create WebSocket:", e);
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this._stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  _startPing() {
    this._pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, 25000);
  }

  _stopPing() {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
      this._pingInterval = null;
    }
  }
}

export const WebSocketService = new WebSocketServiceClass();
