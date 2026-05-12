# Forklift Robot GUI - Operatör Demo Akışı

Bu doküman, sistemin demonstrasyon ve test süreçleri için izlenmesi gereken adımları, temel özellikleri ve dikkat edilmesi gereken noktaları içerir.

## 1. Sistemi Başlatma Sırası

Sistemin düzgün çalışması için bileşenlerin aşağıdaki sırayla başlatılması önerilir:

1.  **Mock Robot Backend (Port 9000):** Robot donanımını ve ana kontrolcü yazılımını simüle eder.
2.  **GUI Backend (Port 8000):** Ana API sunucusu ve WebSocket koordinatörüdür.
3.  **Frontend (Port 5173):** Operatör kontrol paneli arayüzüdür.

## 2. Çalıştırma Komutları

### A. Fake Mode (Tam Simülasyon)
Hiçbir robot backend'ine ihtiyaç duymadan, GUI Backend içinde üretilen rastgele verilerle çalışır. UI testleri için uygundur.
```bash
# Backend
cd backend
ROBOT_CLIENT_MODE=fake uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm run dev
```

### B. Real + Mock Backend Mode (Entegrasyon Testi)
GUI Backend, ayrı bir süreç olarak çalışan Mock Robot Backend ile haberleşir. Donanım entegrasyonu testi için en yakın moddur.
```bash
# 1. Terminal: Mock Robot Backend
cd backend
uvicorn mock_robot_backend.main:app --reload --port 9000

# 2. Terminal: GUI Backend
cd backend
ROBOT_CLIENT_MODE=real ROBOT_BACKEND_URL=http://localhost:9000 uvicorn app.main:app --reload --port 8000

# 3. Terminal: Frontend
cd frontend
npm run dev
```

## 3. Operatör Dashboard Takibi

Dashboard ana ekranında aşağıdaki bileşenler anlık olarak izlenir:
-   **Fabrika Haritası:** Robotun konumu, aktif rotası ve QR istasyonları.
-   **Görev Durumu:** Mevcut görevin aşaması, ilerleme yüzdesi ve kalan süre.
-   **Aktif Rota:** "Haritadan Rota Oluştur" sayfasında seçilen ve o an uygulanan rota özeti.
-   **Kamera (MVP):** Robot üzerindeki kameradan gelen canlı görüntü (MJPEG proxy).
-   **Manuel Kontrol Durumu:** Fiziksel anahtarın konumu, remote yetkisi ve aktif kumanda kaynağı.
-   **Alert Panel:** Sistemdeki kritik uyarılar ve hata mesajları.
-   **Alt Feed Panelleri:** QR okuma olayları, PLC mesajları ve teknik loglar.

## 4. Rota Tanımlama Akışı

1.  "Haritadan Rota Oluştur" sekmesine geçin.
2.  Başlangıç noktasının sabit (**START**) olduğunu doğrulayın.
3.  Harita üzerinden bir **Alma Noktası (A1, A2 veya A3)** seçin.
4.  Harita üzerinden bir **Bırakma Noktası (B1, B2 veya B3)** seçin.
5.  Sistem, START -> Alma -> Bırakma rotasını otomatik hesaplar.
6.  Rotaya bir isim verip **Kaydet** butonuna basın.
7.  Kaydedilen rotayı listeden bulun ve **Aktif Rota Yap** butonuna tıklayarak Dashboard'a gönderin.

## 5. Manuel Kontrol / Gamepad Test Akışı

1.  **Yetki Kontrolü:** Mock backend üzerinden fiziksel anahtarın `MANUAL` konumuna alındığından emin olun.
2.  **Gamepad Bağlantısı:** USB veya Bluetooth üzerinden bir gamepad bağlayın. "Gamepad Bağlı" uyarısını görün.
3.  **Deadman Switch:** Gamepad üzerindeki Deadman butonuna (A/Cross) basılı tutun.
4.  **Komut Gönderimi:** Analog çubuklar ile hız ve yön komutları gönderin.
5.  **ACK/Reject Takibi:** Dashboard'daki manuel kontrol panelinde komutların kabul edildiğini (✓) veya reddedilme sebebini (✗) izleyin.
    -   *AUTO* moddayken komut göndererek reddedildiğini doğrulayın.
    -   *E-Stop* aktifken komut göndererek reddedildiğini doğrulayın.

## 6. E-Stop Test Akışı

1.  Dashboard üzerindeki veya donanımdaki E-Stop butonuna basın.
2.  Tüm ekranın kırmızı "ACİL STOP" bandıyla kaplandığını görün.
3.  PLC Mesaj ekranında "ERROR / E-Stop Active" mesajının düştüğünü kontrol edin.
4.  E-Stop basılıyken manuel veya otonom hiçbir komutun işlenmediğini doğrulayın.
5.  Reset butonu ile sistemi normale döndürün.

## 7. Kamera Test Akışı

1.  Camera Panel üzerindeki "CANLI" ibaresini ve gecikme (ms) değerini kontrol edin.
2.  **Güvenlik Kontrolü:** Tarayıcı network sekmesinde 9000 portuna doğrudan istek gitmediğini, tüm trafiğin GUI Backend'in `/api/camera/stream` endpoint'i üzerinden geçtiğini doğrulayın.

## 8. PLC Mesaj Ekranı

Bu panel, operasyonel süreçteki mesajlaşmaları gösterir:
-   **Robot → PLC:** "Durum Bildirimi / Görev Tamamlandı" vb.
-   **PLC → Robot:** "Görev Atama / Kapı Açıldı" vb.
-   **Kapı İzin Talebi/Yanıtı:** Kritik kavşak ve kapı geçiş izinleri.
-   **Fark:** "Teknik PLC Logları" detaylı debug bilgisi içerirken, bu panel sadece alınıp verilen anlamlı paketleri gösterir.

## 9. Demo Başarı Kriterleri

-   WebSocket bağlantısının kopmadan devam etmesi (10Hz akış).
-   E-Stop durumunun tüm backend ve frontend katmanlarında senkronize olması.
-   Manuel kontrolde Deadman bırakıldığı anda robotun durması.
-   GUI Backend'in, robot backend kapansa bile operatöre anlamlı hata mesajları göstermesi.
-   **Kamera Proxy:** Frontend'in 9000 portuna doğrudan gitmediğinin, 8000 üzerinden proxy yayını aldığının doğrulanması.
-   **PLC Mesaj Ayrımı:** Robot -> PLC (Mavi) ve PLC -> Robot (Yeşil) renk ayrımlarının panelde doğru görünmesi.

## 10. Bilinen Sınırlamalar ve Uyarılar

-   **Kamera:** Mevcut sürüm MJPEG proxy (MVP) kullanır; yüksek performanslı WebRTC bir sonraki aşamada eklenecektir.
-   **Saha Testi:** Tüm testler mock backend ile yapılmıştır. Gerçek robot, PLC ve kamera donanımları ile saha testi şarttır.
-   **Güvenlik:** İlk fiziksel sürüşler mutlaka tekerlekler askıdayken veya çok düşük hız limitlerinde yapılmalıdır.
-   **Contract:** Gerçek robot yazılımı `docs/robot-backend-contract.md` dosyasındaki API yapısına birebir uymalıdır.
