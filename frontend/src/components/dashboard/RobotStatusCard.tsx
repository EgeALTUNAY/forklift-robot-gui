import type { RobotState } from "../../types/dashboard";
import { formatTime } from "../../utils/format";
import { StatusPill } from "./StatusPill";

interface Props {
  robot: RobotState;
}

export function RobotStatusCard({ robot }: Props) {
  return (
    <div className="card">
      <div className="card-title-row">
        <h2>Robot Durumu</h2>
        <StatusPill mode={robot.mode} />
      </div>

      <div className="robot-state-layout">
        <div className="robot-main-state">
          <span>Aktif Mod</span>
          <strong>{robot.mode}</strong>
        </div>

        <div className="grid-2">
          <div>
            <span>Batarya</span>
            <strong>{robot.battery_percent}%</strong>
          </div>

          <div>
            <span>Hız</span>
            <strong>{robot.speed_mps} m/s</strong>
          </div>

          <div>
            <span>Yük Durumu</span>
            <strong>{robot.load_detected ? "Yüklü" : "Yüksüz"}</strong>
          </div>

          <div>
            <span>Bağlantı</span>
            <strong className={robot.connection_ok ? "text-ok" : "text-danger"}>
              {robot.connection_ok ? "Aktif" : "Kesildi"}
            </strong>
          </div>
        </div>
      </div>

      <p className="timestamp">
        Son güncelleme: {formatTime(robot.timestamp)}
      </p>
    </div>
  );
}