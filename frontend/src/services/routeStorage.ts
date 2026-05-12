import type { DefinedRoute } from "../types/route";

const STORAGE_KEY = "forklift_defined_routes";
const ACTIVE_ROUTE_KEY = "forklift_active_route_id";

// ── Active Route ────────────────────────────────────────────────────────

export function getActiveRouteId(): string | null {
  return localStorage.getItem(ACTIVE_ROUTE_KEY);
}

export function setActiveRouteId(routeId: string): void {
  localStorage.setItem(ACTIVE_ROUTE_KEY, routeId);
}

export function clearActiveRouteId(): void {
  localStorage.removeItem(ACTIVE_ROUTE_KEY);
}

export function getActiveRoute(): DefinedRoute | null {
  const id = getActiveRouteId();
  if (!id) return null;

  const routes = loadRoutes();
  return routes.find((r) => r.id === id) ?? null;
}

export function loadRoutes(): DefinedRoute[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    // Provide a default matching the mock backend (A2 -> B3)
    const now = new Date().toISOString();
    const defaultDemoRoute: DefinedRoute = {
      id: "R_A2_B3",
      name: "Demo Aktif Rota (A2 -> B3)",
      start_point_id: "START",
      pickup_point_id: "A2",
      dropoff_point_id: "B3",
      segment_ids: ["START_D1", "D1_D2", "D2_D3", "D3_GATE", "GATE_D4", "D4_D6", "D6_B3"],
      qr_sequence: ["q1", "q2", "q3", "q4", "q5", "q6", "q7"],
      gate_required: true,
      created_at: now,
      updated_at: now,
    };
    saveRoutes([defaultDemoRoute]);
    return [defaultDemoRoute];
  }

  try {
    return JSON.parse(raw) as DefinedRoute[];
  } catch {
    return [];
  }
}

export function saveRoutes(routes: DefinedRoute[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
}

export function upsertRoute(route: DefinedRoute): DefinedRoute[] {
  const routes = loadRoutes();

  const existingIndex = routes.findIndex((item) => item.id === route.id);

  if (existingIndex >= 0) {
    routes[existingIndex] = route;
  } else {
    routes.push(route);
  }

  saveRoutes(routes);
  return routes;
}

export function deleteRoute(routeId: string): DefinedRoute[] {
  const routes = loadRoutes().filter((route) => route.id !== routeId);
  saveRoutes(routes);
  return routes;
}
