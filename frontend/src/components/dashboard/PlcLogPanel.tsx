import type { PlcLog } from "../../types/dashboard";

interface Props {
  logs: PlcLog[];
}

export function PlcLogPanel({ logs }: Props) {
  return (
    <div className="card">
      <h2>Teknik PLC Logları</h2>

      <div className="log-list">
        {logs.map((log, index) => (
          <div key={`${log.timestamp}-${index}`} className="log-row">
            <span className={`log-level ${log.level.toLowerCase()}`}>
              {log.level}
            </span>

            <span className="log-message">{log.message}</span>

            <span className="log-time">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}