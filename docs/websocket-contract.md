# WebSocket Integration Contract

This document defines the WebSocket-based communication standards between the Frontend (Operator Interface) and the GUI Backend (Port 8000).

**Critical Rule:** The frontend never directly accesses the IP/Port configuration of the native Robot or Mock Backend (Port 9000). All WebSocket, REST, and camera streaming traffic must route strictly through the GUI Backend (Port 8000).

---

## 1. Dashboard Communication (`/ws/dashboard`)

This is a unidirectional (Server -> Client) streaming channel where the real-time status of the robot is broadcasted to the frontend as a periodic snapshot payload. In the current MVP, the refresh interval operates at approximately 1 Hz.

### Event Structure

All network messages within this stream are wrapped in the following JSON template:

```json
{
  "type": "dashboard_snapshot",
  "payload": { ... }
}

```

### `dashboard_snapshot` Payload Fields

The snapshot encapsulates a complete comprehensive state evaluation of the machine:

* `robot_state`: Linear/angular velocity, battery charge metric, control mode, and active E-Stop telemetry.
* `plc_logs`: Highly verbose low-level technical logging data.
* `plc_messages`: Handshaking events and parsed semantic signals exchanged between the robot and physical PLC (e.g., job assignments, facility door clearances).
* `qr_events`: Array logs tracking the most recently registered physical QR navigation coordinates.
* `map_runtime_status`: Live tracking data of operational grid segments, path targets, and factory door positions.
* `alerts`: Active mechanical fault triggers, safety rule violations, and functional exceptions.
* `task_status`: Processing phase metadata, current itinerary completion percentage, and estimated time of arrival (ETA).
* `manual_control_status`: Physical hardware key state and network-side overriding clearance states.
* `camera_status`: Access link to the active proxy endpoint and interface stream verification metrics.
* `ok`: A functional Boolean flag indicating whether telemetry streams compiled without database errors.
* `error`: Explanatory log text populated if backend systems fail to gather robot state parameters (e.g., if the robot core system process crashes).

---

## 2. Manual Control Communication (`/ws/manual-control`)

This is a high-frequency, bidirectional socket pipeline operating at a consistent 10 Hz profile (10 iterations per second), transferring manual operator input instructions directly to the GUI Backend.

### `ManualCommandFrame` (Client -> Server)

The client application dispatches input configurations encapsulated within the following structure:

* `source`: Tracking label detailing the physical origin of the override instruction (`GAMEPAD`, `GUI_TEST`, etc.).
* `seq`: Incrementing package sequence tracking ID (0, 1, 2...).
* `timestamp`: ISO 8601 formatting timestamp mapping the transmission generation time.
* `deadman_pressed`: Boolean evaluating the continuous execution status of the gamepad's physical deadman trigger.
* `vx`: Target linear forward/reverse velocity vector (constrained by backend clamp safety layers).
* `omega`: Target angular steering velocity vector (constrained by backend clamp safety layers).
* `lift`: Target elevation adjustments for the physical forklift apparatus (constrained by backend clamp safety layers).

### `ManualCommandAck` (Server -> Client)

The GUI Backend layer immediately analyzes each input block and returns a corresponding execution confirmation payload:

* `accepted`: Boolean confirmation reporting whether the frame was processed and successfully deployed on the robot drivetrain.
* `reason`: Descriptive context logged upon validation failures (e.g., "Deadman switch released", "Active E-Stop loop detected").
* `seq`: Corresponding package sequence reference indicating which packet generated this acknowledgment response.
* `timestamp`: Generation timestamp indicating exactly when the acknowledgment execution frame was resolved.

---

## 3. Reconnection and REST Fallback Operations

* **Dashboard Panel:** Initial dashboard loading operations execute a baseline synchronous state call via standard REST endpoints. If the primary `/ws/dashboard` connection fails, the frontend runs automated reconnection handlers applying an exponential backoff sequence. The client safely transitions back to periodic REST calls if socket streams remain unresponsive.
* **Manual Overriding Control:** If the secure `/ws/manual-control` pipeline encounters packet drops or network degradation, the session terminates immediately. Automated reconnection behaviors are strictly disabled for operator safety. The technician must explicitly re-initialize manual mode to re-establish manual operational control.

---

## 4. System Security and Functional Safety Contraints

The manual operation socket architecture implements several integrated layer protections:

* **Backend Validation:** Raw velocity inputs received from the client app are run through programmatic `clamp` validation blocks on the server. This prevents corrupted client-side frameworks from bypassing hardware velocity thresholds.
* **Deadman Intercept:** Packets showing `deadman_pressed == false` are blocked with maximum priority, overriding input instructions and forcing zero velocity tracking variables (`0` speed target parameters) down to the machine actuators.
* **Safety Watchdog (500 ms):** If the GUI Backend encounters a packet dropout duration exceeding 500 ms (caused by factory Wi-Fi degradation, connection drops, etc.), it calls an automated fallback script forcing an instant stop profile onto the vehicle.
* **Disconnect Safety Stop:** Upon unexpected pipeline closure, a server-side `finally` loop intercepts the event to transmit immediate emergency engine braking instructions to the physical robot platform.
* **Single Session Exclusivity:** To eliminate conflicting command conflicts, only a single unique connection token is allowed to hook into manual overriding processes. Concurrent manual control session requests are immediately rejected by the connection manager.
