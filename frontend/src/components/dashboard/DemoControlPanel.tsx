import { useEffect, useState } from "react";

import { getDemoStatus, resetDemo, startDemo, stopDemo } from "../../services/demoApi";
import type { DemoStatus } from "../../types/dashboard";

interface Props {
  status?: DemoStatus | null;
}

export function DemoControlPanel({ status }: Props) {
  const [localStatus, setLocalStatus] = useState<DemoStatus | null>(status ?? null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("Demo durumu dashboard snapshot akışıyla güncellenir.");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalStatus(status ?? null);
  }, [status]);

  const visibleStatus = status ?? localStatus;

  const runAction = async (
    label: string,
    action: () => Promise<{ success: boolean; status: DemoStatus | null; message?: string | null }>
  ) => {
    setBusyAction(label);
    setError(null);

    try {
      const response = await action();
      setLocalStatus(response.status);
      setMessage(response.message ?? `${label} komutu gönderildi.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo komutu gönderilemedi.");
    } finally {
      setBusyAction(null);
    }
  };

  const refreshStatus = async () => {
    setBusyAction("Durum");
    setError(null);

    try {
      const nextStatus = await getDemoStatus();
      setLocalStatus(nextStatus);
      setMessage("Demo durumu yenilendi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo durumu alınamadı.");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="demo-control-panel">
      <div className="demo-warning">
        <strong>DEMO SİMÜLASYON MODU</strong>
        <span>Gerçek robotu kontrol etmez.</span>
      </div>

      <div className="demo-control-grid">
        <div>
          <span>Durum</span>
          <strong>{visibleStatus?.running ? "Çalışıyor" : "Durdu"}</strong>
        </div>
        <div>
          <span>Adım</span>
          <strong>{visibleStatus?.demo_step_index ?? 0}</strong>
        </div>
        <div>
          <span>Konum</span>
          <strong>{visibleStatus?.current_node_id ?? "START"}</strong>
        </div>
        <div>
          <span>İlerleme</span>
          <strong>{Math.round(visibleStatus?.task_progress_percent ?? 0)}%</strong>
        </div>
      </div>

      <div className="demo-actions">
        <button
          className="btn primary"
          disabled={busyAction !== null}
          onClick={() => runAction("Başlat", startDemo)}
        >
          Demo Görevini Başlat
        </button>
        <button
          className="btn secondary"
          disabled={busyAction !== null}
          onClick={() => runAction("Durdur", stopDemo)}
        >
          Durdur
        </button>
        <button
          className="btn warning"
          disabled={busyAction !== null}
          onClick={() => runAction("Sıfırla", resetDemo)}
        >
          Sıfırla
        </button>
        <button
          className="btn secondary"
          disabled={busyAction !== null}
          onClick={refreshStatus}
        >
          Durumu Yenile
        </button>
      </div>

      {visibleStatus?.task_description && (
        <p className="demo-description">{visibleStatus.task_description}</p>
      )}

      {message && <p className="demo-message">{busyAction ? `${busyAction} işleniyor...` : message}</p>}
      {error && <p className="demo-error">Demo endpoint hatası: {error}</p>}
    </div>
  );
}
