# Mock Robot Backend

Bu dizin, GUI backend'in `RealRobotBackendClient` üzerinden yaptığı istekleri simüle etmek için kullanılan bir mock sunucudur. Gerçek robot backend hazır olana kadar geliştirme ve test süreçlerini hızlandırmak amacıyla oluşturulmuştur.

## Çalıştırma

### 1. Terminal: GUI Backend
```bash
# Proje ana dizininden:
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# VEYA direkt venv yoluyla:
./venv/bin/uvicorn app.main:app --reload --port 8000
```

### 2. Terminal: Mock Robot Backend
```bash
# Proje ana dizininden:
source venv/bin/activate
uvicorn mock_robot_backend.main:app --reload --port 9000

# VEYA direkt venv yoluyla:
./venv/bin/uvicorn mock_robot_backend.main:app --reload --port 9000
```

## Yapılandırma (.env)

Gerçek robot entegrasyonunu test etmek için `.env` dosyanızı aşağıdaki gibi güncelleyin:

```env
ROBOT_CLIENT_MODE=real
ROBOT_BACKEND_URL=http://localhost:9000
```

## Özellikler

- **In-memory State**: Manuel kontrol ve acil stop durumları bellekte tutulur.
- **Contract Uyumu**: `docs/robot-backend-contract.md` dosyasındaki tüm endpointler ve veri yapıları ile uyumludur.
- **Dinamik Davranış**: 
  - `POST /emergency-stop` çağrıldığında `/state` üzerinde `emergency_stop: true` döner ve alerts listesine kritik hata eklenir.
  - `POST /manual/enable` çağrıldığında `/manual/status` üzerinde `MANUAL/ACTIVE` durumu döner.
