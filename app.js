// Global değişkenler
let blocks = [];
let selectedApartmentTypes = [];
let projectResults = {};

// Şehir bazlı imar yönetmelikleri
const cityRegulations = {
    'istanbul': {
        maxHeight: 12.5,
        regulations: ['Deprem yönetmeliği uygulanır', 'Bodrum kat sayılmaz', 'Çatı katı %50 oranında yapılabilir'],
        konutTaks: { '1': 0.30, '2': 0.35, '3': 0.40 },
        konutEmsal: { '1': 1.0, '2': 1.5, '3': 2.0 }
    },
    'ankara': {
        maxHeight: 15.0,
        regulations: ['Kar yükü hesaplanmalı', 'Isı yalıtımı zorunlu', 'Güneş paneli teşvik edilir'],
        konutTaks: { '1': 0.35, '2': 0.40, '3': 0.45 },
        konutEmsal: { '1': 1.2, '2': 1.8, '3': 2.2 }
    },
    'izmir': {
        maxHeight: 12.0,
        regulations: ['Rüzgar yükü önemli', 'Deniz seviyesi kontrolü', 'Tuz korozyonu önlemi'],
        konutTaks: { '1': 0.25, '2': 0.30, '3': 0.35 },
        konutEmsal: { '1': 0.8, '2': 1.2, '3': 1.6 }
    },
    'antalya': {
        maxHeight: 10.0,
        regulations: ['Turizm bölgesi kısıtlamaları', 'Manzara koruma', 'Yangın güvenliği önemli'],
        konutTaks: { '1': 0.20, '2': 0.25, '3': 0.30 },
        konutEmsal: { '1': 0.6, '2': 1.0, '3': 1.4 }
    },
    'bursa': {
        maxHeight: 13.0,
        regulations: ['Sanayi bölgesi yakınlığı', 'Hava kalitesi kontrolü', 'Yeşil alan oranı %25'],
        konutTaks: { '1': 0.32, '2': 0.38, '3': 0.42 },
        konutEmsal: { '1': 1.1, '2': 1.6, '3': 2.1 }
    },
    'diger': {
        maxHeight: 12.5,
        regulations: ['Genel imar yönetmeliği uygulanır', 'Yerel idareden onay gerekli'],
        konutTaks: { '1': 0.30, '2': 0.35, '3': 0.40 },
        konutEmsal: { '1': 1.0, '2': 1.5, '3': 2.0 }
    }
};

// Daire tipleri
const apartmentTypes = {
    '1+1': { area: 65, rooms: 2 },
    '2+1': { area: 95, rooms: 3 },
    '3+1': { area: 125, rooms: 4 },
    '4+1': { area: 160, rooms: 5 },
    'dubleks': { area: 200, rooms: 6 }
};

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    console.log('İmar Hesaplayıcısı başlatılıyor...');
    
    initializeApp();
    setupEventListeners();
    selectDefaultApartments();
    registerServiceWorker();
});

// Uygulama başlatma
function initializeApp() {
    console.log('Uygulama başlatıldı');
    
    // Initialize theme
    initializeTheme();
    
    // Varsayılan değerleri kontrol et
    if (!document.getElementById('taban').value) {
        document.getElementById('taban').value = '0.30';
    }
    if (!document.getElementById('emsal').value) {
        document.getElementById('emsal').value = '1.00';
    }
    if (!document.getElementById('katYuksekligi').value) {
        document.getElementById('katYuksekligi').value = '3.0';
    }
}

// Event listener'ları kurulum
function setupEventListeners() {
    // Şehir değişikliği
    const sehirSelect = document.getElementById('sehir');
    if (sehirSelect) {
        sehirSelect.addEventListener('change', function() {
            updateCityRegulations(this.value);
        });
    }

    // İmar durumu değişikliği
    const imarSelect = document.getElementById('imarDurumu');
    if (imarSelect) {
        imarSelect.addEventListener('change', function() {
            updateZoningCoefficients(this.value);
        });
    }

    // Form submit
    const form = document.getElementById('calculatorForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit();
        });
    }

    // Daire tipi seçimi
    document.querySelectorAll('.apartment-type').forEach(type => {
        type.addEventListener('click', function() {
            this.classList.toggle('selected');
            updateSelectedApartments();
        });
    });

    // Tab değiştirme
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Blok butonları
    const addBlockBtn = document.querySelector('.add-block');
    const removeBlockBtn = document.querySelector('.remove-block');
    
    if (addBlockBtn) {
        addBlockBtn.addEventListener('click', addBlock);
    }
    if (removeBlockBtn) {
        removeBlockBtn.addEventListener('click', removeBlock);
    }
}

// Service Worker kaydı - Geliştirilmiş PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js', {
                    scope: './'
                });
                
                console.log('✅ Service Worker registered:', registration);
                
                // Update bulunduğunda
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 Service Worker güncellemesi bulundu');
                    showUpdateNotification();
                });
                
                // PWA Install Prompt
                setupPWAInstall();
                
            } catch (error) {
                console.error('❌ SW registration failed:', error);
            }
        });
    }
}

// PWA Install Setup
let deferredPrompt;

function setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('💾 PWA Install prompt mevcut');
        e.preventDefault();
        deferredPrompt = e;
        showInstallBanner();
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('✅ PWA yüklendi');
        showNotification('🎉 İmar Hesaplayıcısı başarıyla yüklendi!', 'success');
        hideInstallBanner();
    });
}

// Install Banner
function showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;
    
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 12px 20px;
            text-align: center;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        ">
            <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.2rem;">📱</span>
                    <span><strong>İmar Hesaplayıcısı Pro</strong> uygulamasını ana ekrana ekleyin!</span>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="installPWA()" style="
                        background: white;
                        color: #2563eb;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                    ">📲 Yükle</button>
                    <button onclick="hideInstallBanner()" style="
                        background: transparent;
                        color: white;
                        border: 1px solid white;
                        padding: 8px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                    ">✕</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(banner);
    setTimeout(hideInstallBanner, 15000); // 15 saniye sonra gizle
}

// PWA Yükleme
async function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(outcome === 'accepted' ? '✅ PWA yüklendi' : '❌ PWA yükleme iptal edildi');
        deferredPrompt = null;
        hideInstallBanner();
    }
}

// Banner Gizle
function hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner && document.body.contains(banner)) {
        document.body.removeChild(banner);
    }
}

// Update Notification
function showUpdateNotification() {
    showNotification('🔄 Yeni sürüm mevcut! Sayfa yenilenecek...', 'success');
    setTimeout(() => window.location.reload(), 3000);
}

// Form submit işlemi
function handleFormSubmit() {
    console.log('Form submit işlemi başlatıldı');
    
    // Önceki hataları temizle
    clearErrors();
    
    if (!validateForm()) {
        console.log('Form validasyonu başarısız');
        return;
    }
    
    // Hesaplama loading'i göster
    showCalculationLoading();
    
    // Simulate realistic calculation time
    setTimeout(() => {
        try {
            performCalculation();
            hideLoading();
            
            // Başarı bildirimi
            showNotification('✅ Hesaplama başarıyla tamamlandı!', 'success');
            
        } catch (error) {
            console.error('Calculation error:', error);
            hideLoading();
            showError('Hesaplama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
            showNotification('❌ Hesaplama hatası!', 'error');
        }
    }, 1500);
}

// Gelişmiş loading gösterimi
function showLoading(show, message = 'Hesaplanıyor...', type = 'calculation') {
    const loading = document.getElementById('loading');
    if (!loading) return;
    
    if (show) {
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner ${type}">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <div class="loading-text" role="status" aria-live="polite">
                    <strong>${message}</strong>
                </div>
                <div class="loading-progress">
                    <div class="progress-bar" id="progressBar"></div>
                </div>
            </div>
        `;
        loading.classList.add('show');
        document.body.style.overflow = 'hidden'; // Scroll'u engelle
        
        // Progress bar animasyonu
        setTimeout(() => {
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                progressBar.style.width = '100%';
            }
        }, 100);
        
    } else {
        loading.classList.remove('show');
        document.body.style.overflow = ''; // Scroll'u geri aç
        setTimeout(() => {
            loading.innerHTML = '';
        }, 300);
    }
}

// Özel loading mesajları
function showCalculationLoading() {
    showLoading(true, 'İmar hesaplamaları yapılıyor...', 'calculation');
}

function showExportLoading(format) {
    showLoading(true, `${format} dosyası hazırlanıyor...`, 'export');
}

function hideLoading() {
    showLoading(false);
}

// Şehir bazlı imar yönetmeliği güncelleme
function updateCityRegulations(city) {
    const imarNotlari = document.getElementById('imarNotlari');
    
    if (!imarNotlari) return;
    
    if (city && cityRegulations[city]) {
        const regs = cityRegulations[city];
        let html = '<div class="warning"><strong>🏛️ ' + city.toUpperCase() + ' İmar Yönetmeliği:</strong><ul>';
        regs.regulations.forEach(reg => {
            html += '<li>' + reg + '</li>';
        });
        html += '</ul></div>';
        imarNotlari.innerHTML = html;
    } else {
        imarNotlari.innerHTML = '';
    }
}

// İmar durumuna göre katsayı güncelleme
function updateZoningCoefficients(zoning) {
    const city = document.getElementById('sehir').value;
    const tabanInput = document.getElementById('taban');
    const emsalInput = document.getElementById('emsal');
    
    if (!tabanInput || !emsalInput) return;
    
    if (city && cityRegulations[city] && zoning.startsWith('konut-')) {
        const level = zoning.split('-')[1];
        tabanInput.value = cityRegulations[city].konutTaks[level] || 0.30;
        emsalInput.value = cityRegulations[city].konutEmsal[level] || 1.00;
    } else {
        switch(zoning) {
            case 'konut-1':
                tabanInput.value = '0.30';
                emsalInput.value = '1.00';
                break;
            case 'konut-2':
                tabanInput.value = '0.35';
                emsalInput.value = '1.50';
                break;
            case 'konut-3':
                tabanInput.value = '0.40';
                emsalInput.value = '2.00';
                break;
            case 'ticaret':
                tabanInput.value = '0.60';
                emsalInput.value = '2.50';
                break;
            case 'karma':
                tabanInput.value = '0.45';
                emsalInput.value = '1.80';
                break;
            case 'turizm':
                tabanInput.value = '0.25';
                emsalInput.value = '1.20';
                break;
        }
    }
}

// Varsayılan daire tiplerini seç
function selectDefaultApartments() {
    const apt2plus1 = document.querySelector('[data-type="2+1"]');
    const apt3plus1 = document.querySelector('[data-type="3+1"]');
    
    if (apt2plus1) {
        apt2plus1.classList.add('selected');
    }
    if (apt3plus1) {
        apt3plus1.classList.add('selected');
    }
    
    updateSelectedApartments();
}

// Seçilen daire tiplerini güncelle
function updateSelectedApartments() {
    selectedApartmentTypes = [];
    document.querySelectorAll('.apartment-type.selected').forEach(type => {
        const typeData = {
            type: type.dataset.type,
            area: parseInt(type.dataset.area)
        };
        selectedApartmentTypes.push(typeData);
    });
    
    displaySelectedApartments();
    updateFloorPlan();
}

// Seçilen daire tiplerini göster
function displaySelectedApartments() {
    const container = document.getElementById('selectedApartments');
    if (!container) return;
    
    let html = '<h4 style="margin: 15px 0 10px 0; color: #1f2937;">Seçilen Daire Tipleri:</h4>';
    
    if (selectedApartmentTypes.length === 0) {
        html += '<p style="color: #6b7280; font-style: italic;">Henüz daire tipi seçilmemiş</p>';
    } else {
        selectedApartmentTypes.forEach(apt => {
            html += `<div class="result-item">
                <span class="result-label">${apt.type}</span>
                <span class="result-value">${apt.area} m²</span>
            </div>`;
        });
    }
    
    container.innerHTML = html;
}

// Ana hesaplama fonksiyonu
function performCalculation() {
    console.log('Hesaplama başlatılıyor...');
    
    const city = document.getElementById('sehir').value;
    const parselAlani = parseFloat(document.getElementById('parselAlani').value);
    const taban = parseFloat(document.getElementById('taban').value);
    const emsal = parseFloat(document.getElementById('emsal').value);
    const katYuksekligi = parseFloat(document.getElementById('katYuksekligi').value);
    
    console.log('Hesaplama parametreleri:', { city, parselAlani, taban, emsal, katYuksekligi });
    
    // Şehir bazlı yükseklik sınırı
    const maxYukseklikLimit = (city && cityRegulations[city]) 
        ? cityRegulations[city].maxHeight 
        : 12.5;
    
    // Hesaplamalar
    const maxTabanAlani = parselAlani * taban;
    const maxInsaatAlani = parselAlani * emsal;
    
    let maxKatSayisi = Math.ceil(emsal / taban);
    const maxKatSayisiYukseklikIle = Math.floor(maxYukseklikLimit / katYuksekligi);
    maxKatSayisi = Math.min(maxKatSayisi, maxKatSayisiYukseklikIle);
    
    const maxYukseklik = maxKatSayisi * katYuksekligi;
    const acikAlan = parselAlani - maxTabanAlani;
    const yapilasmaorani = (emsal * 100);
    
    // Sonuçları sakla
    projectResults = {
        parselAlani,
        maxTabanAlani,
        maxInsaatAlani,
        maxKatSayisi,
        maxYukseklik,
        acikAlan,
        yapilasmaorani,
        city,
        maxYukseklikLimit
    };
    
    console.log('Hesaplama sonuçları:', projectResults);
    
    // UI'ı güncelle
    updateResultsUI();
    autoCalculateBlocks();
    updateVisualization();
    updateFloorPlan();
    showSuccessMessage(maxInsaatAlani);
    
    // Show export controls after successful calculation
    showExportControls();
    
    // Update charts and 3D visualization
    setTimeout(() => {
        updateAllCharts();
        update3DVisualization();
    }, 1000);
    
    // Auto-generate PDF after calculation (optional)
    setTimeout(() => {
        autoGeneratePDF();
    }, 2000);
}

// Sonuçları UI'da göster
function updateResultsUI() {
    const elements = {
        'maxTabanAlani': projectResults.maxTabanAlani.toFixed(2) + ' m²',
        'maxInsaatAlani': projectResults.maxInsaatAlani.toFixed(2) + ' m²',
        'maxKatSayisi': projectResults.maxKatSayisi + ' kat',
        'maxYukseklik': projectResults.maxYukseklik.toFixed(1) + ' m',
        'acikAlan': projectResults.acikAlan.toFixed(2) + ' m²',
        'yapilasmaorani': '%' + projectResults.yapilasmaorani.toFixed(1)
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Gelişmiş form doğrulama
function validateForm() {
    let isValid = true;
    const errors = [];
    
    const validationRules = [
        { 
            id: 'sehir', 
            name: 'Şehir',
            required: true,
            validator: (value) => value && value !== ''
        },
        { 
            id: 'parselAlani', 
            name: 'Parsel Alanı',
            required: true,
            validator: (value) => {
                const num = parseFloat(value);
                return !isNaN(num) && num > 0 && num <= 100000;
            },
            errorMessage: 'Parsel alanı 0-100,000 m² arasında olmalıdır'
        },
        { 
            id: 'imarDurumu', 
            name: 'İmar Durumu',
            required: true,
            validator: (value) => value && value !== ''
        },
        {
            id: 'taban',
            name: 'TAKS',
            required: true,
            validator: (value) => {
                const num = parseFloat(value);
                return !isNaN(num) && num > 0 && num <= 1;
            },
            errorMessage: 'TAKS değeri 0-1 arasında olmalıdır'
        },
        {
            id: 'emsal',
            name: 'KAKS',
            required: true,
            validator: (value) => {
                const num = parseFloat(value);
                return !isNaN(num) && num > 0 && num <= 5;
            },
            errorMessage: 'KAKS değeri 0-5 arasında olmalıdır'
        }
    ];
    
    // Validasyon kontrolü
    validationRules.forEach(rule => {
        const element = document.getElementById(rule.id);
        if (!element) return;
        
        const value = element.value.trim();
        
        try {
            if (rule.required && !value) {
                element.style.borderColor = '#ef4444';
                element.setAttribute('aria-invalid', 'true');
                errors.push(`${rule.name} alanı zorunludur`);
                isValid = false;
            } else if (value && !rule.validator(value)) {
                element.style.borderColor = '#ef4444';
                element.setAttribute('aria-invalid', 'true');
                errors.push(rule.errorMessage || `${rule.name} geçersiz değer`);
                isValid = false;
            } else {
                element.style.borderColor = '#10b981';
                element.setAttribute('aria-invalid', 'false');
            }
        } catch (error) {
            console.error(`Validation error for ${rule.name}:`, error);
            element.style.borderColor = '#ef4444';
            errors.push(`${rule.name} doğrulanırken hata oluştu`);
            isValid = false;
        }
    });
    
    // Cross-field validation
    if (isValid) {
        const taksValue = parseFloat(document.getElementById('taban').value);
        const kaksValue = parseFloat(document.getElementById('emsal').value);
        
        if (kaksValue < taksValue) {
            errors.push('KAKS değeri TAKS değerinden küçük olamaz');
            isValid = false;
        }
    }
    
    if (!isValid) {
        showError(errors.join('<br>'));
    } else {
        clearErrors();
    }
    
    return isValid;
}

// Gelişmiş hata mesajı göster
function showError(message) {
    const imarNotlari = document.getElementById('imarNotlari');
    if (imarNotlari) {
        imarNotlari.innerHTML = `
            <div class="error" role="alert" aria-live="polite">
                <div class="error-header">
                    <span class="error-icon">❌</span>
                    <strong>Hata:</strong>
                </div>
                <div class="error-content">${message}</div>
                <button class="error-close" onclick="clearErrors()" aria-label="Hatayı kapat">✕</button>
            </div>
        `;
    }
    
    // Accessibility için focus yönetimi
    setTimeout(() => {
        const errorElement = document.querySelector('.error');
        if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 100);
}

// Hataları temizle
function clearErrors() {
    const imarNotlari = document.getElementById('imarNotlari');
    if (imarNotlari) {
        const errorElements = imarNotlari.querySelectorAll('.error');
        errorElements.forEach(error => error.remove());
    }
    
    // Input border renklerini sıfırla
    document.querySelectorAll('input, select').forEach(input => {
        if (input.style.borderColor === 'rgb(239, 68, 68)') {
            input.style.borderColor = '#e5e7eb';
            input.removeAttribute('aria-invalid');
        }
    });
}

// Başarı mesajı göster
function showSuccessMessage(maxInsaatAlani) {
    const imarNotlari = document.getElementById('imarNotlari');
    if (!imarNotlari) return;
    
    const currentContent = imarNotlari.innerHTML;
    const suggestedBlocks = suggestBlockCount(maxInsaatAlani);
    
    imarNotlari.innerHTML = currentContent + 
        `<div class="success">✅ Hesaplama tamamlandı! ${maxInsaatAlani.toFixed(0)}m² inşaat alanından ${suggestedBlocks} blok öneriliyor.</div>`;
}

// Otomatik blok sayısı önerisi
function suggestBlockCount(totalArea) {
    if (totalArea < 500) return 1;
    if (totalArea < 1200) return 2;
    if (totalArea < 2500) return 3;
    if (totalArea < 4000) return 4;
    return Math.ceil(totalArea / 1000);
}

// Otomatik blok oluşturma
function autoCalculateBlocks() {
    if (!projectResults.maxInsaatAlani) return;
    
    blocks = [];
    const suggestedBlockCount = suggestBlockCount(projectResults.maxInsaatAlani);
    
    for (let i = 0; i < suggestedBlockCount; i++) {
        blocks.push({
            id: i + 1,
            floors: Math.min(projectResults.maxKatSayisi, 5),
            apartments: {},
            totalArea: 0
        });
    }
    
    calculateBlocks();
}

// Blok ekleme
function addBlock() {
    const block = {
        id: blocks.length + 1,
        floors: 4,
        apartments: {},
        totalArea: 0
    };
    
    blocks.push(block);
    updateBlockDisplay();
    calculateBlocks();
}

// Blok silme
function removeBlock() {
    if (blocks.length > 0) {
        blocks.pop();
        updateBlockDisplay();
        calculateBlocks();
    }
}

// Blok hesaplamaları
function calculateBlocks() {
    if (!projectResults.maxInsaatAlani || blocks.length === 0) {
        updateBlockCounters(0, 0);
        return;
    }
    
    const totalFloors = blocks.reduce((sum, block) => sum + block.floors, 0);
    const areaPerFloor = totalFloors > 0 ? projectResults.maxInsaatAlani / totalFloors : 0;
    
    let totalApartments = 0;
    
    blocks.forEach(block => {
        block.totalArea = block.floors * areaPerFloor;
        block.apartments = {};
        
        if (selectedApartmentTypes.length > 0) {
            selectedApartmentTypes.forEach(aptType => {
                const count = Math.floor(block.totalArea / aptType.area / selectedApartmentTypes.length);
                if (count > 0) {
                    block.apartments[aptType.type] = count;
                    totalApartments += count;
                }
            });
        }
    });
    
    updateBlockCounters(blocks.length, totalApartments);
    updateBlockDisplay();
    updateApartmentList();
    updateVisualization();
}

// Blok sayaçlarını güncelle
function updateBlockCounters(blockCount, apartmentCount) {
    const blockCountElement = document.getElementById('toplamBlokSayisi');
    const apartmentCountElement = document.getElementById('toplamDaireSayisi');
    
    if (blockCountElement) blockCountElement.textContent = blockCount;
    if (apartmentCountElement) apartmentCountElement.textContent = apartmentCount;
}

// Blok görünümünü güncelle
function updateBlockDisplay() {
    const container = document.getElementById('blockList');
    if (!container) return;
    
    if (blocks.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280; font-style: italic; padding: 20px;">Henüz blok eklenmemiş</p>';
        return;
    }
    
    let html = '';
    blocks.forEach((block, index) => {
        html += `
            <div class="block-item">
                <h4>🏢 Blok ${block.id}</h4>
                <div class="input-group">
                    <label>Kat Sayısı:</label>
                    <input type="number" min="1" max="12" value="${block.floors}" 
                           onchange="updateBlockFloors(${index}, this.value)">
                </div>
                <div class="result-item">
                <span class="result-label">Toplam Alan:</span>
                    <span class="result-value">${block.totalArea.toFixed(0)} m²</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Blok kat sayısını güncelle
function updateBlockFloors(blockIndex, floors) {
    if (blocks[blockIndex]) {
        blocks[blockIndex].floors = parseInt(floors) || 1;
        calculateBlocks();
    }
}

// Daire listesini güncelle
function updateApartmentList() {
    const container = document.getElementById('daireListesiDetay');
    if (!container) return;
    
    if (blocks.length === 0 || selectedApartmentTypes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 40px;">Blok ve daire tipi seçimi yapın</p>';
        return;
    }
    
    let html = '<h4>📋 Detaylı Daire Listesi</h4>';
    let totalApartments = 0;
    
    blocks.forEach(block => {
        html += `<div class="block-item">
            <h5>🏢 Blok ${block.id} (${block.floors} kat)</h5>`;
        
        Object.entries(block.apartments).forEach(([type, count]) => {
            html += `<div class="result-item">
                <span class="result-label">${type} Daire:</span>
                <span class="result-value">${count} adet</span>
            </div>`;
            totalApartments += count;
        });
        
        html += '</div>';
    });
    
    html += `<div class="success">
        <strong>📊 Toplam Özet:</strong><br>
        Toplam Blok: ${blocks.length} adet<br>
        Toplam Daire: ${totalApartments} adet<br>
        Kullanılan Alan: ${projectResults.maxInsaatAlani?.toFixed(0) || 0} m²
    </div>`;
    
    container.innerHTML = html;
}

// Tab değiştirme
function switchTab(tabName) {
    // Tüm tabları ve içerikleri temizle
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Seçili tab ve içeriği aktif et
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(tabName);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
}

// Yerleşim planı görselleştirmesi
function updateVisualization() {
    const buildingVisual = document.getElementById('buildingVisual');
    if (!buildingVisual) return;
    
    if (!projectResults.maxInsaatAlani || blocks.length === 0) {
        buildingVisual.innerHTML = `
            <div class="placeholder-content">
                <div class="placeholder-icon">🏗️</div>
                <p>Hesaplama sonrası<br>yerleşim planı görüntülenecek</p>
            </div>`;
        return;
    }
    
    const blockCount = blocks.length;
    const blockWidth = Math.min(50, 280 / blockCount);
    const blockHeight = 80;
    
    let svg = `<svg width="100%" height="100%" viewBox="0 0 320 300" style="background: #e6f3ff;">
        <!-- Parsel sınırları -->
        <rect x="10" y="10" width="300" height="220" fill="none" stroke="#2d5016" stroke-width="2" stroke-dasharray="5,5"/>
        <text x="160" y="25" text-anchor="middle" font-size="12" fill="#2d5016" font-weight="bold">
            📍 Parsel: ${projectResults.parselAlani}m²
        </text>
        
        <!-- Bloklar -->`;
    
    blocks.forEach((block, index) => {
        const x = 30 + (index * (blockWidth + 15));
        const y = 60;
        const floors = block.floors;
        
        // Her kat için dikdörtgen
        for (let floor = 0; floor < floors; floor++) {
            const floorY = y + (blockHeight - (floor * 12));
            const floorColor = `hsl(${200 + floor * 25}, 70%, ${60 - floor * 3}%)`;
            
            svg += `<rect x="${x}" y="${floorY}" width="${blockWidth}" height="10" 
                    fill="${floorColor}" 
                    stroke="#1e40af" stroke-width="0.5"/>`;
            
            // Pencereler
            const windowCount = Math.min(4, Math.floor(blockWidth / 8));
            for (let window = 0; window < windowCount; window++) {
                const windowX = x + 3 + (window * (blockWidth / windowCount));
                svg += `<rect x="${windowX}" y="${floorY + 2}" width="4" height="4" 
                        fill="#87ceeb" stroke="#4682b4" stroke-width="0.3"/>`;
            }
        }
        
        // Giriş kapısı
        svg += `<rect x="${x + blockWidth/2 - 3}" y="${y + blockHeight - 2}" width="6" height="4" 
                fill="#8b4513" stroke="#654321" stroke-width="0.5"/>`;
        
        // Blok bilgileri
        svg += `<text x="${x + blockWidth/2}" y="${y + blockHeight + 18}" text-anchor="middle" 
                font-size="12" fill="#1f2937" font-weight="bold">Blok ${block.id}</text>`;
        svg += `<text x="${x + blockWidth/2}" y="${y + blockHeight + 32}" text-anchor="middle" 
                font-size="9" fill="#6b7280">${floors} kat</text>`;
        svg += `<text x="${x + blockWidth/2}" y="${y + blockHeight + 45}" text-anchor="middle" 
                font-size="9" fill="#6b7280">${Math.round(block.totalArea)}m²</text>`;
    });
    
    // Açık alanlar
    svg += `<rect x="20" y="180" width="280" height="35" fill="#90EE90" fill-opacity="0.4" stroke="#228B22" stroke-width="1"/>
            <text x="160" y="200" text-anchor="middle" font-size="11" fill="#228B22" font-weight="bold">
                🌳 Açık Alan: ${projectResults.acikAlan.toFixed(0)}m²
            </text>`;
    
    // Özet bilgiler
    const totalApartments = document.getElementById('toplamDaireSayisi')?.textContent || '0';
    svg += `<text x="20" y="245" font-size="10" fill="#1f2937" font-weight="bold">
                📊 Toplam: ${blocks.length} blok, ${totalApartments} daire
            </text>`;
    svg += `<text x="20" y="260" font-size="10" fill="#1f2937">
                🏗️ Max Yükseklik: ${projectResults.maxYukseklik}m (Limit: ${projectResults.maxYukseklikLimit}m)
            </text>`;
    svg += `<text x="20" y="275" font-size="10" fill="#1f2937">
                🏘️ Yapılaşma Oranı: %${projectResults.yapilasmaorani.toFixed(1)}
            </text>`;
    
    svg += '</svg>';
    buildingVisual.innerHTML = svg;
}

// Kat planı görselleştirmesi
function updateFloorPlan() {
    const floorPlan = document.getElementById('floorPlan');
    if (!floorPlan) return;
    
    if (selectedApartmentTypes.length === 0) {
        floorPlan.innerHTML = `
            <div class="placeholder-content">
                <div class="placeholder-icon">📐</div>
                <p>Daire tipi seçildikten sonra<br>kat planı görüntülenecek</p>
            </div>`;
        return;
    }
    
    // SVG boyutunu daire sayısına göre ayarla
    const totalHeight = Math.max(280, selectedApartmentTypes.length * 80 + 60);
    
    let svg = `<svg width="100%" height="100%" viewBox="0 0 320 ${totalHeight}" style="background: #f8f9fa;">
        <text x="160" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#1f2937">
            📐 Tipik Kat Planı
        </text>`;
    
    let currentY = 40;
    
    selectedApartmentTypes.forEach((apt, index) => {
        const roomCount = apartmentTypes[apt.type]?.rooms || 2;
        
        // Daire boyutlarını optimize et
        let width, height;
        if (apt.area <= 70) {
            width = 100; height = 60;
        } else if (apt.area <= 100) {
            width = 120; height = 70;
        } else if (apt.area <= 130) {
            width = 140; height = 80;
        } else if (apt.area <= 170) {
            width = 160; height = 90;
        } else {
            width = 180; height = 100;
        }
        
        // Daire başlığı
        svg += `<text x="50" y="${currentY - 5}" font-size="12" fill="#1f2937" font-weight="bold">
                ${apt.type} Dairesi (${apt.area}m²)</text>`;
        
        // Daire ana çerçevesi
        svg += `<rect x="50" y="${currentY + 5}" width="${width}" height="${height}" 
                fill="#ffffff" stroke="#2d3748" stroke-width="2"/>`;
        
        // Oda düzeni hesapla (daha düzenli)
        const rooms = getRoomLayout(apt.type, roomCount);
        
        rooms.forEach((room, roomIndex) => {
            const roomX = 50 + room.x * width;
            const roomY = currentY + 5 + room.y * height;
            const roomWidth = room.width * width;
            const roomHeight = room.height * height;
            
            // Oda çerçevesi
            svg += `<rect x="${roomX}" y="${roomY}" width="${roomWidth - 2}" height="${roomHeight - 2}" 
                    fill="${room.color}" stroke="#64748b" stroke-width="1"/>`;
            
            // Oda ismi
            if (roomWidth > 25 && roomHeight > 15) {
                svg += `<text x="${roomX + roomWidth/2}" y="${roomY + roomHeight/2 + 3}" 
                        text-anchor="middle" font-size="9" fill="#1e293b" font-weight="500">
                        ${room.name}</text>`;
            }
        });
        
        // Giriş kapısı
        svg += `<rect x="48" y="${currentY + 5 + height/2 - 4}" width="4" height="8" fill="#8b4513"/>`;
        svg += `<circle cx="46" cy="${currentY + 5 + height/2}" r="2" fill="#d4a574"/>`;
        
        // Pencereler
        const windowCount = Math.floor(width / 40);
        for (let w = 0; w < windowCount; w++) {
            const windowX = 50 + 20 + (w * 40);
            svg += `<rect x="${windowX}" y="${currentY + 3}" width="15" height="4" 
                    fill="#87ceeb" stroke="#4682b4" stroke-width="0.5"/>`;
        }
        
        // Bir sonraki daire için boşluk bırak
        currentY += height + 35;
    });
    
    svg += '</svg>';
    floorPlan.innerHTML = svg;
}

// Daire tipine göre oda düzeni
function getRoomLayout(apartmentType, roomCount) {
    const layouts = {
        '1+1': [
            { name: 'Salon', x: 0, y: 0, width: 0.6, height: 1, color: '#e0f2fe' },
            { name: 'Yatak Odası', x: 0.6, y: 0, width: 0.4, height: 0.7, color: '#fce7f3' },
            { name: 'Mutfak', x: 0.6, y: 0.7, width: 0.4, height: 0.3, color: '#ecfdf5' }
        ],
        '2+1': [
            { name: 'Salon', x: 0, y: 0, width: 0.5, height: 0.7, color: '#e0f2fe' },
            { name: 'Y.Odası 1', x: 0.5, y: 0, width: 0.5, height: 0.35, color: '#fce7f3' },
            { name: 'Y.Odası 2', x: 0.5, y: 0.35, width: 0.5, height: 0.35, color: '#fce7f3' },
            { name: 'Mutfak', x: 0, y: 0.7, width: 1, height: 0.3, color: '#ecfdf5' }
        ],
        '3+1': [
            { name: 'Salon', x: 0, y: 0, width: 0.6, height: 0.5, color: '#e0f2fe' },
            { name: 'Y.Odası 1', x: 0.6, y: 0, width: 0.4, height: 0.33, color: '#fce7f3' },
            { name: 'Y.Odası 2', x: 0.6, y: 0.33, width: 0.4, height: 0.33, color: '#fce7f3' },
            { name: 'Y.Odası 3', x: 0.6, y: 0.66, width: 0.4, height: 0.34, color: '#fce7f3' },
            { name: 'Mutfak', x: 0, y: 0.5, width: 0.6, height: 0.5, color: '#ecfdf5' }
        ],
        '4+1': [
            { name: 'Salon', x: 0, y: 0, width: 0.5, height: 0.5, color: '#e0f2fe' },
            { name: 'Y.Odası 1', x: 0.5, y: 0, width: 0.5, height: 0.25, color: '#fce7f3' },
            { name: 'Y.Odası 2', x: 0.5, y: 0.25, width: 0.5, height: 0.25, color: '#fce7f3' },
            { name: 'Y.Odası 3', x: 0, y: 0.5, width: 0.33, height: 0.5, color: '#fce7f3' },
            { name: 'Y.Odası 4', x: 0.33, y: 0.5, width: 0.34, height: 0.5, color: '#fce7f3' },
            { name: 'Mutfak', x: 0.67, y: 0.5, width: 0.33, height: 0.5, color: '#ecfdf5' }
        ],
        'dubleks': [
            { name: 'Salon', x: 0, y: 0, width: 0.7, height: 0.4, color: '#e0f2fe' },
            { name: 'Mutfak', x: 0.7, y: 0, width: 0.3, height: 0.4, color: '#ecfdf5' },
            { name: 'Y.Odası 1', x: 0, y: 0.4, width: 0.33, height: 0.3, color: '#fce7f3' },
            { name: 'Y.Odası 2', x: 0.33, y: 0.4, width: 0.34, height: 0.3, color: '#fce7f3' },
            { name: 'Y.Odası 3', x: 0.67, y: 0.4, width: 0.33, height: 0.3, color: '#fce7f3' },
            { name: 'Üst Kat', x: 0, y: 0.7, width: 1, height: 0.3, color: '#fff7ed' }
        ]
    };
    
    return layouts[apartmentType] || layouts['2+1'];
}

// Online/Offline durumu
window.addEventListener('online', () => {
    console.log('Online duruma geçildi');
    showNotification('🌐 İnternet bağlantısı kuruldu!', 'success');
});

window.addEventListener('offline', () => {
    console.log('Offline duruma geçildi');
    showNotification('📱 Çevrimdışı modda çalışıyor', 'warning');
});

// Bildirim gösterme
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '8px';
    notification.style.fontWeight = '500';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    if (type === 'success') {
        notification.style.backgroundColor = '#ecfdf5';
        notification.style.color = '#059669';
        notification.style.borderLeft = '4px solid #059669';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#fffbeb';
        notification.style.color = '#d97706';
        notification.style.borderLeft = '4px solid #d97706';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

// Debug fonksiyonu
function debugApp() {
    console.log('=== İmar Hesaplayıcısı Debug ===');
    console.log('Project Results:', projectResults);
    console.log('Blocks:', blocks);
    console.log('Selected Apartments:', selectedApartmentTypes);
    console.log('===============================');
}

// PDF Export Function
function exportToPDF() {
    if (!projectResults.parselAlani) {
        showError('Önce hesaplama yapmalısınız!');
        return;
    }
    
    showExportLoading('PDF');
    
    setTimeout(() => {
        try {
            const pdfContent = generatePDFContent();
            downloadTextFile(pdfContent, 'pdf');
            hideLoading();
            showNotification('📄 PDF raporu başarıyla indirildi!', 'success');
            
            // Show export controls after first successful calculation
            showExportControls();
        } catch (error) {
            console.error('PDF export error:', error);
            hideLoading();
            showError('PDF oluşturulurken hata oluştu.');
        }
    }, 1000);
}

// Excel Export Function
function exportToExcel() {
    if (!projectResults.parselAlani) {
        showError('Önce hesaplama yapmalısınız!');
        return;
    }
    
    showExportLoading('Excel');
    
    setTimeout(() => {
        try {
            const csvData = generateCSVData();
            downloadTextFile(csvData, 'csv');
            hideLoading();
            showNotification('📊 Excel dosyası başarıyla indirildi!', 'success');
        } catch (error) {
            console.error('Excel export error:', error);
            hideLoading();
            showError('Excel dosyası oluşturulurken hata oluştu.');
        }
    }, 1000);
}

// Generate PDF content (simplified and clean)
function generatePDFContent() {
    const currentDate = new Date().toLocaleDateString('tr-TR');
    const currentTime = new Date().toLocaleTimeString('tr-TR');
    const city = document.getElementById('sehir').value;
    const imarDurumu = document.getElementById('imarDurumu').options[document.getElementById('imarDurumu').selectedIndex].text;
    
    // Calculate totals
    const totalApartments = blocks.reduce((total, block) => 
        total + Object.values(block.apartments).reduce((sum, count) => sum + count, 0), 0);
    
    return `İMAR HESAPLAYICI PRO - HESAPLAMA RAPORU
================================================

Rapor Tarihi: ${currentDate} ${currentTime}
Şehir: ${city.toUpperCase()}
İmar Durumu: ${imarDurumu}

TEMEL BİLGİLER
================================================
Parsel Alanı               : ${projectResults.parselAlani.toFixed(2)} m²
TAKS Katsayısı             : ${document.getElementById('taban').value}
KAKS Katsayısı             : ${document.getElementById('emsal').value}
Kat Yüksekliği             : ${document.getElementById('katYuksekligi').value} m

HESAPLAMA SONUÇLARI
================================================
Maksimum Taban Alanı       : ${projectResults.maxTabanAlani.toFixed(2)} m²
Maksimum İnşaat Alanı      : ${projectResults.maxInsaatAlani.toFixed(2)} m²
Maksimum Kat Sayısı        : ${projectResults.maxKatSayisi} kat
Maksimum Yükseklik         : ${projectResults.maxYukseklik.toFixed(1)} m
Açık Alan                  : ${projectResults.acikAlan.toFixed(2)} m²
Yapılaşma Oranı            : %${projectResults.yapilasmaorani.toFixed(1)}

BLOK PLANLAMA
================================================
Toplam Blok Sayısı         : ${blocks.length}
Toplam Daire Sayısı        : ${totalApartments}

${blocks.map(block => {
    const apartmentList = Object.entries(block.apartments)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ');
    return `Blok ${block.id}: ${block.floors} kat, ${block.totalArea.toFixed(0)} m² (${apartmentList || 'Planlanmamış'})`;
}).join('\n')}

ÖZET
================================================
Kullanılabilir İnşaat Alanı: ${projectResults.maxInsaatAlani.toFixed(0)} m²
Arsa Kullanım Verimliliği  : %${((projectResults.maxInsaatAlani / projectResults.parselAlani) * 100).toFixed(1)}
Açık Alan Oranı            : %${((projectResults.acikAlan / projectResults.parselAlani) * 100).toFixed(1)}

================================================
Bu rapor bilgilendirme amaçlıdır.
Resmi imar planlaması için yetkili kurumlara başvurunuz.

İmar Hesaplayıcısı Pro v2.0.1
© 2025 - Tüm hakları saklıdır`;
}

// Generate CSV data for Excel
function generateCSVData() {
    const data = [
        ['İmar Hesaplayıcısı Pro - Excel Raporu', '', '', ''],
        ['Rapor Tarihi', new Date().toLocaleDateString('tr-TR'), '', ''],
        ['Şehir', document.getElementById('sehir').value.toUpperCase(), '', ''],
        ['', '', '', ''],
        ['TEMEL BİLGİLER', '', '', ''],
        ['Alan/Değer', 'Birim', 'Değer', 'Açıklama'],
        ['Parsel Alanı', 'm²', projectResults.parselAlani.toFixed(2), 'Toplam arsa alanı'],
        ['TAKS', 'katsayı', document.getElementById('taban').value, 'Taban alanı katsayısı'],
        ['KAKS', 'katsayı', document.getElementById('emsal').value, 'Kat alanı katsayısı'],
        ['Kat Yüksekliği', 'm', document.getElementById('katYuksekligi').value, 'Standart kat yüksekliği'],
        ['', '', '', ''],
        ['HESAPLAMA SONUÇLARI', '', '', ''],
        ['Sonuç', 'Birim', 'Değer', 'Açıklama'],
        ['Maksimum Taban Alanı', 'm²', projectResults.maxTabanAlani.toFixed(2), 'Yapılabilecek taban alanı'],
        ['Maksimum İnşaat Alanı', 'm²', projectResults.maxInsaatAlani.toFixed(2), 'Toplam inşaat alanı'],
        ['Maksimum Kat Sayısı', 'kat', projectResults.maxKatSayisi, 'İzin verilen kat sayısı'],
        ['Maksimum Yükseklik', 'm', projectResults.maxYukseklik.toFixed(1), 'Toplam bina yüksekliği'],
        ['Açık Alan', 'm²', projectResults.acikAlan.toFixed(2), 'Yeşil alan ve açık alanlar'],
        ['Yapılaşma Oranı', '%', projectResults.yapilasmaorani.toFixed(1), 'Arsa kullanım oranı'],
        ['', '', '', ''],
        ['BLOK DETAYLARI', '', '', '']
    ];
    
    // Blok başlıkları
    data.push(['Blok No', 'Kat Sayısı', 'Toplam Alan (m²)', 'Daire Dağılımı']);
    
    // Blok verileri
    blocks.forEach(block => {
        const apartmentDetails = Object.entries(block.apartments)
            .map(([type, count]) => `${type}:${count}`)
            .join(' | ');
        
        data.push([
            `Blok ${block.id}`,
            block.floors,
            block.totalArea.toFixed(0),
            apartmentDetails || 'Planlanmamış'
        ]);
    });
    
    return data.map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
}

// Download file function
function downloadTextFile(content, type) {
    const mimeTypes = {
        'pdf': 'text/plain',
        'csv': 'text/csv'
    };
    
    const extensions = {
        'pdf': 'txt', // Simple text for now, can be upgraded to real PDF later
        'csv': 'csv'
    };
    
    const blob = new Blob(['\ufeff' + content], { 
        type: `${mimeTypes[type]};charset=utf-8` 
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imar_raporu_${new Date().toISOString().split('T')[0]}.${extensions[type]}`;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Web Share API
function shareResults() {
    if (!projectResults.parselAlani) {
        showError('Önce hesaplama yapmalısınız!');
        return;
    }
    
    const shareData = {
        title: 'İmar Hesaplayıcısı Pro - Hesaplama Sonuçları',
        text: `${projectResults.parselAlani}m² parsel için hesaplama tamamlandı. ${projectResults.maxInsaatAlani.toFixed(0)}m² inşaat alanı, ${blocks.length} blok planlandı. Toplam ${blocks.reduce((total, block) => total + Object.values(block.apartments).reduce((sum, count) => sum + count, 0), 0)} daire.`,
        url: window.location.href
    };
    
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        navigator.share(shareData)
            .then(() => showNotification('🔗 Sonuçlar başarıyla paylaşıldı!', 'success'))
            .catch(error => {
                console.log('Share error:', error);
                fallbackShare(shareData);
            });
    } else {
        fallbackShare(shareData);
    }
}

// Fallback share (clipboard)
function fallbackShare(shareData) {
    const shareText = `${shareData.title}\n\n${shareData.text}\n\n🔗 ${shareData.url}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText)
            .then(() => showNotification('📋 Sonuçlar panoya kopyalandı!', 'success'))
            .catch(() => showError('Paylaşım sırasında hata oluştu.'));
    } else {
        // Legacy fallback
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showNotification('📋 Sonuçlar panoya kopyalandı!', 'success');
            } else {
                showError('Paylaşım sırasında hata oluştu.');
            }
        } catch (err) {
            showError('Paylaşım sırasında hata oluştu.');
        }
        
        document.body.removeChild(textArea);
    }
}

// Show export controls after calculation
function showExportControls() {
    const exportControls = document.getElementById('exportControls');
    if (exportControls) {
        exportControls.style.display = 'block';
        exportControls.style.animation = 'slideInSuccess 0.3s ease-out';
    }
}

// Theme Management Functions
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeText = newTheme === 'dark' ? 'Koyu tema' : 'Açık tema';
    showNotification(`🎨 ${themeText} aktif edildi`, 'success');
    
    // Update button accessibility
    const toggleBtn = document.querySelector('.theme-toggle');
    if (toggleBtn) {
        toggleBtn.setAttribute('aria-label', 
            newTheme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'
        );
    }
}

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', theme);
}

// ===== ADVANCED CHARTS SYSTEM =====
let chartInstances = {};

// Chart color schemes
const chartColors = {
    primary: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'],
    gradients: [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    ]
};

// Create Area Distribution Chart (Pie Chart)
function createAreaChart() {
    const ctx = document.getElementById('areaChart').getContext('2d');
    
    if (chartInstances.areaChart) {
        chartInstances.areaChart.destroy();
    }
    
    const data = {
        labels: ['İnşaat Alanı', 'Açık Alan', 'Otopark Alanı', 'Yeşil Alan'],
        datasets: [{
            data: [
                projectResults.maxInsaatAlani,
                projectResults.acikAlan,
                projectResults.maxInsaatAlani * 0.15, // Estimated parking
                projectResults.acikAlan * 0.6 // Estimated green area
            ],
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(34, 197, 94, 0.8)'
            ],
            borderColor: [
                'rgb(59, 130, 246)',
                'rgb(16, 185, 129)',
                'rgb(245, 158, 11)',
                'rgb(34, 197, 94)'
            ],
            borderWidth: 2,
            hoverOffset: 10
        }]
    };

    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value.toFixed(0)} m² (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1500
            }
        }
    };

    chartInstances.areaChart = new Chart(ctx, config);
}

// Create Block Analysis Chart (Bar Chart)
function createBlockChart() {
    const ctx = document.getElementById('blockChart').getContext('2d');
    
    if (chartInstances.blockChart) {
        chartInstances.blockChart.destroy();
    }

    const blockData = blocks.map(block => ({
        label: `Blok ${block.id}`,
        floors: block.floors,
        area: block.totalArea,
        apartments: Object.values(block.apartments).reduce((sum, count) => sum + count, 0)
    }));

    const data = {
        labels: blockData.map(b => b.label),
        datasets: [
            {
                label: 'Kat Sayısı',
                data: blockData.map(b => b.floors),
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
                yAxisID: 'y'
            },
            {
                label: 'Alan (m² / 100)',
                data: blockData.map(b => b.area / 100),
                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 2,
                yAxisID: 'y'
            },
            {
                label: 'Daire Sayısı',
                data: blockData.map(b => b.apartments),
                backgroundColor: 'rgba(245, 158, 11, 0.7)',
                borderColor: 'rgb(245, 158, 11)',
                borderWidth: 2,
                yAxisID: 'y1'
            }
        ]
    };

    const config = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Bloklar'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Kat Sayısı / Alan (m²/100)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Daire Sayısı'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    };

    chartInstances.blockChart = new Chart(ctx, config);
}

// Create Apartment Distribution Chart (Pie Chart)
function createApartmentChart() {
    const ctx = document.getElementById('apartmentChart').getContext('2d');
    
    if (chartInstances.apartmentChart) {
        chartInstances.apartmentChart.destroy();
    }

    // Aggregate apartment types across all blocks
    const apartmentTotals = {};
    blocks.forEach(block => {
        Object.entries(block.apartments).forEach(([type, count]) => {
            apartmentTotals[type] = (apartmentTotals[type] || 0) + count;
        });
    });

    const data = {
        labels: Object.keys(apartmentTotals),
        datasets: [{
            data: Object.values(apartmentTotals),
            backgroundColor: [
                'rgba(139, 92, 246, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: [
                'rgb(139, 92, 246)',
                'rgb(59, 130, 246)',
                'rgb(16, 185, 129)',
                'rgb(245, 158, 11)',
                'rgb(239, 68, 68)'
            ],
            borderWidth: 2,
            hoverOffset: 8
        }]
    };

    const config = {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value} adet (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                duration: 1500
            }
        }
    };

    chartInstances.apartmentChart = new Chart(ctx, config);
}

// Create Efficiency Analysis Chart (Radar Chart)
function createEfficiencyChart() {
    const ctx = document.getElementById('efficiencyChart').getContext('2d');
    
    if (chartInstances.efficiencyChart) {
        chartInstances.efficiencyChart.destroy();
    }

    // Calculate efficiency metrics
    const tabanKullanimOrani = (projectResults.maxTabanAlani / projectResults.parselAlani) * 100;
    const emsalKullanimOrani = (projectResults.maxInsaatAlani / (projectResults.parselAlani * parseFloat(document.getElementById('emsal').value))) * 100;
    const yukseklikVerimliligi = (projectResults.maxYukseklik / projectResults.maxYukseklikLimit) * 100;
    const acikAlanOrani = (projectResults.acikAlan / projectResults.parselAlani) * 100;
    const yapilasmaDengeisi = Math.min(100, (100 - Math.abs(tabanKullanimOrani - emsalKullanimOrani)));

    const data = {
        labels: [
            'Taban Alan Kullanımı',
            'Emsal Kullanımı', 
            'Yükseklik Verimliliği',
            'Açık Alan Oranı',
            'Yapılaşma Dengesi'
        ],
        datasets: [{
            label: 'Mevcut Proje',
            data: [tabanKullanimOrani, emsalKullanimOrani, yukseklikVerimliligi, acikAlanOrani, yapilasmaDengeisi],
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgb(59, 130, 246)',
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            pointRadius: 4
        }, {
            label: 'Optimal Değerler',
            data: [85, 90, 80, 40, 95],
            fill: true,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgb(16, 185, 129)',
            pointBackgroundColor: 'rgb(16, 185, 129)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(16, 185, 129)',
            borderWidth: 2,
            pointRadius: 4,
            borderDash: [5, 5]
        }]
    };

    const config = {
        type: 'radar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                line: {
                    borderWidth: 3
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.r.toFixed(1)}%`;
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    };

    chartInstances.efficiencyChart = new Chart(ctx, config);
}

// Update all charts after calculation
function updateAllCharts() {
    if (!projectResults.parselAlani) return;
    
    setTimeout(() => {
        createAreaChart();
        createBlockChart();
        createApartmentChart();
        createEfficiencyChart();
        
        // Also create mobile charts
        createMobileCharts();
    }, 500); // Small delay for smooth animation
}

// Create mobile-specific charts
function createMobileCharts() {
    // Mobile Area Chart
    const mobileAreaCtx = document.getElementById('mobileAreaCanvas');
    if (mobileAreaCtx) {
        createMobileAreaChart();
    }
    
    // Mobile Block Chart
    const mobileBlockCtx = document.getElementById('mobileBlockCanvas');
    if (mobileBlockCtx) {
        createMobileBlockChart();
    }
    
    // Mobile Apartment Chart
    const mobileApartmentCtx = document.getElementById('mobileApartmentCanvas');
    if (mobileApartmentCtx) {
        createMobileApartmentChart();
    }
    
    // Mobile Efficiency Chart
    const mobileEfficiencyCtx = document.getElementById('mobileEfficiencyCanvas');
    if (mobileEfficiencyCtx) {
        createMobileEfficiencyChart();
    }
}

// Mobile chart creation functions (optimized for mobile)
function createMobileAreaChart() {
    const ctx = document.getElementById('mobileAreaCanvas').getContext('2d');
    
    if (chartInstances.mobileAreaChart) {
        chartInstances.mobileAreaChart.destroy();
    }
    
    const data = {
        labels: ['İnşaat Alanı', 'Açık Alan', 'Otopark', 'Yeşil Alan'],
        datasets: [{
            data: [
                projectResults.maxInsaatAlani,
                projectResults.acikAlan,
                projectResults.maxInsaatAlani * 0.15,
                projectResults.acikAlan * 0.6
            ],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#22c55e'],
            borderWidth: 0
        }]
    };

    chartInstances.mobileAreaChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 10, font: { size: 12 } }
                }
            }
        }
    });
}

function createMobileBlockChart() {
    const ctx = document.getElementById('mobileBlockCanvas').getContext('2d');
    
    if (chartInstances.mobileBlockChart) {
        chartInstances.mobileBlockChart.destroy();
    }
    
    const blockData = blocks.map(block => ({
        label: `Blok ${block.id}`,
        floors: block.floors,
        apartments: Object.values(block.apartments).reduce((sum, count) => sum + count, 0)
    }));

    chartInstances.mobileBlockChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: blockData.map(b => b.label),
            datasets: [{
                label: 'Kat Sayısı',
                data: blockData.map(b => b.floors),
                backgroundColor: '#3b82f6'
            }, {
                label: 'Daire Sayısı',
                data: blockData.map(b => b.apartments),
                backgroundColor: '#f59e0b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
}

function createMobileApartmentChart() {
    const ctx = document.getElementById('mobileApartmentCanvas').getContext('2d');
    
    if (chartInstances.mobileApartmentChart) {
        chartInstances.mobileApartmentChart.destroy();
    }
    
    const apartmentTotals = {};
    blocks.forEach(block => {
        Object.entries(block.apartments).forEach(([type, count]) => {
            apartmentTotals[type] = (apartmentTotals[type] || 0) + count;
        });
    });

    chartInstances.mobileApartmentChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(apartmentTotals),
            datasets: [{
                data: Object.values(apartmentTotals),
                backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 10 } }
            }
        }
    });
}

function createMobileEfficiencyChart() {
    const ctx = document.getElementById('mobileEfficiencyCanvas').getContext('2d');
    
    if (chartInstances.mobileEfficiencyChart) {
        chartInstances.mobileEfficiencyChart.destroy();
    }
    
    const tabanKullanimOrani = (projectResults.maxTabanAlani / projectResults.parselAlani) * 100;
    const emsalKullanimOrani = (projectResults.maxInsaatAlani / (projectResults.parselAlani * parseFloat(document.getElementById('emsal').value))) * 100;
    const yukseklikVerimliligi = (projectResults.maxYukseklik / projectResults.maxYukseklikLimit) * 100;
    const acikAlanOrani = (projectResults.acikAlan / projectResults.parselAlani) * 100;
    const yapilasmaDengeisi = Math.min(100, (100 - Math.abs(tabanKullanimOrani - emsalKullanimOrani)));

    chartInstances.mobileEfficiencyChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Taban Alan', 'Emsal', 'Yükseklik', 'Açık Alan', 'Denge'],
            datasets: [{
                label: 'Mevcut',
                data: [tabanKullanimOrani, emsalKullanimOrani, yukseklikVerimliligi, acikAlanOrani, yapilasmaDengeisi],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: { suggestedMin: 0, suggestedMax: 100 }
            }
        }
    });
}

// Switch mobile chart
function switchMobileChart(chartType) {
    const mobileCharts = document.querySelectorAll('.mobile-single-chart .chart-item');
    mobileCharts.forEach(chart => chart.classList.remove('active'));
    
    const targetChart = document.getElementById(`mobile${chartType.charAt(0).toUpperCase() + chartType.slice(1)}Chart`);
    if (targetChart) {
        targetChart.classList.add('active');
    }
}

// Auto-generate PDF after calculation
function autoGeneratePDF() {
    if (!projectResults.parselAlani) return;
    
    try {
        const pdfContent = generatePDFContent();
        downloadTextFile(pdfContent, 'pdf');
        
        // Show success notification
        showNotification('📄 Hesaplama raporu otomatik olarak indirildi!', 'success');
        
        console.log('Auto PDF generated successfully');
    } catch (error) {
        console.error('Auto PDF generation failed:', error);
        // Don't show error to user for auto-generation, just log it
    }
}

// Switch between 3D and Charts view
function switchVisualization(type) {
    const tabs = document.querySelectorAll('.viz-tab');
    const containers = document.querySelectorAll('.visualization-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    containers.forEach(container => container.classList.remove('active'));
    
    document.querySelector(`[data-tab="${type}"]`).classList.add('active');
    document.getElementById(`${type}-container`).classList.add('active');
    
    if (type === 'charts' && projectResults.parselAlani) {
        // Delay chart creation to ensure container is visible
        setTimeout(updateAllCharts, 100);
    } else if (type === '3d' && projectResults.parselAlani) {
        setTimeout(update3DVisualization, 100);
    }
}

// ===== 3D VISUALIZATION SYSTEM =====
let scene, camera, renderer, controls;
let buildingGroup, animationId;
let is3DInitialized = false;
let wireframeMode = false;
let animationEnabled = false;

// Initialize 3D Scene
function init3DScene() {
    const container = document.getElementById('buildingVisual3D');
    if (!container || is3DInitialized) return;
    
    // Clear placeholder content
    container.innerHTML = '';
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    scene.fog = new THREE.Fog(0xf0f0f0, 50, 200);
    
    // Camera setup
    const containerRect = container.getBoundingClientRect();
    camera = new THREE.PerspectiveCamera(75, containerRect.width / containerRect.height, 0.1, 1000);
    camera.position.set(30, 30, 30);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRect.width, containerRect.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Controls setup (using OrbitControls if available)
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 10;
        controls.maxDistance = 100;
        controls.maxPolarAngle = Math.PI / 2.1;
    }
    
    // Lighting setup
    setupLighting();
    
    // Ground plane
    createGround();
    
    // Building group
    buildingGroup = new THREE.Group();
    scene.add(buildingGroup);
    
    is3DInitialized = true;
    
    // Start animation loop
    animate3D();
    
    // Show 3D controls
    document.getElementById('3d-controls').style.display = 'flex';
    
    console.log('3D Scene initialized successfully');
}

// Setup 3D Lighting
function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 25);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    
    // Point light for better illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(0, 20, 0);
    scene.add(pointLight);
}

// Create ground plane
function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x90EE90,
        transparent: true,
        opacity: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Grid helper
    const gridHelper = new THREE.GridHelper(100, 50, 0x888888, 0xcccccc);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
}

// Create 3D building model
function create3DBuildingModel() {
    if (!buildingGroup) return;
    
    // Clear previous buildings
    buildingGroup.clear();
    
    if (!projectResults.parselAlani || blocks.length === 0) return;
    
    // Calculate scale based on parcel size
    const scale = Math.min(40 / Math.sqrt(projectResults.parselAlani), 1);
    
    // Create parcel boundary
    createParcelBoundary(scale);
    
    // Create buildings for each block
    blocks.forEach((block, index) => {
        create3DBlock(block, index, scale);
    });
    
    console.log(`Created 3D model with ${blocks.length} blocks`);
}

// Create parcel boundary
function createParcelBoundary(scale) {
    const parcelSize = Math.sqrt(projectResults.parselAlani) * scale;
    
    // Parcel outline
    const parcelGeometry = new THREE.PlaneGeometry(parcelSize, parcelSize);
    const parcelMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x333333,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide
    });
    const parcelMesh = new THREE.Mesh(parcelGeometry, parcelMaterial);
    parcelMesh.rotation.x = -Math.PI / 2;
    parcelMesh.position.y = 0.02;
    buildingGroup.add(parcelMesh);
    
    // Parcel border
    const borderGeometry = new THREE.EdgesGeometry(parcelGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    const borderLines = new THREE.LineSegments(borderGeometry, borderMaterial);
    borderLines.rotation.x = -Math.PI / 2;
    borderLines.position.y = 0.03;
    buildingGroup.add(borderLines);
}

// Create 3D block
function create3DBlock(block, index, scale) {
    const parcelSize = Math.sqrt(projectResults.parselAlani) * scale;
    const blockSpacing = parcelSize / Math.max(2, Math.ceil(Math.sqrt(blocks.length)));
    
    // Calculate block position
    const cols = Math.ceil(Math.sqrt(blocks.length));
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    const x = (col - (cols - 1) / 2) * blockSpacing;
    const z = (row - (Math.ceil(blocks.length / cols) - 1) / 2) * blockSpacing;
    
    // Building dimensions
    const buildingWidth = blockSpacing * 0.6;
    const buildingDepth = blockSpacing * 0.6;
    const floorHeight = 3;
    const buildingHeight = block.floors * floorHeight;
    
    // Create building geometry
    const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    
    // Building material with color variation
    const colors = [0x4f46e5, 0x059669, 0xdc2626, 0xf59e0b, 0x8b5cf6];
    const buildingColor = colors[index % colors.length];
    
    const buildingMaterial = new THREE.MeshLambertMaterial({ 
        color: buildingColor,
        transparent: true,
        opacity: 0.8
    });
    
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(x, buildingHeight / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    
    // Add building to group
    buildingGroup.add(building);
    
    // Create floor separators
    for (let floor = 1; floor < block.floors; floor++) {
        const separatorGeometry = new THREE.PlaneGeometry(buildingWidth + 0.2, buildingDepth + 0.2);
        const separatorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x333333,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const separator = new THREE.Mesh(separatorGeometry, separatorMaterial);
        separator.position.set(x, floor * floorHeight, z);
        separator.rotation.x = -Math.PI / 2;
        buildingGroup.add(separator);
    }
    
    // Add building label
    createBuildingLabel(block, x, buildingHeight + 2, z);
    
    // Store reference for interaction
    building.userData = { blockId: block.id, blockData: block };
}

// Create building label
function createBuildingLabel(block, x, y, z) {
    // Create a simple text representation using a small plane
    const labelGeometry = new THREE.PlaneGeometry(3, 1);
    const labelMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(x, y, z);
    label.lookAt(camera.position);
    buildingGroup.add(label);
    
    // In a real implementation, you'd use THREE.TextGeometry or a canvas texture
    // For now, we'll use a simple colored plane as a placeholder
}

// Animation loop
function animate3D() {
    if (!renderer || !scene || !camera) return;
    
    animationId = requestAnimationFrame(animate3D);
    
    // Update controls
    if (controls) {
        controls.update();
    }
    
    // Building animation
    if (animationEnabled && buildingGroup) {
        buildingGroup.rotation.y += 0.005;
    }
    
    // Render scene
    renderer.render(scene, camera);
}

// Update 3D visualization after calculation
function update3DVisualization() {
    if (!projectResults.parselAlani) return;
    
    if (!is3DInitialized) {
        init3DScene();
    }
    
    create3DBuildingModel();
    
    // Animate camera to show the new model
    if (camera && controls) {
        const targetDistance = Math.max(20, Math.sqrt(projectResults.parselAlani) * 0.1);
        camera.position.set(targetDistance, targetDistance, targetDistance);
        camera.lookAt(0, 0, 0);
        if (controls.update) controls.update();
    }
}

// 3D Control functions
function reset3DView() {
    if (camera && controls) {
        camera.position.set(30, 30, 30);
        camera.lookAt(0, 0, 0);
        if (controls.reset) controls.reset();
        if (controls.update) controls.update();
        
        showNotification('🔄 3D görünüm sıfırlandı', 'success');
    }
}

function toggle3DWireframe() {
    if (!buildingGroup) return;
    
    wireframeMode = !wireframeMode;
    
    buildingGroup.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material.wireframe = wireframeMode;
        }
    });
    
    const modeText = wireframeMode ? 'Wireframe' : 'Normal';
    showNotification(`📐 ${modeText} modu aktif`, 'success');
}

function toggle3DAnimation() {
    animationEnabled = !animationEnabled;
    
    const statusText = animationEnabled ? 'başlatıldı' : 'durduruldu';
    const icon = animationEnabled ? '▶️' : '⏸️';
    showNotification(`${icon} Animasyon ${statusText}`, 'success');
    
    // Update button text
    const animBtn = document.querySelector('[onclick="toggle3DAnimation()"]');
    if (animBtn) {
        animBtn.innerHTML = `${animationEnabled ? '⏸️' : '▶️'} ${animationEnabled ? 'Durdur' : 'Animasyon'}`;
    }
}

// Handle window resize for 3D
function handle3DResize() {
    if (!renderer || !camera) return;
    
    const container = document.getElementById('buildingVisual3D');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    
    camera.aspect = containerRect.width / containerRect.height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(containerRect.width, containerRect.height);
}

// Add window resize listener
window.addEventListener('resize', handle3DResize);

// Global scope'a PWA fonksiyonları ekle
window.installPWA = installPWA;
window.hideInstallBanner = hideInstallBanner;
window.updateBlockFloors = updateBlockFloors;
window.switchTab = switchTab;
window.debugApp = debugApp;
window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;
window.shareResults = shareResults;
window.toggleTheme = toggleTheme;
window.switchVisualization = switchVisualization;
window.reset3DView = reset3DView;
window.toggle3DWireframe = toggle3DWireframe;
window.toggle3DAnimation = toggle3DAnimation;
