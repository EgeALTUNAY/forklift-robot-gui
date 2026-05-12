import type { AlertItem, AlertSeverity } from "../../types/dashboard";
import { formatTime } from "../../utils/format";

interface Props {
  alerts: AlertItem[];
}

function getSeverityLabel(severity: AlertSeverity): string {
  switch (severity) {
    case "INFO":
      return "Bilgi";
    case "WARNING":
      return "Uyarı";
    case "ERROR":
      return "Hata";
    case "CRITICAL":
      return "Kritik";
    default:
      return severity;
  }
}

function getSeverityClass(severity: AlertSeverity): string {
  switch (severity) {
    case "INFO":
      return "alert-info";
    case "WARNING":
      return "alert-warning";
    case "ERROR":
      return "alert-error";
    case "CRITICAL":
      return "alert-critical";
    default:
      return "alert-info";
  }
}

export function AlertPanel({ alerts }: Props) {
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = {
      CRITICAL: 0,
      ERROR: 1,
      WARNING: 2,
      INFO: 3,
    };

    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  if (alerts.length === 0) {
    return (
      <div className="alert-empty-strip">
        <span className="alert-empty-dot" />
        Sistem uyarısı yok
      </div>
    );
  }

  return (
    <div className="card alert-panel">
      <div className="card-title-row">
        <div>
          <h2>Hata ve Uyarı Paneli</h2>
          <p className="panel-subtitle">
            Robot, PLC, QR, güvenlik ve sistem uyarıları burada izlenir.
          </p>
        </div>

        <div className="alert-count-badge">
          {alerts.length} kayıt
        </div>
      </div>

      {sortedAlerts.length > 0 && (
        <div className="alert-list">
          {sortedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-row ${getSeverityClass(alert.severity)}`}
            >
              <div className="alert-severity">
                {getSeverityLabel(alert.severity)}
              </div>

              <div className="alert-content">
                <div className="alert-title-row">
                  <strong>{alert.title}</strong>
                  <span>{alert.source}</span>
                </div>

                <p>{alert.message}</p>

                <small>
                  {formatTime(alert.timestamp)}
                  {alert.acknowledged ? " · Onaylandı" : " · Onay bekliyor"}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
