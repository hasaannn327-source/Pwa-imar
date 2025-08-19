/**
 * 3D Görselleştirme Modülü
 * Bina ve kat planı görselleştirmesi
 */

export class BuildingVisualizer {
    constructor() {
        this.apartmentTypes = {
            '1+1': { area: 65, rooms: 2 },
            '2+1': { area: 95, rooms: 3 },
            '3+1': { area: 125, rooms: 4 },
            '4+1': { area: 160, rooms: 5 },
            'dubleks': { area: 200, rooms: 6 }
        };
    }

    /**
     * 3D bina görselleştirmesi
     */
    updateVisualization(blocks, projectResults) {
        const container = document.getElementById('buildingVisual');
        if (!container || !blocks || blocks.length === 0) {
            this.showPlaceholder(container, '🏗️', 'Hesaplama sonrası<br>3D görselleştirme görüntülenecek');
            return;
        }

        const totalBlocks = blocks.length;
        const maxFloors = Math.max(...blocks.map(b => b.floors));
        
        // SVG boyutlarını hesapla
        const svgWidth = Math.min(400, totalBlocks * 80 + 60);
        const svgHeight = Math.min(300, maxFloors * 25 + 100);
        
        let svg = `<svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);">`;
        
        // Başlık
        svg += `<text x="${svgWidth/2}" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e293b">
                🏗️ 3D Bina Görünümü</text>`;
        
        // Zemin çizgisi
        const groundY = svgHeight - 40;
        svg += `<line x1="20" y1="${groundY}" x2="${svgWidth-20}" y2="${groundY}" stroke="#8b5cf6" stroke-width="2"/>`;
        svg += `<text x="${svgWidth/2}" y="${groundY + 15}" text-anchor="middle" font-size="10" fill="#6b7280">Zemin Seviyesi</text>`;
        
        // Blokları çiz
        blocks.forEach((block, index) => {
            const blockWidth = 60;
            const blockX = 40 + (index * 80);
            const floorHeight = 20;
            const buildingHeight = block.floors * floorHeight;
            const buildingY = groundY - buildingHeight;
            
            // Bina gölgesi
            svg += `<rect x="${blockX + 3}" y="${buildingY + 3}" width="${blockWidth}" height="${buildingHeight}" 
                    fill="rgba(0,0,0,0.2)" rx="2"/>`;
            
            // Ana bina
            svg += `<rect x="${blockX}" y="${buildingY}" width="${blockWidth}" height="${buildingHeight}" 
                    fill="#ffffff" stroke="#2563eb" stroke-width="2" rx="2"/>`;
            
            // Katları çiz
            for (let floor = 0; floor < block.floors; floor++) {
                const floorY = buildingY + (floor * floorHeight);
                
                // Kat çizgisi
                if (floor > 0) {
                    svg += `<line x1="${blockX}" y1="${floorY}" x2="${blockX + blockWidth}" y2="${floorY}" 
                            stroke="#cbd5e1" stroke-width="1"/>`;
                }
                
                // Pencereler
                const windowCount = 3;
                for (let w = 0; w < windowCount; w++) {
                    const windowX = blockX + 10 + (w * 15);
                    const windowY = floorY + 5;
                    svg += `<rect x="${windowX}" y="${windowY}" width="8" height="10" 
                            fill="#dbeafe" stroke="#3b82f6" stroke-width="0.5"/>`;
                }
            }
            
            // Çatı
            svg += `<polygon points="${blockX},${buildingY} ${blockX + blockWidth/2},${buildingY - 10} ${blockX + blockWidth},${buildingY}" 
                    fill="#ef4444" stroke="#dc2626" stroke-width="1"/>`;
            
            // Blok bilgileri
            svg += `<text x="${blockX + blockWidth/2}" y="${groundY + 30}" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e293b">
                    Blok ${block.id}</text>`;
            svg += `<text x="${blockX + blockWidth/2}" y="${groundY + 42}" text-anchor="middle" font-size="8" fill="#6b7280">
                    ${block.floors} Kat</text>`;
        });
        
        // Proje bilgileri
        if (projectResults) {
            svg += `<text x="20" y="${svgHeight - 5}" font-size="9" fill="#374151">
                    Toplam İnşaat: ${projectResults.maxInsaatAlani?.toFixed(0) || 0} m² | 
                    Maks. Yükseklik: ${projectResults.maxYukseklik?.toFixed(1) || 0} m</text>`;
        }
        
        svg += '</svg>';
        container.innerHTML = svg;
    }

    /**
     * Kat planı görselleştirmesi
     */
    updateFloorPlan(selectedApartmentTypes) {
        const container = document.getElementById('floorPlan');
        if (!container) return;

        if (!selectedApartmentTypes || selectedApartmentTypes.length === 0) {
            this.showPlaceholder(container, '📐', 'Daire tipi seçildikten sonra<br>kat planı görüntülenecek');
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
            const roomCount = this.apartmentTypes[apt.type]?.rooms || 2;
            
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
            
            // Oda düzeni hesapla
            const rooms = this.getRoomLayout(apt.type, roomCount);
            
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
            
            currentY += height + 35;
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
    }

    /**
     * Daire tipine göre oda düzeni
     */
    getRoomLayout(apartmentType, roomCount) {
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

    /**
     * Placeholder göster
     */
    showPlaceholder(container, icon, text) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="placeholder-content">
                <div class="placeholder-icon">${icon}</div>
                <p>${text}</p>
            </div>
        `;
    }

    /**
     * Daire listesi güncelleme
     */
    updateApartmentList(blocks) {
        const container = document.getElementById('daireListesiDetay');
        if (!container) return;

        if (!blocks || blocks.length === 0) {
            container.innerHTML = `
                <p style="text-align: center; color: #6b7280; padding: 40px;">
                    Hesaplama sonrası daire listesi görüntülenecek
                </p>
            `;
            return;
        }

        let html = '<div class="apartment-list">';
        let totalApartments = 0;

        blocks.forEach((block, index) => {
            html += `<div class="block-section">
                <h4 style="color: #1f2937; margin: 15px 0 10px 0;">🏢 Blok ${block.id} (${block.floors} Kat)</h4>`;
            
            const apartmentEntries = Object.entries(block.apartments || {});
            if (apartmentEntries.length === 0) {
                html += '<p style="color: #6b7280; font-style: italic; margin-left: 15px;">Daire bilgisi yok</p>';
            } else {
                apartmentEntries.forEach(([type, count]) => {
                    if (count > 0) {
                        totalApartments += count;
                        html += `<div class="apartment-item" style="display: flex; justify-content: space-between; padding: 8px 15px; background: #f8fafc; margin: 5px 0; border-radius: 6px;">
                            <span>${type} Daire</span>
                            <span style="font-weight: 600; color: #2563eb;">${count} adet</span>
                        </div>`;
                    }
                });
            }
            html += '</div>';
        });

        html += `<div class="total-section" style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #2563eb;">
            <strong style="color: #1e40af;">Toplam Daire Sayısı: ${totalApartments} adet</strong>
        </div>`;

        html += '</div>';
        container.innerHTML = html;
    }
}

/**
 * Theme Manager - Dark/Light tema yönetimi
 */
export class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.initializeTheme();
    }

    /**
     * Tema başlatma
     */
    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeButton();
    }

    /**
     * Tema değiştir
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        this.updateThemeButton();
    }

    /**
     * Tema butonunu güncelle
     */
    updateThemeButton() {
        const button = document.getElementById('themeToggle');
        if (button) {
            button.innerHTML = this.currentTheme === 'light' ? '🌙' : '☀️';
            button.title = this.currentTheme === 'light' ? 'Karanlık tema' : 'Açık tema';
        }
    }

    /**
     * Mevcut temayı getir
     */
    getCurrentTheme() {
        return this.currentTheme;
    }
}