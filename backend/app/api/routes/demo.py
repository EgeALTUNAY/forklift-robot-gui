from fastapi import APIRouter, HTTPException

from app.core.container import demo_service
from app.services.demo_service import DemoBackendError, DemoUnsupportedError

router = APIRouter()


def _to_http_error(exc: Exception) -> HTTPException:
    if isinstance(exc, DemoUnsupportedError):
        return HTTPException(
            status_code=501,
            detail="Demo simulation endpoints are not supported by the configured robot backend.",
        )

    return HTTPException(
        status_code=502,
        detail=f"Demo simulation request could not be completed: {exc}",
    )


@router.post("/start")
async def start_demo():
    try:
        return await demo_service.start()
    except (DemoUnsupportedError, DemoBackendError) as exc:
        raise _to_http_error(exc) from exc


@router.post("/stop")
async def stop_demo():
    try:
        return await demo_service.stop()
    except (DemoUnsupportedError, DemoBackendError) as exc:
        raise _to_http_error(exc) from exc


@router.post("/reset")
async def reset_demo():
    try:
        return await demo_service.reset()
    except (DemoUnsupportedError, DemoBackendError) as exc:
        raise _to_http_error(exc) from exc


@router.get("/status")
async def get_demo_status():
    try:
        return await demo_service.status()
    except (DemoUnsupportedError, DemoBackendError) as exc:
        raise _to_http_error(exc) from exc
