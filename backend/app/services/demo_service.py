import httpx

from app.clients.interface import RobotBackendClientInterface
from app.schemas.demo import DemoCommandResponse, DemoStatus


class DemoUnsupportedError(Exception):
    pass


class DemoBackendError(Exception):
    pass


class DemoService:
    def __init__(self, robot_client: RobotBackendClientInterface):
        self.robot_client = robot_client

    async def start(self) -> DemoCommandResponse:
        return await self._run_command(self.robot_client.start_demo)

    async def stop(self) -> DemoCommandResponse:
        return await self._run_command(self.robot_client.stop_demo)

    async def reset(self) -> DemoCommandResponse:
        return await self._run_command(self.robot_client.reset_demo)

    async def status(self) -> DemoStatus:
        try:
            return await self.robot_client.get_demo_status()
        except NotImplementedError as exc:
            raise DemoUnsupportedError(str(exc)) from exc
        except httpx.HTTPStatusError as exc:
            raise DemoBackendError(
                f"Robot backend demo status request failed with HTTP {exc.response.status_code}."
            ) from exc
        except Exception as exc:
            raise DemoBackendError(str(exc)) from exc

    async def _run_command(self, command):
        try:
            return await command()
        except NotImplementedError as exc:
            raise DemoUnsupportedError(str(exc)) from exc
        except httpx.HTTPStatusError as exc:
            raise DemoBackendError(
                f"Robot backend demo command failed with HTTP {exc.response.status_code}."
            ) from exc
        except Exception as exc:
            raise DemoBackendError(str(exc)) from exc
