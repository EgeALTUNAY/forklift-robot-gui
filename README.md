# Forklift Robot GUI

An operator interface dashboard project developed for the "Robotics Applications in Industry" competition. The system is designed to monitor and manage the robot's status, task progress, QR data, PLC communication, camera feed, and manual control state through a single unified dashboard.

This project is not the main control software of the robot. The robot's own backend runs separately. This application implements a **GUI Backend + React Frontend** architecture that operates between the robot backend and the operator interface.

---

## Architecture

```txt
React Frontend
      │
      │ REST + WebSocket
      ▼
FastAPI GUI Backend
      │
      │ HTTP / WebSocket / Proxy
      ▼
Robot Backend / Mock Robot Backend
      │
      ▼
PLC / QR / Motor / Camera / Sensor / Robot logic

```

The frontend never connects directly to the robot backend. All traffic passes through the GUI Backend.

```txt
Frontend              → GUI Backend :8000
GUI Backend           → Robot / Mock Backend :9000
Camera stream proxy   → /api/camera/stream
Dashboard WebSocket   → /ws/dashboard
Manual control WS     → /ws/manual-control

```

---

## Main Features

* Operator dashboard interface
* Factory map visualization showing robot position, route, QR codes, and door statuses
* Routing capabilities directly from the map interface
* Active route selection
* Robot task status tracking
* QR reading events
* PLC messages and technical PLC logs
* GUI Backend proxy infrastructure for camera streaming
* Gamepad/manual control WebSocket infrastructure
* Deadman switch, E-Stop, watchdog, and single-session security mechanisms
* Support for fake mode and real + mock backend mode
* Fully documented robot backend and WebSocket data contracts

---

## Directory Structure

```txt
forklift-robot-gui/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── clients/
│   │   ├── core/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── ws/
│   ├── mock_robot_backend/
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── package.json
│
├── docs/
│   ├── robot-backend-contract.md
│   ├── websocket-contract.md
│   ├── manual-control-safety.md
│   └── operator-demo-flow.md
│
└── README.md

```

---

## Requirements

For Backend:

```txt
Python 3.12+
FastAPI
Uvicorn
httpx
pydantic

```

For Frontend:

```txt
Node.js
npm
React
TypeScript
Vite

```

---

## Installation

### 1. Backend Environment

From the project root directory:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

```

### 2. Frontend Dependencies

```bash
cd frontend
npm install

```

---

## NPM Scripts

The following commands can be executed from the project root directory:

| Command | What it runs | When to use it? |
| --- | --- | --- |
| `npm run help` | Prints available root commands and descriptions to the terminal. | Used to quickly check what each mode does. |
| `npm run dev:fake` | Starts React frontend + GUI Backend. Robot backend is not required; GUI Backend runs with a fake client. | Used for quick UI/fake data testing, dashboard development, and running without a robot backend. Digital Twin Demo Mode may not function realistically here. |
| `npm run dev:mock` | Starts Mock Robot Backend `:9000`, GUI Backend `:8000`, and frontend `:5173`. GUI Backend runs with `ROBOT_CLIENT_MODE=real` and `ROBOT_BACKEND_URL=http://localhost:9000`. | Recommended for integration testing and Digital Twin Demo Mode. The **Start Demo Task** button under the demo tab should be used in this mode. |
| `npm run frontend:dev` | Starts only the React frontend dev server. | Used exclusively for frontend development when the backend is already running. |
| `npm run backend:fake` | Starts only the GUI Backend in fake mode. | Used to test the GUI Backend with fake data while running the frontend separately. |
| `npm run mock:backend` | Starts only the Mock Robot Backend on port `:9000`. | Used to test GUI Backend or integration flows against the mock robot service. |
| `npm run backend:mock` | Starts only the GUI Backend in real mode, connected to the mock backend. | Used to test GUI Backend integration when Mock Robot Backend is already running. |
| `npm run build` | Runs frontend production build; performs backend `python compileall` and main module import checks. | Used for validation prior to demonstrations or final submission to ensure frontend build and backend syntax/import integrity. |
| `npm run check` | Currently executes the same validation checks as `npm run build`. | Used as a quick verification command prior to demos. |

Quick Summary:

* `dev:fake` = quick UI/fake data testing
* `dev:mock` = mock backend + GUI backend + frontend; recommended for Digital Twin Demo Mode
* `build` = frontend build + backend compile/import verification

---

## Environment Configuration

A `.env` file can be configured at the root or within the backend directory.

Example backend configuration:

```env
ROBOT_CLIENT_MODE=fake
ROBOT_BACKEND_URL=http://localhost:9000
ROBOT_BACKEND_TIMEOUT_SECONDS=2.0
FRONTEND_ORIGIN=http://localhost:5173

```

For the frontend, create a `.env` file based on the `frontend/.env.example` template:

```env
VITE_GUI_BACKEND_HTTP_URL=http://localhost:8000
VITE_GUI_BACKEND_WS_URL=ws://localhost:8000/ws/dashboard
VITE_GUI_BACKEND_MANUAL_WS_URL=ws://localhost:8000/ws/manual-control

```

`.env` files should not be committed to version control.

---

## Execution Modes

### 1. Fake Mode

In this mode, a separate robot backend is not required. The GUI Backend generates its own synthetic data.

Terminal 1:

```bash
cd backend
source ../venv/bin/activate
ROBOT_CLIENT_MODE=fake uvicorn app.main:app --reload --port 8000

```

Terminal 2:

```bash
cd frontend
npm run dev

```

Frontend Access:

```txt
http://localhost:5173

```

---

### 2. Real + Mock Backend Mode

In this mode, the GUI Backend communicates with a mock robot backend instead of the physical robot software. This is recommended for comprehensive integration testing.

Terminal 1 — Mock Robot Backend:

```bash
cd backend
source ../venv/bin/activate
uvicorn mock_robot_backend.main:app --reload --port 9000

```

Terminal 2 — GUI Backend:

```bash
cd backend
source ../venv/bin/activate
ROBOT_CLIENT_MODE=real ROBOT_BACKEND_URL=http://localhost:9000 uvicorn app.main:app --reload --port 8000

```

Terminal 3 — Frontend:

```bash
cd frontend
npm run dev

```

Control Endpoints:

```txt
http://localhost:9000/health
http://localhost:8000/api/health/robot-backend
http://localhost:8000/api/dashboard/snapshot
http://localhost:5173

```

---

## Dashboard Contents

The operator dashboard panel displays the following real-time telemetry:

* Robot connection status
* Battery, speed, and payload information
* Factory map layout and real-time robot position
* Active route details and task progression
* Camera video streaming
* Errors, faults, and alert diagnostics
* QR code tracking events
* PLC data streams and system messages
* Low-level technical PLC logs
* Manual operation tracking and gamepad inputs

---

## Route Definition

Within the routing management system, the operator can:

1. Click the **Create Route from Map** button.
2. Select an ingestion node from the A points: `A1`, `A2`, `A3`.
3. Select a drop-off node from the B points: `B1`, `B2`, `B3`.
4. The system automatically computes the required track segments and QR sequences.
5. The route configuration is stored.
6. The operator can optionally trigger **Set as Active Route** to push it live to the main dashboard.

The origin coordinate cannot be selected by the operator; `START` is statically defined.

---

## Manual Control

The low-latency manual overriding pipeline follows this structure:

```txt
Gamepad
   ↓
React Frontend
   ↓ /ws/manual-control
FastAPI GUI Backend
   ↓
Robot Backend

```

Safety Restrictions:

* Movement commands are systematically rejected unless the physical key switch is turned to `MANUAL`.
* Velocity commands will not execute if the deadman switch is unpressed.
* All structural motion commands are hard-blocked during an active E-Stop state.
* Linear and angular velocities are enforcedly clamped on the backend.
* A built-in watchdog stops all autonomous movement if no input payload is registered within 500 ms.
* A hard stop safety command is dispatched automatically upon WebSocket disconnection.
* The interface enforces single-session exclusivity, allowing only one manual controller connection at any given time.

For full architectural safety details, refer to: `docs/manual-control-safety.md`

---

## Camera System

The video stream is decoupled from the main robot interface. The frontend hooks solely into the proxy system provided by the GUI Backend:

```txt
GET /api/camera/stream

```

Data Pipeline:

```txt
Frontend
   ↓
GUI Backend /api/camera/stream
   ↓
Robot Backend /camera/stream

```

The initial MVP version utilizes an MJPEG proxy configuration. WebRTC scaffolding is preserved within the architecture as a placeholder for next-phase deployment.

---

## Documentation

Core operational references:

* `docs/robot-backend-contract.md`: Outlines API specifications and JSON endpoints required by the physical robot backend layer.
* `docs/websocket-contract.md`: Establishes payload syntax for the primary dashboard and manual operation WebSockets.
* `docs/manual-control-safety.md`: Defines hardware overriding safety structures and verification parameters for live test deployments.
* `docs/operator-demo-flow.md`: Steps through step-by-step evaluation routines to run during product demonstrations.

---

## Specifications for Physical Robot Integration

When bridging to a real robot backend, the remote system must adhere to the data definitions across these endpoints:

```txt
GET  /state
GET  /task/status
GET  /map/runtime
GET  /manual/status
POST /manual/command
GET  /camera/status
GET  /camera/stream
GET  /plc/status
GET  /plc/messages
GET  /plc/logs
GET  /qr/events
GET  /alerts

```

The following checks are mandatory during the physical integration phase:

* Ensure all raw JSON keys exactly match their respective Pydantic schema schemas.
* Validate that the directional parameters `vx`, `omega`, and lifting operations (`lift`) align correctly with real actuator orientations.
* Confirm that manual state registries map authentically to hardware toggle configurations.
* Verify that camera pipelines compile properly under MJPEG or WebRTC configurations.
* Ensure automated safety scripts transform PLC signals into clear, human-readable terminal alerts.
* Verify tracking coordinate updates match sensor data from QR logs and active SLAM mappings.

---

## Pre-Flight Live Field Testing Advice

When evaluating code functionality on the live industrial robot for the first time:

* Restrict drive system profiles to minimum safe speed parameters.
* Elevate or decouple mechanical drive wheels to completely avoid unintended traction.
* Ensure a physical hardware Emergency Stop button remains instantly accessible to the oversight operator.
* Confirm that releasing the deadman switch immediately halts all drive operations.
* Test that breaking the network WebSocket connection successfully triggers a safety engine stop routine.
* Affirm that command buffers ignore incoming instructions entirely while the E-Stop loop remains active.

These software safety safeguards are secondary layers and do not replace physical testing of motor drives, mechanical brakes, and hardware-wired emergency stops.

---

## Version Control Rules

The following file structures must be excluded from code tracking commits:

```txt
.env
backend/.env
frontend/.env
node_modules/
venv/
.venv/
__pycache__/
.DS_Store
*.dmg

```

Configuration templates should be committed to guide local setups:

```txt
.env.example
backend/.env.example
frontend/.env.example

```

---

## Project Status

The stack is ready for deployment across fake simulated modes and physical endpoint mock tests. Production integration onto real warehouse machinery requires that the custom robot control layer mirror the strict network contracts defined within `docs/robot-backend-contract.md`.
