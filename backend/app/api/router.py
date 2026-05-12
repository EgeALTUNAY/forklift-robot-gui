from fastapi import APIRouter

from app.api.routes import health, dashboard, manual_control, routes
from app.api.endpoints.camera import router as camera_router

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(manual_control.router, prefix="/manual", tags=["Manual Control"])
api_router.include_router(routes.router, prefix="/routes", tags=["Routes"])
api_router.include_router(camera_router, prefix="/camera", tags=["Camera"])

