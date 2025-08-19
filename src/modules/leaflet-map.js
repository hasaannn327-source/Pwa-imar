/**
 * Leaflet.js + OpenStreetMap Entegrasyonu
 * Google Maps'e ücretsiz alternatif
 */

export class LeafletMapIntegration {
    constructor() {
        this.map = null;
        this.parcelLayer = null;
        this.buildingMarkers = [];
        this.isLoaded = false;
        this.currentParcel = null;
    }

    /**
     * Leaflet CSS ve JS dosyalarını yükle
     */
    async loadLeaflet() {
        if (this.isLoaded) return Promise.resolve();

        return new Promise((resolve, reject) => {
            // CSS yükle
            if (!document.querySelector('link[href*="leaflet"]')) {
                const css = document.createElement('link');
                css.rel = 'stylesheet';
                css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
                css.crossOrigin = '';
                document.head.appendChild(css);
            }

            // JavaScript yükle
            if (window.L) {
                this.isLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';

            script.onload = () => {
                this.isLoaded = true;
                resolve();
            };

            script.onerror = () => {
                reject(new Error('Leaflet yüklenemedi'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Haritayı başlat
     */
    async initializeMap(containerId, options = {}) {
        try {
            await this.loadLeaflet();

            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Harita container'ı bulunamadı: ${containerId}`);
            }

            // Varsayılan ayarlar
            const defaultOptions = {
                center: [41.0082, 28.9784], // İstanbul
                zoom: 13,
                zoomControl: true,
                attributionControl: true
            };

            const mapOptions = { ...defaultOptions, ...options };

            // Harita oluştur
            this.map = L.map(containerId, {
                center: mapOptions.center,
                zoom: mapOptions.zoom,
                zoomControl: mapOptions.zoomControl,
                attributionControl: mapOptions.attributionControl
            });

            // OpenStreetMap tile layer ekle
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(this.map);

            // Harita tıklama olayı
            this.map.on('click', (e) => {
                this.onMapClick(e);
            });

            console.log('✅ Leaflet haritası başarıyla yüklendi');
            return this.map;

        } catch (error) {
            console.error('❌ Leaflet harita hatası:', error);
            this.showMapError(containerId, error.message);
            throw error;
        }
    }

    /**
     * Parsel sınırlarını çiz
     */
    drawParcelBoundaries(center, area, shape = 'rectangle') {
        if (!this.map) return;

        // Önceki parsel katmanını temizle
        if (this.parcelLayer) {
            this.map.removeLayer(this.parcelLayer);
        }

        let geometry;
        
        if (shape === 'rectangle') {
            geometry = this.calculateRectangleCoordinates(center, area);
        } else if (shape === 'circle') {
            geometry = this.calculateCircleCoordinates(center, area);
        } else {
            geometry = this.calculateRectangleCoordinates(center, area);
        }

        // Parsel poligonu oluştur
        if (shape === 'circle') {
            this.parcelLayer = L.circle([center[0], center[1]], {
                radius: Math.sqrt(area / Math.PI),
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                weight: 3
            }).addTo(this.map);
        } else {
            this.parcelLayer = L.polygon(geometry, {
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                weight: 3
            }).addTo(this.map);
        }

        // Parsel bilgilerini sakla
        this.currentParcel = {
            center: center,
            area: area,
            shape: shape,
            coordinates: geometry
        };

        // Harita görünümünü parsele odakla
        this.fitMapToParcel();

        return this.parcelLayer;
    }

    /**
     * Dikdörtgen koordinatları hesapla
     */
    calculateRectangleCoordinates(center, area) {
        const sideLength = Math.sqrt(area);
        const latOffset = sideLength / 111320; // 1 derece ≈ 111.32 km
        const lngOffset = sideLength / (111320 * Math.cos(center[0] * Math.PI / 180));

        return [
            [center[0] - latOffset/2, center[1] - lngOffset/2],
            [center[0] - latOffset/2, center[1] + lngOffset/2],
            [center[0] + latOffset/2, center[1] + lngOffset/2],
            [center[0] + latOffset/2, center[1] - lngOffset/2]
        ];
    }

    /**
     * Binaları haritada göster
     */
    showBuildingsOnMap(blocks, parcelCenter) {
        if (!this.map || !blocks) return;

        // Önceki bina marker'larını temizle
        this.clearBuildingMarkers();

        blocks.forEach((block, index) => {
            // Bina konumunu hesapla
            const position = this.calculateBuildingPosition(parcelCenter, index, blocks.length);

            // Bina marker'ı oluştur
            const marker = L.circleMarker([position[0], position[1]], {
                radius: 8,
                fillColor: '#2563eb',
                color: '#1e40af',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.map);

            // Bina bilgi popup'ı
            const popupContent = this.createBuildingInfoContent(block);
            marker.bindPopup(popupContent);

            this.buildingMarkers.push(marker);
        });
    }

    /**
     * Bina konumu hesapla
     */
    calculateBuildingPosition(parcelCenter, index, totalBuildings) {
        const radius = 0.002; // Yaklaşık 200 metre
        const angle = (index / totalBuildings) * 2 * Math.PI;

        return [
            parcelCenter[0] + radius * Math.cos(angle),
            parcelCenter[1] + radius * Math.sin(angle)
        ];
    }

    /**
     * Bina bilgi içeriği oluştur
     */
    createBuildingInfoContent(block) {
        let apartmentInfo = '';
        const apartments = Object.entries(block.apartments || {});
        
        if (apartments.length > 0) {
            apartmentInfo = apartments
                .filter(([type, count]) => count > 0)
                .map(([type, count]) => `${type}: ${count} adet`)
                .join('<br>');
        } else {
            apartmentInfo = 'Daire bilgisi yok';
        }

        return `
            <div style="max-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">🏢 Blok ${block.id}</h3>
                <p style="margin: 5px 0;"><strong>Kat Sayısı:</strong> ${block.floors}</p>
                <p style="margin: 5px 0;"><strong>Toplam Alan:</strong> ${block.totalArea?.toFixed(0) || 0} m²</p>
                <div style="margin-top: 10px;">
                    <strong>Daireler:</strong><br>
                    ${apartmentInfo}
                </div>
            </div>
        `;
    }

    /**
     * Haritayı parsele odakla
     */
    fitMapToParcel() {
        if (!this.map || !this.parcelLayer) return;

        try {
            this.map.fitBounds(this.parcelLayer.getBounds(), {
                padding: [20, 20]
            });
        } catch (error) {
            console.warn('Parsel bounds hesaplanamadı:', error);
        }
    }

    /**
     * Harita tıklama olayı
     */
    onMapClick(event) {
        const lat = event.latlng.lat;
        const lng = event.latlng.lng;
        
        console.log(`Harita tıklandı: ${lat}, ${lng}`);
        
        // Custom event dispatch et
        const mapClickEvent = new CustomEvent('mapClick', {
            detail: { lat, lng, latLng: event.latlng }
        });
        document.dispatchEvent(mapClickEvent);
    }

    /**
     * Adres arama (Nominatim API - Ücretsiz)
     */
    async searchAddress(address) {
        try {
            const encodedAddress = encodeURIComponent(address + ', Turkey');
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const location = [parseFloat(result.lat), parseFloat(result.lon)];
                
                // Haritayı konuma odakla
                if (this.map) {
                    this.map.setView(location, 16);
                }
                
                return {
                    location: { lat: location[0], lng: location[1] },
                    formattedAddress: result.display_name
                };
            } else {
                throw new Error('Adres bulunamadı');
            }
        } catch (error) {
            throw new Error('Adres arama hatası: ' + error.message);
        }
    }

    /**
     * Mevcut konumu al
     */
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation desteklenmiyor'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = [position.coords.latitude, position.coords.longitude];

                    // Haritayı konuma odakla
                    if (this.map) {
                        this.map.setView(location, 16);
                    }

                    resolve({ lat: location[0], lng: location[1] });
                },
                (error) => {
                    reject(new Error('Konum alınamadı: ' + error.message));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    }

    /**
     * Bina marker'larını temizle
     */
    clearBuildingMarkers() {
        this.buildingMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.buildingMarkers = [];
    }

    /**
     * Haritayı temizle
     */
    clearMap() {
        if (this.parcelLayer) {
            this.map.removeLayer(this.parcelLayer);
            this.parcelLayer = null;
        }
        
        this.clearBuildingMarkers();
        this.currentParcel = null;
    }

    /**
     * Harita hata mesajı göster
     */
    showMapError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; background: #f3f4f6; border-radius: 8px; color: #6b7280;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
                    <h3 style="margin: 0 0 8px 0; color: #374151;">Harita Yüklenemedi</h3>
                    <p style="margin: 0; text-align: center; max-width: 300px;">${message}</p>
                    <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Yeniden Dene
                    </button>
                </div>
            `;
        }
    }

    /**
     * Harita durumunu getir
     */
    getMapState() {
        if (!this.map) return null;

        const center = this.map.getCenter();
        return {
            center: [center.lat, center.lng],
            zoom: this.map.getZoom()
        };
    }

    /**
     * Harita durumunu ayarla
     */
    setMapState(state) {
        if (!this.map || !state) return;

        this.map.setView(state.center, state.zoom);
    }
}

/**
 * Harita Utilities - Leaflet için
 */
export class LeafletMapUtils {
    /**
     * İki nokta arası mesafe hesapla (metre)
     */
    static calculateDistance(point1, point2) {
        if (window.L) {
            const latlng1 = L.latLng(point1.lat || point1[0], point1.lng || point1[1]);
            const latlng2 = L.latLng(point2.lat || point2[0], point2.lng || point2[1]);
            return latlng1.distanceTo(latlng2);
        }

        // Fallback: Haversine formula
        const R = 6371000; // Dünya yarıçapı (metre)
        const lat1 = point1.lat || point1[0];
        const lng1 = point1.lng || point1[1];
        const lat2 = point2.lat || point2[0];
        const lng2 = point2.lng || point2[1];
        
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                 Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Koordinatları formatla
     */
    static formatCoordinates(lat, lng, precision = 6) {
        return {
            lat: parseFloat(lat.toFixed(precision)),
            lng: parseFloat(lng.toFixed(precision))
        };
    }
}