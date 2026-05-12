export type DashboardTab = "dashboard" | "route-definition";

interface Props {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}

export function DashboardTabs({ activeTab, onChange }: Props) {
  return (
    <div className="dashboard-tabs">
      <button
        className={activeTab === "dashboard" ? "tab-button active" : "tab-button"}
        onClick={() => onChange("dashboard")}
      >
        Operatör Dashboard
      </button>

      <button
        className={
          activeTab === "route-definition" ? "tab-button active" : "tab-button"
        }
        onClick={() => onChange("route-definition")}
      >
        Rota Tanımlama
      </button>
    </div>
  );
}