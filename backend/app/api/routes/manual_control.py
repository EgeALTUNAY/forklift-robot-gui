from fastapi import APIRouter, HTTPException

from app.core.container import manual_control_service
from app.schemas.control import ManualControlCommand

router = APIRouter()


@router.post("/enable")
async def enable_manual_ptrhomode():
    success = await manual_control_service.enable_manual_mode()

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Manual mode could not be enabled."
        )

    return {"success": True}


@router.post("/disable")
async def disable_manual_mode():
    success = await manual_control_service.disable_manual_mode()
    return {"success": success}


@router.post("/command")
async def send_manual_command(command: ManualControlCommand):
    success = await manual_control_service.send_command(command)

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Manual command rejected. Robot may not be in MANUAL mode."
        )

    return {"success": True}


@router.post("/emergency-stop")
async def emergency_stop():
    success = await manual_control_service.emergency_stop()
    return {"success": success}

@router.post("/release-emergency-stop")
async def release_emergency_stop():
    success = await manual_control_service.release_emergency_stop()
    return {"success": success}