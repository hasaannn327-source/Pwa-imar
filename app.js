// Modern İmar Hesaplayıcısı Pro - Modüler Yapı
// ES6 Modules ile refactor edilmiş versiyon

import { ImarCalculator, BlockCalculator } from './src/modules/calculator.js';
import { FormValidator, RealTimeValidator } from './src/modules/validation.js';
import { BuildingVisualizer, ThemeManager } from './src/modules/visualization.js';
import { MapIntegration, MapUtils } from './src/modules/map-integration.js';
import { LeafletMapIntegration, LeafletMapUtils } from './src/modules/leaflet-map.js';
import { MockMapIntegration } from './src/modules/mock-map.js';
import { CONFIG, validateConfiguration } from './config.js';

// Global değişkenler
let calculator, blockCalculator, validator, realTimeValidator, visualizer, themeManager, mapIntegration;
let selectedApartmentTypes = [];
let projectResults = {};

// Konfigürasyondan şehir yönetmeliklerini al
const cityRegulations = CONFIG.CITY_REGULATIONS;

// Google Maps API Key - Config dosyasından al
const GOOGLE_MAPS_API_KEY = CONFIG.GOOGLE_MAPS.API_KEY;

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏗️ İmar Hesaplayıcısı Pro başlatılıyor...');
    
    initializeApp();
    setupEventListeners();
    selectDefaultApartments();
    registerServiceWorker();
});

// Uygulama başlatma
function initializeApp() {
    console.log('✅ Modüler sistemler başlatılıyor...');
    
    // Modülleri başlat
    calculator = new ImarCalculator(cityRegulations);
    blockCalculator = new BlockCalculator(calculator);
    validator = new FormValidator();
    visualizer = new BuildingVisualizer();
    themeManager = new ThemeManager();
    
    // Validasyon kurallarını yükle
    validator.loadDefaultRules();
    
    // Gerçek zamanlı validasyon
    realTimeValidator = new RealTimeValidator(validator);
    realTimeValidator.setupRealTimeValidation();
    
    // Konfigürasyon doğrulama
    const configValidation = validateConfiguration();
    if (!configValidation.valid) {
        console.warn('⚠️ Konfigürasyon uyarıları:', configValidation.warnings);
    }
    
    // Harita entegrasyonu - Alternatifler ile
    initializeMapWithAlternatives();
    
    // Varsayılan değerleri kontrol et
    setDefaultValues();
    
    console.log('✅ Tüm modüller başarıyla yüklendi');
}

// Varsayılan değerleri ayarla
function setDefaultValues() {
    const defaults = {
        'taban': CONFIG.CALCULATION.DEFAULT_TAKS.toString(),
        'emsal': CONFIG.CALCULATION.DEFAULT_KAKS.toString(),
        'katYuksekligi': CONFIG.CALCULATION.DEFAULT_FLOOR_HEIGHT.toString()
    };
    
    Object.entries(defaults).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element && !element.value) {
            element.value = value;
        }
    });
}

// Event listener'ları kurulum
function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            themeManager.toggleTheme();
        });
    }
    
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

    // Hesaplama butonu
    const calculateBtn = document.querySelector('.calculate-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function(e) {
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

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            switchTab(tabId, this);
        });
    });

    // Harita event listeners
    setupMapEventListeners();
}

// Harita event listeners
function setupMapEventListeners() {
    // Adres arama
    const searchButton = document.getElementById('searchButton');
    const addressInput = document.getElementById('addressSearch');
    
    if (searchButton && addressInput) {
        searchButton.addEventListener('click', handleAddressSearch);
        addressInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleAddressSearch();
            }
        });
    }
    
    // Mevcut konum
    const locationButton = document.getElementById('currentLocationButton');
    if (locationButton) {
        locationButton.addEventListener('click', handleCurrentLocation);
    }
    
    // Harita temizle
    const clearButton = document.getElementById('clearMapButton');
    if (clearButton) {
        clearButton.addEventListener('click', handleClearMap);
    }
    
    // Parsel düzenleme events
    document.addEventListener('parcelEdited', handleParcelEdited);
    document.addEventListener('mapClick', handleMapClick);
}

// Alternatifli harita başlatma
async function initializeMapWithAlternatives() {
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) return;

    // Öncelik sırası: Google Maps > Leaflet > Mock Map
    try {
        // 1. Google Maps dene (API key varsa)
        if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
            console.log('🗺️ Google Maps deneniyor...');
            mapIntegration = new MapIntegration(GOOGLE_MAPS_API_KEY);
            await mapIntegration.initializeMap('mapContainer', {
                center: { lat: 41.0082, lng: 28.9784 },
                zoom: 12
            });
            console.log('✅ Google Maps başarıyla yüklendi');
            updateMapInfo('Google Maps hazır', '-', '0');
            return;
        }
    } catch (error) {
        console.warn('⚠️ Google Maps yüklenemedi:', error.message);
    }

    try {
        // 2. Leaflet (OpenStreetMap) dene
        console.log('🗺️ Leaflet (OpenStreetMap) deneniyor...');
        mapIntegration = new LeafletMapIntegration();
        await mapIntegration.initializeMap('mapContainer', {
            center: [41.0082, 28.9784],
            zoom: 13
        });
        console.log('✅ Leaflet haritası başarıyla yüklendi');
        updateMapInfo('OpenStreetMap hazır', '-', '0');
        return;
    } catch (error) {
        console.warn('⚠️ Leaflet yüklenemedi:', error.message);
    }

    try {
        // 3. Mock Map (son çare)
        console.log('🗺️ Mock harita yükleniyor...');
        mapIntegration = new MockMapIntegration();
        await mapIntegration.initializeMap('mapContainer');
        console.log('✅ Mock harita başarıyla yüklendi');
        updateMapInfo('Demo harita hazır', '-', '0');
        showMapAlternativeInfo();
    } catch (error) {
        console.error('❌ Hiçbir harita sistemi yüklenemedi:', error);
        showMapError('Harita sistemleri yüklenemedi');
    }
}

// Alternatif harita bilgisi göster
function showMapAlternativeInfo() {
    showNotification('ℹ️ Demo harita modu aktif - Gerçek konum verisi kullanılmıyor', 'info');
}

// API key uyarısı göster
function showMapApiKeyWarning() {
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #fef3c7; color: #92400e; padding: 20px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <h3 style="margin: 0 0 8px 0;">Google Maps API Key Gerekli</h3>
                <p style="margin: 0; max-width: 300px; font-size: 14px; line-height: 1.4;">
                    Harita özelliğini kullanmak için app.js dosyasındaki GOOGLE_MAPS_API_KEY değişkenini güncelleyin.
                </p>
                <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" 
                   target="_blank" 
                   style="margin-top: 12px; padding: 8px 16px; background: #d97706; color: white; text-decoration: none; border-radius: 6px; font-size: 12px;">
                    API Key Al
                </a>
            </div>
        `;
    }
}

// Ana hesaplama fonksiyonu
function handleFormSubmit() {
    console.log('🔄 Hesaplama başlatılıyor...');
    
    // Form verilerini topla
    const formData = collectFormData();
    
    // Validasyon
    if (!validator.validateForm(formData)) {
        const errors = validator.getErrors();
        console.log('❌ Validasyon hataları:', errors);
        validator.displayErrors(document.getElementById('imarNotlari'));
        return;
    }
    
    // TAKS/KAKS uyumluluğu kontrolü
    if (!validator.validateTaksKaksCompatibility(formData.taban, formData.emsal)) {
        validator.displayErrors(document.getElementById('imarNotlari'));
        return;
    }
    
    showLoading(true);
    
    // Hesaplamayı geciktir (UI feedback için)
    setTimeout(() => {
        performCalculation(formData);
        showLoading(false);
    }, 1500);
}

// Form verilerini topla
function collectFormData() {
    return {
        sehir: document.getElementById('sehir')?.value || '',
        parselAlani: parseFloat(document.getElementById('parselAlani')?.value || 0),
        taban: parseFloat(document.getElementById('taban')?.value || 0),
        emsal: parseFloat(document.getElementById('emsal')?.value || 0),
        katYuksekligi: parseFloat(document.getElementById('katYuksekligi')?.value || 3),
        imarDurumu: document.getElementById('imarDurumu')?.value || ''
    };
}

// Hesaplama işlemi
function performCalculation(formData) {
    try {
        // Ana hesaplama
        projectResults = calculator.calculate(formData);
        
        console.log('✅ Hesaplama tamamlandı:', projectResults);
        
        // UI güncellemeleri
        updateResultsUI();
        
        // Blok hesaplamaları
        const blockResults = blockCalculator.autoCalculateBlocks(projectResults, selectedApartmentTypes);
        
        // Görselleştirme güncellemeleri
        visualizer.updateVisualization(blockResults.blocks, projectResults);
        visualizer.updateFloorPlan(selectedApartmentTypes);
        visualizer.updateApartmentList(blockResults.blocks);
        
        // Harita güncelleme (varsa)
        if (mapIntegration) {
            updateMapWithResults(blockResults.blocks);
        }
        
        // Başarı mesajı
        showSuccessMessage();
        
        // Hataları temizle
        validator.clearAllErrors();
        
    } catch (error) {
        console.error('❌ Hesaplama hatası:', error);
        showError('Hesaplama sırasında bir hata oluştu: ' + error.message);
    }
}

// Sonuçları UI'da göster
function updateResultsUI() {
    const elements = {
        'maxTabanAlani': projectResults.maxTabanAlani?.toFixed(2) + ' m²',
        'maxInsaatAlani': projectResults.maxInsaatAlani?.toFixed(2) + ' m²',
        'maxKatSayisi': projectResults.maxKatSayisi + ' kat',
        'maxYukseklik': projectResults.maxYukseklik?.toFixed(1) + ' m',
        'acikAlan': projectResults.acikAlan?.toFixed(2) + ' m²',
        'yapilasmaorani': '%' + projectResults.yapilasmaorani?.toFixed(1)
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            element.style.opacity = '0';
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transition = 'opacity 0.5s ease';
            }, 100);
        }
    });
}

// Haritayı sonuçlarla güncelle
function updateMapWithResults(blocks) {
    if (!mapIntegration || !projectResults.parselAlani) return;
    
    try {
        // Varsayılan merkez konum (İstanbul)
        const defaultCenter = { lat: 41.0082, lng: 28.9784 };
        
        // Parsel çiz
        mapIntegration.drawParcelBoundaries(defaultCenter, projectResults.parselAlani, 'rectangle');
        
        // Binaları göster
        if (blocks && blocks.length > 0) {
            mapIntegration.showBuildingsOnMap(blocks, defaultCenter);
        }
        
        // Harita bilgilerini güncelle
        updateMapInfo(
            `${defaultCenter.lat.toFixed(6)}, ${defaultCenter.lng.toFixed(6)}`,
            `${projectResults.parselAlani.toFixed(0)} m²`,
            blocks ? blocks.length.toString() : '0'
        );
        
    } catch (error) {
        console.error('❌ Harita güncelleme hatası:', error);
    }
}

// Harita bilgilerini güncelle
function updateMapInfo(coordinates, area, buildingCount) {
    const elements = {
        'currentCoordinates': coordinates,
        'mapParcelArea': area,
        'mapBuildingCount': buildingCount
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Harita event handlers
async function handleAddressSearch() {
    const address = document.getElementById('addressSearch')?.value;
    if (!address || !mapIntegration) return;
    
    try {
        const result = await mapIntegration.searchAddress(address);
        console.log('📍 Adres bulundu:', result);
        
        updateMapInfo(
            `${result.location.lat.toFixed(6)}, ${result.location.lng.toFixed(6)}`,
            '-',
            '-'
        );
        
        showNotification('📍 Adres bulundu: ' + result.formattedAddress, 'success');
        
    } catch (error) {
        console.error('❌ Adres arama hatası:', error);
        showNotification('❌ Adres bulunamadı', 'error');
    }
}

async function handleCurrentLocation() {
    if (!mapIntegration) return;
    
    try {
        const location = await mapIntegration.getCurrentLocation();
        console.log('📍 Mevcut konum alındı:', location);
        
        updateMapInfo(
            `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
            '-',
            '-'
        );
        
        showNotification('📍 Mevcut konumunuz bulundu', 'success');
        
    } catch (error) {
        console.error('❌ Konum alma hatası:', error);
        showNotification('❌ Konum alınamadı: ' + error.message, 'error');
    }
}

function handleClearMap() {
    if (!mapIntegration) return;
    
    mapIntegration.clearMap();
    updateMapInfo('-', '-', '0');
    showNotification('🗑️ Harita temizlendi', 'info');
}

function handleParcelEdited(event) {
    const { coordinates, area } = event.detail;
    console.log('📐 Parsel düzenlendi:', { coordinates, area });
    
    // Parsel alanını form inputuna aktar
    const parselAlaniInput = document.getElementById('parselAlani');
    if (parselAlaniInput) {
        parselAlaniInput.value = Math.round(area);
    }
    
    updateMapInfo(
        `${coordinates[0]?.lat.toFixed(6)}, ${coordinates[0]?.lng.toFixed(6)}`,
        `${Math.round(area)} m²`,
        '-'
    );
    
    showNotification('📐 Parsel alanı güncellendi', 'info');
}

function handleMapClick(event) {
    const { lat, lng } = event.detail;
    console.log('🗺️ Harita tıklandı:', { lat, lng });
}

// Diğer yardımcı fonksiyonlar (mevcut app.js'den)
function showLoading(show) {
    // Loading animasyonu
    console.log(show ? '⏳ Yükleniyor...' : '✅ Yükleme tamamlandı');
}

function showSuccessMessage() {
    const message = `✅ Hesaplama tamamlandı! ${projectResults.maxInsaatAlani?.toFixed(0)}m² inşaat alanı hesaplandı.`;
    showNotification(message, 'success');
}

function showError(message) {
    console.error('❌', message);
    showNotification('❌ ' + message, 'error');
}

function showNotification(message, type = 'info') {
    // Basit notification sistemi
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // UI'da göster
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
        transition: all 0.3s ease;
    `;
    
    // Tip bazlı renkler
    const colors = {
        success: { bg: '#ecfdf5', color: '#059669', border: '#059669' },
        error: { bg: '#fef2f2', color: '#dc2626', border: '#dc2626' },
        warning: { bg: '#fffbeb', color: '#d97706', border: '#d97706' },
        info: { bg: '#eff6ff', color: '#2563eb', border: '#2563eb' }
    };
    
    const colorScheme = colors[type] || colors.info;
    notification.style.backgroundColor = colorScheme.bg;
    notification.style.color = colorScheme.color;
    notification.style.borderLeft = `4px solid ${colorScheme.border}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }
    }, 3000);
}

// Şehir bazlı imar yönetmeliği güncelleme
function updateCityRegulations(city) {
    const imarNotlari = document.getElementById('imarNotlari');
    
    if (!imarNotlari) return;
    
    if (city && cityRegulations[city]) {
        const regs = cityRegulations[city];
        let html = `<div class="info"><strong>🏛️ ${city.toUpperCase()} İmar Yönetmeliği:</strong><ul>`;
        regs.regulations.forEach(reg => {
            html += `<li>${reg}</li>`;
        });
        html += '</ul></div>';
        imarNotlari.innerHTML = html;
    } else {
        imarNotlari.innerHTML = '';
    }
}

// İmar durumuna göre katsayı güncelleme
function updateZoningCoefficients(zoning) {
    const city = document.getElementById('sehir')?.value;
    const tabanInput = document.getElementById('taban');
    const emsalInput = document.getElementById('emsal');
    
    if (!tabanInput || !emsalInput) return;
    
    if (city && cityRegulations[city] && zoning.startsWith('konut-')) {
        const level = zoning.split('-')[1];
        tabanInput.value = cityRegulations[city].konutTaks[level] || 0.30;
        emsalInput.value = cityRegulations[city].konutEmsal[level] || 1.00;
    } else {
        // Varsayılan değerler
        const defaults = {
            'konut-1': { taks: '0.30', kaks: '1.00' },
            'konut-2': { taks: '0.35', kaks: '1.50' },
            'konut-3': { taks: '0.40', kaks: '2.00' },
            'ticaret': { taks: '0.60', kaks: '2.50' },
            'karma': { taks: '0.45', kaks: '1.80' },
            'turizm': { taks: '0.25', kaks: '1.20' }
        };
        
        if (defaults[zoning]) {
            tabanInput.value = defaults[zoning].taks;
            emsalInput.value = defaults[zoning].kaks;
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
    visualizer.updateFloorPlan(selectedApartmentTypes);
}

// Seçilen daire tiplerini göster
function displaySelectedApartments() {
    const container = document.getElementById('selectedApartments');
    if (!container) return;
    
    let html = '<h4 style="margin: 15px 0 10px 0; color: var(--text-primary);">Seçilen Daire Tipleri:</h4>';
    
    if (selectedApartmentTypes.length === 0) {
        html += '<p style="color: var(--text-secondary); font-style: italic;">Henüz daire tipi seçilmemiş</p>';
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

// Tab switching
function switchTab(tabId, tabElement) {
    // Tüm tabları pasif yap
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Seçilen tabı aktif yap
    tabElement.classList.add('active');
    const content = document.getElementById(tabId);
    if (content) {
        content.classList.add('active');
    }
}

// Service Worker kaydı
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('✅ Service Worker kayıtlı:', registration);
            })
            .catch(error => {
                console.log('❌ Service Worker kaydı başarısız:', error);
            });
    }
}

// Global fonksiyonları window'a ekle (eski kodla uyumluluk için)
window.switchTab = switchTab;
window.updateBlockFloors = function(blockId, floors) {
    if (blockCalculator) {
        blockCalculator.updateBlockFloors(blockId, floors);
    }
};

// Debug fonksiyonu
window.debugApp = function() {
    console.log('=== İmar Hesaplayıcısı Debug ===');
    console.log('Project Results:', projectResults);
    console.log('Selected Apartments:', selectedApartmentTypes);
    console.log('Calculator:', calculator);
    console.log('Map Integration:', mapIntegration);
    console.log('===============================');
};

console.log('🚀 İmar Hesaplayıcısı Pro hazır!');