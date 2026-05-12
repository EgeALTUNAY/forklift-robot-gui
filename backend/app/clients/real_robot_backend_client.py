import httpx
from typing import List, Optional

from app.core.config import settings
from app.clients.interface import RobotBackendClientInterface
from app.schemas.robot import RobotState
from app.schemas.plc import PlcLog, PlcStatus, PlcMessage
from app.schemas.qr import QrEvent
from app.schemas.control import ManualControlCommand
from app.schemas.map_status import MapRuntimeStatus
from app.schemas.alert import AlertItem
from app.schemas.task import TaskStatus
from app.schemas.manual_status import ManualControlStatus
from app.schemas.camera import CameraStatus
from app.schemas.route import DefinedRoute
from app.schemas.demo import DemoCommandResponse, DemoStatus


class RealRobotBackendClient(RobotBackendClientInterface):
    def __init__(self):
        self.base_url = settings.robot_backend_url
        self.timeout = settings.robot_backend_timeout_seconds
        # Initialize client with base_url and default timeout
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout
        )
        self.demo_supported: bool | None = None

    async def _get(self, endpoint: str, params: Optional[dict] = None):
        """Helper for GET requests with logging and error handling."""
        response = await self.client.get(endpoint, params=params)
        response.raise_for_status()
        return response.json()

    async def _post(self, endpoint: str, json_data: Optional[dict] = None):
        """Helper for POST requests with logging and error handling."""
        response = await self.client.post(endpoint, json=json_data)
        response.raise_for_status()
        return response.json()

    async def _demo_get(self, endpoint: str):
        try:
            data = await self._get(endpoint)
            self.demo_supported = True
            return data
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in (404, 405):
                self.demo_supported = False
                raise NotImplementedError(
                    "Robot backend demo endpoints are not supported."
                ) from exc
            raise

    async def _demo_post(self, endpoint: str):
        try:
            data = await self._post(endpoint)
            self.demo_supported = True
            return data
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in (404, 405):
                self.demo_supported = False
                raise NotImplementedError(
                    "Robot backend demo endpoints are not supported."
                ) from exc
            raise

    async def get_robot_state(self) -> RobotState:
        data = await self._get("/state")
        return RobotState(**data)

    async def get_camera_status(self) -> CameraStatus:
        data = await self._get("/camera/status")
        return CameraStatus(**data)

    async def get_task_status(self) -> TaskStatus:
        data = await self._get("/task/status")
        return TaskStatus(**data)

    async def get_map_runtime_status(self) -> MapRuntimeStatus:
        data = await self._get("/map/runtime")
        return MapRuntimeStatus(**data)

    async def get_qr_events(self, limit: int = 50) -> List[QrEvent]:
        data = await self._get("/qr/events", params={"limit": limit})
        return [QrEvent(**item) for item in data]

    async def get_plc_logs(self, limit: int = 50) -> List[PlcLog]:
        data = await self._get("/plc/logs", params={"limit": limit})
        return [PlcLog(**item) for item in data]

    async def get_plc_status(self) -> PlcStatus:
        data = await self._get("/plc/status")
        return PlcStatus(**data)

    async def get_plc_messages(self, limit: int = 20) -> List[PlcMessage]:
        data = await self._get("/plc/messages", params={"limit": limit})
        return [PlcMessage(**item) for item in data]

    async def get_alerts(self, limit: int = 20) -> List[AlertItem]:
        data = await self._get("/alerts", params={"limit": limit})
        return [AlertItem(**item) for item in data]

    async def get_manual_control_status(self) -> ManualControlStatus:
        data = await self._get("/manual/status")
        return ManualControlStatus(**data)

    # Actions
    async def enable_manual_mode(self) -> bool:
        data = await self._post("/manual/enable")
        return data.get("success", False)

    async def disable_manual_mode(self) -> bool:
        data = await self._post("/manual/disable")
        return data.get("success", False)

    async def send_manual_command(self, command: ManualControlCommand) -> bool:
        data = await self._post("/manual/command", json_data=command.model_dump())
        return data.get("success", False)

    async def emergency_stop(self) -> bool:
        data = await self._post("/emergency-stop")
        return data.get("success", False)

    async def release_emergency_stop(self) -> bool:
        data = await self._post("/release-emergency-stop")
        return data.get("success", False)

    async def set_active_route(self, route: DefinedRoute) -> bool:
        data = await self._post(
            "/routes/active",
            json_data=route.model_dump(mode="json"),
        )
        return data.get("success", True)

    async def start_demo(self) -> DemoCommandResponse:
        data = await self._demo_post("/demo/start")
        return DemoCommandResponse(**data)

    async def stop_demo(self) -> DemoCommandResponse:
        data = await self._demo_post("/demo/stop")
        return DemoCommandResponse(**data)

    async def reset_demo(self) -> DemoCommandResponse:
        data = await self._demo_post("/demo/reset")
        return DemoCommandResponse(**data)

    async def get_demo_status(self) -> DemoStatus:
        data = await self._demo_get("/demo/status")
        return DemoStatus(**data)

    # For health check
    async def ping(self) -> bool:
        """Quick connection test."""
        try:
            # We can use /state or a dedicated /health if it exists.
            # Contract says /state exists.
            response = await self.client.get("/state", timeout=self.timeout)
            return response.status_code == 200
        except Exception as e:
            print(f"Ping failed: {e}")
            return False

    async def close(self):
        """Close the underlying httpx client."""
        await self.client.aclose()


if __name__ == "__main__":
    import asyncio
    import json

    async def run_diagnostics():
        print("--- RealRobotBackendClient Diagnostics ---")
        client = RealRobotBackendClient()
        print(f"Base URL: {client.base_url}")
        
        print("\n1. Pinging robot backend...")
        is_ok = await client.ping()
        if is_ok:
            print("[SUCCESS] Robot backend is reachable.")
        else:
            print("[FAILURE] Could not reach robot backend.")
            await client.close()
            return

        print("\n2. Fetching robot state...")
        try:
            state = await client.get_robot_state()
            print(f"[SUCCESS] State: {state}")
        except Exception as e:
            print(f"[FAILURE] Error fetching state: {e}")

        print("\n3. Fetching manual control status...")
        try:
            status = await client.get_manual_control_status()
            print(f"[SUCCESS] Status: {status}")
        except Exception as e:
            print(f"[FAILURE] Error fetching manual status: {e}")

        await client.close()
        print("\n--- Diagnostics Complete ---")

    asyncio.run(run_diagnostics())
