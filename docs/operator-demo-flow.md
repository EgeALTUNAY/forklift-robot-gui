# Forklift Robot GUI - Operator Demo Flow

This document details the procedural steps, primary features, and critical evaluation parameters required for system demonstrations and integration testing.

## 1. System Initialization Sequence

To ensure seamless component discovery and lifecycle management, boot the architecture strictly in the following order:

1. **Mock Robot Backend (Port 9000):** Simulates the core robot hardware and low-level controller pipelines.
2. **GUI Backend (Port 8000):** Operates as the central API gateway and real-time WebSocket orchestrator.
3. **Frontend (Port 5173):** Hosts the web-based operator control panel interface.

## 2. Execution Commands

### A. Fake Mode (Full Simulation)

Generates high-fidelity synthetic telemetry directly inside the GUI Backend, decoupling development from any active robot software layer. Recommended for UI/UX testing.

```bash
# Backend Execution
cd backend
ROBOT_CLIENT_MODE=fake uvicorn app.main:app --reload --port 8000

# Frontend Execution
cd frontend
npm run dev

```

### B. Real + Mock Backend Mode (Integration Testing)

The GUI Backend targets a separate Mock Robot Backend running as an independent system process. This represents the closest software environment to actual physical hardware deployment.

```bash
# Terminal 1: Spin up Mock Robot Backend
cd backend
uvicorn mock_robot_backend.main:app --reload --port 9000

# Terminal 2: Spin up GUI Backend in Real Mode targeting the Mock URL
cd backend
ROBOT_CLIENT_MODE=real ROBOT_BACKEND_URL=http://localhost:9000 uvicorn app.main:app --reload --port 8000

# Terminal 3: Spin up Frontend
cd frontend
npm run dev

```

## 3. Operator Dashboard Monitoring

The primary dashboard layout serves as a single pane of glass to observe live telemetry metrics:

* **Factory Map Layout:** Renders real-time vehicle positioning, active paths, and physical QR navigation nodes.
* **Task Status Pipeline:** Tracks active operational stages, completion percentages, and estimated time of arrival (ETA).
* **Active Route Mapping:** Summarizes the dynamic path profile pushed from the routing configuration engine.
* **Camera Feed (MVP):** Displays live environmental visibility streamed securely via an MJPEG proxy configuration.
* **Manual Control Status Panel:** Monitors the physical vehicle key switch, software control permissions, and the active overriding input source.
* **Alert Panel:** Highlights low-latency system diagnostics, mechanical faults, and software exceptions.
* **Sub-Feed Loggers:** Chronologically tracks QR tracking events, PLC transactional payloads, and verbose debug logs.

## 4. Route Definition Workflow

1. Navigate to the **"Create Route from Map"** view.
2. Verify that the routing origin coordinate is statically set to **START**.
3. Select an ingestion checkpoint from the A nodes via the map canvas: `A1`, `A2`, or `A3`.
4. Select a drop-off checkpoint from the B nodes via the map canvas: `B1`, `B2`, or `B3`.
5. The system automatically computes the complete routing tree (`START -> Ingestion -> Drop-off`).
6. Input a distinct identifier name for the generated route and click **Save**.
7. Locate the newly created profile within the routing queue and execute **Set as Active Route** to push the trajectory live to the dashboard tracking display.

## 5. Manual Control / Gamepad Validation Routine

1. **Authorization Check:** Adjust the mock backend telemetry settings to confirm the physical hardware key switch reads as `MANUAL`.
2. **Controller Discovery:** Connect a gamepad device via USB or Bluetooth. Ensure the interface prompts a "Gamepad Connected" success banner.
3. **Deadman Verification:** Press and hold down the **Deadman switch (Button A/Cross)** on the gamepad hardware.
4. **Command Injection:** Actuate the analog joysticks to transmit direction vectors, velocity parameters, and lifting adjustments.
5. **ACK/Reject Loop Monitoring:** Watch the dashboard confirmation logs to verify if packets are handled correctly (✓) or blocked (✗) due to safety infractions:
* Attempt a driving sequence while the vehicle switch reads as *AUTO* to confirm the command is blocked.
* Attempt a driving sequence while an *E-Stop* state is active to confirm the command is blocked.



## 6. Emergency Stop (E-Stop) Validation Routine

1. Trigger an emergency state by clicking the digital E-Stop button on the dashboard interface or simulating a hardware button press.
2. Verify that the entire application UI instantly locks under a bright red flashing "EMERGENCY STOP" overlay banner.
3. Check the PLC streaming feed to verify that a high-priority `"ERROR / E-Stop Active"` signal payload has logged successfully.
4. Verify that all automated trajectories or manual gamepad commands are completely ignored by the processing backend while the emergency state is maintained.
5. Clear the emergency switch and click the **Reset** button to restore standard operational parameters.

## 7. Video Stream Validation Routine

1. Observe the Camera Feed panel to ensure the text status indicator reads **"LIVE"** alongside a real-time latency readout (ms).
2. **Security Infrastructure Check:** Open the browser's Developer Tools Network panel. Verify that zero outgoing requests are targetting Port 9000 directly. All active image payloads must proxy strictly through the GUI Backend's designated endpoint: `/api/camera/stream`.

## 8. PLC Communication Panel

This specialized telemetry view filters higher-level manufacturing messaging and automation logic:

* **Robot → PLC Transactions:** Status updates, task execution logs, and drop-off confirmations.
* **PLC → Robot Transactions:** Dynamic order dispatching, facility gate permissions, and traffic management variables.
* **Interlock Requests:** Handshake validation logs managing intersections and automated door authorization handshakes.
* **Data Isolation Note:** Unlike the verbose "Technical PLC Logs" view which prints raw byte packets for low-level debugging, this panel maps out cleanly structured, human-readable operational events.

## 9. Demo Success Criteria

* Continuous, stable WebSocket telemetry streaming operating at a consistent refresh profile (10Hz pipeline).
* Immediate, synchronized propagation of the E-Stop state across all decoupled architectural boundaries (Frontend, GUI Backend, and Robot Backend).
* Instantaneous vehicle stop execution the exact millisecond the physical gamepad Deadman switch is released.
* Clean error recovery and user-friendly error state screens on the UI if the underlying robot system process disconnects or crashes unexpectedly.
* **Camera Proxy Isolation:** Verification that the client completely isolates the secure internal network layer by pulling image arrays through Port 8000 rather than reaching directly into Port 9000.
* **PLC UI Readability:** Verification that incoming and outgoing automated transactions map cleanly to color-coded terminal buckets (`Robot -> PLC` rendered in Blue; `PLC -> Robot` rendered in Green).

## 10. Known Limitations and Warnings

* **Camera Performance:** The current MVP relies on an HTTP MJPEG stream proxy architecture. High-throughput, sub-millisecond WebRTC infrastructure is preserved as a placeholder configuration for next-phase updates.
* **Simulation Constraints:** Architectural validations have been executed against simulated or mock data engines. Extensive live verification on actual industrial drivetrains, hardware PLC arrays, and real cameras remains mandatory.
* **Physical Safety Protocols:** Initial real-world drive evaluations must be executed either with the physical vehicle chassis raised on support blocks or restricted to heavily limited maximum velocity boundaries.
* **Data Contract Strictness:** To bridge safely with the real machinery, the engineering team's native robot controller software must perfectly replicate the network contracts defined in `docs/robot-backend-contract.md`.
