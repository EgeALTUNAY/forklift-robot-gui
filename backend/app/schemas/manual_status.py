from enum import Enum
from datetime import datetime
from pydantic import BaseModel


class PhysicalSwitchPosition(str, Enum):
    AUTO = "AUTO"
    MANUAL = "MANUAL"


class RemoteControlState(str, Enum):
    LOCKED = "LOCKED"
    READY = "READY"
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"


class ManualInputSource(str, Enum):
    NONE = "NONE"
    GUI_TEST = "GUI_TEST"
    PHYSICAL_REMOTE = "PHYSICAL_REMOTE"
    GAMEPAD = "GAMEPAD"


class ManualControlStatus(BaseModel):
    physical_switch_position: PhysicalSwitchPosition
    remote_control_state: RemoteControlState
    remote_control_enabled: bool
    input_source: ManualInputSource
    last_command: str | None = None
    message: str | None = None
    timestamp: datetime