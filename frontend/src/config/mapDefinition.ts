import type { MapRuntimeStatus } from "../types/dashboard";
export type MapPointType =
  | "start"
  | "pickup"
  | "dropoff"
  | "node"
  | "qr"
  | "gate";

export interface MapPoint {
  id: string;
  label: string;
  type: MapPointType;
  x: number; // percent
  y: number; // percent
}

export interface RouteSegment {
  id: string;
  from: string;
  to: string;
}



export const mapPoints: MapPoint[] = [
  { id: "START", label: "Başlangıç", type: "start", x: 11.5, y: 81.5 },

  { id: "A1", label: "A1", type: "pickup", x: 11.30, y: 12.85 },
  { id: "A2", label: "A2", type: "pickup", x: 21.4, y: 12.85 },
  { id: "A3", label: "A3", type: "pickup", x: 31.3, y: 12.85 },

  { id: "B1", label: "B1", type: "dropoff", x: 92.2, y: 14.32 },
  { id: "B2", label: "B2", type: "dropoff", x: 92.2, y: 57.5 },
  { id: "B3", label: "B3", type: "dropoff", x: 70.18, y: 86 },

  { id: "D1", label: "D1", type: "node", x: 11.5, y: 57.5 },
  { id: "D2", label: "D2", type: "node", x: 21.5, y: 57.5 },
  { id: "D3", label: "D3", type: "node", x: 31.09, y: 57.5 },
  { id: "D4", label: "D4", type: "node", x: 70.18, y: 57.37 },
  { id: "D5", label: "D5", type: "node", x: 70.18, y: 14.32 },
  { id: "D6", label: "D6", type: "node", x: 70.18, y: 63.27 },

  { id: "q1", label: "q1", type: "qr", x: 11.5, y: 68 },
  { id: "q2", label: "q2", type: "qr", x: 11.5, y: 31.6 },
  { id: "q3", label: "q3", type: "qr", x: 21.3, y: 31.6 },
  { id: "q4", label: "q4", type: "qr", x: 31, y: 31.6 },
  { id: "q5", label: "q5", type: "qr", x: 37.5, y: 57.5 },
  { id: "q6", label: "q6", type: "qr", x: 58.3, y: 57.5 },
  { id: "q7", label: "q7", type: "qr", x: 70.18, y: 72.65 },
  { id: "q8", label: "q8", type: "qr", x: 78.4, y: 57.5 },
  { id: "q9", label: "q9", type: "qr", x: 78.65, y: 14.14 },

  { id: "GATE", label: "Kapı", type: "gate", x: 46.8, y: 57.5 },
];

export const routeSegments: RouteSegment[] = [
  { id: "START_D1", from: "START", to: "D1" },
  { id: "D1_D2", from: "D1", to: "D2" },
  { id: "D2_D3", from: "D2", to: "D3" },
  { id: "D3_GATE", from: "D3", to: "GATE" },
  { id: "GATE_D4", from: "GATE", to: "D4" },

  { id: "D1_A1", from: "D1", to: "A1" },
  { id: "D2_A2", from: "D2", to: "A2" },
  { id: "D3_A3", from: "D3", to: "A3" },

  { id: "D4_D5", from: "D4", to: "D5" },
  { id: "D5_B1", from: "D5", to: "B1" },

  { id: "D4_B2", from: "D4", to: "B2" },

  { id: "D4_D6", from: "D4", to: "D6" },
  { id: "D6_B3", from: "D6", to: "B3" },
];

export const demoMapRuntimeStatus: MapRuntimeStatus = {
  active_segment_ids: ["START_D1", "D1_D2", "D2_D3", "D3_GATE", "GATE_D4", "D4_D6", "D6_B3"],
  completed_segment_ids: ["START_D1", "D1_D2"],

  pickup_point_id: "A2",
  dropoff_point_id: "B3",

  expected_qr_id: "q5",
  last_read_qr_id: "q3",
  read_qr_ids: ["q1", "q2", "q3"],

  current_node_id: "D2",
  gate_status: "WAITING_PERMISSION",
};