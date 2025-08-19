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
    
    if (!validateForm()) {
        console.log('Form validasyonu başarısız');
        return;
    }
    
    showLoading(true);
    
    setTimeout(() => {
        performCalculation();
        showLoading(false);
    }, 2000);
}

// Loading gösterimi
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.toggle('show', show);
    }
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
    // Ortak alan oranı (%)
    let ortakOran = parseFloat(document.getElementById('ortakOran')?.value);
    if (isNaN(ortakOran)) ortakOran = 2.0;
    ortakOran = Math.max(0, Math.min(50, ortakOran));
    const ortakOranDecimal = ortakOran / 100;
    
    console.log('Hesaplama parametreleri:', { city, parselAlani, taban, emsal, katYuksekligi, ortakOran });
    
    // Şehir bazlı yükseklik sınırı
    const maxYukseklikLimit = (city && cityRegulations[city]) 
        ? cityRegulations[city].maxHeight 
        : 12.5;
    
    // Hesaplamalar
    const maxTabanAlani = parselAlani * taban;
    const maxInsaatAlani = parselAlani * emsal;
    const netInsaatAlani = maxInsaatAlani * (1 - ortakOranDecimal);
    const toplamOrtakAlan = maxInsaatAlani - netInsaatAlani;
    
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
        maxYukseklikLimit,
        ortakOran: ortakOranDecimal,
        netInsaatAlani,
        toplamOrtakAlan
    };
    
    console.log('Hesaplama sonuçları:', projectResults);
    
    // UI'ı güncelle
    updateResultsUI();
    autoCalculateBlocks();
    updateVisualization();
    updateFloorPlan();
    showSuccessMessage(maxInsaatAlani);
}

// Sonuçları UI'da göster
function updateResultsUI() {
    const elements = {
        'maxTabanAlani': projectResults.maxTabanAlani.toFixed(2) + ' m²',
        'maxInsaatAlani': projectResults.maxInsaatAlani.toFixed(2) + ' m²',
        'netInsaatAlani': (projectResults.netInsaatAlani ?? projectResults.maxInsaatAlani).toFixed(2) + ' m²',
        'toplamOrtakAlan': (projectResults.toplamOrtakAlan ?? 0).toFixed(2) + ' m²',
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

// Form doğrulama
function validateForm() {
    let isValid = true;
    const requiredFields = [
        { id: 'sehir', name: 'Şehir' },
        { id: 'parselAlani', name: 'Parsel Alanı' },
        { id: 'imarDurumu', name: 'İmar Durumu' }
    ];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element) return;
        
        const value = element.value.trim();
        
        if (!value || (field.id === 'parselAlani' && parseFloat(value) <= 0)) {
            element.style.borderColor = '#ef4444';
            isValid = false;
            console.log(`Validation failed for ${field.name}`);
        } else {
            element.style.borderColor = '#e5e7eb';
        }
    });
    
    if (!isValid) {
        showError('Lütfen tüm zorunlu alanları doldurun!');
    }
    
    return isValid;
}

// Hata mesajı göster
function showError(message) {
    const imarNotlari = document.getElementById('imarNotlari');
    if (imarNotlari) {
        imarNotlari.innerHTML = `<div class="error">❌ ${message}</div>`;
    }
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
    // Daire tahsisi net inşaat alanına göre yapılmalı
    const baseArea = projectResults.netInsaatAlani ?? projectResults.maxInsaatAlani;
    const areaPerFloor = totalFloors > 0 ? baseArea / totalFloors : 0;
    
    let totalApartments = 0;
    
    blocks.forEach(block => {
        block.totalArea = block.floors * areaPerFloor;
        block.apartments = {};
        block.commonArea = (projectResults.toplamOrtakAlan ?? 0) / blocks.length;
        block.grossArea = block.totalArea + block.commonArea;
        
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
                    <span class="result-label">Net Alan:</span>
                    <span class="result-value">${block.totalArea.toFixed(0)} m²</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Ortak Alan:</span>
                    <span class="result-value">${(block.commonArea || 0).toFixed(0)} m²</span>
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
        Net Alan: ${(projectResults.netInsaatAlani ?? projectResults.maxInsaatAlani).toFixed(0)} m² | Ortak: ${(projectResults.toplamOrtakAlan ?? 0).toFixed(0)} m²
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
    const blockWidth = Math.min(60, Math.max(30, 260 / Math.max(1, blockCount)));
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
        
        // Sade blok: net alan (mavi) + ortak alan (turuncu) yığılmış bar
        const grossHeight = blockHeight;
        const netRatio = block.totalArea / (block.totalArea + (block.commonArea || 0) || 1);
        const netHeight = grossHeight * netRatio;
        const commonHeight = grossHeight - netHeight;
        
        // Ortak alan
        if (commonHeight > 0.5) {
            svg += `<rect x="${x}" y="${y}" width="${blockWidth}" height="${commonHeight}" fill="#fbbf24" stroke="#92400e" stroke-width="0.5"/>`;
        }
        // Net alan
        svg += `<rect x="${x}" y="${y + commonHeight}" width="${blockWidth}" height="${netHeight}" fill="#60a5fa" stroke="#1e40af" stroke-width="0.5"/>`;
        
        // Blok bilgileri
        svg += `<text x="${x + blockWidth/2}" y="${y + blockHeight + 18}" text-anchor="middle" 
                font-size="12" fill="#1f2937" font-weight="bold">Blok ${block.id}</text>`;
        svg += `<text x="${x + blockWidth/2}" y="${y + blockHeight + 32}" text-anchor="middle" 
                font-size="9" fill="#6b7280">${floors} kat</text>`;
        svg += `<text x="${x + blockWidth/2}" y="${y + blockHeight + 45}" text-anchor="middle" 
                font-size="9" fill="#6b7280">Net: ${Math.round(block.totalArea)}m²</text>`;
    });
    
    // Açık alanlar
    svg += `<rect x="20" y="180" width="280" height="35" fill="#90EE90" fill-opacity="0.4" stroke="#228B22" stroke-width="1"/>
            <text x="160" y="200" text-anchor="middle" font-size="11" fill="#228B22" font-weight="bold">
                🌳 Açık Alan: ${projectResults.acikAlan.toFixed(0)}m²
            </text>`;
    
    // Özet bilgiler
    const totalApartments = document.getElementById('toplamDaireSayisi')?.textContent || '0';
    // Legend ve özet
    svg += `<g>
            <rect x="20" y="235" width="10" height="10" fill="#60a5fa" stroke="#1e40af" stroke-width="0.5"/>
            <text x="35" y="244" font-size="10" fill="#1f2937">Net Alan</text>
            <rect x="100" y="235" width="10" height="10" fill="#fbbf24" stroke="#92400e" stroke-width="0.5"/>
            <text x="115" y="244" font-size="10" fill="#1f2937">Ortak Alan</text>
        </g>`;
    svg += `<text x="20" y="260" font-size="10" fill="#1f2937" font-weight="bold">
                📊 Toplam: ${blocks.length} blok, ${totalApartments} daire
            </text>`;
    svg += `<text x="20" y="275" font-size="10" fill="#1f2937">
                🏗️ Max Yükseklik: ${projectResults.maxYukseklik}m (Limit: ${projectResults.maxYukseklikLimit}m) | Net: ${(projectResults.netInsaatAlani ?? projectResults.maxInsaatAlani).toFixed(0)}m², Ortak: ${(projectResults.toplamOrtakAlan ?? 0).toFixed(0)}m²
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

// Global scope'a PWA fonksiyonları ekle
window.installPWA = installPWA;
window.hideInstallBanner = hideInstallBanner;
window.updateBlockFloors = updateBlockFloors;
window.switchTab = switchTab;
window.debugApp = debugApp;   
