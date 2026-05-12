from app.core.config import settings
from app.clients.fake_robot_backend_client import FakeRobotBackendClient
from app.clients.real_robot_backend_client import RealRobotBackendClient
from app.services.dashboard_service import DashboardService
from app.services.manual_control_service import ManualControlService


if settings.robot_client_mode == "real":
    robot_client = RealRobotBackendClient()
else:
    robot_client = FakeRobotBackendClient()


dashboard_service = DashboardService(
    robot_client=robot_client
)

manual_control_service = ManualControlService(
    robot_client=robot_client
)