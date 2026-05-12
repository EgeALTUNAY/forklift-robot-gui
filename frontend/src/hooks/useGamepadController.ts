import { useState, useEffect, useCallback, useRef } from "react";

const DEADZONE = 0.1;

const applyDeadzone = (value: number) => (Math.abs(value) > DEADZONE ? value : 0);

export interface GamepadDebugState {
  id: string | null;
  deadzone: number;
  buttons: {
    l1Pressed: boolean;
    crossPressed: boolean;
    circlePressed: boolean;
  };
  axes: {
    leftStickX: number;
    leftStickY: number;
    rightStickX: number;
    rightStickY: number;
  };
}

export interface GamepadState {
  connected: boolean;
  vx: number;
  omega: number;
  lift: number;
  deadmanPressed: boolean;
  debug: GamepadDebugState;
}

export function useGamepadController() {
  const emptyDebugState: GamepadDebugState = {
    id: null,
    deadzone: DEADZONE,
    buttons: {
      l1Pressed: false,
      crossPressed: false,
      circlePressed: false,
    },
    axes: {
      leftStickX: 0,
      leftStickY: 0,
      rightStickX: 0,
      rightStickY: 0,
    },
  };

  const [gamepadState, setGamepadState] = useState<GamepadState>({
    connected: false,
    vx: 0,
    omega: 0,
    lift: 0,
    deadmanPressed: false,
    debug: emptyDebugState,
  });

  const requestRef = useRef<number | null>(null);

  const updateGamepadStatus = useCallback(() => {
    if (!navigator.getGamepads) {
      requestRef.current = requestAnimationFrame(updateGamepadStatus);
      return;
    }

    const gamepads = navigator.getGamepads();
    const gp = gamepads[0]; // Use the first gamepad

    if (gp) {
      const leftStickX = gp.axes[0] ?? 0;
      const leftStickY = gp.axes[1] ?? 0;
      const rightStickX = gp.axes[2] ?? 0;
      const rightStickY = gp.axes[3] ?? 0;

      const crossPressed = gp.buttons[0]?.pressed ?? false;
      const circlePressed = gp.buttons[1]?.pressed ?? false;
      const l1Pressed = gp.buttons[4]?.pressed ?? false;

      const vx = -leftStickY;
      const omega = -leftStickX;
      const lift = -rightStickY;
      const deadmanPressed = l1Pressed || crossPressed;

      setGamepadState({
        connected: true,
        vx: applyDeadzone(vx),
        omega: applyDeadzone(omega),
        lift: applyDeadzone(lift),
        deadmanPressed,
        debug: {
          id: gp.id,
          deadzone: DEADZONE,
          buttons: {
            l1Pressed,
            crossPressed,
            circlePressed,
          },
          axes: {
            leftStickX,
            leftStickY,
            rightStickX,
            rightStickY,
          },
        },
      });
    } else if (gamepadState.connected) {
      setGamepadState({
        connected: false,
        vx: 0,
        omega: 0,
        lift: 0,
        deadmanPressed: false,
        debug: emptyDebugState,
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
