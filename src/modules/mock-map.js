/**
 * Mock Harita Sistemi
 * API gerektirmeyen, Canvas tabanlı harita görselleştirmesi
 */

export class MockMapIntegration {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.parcel = null;
        this.buildings = [];
        this.mapCenter = { lat: 41.0082, lng: 28.9784 }; // İstanbul
        this.zoom = 1;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
    }

    /**
     * Mock haritayı başlat
     */
    async initializeMap(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Harita container'ı bulunamadı: ${containerId}`);
        }

        // Canvas oluştur
        this.canvas = document.createElement('canvas');
        this.canvas.width = container.offsetWidth || 400;
        this.canvas.height = container.offsetHeight || 300;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.border = '2px solid #e5e7eb';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.cursor = 'grab';

        this.ctx = this.canvas.getContext('2d');

        // Container'ı temizle ve canvas ekle
        container.innerHTML = '';
        container.appendChild(this.canvas);

        // Event listeners
        this.setupCanvasEvents();

        // İlk çizimi yap
        this.drawMap();

        console.log('✅ Mock harita başarıyla yüklendi');
        return this.canvas;
    }

    /**
     * Canvas event'lerini kur
     */
    setupCanvasEvents() {
        // Mouse olayları
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.canvas.style.cursor = 'grabbing';
            this.lastMousePos = this.getMousePos(e);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const mousePos = this.getMousePos(e);
                const deltaX = mousePos.x - this.lastMousePos.x;
                const deltaY = mousePos.y - this.lastMousePos.y;
                
                // Harita merkezini güncelle
                this.mapCenter.lng -= deltaX * 0.001 / this.zoom;
                this.mapCenter.lat += deltaY * 0.001 / this.zoom;
                
                this.lastMousePos = mousePos;
                this.drawMap();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        // Zoom (mouse wheel)
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom = Math.max(0.1, Math.min(5, this.zoom * delta));
            this.drawMap();
        });

        // Tıklama olayı
        this.canvas.addEventListener('click', (e) => {
            if (!this.isDragging) {
                const mousePos = this.getMousePos(e);
                const coords = this.screenToLatLng(mousePos.x, mousePos.y);
                this.onMapClick(coords);
            }
        });
    }

    /**
     * Mouse pozisyonunu al
     */
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    /**
     * Ekran koordinatlarını lat/lng'ye çevir
     */
    screenToLatLng(x, y) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const lat = this.mapCenter.lat + (centerY - y) * 0.001 / this.zoom;
        const lng = this.mapCenter.lng + (x - centerX) * 0.001 / this.zoom;
        
        return { lat, lng };
    }

    /**
     * Lat/lng'yi ekran koordinatlarına çevir
     */
    latLngToScreen(lat, lng) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const x = centerX + (lng - this.mapCenter.lng) * 1000 * this.zoom;
        const y = centerY - (lat - this.mapCenter.lat) * 1000 * this.zoom;
        
        return { x, y };
    }

    /**
     * Haritayı çiz
     */
    drawMap() {
        // Canvas'ı temizle
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Arkaplan
        this.drawBackground();

        // Grid çizgileri
        this.drawGrid();

        // Parsel (varsa)
        if (this.parcel) {
            this.drawParcel();
        }

        // Binalar (varsa)
        this.buildings.forEach(building => {
            this.drawBuilding(building);
        });

        // Harita bilgileri
        this.drawMapInfo();
    }

    /**
     * Arkaplan çiz
     */
    drawBackground() {
        // Arkaplan gradyanı
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#e0f2fe');
        gradient.addColorStop(1, '#bae6fd');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Rastgele "sokak" çizgileri
        this.ctx.strokeStyle = '#cbd5e1';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);

        for (let i = 0; i < 10; i++) {
            const x = (i * this.canvas.width / 10 + this.mapCenter.lng * 100) % this.canvas.width;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let i = 0; i < 8; i++) {
            const y = (i * this.canvas.height / 8 + this.mapCenter.lat * 100) % this.canvas.height;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        this.ctx.setLineDash([]);
    }

    /**
     * Grid çizgileri
     */
    drawGrid() {
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 0.5;

        const gridSize = 50 * this.zoom;
        const offsetX = (this.mapCenter.lng * 1000 * this.zoom) % gridSize;
        const offsetY = (this.mapCenter.lat * 1000 * this.zoom) % gridSize;

        // Dikey çizgiler
        for (let x = -offsetX; x < this.canvas.width + gridSize; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Yatay çizgiler
        for (let y = -offsetY; y < this.canvas.height + gridSize; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Parsel çiz
     */
    drawParcel() {
        if (!this.parcel) return;

        const center = this.latLngToScreen(this.parcel.center.lat, this.parcel.center.lng);
        const size = Math.sqrt(this.parcel.area) * this.zoom * 0.1;

        this.ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        this.ctx.strokeStyle = '#2563eb';
        this.ctx.lineWidth = 3;

        if (this.parcel.shape === 'circle') {
            // Daire
            this.ctx.beginPath();
            this.ctx.arc(center.x, center.y, size / 2, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
        } else {
            // Dikdörtgen
            this.ctx.fillRect(center.x - size/2, center.y - size/2, size, size);
            this.ctx.strokeRect(center.x - size/2, center.y - size/2, size, size);
        }

        // Parsel etiketi
        this.ctx.fillStyle = '#1e40af';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `${this.parcel.area.toFixed(0)} m²`, 
            center.x, 
            center.y - size/2 - 10
        );
    }

    /**
     * Bina çiz
     */
    drawBuilding(building) {
        const pos = this.latLngToScreen(building.lat, building.lng);
        const size = 12 * this.zoom;

        // Bina gölgesi
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(pos.x - size/2 + 2, pos.y - size/2 + 2, size, size);

        // Ana bina
        this.ctx.fillStyle = '#2563eb';
        this.ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);

        // Bina çerçevesi
        this.ctx.strokeStyle = '#1e40af';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pos.x - size/2, pos.y - size/2, size, size);

        // Bina etiketi
        this.ctx.fillStyle = '#1f2937';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`B${building.id}`, pos.x, pos.y + size/2 + 15);
    }

    /**
     * Harita bilgileri
     */
    drawMapInfo() {
        // Zoom seviyesi
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(10, 10, 80, 30);
        this.ctx.strokeStyle = '#d1d5db';
        this.ctx.strokeRect(10, 10, 80, 30);

        this.ctx.fillStyle = '#374151';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Zoom: ${this.zoom.toFixed(1)}x`, 15, 28);

        // Koordinatlar
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(10, this.canvas.height - 50, 200, 40);
        this.ctx.strokeStyle = '#d1d5db';
        this.ctx.strokeRect(10, this.canvas.height - 50, 200, 40);

        this.ctx.fillStyle = '#374151';
        this.ctx.font = '11px Arial';
        this.ctx.fillText(
            `Lat: ${this.mapCenter.lat.toFixed(6)}`, 
            15, 
            this.canvas.height - 32
        );
        this.ctx.fillText(
            `Lng: ${this.mapCenter.lng.toFixed(6)}`, 
            15, 
            this.canvas.height - 18
        );

        // Kontroller
        this.ctx.fillStyle = '#6b7280';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(
            'Sürükle: Hareket | Tekerlek: Zoom | Tıkla: Konum seç', 
            this.canvas.width - 10, 
            this.canvas.height - 10
        );
    }

    /**
     * Parsel sınırlarını çiz
     */
    drawParcelBoundaries(center, area, shape = 'rectangle') {
        this.parcel = {
            center: { lat: center.lat || center[0], lng: center.lng || center[1] },
            area: area,
            shape: shape
        };

        // Haritayı parsele odakla
        this.mapCenter = { ...this.parcel.center };
        this.zoom = Math.max(1, Math.min(3, 1000 / Math.sqrt(area)));

        this.drawMap();
        return this.parcel;
    }

    /**
     * Binaları haritada göster
     */
    showBuildingsOnMap(blocks, parcelCenter) {
        if (!blocks) return;

        this.buildings = [];

        blocks.forEach((block, index) => {
            const angle = (index / blocks.length) * 2 * Math.PI;
            const radius = 0.002;

            const building = {
                id: block.id,
                lat: parcelCenter.lat + radius * Math.cos(angle),
                lng: parcelCenter.lng + radius * Math.sin(angle),
                floors: block.floors,
                apartments: block.apartments
            };

            this.buildings.push(building);
        });

        this.drawMap();
    }

    /**
     * Harita tıklama olayı
     */
    onMapClick(coords) {
        console.log(`Mock harita tıklandı: ${coords.lat}, ${coords.lng}`);
        
        // Custom event dispatch et
        const mapClickEvent = new CustomEvent('mapClick', {
            detail: { lat: coords.lat, lng: coords.lng }
        });
        document.dispatchEvent(mapClickEvent);
    }

    /**
     * Mock adres arama
     */
    async searchAddress(address) {
        // Basit mock arama - İstanbul çevresinde rastgele konum döndür
        const mockResults = [
            { name: 'Taksim', lat: 41.0369, lng: 28.9850 },
            { name: 'Beşiktaş', lat: 41.0422, lng: 29.0067 },
            { name: 'Kadıköy', lat: 40.9833, lng: 29.0167 },
            { name: 'Üsküdar', lat: 41.0214, lng: 29.0161 },
            { name: 'Beyoğlu', lat: 41.0362, lng: 28.9772 }
        ];

        const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
        
        // Haritayı konuma odakla
        this.mapCenter = { lat: randomResult.lat, lng: randomResult.lng };
        this.zoom = 2;
        this.drawMap();

        return {
            location: { lat: randomResult.lat, lng: randomResult.lng },
            formattedAddress: `${randomResult.name}, İstanbul (Mock Sonuç)`
        };
    }

    /**
     * Mock mevcut konum
     */
    async getCurrentLocation() {
        // Mock konum - İstanbul merkez
        const location = { lat: 41.0082, lng: 28.9784 };
        
        this.mapCenter = location;
        this.zoom = 2;
        this.drawMap();

        return location;
    }

    /**
     * Haritayı temizle
     */
    clearMap() {
        this.parcel = null;
        this.buildings = [];
        this.drawMap();
    }

    /**
     * Harita durumunu getir
     */
    getMapState() {
        return {
            center: this.mapCenter,
            zoom: this.zoom
        };
    }

    /**
     * Harita durumunu ayarla
     */
    setMapState(state) {
        if (state.center) this.mapCenter = state.center;
        if (state.zoom) this.zoom = state.zoom;
        this.drawMap();
    }
}