from app.clients.interface import RobotBackendClientInterface
from app.schemas.control import ManualControlCommand


class ManualControlService:
    def __init__(self, robot_client: RobotBackendClientInterface):
        self.robot_client = robot_client

    async def enable_manual_mode(self) -> bool:
        return await self.robot_client.enable_manual_mode()

    async def disable_manual_mode(self) -> bool:
        return await self.robot_client.disable_manual_mode()

    async def send_command(self, command: ManualControlCommand) -> bool:
        return await self.robot_client.send_manual_command(command)

    async def emergency_stop(self) -> bool:
        return await self.robot_client.emergency_stop()

    async def release_emergency_stop(self) -> bool:
        return await self.robot_client.release_emergency_stop()