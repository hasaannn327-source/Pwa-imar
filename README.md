# 🏗️ Gelişmiş İmar Hesaplayıcısı Pro

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)](https://developers.google.com/web/progressive-web-apps/)
[![Mobile Friendly](https://img.shields.io/badge/Mobile-Friendly-blue.svg)](https://search.google.com/test/mobile-friendly)

Türkiye'deki imar mevzuatına uygun, profesyonel imar hesaplamaları, 3D görselleştirme ve detaylı analizler sunan modern web uygulaması.

## 🚀 Özellikler

### ✅ **Temel Hesaplamalar**
- **TAKS/KAKS Hesaplamaları** - Doğru imar hesaplamaları
- **Çekme Mesafesi Analizi** - Dört yönden çekme hesabı
- **Kat Yükseklik Kontrolü** - Yasal sınırlar içinde hesaplama
- **Daire Sayısı Optimizasyonu** - Maksimum verimlilik analizi

### 🎨 **Görsel Özellikler**
- **3D Bina Görselleştirme** - İnteraktif bina modeli
- **🌙 Dark/Light Theme** - Otomatik tema değiştirme
- **🗺️ Çoklu Harita Sistemi** - Google Maps, OpenStreetMap ve Demo Harita desteği
- **Responsive Tasarım** - Mobil, tablet ve masaüstü uyumlu
- **Modern UI/UX** - Çağdaş ve kullanışlı tasarım

### 🔧 **Gelişmiş Özellikler**
- **Gelişmiş Validasyon** - Gerçek zamanlı hata kontrolü
- **Otopark Hesaplaması** - Daire başına otopark gereksinimi
- **Ortak Alan Analizi** - Sosyal ve ortak alan hesaplaması
- **Performans Analizi** - Verimlilik ve kullanım oranları

### 📱 **PWA Özellikleri**
- **Çevrimdışı Çalışma** - İnternet bağlantısı olmadan kullanım
- **Hızlı Yüklenme** - Service Worker ile cache desteği
- **Mobil Uygulama Deneyimi** - Ana ekrana ekleme özelliği
- **Push Notifications** - Hesaplama tamamlandığında bildirim

### 📊 **Export ve Paylaşım**
- **PDF Rapor** - Detaylı hesaplama raporu
- **Excel Export** - Tablo formatında veri çıktısı
- **Link Paylaşımı** - Sonuçları kolayca paylaşma

## 🛠️ Teknolojiler

- **Frontend**: Vanilla JavaScript ES6+ Modules, CSS3 Custom Properties
- **Architecture**: Modular Design Pattern, Class-based OOP
- **PWA**: Service Worker API, Web App Manifest, Offline Support
- **Maps**: Google Maps JavaScript API, Geocoding API
- **Modern APIs**: Web Share API, Clipboard API, Notification API, Geolocation API
- **Performance**: Lazy Loading, Memory Management, Advanced Cache Strategies
- **Validation**: Real-time Form Validation, Custom Validation Rules
- **Themes**: CSS Custom Properties, Local Storage Persistence

## 📱 Kullanım

### Temel Kullanım
1. **Arsa Bilgileri**: Arsa alanını, TAKS ve KAKS değerlerini girin
2. **Yapı Bilgileri**: Çekme mesafesi, kat sayısı ve daire alanını belirleyin
3. **Hesaplama**: "Detaylı Hesaplama Yap" butonuna tıklayın
4. **Sonuçlar**: 3 farklı sekmede detaylı sonuçları görüntüleyin

### Gelişmiş Ayarlar
- **Yapı Yükseklik Sınırı**: Bölgesel yükseklik kısıtlamaları
- **Otopark Katsayısı**: Daire başına gerekli otopark sayısı  
- **Ortak Alan Oranı**: Sosyal tesis ve ortak alan yüzdesi

### Sonuç Analizi
- **Özet**: Temel ölçümler ve 3D görselleştirme
- **Detay**: Kapsamlı hesaplama sonuçları
- **Analiz**: Performans metrikleri ve öneriler

## 🌐 Demo

**[🔗 Canlı Demo](https://yourusername.github.io/imar-hesaplayici-pro)**

## 💻 Kurulum

### GitHub Pages ile Yayınlama
```bash
# Repo'yu fork edin veya klonlayın
git clone https://github.com/yourusername/imar-hesaplayici-pro.git

# Klasöre girin
cd imar-hesaplayici-pro

# GitHub Pages'i aktifleştirin:
# Settings > Pages > Source: Deploy from branch > Branch: main
```

### Lokal Geliştirme
```bash
# HTTP server başlatın (ES6 modüller için gerekli)
npx http-server . -p 3000 -c-1

# Tarayıcıda açın
open http://localhost:3000
```

### 🗺️ Harita Sistemleri

Uygulama **3 farklı harita sistemi** destekler ve otomatik olarak en uygun olanını seçer:

#### 🥇 **Google Maps (En İyi Deneyim)**
- **Avantajlar**: En detaylı haritalar, gelişmiş özellikler
- **Dezavantajlar**: API key ve kredi kartı gerektirir
- **Kurulum**:
  1. [Google Cloud Console](https://console.cloud.google.com)'a gidin
  2. Yeni proje oluşturun
  3. Maps JavaScript API + Geocoding API'yi etkinleştirin
  4. API key oluşturun
  5. `config.js`'te API key'i güncelleyin:
  ```javascript
  GOOGLE_MAPS: { API_KEY: 'YOUR_API_KEY_HERE' }
  ```

#### 🥈 **OpenStreetMap + Leaflet (Ücretsiz)**
- **Avantajlar**: Tamamen ücretsiz, açık kaynak
- **Dezavantajlar**: Google Maps kadar detaylı değil
- **Kurulum**: Otomatik! Hiçbir ayar gerekmez

#### 🥉 **Demo Harita (Çevrimdışı)**
- **Avantajlar**: İnternet bağlantısı gerektirmez
- **Dezavantajlar**: Gerçek konum verisi yok, sadece görselleştirme
- **Kullanım**: Diğer sistemler çalışmazsa otomatik aktif olur

### 🔄 **Otomatik Sistem Seçimi**
Uygulama şu sırayla dener:
1. **Google Maps** (API key varsa)
2. **OpenStreetMap** (Leaflet ile)
3. **Demo Harita** (son çare)

**💡 Tavsiye**: Google Maps API key alamıyorsanız, OpenStreetMap sistemi mükemmel bir alternatif!

### PWA Olarak Yükleme
1. Desteklenen tarayıcıda siteyi açın
2. Adres çubuğundaki "Yükle" simgesine tıklayın
3. Ana ekranınıza uygulama olarak eklenir

## 🤝 Katkıda Bulunma

Bu proje açık kaynak kodludur ve katkılarınızı memnuniyetle karşılar:

1. **Fork** edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)  
5. **Pull Request** oluşturun

### Geliştirme Alanları
- [ ] Harita entegrasyonu (Google Maps API)
- [ ] Maliyet hesaplayıcısı
- [ ] Proje karlılık analizi  
- [ ] Excel import/export geliştirmesi
- [ ] Çoklu dil desteği
- [ ] Daha gelişmiş 3D görselleştirme

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

## 👨‍💻 Geliştirici

**[Your Name]**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

## 🙏 Teşekkürler

- İmar mevzuatı konusundaki destek için ilgili kamu kurumlarına
- Açık kaynak JavaScript topluluğuna
- Beta test sürecine katkıda bulunan tüm kullanıcılara

## 📞 Destek

Herhangi bir sorunuz veya öneriniz için:
- **Issue** açın: [GitHub Issues](https://github.com/yourusername/imar-hesaplayici-pro/issues)
- **Email** gönderin: your.email@example.com
- **LinkedIn** üzerinden ulaşın

---

⭐ Bu projeyi beğendiyseniz **star** vermeyi unutmayın!

## 📈 Sürüm Geçmişi

### v2.1.0 (Current) - Modüler Mimari
- ✅ **Modüler Yapıya Geçiş** - ES6 Modules ile refactor
- ✅ **Google Maps Entegrasyonu** - Parsel görselleştirme ve konum seçimi
- ✅ **Gelişmiş Theme Sistemi** - CSS Custom Properties ile Dark/Light tema
- ✅ **Konfigürasyon Yönetimi** - Merkezi config dosyası
- ✅ **Gerçek Zamanlı Validasyon** - Debounced form validation
- ✅ **İyileştirilmiş PWA** - Gelişmiş notification ve caching

### v2.0.0 - PWA Desteği
- ✅ Tamamen yeniden yazıldı
- ✅ PWA desteği eklendi
- ✅ 3D görselleştirme
- ✅ Gelişmiş validasyon
- ✅ Dark/Light theme

### v1.0.0 - Temel Sürüm
- ✅ Temel TAKS/KAKS hesaplamaları
- ✅ Basit form arayüzü
