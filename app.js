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

// Service Worker kaydı
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('SW registered:', registration);
                })
                .catch(error => {
                    console.error('SW registration failed:', error);
                });
        });
    }
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
    
    let svg = `<svg width="100%" height="100%" viewBox="0 0 300 280" style="background: #f8f9fa;">
        <text x="150" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#1f2937">
            📐 Tipik Kat Planı
        </text>`;
    
    let currentY = 40;
    selectedApartmentTypes.forEach((apt, index) => {
        const roomCount = apartmentTypes[apt.type]?.rooms || 2;
        const width = Math.min(120, Math.sqrt(apt.area) * 2);
        const height = Math.min(60, apt.area / width * 0.6);
        
        // Daire ana çerçevesi
        svg += `<rect x="50" y="${currentY}" width="${width}" height="${height}" 
                fill="#ffffff" stroke="#2d3748" stroke-width="2"/>`;
        
        // Odalar
        const roomsPerRow = Math.ceil(Math.sqrt(roomCount));
        const roomWidth = width / roomsPerRow;
        const roomHeight = height / Math.ceil(roomCount / roomsPerRow);
        
        for (let room = 0; room < roomCount; room++) {
            const roomX = 50 + (room % roomsPerRow) * roomWidth;
            const roomY = currentY + Math.floor(room / roomsPerRow) * roomHeight;
            
            svg += `<rect x="${roomX}" y="${roomY}" width="${roomWidth - 1}" height="${roomHeight - 1}" 
                    fill="none" stroke="#cbd5e0" stroke-width="1"/>`;
            
            let roomName = '';
            if (room === 0) roomName = 'Salon';
            else if (room === roomCount - 1) roomName = 'Mutfak';
            else roomName = `Oda${room}`;
            
            svg += `<text x="${roomX + roomWidth/2}" y="${roomY + roomHeight/2}" 
                    text-anchor="middle" font-size="8" fill="#4a5568">${roomName}</text>`;
        }
        
        // Kapı
        svg += `<rect x="48" y="${currentY + height/2 - 3}" width="4" height="6" fill="#8b4513"/>`;
        
        // Daire bilgisi
        svg += `<text x="${50 + width + 10}" y="${currentY + height/2}" font-size="12" fill="#1f2937" font-weight="bold">
                ${apt.type} - ${apt.area}m²</text>`;
        
        currentY += height + 25;
    });
    
    svg += '</svg>';
    floorPlan.innerHTML = svg;
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

// Global scope'a fonksiyonları ekle
window.addBlock = addBlock;
window.removeBlock = removeBlock;
window.updateBlockFloors = updateBlockFloors;
window.switchTab = switchTab;
window.debugApp = debugApp;
