# Forklift Robot GUI

Sanayide Robotik Uygulamalar yarışması için geliştirilen **forklift robot operatör arayüzü** projesidir. Sistem; robotun durumunu, görev ilerlemesini, QR verilerini, PLC haberleşmesini, kamera görüntüsünü ve manuel kontrol durumunu tek bir dashboard üzerinden izlemek ve yönetmek için tasarlanmıştır.

Bu proje robotun ana kontrol yazılımı değildir. Robotun kendi backend’i ayrı çalışır. Bu uygulama, robot backend ile operatör arayüzü arasında çalışan bir **GUI Backend + React Frontend** mimarisidir.

---

## Mimari

```txt
React Frontend
      │
      │ REST + WebSocket
      ▼
FastAPI GUI Backend
      │
      │ HTTP / WebSocket / Proxy
      ▼
Robot Backend / Mock Robot Backend
      │
      ▼
PLC / QR / Motor / Kamera / Sensör / Robot logic
```

Frontend hiçbir zaman robot backend’e doğrudan bağlanmaz. Tüm trafik GUI Backend üzerinden geçer.

```txt
Frontend              → GUI Backend :8000
GUI Backend           → Robot / Mock Backend :9000
Camera stream proxy   → /api/camera/stream
Dashboard WebSocket   → /ws/dashboard
Manual control WS     → /ws/manual-control
```

---

## Ana Özellikler

- Operatör dashboard ekranı
- Fabrika haritası üzerinde robot, rota, QR ve kapı durumlarının gösterimi
- Harita üzerinden rota tanımlama
- Aktif rota seçimi
- Robot görev durumu takibi
- QR okuma olayları
- PLC mesajları ve teknik PLC logları
- Kamera görüntüsü için GUI Backend proxy altyapısı
- Gamepad/manual control WebSocket altyapısı
- Deadman switch, E-Stop, watchdog ve single-session güvenlikleri
- Fake mode ve real + mock backend mode desteği
- Dokümante edilmiş robot backend ve WebSocket sözleşmeleri

---

## Klasör Yapısı

```txt
forklift-robot-gui/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── clients/
│   │   ├── core/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── ws/
│   ├── mock_robot_backend/
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── package.json
│
├── docs/
│   ├── robot-backend-contract.md
│   ├── websocket-contract.md
│   ├── manual-control-safety.md
│   └── operator-demo-flow.md
│
└── README.md
```

---

## Gereksinimler

Backend için:

```txt
Python 3.12+
FastAPI
Uvicorn
httpx
pydantic
```

Frontend için:

```txt
Node.js
npm
React
TypeScript
Vite
```

---

## Kurulum

### 1. Backend ortamı

Proje kök dizinindeyken:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

### 2. Frontend bağımlılıkları

```bash
cd frontend
npm install
```

---

## NPM Scriptleri

Proje kök dizininden aşağıdaki komutlar çalıştırılabilir:

| Komut | Ne açar? | Ne zaman kullanılır? |
| --- | --- | --- |
| `npm run help` | Kullanılabilir root komutlarını ve açıklamalarını terminale yazar. | Hangi modun ne işe yaradığını hızlıca görmek için kullanılır. |
| `npm run dev:fake` | React frontend + GUI Backend açılır. Robot backend gerekmez; GUI Backend fake client ile çalışır. | Hızlı UI/fake data testi, dashboard geliştirme ve robot backend olmadan deneme için kullanılır. Digital Twin Demo Mode gerçekçi şekilde burada çalışmayabilir. |
| `npm run dev:mock` | Mock Robot Backend `:9000`, GUI Backend `:8000` ve frontend `:5173` açılır. GUI Backend `ROBOT_CLIENT_MODE=real` ve `ROBOT_BACKEND_URL=http://localhost:9000` ile çalışır. | Entegrasyon testi ve Digital Twin Demo Mode için önerilir. Demo sekmesindeki **Demo Görevini Başlat** bu modda kullanılmalıdır. |
| `npm run frontend:dev` | Sadece React frontend dev server açılır. | Backend zaten çalışırken yalnızca frontend geliştirmek için kullanılır. |
| `npm run backend:fake` | Sadece GUI Backend fake mode ile açılır. | Frontend’i ayrı çalıştırıp GUI Backend’i fake data ile test etmek için kullanılır. |
| `npm run mock:backend` | Sadece Mock Robot Backend `:9000` portunda açılır. | GUI Backend veya entegrasyon akışlarını mock robot servisine karşı denemek için kullanılır. |
| `npm run backend:mock` | Sadece GUI Backend real mode’da, mock backend’e bağlı şekilde açılır. | Mock Robot Backend zaten çalışırken GUI Backend entegrasyonunu test etmek için kullanılır. |
| `npm run build` | Frontend production build çalıştırır; backend için `python compileall` ve ana modül import kontrolü yapar. | Demo veya teslim öncesi frontend build + backend syntax/import check doğrulaması için kullanılır. |
| `npm run check` | Şimdilik `npm run build` ile aynı kontrolleri çalıştırır. | Demo öncesi hızlı doğrulama komutu olarak kullanılır. |

Kısa özet:

- `dev:fake` = hızlı UI/fake data testi
- `dev:mock` = mock backend + GUI backend + frontend; Digital Twin Demo Mode için önerilir
- `build` = frontend build + backend compile/import check

---

## Environment Ayarları

Root veya backend tarafında `.env` kullanılabilir.

Örnek backend ayarları:

```env
ROBOT_CLIENT_MODE=fake
ROBOT_BACKEND_URL=http://localhost:9000
ROBOT_BACKEND_TIMEOUT_SECONDS=2.0
FRONTEND_ORIGIN=http://localhost:5173
```

Frontend için `frontend/.env.example` dosyasına göre `.env` oluşturulabilir:

```env
VITE_GUI_BACKEND_HTTP_URL=http://localhost:8000
VITE_GUI_BACKEND_WS_URL=ws://localhost:8000/ws/dashboard
VITE_GUI_BACKEND_MANUAL_WS_URL=ws://localhost:8000/ws/manual-control
```

`.env` dosyaları git’e eklenmemelidir.

---

## Çalıştırma Modları

### 1. Fake Mode

Bu modda ayrı robot backend gerekmez. GUI Backend kendi fake verisini üretir.

Terminal 1:

```bash
cd backend
source ../venv/bin/activate
ROBOT_CLIENT_MODE=fake uvicorn app.main:app --reload --port 8000
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Frontend:

```txt
http://localhost:5173
```

---

### 2. Real + Mock Backend Mode

Bu modda GUI Backend, gerçek robot backend yerine mock robot backend ile haberleşir. Entegrasyon testi için önerilir.

Terminal 1 — Mock Robot Backend:

```bash
cd backend
source ../venv/bin/activate
uvicorn mock_robot_backend.main:app --reload --port 9000
```

Terminal 2 — GUI Backend:

```bash
cd backend
source ../venv/bin/activate
ROBOT_CLIENT_MODE=real ROBOT_BACKEND_URL=http://localhost:9000 uvicorn app.main:app --reload --port 8000
```

Terminal 3 — Frontend:

```bash
cd frontend
npm run dev
```

Kontrol endpointleri:

```txt
http://localhost:9000/health
http://localhost:8000/api/health/robot-backend
http://localhost:8000/api/dashboard/snapshot
http://localhost:5173
```

---

## Dashboard İçeriği

Operatör dashboard ekranında şu bilgiler izlenir:

- Robot bağlantı durumu
- Batarya, hız ve yük bilgisi
- Fabrika haritası ve robot konumu
- Aktif rota ve görev ilerlemesi
- Kamera görüntüsü
- Hata ve uyarılar
- QR okuma olayları
- PLC mesajları
- Teknik PLC logları
- Manuel kontrol ve gamepad durumu

---

## Rota Tanımlama

Rota tanımlama ekranında kullanıcı:

1. **Haritadan Rota Oluştur** butonuna basar.
2. A noktalarından bir alma noktası seçer: `A1`, `A2`, `A3`.
3. B noktalarından bir bırakma noktası seçer: `B1`, `B2`, `B3`.
4. Sistem segmentleri ve QR sırasını otomatik hesaplar.
5. Rota kaydedilir.
6. İstenirse **Aktif Rota Yap** ile dashboard’a taşınır.

Başlangıç noktası kullanıcı tarafından seçilmez; `START` sabittir.

---

## Manuel Kontrol

Manuel kontrol akışı:

```txt
Gamepad
   ↓
React Frontend
   ↓ /ws/manual-control
FastAPI GUI Backend
   ↓
Robot Backend
```

Güvenlik kuralları:

- Fiziksel anahtar `MANUAL` değilse hareket komutları reddedilir.
- Deadman butonu basılı değilse hareket komutu kabul edilmez.
- E-Stop aktifken tüm hareket komutları reddedilir.
- Backend tarafında hız değerleri clamp edilir.
- 500 ms boyunca komut gelmezse watchdog robotu durdurur.
- WebSocket koparsa safety stop komutu gönderilir.
- Aynı anda yalnızca bir manuel kontrol oturumuna izin verilir.

Detaylar için: `docs/manual-control-safety.md`

---

## Kamera

Kamera görüntüsü doğrudan robot backend’den alınmaz. Frontend yalnızca GUI Backend proxy endpointine bağlanır:

```txt
GET /api/camera/stream
```

Akış:

```txt
Frontend
   ↓
GUI Backend /api/camera/stream
   ↓
Robot Backend /camera/stream
```

İlk MVP’de MJPEG proxy desteklenir. WebRTC sonraki aşama için placeholder olarak bırakılmıştır.

---

## Dokümantasyon

Önemli dokümanlar:

- `docs/robot-backend-contract.md`: Robot backend’in sağlaması gereken endpoint ve JSON yapılarını açıklar.
- `docs/websocket-contract.md`: Dashboard ve manuel kontrol WebSocket sözleşmelerini açıklar.
- `docs/manual-control-safety.md`: Manuel kontrol güvenlik mimarisini ve ilk fiziksel test prosedürünü açıklar.
- `docs/operator-demo-flow.md`: Demo sırasında izlenecek çalıştırma ve test adımlarını açıklar.

---

## Gerçek Robot Entegrasyonu İçin Gerekli Noktalar

Gerçek robot backend bağlanırken aşağıdaki endpointlerin contract ile uyumlu olması gerekir:

```txt
GET  /state
GET  /task/status
GET  /map/runtime
GET  /manual/status
POST /manual/command
GET  /camera/status
GET  /camera/stream
GET  /plc/status
GET  /plc/messages
GET  /plc/logs
GET  /qr/events
GET  /alerts
```

Gerçek entegrasyon sırasında özellikle şunlar doğrulanmalıdır:

- JSON alan adları Pydantic schema’larla uyumlu mu?
- `vx`, `omega`, `lift` komutları robot backend tarafından doğru yorumlanıyor mu?
- Fiziksel manuel anahtar bilgisi gerçek donanımdan geliyor mu?
- Kamera stream’i MJPEG/WebRTC olarak çalışıyor mu?
- PLC mesajları UI’da okunabilir formatta geliyor mu?
- QR okuma ve harita runtime verileri doğru güncelleniyor mu?

---

## İlk Fiziksel Test Uyarısı

Gerçek robot üzerinde ilk testler yapılırken:

- Robot düşük hız limitlerinde çalıştırılmalıdır.
- Tekerlekler mümkünse askıya alınmalıdır.
- Fiziksel E-Stop operatörün elinin altında olmalıdır.
- Deadman bırakıldığında robotun durduğu doğrulanmalıdır.
- WebSocket kopunca safety stop çalıştığı doğrulanmalıdır.
- E-Stop aktifken komutların reddedildiği doğrulanmalıdır.

Bu yazılım güvenlik katmanları, gerçek motor sürücü, frenleme ve donanımsal E-Stop testlerinin yerine geçmez.

---

## Git Notları

Aşağıdaki dosyalar commitlenmemelidir:

```txt
.env
backend/.env
frontend/.env
node_modules/
venv/
.venv/
__pycache__/
.DS_Store
*.dmg
```

Örnek `.env` dosyaları commitlenebilir:

```txt
.env.example
backend/.env.example
frontend/.env.example
```

---

## Durum

Proje şu an fake mode ve real + mock backend mode ile demo/test çalıştırmaya uygundur. Gerçek robot entegrasyonu için robot backend’in `docs/robot-backend-contract.md` dosyasındaki sözleşmeye uyması gerekir.
