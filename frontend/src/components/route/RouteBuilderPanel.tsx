import { useEffect, useMemo, useState } from "react";

import type { DefinedRoute } from "../../types/route";

import {
  computeRoute,
  startOptions,
  pickupOptions,
  dropoffOptions,
  pointLabel,
  type SuggestedRoute,
} from "../../utils/routePlanner";

interface Props {
  selectedRoute: DefinedRoute | null;
  onSave: (route: DefinedRoute) => void;
  onPreviewChange: (route: DefinedRoute) => void;
  onStartSelection: (mode: "start" | "pickup" | "dropoff") => void;
  onStartWizard: () => void;
  selectionMode: string | null;
}

function createEmptyRoute(): DefinedRoute {
  const now = new Date().toISOString();

  return {
    id: `R-${Date.now()}`,
    name: "Yeni Rota",
    start_point_id: "START",
    pickup_point_id: "A2",
    dropoff_point_id: "B3",
    segment_ids: [],
    qr_sequence: [],
    gate_required: true,
    created_at: now,
    updated_at: now,
  };
}

export function RouteBuilderPanel({
  selectedRoute,
  onSave,
  onPreviewChange,
  onStartSelection,
  onStartWizard,
  selectionMode,
}: Props) {
  const [route, setRoute] = useState<DefinedRoute>(
    selectedRoute ?? createEmptyRoute()
  );

  const isComplete = useMemo(() => {
    return route.pickup_point_id && route.dropoff_point_id && route.segment_ids.length > 0;
  }, [route]);

  // Sync local state when a different saved route is selected
  useEffect(() => {
    if (selectedRoute) {
      setRoute(selectedRoute);
      onPreviewChange(selectedRoute);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoute?.id]);

  // Handle point selection from the map
  useEffect(() => {
    const handleMapPoint = (event: any) => {
      const { mode, pointId } = event.detail;
      if (mode === "pickup") updateField({ pickup_point_id: pointId });
      else if (mode === "dropoff") updateField({ dropoff_point_id: pointId });
    };

    window.addEventListener("mapPointSelected", handleMapPoint);
    return () => window.removeEventListener("mapPointSelected", handleMapPoint);
  }, []);

  // ── Auto-compute route whenever start/pickup/dropoff change ────────

  const suggested: SuggestedRoute | null = useMemo(() => {
    return computeRoute(
      "START", // Hardcoded as per request
      route.pickup_point_id,
      route.dropoff_point_id
    );
  }, [route.pickup_point_id, route.dropoff_point_id]);

  // Apply the computed segments/QR to the route and trigger preview
  useEffect(() => {
    if (!suggested) return;

    setRoute((prev) => {
      const updated: DefinedRoute = {
        ...prev,
        start_point_id: "START",
        segment_ids: suggested.segmentIds,
        qr_sequence: suggested.qrSequence,
        gate_required: suggested.gateRequired,
        updated_at: new Date().toISOString(),
      };

      // Trigger map preview
      onPreviewChange(updated);
      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggested]);

  const updateField = (patch: Partial<DefinedRoute>) => {
    setRoute((prev) => ({
      ...prev,
      ...patch,
      updated_at: new Date().toISOString(),
    }));
  };

  const handleSave = () => {
    if (!isComplete) return;

    const cleanedName = route.name.trim();

    const routeToSave: DefinedRoute = {
      ...route,
      name: cleanedName.length > 0 ? cleanedName : route.id,
      updated_at: new Date().toISOString(),
    };

    setRoute(routeToSave);
    onSave(routeToSave);
  };

  const handleNewRoute = () => {
    const fresh = createEmptyRoute();
    setRoute(fresh);
    onPreviewChange(fresh);
  };

  return (
    <div className="card route-builder-panel">
      <div className="card-title-row">
        <div>
          <h2>Yeni Rota Oluştur</h2>
          <p className="panel-subtitle">
            Harita üzerinden alma ve bırakma noktalarını seçin.
          </p>
        </div>

        <div className="card-actions">
          <button className="btn secondary btn-sm" onClick={handleNewRoute}>
            Temizle
          </button>
        </div>
      </div>

      <div className="route-actions-top">
        <button
          className={`btn primary btn-full wizard-btn ${
            selectionMode ? "active-wizard" : ""
          }`}
          onClick={onStartWizard}
        >
          {selectionMode ? "Seçim Yapılıyor..." : "📍 Haritadan Rota Çiz"}
        </button>
      </div>

      {/* ── Name / ID ──────────────────────────────────────────── */}
      <div className="route-form-grid compact-form">
        <label>
          <span>Rota Adı</span>
          <input
            placeholder="Örn: A2-B3 Ekspres"
            value={route.name}
            onChange={(event) => updateField({ name: event.target.value })}
          />
        </label>

        <div className="route-points-summary">
          <div className="point-item">
            <small>Başlangıç</small>
            <strong>START</strong>
          </div>
          <div className="point-arrow-icon">→</div>
          <div className={`point-item ${!route.pickup_point_id ? "pending" : ""}`}>
            <small>Alma</small>
            <strong>{pointLabel(route.pickup_point_id) || "?"}</strong>
          </div>
          <div className="point-arrow-icon">→</div>
          <div className={`point-item ${!route.dropoff_point_id ? "pending" : ""}`}>
            <small>Bırakma</small>
            <strong>{pointLabel(route.dropoff_point_id) || "?"}</strong>
          </div>
        </div>
      </div>

      {/* ── Compact Summary Box ──────────────────────────────────── */}
      {suggested ? (
        <div className="route-summary-v2">
          <div className="summary-header">
            <h3>Otomatik Rota Özeti</h3>
            <span className={`gate-status-pill ${route.gate_required ? "required" : "not-required"}`}>
              {route.gate_required ? "🔒 Kapı Geçişli" : "🔓 Kapısız"}
            </span>
          </div>

          <div className="summary-path-display">
            <span className="node">START</span>
            <span className="arrow">→</span>
            <span className="node highlight">{pointLabel(route.pickup_point_id)}</span>
            <span className="arrow">→</span>
            <span className="node highlight">{pointLabel(route.dropoff_point_id)}</span>
          </div>

          <div className="summary-stats-grid">
            <div className="stat-box">
              <span className="stat-val">{route.segment_ids.length}</span>
              <span className="stat-lab">Segment</span>
            </div>
            <div className="stat-box">
              <span className="stat-val">{route.qr_sequence.length}</span>
              <span className="stat-lab">QR Noktası</span>
            </div>
          </div>

          <div className="summary-qr-flow">
            <strong>QR Sırası:</strong>
            <div className="qr-sequence-text">
              {route.qr_sequence.length > 0
                ? route.qr_sequence.join(" → ")
                : "Bu rotada QR okuma noktası yok."}
            </div>
          </div>

          <details className="route-details-expandable">
            <summary>Segment Detaylarını Göster</summary>
            <div className="details-content">
              <div className="mini-chip-list">
                {route.segment_ids.map((id) => (
                  <span key={id} className="mini-chip">{id}</span>
                ))}
              </div>
            </div>
          </details>
        </div>
      ) : (
        <div className="route-placeholder-box">
          <p>Lütfen haritadan alma ve bırakma noktalarını seçin.</p>
        </div>
      )}

      <div className="route-actions-bottom">
        <button
          className="btn primary btn-full btn-lg"
          disabled={!isComplete}
          onClick={handleSave}
        >
          {isComplete ? "Rotayı Kaydet" : "Eksik Noktaları Tamamla"}
        </button>
      </div>
    </div>
  );
}