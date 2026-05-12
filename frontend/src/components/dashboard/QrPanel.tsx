import type { QrEvent } from "../../types/dashboard";

interface Props {
  events: QrEvent[];
}

export function QrPanel({ events }: Props) {
  return (
    <div className="card">
      <h2>QR Okuma Verileri</h2>

      <div className="qr-list">
        {events.map((event, index) => (
          <div key={`${event.timestamp}-${index}`} className="qr-row">
            <strong>{event.qr_id}</strong>
            <span>{event.raw_data}</span>
            <small>
              İstasyon: {event.station_id ?? "-"} ·{" "}
              {new Date(event.timestamp).toLocaleTimeString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}