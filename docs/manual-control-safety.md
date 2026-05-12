# Manuel Kontrol Güvenlik Mimarisi ve Prosedürleri

Bu doküman, forklift robotunun manuel kontrol (gamepad/kumanda) sisteminin güvenlik katmanlarını, çalışma mantığını ve test prosedürlerini detaylandırır. Sistem, "Önce Güvenlik" (Safety First) prensibiyle tasarlanmıştır.

## 1. Veri Akış Mimarisi

Manuel kontrol komutları aşağıdaki zinciri takip eder:
`Gamepad (Donanım) -> Frontend (Browser) -> GUI Backend (Python/FastAPI) -> Robot Backend (C++/ROS/Python)`

**Kritik Kural:** Frontend asla robotun kendi backend'ine (9000) doğrudan komut göndermez. Tüm komutlar GUI Backend'in güvenlik filtrelerinden geçmek zorundadır.

## 2. Güvenlik Katmanları

### A. Fiziksel Anahtar Şartı (Hardware Interlock)
Robotun üzerindeki fiziksel anahtar `MANUAL` konumunda değilse, yazılım üzerinden gönderilen hiçbir hareket komutu işleme alınmaz. Sistem, `physical_switch_position` bilgisini her pakette kontrol eder.

### B. Deadman Switch Mantığı
Operatörün aktif olarak robotu kontrol ettiğini kanıtlaması gerekir.
-   Gamepad üzerindeki **Deadman butonu (A/Cross)** basılı tutulmalıdır.
-   Buton bırakıldığı anda hız değerleri ne olursa olsun sistem anında robotu durdurur (`vx=0, omega=0`).

### C. E-Stop Önceliği
Yazılımsal veya fiziksel Acil Stop (E-Stop) aktif olduğu sürece, manuel kontrol modülü kilitlenir ve komutlar reddedilir. E-Stop resetlenmeden robot hareket ettirilemez.

### D. Backend-Side Clamping (Sınırlandırma)
Frontend'den gelen ham hız değerleri, GUI Backend tarafında donanımsal limitlere zorunlu olarak tabi tutulur:
-   **Max Hız (vx):** ±0.5 m/s
-   **Max Açısal Hız (w):** ±0.8 rad/s
-   **Max Asansör Komutu (lift):** ±0.3 normalize komut

### E. Komut Kabul Koşulları
Bir komutun robota iletilebilmesi için aşağıdaki tüm şartların eşzamanlı olarak sağlanması gerekir:
-   `physical_switch_position == MANUAL`
-   `remote_control_enabled == true`
-   `remote_control_state == ACTIVE`
-   `emergency_stop == false`
-   `deadman_pressed == true`
-   Değerlerin backend clamp sınırlarında veya clamp edilmiş olması.

### E. Watchdog Zamanlayıcısı (500ms)
Ağ kopması veya frontend donması durumunda robotun son aldığı komutla gitmesini engeller.
-   Eğer GUI Backend, son 500 ms içinde yeni bir kontrol paketi almazsa otomatik olarak robotu durdurur.

### F. WebSocket Disconnect Safety
Bağlantı koptuğunda (tarayıcı kapanması, Wi-Fi kopması vb.), backend tarafındaki `finally` bloğu devreye girerek robota emniyet amaçlı "Sıfır Hız" komutu gönderir.

### G. Single Session Lock (Tekil Oturum)
Aynı anda sadece tek bir operatörün robotu manuel kontrol etmesine izin verilir. İkinci bir operatör bağlanmaya çalıştığında reddedilir.

## 3. Geri Bildirim Mekanizması (ACK/Reject)

Her manuel komut paketi için backend'den anlık bir onay (ACK) döner:
-   **Accepted:** Komut tüm filtrelerden geçti ve robota iletildi.
-   **Rejected:** Komut reddedildi. Reddedilme sebebi operatör ekranında net bir şekilde gösterilir (örn: "E-Stop aktif", "Fiziksel anahtar AUTO konumda", "Deadman basılı değil").

## 4. İlk Fiziksel Test Güvenlik Prosedürü

Robot ilk kez fiziksel olarak hareket ettirileceğinde aşağıdaki adımlar izlenmelidir:

1.  **Askı Testi:** Robotun tahrik tekerleklerini yerden kesin (askıya alın).
2.  **Boşta Test (Fake Mode):** GUI Backend'i "Fake" modda (`ROBOT_CLIENT_MODE=fake`) çalıştırarak UI üzerinden komut akışını ve ACK/Reject mekanizmasını izleyin.
3.  **Entegrasyon Testi (Real+Mock Mode):** Mock robot backend (Port 9000) ile `ROBOT_CLIENT_MODE=real` modunda test ederek bağlantı ve güvenlik katmanlarının doğruluğunu teyit edin.
4.  **Düşük Hız:** Gerçek sürüşte hız limitlerini backend tarafında %10 seviyesine çekin.
4.  **Açık Alan:** Testi mutlaka geniş ve engelsiz bir alanda yapın.
5.  **E-Stop Hazırlığı:** Operatörün bir eli gamepad'de iken, diğer el fiziksel E-Stop butonunun üzerinde hazır beklemelidir.

## 5. Bilinen Sınırlamalar ve Uyarılar

-   **Donanım Testi Şarttır:** Yazılımsal güvenlik katmanları (GUI backend kontrolleri), gerçek motor sürücüleri, fren sistemleri ve donanımsal E-Stop devresinin saha testinin yerine geçmez. Yazılım onaylasa dahi fiziksel güvenlik her zaman önceliklidir.
-   **Ağ Gecikmesi:** WebSocket bağlantısı üzerinden kontrol yapıldığı için yüksek pingli (latency > 100ms) ağlarda kontrol hassasiyeti düşebilir.
-   **Wi-Fi Gücü:** Robotun Wi-Fi sinyalinin zayıf olduğu bölgelerde Watchdog sık sık devreye girerek robotu durdurabilir.
-   **Donanım Uyumu:** Gamepad mapping'i (eksenler) standart Xbox/Playstation kontrolcülerine göredir; farklı modellerde `useGamepadController` hook'unun revize edilmesi gerekebilir.
