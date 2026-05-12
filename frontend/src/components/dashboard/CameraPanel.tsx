import { useState } from "react";
import type { CameraStatus } from "../../types/dashboard";

interface Props {
  status: CameraStatus;
}

export function CameraPanel({ status }: Props) {
  const isMJPEG = status.stream_type === "MJPEG";
  const isWebRTC = status.stream_type === "WEBRTC";
  
  const baseUrl = import.meta.env.VITE_GUI_BACKEND_HTTP_URL || "";
  const streamUrl = status.stream_url?.startsWith("/") 
    ? `${baseUrl}${status.stream_url}` 
    : status.stream_url;

  const hasStream = status.enabled && status.connected && streamUrl;

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  let indicatorText = "BAĞLANTI YOK";
  let indicatorClass = "offline";

  if (status.connected) {
    if (imageLoaded && !imageError) {
      indicatorText = "CANLI";
      indicatorClass = "online";
    } else if (imageError) {
      indicatorText = "GÖRÜNTÜ HATASI";
      indicatorClass = "offline";
    } else {
      indicatorText = "BAĞLANTI BEKLENİYOR...";
      indicatorClass = "offline";
    }
  }

  return (
    <div className="card camera-panel">
      <div className="card-header">
        <div className="title-row">
          <h2>Kamera Görüntüsü (MVP)</h2>
          {status.latency_ms !== null && (
            <span className="latency-badge">
              {status.latency_ms}ms
            </span>
          )}
        </div>
        <div className={`status-indicator ${indicatorClass}`}>
          {indicatorText}
        </div>
      </div>

      <div className="camera-viewport">
        {!status.enabled ? (
          <div className="camera-overlay disabled">
            <span className="icon">🚫</span>
            <p>Kamera Devre Dışı</p>
          </div>
        ) : !status.connected ? (
          <div className="camera-overlay disconnected">
            <span className="icon">📡</span>
            <p>Bağlantı Bekleniyor...</p>
            {status.message && <small>{status.message}</small>}
          </div>
        ) : !hasStream ? (
          <div className="camera-overlay empty">
            <span className="icon">📷</span>
            <p>Görüntü Akışı Yok</p>
          </div>
        ) : isMJPEG ? (
          <>
            {imageError && (
              <div className="camera-overlay error">
                <span className="icon">⚠️</span>
                <p>Kamera görüntüsü alınamıyor</p>
                <small>Akış bağlantısı başarısız oldu.</small>
              </div>
            )}
            <img 
              src={streamUrl!} 
              alt="Robot Camera Stream" 
              className="stream-image"
              style={{ display: imageError ? 'none' : 'block' }}
              onLoad={() => {
                setImageLoaded(true);
                setImageError(false);
              }}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
                console.error("Camera stream error");
              }}
            />
          </>
        ) : isWebRTC ? (
          <div className="camera-overlay webrtc-placeholder">
            <span className="icon">⚡</span>
            <p>WebRTC Desteği Yakında</p>
            <small>Düşük gecikmeli akış için çalışma devam ediyor.</small>
          </div>
        ) : (
          <div className="camera-overlay unknown">
            <p>Bilinmeyen Akış Türü</p>
          </div>
        )}
      </div>

      {status.message && status.connected && (
        <div className="camera-footer">
          <p className="camera-msg">{status.message}</p>
        </div>
      )}
    </div>
  );
}
