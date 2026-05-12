import { useState } from "react";
import type { DashboardSnapshot } from "../../types/dashboard";
import { PlcMessagePanel } from "./PlcMessagePanel";
import { QrPanel } from "./QrPanel";
import { PlcLogPanel } from "./PlcLogPanel";
import { ManualControlPanel } from "./ManualControlPanel";
import { ManualControlStatusCard } from "./ManualControlStatusCard";
import { DemoControlPanel } from "./DemoControlPanel";

interface Props {
  snapshot: DashboardSnapshot;
}

export function EventFeedTabs({ snapshot }: Props) {
  const [activeTab, setActiveTab] = useState<"plc" | "qr" | "logs" | "manual" | "demo">("plc");

  return (
    <div className="card event-feed-tabs">
      <div className="tabs-header">
        <button 
          className={`tab-btn ${activeTab === 'plc' ? 'active' : ''}`}
          onClick={() => setActiveTab('plc')}
        >
          PLC Mesajları
        </button>
        <button 
          className={`tab-btn ${activeTab === 'qr' ? 'active' : ''}`}
          onClick={() => setActiveTab('qr')}
        >
          QR Akışı
        </button>
        <button 
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Teknik Loglar
        </button>
        <button 
          className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          Manuel Kontrol & Test
        </button>
        <button
          className={`tab-btn ${activeTab === 'demo' ? 'active' : ''}`}
          onClick={() => setActiveTab('demo')}
        >
          Demo
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'plc' && (
           <div className="tab-panel-container">
             <PlcMessagePanel messages={snapshot.plc_messages} />
           </div>
        )}
        {activeTab === 'qr' && (
           <div className="tab-panel-container">
             <QrPanel events={snapshot.qr_events} />
           </div>
        )}
        {activeTab === 'logs' && (
           <div className="tab-panel-container">
             <PlcLogPanel logs={snapshot.plc_logs} />
           </div>
        )}
        {activeTab === 'manual' && (
          <div className="manual-tab-stack">
             <ManualControlStatusCard status={snapshot.manual_control_status} />
             <ManualControlPanel status={snapshot.manual_control_status} />
          </div>
        )}
        {activeTab === 'demo' && (
          <div className="demo-tab-stack">
            <DemoControlPanel status={snapshot.demo_status} />
          </div>
        )}
      </div>
    </div>
  );
}
