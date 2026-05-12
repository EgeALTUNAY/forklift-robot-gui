import time
from fastapi import APIRouter
from app.core.container import robot_client
from app.core.config import settings

router = APIRouter()


@router.get("/")
async def health_check():
    return {"status": "ok"}


@router.get("/robot-backend")
async def robot_backend_health():
    """
    Checks the connectivity to the robot backend.
    """
    start_time = time.time()
    connected = False
    error = None
    latency_ms = None

    try:
        # Check if the client has a ping method, or just try to get state
        if hasattr(robot_client, "ping"):
            connected = await robot_client.ping()
        else:
            # Fallback if ping is not implemented (though it should be in RealRobotBackendClient)
            await robot_client.get_robot_state()
            connected = True
        
        latency_ms = round((time.time() - start_time) * 1000, 2)
    except Exception as e:
        connected = False
        error = str(e)

    return {
        "connected": connected,
        "latency_ms": latency_ms if connected else None,
        "base_url": settings.robot_backend_url,
        "error": error
    }