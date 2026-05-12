from fastapi import APIRouter, HTTPException

from app.core.container import robot_client
from app.schemas.route import DefinedRoute

router = APIRouter()


@router.post("/active")
async def set_active_route(route: DefinedRoute):
    try:
        success = await robot_client.set_active_route(route)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Active route could not be sent to robot backend: {exc}",
        ) from exc

    if not success:
        raise HTTPException(
            status_code=502,
            detail="Active route was rejected by robot backend.",
        )

    return {
        "success": True,
        "message": "Active route sent to robot backend",
    }

