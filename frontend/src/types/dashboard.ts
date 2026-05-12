export type RobotMode =
  | "IDLE"
  | "TASK_RECEIVED_PROCESSING"
  | "MOVING_UNLOADED"
  | "MOVING_LOADED"
  | "WAITING_FACTORY_COMMAND"
  | "TASK_COMPLETED_RETURNING"
  | "ERROR"
  | "EMERGENCY_STOP";

export type LogLevel = "INFO" | "WARN" | "ERROR";

export type GateStatus =
  | "IDLE"
  | "WAITING_PERMISSION"
  | "PERMISSION_GRANTED"
  | "PASSING"
  | "PASSED"
  | "ERROR";

export interface RobotState {
  mode: RobotMode;
  battery_percent: number;
  speed_mps: number;
  load_detected: boolean;
  emergency_stop: boolean;
  connection_ok: boolean;
  timestamp: string;
}

export interface PlcLog {
  level: LogLevel;
  message: string;
  source: string;
  timestamp: string;
}

export type PlcDirection = "ROBOT_TO_PLC" | "PLC_TO_ROBOT";

export type PlcMessageType =
  | "HEARTBEAT"
  | "TASK_ASSIGNMENT"
  | "DOOR_PERMISSION_REQUEST"
  | "DOOR_PERMISSION_RESPONSE"
  | "STATUS_UPDATE"
  | "ERROR";

export interface PlcMessage {
  id: string;
  direction: PlcDirection;
  message_type: PlcMessageType;
  title: string;
  timestamp: string;
  success: boolean;
  payload: string;
}


export interface QrEvent {
  qr_id: string;
  raw_data: string;
  station_id: string | null;
  timestamp: string;
}

export interface MapRuntimeStatus {
  active_segment_ids: string[];
  completed_segment_ids: string[];

  pickup_point_id: string | null;
  dropoff_point_id: string | null;

  expected_qr_id: string | null;
  last_read_qr_id: string | null;
  read_qr_ids: string[];

  current_node_id: string | null;
  gate_status: GateStatus;
}

export interface DashboardSnapshot {
  robot_state: RobotState;
  plc_logs: PlcLog[];
  plc_messages: PlcMessage[];
  qr_events: QrEvent[];
  map_runtime_status: MapRuntimeStatus;
  alerts: AlertItem[];
  task_status: TaskStatus;
  manual_control_status: ManualControlStatus;
  camera_status: CameraStatus;
  demo_status?: DemoStatus | null;
  ok: boolean;
  error: string | null;
}

export interface DashboardWsEvent {
  type: "dashboard_snapshot";
  payload: DashboardSnapshot;
}
export type AlertSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type AlertSource =
  | "SYSTEM"
  | "ROBOT"
  | "PLC"
  | "QR"
  | "MAP"
  | "SAFETY"
  | "LINE_FOLLOW";

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  source: AlertSource;
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export type TaskPhase =
  | "NO_TASK"
  | "TASK_RECEIVED"
  | "PROCESSING"
  | "GOING_TO_PICKUP"
  | "PICKUP_ALIGNMENT"
  | "LOAD_PICKED"
  | "GOING_TO_GATE"
  | "WAITING_FACTORY_COMMAND"
  | "PASSING_GATE"
  | "GOING_TO_DROPOFF"
  | "DROPOFF_ALIGNMENT"
  | "LOAD_DROPPED"
  | "RETURNING_TO_START"
  | "COMPLETED"
  | "ERROR";

export interface TaskStatus {
  task_id: string | null;
  phase: TaskPhase;
  pickup_point_id: string | null;
  dropoff_point_id: string | null;
  active_route_id: string | null;

  expected_qr_id: string | null;
  last_read_qr_id: string | null;

  progress_percent: number;
  elapsed_seconds: number;
  remaining_seconds: number | null;

  description: string | null;
  timestamp: string;
}
export type PhysicalSwitchPosition = "AUTO" | "MANUAL";

export type RemoteControlState =
  | "LOCKED"
  | "READY"
  | "ACTIVE"
  | "DISABLED";

export type ManualInputSource =
  | "NONE"
  | "GUI_TEST"
  | "PHYSICAL_REMOTE"
  | "GAMEPAD";

export interface ManualControlStatus {
  physical_switch_position: PhysicalSwitchPosition;
  remote_control_state: RemoteControlState;
  remote_control_enabled: boolean;
  input_source: ManualInputSource;
  last_command: string | null;
  message: string | null;
  timestamp: string;
}

export interface CameraStatus {
  enabled: boolean;
  stream_url: string | null;
  stream_type: "MJPEG" | "WEBRTC" | "NONE";
  connected: boolean;
  latency_ms: number | null;
  message: string | null;
}

export interface DemoStatus {
  running: boolean;
  demo_running?: boolean;
  demo_step_index: number;
  demo_route_nodes: string[];
  current_node_id: string | null;
  completed_segment_ids: string[];
  active_segment_ids: string[];
  read_qr_ids: string[];
  expected_qr_id: string | null;
  last_read_qr_id: string | null;
  task_progress_percent: number;
  task_phase: string | null;
  task_description: string | null;
  elapsed_seconds: number;
  remaining_seconds: number | null;
  gate_status: string | null;
}

export interface DemoCommandResponse {
  success: boolean;
  status: DemoStatus | null;
  message?: string | null;
}
