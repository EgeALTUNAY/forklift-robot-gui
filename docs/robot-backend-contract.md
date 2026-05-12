# Robot Backend API Contract

GUI backend, robot backend ile aşağıdaki REST endpointleri üzerinden haberleşir. Tüm endpointler JSON formatında veri alışverişi yapar.

## Endpointler

### GET /state
Robotun anlık durumunu döndürür.
**Schema**: `RobotState`
```json
{
  "mode": "IDLE",
  "battery_percent": 87.5,
  "speed_mps": 0.12,
  "load_detected": false,
  "emergency_stop": false,
  "connection_ok": true,
  "timestamp": "2026-05-11T12:30:00Z"
}
```

### GET /task/status
Mevcut görev durumunu döndürür.
**Schema**: `TaskStatus`

### GET /map/runtime
Harita çalışma zamanı durumunu (aktif segmentler, okunan QR'lar vb.) döndürür.
**Schema**: `MapRuntimeStatus`

### GET /qr/events?limit=10
Son QR okuma olaylarını listeler.
**Schema**: `list[QrEvent]`

### GET /plc/logs?limit=10
Son PLC loglarını listeler.
**Schema**: `list[PlcLog]`

### GET /plc/status
PLC'nin anlık bağlantı ve çalışma durumunu döndürür.
**Schema**: `PlcStatus`
```json
{
  "connected": true,
  "cpu_status": "RUN",
  "last_heartbeat": "2026-05-11T12:30:00Z",
  "error_count": 0
}
```

### GET /plc/messages?limit=20
PLC'den gelen sistem mesajlarını listeler.
**Schema**: `list[PlcMessage]`

### GET /alerts?limit=20
Aktif veya son uyarıları listeler.
**Schema**: `list[AlertItem]`

### GET /manual/status
Manuel kontrol durumunu döndürür.
**Schema**: `ManualControlStatus`

### GET /camera/status
Kamera bağlantı ve yayın durumunu döndürür.
**Schema**: `CameraStatus`
```json
{
  "enabled": true,
  "stream_url": "http://192.168.1.50/mjpeg",
  "stream_type": "MJPEG",
  "connected": true,
  "latency_ms": 35,
  "message": "Kamera sistemi aktif."
}
```

> [!IMPORTANT]
> Frontend, robotun `stream_url` bilgisine doğrudan erişmez. GUI Backend, güvenliği sağlamak için bu yayını `/api/camera/stream` üzerinden proxy eder.



## Aksiyonlar (POST)

### POST /manual/enable
Manuel modu aktif eder.
**Response**: `{ "success": boolean }`

### POST /manual/disable
Manuel modu pasif eder.
**Response**: `{ "success": boolean }`

### POST /manual/command
Manuel hareket komutu gönderir.
**Body**: `ManualControlCommand`
**Response**: `{ "success": boolean }`

### POST /emergency-stop
Acil durdurmayı tetikler.
**Response**: `{ "success": boolean }`

### POST /release-emergency-stop
Acil durdurmayı resetler.
**Response**: `{ "success": boolean }`

## Ortak Kurallar
- Tüm endpointler `application/json` kabul eder ve döner.
- Hata durumlarında standart HTTP status kodları (4xx, 5xx) kullanılır.
- GUI Backend, robot backend'e erişemezse "fallback" (fake veri veya null) moduna geçer.