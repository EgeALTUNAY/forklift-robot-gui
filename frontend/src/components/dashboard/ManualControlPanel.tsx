import { useState, useEffect, useRef } from "react";
import {
  disableManualMode,
  emergencyStop,
  enableManualMode,
  sendManualCommand,
  releaseEmergencyStop,
} from "../../services/manualControlApi";
import type { ManualControlStatus } from "../../types/dashboard";
import { useGamepadController } from "../../hooks/useGamepadController";
import { ManualControlSocket, type ManualCommandAck } from "../../services/manualControlSocket";

interface Props {
  status: ManualControlStatus;
}

const WS_URL = import.meta.env.VITE_GUI_BACKEND_MANUAL_WS_URL || "ws://localhost:8000/ws/manual-control";

export function ManualControlPanel({ status }: Props) {
  const [lastCommand, setLastCommand] = useState<string>("Henüz komut yok");
  const [lastAck, setLastAck] = useState<ManualCommandAck | null>(null);
  const gamepad = useGamepadController();
  const socketRef = useRef<ManualControlSocket | null>(null);

  // Initialize Socket
  useEffect(() => {
    const socket = new ManualControlSocket(WS_URL);
    socket.connect();
    socket.onAck((ack) => setLastAck(ack));
    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Stream Gamepad Commands
  const wasStreaming = useRef(false);

  useEffect(() => {
    if (!socketRef.current) return;

    const interval = setInterval(() => {
      // Conditions for streaming
      const isEStop = status.remote_control_state === "DISABLED"; // or check robot state
      
      const canStream = 
        status.physical_switch_position === "MANUAL" &&
        status.remote_control_enabled &&
        status.remote_control_state === "ACTIVE" &&
        gamepad.connected &&
        !isEStop;

      if (canStream) {
        socketRef.current?.send({
          source: "GAMEPAD",
          deadman_pressed: gamepad.deadmanPressed,
          vx: gamepad.vx,
          omega: gamepad.omega,
          lift: gamepad.lift,
        });
        wasStreaming.current = true;
      } else if (wasStreaming.current) {
        // Just stopped streaming: send one last zero command for safety
        socketRef.current?.send({
          source: "GAMEPAD",
          deadman_pressed: false,
          vx: 0,
          omega: 0,
          lift: 0,
        });
        wasStreaming.current = false;
      }
    }, 100); // 10Hz streaming

    return () => clearInterval(interval);
  }, [status, gamepad]);

  const handleEnableManual = async () => {
    const success = await enableManualMode();
    setLastCommand(
      success ? "Simülasyon: Manuel mod isteği gönderildi" : "İstek reddedildi"
    );
  };

  const handleDisableManual = async () => {
    const success = await disableManualMode();
    if (success) {
      setLastCommand("Simülasyon: Otomatik mod isteği gönderildi");
    }
  };

  const handleEmergencyStop = async () => {
    const success = await emergencyStop();
    if (success) {
      setLastCommand("ACİL STOP AKTİF");
    }
  };

  const handleReleaseEmergencyStop = async () => {
    const success = await releaseEmergencyStop();
    if (success) {
      setLastCommand("Acil stop resetlendi");
    } else {
      setLastCommand("Acil stop resetlenemedi");
    }
  };

  const sendCommand = async (
    label: string,
    vx: number,
    omega: number,
    lift: number = 0
  ) => {
    const success = await sendManualCommand({
      vx,
      omega,
      lift,
    });

    setLastCommand(success ? label : `${label} reddedildi`);
  };

  // Uzaktan kontrol butonlarının aktif/pasif durumu
  const isRemoteDisabled =
    !status.remote_control_enabled || status.physical_switch_position === "AUTO";

  // Hareket komutları için ek kontrol
  const isMovementDisabled =
    isRemoteDisabled || status.remote_control_state !== "ACTIVE";

  return (
    <div className="card manual-card">
      <div className="manual-header">
        <div className="title-row">
          <h2>Manuel Kontrol & Gamepad</h2>
          <div className={`connection-status ${socketRef.current?.isConnected() ? 'connected' : 'disconnected'}`}>
            {socketRef.current?.isConnected() ? 'WS Bağlı' : 'WS Bağlantı Yok'}
          </div>
        </div>
        <div className="test-notice">
          Gamepad kontrolü yalnızca fiziksel anahtar MANUAL konumdayken ve Deadman basılıyken aktif olur.
        </div>
      </div>

      <div className="manual-top-row">
        <button className="btn primary" onClick={handleEnableManual}>
          Test: Manuel Anahtarı Simüle Et
        </button>

        <button className="btn secondary" onClick={handleDisableManual}>
          Test: Otomatik Anahtara Dön
        </button>

        <button className="btn danger" onClick={handleEmergencyStop}>
          Acil Stop
        </button>

        <button className="btn warning" onClick={handleReleaseEmergencyStop}>
          E-Stop Reset
        </button>
      </div>

      <div className="manual-grid">
        <div className="status-section">
          <div className="manual-status">
            Sistem Durumu:{" "}
            <strong className={status.remote_control_state === "ACTIVE" ? "text-ok" : "text-danger"}>
              {status.remote_control_state === "ACTIVE" ? "KONTROL AKTİF" : "KONTROL KİLİTLİ"}
            </strong>
          </div>

          <div className="gamepad-status">
            Gamepad:{" "}
            <strong className={gamepad.connected ? "text-ok" : "text-muted"}>
              {gamepad.connected ? "BAĞLI" : "BAĞLI DEĞİL"}
            </strong>
            {gamepad.connected && (
              <span className={`deadman-tag ${gamepad.deadmanPressed ? 'active' : ''}`}>
                {gamepad.deadmanPressed ? 'DEADMAN BASILI' : 'DEADMAN BIRAKILDI'}
              </span>
            )}
          </div>

          {gamepad.connected && (
            <div className="live-values">
              <div>VX: <strong>{gamepad.vx.toFixed(2)}</strong></div>
              <div>Ω: <strong>{gamepad.omega.toFixed(2)}</strong></div>
              <div>Lift: <strong>{gamepad.lift.toFixed(2)}</strong></div>
            </div>
          )}

          {lastAck && (
            <div className={`ack-status ${lastAck.accepted ? 'ok' : 'error'}`}>
              <div className="ack-main">
                {lastAck.accepted ? '✓ Komut Kabul Edildi' : `✗ Reddedildi: ${lastAck.reason}`}
              </div>
              <div className="ack-meta">
                Seq: {lastAck.seq} | {new Date(lastAck.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>

        <div className="visual-controls">
          <div className="control-pad">
            <button
              className="btn control"
              disabled={isMovementDisabled}
              onMouseDown={() => sendCommand("İleri", 0.3, 0)}
              onMouseUp={() => sendCommand("Dur", 0, 0)}
            >
              İleri
            </button>

            <div className="control-middle">
              <button
                className="btn control"
                disabled={isMovementDisabled}
                onMouseDown={() => sendCommand("Sol", 0, -0.4)}
                onMouseUp={() => sendCommand("Dur", 0, 0)}
              >
                Sol
              </button>

              <button
                className="btn stop"
                disabled={isMovementDisabled}
                onClick={() => sendCommand("Dur", 0, 0)}
              >
                Dur
              </button>

              <button
                className="btn control"
                disabled={isMovementDisabled}
                onMouseDown={() => sendCommand("Sağ", 0, 0.4)}
                onMouseUp={() => sendCommand("Dur", 0, 0)}
              >
                Sağ
              </button>
            </div>

            <button
              className="btn control"
              disabled={isMovementDisabled}
              onMouseDown={() => sendCommand("Geri", -0.3, 0)}
              onMouseUp={() => sendCommand("Dur", 0, 0)}
            >
              Geri
            </button>
          </div>
        </div>
      </div>

      <p className="last-command">Sistem Son Komut: {status.last_command || "Yok"}</p>

      <style>{`
        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .connection-status {
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }
        .connection-status.connected { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .connection-status.disconnected { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .manual-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin: 1.5rem 0;
        }
        .status-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .gamepad-status {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .deadman-tag {
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 4px;
          background: #374151;
          color: #9ca3af;
        }
        .deadman-tag.active {
          background: #ef4444;
          color: white;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          50% { opacity: 0.7; }
        }
        .live-values {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          background: rgba(0,0,0,0.2);
          padding: 0.75rem;
          border-radius: 8px;
          font-family: monospace;
          font-size: 0.8rem;
        }
        .ack-status {
          font-size: 0.75rem;
          padding: 0.5rem;
          border-radius: 4px;
        }
        .ack-status.ok { color: #10b981; border-left: 3px solid #10b981; }
        .ack-status.error { color: #ef4444; border-left: 3px solid #ef4444; }
        .ack-main { font-weight: 600; margin-bottom: 2px; }
        .ack-meta { font-size: 0.65rem; opacity: 0.8; }
        
        .visual-controls {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        @media (max-width: 800px) {
          .manual-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}