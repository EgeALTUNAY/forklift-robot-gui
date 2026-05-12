import type { DefinedRoute } from "../types/route";

const HTTP_URL = import.meta.env.VITE_GUI_BACKEND_HTTP_URL ?? "http://localhost:8000";
const API_BASE_URL = `${HTTP_URL}/api`;

export async function sendActiveRoute(route: DefinedRoute): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`${API_BASE_URL}/routes/active`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(route),
      signal: controller.signal,
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
