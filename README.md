# SeismoGuard Pro v0.7 beta

[English](#english) | [Türkçe](#türkçe)

---

<a name="english"></a>
## 🇬🇧 English User Manual & Release Notes

### Project Overview
**SeismoGuard Pro** is a sophisticated, real-time seismic monitoring application designed to provide users with up-to-the-minute earthquake data from multiple global sources (Kandilli, USGS, EMSC, AFAD). It combines scientific analysis with a modern, user-friendly interface to keep you informed and safe.

### Key Features
*   **Multi-Source Data:** Aggregates data from major seismic observatories for maximum accuracy.
*   **Interactive Map:** visualizes earthquakes on a dynamic map with tectonic plate boundaries.
*   **Real-Time Alerts:** Visual and audio alarms for significant seismic events within your range.
*   **Scientific Analysis:** Estimates S-Wave arrival times based on your location.
*   **Critical Alert Mode:** Automatically switches the interface to a high-contrast "Red Alert" theme for earthquakes with a magnitude of 6.0+.

### User Manual

#### 1. Getting Started
*   **Launch:** Open the application. On the start screen, click **"SİSTEMİ BAŞLAT" (START SYSTEM)**.
*   **Permissions:** Allow location access when prompted. This is crucial for calculating distances and S-Wave arrival times relative to your position.

#### 2. Main Interface
*   **Map View:** The center of the app. Earthquakes are shown as colored circles (Green < 4.0, Orange 4.0-6.0, Red > 6.0).
*   **Radar Icon:** Your location is marked with an animated radar/sonar icon.
*   **Stats Ticker:** Top header displays the highest magnitude and total earthquake count for the selected period.

#### 3. Filtering Data
*   Click the **Filter Icon** <i class="fas fa-filter"></i> in the top right.
*   **Time Range:** Select 1, 12, or 24 hours.
*   **Minimum Magnitude:** Filter by "All", "3.0+", or "5.0+".
*   **Scanning Range:** Use the slider to set the monitoring radius (50km - 5000km).

#### 4. Viewing Details
*   **List View:** Drag the bottom panel up (or click the handle) to see a list of recent earthquakes.
*   **Detail View:** Click on any earthquake marker or list item to open the **Detail Panel**. This shows:
    *   Magnitude, Depth, Time.
    *   S-Wave Estimation (Time until destructive waves reach you).
    *   Share and Google Maps buttons.

#### 5. Settings & Simulation
*   Click the **Settings Icon** <i class="fas fa-cog"></i> to:
    *   Change Theme (Light/Dark/System).
    *   Change Map Layer (Normal/Satellite).
    *   **"DEPREM SİMÜLASYONU" (Simulation):** Test the alarm system with a fake earthquake event.

---

### Recent Changes (v0.7 beta)

1.  **Dual-Wave Animation:** Added a visual simulation of P-Waves (Fast/Yellow) and S-Waves (Slow/Red) radiating from the epicenter.
2.  **Advanced Filter Menu:** A new dedicated modal for precise filtering of time, magnitude, and radius.
3.  **Critical Alert Mode:** The interface now automatically shifts to a red, high-contrast theme when a magnitude 6.0+ earthquake is detected.
4.  **Stability Improvements:**
    *   Added network timeouts to prevent hanging data requests.
    *   Improved fallback mechanisms if GPS location is unavailable.
    *   Optimized the skeleton loading screen for smoother transitions.

---
---

<a name="türkçe"></a>
## 🇹🇷 Türkçe Kullanım Kılavuzu ve Sürüm Notları

### Proje Özeti
**SeismoGuard Pro**, kullanıcılara birden fazla küresel kaynaktan (Kandilli, USGS, EMSC, AFAD) anlık deprem verileri sunmak için tasarlanmış gelişmiş bir sismik izleme uygulamasıdır. Bilimsel analizleri modern ve kullanıcı dostu bir arayüzle birleştirerek sizi bilgilendirir ve güvende tutar.

### Temel Özellikler
*   **Çoklu Veri Kaynağı:** Maksimum doğruluk için büyük sismik gözlemevlerinden verileri birleştirir.
*   **İnteraktif Harita:** Depremleri ve tektonik levha sınırlarını dinamik bir harita üzerinde görselleştirir.
*   **Gerçek Zamanlı Alarmlar:** Menzilinizdeki önemli sismik olaylar için görsel ve sesli alarmlar.
*   **Bilimsel Analiz:** Konumunuza bağlı olarak yıkıcı S-Dalgası varış sürelerini tahmin eder.
*   **Kritik Alarm Modu:** 6.0+ büyüklüğündeki depremler için arayüzü otomatik olarak yüksek kontrastlı "Kırmızı Alarm" temasına geçirir.

### Kullanım Kılavuzu

#### 1. Başlangıç
*   **Başlatma:** Uygulamayı açın. Karşılama ekranında **"SİSTEMİ BAŞLAT"** butonuna tıklayın.
*   **İzinler:** İstendiğinde konum erişimine izin verin. Bu, mesafelerin ve S-Dalgası varış sürelerinin doğru hesaplanması için kritiktir.

#### 2. Ana Arayüz
*   **Harita Görünümü:** Uygulamanın merkezi. Depremler renkli daireler olarak gösterilir (Yeşil < 4.0, Turuncu 4.0-6.0, Kırmızı > 6.0).
*   **Radar İkonu:** Sizin konumunuz animasyonlu bir radar/sonar ikonu ile işaretlenir.
*   **İstatistik Bandı:** Üst başlıkta, seçilen periyot için en yüksek büyüklük ve toplam deprem sayısı kayar yazı olarak gösterilir.

#### 3. Verileri Filtreleme
*   Sağ üstteki **Filtre İkonuna** <i class="fas fa-filter"></i> tıklayın.
*   **Zaman Aralığı:** 1, 12 veya 24 saat seçeneklerinden birini seçin.
*   **Minimum Büyüklük:** "Tümü", "3.0+" veya "5.0+" olarak filtreleyin.
*   **Tarama Menzili:** İzleme yarıçapını ayarlamak için sürgüyü kullanın (50km - 5000km).

#### 4. Detayları Görüntüleme
*   **Liste Görünümü:** Alt paneli yukarı sürükleyerek (veya tutamaca tıklayarak) son depremlerin listesini görün.
*   **Detay Paneli:** Herhangi bir deprem işaretçisine veya listedeki bir öğeye tıklayarak **Detay Paneli**ni açın. Bu panel şunları içerir:
    *   Büyüklük, Derinlik, Zaman.
    *   S-Dalgası Tahmini (Yıkıcı dalgaların size ulaşma süresi).
    *   Paylaş ve Google Haritalar butonları.

#### 5. Ayarlar ve Simülasyon
*   **Ayarlar İkonuna** <i class="fas fa-cog"></i> tıklayarak şunlara erişebilirsiniz:
    *   Tema Değiştirme (Açık/Koyu/Sistem).
    *   Harita Katmanı (Normal/Uydu).
    *   **"DEPREM SİMÜLASYONU":** Alarm sistemini sahte bir deprem olayı ile test edin.

---

### Son Değişiklikler (v0.7 beta)

1.  **Çift Dalga Animasyonu:** Merkez üssünden yayılan P-Dalgaları (Hızlı/Sarı) ve S-Dalgaları (Yavaş/Kırmızı) için görsel simülasyon eklendi.
2.  **Gelişmiş Filtre Menüsü:** Zaman, büyüklük ve menzil filtrelemesi için yeni ve detaylı bir menü penceresi oluşturuldu.
3.  **Kritik Alarm Modu:** 6.0 ve üzeri büyüklükte bir deprem algılandığında arayüz artık otomatik olarak kırmızı, yüksek kontrastlı bir temaya geçiş yapıyor.
4.  **Kararlılık İyileştirmeleri:**
    *   Veri isteklerinin takılmasını önlemek için zaman aşımı (timeout) eklendi.
    *   GPS konumu bulunamazsa devreye giren yedek mekanizmalar güçlendirildi.
    *   Yükleme ekranı (skeleton loading) daha akıcı geçişler için optimize edildi.
