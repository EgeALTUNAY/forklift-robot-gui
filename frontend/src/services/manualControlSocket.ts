export interface ManualCommandFrame {
  source: "GUI_TEST" | "GAMEPAD" | "PHYSICAL_REMOTE";
  seq: number;
  deadman_pressed: boolean;
  vx: number;
  omega: number;
  lift: number;
}

export interface ManualCommandAck {
  accepted: boolean;
  reason: string | null;
  seq: number;
  timestamp: string;
}

export class ManualControlSocket {
  private socket: WebSocket | null = null;
  private seq = 0;
  private onAckCallback: ((ack: ManualCommandAck) => void) | null = null;

  constructor(private url: string) {}

  connect() {
    if (this.socket) return;
    this.socket = new WebSocket(this.url);

    this.socket.onmessage = (event) => {
      const ack: ManualCommandAck = JSON.parse(event.data);
      if (this.onAckCallback) this.onAckCallback(ack);
    };

    this.socket.onclose = () => {
      this.socket = null;
      console.log("Manual control socket closed.");
    };

    this.socket.onerror = (error) => {
      console.error("Manual control socket error:", error);
    };
  }

  send(command: Omit<ManualCommandFrame, "seq">): ManualCommandFrame | null {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return null;

    const frame: ManualCommandFrame = {
      ...command,
      seq: this.seq++,
    };

    this.socket.send(JSON.stringify(frame));
    return frame;
  }

  onAck(callback: (ack: ManualCommandAck) => void) {
    this.onAckCallback = callback;
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}
