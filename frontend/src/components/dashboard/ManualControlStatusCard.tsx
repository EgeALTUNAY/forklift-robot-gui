import type {
  ManualControlStatus,
  PhysicalSwitchPosition,
  RemoteControlState,
  ManualInputSource,
} from "../../types/dashboard";
import { formatTime } from "../../utils/format";

interface Props {
  status: ManualControlStatus;
}

function getSwitchLabel(position: PhysicalSwitchPosition): string {
  return position === "MANUAL" ? "MANUEL" : "OTOMATİK";
}

function getRemoteStateLabel(state: RemoteControlState): string {
  switch (state) {
    case "LOCKED":
      return "Kilitli";
    case "READY":
      return "Hazır";
    case "ACTIVE":
      return "Aktif";
    case "DISABLED":
      return "Devre Dışı";
    default:
      return state;
  }
}

function getInputSourceLabel(source: ManualInputSource): string {
  switch (source) {
    case "NONE":
      return "Yok";
    case "GUI_TEST":
      return "GUI Test";
    case "PHYSICAL_REMOTE":
      return "Fiziksel Kumanda";
    case "GAMEPAD":
      return "Gamepad";
    default:
      return source;
  }
}

function getRemoteStateClass(state: RemoteControlState): string {
  switch (state) {
    case "ACTIVE":
      return "manual-ok";
    case "READY":
      return "manual-ready";
    case "LOCKED":
      return "manual-locked";
    case "DISABLED":
      return "manual-error";
    default:
      return "manual-locked";
  }
}

export function ManualControlStatusCard({ status }: Props) {
  return (
    <div className="card manual-status-card">
      <div className="card-title-row">
        <div>
          <h2>Manuel Kontrol Durumu</h2>
          <p className="panel-subtitle">
            Uzaktan kontrol, robot üzerindeki fiziksel anahtar durumuna göre kilitlenir.
          </p>
        </div>

        <span className={`manual-status-pill ${getRemoteStateClass(status.remote_control_state)}`}>
          {getRemoteStateLabel(status.remote_control_state)}
        </span>
      </div>

      <div className="manual-status-grid">
        <div>
          <span>Fiziksel Anahtar</span>
          <strong>{getSwitchLabel(status.physical_switch_position)}</strong>
        </div>

        <div>
          <span>Uzaktan Kontrol</span>
          <strong>{status.remote_control_enabled ? "Aktif" : "Kilitli"}</strong>
        </div>

        <div>
          <span>Kontrol Kaynağı</span>
          <strong>{getInputSourceLabel(status.input_source)}</strong>
        </div>

        <div>
          <span>Son Komut</span>
          <strong>{status.last_command ?? "-"}</strong>
        </div>

        <div>
          <span>Son Güncelleme</span>
          <strong>{formatTime(status.timestamp)}</strong>
        </div>
      </div>

      {status.message && (
        <div className="manual-status-message">
          {status.message}
        </div>
      )}
    </div>
  );
}