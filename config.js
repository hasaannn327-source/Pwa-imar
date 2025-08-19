/**
 * İmar Hesaplayıcısı Pro - Konfigürasyon Dosyası
 * API anahtarları ve uygulama ayarları
 */

// ⚠️ ÖNEMLİ: Bu dosyayı production'da .gitignore'a ekleyin!
// Gerçek API anahtarlarını environment variables kullanarak saklayın

export const CONFIG = {
    // Google Maps API Konfigürasyonu
    GOOGLE_MAPS: {
        // API Key - https://developers.google.com/maps/documentation/javascript/get-api-key
        API_KEY: process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
        
        // Varsayılan harita ayarları
        DEFAULT_CENTER: { lat: 41.0082, lng: 28.9784 }, // İstanbul
        DEFAULT_ZOOM: 12,
        DEFAULT_MAP_TYPE: 'hybrid',
        
        // Harita özellikleri
        LIBRARIES: ['geometry', 'drawing', 'places'],
        REGION: 'TR', // Türkiye
        LANGUAGE: 'tr'
    },
    
    // Uygulama ayarları
    APP: {
        NAME: 'İmar Hesaplayıcısı Pro',
        VERSION: '2.1.0',
        DEBUG: process.env.NODE_ENV !== 'production',
        
        // Tema ayarları
        DEFAULT_THEME: 'light',
        ENABLE_THEME_PERSISTENCE: true,
        
        // PWA ayarları
        ENABLE_NOTIFICATIONS: true,
        ENABLE_OFFLINE_MODE: true,
        
        // Performans ayarları
        CALCULATION_DELAY: 1500, // ms - UI feedback için
        NOTIFICATION_DURATION: 3000, // ms
        DEBOUNCE_DELAY: 500 // ms - gerçek zamanlı validasyon için
    },
    
    // Hesaplama sabitleri
    CALCULATION: {
        // Minimum/maksimum değerler
        MIN_PARCEL_AREA: 50, // m²
        MAX_PARCEL_AREA: 100000, // m²
        MIN_TAKS: 0.1,
        MAX_TAKS: 1.0,
        MIN_KAKS: 0.1,
        MAX_KAKS: 5.0,
        MIN_FLOOR_HEIGHT: 2.5, // m
        MAX_FLOOR_HEIGHT: 5.0, // m
        MAX_FLOORS: 20,
        
        // Varsayılan değerler
        DEFAULT_TAKS: 0.30,
        DEFAULT_KAKS: 1.00,
        DEFAULT_FLOOR_HEIGHT: 3.0,
        
        // Otopark ve sosyal alan katsayıları
        PARKING_RATIO: 1.2, // Daire başına otopark
        SOCIAL_AREA_RATIO: 5 // m² per apartment
    },
    
    // Şehir bazlı imar yönetmelikleri
    CITY_REGULATIONS: {
        'istanbul': {
            maxHeight: 12.5,
            regulations: [
                'Deprem yönetmeliği uygulanır',
                'Bodrum kat sayılmaz',
                'Çatı katı %50 oranında yapılabilir'
            ],
            konutTaks: { '1': 0.30, '2': 0.35, '3': 0.40 },
            konutEmsal: { '1': 1.0, '2': 1.5, '3': 2.0 }
        },
        'ankara': {
            maxHeight: 15.0,
            regulations: [
                'Kar yükü hesaplanmalı',
                'Isı yalıtımı zorunlu',
                'Güneş paneli teşvik edilir'
            ],
            konutTaks: { '1': 0.35, '2': 0.40, '3': 0.45 },
            konutEmsal: { '1': 1.2, '2': 1.8, '3': 2.2 }
        },
        'izmir': {
            maxHeight: 12.0,
            regulations: [
                'Rüzgar yükü önemli',
                'Deniz seviyesi kontrolü',
                'Tuz korozyonu önlemi'
            ],
            konutTaks: { '1': 0.25, '2': 0.30, '3': 0.35 },
            konutEmsal: { '1': 0.8, '2': 1.2, '3': 1.6 }
        },
        'antalya': {
            maxHeight: 10.0,
            regulations: [
                'Turizm bölgesi kısıtlamaları',
                'Manzara koruma',
                'Yangın güvenliği önemli'
            ],
            konutTaks: { '1': 0.20, '2': 0.25, '3': 0.30 },
            konutEmsal: { '1': 0.6, '2': 1.0, '3': 1.4 }
        },
        'bursa': {
            maxHeight: 13.0,
            regulations: [
                'Sanayi bölgesi yakınlığı',
                'Hava kalitesi kontrolü',
                'Yeşil alan oranı %25'
            ],
            konutTaks: { '1': 0.32, '2': 0.38, '3': 0.42 },
            konutEmsal: { '1': 1.1, '2': 1.6, '3': 2.1 }
        },
        'diger': {
            maxHeight: 12.5,
            regulations: [
                'Genel imar yönetmeliği uygulanır',
                'Yerel idareden onay gerekli'
            ],
            konutTaks: { '1': 0.30, '2': 0.35, '3': 0.40 },
            konutEmsal: { '1': 1.0, '2': 1.5, '3': 2.0 }
        }
    },
    
    // Daire tipleri
    APARTMENT_TYPES: {
        '1+1': { area: 65, rooms: 2, description: 'Tek yatak odalı' },
        '2+1': { area: 95, rooms: 3, description: 'İki yatak odalı' },
        '3+1': { area: 125, rooms: 4, description: 'Üç yatak odalı' },
        '4+1': { area: 160, rooms: 5, description: 'Dört yatak odalı' },
        'dubleks': { area: 200, rooms: 6, description: 'İki katlı daire' }
    },
    
    // API Endpoints (gelecek özellikler için)
    API: {
        BASE_URL: process.env.API_BASE_URL || 'https://api.imarplanlama.com',
        ENDPOINTS: {
            SAVE_PROJECT: '/projects',
            LOAD_PROJECT: '/projects/:id',
            EXPORT_PDF: '/export/pdf',
            EXPORT_EXCEL: '/export/excel'
        }
    }
};

// Geliştirme ortamı kontrolleri
if (CONFIG.APP.DEBUG) {
    console.log('🔧 Debug modu aktif - Konfigürasyon:', CONFIG);
}

// API Key kontrolleri
export function validateConfiguration() {
    const warnings = [];
    
    if (CONFIG.GOOGLE_MAPS.API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        warnings.push('⚠️ Google Maps API Key ayarlanmamış');
    }
    
    if (warnings.length > 0) {
        console.warn('Konfigürasyon uyarıları:', warnings);
        return { valid: false, warnings };
    }
    
    return { valid: true, warnings: [] };
}

// Environment variable helper'ları
export function getEnvVar(key, defaultValue = null) {
    return process.env[key] || defaultValue;
}

export function isProduction() {
    return process.env.NODE_ENV === 'production';
}

export function isDevelopment() {
    return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}

export default CONFIG;