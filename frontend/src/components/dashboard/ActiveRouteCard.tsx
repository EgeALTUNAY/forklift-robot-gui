import { useEffect, useState } from "react";
import { getActiveRoute } from "../../services/routeStorage";
import type { DefinedRoute } from "../../types/route";

/**
 * Reads the active route from localStorage and renders a small informational
 * card on the Operator Dashboard.  It never touches snapshot / runtime data.
 */
export function ActiveRouteCard() {
  const [activeRoute, setActiveRoute] = useState<DefinedRoute | null>(() =>
    getActiveRoute()
  );

  // Sync with localStorage when the window regains focus (e.g. user switched
  // tabs to the Route Definition page and made a change).
  useEffect(() => {
    const sync = () => setActiveRoute(getActiveRoute());
    window.addEventListener("focus", sync);
    // Also listen for our custom event fired by RouteDefinitionPage
    window.addEventListener("activeRouteChanged", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("activeRouteChanged", sync);
    };
  }, []);

  if (!activeRoute) {
    return (
      <div className="active-route-card active-route-card--empty">
        <span className="active-route-card__label">Tanımlı Aktif Rota</span>
        <span className="active-route-card__none">— Henüz aktif rota seçilmedi —</span>
      </div>
    );
  }

  return (
    <div className="active-route-card active-route-card--set">
      <div className="active-route-card__left">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="active-route-card__label">Tanımlı Aktif Rota</span>
          <span style={{ fontSize: '0.65rem', color: '#888', marginBottom: '4px' }}>Operatör tarafından seçilen demo rotası</span>
        </div>
        <strong className="active-route-card__name">{activeRoute.name}</strong>
        <span className="active-route-card__id">{activeRoute.id}</span>
      </div>
      <div className="active-route-card__right">
        <span className="active-route-card__detail">
          {activeRoute.pickup_point_id} → {activeRoute.dropoff_point_id}
        </span>
        <span className="active-route-card__detail">
          {activeRoute.segment_ids.length} segment ·{" "}
          {activeRoute.qr_sequence.length} QR ·{" "}
          {activeRoute.gate_required ? "Kapı geçişli" : "Kapısız"}
        </span>
      </div>
    </div>
  );
}
