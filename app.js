// İmar Hesaplayıcısı Pro v2.0 - Ana JavaScript Dosyası

class ImarCalculator {
    constructor() {
        this.results = {};
        this.initializeElements();
        this.loadSavedData();
        this.setupEventListeners();
        
        // İlk hesaplamayı yap
        setTimeout(() => {
            this.validateAndCalculate();
        }, 100);
    }

    initializeElements() {
        this.elements = {
            plotArea: document.getElementById('plotArea'),
            taks: document.getElementById('taks'),
            kaks: document.getElementById('kaks'),
            setback: document.getElementById('setback'),
            floors: document.getElementById('floors'),
            apartmentArea: document.getElementById('apartmentArea'),
            maxHeight: document.getElementById('maxHeight'),
            parkingRatio: document.getElementById('parkingRatio'),
            commonAreaRatio: document.getElementById('commonAreaRatio')
        };
    }

    setupEventListeners() {
        // Her input değişikliğinde hesapla
        Object.values(this.elements).forEach(element => {
            if (element) {
                element.addEventListener('input', () => {
                    this.debounceCalculate();
                });
                element.addEventListener('change', () => {
                    this.validateAndCalculate();
                });
            }
        });
    }

    // Debounced hesaplama (çok fazla hesaplama yapmasını önler)
    debounceCalculate() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.validateAndCalculate();
        }, 500);
    }

    validateInput(id, value, min, max, errorMsg) {
        const element = document.getElementById(id);
        const errorElement = document.getElementById(id + '-error');
        
        if (!element) return true;

        if (isNaN(value) || value < min || value > max) {
            element.classList.add('error');
            if (errorElement) {
                errorElement.textContent = errorMsg;
                errorElement.style.display = 'block';
            }
            return false;
        } else {
            element.classList.remove('error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
            return true;
        }
    }

    validateAllInputs() {
        const plotArea = parseFloat(this.elements.plotArea?.value || 0);
        const taks = parseFloat(this.elements.taks?.value || 0);
        const kaks = parseFloat(this.elements.kaks?.value || 0);
        const setback = parseFloat(this.elements.setback?.value || 0);
        const floors = parseInt(this.elements.floors?.value || 0);
        const apartmentArea = parseFloat(this.elements.apartmentArea?.value || 0);

        const validations = [
            this.validateInput('plotArea', plotArea, 50, 50000, 'Arsa alanı 50-50000 m² arası olmalı'),
            this.validateInput('taks', taks, 0.1, 1.0, 'TAKS 0.1-1.0 arası olmalı'),
            this.validateInput('kaks', kaks, 0.1, 5.0, 'KAKS 0.1-5.0 arası olmalı'),
            this.validateInput('setback', setback, 0, 100, 'Çekme mesafesi 0-100 m arası olmalı'),
            this.validateInput('floors', floors, 1, 20, 'Kat sayısı 1-20 arası olmalı'),
            this.validateInput('apartmentArea', apartmentArea, 30, 500, 'Daire alanı 30-500 m² arası olmalı')
        ];

        // TAKS <= KAKS kontrolü
        if (taks > kaks && taks > 0 && kaks > 0) {
            this.validateInput('kaks', -1, 0, 1, 'KAKS değeri TAKS\'tan büyük olmalı');
            return false;
        }

        return validations.every(v => v);
    }

    calculate() {
        if (!this.validateAllInputs()) {
            this.hideResults();
            return;
        }

        this.showLoading();

        // Simüle edilmiş loading (gerçek hesaplama çok hızlı)
        setTimeout(() => {
            this.performCalculations();
            this.hideLoading();
            this.displayResults();
            this.create3DVisualization();
            this.saveData();
        }, 800);
    }

    performCalculations() {
        // Input değerlerini al
        const area = parseFloat(this.elements.plotArea?.value || 500);
        const taks = parseFloat(this.elements.taks?.value || 0.4);
        const kaks = parseFloat(this.elements.kaks?.value || 1.6);
        const setback = parseFloat(this.elements.setback?.value || 10);
        const floors = parseInt(this.elements.floors?.value || 4);
        const apartmentArea = parseFloat(this.elements.apartmentArea?.value || 80);
        const maxHeight = parseFloat(this.elements.maxHeight?.value || 15);
        const parkingRatio = parseFloat(this.elements.parkingRatio?.value || 1);
        const commonAreaRatio = parseFloat(this.elements.commonAreaRatio?.value || 20);

        // Çekme mesafesi hesaplama (4 yönden)
        const setbackArea = this.calculateSetbackArea(area, setback);
        const netBuildableArea = Math.max(0, area - setbackArea);
        
        // Temel hesaplamalar
        const maxBaseArea = area * taks;
        const maxTotalArea = area * kaks;
        const actualBaseArea = Math.min(maxBaseArea, netBuildableArea);
        
        // Kat yüksekliği kontrolü (3m kat yüksekliği varsayımı)
        const maxFloorsFromHeight = Math.floor(maxHeight / 3);
        const actualFloors = Math.min(floors, maxFloorsFromHeight);
        
        // Daire hesaplamaları
        const maxUnitsFromArea = Math.floor(maxTotalArea / apartmentArea);
        const maxUnitsFromFloor = Math.floor(actualBaseArea / apartmentArea) * actualFloors;
        const totalUnits = Math.min(maxUnitsFromArea, maxUnitsFromFloor);
        const unitsPerFloor = Math.max(1, Math.floor(totalUnits / actualFloors));
        const actualTotalUnits = unitsPerFloor * actualFloors;
        
        // Otopark hesaplaması
        const requiredParkingSpots = Math.ceil(actualTotalUnits * parkingRatio);
        const parkingArea = requiredParkingSpots * 25; // 25 m² per spot
        
        // Ortak alan hesaplaması
        const totalGrossArea = actualTotalUnits * apartmentArea;
        const commonArea = totalGrossArea * (commonAreaRatio / 100);

        // Sonuçları kaydet
        this.results = {
            basic: {
                area,
                taks,
                kaks,
                setback,
                netBuildableArea,
                maxBaseArea,
                actualBaseArea,
                maxTotalArea,
                floors,
                actualFloors,
                totalUnits: actualTotalUnits,
                unitsPerFloor,
                apartmentArea
            },
            advanced: {
                maxHeight,
                parkingRatio,
                commonAreaRatio,
                requiredParkingSpots,
                parkingArea,
                commonArea,
                totalGrossArea,
                setbackArea
            }
        };

        // Analiz hesaplama
        this.results.analysis = this.generateAnalysis();
    }

    calculateSetbackArea(totalArea, setback) {
        // Karesel arsa varsayımı ile çekme alanı hesaplama
        const sideLength = Math.sqrt(totalArea);
        const netSideLength = Math.max(0, sideLength - (setback * 2));
        const netArea = netSideLength * netSideLength;
        return Math.max(0, totalArea - netArea);
    }

    generateAnalysis() {
        const basic = this.results?.basic;
        const advanced = this.results?.advanced;
        
        if (!basic || !advanced) {
            return {
                efficiency: 0,
                utilizationRate: 0,
                warnings: ['Hesaplama verileri eksik'],
                recommendations: ['Lütfen tüm alanları doldurun']
            };
        }
        
        const efficiency = basic.maxBaseArea > 0 ? (basic.actualBaseArea / basic.maxBaseArea * 100) : 0;
        const utilizationRate = basic.maxTotalArea > 0 ? (basic.totalUnits * basic.apartmentArea / basic.maxTotalArea * 100) : 0;
        
        const warnings = [];
        const recommendations = [];

        // TAKS kontrolü
        if (basic.taks > 0.6) {
            warnings.push("Yüksek TAKS değeri - Yeşil alan oranını kontrol edin");
        }
        
        // KAKS kontrolü
        if (basic.kaks > 2.0) {
            warnings.push("Yüksek KAKS değeri - Altyapı kapasitesini değerlendirin");
        }

        // Çekme mesafesi kontrolü
        if (basic.setback < Math.sqrt(basic.area) * 0.1) {
            warnings.push("Çekme mesafesi arsa büyüklüğüne göre düşük olabilir");
        }

        // Kat yüksekliği kontrolü
        if (basic.actualFloors < basic.floors) {
            warnings.push("Yükseklik sınırlaması nedeniyle kat sayısı azaltıldı");
        }

        // Verimlilik önerileri
        if (efficiency < 80) {
            recommendations.push("Arsa verimliliği artırılabilir - Plan düzenlemesi önerilir");
        }

        if (utilizationRate < 70) {
            recommendations.push("KAKS kullanım oranı düşük - Daire alanları optimize edilebilir");
        }

        if (basic.unitsPerFloor > 8) {
            recommendations.push("Kat başına daire sayısı yüksek - Yaşam kalitesi için azaltılabilir");
        }

        if (advanced.requiredParkingSpots < basic.totalUnits) {
            recommendations.push("Otopark kapasitesi yetersiz - Ek otopark alanları düşünülmeli");
        }

        return {
            efficiency: parseFloat(efficiency.toFixed(1)),
            utilizationRate: parseFloat(utilizationRate.toFixed(1)),
            warnings,
            recommendations
        };
    }

    displayResults() {
        this.displayBasicResults();
        this.displayDetailedResults();
        this.displayAnalysisResults();
        this.showResults();
    }

    displayBasicResults() {
        const container = document.getElementById('basicResults');
        if (!container) return;
        
        const { basic } = this.results;
        
        container.innerHTML = `
            <div class="result-item">
                <div class="result-value">${basic.netBuildableArea.toFixed(0)}</div>
                <div class="result-label">Net Yapılaşabilir Alan (m²)</div>
            </div>
            <div class="result-item">
                <div class="result-value">${basic.actualBaseArea.toFixed(0)}</div>
                <div class="result-label">Taban Alanı (m²)</div>
            </div>
            <div class="result-item">
                <div class="result-value">${basic.maxTotalArea.toFixed(0)}</div>
                <div class="result-label">Toplam İnşaat Alanı (m²)</div>
            </div>
            <div class="result-item">
                <div class="result-value">${basic.totalUnits}</div>
                <div class="result-label">Toplam Daire Sayısı</div>
            </div>
            <div class="result-item">
                <div class="result-value">${basic.unitsPerFloor}</div>
                <div class="result-label">Kat Başına Daire</div>
            </div>
            <div class="result-item">
                <div class="result-value">${basic.actualFloors}</div>
                <div class="result-label">Gerçek Kat Sayısı</div>
            </div>
        `;
    }

    displayDetailedResults() {
        const container = document.getElementById('detailedResults');
        if (!container) return;
        
        const { basic, advanced } = this.results;
        
        container.innerHTML = `
            <h3 class="section-title">🔍 Detaylı Hesaplamalar</h3>
            <div class="result-grid">
                <div class="result-item">
                    <div class="result-value">${advanced.setbackArea.toFixed(0)}</div>
                    <div class="result-label">Çekme Alanı (m²)</div>
                </div>
                <div class="result-item">
                    <div class="result-value">${advanced.requiredParkingSpots}</div>
                    <div class="result-label">Gerekli Otopark</div>
                </div>
                <div class="result-item">
                    <div class="result-value">${advanced.parkingArea.toFixed(0)}</div>
                    <div class="result-label">Otopark Alanı (m²)</div>
                </div>
                <div class="result-item">
                    <div class="result-value">${advanced.commonArea.toFixed(0)}</div>
                    <div class="result-label">Ortak Alan (m²)</div>
                </div>
                <div class="result-item">
                    <div class="result-value">${advanced.totalGrossArea.toFixed(0)}</div>
                    <div class="result-label">Toplam Brüt Alan (m²)</div>
                </div>
                <div class="result-item">
                    <div class="result-value">${(basic.actualBaseArea / basic.area * 100).toFixed(1)}%</div>
                    <div class="result-label">Arsa Kullanım Oranı</div>
                </div>
            </div>
        `;
    }

    displayAnalysisResults() {
        const container = document.getElementById('analysisResults');
        if (!container) return;
        
        const { analysis } = this.results;
        
        let warningsHtml = '';
        let recommendationsHtml = '';

        if (analysis.warnings.length > 0) {
            warningsHtml = `
                <div class="warning-box">
                    <h4>⚠️ Uyarılar</h4>
                    ${analysis.warnings.map(w => `<p>• ${w}</p>`).join('')}
                </div>
            `;
        }

        if (analysis.recommendations.length > 0) {
            recommendationsHtml = `
                <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid var(--success-color); padding: 15px; border-radius: var(--border-radius); margin-top: 15px;">
                    <h4 style="color: var(--success-color); margin-bottom: 5px;">💡 Öneriler</h4>
                    ${analysis.recommendations.map(r => `<p>• ${r}</p>`).join('')}
                </div>
            `;
        }

        container.innerHTML = `
            <h3 class="section-title">📈 Performans Analizi</h3>
            <div class="result-grid">
                <div class="result-item">
                    <div class="result-value">${analysis.efficiency}%</div>
                    <div class="result-label">Arsa Verimliliği</div>
                </div>
                <div class="result-item">
                    <div class="result-value">${analysis.utilizationRate}%</div>
                    <div class="result-label">KAKS Kullanım Oranı</div>
                </div>
            </div>
            ${warningsHtml}
            ${recommendationsHtml}
        `;
    }

    create3DVisualization() {
        const container = document.getElementById('building3d');
        if (!container) return;
        
        const { basic } = this.results;
        
        container.innerHTML = '';
        
        if (basic.actualFloors === 0 || basic.totalUnits === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">Geçerli hesaplama bulunamadı</p>';
            return;
        }
        
        const floorContainer = document.createElement('div');
        floorContainer.className = 'floor-container';
        
        for (let i = 0; i < basic.actualFloors; i++) {
            const floor = document.createElement('div');
            floor.className = 'floor-box';
            floor.setAttribute('data-units', basic.unitsPerFloor);
            floor.style.animationDelay = `${i * 0.1}s`;
            floorContainer.appendChild(floor);
        }
        
        container.appendChild(floorContainer);
        
        // Building info
        const info = document.createElement('div');
        info.style.cssText = 'margin-top: 20px; text-align: center; color: var(--text-secondary); font-size: 0.9rem;';
        info.innerHTML = `
            <strong>${basic.actualFloors} Kat • ${basic.totalUnits} Daire</strong><br>
            Kat başına ${basic.unitsPerFloor} daire
        `;
        container.appendChild(info);
    }

    showLoading() {
        const loading = document.getElementById('loading');
        const btn = document.getElementById('calculateBtn');
        
        if (loading) loading.style.display = 'block';
        if (btn) btn.disabled = true;
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        const btn = document.getElementById('calculateBtn');
        
        if (loading) loading.style.display = 'none';
        if (btn) btn.disabled = false;
    }

    showResults() {
        const container = document.getElementById('resultsContainer');
        if (container) {
            container.classList.add('show');
        }
    }

    hideResults() {
        const container = document.getElementById('resultsContainer');
        if (container) {
            container.classList.remove('show');
        }
    }

    saveData() {
        const data = {
            inputs: {},
            results: this.results,
            timestamp: new Date().toISOString()
        };
        
        // Input değerlerini kaydet
        Object.keys(this.elements).forEach(key => {
            if (this.elements[key]) {
                data.inputs[key] = this.elements[key].value;
            }
        });
        
        // Memory storage (LocalStorage alternatifi)
        window.imarCalculatorData = data;
        
        // LocalStorage'a da kaydet (destekleniyorsa)
        try {
            localStorage.setItem('imarCalculatorData', JSON.stringify(data));
        } catch (e) {
            console.log('LocalStorage desteklenmiyor, memory storage kullanılıyor');
        }
    }

    loadSavedData() {
        let data = null;
        
        // Önce LocalStorage'dan dene
        try {
            const stored = localStorage.getItem('imarCalculatorData');
            if (stored) {
                data = JSON.parse(stored);
            }
        } catch (e) {
            console.log('LocalStorage\'dan veri okunamadı');
        }
        
        // LocalStorage yoksa memory'den
        if (!data && window.imarCalculatorData) {
            data = window.imarCalculatorData;
        }
        
        if (data && data.inputs) {
            Object.keys(data.inputs).forEach(key => {
                if (this.elements[key]) {
                    this.elements[key].value = data.inputs[key];
                }
            });
        }
    }

    validateAndCalculate() {
        if (this.validateAllInputs()) {
            this.calculate();
        }
    }
}

// Global fonksiyonlar
function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Geçiş animasyonu
    document.body.style.transition = 'all 0.3s ease';
    
    root.setAttribute('data-theme', newTheme);
    
    const button = document.querySelector('.theme-toggle');
    if (button) {
        button.innerHTML = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
    
    // Animasyon temizleme
    setTimeout(() => {
        document.body.style.transition = '';
    }, 300);
    
    // Tema tercihini kaydet
    try {
        localStorage.setItem('theme-preference', newTheme);
    } catch (e) {
        window.themePreference = newTheme;
    }
}

function switchTab(tabName) {
    // Tüm tab içeriklerini gizle
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Tüm tablardan active class'ını kaldır
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Seçilen tab içeriğini göster
    const tabContent = document.getElementById(tabName + '-tab');
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // Tıklanan taba active class ekle
event.target.classList.add('active');
}

function calculate() {
    if (window.calculator) {
        window.calculator.calculate();
    }
}

function validateAndCalculate() {
    if (window.calculator) {
        window.calculator.validateAndCalculate();
    }
}

// Export fonksiyonları
function exportToPDF() {
    const results = window.calculator?.results;
    if (!results) {
        alert('Önce hesaplama yapmanız gerekiyor!');
        return;
    }
    
    try {
        const { basic, advanced, analysis } = results;
        const today = new Date();
        
        let report = `İMAR HESAPLAMA RAPORU\n`;
        report += `${'='.repeat(50)}\n\n`;
        report += `📅 Rapor Tarihi: ${today.toLocaleDateString('tr-TR')}\n`;
        report += `⏰ Rapor Saati: ${today.toLocaleTimeString('tr-TR')}\n\n`;
        
        report += `📐 TEMEL BİLGİLER:\n${'-'.repeat(30)}\n`;
        report += `• Arsa Alanı: ${basic.area.toLocaleString('tr-TR')} m²\n`;
        report += `• TAKS: ${basic.taks}\n• KAKS: ${basic.kaks}\n`;
        report += `• Kat Sayısı: ${basic.actualFloors}\n`;
        report += `• Toplam Daire: ${basic.totalUnits}\n\n`;
        
        report += `🏗️ HESAPLAMA SONUÇLARI:\n${'-'.repeat(30)}\n`;
        report += `• Net Yapılaşabilir Alan: ${basic.netBuildableArea.toFixed(0)} m²\n`;
        report += `• Maksimum İnşaat Alanı: ${basic.maxTotalArea.toFixed(0)} m²\n`;
        report += `• Otopark Gereksinimi: ${advanced.requiredParkingSpots} adet\n\n`;
        
        report += `📊 PERFORMANS:\n${'-'.repeat(30)}\n`;
        report += `• Arsa Verimliliği: %${analysis.efficiency}\n`;
        report += `• KAKS Kullanım Oranı: %${analysis.utilizationRate}\n\n`;
        
        if (analysis.warnings.length > 0) {
            report += `⚠️ UYARILAR:\n${'-'.repeat(30)}\n`;
            analysis.warnings.forEach((w, i) => report += `${i + 1}. ${w}\n`);
            report += `\n`;
        }
        
        report += `Bu rapor İmar Hesaplayıcısı Pro v2.0 ile oluşturulmuştur.\n${window.location.href}`;
        
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `imar_raporu_${basic.area}m2_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ Rapor başarıyla indirildi!');
    } catch (error) {
        console.error('Export Error:', error);
        alert('❌ Rapor oluşturulurken hata oluştu.');
    }
}

function exportToExcel() {
    const results = window.calculator?.results;
    if (!results) {
        alert('Önce hesaplama yapmanız gerekiyor!');
        return;
    }
    
    try {
        const { basic, advanced, analysis } = results;
        let csvContent = "data:text/csv;charset=utf-8,";
        
        csvContent += "PARAMETRE,DEĞER,BİRİM\n";
        csvContent += `Arsa Alanı,${basic.area},m²\n`;
        csvContent += `TAKS,${basic.taks},-\n`;
        csvContent += `KAKS,${basic.kaks},-\n`;
        csvContent += `Kat Sayısı,${basic.actualFloors},adet\n`;
        csvContent += `Toplam Daire,${basic.totalUnits},adet\n`;
        csvContent += `Net Yapılaşabilir Alan,${basic.netBuildableArea.toFixed(0)},m²\n`;
        csvContent += `İnşaat Alanı,${basic.maxTotalArea.toFixed(0)},m²\n`;
        csvContent += `Arsa Verimliliği,${analysis.efficiency},%\n`;
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `imar_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('✅ Excel dosyası indirildi!');
    } catch (error) {
        console.error('Excel Export Error:', error);
        alert('❌ Excel oluşturulurken hata oluştu.');
    }
}

function shareResults() {
    const results = window.calculator?.results;
    if (!results) {
        alert('Önce hesaplama yapmanız gerekiyor!');
        return;
    }
    
    const { basic, analysis } = results;
    const shareText = `🏗️ İmar Hesaplama Sonuçları\n📐 Arsa: ${basic.area.toLocaleString('tr-TR')} m²\n🏠 ${basic.totalUnits} daire\n📊 Verimlilik: %${analysis.efficiency}\n\n${window.location.href}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'İmar Hesaplama Sonuçları',
            text: shareText
        }).catch(() => fallbackShare(shareText));
    } else {
        fallbackShare(shareText);
    }
}

function fallbackShare(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('📋 Sonuçlar panoya kopyalandı!');
        }).catch(() => promptCopy(text));
    } else {
        promptCopy(text);
    }
}

function promptCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        alert('📋 Panoya kopyalandı!');
    } catch (err) {
        alert('📋 Manuel kopyalayın:\n\n' + text);
    }
    document.body.removeChild(textarea);
}
// Sayfa yüklendiğinde çalışacak fonksiyonlar
function loadSavedTheme() {
    try {
        const savedTheme = localStorage.getItem('theme-preference') || window.themePreference;
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            const button = document.querySelector('.theme-toggle');
            if (button) {
                button.innerHTML = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
            }
        }
    } catch (e) {
        console.log('Tema yüklenirken hata:', e);
    }
}

// Ana uygulama başlatma
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏗️ İmar Hesaplayıcısı Pro v2.0 başlatıldı');
    
    // Tema yükle
    loadSavedTheme();
    
    // Calculator'ı başlat
    try {
        window.calculator = new ImarCalculator();
        console.log('✅ Calculator başlatıldı');
    } catch (error) {
        console.error('❌ Calculator başlatma hatası:', error);
    }
    
    // Service Worker kaydı
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('✅ SW kayıt başarılı:', registration.scope);
                    
                    // Update kontrolü
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // Yeni versiyon var
                                    if (confirm('🆕 Yeni versiyon mevcut! Güncellemek ister misiniz?')) {
                                        window.location.reload();
                                    }
                                }
                            });
                        }
                    });
                })
                .catch(registrationError => {
                    console.log('❌ SW kayıt hatası:', registrationError);
                });
        });
    }
    
    // PWA yükleme prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Yükleme butonu göster (opsiyonel)
        const installButton = document.createElement('button');
        installButton.innerHTML = '📱 Uygulamayı Yükle';
        installButton.className = 'export-btn';
        installButton.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000;';
        installButton.onclick = async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const result = await deferredPrompt.userChoice;
                if (result.outcome === 'accepted') {
                    console.log('✅ PWA yüklendi');
                }
                deferredPrompt = null;
                installButton.remove();
            }
        };
        
        // 5 saniye sonra göster
        setTimeout(() => {
            document.body.appendChild(installButton);
            
            // 30 saniye sonra otomatik kaldır
            setTimeout(() => {
                if (installButton.parentNode) {
                    installButton.remove();
                }
            }, 30000);
        }, 5000);
    });
    
    // PWA yüklendiğinde buton kaldır
    window.addEventListener('appinstalled', (evt) => {
        console.log('✅ PWA başarıyla yüklendi');
        const installButton = document.querySelector('button[onclick*="deferredPrompt"]');
        if (installButton) {
            installButton.remove();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter = Hesapla
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            calculate();
        }
        
        // Ctrl/Cmd + D = Dark mode toggle
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            toggleTheme();
        }
        
        // Ctrl/Cmd + S = Export PDF
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            exportToPDF();
        }
    });
    
    // Online/offline durum takibi
    window.addEventListener('online', () => {
        console.log('🌐 Online');
        const statusDiv = document.getElementById('connection-status');
        if (statusDiv) {
            statusDiv.remove();
        }
    });
    
    window.addEventListener('offline', () => {
        console.log('📱 Offline mode');
        const statusDiv = document.createElement('div');
        statusDiv.id = 'connection-status';
        statusDiv.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; 
            background: #f59e0b; color: white; text-align: center; 
            padding: 10px; z-index: 10000; font-weight: 600;
        `;
        statusDiv.innerHTML = '📱 Çevrimdışı modda çalışıyorsunuz';
        document.body.prepend(statusDiv);
    });
    
    // Performance monitoring
    if ('performance' in window && 'getEntriesByType' in performance) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('📊 Sayfa yüklenme süresi:', Math.round(perfData.loadEventEnd - perfData.fetchStart), 'ms');
            }, 0);
        });
    }
    // Unhandled error tracking
    window.addEventListener('error', (e) => {
        console.error('❌ Global hata:', e.error);
        
        // Production'da hata raporlama servisi kullanılabilir
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            // Örnek: Sentry, LogRocket vs.
            console.log('Hata raporu gönderilecek:', e.message);
        }
    });
    
    window.addEventListener('unhandledrejection', (e) => {
        console.error('❌ Promise hatası:', e.reason);
        e.preventDefault(); // Console'da göstermesini engelle
    });
});

// Utility fonksiyonları
const Utils = {
    // Sayı formatla
    formatNumber: (num, decimals = 0) => {
        return Number(num).toLocaleString('tr-TR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },
    
    // Para formatla
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    },
    
    // Tarih formatla
    formatDate: (date) => {
        return new Intl.DateTimeFormat('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },
    
    // Debounce fonksiyon
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Deep clone
    deepClone: (obj) => {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            console.warn('Deep clone hatası:', e);
            return obj;
        }
    },
    
    // Storage yardımcıları
    storage: {
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                return window['storage_' + key] || defaultValue;
            }
        },
        
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                window['storage_' + key] = value;
            }
        },
        
        remove: (key) => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                delete window['storage_' + key];
            }
        }
    }
};

// Global Utils erişimi
window.Utils = Utils;

// Console'da hoş geldin mesajı
console.log(`
🏗️ İmar Hesaplayıcısı Pro v2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Özellikler:
• TAKS/KAKS Hesaplamaları
• 3D Bina Görselleştirme  
• PWA Desteği
• Export Fonksiyonları
• Dark/Light Theme

🔧 Geliştirici Araçları:
• window.calculator - Ana calculator instance
• window.Utils - Yardımcı fonksiyonlar
• Ctrl+Enter - Hesapla
• Ctrl+D - Tema değiştir
• Ctrl+S - PDF export

📞 Destek: GitHub Issues
🌟 Star verin: github.com/username/imar-hesaplayici-pro
`);

// Son olarak, calculator instance'ını global hale getir
window.addEventListener('load', () => {
    if (window.calculator) {
        // İlk hesaplamayı yap (eğer veriler varsa)
        setTimeout(() => {
            window.calculator.validateAndCalculate();
        }, 1000);
    }
});
