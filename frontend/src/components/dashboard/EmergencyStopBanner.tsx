import type { RobotState } from "../../types/dashboard";

interface Props {
  robot: RobotState;
}

export function EmergencyStopBanner({ robot }: Props) {
  if (!robot.emergency_stop && robot.mode !== "EMERGENCY_STOP") {
    return null;
  }

  return (
    <div className="emergency-banner">
      <div>
        <strong>ACİL STOP AKTİF</strong>
        <p>Robot durdurulmuş durumda. Manuel veya otomatik komutlar kabul edilmemelidir.</p>
      </div>
    </div>
  );
}