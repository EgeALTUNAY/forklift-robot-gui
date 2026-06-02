# Robot Backend API Contract

The GUI backend communicates with the robot backend via the following REST endpoints. All endpoints exchange data exclusively in JSON format.

## Endpoints

### GET /state

Returns the current real-time state of the robot.
**Schema**: `RobotState`

```json
{
  "mode": "IDLE",
  "battery_percent": 87.5,
  "speed_mps": 0.12,
  "load_detected": false,
  "emergency_stop": false,
  "connection_ok": true,
  "timestamp": "2026-05-11T12:30:00Z"
}

```

### GET /task/status

Returns the active task status execution parameters.
**Schema**: `TaskStatus`

### GET /map/runtime

Returns the map runtime status data (active segments, registered QR codes, etc.).
**Schema**: `MapRuntimeStatus`

### GET /qr/events?limit=10

Lists the most recent physical QR tracking events.
**Schema**: `list[QrEvent]`

### GET /plc/logs?limit=10

Lists the most recent low-level PLC diagnostics logs.
**Schema**: `list[PlcLog]`

### GET /plc/status

Returns the immediate connectivity and CPU operation state of the PLC system.
**Schema**: `PlcStatus`

```json
{
  "connected": true,
  "cpu_status": "RUN",
  "last_heartbeat": "2026-05-11T12:30:00Z",
  "error_count": 0
}

```

### GET /plc/messages?limit=20

Lists the system messaging events received from the PLC network layer.
**Schema**: `list[PlcMessage]`

### GET /alerts?limit=20

Lists the active or most recent mechanical warnings and system alerts.
**Schema**: `list[AlertItem]`

### GET /manual/status

Returns the current manual overriding operational status.
**Schema**: `ManualControlStatus`

### GET /camera/status

Returns the connectivity and stream validation metrics of the optical hardware system.
**Schema**: `CameraStatus`

```json
{
  "enabled": true,
  "stream_url": "http://192.168.1.50/mjpeg",
  "stream_type": "MJPEG",
  "connected": true,
  "latency_ms": 35,
  "message": "Camera system active."
}

```

> [!IMPORTANT]
> The client frontend never directly hits the robot's native `stream_url`. The GUI Backend proxies this transmission through `/api/camera/stream` to guarantee network isolation.

---

## Actions (POST)

### POST /manual/enable

Activates the manual operation override mode.
**Response**: `{ "success": boolean }`

### POST /manual/disable

Deactivates the manual operation override mode.
**Response**: `{ "success": boolean }`

### POST /manual/command

Dispatches a manual velocity overriding frame to the vehicle drivetrain.
**Body**: `ManualControlCommand`
**Response**: `{ "success": boolean }`

### POST /emergency-stop

Triggers a high-priority software Emergency Stop (E-Stop) loop.
**Response**: `{ "success": boolean }`

### POST /release-emergency-stop

Resets and releases the active Emergency Stop constraint.
**Response**: `{ "success": boolean }`

---

## Shared Specifications

* All network interactions accept and return data structured under `application/json` boundaries.
* Exceptional runtime errors explicitly resolve via standard descriptive HTTP status codes (4xx, 5xx series).
* If the GUI Backend layer fails to map network queries to the physical robot backend, it automatically cascades back to safe fallback structures (synthetic data generators or null parameters).
