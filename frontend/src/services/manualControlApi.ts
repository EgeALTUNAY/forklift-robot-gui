export interface ManualControlCommand {
  vx: number;
  omega: number;
  lift: number;
}

const HTTP_URL = import.meta.env.VITE_GUI_BACKEND_HTTP_URL ?? "http://localhost:8000";
const API_BASE_URL = `${HTTP_URL}/api`;

export async function enableManualMode(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/manual/enable`, {
    method: "POST",
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.success;
}

export async function disableManualMode(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/manual/disable`, {
    method: "POST",
  });

  const data = await response.json();
  return data.success;
}

export async function sendManualCommand(
  command: ManualControlCommand
): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/manual/command`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.success;
}

export async function emergencyStop(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/manual/emergency-stop`, {
    method: "POST",
  });

  const data = await response.json();
  return data.success;
}

export async function releaseEmergencyStop(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/manual/release-emergency-stop`, {
    method: "POST",
  });

  const data = await response.json();
  return data.success;
}