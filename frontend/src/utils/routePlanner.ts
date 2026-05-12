/**
 * Automatic route planner.
 *
 * Given a start, pickup and dropoff point, computes the ordered list of
 * segment IDs and QR codes the robot will traverse.
 *
 * The planner uses a BFS on the undirected graph formed by `routeSegments`
 * from mapDefinition.ts.  QR codes that fall between consecutive waypoints
 * are collected using a lookup table built from the segment topology and
 * the known QR positions.
 */

import {
  mapPoints,
  routeSegments,
  type MapPoint,
  type RouteSegment,
} from "../config/mapDefinition";

// ── Adjacency graph ────────────────────────────────────────────────────

interface Edge {
  segmentId: string;
  target: string;
}

/** Build an undirected adjacency list from routeSegments. */
function buildGraph(): Map<string, Edge[]> {
  const graph = new Map<string, Edge[]>();

  const addEdge = (from: string, to: string, segmentId: string) => {
    const edges = graph.get(from) ?? [];
    edges.push({ segmentId, target: to });
    graph.set(from, edges);
  };

  for (const segment of routeSegments) {
    addEdge(segment.from, segment.to, segment.id);
    addEdge(segment.to, segment.from, segment.id);
  }

  return graph;
}

const graph = buildGraph();

// ── BFS shortest path ──────────────────────────────────────────────────

interface PathResult {
  nodeIds: string[];
  segmentIds: string[];
}

function bfs(from: string, to: string): PathResult | null {
  if (from === to) {
    return { nodeIds: [from], segmentIds: [] };
  }

  const visited = new Set<string>([from]);
  const queue: { node: string; path: { node: string; segmentId: string }[] }[] =
    [{ node: from, path: [] }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const edges = graph.get(current.node) ?? [];

    for (const edge of edges) {
      if (visited.has(edge.target)) {
        continue;
      }

      const newPath = [
        ...current.path,
        { node: edge.target, segmentId: edge.segmentId },
      ];

      if (edge.target === to) {
        return {
          nodeIds: [from, ...newPath.map((p) => p.node)],
          segmentIds: newPath.map((p) => p.segmentId),
        };
      }

      visited.add(edge.target);
      queue.push({ node: edge.target, path: newPath });
    }
  }

  return null; // no path
}

// ── QR code mapping ────────────────────────────────────────────────────

/**
 * Maps each segment to the QR codes that sit *on* or *between* its two
 * endpoints.  The mapping is based on the physical position of QR codes
 * relative to the segment endpoints.
 *
 * This is a hand-curated table derived from the factory map layout.
 * The order inside each list follows the direction START → dropoff.
 */
const segmentQrMap: Record<string, string[]> = {
  START_D1: ["q1"],
  D1_A1: ["q2"],
  D2_A2: ["q3"],
  D3_A3: ["q4"],
  D3_GATE: ["q5"],
  GATE_D4: ["q6"],
  D4_D5: [],
  D5_B1: ["q9"],
  D4_B2: ["q8"],
  D4_D6: [],
  D6_B3: ["q7"],
  D1_D2: [],
  D2_D3: [],
};

/**
 * Collect the ordered QR sequence for a given segment path.
 * For segments that are traversed in reverse we still include their QR
 * codes (the robot physically passes them).
 */
function collectQrSequence(segmentIds: string[]): string[] {
  const qrIds: string[] = [];
  const seen = new Set<string>();

  for (const segId of segmentIds) {
    const qrs = segmentQrMap[segId] ?? [];

    for (const qr of qrs) {
      if (!seen.has(qr)) {
        seen.add(qr);
        qrIds.push(qr);
      }
    }
  }

  return qrIds;
}

// ── Public API ─────────────────────────────────────────────────────────

export interface SuggestedRoute {
  segmentIds: string[];
  qrSequence: string[];
  gateRequired: boolean;
  /** Ordered node IDs the robot will visit (for debug / display). */
  waypoints: string[];
}

/**
 * Compute the full route (segments + QR codes) for a given start → pickup → dropoff
 * combination.
 *
 * The route is:
 *   start → pickup_node → pickup (branch up) → pickup_node (branch back) → … → dropoff
 *
 * For pickup points (A1, A2, A3) we need to go to the corresponding
 * D-node first, branch up to the A-point, then come back and continue
 * toward the dropoff via GATE.
 */
export function computeRoute(
  startId: string,
  pickupId: string,
  dropoffId: string
): SuggestedRoute | null {
  // Phase 1: start → pickup
  const toPickup = bfs(startId, pickupId);
  if (!toPickup) return null;

  // Phase 2: pickup → dropoff
  const toDropoff = bfs(pickupId, dropoffId);
  if (!toDropoff) return null;

  // Merge segment lists (avoid duplicating shared segments)
  const allSegments: string[] = [...toPickup.segmentIds];
  for (const seg of toDropoff.segmentIds) {
    allSegments.push(seg);
  }

  const allWaypoints: string[] = [
    ...toPickup.nodeIds,
    ...toDropoff.nodeIds.slice(1), // skip the pickup node (already included)
  ];

  const qrSequence = collectQrSequence(allSegments);

  const gateRequired = allSegments.some(
    (id) => id === "D3_GATE" || id === "GATE_D4"
  );

  return {
    segmentIds: allSegments,
    qrSequence,
    gateRequired,
    waypoints: allWaypoints,
  };
}

// ── Helpers for the UI ─────────────────────────────────────────────────

/** All points available as start options. */
export const startOptions: MapPoint[] = mapPoints.filter(
  (p) => p.type === "start"
);

/** All points available as pickup options. */
export const pickupOptions: MapPoint[] = mapPoints.filter(
  (p) => p.type === "pickup"
);

/** All points available as dropoff options. */
export const dropoffOptions: MapPoint[] = mapPoints.filter(
  (p) => p.type === "dropoff"
);

/** Get a display label for a point id. */
export function pointLabel(id: string): string {
  return mapPoints.find((p) => p.id === id)?.label ?? id;
}
