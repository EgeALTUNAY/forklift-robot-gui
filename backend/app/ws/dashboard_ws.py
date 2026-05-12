import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.container import dashboard_service
from app.ws.connection_manager import manager

ws_router = APIRouter()


@ws_router.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            snapshot = await dashboard_service.get_dashboard_snapshot()

            await manager.send_json(websocket, {
                "type": "dashboard_snapshot",
                "payload": snapshot,
            })

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        manager.disconnect(websocket)