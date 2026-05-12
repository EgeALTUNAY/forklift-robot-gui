export interface DefinedRoute {
  id: string;
  name: string;

  start_point_id: string;
  pickup_point_id: string;
  dropoff_point_id: string;

  segment_ids: string[];
  qr_sequence: string[];

  gate_required: boolean;

  created_at: string;
  updated_at: string;
}