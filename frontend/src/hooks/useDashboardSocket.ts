import { useEffect, useMemo, useState, useCallback } from "react";
import type { DashboardSnapshot } from "../types/dashboard";
import { WebSocketDashboardClient, type ConnectionState } from "../services/dashboardSocket";

const HTTP_URL = import.meta.env.VITE_GUI_BACKEND_HTTP_URL ?? "http://localhost:8000";

export function useDashboardSocket() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(() => {
    return new WebSocketDashboardClient();
  }, []);

  const fetchInitialSnapshot = useCallback(async () => {
    try {
      const response = await fetch(`${HTTP_URL}/api/dashboard/snapshot`);
      if (!response.ok) throw new Error("Failed to fetch initial snapshot");
      const data = await response.json();
      
      // Only set if we don't have a snapshot from WS yet
      setSnapshot((current) => current || data);
      setError(null);
    } catch (err) {
      console.error("REST Fallback failed:", err);
      setError("GUI Backend'e ulaşılamıyor. 8000 portunda FastAPI çalışıyor mu?");
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchInitialSnapshot();

    client.onSnapshot((event) => {
      setSnapshot(event.payload);
    });

    client.onConnectionChange((state) => {
      setConnectionState(state);
      if (state === "connected") {
        setError(null);
      }
    });

    client.connect();

    return () => {
      client.disconnect();
    };
  }, [client, fetchInitialSnapshot]);

  return {
    snapshot,
    connectionState,
    error,
    retry: fetchInitialSnapshot
  };
}