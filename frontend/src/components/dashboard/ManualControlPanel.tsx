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

const formatControlValue = (value: number) => value.toFixed(2);

export function ManualControlPanel({ status }: Props) {
  const [lastCommand, setLastCommand] = useState<string>("Henüz komut yok");
  const [lastAck, setLastAck] = useState<ManualCommandAck | null>(null);
  const [lastSentSeq, setLastSentSeq] = useState<number | null>(null);
  const gamepad = useGamepadController();
  const socketRef = useRef<ManualControlSocket | null>(null);
  const latestGamepadRef = useRef(gamepad);
  const latestStatusRef = useRef(status);

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

  useEffect(() => {
    latestGamepadRef.current = gamepad;
  }, [gamepad]);

  useEffect(() => {
    latestStatusRef.current = status;
  }, [status]);

  // Stream Gamepad Commands
  const wasStreaming = useRef(false);

  useEffect(() => {
    if (!socketRef.current) return;

    const interval = setInterval(() => {
      const currentStatus = latestStatusRef.current;
      const currentGamepad = latestGamepadRef.current;

      // Conditions for streaming
      const isEStop = currentStatus.remote_control_state === "DISABLED"; // or check robot state
      
      const canStream = 
        currentStatus.physical_switch_position === "MANUAL" &&
        currentStatus.remote_control_enabled &&
        currentStatus.remote_control_state === "ACTIVE" &&
        currentGamepad.connected &&
        !isEStop;

      if (canStream) {
        const frame = socketRef.current?.send({
          source: "GAMEPAD",
          deadman_pressed: currentGamepad.deadmanPressed,
          vx: currentGamepad.vx,
          omega: currentGamepad.omega,
          lift: currentGamepad.lift,
        });
        if (frame) setLastSentSeq(frame.seq);
        wasStreaming.current = true;
      } else if (wasStreaming.current) {
        // Just stopped streaming: send one last zero command for safety
        const frame = socketRef.current?.send({
          source: "GAMEPAD",
          deadman_pressed: false,
          vx: 0,
          omega: 0,
          lift: 0,
        });
        if (frame) setLastSentSeq(frame.seq);
        wasStreaming.current = false;
      }
    }, 100); // 10Hz streaming

    return () => clearInterval(interval);
  }, []);

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

          <div className="ps-debug-panel">
            <div className="ps-debug-header">
              <h3>PS Controller Debug</h3>
              <strong className={gamepad.connected ? "text-ok" : "text-muted"}>
                {gamepad.connected ? "BAĞLI" : "BAĞLI DEĞİL"}
              </strong>
            </div>

            {!gamepad.connected ? (
              <p className="ps-debug-empty">PS kolu bağlı değil. Bağladıktan sonra bir tuşa basın.</p>
            ) : (
              <>
                <div className="ps-controller-id" title={gamepad.debug.id ?? ""}>
                  {gamepad.debug.id}
                </div>

                <div className="ps-debug-row">
                  <span>Deadman</span>
                  <div className="ps-chip-row">
                    <span className={`ps-chip ${gamepad.debug.buttons.l1Pressed ? "active" : ""}`}>
                      L1 {gamepad.debug.buttons.l1Pressed ? "basılı" : "boşta"}
                    </span>
                    <span className={`ps-chip ${gamepad.debug.buttons.crossPressed ? "active" : ""}`}>
                      X/Cross {gamepad.debug.buttons.crossPressed ? "basılı" : "boşta"}
                    </span>
                  </div>
                </div>

                <div className="ps-debug-row">
                  <span>Safety stop</span>
                  <span className={`ps-chip danger ${gamepad.debug.buttons.circlePressed ? "active" : ""}`}>
                    O/Circle {gamepad.debug.buttons.circlePressed ? "basılı" : "boşta"}
                  </span>
                </div>

                <div className="ps-value-grid">
                  <span>Sol analog X</span>
                  <strong>{formatControlValue(gamepad.debug.axes.leftStickX)}</strong>
                  <span>Sol analog Y</span>
                  <strong>{formatControlValue(gamepad.debug.axes.leftStickY)}</strong>
                  <span>Sağ analog X</span>
                  <strong>{formatControlValue(gamepad.debug.axes.rightStickX)}</strong>
                  <span>Sağ analog Y</span>
                  <strong>{formatControlValue(gamepad.debug.axes.rightStickY)}</strong>
                </div>

                <div className="ps-processed-grid">
                  <div>vx <strong>{formatControlValue(gamepad.vx)}</strong></div>
                  <div>omega <strong>{formatControlValue(gamepad.omega)}</strong></div>
                  <div>lift <strong>{formatControlValue(gamepad.lift)}</strong></div>
                </div>
              </>
            )}

            <div className="ps-meta-grid">
              <span>Deadzone</span>
              <strong>{formatControlValue(gamepad.debug.deadzone)}</strong>
              <span>Son frame seq</span>
              <strong>{lastSentSeq ?? "Yok"}</strong>
              <span>Son ACK</span>
              <strong className={lastAck ? (lastAck.accepted ? "text-ok" : "text-danger") : "text-muted"}>
                {lastAck ? (lastAck.accepted ? "accepted" : "rejected") : "Yok"}
              </strong>
              <span>Reason</span>
              <strong>{lastAck?.reason ?? "-"}</strong>
            </div>
          </div>
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
        .ps-debug-panel {
          display: grid;
          gap: 0.6rem;
          background: rgba(15, 23, 42, 0.04);
          border: 1px solid var(--border-mid);
          border-radius: 8px;
          padding: 0.85rem;
        }
        .ps-debug-header,
        .ps-debug-row,
        .ps-meta-grid,
        .ps-value-grid {
          display: grid;
          gap: 0.35rem 0.6rem;
        }
        .ps-debug-header {
          grid-template-columns: 1fr auto;
          align-items: center;
        }
        .ps-debug-header h3 {
          margin: 0;
          font-size: 0.9rem;
        }
        .ps-debug-empty,
        .ps-controller-id {
          margin: 0;
          font-size: 0.75rem;
          color: var(--text-4);
          line-height: 1.35;
        }
        .ps-controller-id {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ps-debug-row {
          grid-template-columns: 96px 1fr;
          align-items: center;
          font-size: 0.75rem;
          color: var(--text-3);
        }
        .ps-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .ps-chip {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          border-radius: 4px;
          padding: 2px 6px;
          background: var(--surface);
          border: 1px solid var(--border-mid);
          color: var(--text-4);
          font-size: 0.68rem;
          font-weight: 600;
        }
        .ps-chip.active {
          background: var(--green-bg);
          border-color: #ABEFC6;
          color: var(--green-text);
        }
        .ps-chip.danger.active {
          background: var(--red-bg);
          border-color: #FECDCA;
          color: var(--red-text);
        }
        .ps-value-grid,
        .ps-meta-grid {
          grid-template-columns: minmax(92px, 1fr) auto minmax(92px, 1fr) auto;
          align-items: center;
          font-family: monospace;
          font-size: 0.74rem;
        }
        .ps-value-grid span,
        .ps-meta-grid span {
          color: var(--text-4);
        }
        .ps-processed-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.35rem;
          font-family: monospace;
          font-size: 0.76rem;
        }
        .ps-processed-grid div {
          display: flex;
          justify-content: space-between;
          gap: 0.35rem;
          background: var(--surface);
          border: 1px solid var(--border-mid);
          border-radius: 4px;
          padding: 0.35rem 0.45rem;
        }
        
        .visual-controls {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        @media (max-width: 800px) {
          .manual-grid { grid-template-columns: 1fr; }
          .ps-value-grid,
          .ps-meta-grid { grid-template-columns: minmax(110px, 1fr) auto; }
        }
      `}</style>
    </div>
  );
}
