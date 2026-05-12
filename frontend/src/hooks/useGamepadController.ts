import { useState, useEffect, useCallback, useRef } from "react";

export interface GamepadState {
  connected: boolean;
  vx: number;
  omega: number;
  lift: number;
  deadmanPressed: boolean;

}

export function useGamepadController() {
  const [gamepadState, setGamepadState] = useState<GamepadState>({
    connected: false,
    vx: 0,
    omega: 0,
    lift: 0,
    deadmanPressed: false,
  });

  const requestRef = useRef<number | null>(null);

  const updateGamepadStatus = useCallback(() => {
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0]; // Use the first gamepad

    if (gp) {
      // Mapping logic:
      // Left stick Y: vx (forward/backward) - Inverted: Up is negative in API
      // Left stick X: omega (steering)
      // Right stick Y: lift (up/down)
      // Button 0 (A/Cross): Deadman

      const vx = -gp.axes[1]; // Forward/Backward
      const omega = -gp.axes[0]; // Steering
      const lift = -gp.axes[3]; // Right stick Y for lift
      const deadmanPressed = gp.buttons[0].pressed;

      setGamepadState({
        connected: true,
        vx: Math.abs(vx) > 0.1 ? vx : 0,
        omega: Math.abs(omega) > 0.1 ? omega : 0,
        lift: Math.abs(lift) > 0.1 ? lift : 0,
        deadmanPressed,
      });
    } else if (gamepadState.connected) {
      setGamepadState({
        connected: false,
        vx: 0,
        omega: 0,
        lift: 0,
        deadmanPressed: false,
      });
    }

    requestRef.current = requestAnimationFrame(updateGamepadStatus);
  }, [gamepadState.connected]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateGamepadStatus);
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [updateGamepadStatus]);

  return gamepadState;
}
