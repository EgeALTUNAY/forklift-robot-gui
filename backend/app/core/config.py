# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    frontend_origin: str = "http://localhost:5173"
    robot_backend_url: str = "http://localhost:9000"
    robot_backend_timeout_seconds: float = 2.0
    robot_client_mode: str = "fake"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()