import { useMemo, useState, type MouseEvent } from "react";

import type { GateStatus, MapRuntimeStatus } from "../../types/dashboard";

import {
  demoMapRuntimeStatus,
  mapPoints,
  routeSegments,
  type MapPoint,
  type RouteSegment,
  type MapPointType,
} from "../../config/mapDefinition";

interface Props {
  runtimeStatus?: MapRuntimeStatus;
  debug?: boolean;
  interactive?: boolean;
  selectedPointIds?: string[];
  selectablePointTypes?: MapPointType[];
  onPointClick?: (pointId: string) => void;
}

function findPoint(pointId: string): MapPoint | undefined {
  return mapPoints.find((point) => point.id === pointId);
}

function getRobotPosition(runtime?: MapRuntimeStatus) {
  if (runtime?.robot_position) {
    return runtime.robot_position;
  }

  if (runtime?.current_node_id) {
    return findPoint(runtime.current_node_id);
  }

  return undefined;
}

function getTrailPoints(runtime?: MapRuntimeStatus): string | null {
  const trail = runtime?.robot_path_trail;

  if (!trail || trail.length < 2) {
    return null;
  }

  const safeTrail = trail.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y)
  );

  if (safeTrail.length < 2) {
    return null;
  }

  return safeTrail.map((point) => `${point.x},${point.y}`).join(" ");
}

function getSegmentClass(
  segment: RouteSegment,
  runtime?: MapRuntimeStatus
): string {
  if (!runtime) return "map-segment idle";

  if (runtime.completed_segment_ids.includes(segment.id)) {
    return "map-segment completed";
  }

  if (runtime.active_segment_ids.includes(segment.id)) {
    return "map-segment active";
  }

  return "map-segment idle";
}

function getPointClass(
  point: MapPoint,
  runtime?: MapRuntimeStatus,
  interactive?: boolean,
  isSelected?: boolean,
  isSelectable?: boolean
): string {
  const classes = ["map-point", `point-${point.type}`];

  if (interactive) {
    classes.push("interactive");
    if (isSelected) classes.push("selected");
    if (isSelectable) classes.push("selectable");
  }

  if (!runtime) return classes.join(" ");

  if (point.id === runtime.current_node_id) {
    classes.push("current");
  }

  if (point.id === runtime.pickup_point_id) {
    classes.push("pickup-target");
  }

  if (point.id === runtime.dropoff_point_id) {
    classes.push("dropoff-target");
  }

  if (point.type === "qr") {
    if (runtime.read_qr_ids.includes(point.id)) {
      classes.push("qr-read");
    }

    if (point.id === runtime.expected_qr_id) {
      classes.push("qr-expected");
    }

    if (point.id === runtime.last_read_qr_id) {
      classes.push("qr-last");
    }
  }

  if (point.type === "gate") {
    classes.push(getGateClass(runtime.gate_status));
  }

  return classes.join(" ");
}

function getGateClass(status: GateStatus): string {
  switch (status) {
    case "WAITING_PERMISSION":
      return "gate-waiting";

    case "PERMISSION_GRANTED":
    case "PASSING":
    case "PASSED":
      return "gate-ok";

    case "ERROR":
      return "gate-error";

    case "IDLE":
    default:
      return "gate-idle";
  }
}

export function FactoryMapPanel({
  runtimeStatus,
  debug = true,
  interactive = false,
  selectedPointIds = [],
  selectablePointTypes = [],
  onPointClick,
}: Props) {
  const [lastClick, setLastClick] = useState<{ x: number; y: number } | null>(
    null
  );

  const pointMap = useMemo(() => {
    return new Map(mapPoints.map((point) => [point.id, point]));
  }, []);
  const robotPosition = getRobotPosition(runtimeStatus);
  const trailPoints = getTrailPoints(runtimeStatus);

  const handleMapClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!debug) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const rounded = {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    };

    setLastClick(rounded);

    console.log(`Map coordinate → x: ${rounded.x}, y: ${rounded.y}`);
  };

  return (
    <div
      className={`card factory-map-card ${interactive ? "map-interactive" : ""}`}
    >
      <div className="card-title-row">
        <div>
          <h2>Fabrika Haritası / Görev Görselleştirme</h2>
          <p className="map-subtitle">
            Sabit harita üzerinde rota, QR, kapı ve görev durumları gösterilir.
          </p>
        </div>

        {debug && lastClick && (
          <div className="coord-badge">
            x: {lastClick.x}% · y: {lastClick.y}%
          </div>
        )}
      </div>

      <div
        className={`factory-map-frame ${interactive ? "is-interactive" : ""}`}
        onClick={handleMapClick}
      >
        {!runtimeStatus && !interactive && (
          <div className="map-overlay-message">
            <span>Canlı harita verisi bekleniyor…</span>
          </div>
        )}

        <img
          className="factory-map-image"
          src="/maps/factory-map-clean.png"
          alt="Fabrika haritası"
        />

        <svg
          className="factory-map-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {trailPoints && (
            <polyline
              className="robot-path-trail"
              points={trailPoints}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {routeSegments.map((segment, index) => {
            const from = pointMap.get(segment.from);
            const to = pointMap.get(segment.to);

            if (!from || !to) {
              return null;
            }

            return (
              <line
                key={`${segment.id}-${index}`}
                className={getSegmentClass(segment, runtimeStatus)}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              />
            );
          })}
        </svg>

        <div className="factory-map-points">
          {mapPoints.map((point) => {
            const isSelected = selectedPointIds.includes(point.id);

            // Logic: if selectablePointTypes is empty, all are selectable.
            // Otherwise, only those in the list are selectable.
            const isSelectable =
              selectablePointTypes.length === 0 ||
              selectablePointTypes.includes(point.type);

            const pointClasses = getPointClass(
              point,
              runtimeStatus,
              interactive,
              isSelected,
              isSelectable
            );

            const finalClasses = !isSelectable
              ? `${pointClasses} not-selectable`
              : pointClasses;

            return (
              <div
                key={point.id}
                className={finalClasses}
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                }}
                title={`${point.id} - ${point.type}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (interactive && isSelectable && onPointClick) {
                    onPointClick(point.id);
                  }
                }}
              >
                <span>{point.label}</span>
              </div>
            );
          })}

          {robotPosition && <RobotMarker position={robotPosition} />}
        </div>
      </div>

      <MapLegend />
    </div>
  );
}

function RobotMarker({
  position,
}: {
  position?: { x: number; y: number; heading_deg?: number | null };
}) {
  if (!position) {
    return null;
  }

  const markerRotation =
    typeof position.heading_deg === "number" && Number.isFinite(position.heading_deg)
      ? `rotate(${position.heading_deg + 90}deg)`
      : undefined;

  return (
    <div
      className="robot-marker-shell"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
      title="Robot konumu"
    >
      <div className="robot-marker" style={{ transform: markerRotation }}>
        ▲
      </div>
    </div>
  );
}


function MapLegend() {
  return (
    <div className="map-legend">
      <span>
        <i className="legend-dot active" /> Aktif rota
      </span>

      <span>
        <i className="legend-dot completed" /> Tamamlandı
      </span>

      <span>
        <i className="legend-dot expected" /> Beklenen QR
      </span>

      <span>
        <i className="legend-dot read" /> Okunan QR
      </span>

      <span>
        <i className="legend-dot gate" /> Kapı / PLC
      </span>

      <span>
        <i className="legend-dot robot" /> Robot
      </span>
    </div>
  );
}
