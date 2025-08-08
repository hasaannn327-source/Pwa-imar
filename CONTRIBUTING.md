# 🤝 Katkıda Bulunma Rehberi

İmar Hesaplayıcısı Pro projesine katkıda bulunmak istediğiniz için teşekkür ederiz! Bu rehber, projeye nasıl katkıda bulunabileceğinizi açıklar.

## 🚀 Başlangıç

### Gereksinimler
- Node.js 16+ 
- Git
- Modern web tarayıcısı (Chrome, Firefox, Safari, Edge)

### Kurulum
```bash
# Repo'yu fork edin ve klonlayın
git clone https://github.com/yourusername/imar-hesaplayici-pro.git
cd imar-hesaplayici-pro

# Dependencies yükleyin (opsiyonel)
npm install

# Lokal server başlatın
npm run dev
# veya
npx http-server . -p 3000
```

## 📋 Katkı Türleri

### 🐛 Bug Raporu
Hata bulduysanız:
1. [Issues](https://github.com/yourusername/imar-hesaplayici-pro/issues) sayfasını kontrol edin
2. Benzer bir issue yoksa yeni bir tane açın
3. Aşağıdaki bilgileri ekleyin:
   - Hatanın tanımı
   - Yeniden üretme adımları
   - Beklenen davranış
   - Ekran görüntüsü (varsa)
   - Tarayıcı ve işletim sistemi bilgileri

### 💡 Yeni Özellik Önerisi
Yeni özellik öneriniz varsa:
1. Issue açın ve `enhancement` etiketi ekleyin
2. Özelliğin detaylı açıklamasını yapın
3. Kullanım senaryolarını belirtin
4. Mockup/wireframe ekleyin (varsa)

### 🔧 Kod Katkısı
1. Issue'dan bir görev seçin veya yeni bir tane açın
2. Fork yapın ve yeni branch oluşturun
3. Kodunuzu yazın
4. Test edin
5. Pull Request gönderin

## 🌿 Branch Stratejisi

- `main` - Stabil, production-ready kod
- `develop` - Geliştirme dalı
- `feature/feature-name` - Yeni özellikler
- `bugfix/bug-description` - Hata düzeltmeleri
- `hotfix/critical-fix` - Kritik düzeltmeler

```bash
# Feature branch oluşturma
git checkout -b feature/new-calculator-feature

# Değişiklikleri commit etme
git commit -m "feat: yeni hesaplama özelliği eklendi"

# Push etme
git push origin feature/new-calculator-feature
```

## 📝 Commit Mesaj Formatı

[Conventional Commits](https://www.conventionalcommits.org/) formatını kullanın:

```
<tip>(<kapsam>): <açıklama>

<detaylı açıklama>

<footer>
```

### Commit Tipleri
- `feat` - Yeni özellik
- `fix` - Hata düzeltmesi
- `docs` - Dokümantasyon
- `style` - Kod formatı (işlevselliği etkilemez)
- `refactor` - Refactoring
- `test` - Test ekleme/düzenleme
- `chore` - Bakım işleri

### Örnekler
```bash
git commit -m "feat: TAKS/KAKS hesaplama algoritması eklendi"
git commit -m "fix: mobil cihazlarda görüntüleme hatası düzeltildi"
git commit -m "docs: README dosyası güncellendi"
```

## 🎨 Kod Standartları

### JavaScript
```javascript
// ✅ İyi
function calculateTaks(area, taksRatio) {
  if (!area || !taksRatio) {
    throw new Error('Geçersiz parametreler');
  }
  
  return area * taksRatio;
}

// ❌ Kötü  
function calc(a,t){return a*t}
```

### CSS
```css
/* ✅ İyi */
.calculator-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
}

/* ❌ Kötü */
.form{display:grid;grid-template-columns:1fr 1fr;gap:20px}
```

### HTML
```html
<!-- ✅ İyi -->
<input 
  type="number" 
  id="plotArea" 
  aria-label="Arsa Alanı"
  required
>

<!-- ❌ Kötü -->
<input type=number id=area>
```

## 🧪 Test Rehberi

### Manuel Test Checklist
- [ ] Tüm form alanları çalışıyor
- [ ] Hesaplama sonuçları doğru
- [ ] Mobil uyumluluk
- [ ] Dark/Light tema geçişi
- [ ] PWA özellikleri
- [ ] Export fonksiyonları

### Tarayıcı Desteği
Test edilmesi gereken tarayıcılar:
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## 📱 PWA Test Rehberi

### Kontrol Edilecekler
- [ ] Manifest.json geçerli
- [ ] Service Worker çalışıyor
- [ ] Offline çalışma
- [ ] Ana ekrana ekleme
- [ ] App-like deneyim

### Lighthouse Skorları
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 90+
- PWA: 100

## 🔍 Code Review Süreci

### PR Göndermeden Önce
- [ ] Kod kendi kendini açıklıyor
- [ ] Gereksiz console.log'lar kaldırıldı
- [ ] Değişkenler anlamlı isimlendirildi
- [ ] Fonksiyonlar tek bir şey yapıyor
- [ ] Hata durumları ele alınmış

### PR Şablonu
```markdown
## Değişiklik Açıklaması
- Kısa açıklama

## Değişiklik Türü
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Test
- [ ] Yeni testler eklendi
- [ ] Mevcut testler geçiyor
- [ ] Manuel test yapıldı

## Ekran Görüntüleri
<!-- Gerekirse ekleyin -->
```

## 🏷️ Issue ve PR Etiketleri

### Issue Etiketleri
- `bug` - Hata raporu
- `enhancement` - Yeni özellik
- `documentation` - Dokümantasyon
- `help-wanted` - Yardım aranıyor
- `good-first-issue` - Yeni katkıcılar için uygun
- `priority-high` - Yüksek öncelik
- `priority-low` - Düşük öncelik

### PR Etiketleri
- `ready-for-review` - İncelemeye hazır
- `work-in-progress` - Devam ediyor
- `needs-changes` - Değişiklik gerekli

## 🎯 Proje Hedefleri

### Kısa Vadeli (1-3 ay)
- [ ] Harita entegrasyonu
- [ ] Maliyet hesaplayıcısı
- [ ] Excel import/export geliştirme
- [ ] Çoklu dil desteği

### Uzun Vadeli (6-12 ay)
- [ ] 3D görselleştirme geliştirme
- [ ] Mobil uygulama
- [ ] API geliştirme
- [ ] Veritabanı entegrasyonu

## 📞 İletişim

### Sorularınız için
- GitHub Issues
- Email: your.email@example.com
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

### Topluluk
- GitHub Discussions (yakında)
- Discord Server (yakında)

## 🙏 Teşekkürler

Katkıda bulunan herkese teşekkür ederiz:

### Kod Katkıcıları
- [@yourusername](https://github.com/yourusername) - Proje kurucusu

### Diğer Katkılar
- Beta test yapan kullanıcılar
- Hata raporu göndenenler
- Öneride bulunanlar

## 📜 Davranış Kuralları

### Beklentilerimiz
- Saygılı ve kapsayıcı davranış
- Yapıcı eleştiri
- Farklı görüşlere açıklık
- Öğrenmeye istekli olma

### Kabul Edilmeyen Davranışlar
- Ayrımcı dil ve davranış
- Kişisel saldırılar
- Taciz
- Troller davranışı

### Uygulama
Davranış kurallarına uymayan kişiler proje topluluğundan çıkarılabilir.

---

Katkılarınız için şimdiden teşekkür ederiz! 🚀
