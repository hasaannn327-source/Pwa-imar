/**
 * Harita Entegrasyonu Modülü
 * Google Maps API ile parsel görselleştirmesi
 */

export class MapIntegration {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.map = null;
        this.parcelPolygon = null;
        this.buildingMarkers = [];
        this.isLoaded = false;
    }

    /**
     * Google Maps API yükle
     */
    async loadGoogleMaps() {
        if (this.isLoaded) return Promise.resolve();

        return new Promise((resolve, reject) => {
            // API zaten yüklü mü kontrol et
            if (window.google && window.google.maps) {
                this.isLoaded = true;
                resolve();
                return;
            }

            // Script elementi oluştur
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=geometry,drawing`;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                this.isLoaded = true;
                resolve();
            };

            script.onerror = () => {
                reject(new Error('Google Maps API yüklenemedi'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Haritayı başlat
     */
    async initializeMap(containerId, options = {}) {
        try {
            await this.loadGoogleMaps();

            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Harita container'ı bulunamadı: ${containerId}`);
            }

            // Varsayılan harita ayarları
            const defaultOptions = {
                center: { lat: 41.0082, lng: 28.9784 }, // İstanbul merkez
                zoom: 15,
                mapTypeId: 'hybrid',
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
                zoomControl: true
            };

            const mapOptions = { ...defaultOptions, ...options };
            this.map = new google.maps.Map(container, mapOptions);

            // Harita tıklama olayı
            this.map.addListener('click', (event) => {
                this.onMapClick(event);
            });

            return this.map;
        } catch (error) {
            console.error('Harita başlatma hatası:', error);
            this.showMapError(containerId, error.message);
            throw error;
        }
    }

    /**
     * Parsel sınırlarını çiz
     */
    drawParcelBoundaries(center, area, shape = 'rectangle') {
        if (!this.map) return;

        // Önceki parsel poligonunu temizle
        if (this.parcelPolygon) {
            this.parcelPolygon.setMap(null);
        }

        let coordinates;
        
        if (shape === 'rectangle') {
            coordinates = this.calculateRectangleCoordinates(center, area);
        } else if (shape === 'circle') {
            coordinates = this.calculateCircleCoordinates(center, area);
        } else {
            coordinates = this.calculateRectangleCoordinates(center, area);
        }

        // Parsel poligonu oluştur
        this.parcelPolygon = new google.maps.Polygon({
            paths: coordinates,
            strokeColor: '#2563eb',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            editable: true,
            draggable: false
        });

        this.parcelPolygon.setMap(this.map);

        // Parsel düzenleme olayları
        this.parcelPolygon.addListener('mouseup', () => {
            this.onParcelEdited();
        });

        // Harita görünümünü parsele odakla
        this.fitMapToParcel();

        return this.parcelPolygon;
    }

    /**
     * Dikdörtgen koordinatları hesapla
     */
    calculateRectangleCoordinates(center, area) {
        // Kareye yakın dikdörtgen oluştur
        const sideLength = Math.sqrt(area);
        const latOffset = sideLength / 111320; // 1 derece = ~111.32 km
        const lngOffset = sideLength / (111320 * Math.cos(center.lat * Math.PI / 180));

        return [
            { lat: center.lat - latOffset/2, lng: center.lng - lngOffset/2 },
            { lat: center.lat - latOffset/2, lng: center.lng + lngOffset/2 },
            { lat: center.lat + latOffset/2, lng: center.lng + lngOffset/2 },
            { lat: center.lat + latOffset/2, lng: center.lng - lngOffset/2 }
        ];
    }

    /**
     * Daire koordinatları hesapla
     */
    calculateCircleCoordinates(center, area, points = 20) {
        const radius = Math.sqrt(area / Math.PI);
        const coordinates = [];

        for (let i = 0; i < points; i++) {
            const angle = (i / points) * 2 * Math.PI;
            const latOffset = (radius * Math.cos(angle)) / 111320;
            const lngOffset = (radius * Math.sin(angle)) / (111320 * Math.cos(center.lat * Math.PI / 180));

            coordinates.push({
                lat: center.lat + latOffset,
                lng: center.lng + lngOffset
            });
        }

        return coordinates;
    }

    /**
     * Binaları haritada göster
     */
    showBuildingsOnMap(blocks, parcelCenter) {
        if (!this.map || !blocks) return;

        // Önceki bina marker'larını temizle
        this.clearBuildingMarkers();

        blocks.forEach((block, index) => {
            // Bina konumunu hesapla (parsel içinde dağıt)
            const position = this.calculateBuildingPosition(parcelCenter, index, blocks.length);

            // Bina marker'ı oluştur
            const marker = new google.maps.Marker({
                position: position,
                map: this.map,
                title: `Blok ${block.id} - ${block.floors} Kat`,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#2563eb',
                    fillOpacity: 0.8,
                    strokeColor: '#1e40af',
                    strokeWeight: 2,
                    scale: 8
                }
            });

            // Bina bilgi penceresi
            const infoWindow = new google.maps.InfoWindow({
                content: this.createBuildingInfoContent(block)
            });

            marker.addListener('click', () => {
                // Diğer info window'ları kapat
                this.buildingMarkers.forEach(m => {
                    if (m.infoWindow) {
                        m.infoWindow.close();
                    }
                });

                infoWindow.open(this.map, marker);
            });

            this.buildingMarkers.push({ marker, infoWindow });
        });
    }

    /**
     * Bina konumu hesapla
     */
    calculateBuildingPosition(parcelCenter, index, totalBuildings) {
        const radius = 0.0005; // Yaklaşık 50 metre
        const angle = (index / totalBuildings) * 2 * Math.PI;

        return {
            lat: parcelCenter.lat + radius * Math.cos(angle),
            lng: parcelCenter.lng + radius * Math.sin(angle)
        };
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
        if (!this.map || !this.parcelPolygon) return;

        const bounds = new google.maps.LatLngBounds();
        const path = this.parcelPolygon.getPath();

        path.forEach(point => {
            bounds.extend(point);
        });

        this.map.fitBounds(bounds);
        
        // Minimum zoom seviyesi
        const listener = google.maps.event.addListener(this.map, 'idle', () => {
            if (this.map.getZoom() > 18) {
                this.map.setZoom(18);
            }
            google.maps.event.removeListener(listener);
        });
    }

    /**
     * Harita tıklama olayı
     */
    onMapClick(event) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        console.log(`Harita tıklandı: ${lat}, ${lng}`);
        
        // Custom event dispatch et
        const mapClickEvent = new CustomEvent('mapClick', {
            detail: { lat, lng, latLng: event.latLng }
        });
        document.dispatchEvent(mapClickEvent);
    }

    /**
     * Parsel düzenlendiğinde
     */
    onParcelEdited() {
        if (!this.parcelPolygon) return;

        const path = this.parcelPolygon.getPath();
        const coordinates = [];
        
        path.forEach(point => {
            coordinates.push({
                lat: point.lat(),
                lng: point.lng()
            });
        });

        // Yeni parsel alanını hesapla
        const area = google.maps.geometry.spherical.computeArea(path);
        
        // Custom event dispatch et
        const parcelEditedEvent = new CustomEvent('parcelEdited', {
            detail: { coordinates, area }
        });
        document.dispatchEvent(parcelEditedEvent);
    }

    /**
     * Bina marker'larını temizle
     */
    clearBuildingMarkers() {
        this.buildingMarkers.forEach(({ marker, infoWindow }) => {
            if (infoWindow) {
                infoWindow.close();
            }
            marker.setMap(null);
        });
        this.buildingMarkers = [];
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
     * Adres arama
     */
    async searchAddress(address) {
        if (!this.isLoaded) {
            throw new Error('Google Maps API henüz yüklenmedi');
        }

        return new Promise((resolve, reject) => {
            const geocoder = new google.maps.Geocoder();
            
            geocoder.geocode({ address: address }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    const formattedAddress = results[0].formatted_address;
                    
                    // Haritayı konuma odakla
                    if (this.map) {
                        this.map.setCenter(location);
                        this.map.setZoom(16);
                    }
                    
                    resolve({
                        location: {
                            lat: location.lat(),
                            lng: location.lng()
                        },
                        formattedAddress: formattedAddress
                    });
                } else {
                    reject(new Error('Adres bulunamadı: ' + status));
                }
            });
        });
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
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    // Haritayı konuma odakla
                    if (this.map) {
                        this.map.setCenter(location);
                        this.map.setZoom(16);
                    }

                    resolve(location);
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
     * Haritayı temizle
     */
    clearMap() {
        if (this.parcelPolygon) {
            this.parcelPolygon.setMap(null);
            this.parcelPolygon = null;
        }
        
        this.clearBuildingMarkers();
    }

    /**
     * Harita durumunu getir
     */
    getMapState() {
        if (!this.map) return null;

        return {
            center: this.map.getCenter().toJSON(),
            zoom: this.map.getZoom(),
            mapType: this.map.getMapTypeId()
        };
    }

    /**
     * Harita durumunu ayarla
     */
    setMapState(state) {
        if (!this.map || !state) return;

        this.map.setCenter(state.center);
        this.map.setZoom(state.zoom);
        this.map.setMapTypeId(state.mapType);
    }
}

/**
 * Harita Utilities
 */
export class MapUtils {
    /**
     * İki nokta arası mesafe hesapla (metre)
     */
    static calculateDistance(point1, point2) {
        if (!window.google || !window.google.maps) {
            // Haversine formula fallback
            const R = 6371000; // Dünya yarıçapı (metre)
            const dLat = (point2.lat - point1.lat) * Math.PI / 180;
            const dLng = (point2.lng - point1.lng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
                     Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }

        return google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(point1.lat, point1.lng),
            new google.maps.LatLng(point2.lat, point2.lng)
        );
    }

    /**
     * Poligon alanını hesapla (m²)
     */
    static calculatePolygonArea(coordinates) {
        if (!window.google || !window.google.maps) {
            // Shoelace formula fallback
            let area = 0;
            const n = coordinates.length;
            
            for (let i = 0; i < n; i++) {
                const j = (i + 1) % n;
                area += coordinates[i].lat * coordinates[j].lng;
                area -= coordinates[j].lat * coordinates[i].lng;
            }
            
            return Math.abs(area) * 6378137 * 6378137 * Math.PI / 180 / 2;
        }

        const path = coordinates.map(coord => new google.maps.LatLng(coord.lat, coord.lng));
        return google.maps.geometry.spherical.computeArea(path);
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