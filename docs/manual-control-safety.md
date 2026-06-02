# Manual Control Safety Architecture and Procedures

This document details the safety layers, operational logic, and testing procedures of the forklift robot's manual control (gamepad/controller) system. The system is architected around the "Safety First" principle.

## 1. Data Flow Architecture

Manual control commands propagate through the following pipeline:
`Gamepad (Hardware) -> Frontend (Browser) -> GUI Backend (Python/FastAPI) -> Robot Backend (C++/ROS/Python)`

**Critical Rule:** The frontend never transmits commands directly to the robot's native backend (Port 9000). All commands must pass through the security and filtration layers of the GUI Backend.

## 2. Safety Layers

### A. Physical Key Interlock (Hardware Interlock)

If the physical key switch mounted on the robot is not turned to the `MANUAL` position, no motion commands sent via software will be processed. The system validates the `physical_switch_position` parameter inside every incoming packet.

### B. Deadman Switch Logic

The operator must continuously verify active, conscious control over the machinery.

* The **Deadman button (A/Cross)** on the gamepad must be kept pressed.
* The exact moment this button is released, the system triggers an instantaneous stop command (`vx=0, omega=0`), regardless of current velocity targets.

### C. E-Stop Priority

As long as a software or hardware Emergency Stop (E-Stop) state remains triggered, the manual control module enters a hard-locked state and rejects all input payloads. The robot cannot be moved until the E-Stop loop is manually reset.

### D. Backend-Side Clamping

Raw velocity values received from the frontend are strictly constrained on the GUI Backend layer to match safe physical thresholds:

* **Max Linear Velocity (vx):** ±0.5 m/s
* **Max Angular Velocity (w):** ±0.8 rad/s
* **Max Lift Command (lift):** ±0.3 normalized range

### E. Command Execution Prerequisites

A packet is only forwarded to the physical robot if all of the following conditions are simultaneously met:

* `physical_switch_position == MANUAL`
* `remote_control_enabled == true`
* `remote_control_state == ACTIVE`
* `emergency_stop == false`
* `deadman_pressed == true`
* Data inputs fall within or have been processed by backend clamping boundaries.

### E. Watchdog Timer (500ms)

Prevents runaway scenarios caused by network disconnections or frontend browser freezing, ensuring the vehicle does not continue moving on its last received instruction.

* If the GUI Backend does not register a new control payload within 500 ms, it executes an automated safety stop routine.

### F. WebSocket Disconnect Safety

If the connection drops unexpectedly (browser tab closure, Wi-Fi dropouts, etc.), a backend `finally` block activates to instantly transmit a "Zero Velocity" safety instruction to the robot hardware.

### G. Single Session Lock

Only one operator session is permitted to access manual controls at any given time. Any secondary connection attempts are systematically rejected.

## 3. Feedback Mechanism (ACK/Reject)

Every manual input payload returns an instantaneous acknowledgment (ACK) status packet from the backend:

* **Accepted:** The payload cleared all validation filters and was executed on the robot stack.
* **Rejected:** The command was blocked. The specific reason for the failure is printed explicitly on the operator's display console (e.g., "E-Stop active", "Physical switch set to AUTO", "Deadman switch released").

## 4. Pre-Flight Physical Testing Safety Procedures

When executing motion commands on physical hardware for the first time, operators must log and execute these steps:

1. **Chassis Elevation:** Elevate the robot completely to lift the drive wheels clear off the ground.
2. **Idle Testing (Fake Mode):** Run the GUI Backend in "Fake" mode (`ROBOT_CLIENT_MODE=fake`) to observe code processing pipelines and confirm ACK/Reject readouts via the UI.
3. **Integration Testing (Real+Mock Mode):** Pair the system against the mock robot backend (Port 9000) using `ROBOT_CLIENT_MODE=real` to verify structural link integrity across safety layers.
4. **Low Velocity Constraints:** Scale backend speed limits down to a 10% maximum profile during initial live surface tests.
5. **Clear Proximity:** Only conduct drive operations in a spacious, unobstructed testing field.
6. **Emergency Intercept Readiness:** While one hand manages the gamepad controller, the operator's secondary hand must remain positioned directly over the physical E-Stop button.

## 5. Known Limitations and Warnings

* **Hardware Validation Mandatory:** Software safety checks (GUI backend logic) do not replace live validation of physical motor drives, mechanical brakes, and hardware-wired emergency stop relays. Physical protection takes priority over software confirmations.
* **Network Latency Boundaries:** Because instructions are transmitted over a WebSocket network bridge, latency exceeding 100ms may degrade tracking precision and response handling.
* **Wireless Signal Consistency:** Operating the robot through zones with weak Wi-Fi signal coverage can cause frequent Watchdog trips, triggering recurring safety stops.
* **Controller Layout Compliance:** Gamepad structural mapping profiles align with standard Xbox/Playstation controller schemes; third-party configurations may require modifications inside the `useGamepadController` application hook.
