import type { RobotMode } from "../../types/dashboard";
import { getRobotModeClass, getRobotModeLabel } from "../../utils/format";

interface Props {
  mode: RobotMode;
}

export function StatusPill({ mode }: Props) {
  return (
    <span className={`status-pill ${getRobotModeClass(mode)}`}>
      {getRobotModeLabel(mode)}
    </span>
  );
}