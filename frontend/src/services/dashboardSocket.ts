import type { DashboardWsEvent } from "../types/dashboard";

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

export interface DashboardSocketClient {
  connect(): void;
  disconnect(): void;
  onSnapshot(callback: (event: DashboardWsEvent) => void): void;
  onConnectionChange(callback: (state: ConnectionState) => void): void;
}

const WS_URL = import.meta.env.VITE_GUI_BACKEND_WS_URL ?? "ws://localhost:8000/ws/dashboard";

export class WebSocketDashboardClient implements DashboardSocketClient {
  private socket: WebSocket | null = null;
  private snapshotCallback: ((event: DashboardWsEvent) => void) | null = null;
  private connectionCallback: ((state: ConnectionState) => void) | null = null;

  private reconnectTimer: number | null = null;
  private shouldReconnect = true;
  private isReconnecting = false;

  connect(): void {
    this.shouldReconnect = true;
    this.isReconnecting = false;
    this.openSocket();
  }

  private openSocket(): void {
    if (this.isReconnecting) {
      this.connectionCallback?.("reconnecting");
    } else {
      this.connectionCallback?.("connecting");
    }

    this.socket = new WebSocket(WS_URL);

    this.socket.onopen = () => {
      console.log("WS connected:", WS_URL);
      this.isReconnecting = false;
      this.connectionCallback?.("connected");
    };

    this.socket.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as DashboardWsEvent;

        if (event.type === "dashboard_snapshot") {
          this.snapshotCallback?.(event);
        }
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
      }
    };

    this.socket.onerror = (error) => {
      console.error("WS error:", error);
      this.connectionCallback?.("error");
    };

    this.socket.onclose = (event) => {
      if (event.code !== 1000) {
        console.warn("WS closed unexpectedly:", event.code, event.reason);
      } else {
        console.log("WS closed:", event.code, event.reason);
      }
      
      this.connectionCallback?.("disconnected");

      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      return;
    }

    this.isReconnecting = true;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, 2000);
  }

  disconnect(): void {
    this.shouldReconnect = false;

    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.socket?.close(1000, "User disconnected");
  }

  onSnapshot(callback: (event: DashboardWsEvent) => void): void {
    this.snapshotCallback = callback;
  }

  onConnectionChange(callback: (state: ConnectionState) => void): void {
    this.connectionCallback = callback;
  }
}