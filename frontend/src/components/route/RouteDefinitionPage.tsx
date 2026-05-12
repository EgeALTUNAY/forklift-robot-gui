import { useMemo, useState } from "react";

import { FactoryMapPanel } from "../dashboard/FactoryMapPanel";
import { RouteBuilderPanel } from "./RouteBuilderPanel";

import type { MapRuntimeStatus } from "../../types/dashboard";
import type { DefinedRoute } from "../../types/route";
import type { MapPointType } from "../../config/mapDefinition";

import {
  deleteRoute,
  loadRoutes,
  upsertRoute,
  getActiveRouteId,
  setActiveRouteId,
  clearActiveRouteId,
} from "../../services/routeStorage";

type SelectionMode = "start" | "pickup" | "dropoff" | null;

function createRuntimeFromRoute(route: DefinedRoute | null): MapRuntimeStatus {
  if (!route) {
    return {
      active_segment_ids: [],
      completed_segment_ids: [],
      pickup_point_id: null,
      dropoff_point_id: null,
      expected_qr_id: null,
      last_read_qr_id: null,
      read_qr_ids: [],
      current_node_id: null,
      gate_status: "IDLE",
    };
  }

  return {
    active_segment_ids: route.segment_ids,
    completed_segment_ids: [],
    pickup_point_id: route.pickup_point_id,
    dropoff_point_id: route.dropoff_point_id,
    expected_qr_id: route.qr_sequence[0] ?? null,
    last_read_qr_id: null,
    read_qr_ids: [],
    current_node_id: route.start_point_id,
    gate_status: route.gate_required ? "WAITING_PERMISSION" : "IDLE",
  };
}

/** Dispatch a custom event so ActiveRouteCard on the Dashboard tab can re-sync. */
function notifyActiveRouteChanged() {
  window.dispatchEvent(new Event("activeRouteChanged"));
}

export function RouteDefinitionPage() {
  const [routes, setRoutes] = useState<DefinedRoute[]>(() => loadRoutes());
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(
    routes[0]?.id ?? null
  );
  const [previewRoute, setPreviewRoute] = useState<DefinedRoute | null>(
    routes[0] ?? null
  );
  const [activeRouteId, setActiveRouteIdState] = useState<string | null>(
    () => getActiveRouteId()
  );

  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);

  const selectedRoute = useMemo(() => {
    return routes.find((route) => route.id === selectedRouteId) ?? null;
  }, [routes, selectedRouteId]);

  const activeRoute = useMemo(() => {
    return routes.find((route) => route.id === activeRouteId) ?? null;
  }, [routes, activeRouteId]);

  const runtimeStatus = useMemo(() => {
    return createRuntimeFromRoute(previewRoute ?? selectedRoute);
  }, [previewRoute, selectedRoute]);

  const handleSave = (route: DefinedRoute) => {
    const updatedRoutes = upsertRoute(route);
    setRoutes(updatedRoutes);
    setSelectedRouteId(route.id);
    setPreviewRoute(route);
  };

  const handleSelectRoute = (route: DefinedRoute) => {
    setSelectedRouteId(route.id);
    setPreviewRoute(route);
  };

  const handleDeleteRoute = (routeId: string) => {
    const updatedRoutes = deleteRoute(routeId);
    setRoutes(updatedRoutes);

    // Clear active route if the deleted route was the active one
    if (activeRouteId === routeId) {
      clearActiveRouteId();
      setActiveRouteIdState(null);
      notifyActiveRouteChanged();
    }

    const nextRoute = updatedRoutes[0] ?? null;
    setSelectedRouteId(nextRoute?.id ?? null);
    setPreviewRoute(nextRoute);
  };

  const handleSetActiveRoute = (routeId: string) => {
    setActiveRouteId(routeId);
    setActiveRouteIdState(routeId);
    notifyActiveRouteChanged();
  };

  const [isWizard, setIsWizard] = useState(false);

  const selectablePointTypes: MapPointType[] = useMemo(() => {
    if (selectionMode === "start") return ["start"];
    if (selectionMode === "pickup") return ["pickup"];
    if (selectionMode === "dropoff") return ["dropoff"];
    return [];
  }, [selectionMode]);

  const selectedPointIds = useMemo(() => {
    const points = [];
    if (runtimeStatus.current_node_id) points.push(runtimeStatus.current_node_id);
    if (runtimeStatus.pickup_point_id) points.push(runtimeStatus.pickup_point_id);
    if (runtimeStatus.dropoff_point_id) points.push(runtimeStatus.dropoff_point_id);
    return points;
  }, [runtimeStatus]);

  const handlePointClick = (pointId: string) => {
    if (!selectionMode) return;

    window.dispatchEvent(
      new CustomEvent("mapPointSelected", {
        detail: { mode: selectionMode, pointId },
      })
    );

    if (isWizard && selectionMode === "pickup") {
      setSelectionMode("dropoff");
    } else {
      setSelectionMode(null);
      setIsWizard(false);
    }
  };

  const startWizard = () => {
    setIsWizard(true);
    setSelectionMode("pickup");
  };

  const handleCancelSelection = () => {
    setSelectionMode(null);
    setIsWizard(false);
  };

  return (
    <section className="route-definition-page">
      <div className="route-page-header">
        <div>
          <h2>Rota Tanımlama Ekranı</h2>
          <p>
            Forklift robot için görev rotaları arayüz üzerinden tanımlanır,
            kaydedilir ve harita üzerinde önizlenir.
          </p>
        </div>

        {selectionMode && (
          <div className="selection-overlay-info">
            <span className="selection-pulse" />
            <span>
              Harita üzerinden{" "}
              <strong>
                {selectionMode === "start"
                  ? "Başlangıç"
                  : selectionMode === "pickup"
                  ? "Alma"
                  : "Bırakma"}{" "}
                Noktasını
              </strong>{" "}
              seçin...
            </span>
            <button
              className="btn btn-sm secondary"
              onClick={handleCancelSelection}
            >
              İptal
            </button>
          </div>
        )}

        {/* Active route indicator */}
        {!selectionMode && activeRoute && (
          <div className="active-route-indicator active-route-indicator--set">
            <span className="active-route-indicator__dot" />
            <span>
              Aktif Rota: <strong>{activeRoute.name}</strong>{" "}
              <span className="active-route-indicator__id">
                ({activeRoute.id})
              </span>
            </span>
          </div>
        )}
      </div>

      <FactoryMapPanel
        runtimeStatus={runtimeStatus}
        debug={true}
        interactive={!!selectionMode}
        selectablePointTypes={selectablePointTypes}
        selectedPointIds={selectedPointIds}
        onPointClick={handlePointClick}
      />

      <div className="route-definition-layout">
        <RouteBuilderPanel
          selectedRoute={selectedRoute}
          onSave={handleSave}
          onPreviewChange={setPreviewRoute}
          onStartSelection={setSelectionMode}
          onStartWizard={startWizard}
          selectionMode={selectionMode}
        />


        <div className="card saved-routes-panel">
          <div className="card-title-row">
            <div>
              <h2>Kayıtlı Rotalar</h2>
              <p className="panel-subtitle">
                LocalStorage üzerinde saklanan rota tanımları.
              </p>
            </div>

            <div className="alert-count-badge">
              {routes.length} rota
            </div>
          </div>

          {routes.length === 0 && (
            <div className="empty-alert-state">
              Henüz kayıtlı rota yok.
            </div>
          )}

          {routes.length > 0 && (
            <div className="saved-route-list">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className={[
                    "saved-route-row",
                    route.id === selectedRouteId ? "selected" : "",
                    route.id === activeRouteId ? "active-route" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <button onClick={() => handleSelectRoute(route)}>
                    <div className="saved-route-row__top">
                      <strong>{route.name}</strong>
                      {route.id === activeRouteId && (
                        <span className="active-route-badge">● Aktif</span>
                      )}
                    </div>
                    <span>{route.id}</span>
                    <small>
                      {route.pickup_point_id} → {route.dropoff_point_id} ·{" "}
                      {route.segment_ids.length} segment
                    </small>
                  </button>

                  <div className="saved-route-row__actions">
                    <button
                      className={
                        route.id === activeRouteId
                          ? "route-activate-button route-activate-button--active"
                          : "route-activate-button"
                      }
                      onClick={() => handleSetActiveRoute(route.id)}
                      title="Bu rotayı aktif rota yap"
                    >
                      {route.id === activeRouteId ? "✓ Aktif" : "Aktif Yap"}
                    </button>

                    <button
                      className="route-delete-button"
                      onClick={() => handleDeleteRoute(route.id)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}