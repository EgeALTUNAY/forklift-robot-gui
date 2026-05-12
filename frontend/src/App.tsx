import { useState } from "react";
import "./App.css";

import { useDashboardSocket } from "./hooks/useDashboardSocket";
import type { ConnectionState } from "./services/dashboardSocket";

import {
  DashboardTabs,
  type DashboardTab,
} from "./components/navigation/DashboardTabs";

import { RouteDefinitionPage } from "./components/route/RouteDefinitionPage";

import { EmergencyStopBanner } from "./components/dashboard/EmergencyStopBanner";
import { SystemOverview } from "./components/dashboard/SystemOverview";
import { FactoryMapPanel } from "./components/dashboard/FactoryMapPanel";
import { AlertPanel } from "./components/dashboard/AlertPanel";
import { TaskRoutePanel } from "./components/dashboard/TaskRoutePanel";
import { EventFeedTabs } from "./components/dashboard/EventFeedTabs";
import { CameraPanel } from "./components/dashboard/CameraPanel";
import { ActiveRouteCard } from "./components/dashboard/ActiveRouteCard";

const getConnectionText = (state: ConnectionState) => {
  switch (state) {
    case "connected": return "GUI Backend Bağlı";
    case "connecting": return "GUI Backend Bağlanıyor";
    case "reconnecting": return "GUI Backend Yeniden Bağlanıyor";
    case "disconnected": return "GUI Backend Bağlantısı Yok";
    case "error": return "Bağlantı Hatası";
    default: return "Bilinmiyor";
  }
};

function App() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const { snapshot, connectionState, error, retry } = useDashboardSocket();

  return (
    <>
      <nav className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13h2v6H3v-6zm4-4h2v10H7V9zm11-6v2h-2V3h2zm2 0h1a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V9.414L5.707 6.121A1 1 0 0 1 6.414 4.5L10 8.086V4a1 1 0 0 1 1-1h9z" />
            </svg>
          </div>

          <span className="topbar-title">Forklift Robot Dashboard</span>
          <div className="topbar-sep" />
          <span className="topbar-sub">
            Sanayide Robotik Uygulamalar Yarışması
          </span>
        </div>

        <div className="topbar-right">
          {snapshot?.demo_status?.running && (
            <span className="demo-running-badge">Demo simülasyon çalışıyor</span>
          )}

          <div
            className={`connection ${snapshot ? 'connected' : connectionState}`}
            role="status"
            aria-live="polite"
          >
            <span className="connection-dot" />
            <div className="connection-text">
              <span>{snapshot ? 'GUI Backend Bağlı' : getConnectionText(connectionState)}</span>
              {snapshot && connectionState === "reconnecting" && (
                <span className="connection-subtext">WS yeniden bağlanıyor...</span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="page">
        <DashboardTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "dashboard" && (
          <div className="operator-layout">
            <ActiveRouteCard />

            {error && (
              <div className="error-banner" role="alert">
                <div className="error-banner-content">
                  <span>{error}</span>
                  <button onClick={retry} className="btn secondary btn-compact">Tekrar Dene</button>
                </div>
              </div>
            )}

            {!snapshot && !error && (
              <div className="loading">Dashboard verisi bekleniyor…</div>
            )}

            {snapshot?.error && (
              <div className="error-banner" role="alert">
                Robot backend bağlantı hatası: {snapshot.error}
              </div>
            )}

            {snapshot && (
              <>
                <div className="operator-row">
                  <div className="operator-main">
                    <EmergencyStopBanner robot={snapshot.robot_state} />
                    <div className="operator-status-strip">
                      <AlertPanel alerts={snapshot.alerts} />
                      <SystemOverview
                        robot={snapshot.robot_state}
                        plcLogCount={snapshot.plc_logs.length}
                        qrEventCount={snapshot.qr_events.length}
                      />
                    </div>
                    <FactoryMapPanel
                      runtimeStatus={snapshot.map_runtime_status}
                      debug={false}
                    />
                  </div>

                  <div className="operator-side">
                    <CameraPanel status={snapshot.camera_status} />
                    <TaskRoutePanel task={snapshot.task_status} />
                  </div>
                </div>

                <div className="operator-feed-tabs-container">
                  <EventFeedTabs snapshot={snapshot} />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "route-definition" && <RouteDefinitionPage />}
      </main>
    </>
  );
}

export default App;
