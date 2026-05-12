# WebSocket Entegrasyon Sözleşmesi

Bu doküman, Frontend (Operatör Arayüzü) ile GUI Backend (Port 8000) arasındaki WebSocket tabanlı haberleşme standartlarını tanımlar.

**Kritik Kural:** Frontend hiçbir zaman doğrudan Robot veya Mock Backend'in (Port 9000) IP/Port bilgilerine erişmez. Tüm WebSocket, REST ve kamera trafiği sadece GUI Backend (Port 8000) üzerinden yönlendirilir.

---

## 1. Dashboard Haberleşmesi (`/ws/dashboard`)

Robotun anlık durumunun mevcut MVP'de yaklaşık 1 Hz hızında periyodik snapshot yayını olarak frontend'e basıldığı tek yönlü (Server -> Client) kanaldır. 

### Event Yapısı
Tüm mesajlar aşağıdaki JSON formatında gönderilir:
```json
{
  "type": "dashboard_snapshot",
  "payload": { ... }
}
```

### `dashboard_snapshot` Payload Alanları
Snapshot, sistemin o anki tam fotoğrafını içerir:
- `robot_state`: Hız, pil, mod ve E-Stop durumu.
- `plc_logs`: Sistemin teknik logları.
- `plc_messages`: Robot ve PLC arasındaki anlamlı iletişim (Görev, Kapı izni vb.).
- `qr_events`: Robotun okuduğu son QR etiketleri.
- `map_runtime_status`: Aktif segmentler, başlangıç/bitiş noktaları ve kapı durumları.
- `alerts`: Kritik uyarı ve hatalar.
- `task_status`: Mevcut görev aşaması, ilerleme yüzdesi ve kalan süre.
- `manual_control_status`: Fiziksel anahtar konumu ve uzaktan kontrol yetkisi.
- `camera_status`: Kamera proxy yayın linki ve bağlantı durumu.
- `ok`: Tüm verilerin başarıyla alınıp alınmadığını belirten boolean.
- `error`: Eğer veriler çekilemezse (örn: robot backend kapalıysa) gösterilecek hata metni.

---

## 2. Manuel Kontrol Haberleşmesi (`/ws/manual-control`)

Operatörün gamepad komutlarını 10 Hz (saniyede 10 kez) hızında GUI Backend'e ilettiği çift yönlü kanaldır.

### `ManualCommandFrame` (Client -> Server)
Frontend, her komut karesini aşağıdaki yapıyla iletir:
- `source`: Komutun kaynağı (`GAMEPAD`, `GUI_TEST` vb.).
- `seq`: İletilen paketin sıra numarası (0, 1, 2...).
- `timestamp`: Gönderim anının ISO 8601 zaman damgası.
- `deadman_pressed`: Gamepad üzerindeki "Deadman" butonunun o anki basılı olma durumu (boolean).
- `vx`: İleri/geri hız komutu (backend tarafında güvenli limitlere clamp edilir).
- `omega`: Sağ/sol dönüş komutu (backend tarafında güvenli limitlere clamp edilir).
- `lift`: Asansör aşağı/yukarı komutu (backend tarafında güvenli limitlere clamp edilir).

### `ManualCommandAck` (Server -> Client)
Backend, gelen her Frame'i değerlendirir ve aşağıdaki ACK (Onay/Red) paketini döner:
- `accepted`: Komutun robota iletilip iletilmediği (boolean).
- `reason`: Eğer reddedildiyse sebebi (örn: "Deadman butonu basılı değil", "E-Stop aktif").
- `seq`: Hangi pakete yanıt verildiğini belirten sıra numarası.
- `timestamp`: Yanıtın oluşturulduğu anın zaman damgası.

---

## 3. Reconnect ve REST Fallback Davranışı

- **Dashboard:** İlk açılışta REST snapshot alınır, `/ws/dashboard` bağlantısı koptuğunda frontend otomatik olarak yeniden bağlanmayı dener (Exponential Backoff); gerektiğinde REST fallback kullanılabilir.
- **Manual Control:** `/ws/manual-control` koparsa, bağlantı tamamen kesilir ve güvenlik gereği otomatik Reconnect yapılmaz. Operatörün tekrar manuel moda girmesi gerekir.

---

## 4. Güvenlik ve Emniyet Kısıtları

Manuel kontrol WebSocket altyapısı aşağıdaki güvenlik mekanizmalarıyla korunur:

- **Backend Validation:** Frontend'den gelen değerler (hız, açı) backend tarafından zorunlu `clamp` limitlerine tabi tutulur. Frontend'in filtreleri atlaması durumu engellenir.
- **Deadman Switch:** `deadman_pressed == false` içeren paketler kesinlikle reddedilir ve robota güvenlik amaçlı `0` hız komutu yollanır.
- **Watchdog (500 ms):** GUI Backend, 500 ms boyunca frontend'den yeni bir paket almazsa (Wi-Fi kopması vb.), robota anında "DUR" komutu gönderir.
- **Disconnect Safety Stop:** WebSocket bağlantısı herhangi bir nedenle sonlandığında, backend üzerindeki `finally` bloğu çalışarak robota acil durdurma sinyali gönderir.
- **Single Session Lock:** Güvenlik nedeniyle, aynı anda sadece tek bir WebSocket manuel kontrol oturumu açık kalabilir. İkinci bağlantılar anında reddedilir.
