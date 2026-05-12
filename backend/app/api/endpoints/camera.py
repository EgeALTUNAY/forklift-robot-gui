import httpx
from fastapi import APIRouter, Response, HTTPException
from fastapi.responses import StreamingResponse
from app.core.container import robot_client

router = APIRouter()

@router.get("/stream")
async def camera_stream():
    """
    Proxy the camera stream from the robot backend to the frontend.
    This ensures the frontend doesn't need direct access to the robot's network/port.
    """
    try:
        # 1. Get the actual stream URL from the robot
        status = await robot_client.get_camera_status()
        
        if not status.enabled or not status.connected or not status.stream_url:
            raise HTTPException(status_code=503, detail="Camera stream not available")

        # 2. Proxy the MJPEG stream
        # Set timeout=None to allow the stream to remain open indefinitely
        async def stream_generator():
            async with httpx.AsyncClient(timeout=None) as client:
                try:
                    async with client.stream("GET", status.stream_url) as response:
                        if response.status_code != 200:
                            return
                        
                        async for chunk in response.aiter_bytes():
                            yield chunk
                except Exception as e:
                    print(f"Stream generation error: {e}")
                    return

        return StreamingResponse(

            stream_generator(),
            media_type="multipart/x-mixed-replace; boundary=frame"
        )

    except Exception as e:
        print(f"Camera proxy error: {e}")
        # Return a placeholder or error image if the stream fails
        raise HTTPException(status_code=502, detail="Failed to proxy camera stream")
