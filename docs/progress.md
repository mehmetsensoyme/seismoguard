# Proje Geliştirme Notları

Bu dosya, proje üzerinde yapılan değişikliklerin ve alınan kararların bir özetini içermektedir.

## Tamamlanan Görevler

1.  **"CANLI" Göstergesi ve Ayarlar Düğmesinin Hizalanması:**
    *   **Uygulama:** `style.css` dosyası düzenlenerek `header-right` sınıfına `display: flex` özelliği eklendi.

2.  **GPS (Yeniden Merkezleme) Düğmesinin Panel ile Senkronize Hareketi:**
    *   **Uygulama:** `recenter-btn`, CSS `transition` ve `calc()` kullanılarak panel hareketiyle senkronize edildi.

3.  **Veri Entegrasyonları ve Simülasyon İyileştirmeleri (v0.5 beta):**
    *   **AFAD Entegrasyonu:** AFAD veri kaynağı eklendi.
    *   **Kandilli Düzeltmesi:** Kandilli API veri yapısı güncellendi.
    *   **Gerçekçi Simülasyon:** Simülasyon artık harita hareketi ve alarm gecikmesi içeriyor.

4.  **Profesyonel Arayüz ve Bilimsel Özellikler (v0.6 beta):**
    *   **Radar Konum İkonu:** Sabit nokta yerine, etrafı tarayan animasyonlu "Radar/Sonar" ikonu eklendi.
    *   **Tektonik Levhalar:** Haritaya bilimsel "Tektonik Levha Sınırları" katmanı eklendi (Kırmızı kesik çizgiler).
    *   **S-Dalgası Tahmini:** Deprem detay popup'ına, kullanıcının konumuna göre yıkıcı dalgaların (S-Wave) varış süresini hesaplayan bilimsel analiz eklendi.
    *   **Canlı İstatistikler:** Header kısmına son 24 saatteki maksimum büyüklük ve toplam deprem sayısını gösteren kayan bant eklendi.

5.  **Gelişmiş Filtreleme ve Kritik Mod (v0.7 beta):**
    *   **Çift Dalga Animasyonu:** P (Sarı - Hızlı) ve S (Kırmızı - Yavaş) dalgalarının yayılımını gösteren çift katmanlı animasyon eklendi.
    *   **Gelişmiş Filtre Menüsü:** Tarih aralığı (1s/12s/24s), Minimum Büyüklük ve Tarama Menzili için detaylı filtreleme modalı oluşturuldu.
    *   **Kritik Alarm Modu:** Büyüklüğü 6.0 ve üzeri depremlerde arayüzün otomatik olarak "Kırmızı Alarm" temasına geçmesi sağlandı.
    *   **Kararlılık İyileştirmeleri:** Veri çekme işlemlerine "Timeout" (Zaman Aşımı) eklendi. Konum bulunamazsa varsayılan konuma düşme (Fallback) mekanizması güçlendirildi. Yükleme ekranı (Skeleton) optimize edildi.
