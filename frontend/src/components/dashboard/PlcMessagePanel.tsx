import type { PlcMessage } from "../../types/dashboard";

interface Props {
  messages: PlcMessage[];
}

export function PlcMessagePanel({ messages }: Props) {
  const directionMap: Record<string, string> = {
    ROBOT_TO_PLC: "Robot -> PLC",
    PLC_TO_ROBOT: "PLC -> Robot",
  };

  const typeMap: Record<string, string> = {
    HEARTBEAT: "Heartbeat",
    TASK_ASSIGNMENT: "Görev Atama",
    DOOR_PERMISSION_REQUEST: "Kapı İzin Talebi",
    DOOR_PERMISSION_RESPONSE: "Kapı İzin Yanıtı",
    STATUS_UPDATE: "Durum Bildirimi",
    ERROR: "Hata",
  };

  return (
    <div className="card plc-message-panel">
      <div className="card-header">
        <h2>PLC Mesaj Ekranı</h2>
        <span className="badge">Canlı Mesajlaşma</span>
      </div>

      <div className="message-list">
        {messages.length === 0 && (
          <div className="empty-state">Henüz PLC mesajı bulunmuyor.</div>
        )}
        {messages.map((msg) => {
          const isError = !msg.success || msg.message_type === "ERROR";
          const directionClass = msg.direction === "ROBOT_TO_PLC" ? "robot-to-plc" : "plc-to-robot";
          const statusClass = isError ? "error" : directionClass;

          return (
            <div key={msg.id} className={`message-row ${statusClass}`}>
              <div className="message-main">
                <div className="message-header">
                  <span className={`direction-tag ${directionClass}`}>
                    {directionMap[msg.direction] || msg.direction}
                  </span>
                  <span className="message-type">{typeMap[msg.message_type] || msg.message_type}</span>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-title">{msg.title}</div>
                <div className="message-payload" title={msg.payload}>
                  <code>{msg.payload}</code>
                </div>
              </div>
              {!msg.success && <div className="fail-indicator">!</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
