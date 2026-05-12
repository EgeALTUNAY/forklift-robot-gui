from fastapi import APIRouter

from app.core.container import dashboard_service

router = APIRouter()


@router.get("/snapshot")
async def get_dashboard_snapshot():
    return await dashboard_service.get_dashboard_snapshot()