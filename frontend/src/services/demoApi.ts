import type { DemoCommandResponse, DemoStatus } from "../types/dashboard";

const HTTP_URL = import.meta.env.VITE_GUI_BACKEND_HTTP_URL ?? "http://localhost:8000";
const API_BASE_URL = `${HTTP_URL}/api`;

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.detail ?? `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

async function postDemoCommand(
  action: "start" | "stop" | "reset"
): Promise<DemoCommandResponse> {
  const response = await fetch(`${API_BASE_URL}/demo/${action}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export function startDemo(): Promise<DemoCommandResponse> {
  return postDemoCommand("start");
}

export function stopDemo(): Promise<DemoCommandResponse> {
  return postDemoCommand("stop");
}

export function resetDemo(): Promise<DemoCommandResponse> {
  return postDemoCommand("reset");
}

export async function getDemoStatus(): Promise<DemoStatus> {
  const response = await fetch(`${API_BASE_URL}/demo/status`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}
