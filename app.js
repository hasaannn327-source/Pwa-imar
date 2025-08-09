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
    'adana': {
        maxHeight: 11.0,
        regulations: ['Sıcaklık faktörü', 'Güneş ışığı koruma', 'Havalandırma önemli'],
        konutTaks: { '1': 0.28, '2': 0.33, '3': 0.38 },
        konutEmsal: { '1': 0.9, '2': 1.4, '3': 1.9 }
    },
    'konya': {
        maxHeight: 14.0,
        regulations: ['Karasal iklim', 'Deprem riski düşük', 'Tarihî doku korunmalı'],
        konutTaks: { '1': 0.33, '2': 0.38, '3': 0.43 },
        konutEmsal: { '1': 1.1, '2': 1.7, '3': 2.2 }
    },
    'gaziantep': {
        maxHeight: 12.0,
        regulations: ['Kültürel miras', 'Sıcaklık kontrolü', 'Yerel malzeme kullanımı'],
        konutTaks: { '1': 0.29, '2': 0.34, '3': 0.39 },
        konutEmsal: { '1': 1.0, '2': 1.5, '3': 2.0 }
    },
    'kayseri': {
        maxHeight: 13.5,
        regulations: ['Kar yükü', 'Rüzgar direnci', 'Enerji verimliliği'],
        konutTaks: { '1': 0.31, '2': 0.36, '3': 0.41 },
        konutEmsal: { '1': 1.05, '2': 1.6, '3': 2.1 }
    },
    'diger': {
        maxHeight: 12.5,
        regulations: ['Genel imar yönetmeliği uygulanır', 'Yerel idareden onay gerekli'],
        konutTaks: { '1': 0.30, '2': 0.35, '3': 0.40 },
        konutEmsal: { '1': 1.0, '2': 1.5, '3': 2.0 }
    }
};

// Daire tipleri ve alanları
const apartmentTypes = {
    '1+1': { area: 65, rooms: 2 },
    '2+1': { area: 95, rooms: 3 },
    '3+1': { area: 125, rooms: 4 },
    '4+1': { area: 160, rooms: 5 },
    'dubleks': { area: 200, rooms: 6 }
};

// Global değişkenler
let blocks = [];
let selectedApartmentTypes = [];
let projectResults = {};

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Şehir değişikliğinde imar yönetmeliği güncelle
    document.getElementById('sehir').addEventListener('change', function() {
        updateCityRegulations(this.value);
    });

    // İmar durumu değişikliğinde katsayıları güncelle
    document.getElementById('imarDurumu').addEventListener('change', function() {
        updateZoningCoefficients(this.value);
    });

    // Daire tipi seçimi
    document.querySelectorAll('.apartment-type').forEach(type => {
        type.addEventListener('click', function() {
            this.classList.toggle('selected');
            updateSelectedApartments();
        });
    });

    // Form submit
    document.getElementById('calculatorForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        // Loading göster
        document.getElementById('loading').classList.add('show');
        
        // Hesaplama simülasyonu
        setTimeout(() => {
            hesapla();
            document.getElementById('loading').classList.remove('show');
        }, 2000);
    });

    // Varsayılan daire tiplerini seç
    selectDefaultApartments();
});

// Şehir bazlı imar yönetmeliği güncelleme
function updateCityRegulations(city) {
    const imarNotlari = document.getElementById('imarNotlari');
    
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

// İmar durumuna göre katsayıları güncelleme
function updateZoningCoefficients(zoning) {
    const city = document.getElementById('sehir').value;
    const tabanInput = document.getElementById('taban');
    const emsalInput = document.getElementById('emsal');
    
    if (city && cityRegulations[city] && zoning.startsWith('konut-')) {
        const level = zoning.split('-')[1];
        tabanInput.value = cityRegulations[city].konutTaks[level] || 0.30;
        emsalInput.value = cityRegulations[city].konutEmsal[level] || 1.00;
    } else {
        // Genel değerler
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
    
    if (apt2plus1) apt2plus1.classList.add('selected');
    if (apt3plus1) apt3plus1.classList.add('selected');
    
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

// Blok ekleme
function addBlock() {
    const blockId = blocks.length + 1;
    const block = {
        id: blockId,
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

// Blok görünümünü güncelle
function updateBlockDisplay() {
    const container = document.getElementById('blockList');
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
    
    if (blocks.length === 0) {
        html = '<p style="text-align: center; color: #6b7280;">Henüz blok eklenmemiş</p>';
    }
    
    container.innerHTML = html;
}

// Blok kat sayısını güncelle
function updateBlockFloors(blockIndex, floors) {
    blocks[blockIndex].floors = parseInt(floors);
    calculateBlocks();
}

// Blok hesaplamalarını yap
function calculateBlocks() {
    if (!projectResults.maxInsaatAlani || blocks.length === 0) {
        document.getElementById('toplamBlokSayisi').textContent = '0';
        document.getElementById('toplamDaireSayisi').textContent = '0';
        return;
    }
    
    const totalFloors = blocks.reduce((sum, block) => sum + block.floors, 0);
    const areaPerFloor = projectResults.maxInsaatAlani / totalFloors;
    
    let totalApartments = 0;
    
    blocks.forEach(block => {
        block.totalArea = block.floors * areaPerFloor;
        
        // Her blokta daire dağılımı hesapla
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
    
    document.getElementById('toplamBlokSayisi').textContent = blocks.length;
    document.getElementById('toplamDaireSayisi').textContent = totalApartments;
    
    updateBlockDisplay();
    updateApartmentList();
    updateVisualization();
}

// Daire listesini güncelle
function updateApartmentList() {
    const container = document.getElementById('daireListesiDetay');
    
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
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// Ana hesaplama fonksiyonu
function hesapla() {
    const city = document.getElementById('sehir').value;
    const parselAlani = parseFloat(document.getElementById('parselAlani').value);
    const taban = parseFloat(document.getElementById('taban').value);
    const emsal = parseFloat(document.getElementById('emsal').value);
    const katYuksekligi = parseFloat(document.getElementById('katYuksekligi').value);
    
    // Şehir bazlı yükseklik sınırı
    const maxYukseklikLimit = (city && cityRegulations[city]) 
        ? cityRegulations[city].maxHeight 
        : 12.5;
    
    // Hesaplamalar
    const maxTabanAlani = parselAlani * taban;
    const maxInsaatAlani = parselAlani * emsal;
    
    // Maksimum kat sayısını hesapla
    let maxKatSayisi = Math.ceil(emsal / taban);
    
    // Şehir bazlı yükseklik kontrolü
    const maxKatSayisiYukseklikIle = Math.floor(maxYukseklikLimit / katYuksekligi);
    maxKatSayisi = Math.min(maxKatSayisi, maxKatSayisiYukseklikIle);
    
    // Gerçek maksimum yükseklik
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
    
    // Sonuçları güncelle
    document.getElementById('maxTabanAlani').textContent = maxTabanAlani.toFixed(2) + ' m²';
    document.getElementById('maxInsaatAlani').textContent = maxInsaatAlani.toFixed(2) + ' m²';
    document.getElementById('maxKatSayisi').textContent = maxKatSayisi + ' kat';
    document.getElementById('maxYukseklik').textContent = maxYukseklik.toFixed(1) + ' m';
    document.getElementById('acikAlan').textContent = acikAlan.toFixed(2) + ' m²';
    document.getElementById('yapilasmaorani').textContent = '%' + yapilasmaorani.toFixed(1);
    
    // Otomatik blok hesaplaması
    autoCalculateBlocks();
    
    // Görselleştirmeyi güncelle
    updateVisualization();
    updateFloorPlan();
    
    // Başarı mesajı
    showSuccessMessage(maxInsaatAlani);
}

// Başarı mesajını göster
function showSuccessMessage(maxInsaatAlani) {
    const imarNotlari = document.getElementById('imarNotlari');
    let currentContent = imarNotlari.innerHTML;
    const suggestedBlocks = suggestBlockCount(maxInsaatAlani);
    
    imarNotlari.innerHTML = currentContent + 
        `<div class="success">✅ Hesaplama tamamlandı! Toplam ${maxInsaatAlani.toFixed(0)}m² inşaat alanından ${suggestedBlocks} blok önerilir.</div>`;
}

// Otomatik blok sayısı hesaplama
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
    
    // Mevcut blokları temizle ve otomatik oluştur
    blocks = [];
    const suggestedBlockCount = suggestBlockCount(projectResults.maxInsaatAlani);
    
    for (let i = 0; i < suggestedBlockCount; i++) {
        const block = {
            id: i + 1,
            floors: Math.min(projectResults.maxKatSayisi, 5), // Max 5 kat per blok
            apartments: {},
            totalArea: 0
        };
        blocks.push(block);
    }
    
    calculateBlocks();
}

// Yerleşim planı görselleştirmesi
function updateVisualization() {
    const buildingVisual = document.getElementById('buildingVisual');
    
    if (!projectResults.maxInsaatAlani || blocks.length === 0) {
        buildingVisual.innerHTML = '<p style="text-align:center; padding:100px 20px; color: #6b7280;">Hesaplama sonrası görüntülenecek</p>';
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
        
        // Blok numarası ve bilgiler
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
    svg += `<text x="20" y="245" font-size="10" fill="#1f2937" font-weight="bold">
                📊 Toplam: ${blocks.length} blok, ${document.getElementById('toplamDaireSayisi').textContent} daire
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

// Kat planı görs
