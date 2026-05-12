import type { RobotMode } from "../types/dashboard";

export function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function getRobotModeLabel(mode: RobotMode): string {
  switch (mode) {
    case "IDLE":
      return "Göreve Hazır / Beklemede";
    case "TASK_RECEIVED_PROCESSING":
      return "Görev Alındı / İşleniyor";
    case "MOVING_UNLOADED":
      return "Yüksüz Hareket";
    case "MOVING_LOADED":
      return "Yüklü Hareket";
    case "WAITING_FACTORY_COMMAND":
      return "Fabrika Komutu Bekleniyor";
    case "TASK_COMPLETED_RETURNING":
      return "Başlangıca Dönüyor";
    case "ERROR":
      return "Hata";
    case "EMERGENCY_STOP":
      return "Acil Stop";
    default:
      return mode;
  }
}

export function getRobotModeClass(mode: RobotMode): string {
  switch (mode) {
    case "IDLE":
      return "mode-idle";
    case "TASK_RECEIVED_PROCESSING":
      return "mode-processing";
    case "MOVING_LOADED":
      return "mode-loaded";
    case "MOVING_UNLOADED":
      return "mode-unloaded";
    case "WAITING_FACTORY_COMMAND":
      return "mode-waiting-command";
    case "TASK_COMPLETED_RETURNING":
      return "mode-returning";
    case "ERROR":
      return "mode-error";
    case "EMERGENCY_STOP":
      return "mode-emergency";
    default:
      return "mode-idle";
  }
}