import type { RobotState } from "../../types/dashboard";
import { formatTime } from "../../utils/format";

interface Props {
  robot: RobotState;
  plcLogCount: number;
  qrEventCount: number;
}

export function SystemOverview({ robot, plcLogCount, qrEventCount }: Props) {
  return (
    <div className="overview-grid">
      <div className="overview-card">
        <span>Bağlantı</span>
        <strong className={robot.connection_ok ? "text-ok" : "text-danger"}>
          {robot.connection_ok ? "Aktif" : "Kesildi"}
        </strong>
      </div>

      <div className="overview-card">
        <span>Batarya</span>
        <strong>{robot.battery_percent}%</strong>
      </div>

      <div className="overview-card">
        <span>Hız</span>
        <strong>{robot.speed_mps} m/s</strong>
      </div>

      <div className="overview-card">
        <span>Yük</span>
        <strong>{robot.load_detected ? "Yüklü" : "Yüksüz"}</strong>
      </div>

      <div className="overview-card">
        <span>PLC Log</span>
        <strong>{plcLogCount}</strong>
      </div>

      <div className="overview-card">
        <span>QR Event</span>
        <strong>{qrEventCount}</strong>
      </div>

      <div className="overview-card wide">
        <span>Son Güncelleme</span>
        <strong>{formatTime(robot.timestamp)}</strong>
      </div>
    </div>
  );
}