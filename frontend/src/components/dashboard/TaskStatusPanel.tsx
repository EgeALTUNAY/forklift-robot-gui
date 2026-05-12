import type { TaskPhase, TaskStatus } from "../../types/dashboard";
import { formatTime } from "../../utils/format";

interface Props {
  task: TaskStatus;
}

function getTaskPhaseLabel(phase: TaskPhase): string {
  switch (phase) {
    case "NO_TASK":
      return "Aktif Görev Yok";
    case "TASK_RECEIVED":
      return "Görev Alındı";
    case "PROCESSING":
      return "Görev İşleniyor";
    case "GOING_TO_PICKUP":
      return "Alma Noktasına Gidiliyor";
    case "PICKUP_ALIGNMENT":
      return "Alma Noktasında Hizalanıyor";
    case "LOAD_PICKED":
      return "Yük Alındı";
    case "GOING_TO_GATE":
      return "Kapı Bölgesine Gidiliyor";
    case "WAITING_FACTORY_COMMAND":
      return "Fabrika Komutu Bekleniyor";
    case "PASSING_GATE":
      return "Kapıdan Geçiliyor";
    case "GOING_TO_DROPOFF":
      return "Bırakma Noktasına Gidiliyor";
    case "DROPOFF_ALIGNMENT":
      return "Bırakma Noktasında Hizalanıyor";
    case "LOAD_DROPPED":
      return "Yük Bırakıldı";
    case "RETURNING_TO_START":
      return "Başlangıca Dönülüyor";
    case "COMPLETED":
      return "Görev Tamamlandı";
    case "ERROR":
      return "Görev Hatası";
    default:
      return phase;
  }
}

function getTaskPhaseClass(phase: TaskPhase): string {
  switch (phase) {
    case "ERROR":
      return "task-error";
    case "COMPLETED":
      return "task-completed";
    case "WAITING_FACTORY_COMMAND":
      return "task-waiting";
    case "NO_TASK":
      return "task-idle";
    default:
      return "task-active";
  }
}

export function TaskStatusPanel({ task }: Props) {
  return (
    <div className="card task-status-panel">
      <div className="card-title-row">
        <div>
          <h2>Görev Durumu</h2>
          <p className="panel-subtitle">
            Aktif görevin rota, QR, kapı ve ilerleme bilgileri.
          </p>
        </div>

        <span className={`task-phase-pill ${getTaskPhaseClass(task.phase)}`}>
          {getTaskPhaseLabel(task.phase)}
        </span>
      </div>

      <div className="task-progress-block">
        <div className="task-progress-header">
          <span>Görev İlerlemesi</span>
          <strong>{Math.round(task.progress_percent)}%</strong>
        </div>

        <div className="task-progress-bar">
          <div
            className="task-progress-fill"
            style={{ width: `${Math.min(Math.max(task.progress_percent, 0), 100)}%` }}
          />
        </div>
      </div>

      <div className="task-status-grid">
        <div>
          <span>Görev ID</span>
          <strong>{task.task_id ?? "-"}</strong>
        </div>

        <div>
          <span>Aktif Rota</span>
          <strong>{task.active_route_id ?? "-"}</strong>
        </div>

        <div>
          <span>Alma Noktası</span>
          <strong>{task.pickup_point_id ?? "-"}</strong>
        </div>

        <div>
          <span>Bırakma Noktası</span>
          <strong>{task.dropoff_point_id ?? "-"}</strong>
        </div>

        <div>
          <span>Beklenen QR</span>
          <strong>{task.expected_qr_id ?? "-"}</strong>
        </div>

        <div>
          <span>Son Okunan QR</span>
          <strong>{task.last_read_qr_id ?? "-"}</strong>
        </div>

        <div>
          <span>Geçen Süre</span>
          <strong>{task.elapsed_seconds} sn</strong>
        </div>

        <div>
          <span>Kalan Süre</span>
          <strong>
            {task.remaining_seconds !== null ? `${task.remaining_seconds} sn` : "-"}
          </strong>
        </div>

        <div>
          <span>Son Güncelleme</span>
          <strong>{formatTime(task.timestamp)}</strong>
        </div>
      </div>

      {task.description && (
        <div className="task-description">
          {task.description}
        </div>
      )}
    </div>
  );
}