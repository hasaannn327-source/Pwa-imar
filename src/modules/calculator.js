/**
 * İmar Hesaplama Modülü
 * TAKS/KAKS hesaplamaları ve proje analizi
 */

export class ImarCalculator {
    constructor(cityRegulations) {
        this.cityRegulations = cityRegulations;
        this.results = {};
    }

    /**
     * Ana hesaplama fonksiyonu
     * @param {Object} projectData - Proje verileri
     * @returns {Object} Hesaplama sonuçları
     */
    calculate(projectData) {
        const {
            city,
            parselAlani,
            taban,
            emsal,
            katYuksekligi
        } = projectData;

        // Şehir bazlı yükseklik sınırı
        const maxYukseklikLimit = this.getCityHeightLimit(city);
        
        // Temel hesaplamalar
        const maxTabanAlani = parselAlani * taban;
        const maxInsaatAlani = parselAlani * emsal;
        
        // Kat sayısı hesaplaması
        let maxKatSayisi = Math.ceil(emsal / taban);
        const maxKatSayisiYukseklikIle = Math.floor(maxYukseklikLimit / katYuksekligi);
        maxKatSayisi = Math.min(maxKatSayisi, maxKatSayisiYukseklikIle);
        
        // Diğer hesaplamalar
        const maxYukseklik = maxKatSayisi * katYuksekligi;
        const acikAlan = parselAlani - maxTabanAlani;
        const yapilasmaorani = emsal * 100;
        const verimlilik = this.calculateEfficiency(maxInsaatAlani, parselAlani);
        
        this.results = {
            parselAlani,
            maxTabanAlani,
            maxInsaatAlani,
            maxKatSayisi,
            maxYukseklik,
            acikAlan,
            yapilasmaorani,
            verimlilik,
            city,
            maxYukseklikLimit,
            taks: taban,
            kaks: emsal,
            katYuksekligi
        };

        return this.results;
    }

    /**
     * Şehir bazlı yükseklik sınırını getir
     */
    getCityHeightLimit(city) {
        return (city && this.cityRegulations[city]) 
            ? this.cityRegulations[city].maxHeight 
            : 12.5;
    }

    /**
     * Verimlilik hesaplaması
     */
    calculateEfficiency(insaatAlani, parselAlani) {
        return (insaatAlani / parselAlani) * 100;
    }

    /**
     * Otomatik blok sayısı önerisi
     */
    suggestBlockCount(totalArea) {
        if (totalArea < 500) return 1;
        if (totalArea < 1200) return 2;
        if (totalArea < 2500) return 3;
        if (totalArea < 4000) return 4;
        return Math.ceil(totalArea / 1000);
    }

    /**
     * Daire dağılımı hesaplaması
     */
    calculateApartmentDistribution(selectedApartmentTypes, totalArea) {
        const distribution = {};
        let totalApartments = 0;

        if (selectedApartmentTypes.length === 0) {
            return { distribution: {}, totalApartments: 0 };
        }

        selectedApartmentTypes.forEach(aptType => {
            const count = Math.floor(totalArea / aptType.area / selectedApartmentTypes.length);
            if (count > 0) {
                distribution[aptType.type] = count;
                totalApartments += count;
            }
        });

        return { distribution, totalApartments };
    }

    /**
     * Otopark gereksinimi hesaplama
     */
    calculateParkingRequirement(totalApartments, parkingRatio = 1.2) {
        return Math.ceil(totalApartments * parkingRatio);
    }

    /**
     * Sosyal alan hesaplaması
     */
    calculateSocialArea(totalApartments, areaPerApartment = 5) {
        return totalApartments * areaPerApartment;
    }

    /**
     * Son hesaplama sonuçlarını getir
     */
    getResults() {
        return this.results;
    }
}

/**
 * Blok hesaplama sınıfı
 */
export class BlockCalculator {
    constructor(calculator) {
        this.calculator = calculator;
        this.blocks = [];
    }

    /**
     * Otomatik blok oluşturma
     */
    autoCalculateBlocks(projectResults, selectedApartmentTypes) {
        if (!projectResults.maxInsaatAlani) return [];

        this.blocks = [];
        const suggestedBlockCount = this.calculator.suggestBlockCount(projectResults.maxInsaatAlani);
        
        for (let i = 0; i < suggestedBlockCount; i++) {
            this.blocks.push({
                id: i + 1,
                floors: Math.min(projectResults.maxKatSayisi, 5),
                apartments: {},
                totalArea: 0
            });
        }
        
        return this.calculateBlockDetails(projectResults, selectedApartmentTypes);
    }

    /**
     * Blok detaylarını hesapla
     */
    calculateBlockDetails(projectResults, selectedApartmentTypes) {
        if (!projectResults.maxInsaatAlani || this.blocks.length === 0) {
            return { blocks: [], totalApartments: 0 };
        }
        
        const totalFloors = this.blocks.reduce((sum, block) => sum + block.floors, 0);
        const areaPerFloor = totalFloors > 0 ? projectResults.maxInsaatAlani / totalFloors : 0;
        
        let totalApartments = 0;
        
        this.blocks.forEach(block => {
            block.totalArea = block.floors * areaPerFloor;
            block.apartments = {};
            
            const { distribution } = this.calculator.calculateApartmentDistribution(
                selectedApartmentTypes, 
                block.totalArea
            );
            
            block.apartments = distribution;
            totalApartments += Object.values(distribution).reduce((sum, count) => sum + count, 0);
        });
        
        return { blocks: this.blocks, totalApartments };
    }

    /**
     * Blok ekle
     */
    addBlock(floors = 4) {
        const block = {
            id: this.blocks.length + 1,
            floors,
            apartments: {},
            totalArea: 0
        };
        
        this.blocks.push(block);
        return block;
    }

    /**
     * Blok sil
     */
    removeBlock() {
        if (this.blocks.length > 0) {
            return this.blocks.pop();
        }
        return null;
    }

    /**
     * Blok kat sayısını güncelle
     */
    updateBlockFloors(blockId, floors) {
        const block = this.blocks.find(b => b.id === blockId);
        if (block) {
            block.floors = Math.max(1, Math.min(floors, 20)); // 1-20 kat arası
            return true;
        }
        return false;
    }

    /**
     * Tüm blokları getir
     */
    getBlocks() {
        return this.blocks;
    }
}