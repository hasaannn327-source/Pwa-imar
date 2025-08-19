/**
 * Form Validasyon Modülü
 * Gelişmiş validasyon kuralları ve hata yönetimi
 */

export class FormValidator {
    constructor() {
        this.errors = [];
        this.rules = new Map();
    }

    /**
     * Validasyon kuralı ekle
     */
    addRule(fieldName, rule) {
        if (!this.rules.has(fieldName)) {
            this.rules.set(fieldName, []);
        }
        this.rules.get(fieldName).push(rule);
    }

    /**
     * Temel validasyon kurallarını yükle
     */
    loadDefaultRules() {
        // Şehir validasyonu
        this.addRule('sehir', {
            name: 'required',
            message: 'Şehir seçimi zorunludur',
            validate: (value) => value && value.trim() !== ''
        });

        // Parsel alanı validasyonu
        this.addRule('parselAlani', {
            name: 'required',
            message: 'Parsel alanı zorunludur',
            validate: (value) => value && value.trim() !== ''
        });

        this.addRule('parselAlani', {
            name: 'numeric',
            message: 'Parsel alanı sayısal değer olmalıdır',
            validate: (value) => !isNaN(parseFloat(value))
        });

        this.addRule('parselAlani', {
            name: 'positive',
            message: 'Parsel alanı pozitif olmalıdır',
            validate: (value) => parseFloat(value) > 0
        });

        this.addRule('parselAlani', {
            name: 'maxArea',
            message: 'Parsel alanı çok büyük (maksimum 100,000 m²)',
            validate: (value) => parseFloat(value) <= 100000
        });

        // TAKS validasyonu
        this.addRule('taban', {
            name: 'range',
            message: 'TAKS değeri 0.1 ile 1.0 arasında olmalıdır',
            validate: (value) => {
                const num = parseFloat(value);
                return num >= 0.1 && num <= 1.0;
            }
        });

        // KAKS validasyonu
        this.addRule('emsal', {
            name: 'range',
            message: 'KAKS değeri 0.1 ile 5.0 arasında olmalıdır',
            validate: (value) => {
                const num = parseFloat(value);
                return num >= 0.1 && num <= 5.0;
            }
        });

        // Kat yüksekliği validasyonu
        this.addRule('katYuksekligi', {
            name: 'range',
            message: 'Kat yüksekliği 2.5m ile 5.0m arasında olmalıdır',
            validate: (value) => {
                const num = parseFloat(value);
                return num >= 2.5 && num <= 5.0;
            }
        });

        // İmar durumu validasyonu
        this.addRule('imarDurumu', {
            name: 'required',
            message: 'İmar durumu seçimi zorunludur',
            validate: (value) => value && value.trim() !== ''
        });
    }

    /**
     * Form validasyonu yap
     */
    validateForm(formData) {
        this.errors = [];

        for (const [fieldName, rules] of this.rules) {
            const value = formData[fieldName];
            
            for (const rule of rules) {
                if (!rule.validate(value)) {
                    this.errors.push({
                        field: fieldName,
                        rule: rule.name,
                        message: rule.message
                    });
                    
                    // İlk hata için field'ı işaretle
                    this.markFieldError(fieldName);
                    break; // İlk hatada dur
                }
            }
            
            // Eğer hata yoksa field'ı temizle
            if (!this.hasFieldError(fieldName)) {
                this.clearFieldError(fieldName);
            }
        }

        return this.errors.length === 0;
    }

    /**
     * Özel validasyon: TAKS/KAKS uyumluluğu
     */
    validateTaksKaksCompatibility(taks, kaks) {
        if (kaks < taks) {
            this.errors.push({
                field: 'emsal',
                rule: 'compatibility',
                message: 'KAKS değeri TAKS değerinden küçük olamaz'
            });
            return false;
        }
        return true;
    }

    /**
     * Şehir bazlı validasyon
     */
    validateCityCompliance(city, imarDurumu, taks, kaks) {
        // Şehir yönetmeliği kontrolü burada yapılabilir
        return true;
    }

    /**
     * Field'ı hata olarak işaretle
     */
    markFieldError(fieldName) {
        const element = document.getElementById(fieldName);
        if (element) {
            element.style.borderColor = '#ef4444';
            element.classList.add('error');
        }
    }

    /**
     * Field hatasını temizle
     */
    clearFieldError(fieldName) {
        const element = document.getElementById(fieldName);
        if (element) {
            element.style.borderColor = '#e5e7eb';
            element.classList.remove('error');
        }
    }

    /**
     * Field'da hata var mı kontrol et
     */
    hasFieldError(fieldName) {
        return this.errors.some(error => error.field === fieldName);
    }

    /**
     * Hataları getir
     */
    getErrors() {
        return this.errors;
    }

    /**
     * Hata mesajlarını göster
     */
    displayErrors(container) {
        if (!container) return;

        if (this.errors.length === 0) {
            container.innerHTML = '';
            return;
        }

        let html = '<div class="validation-errors">';
        html += '<h4 style="color: #ef4444; margin: 0 0 10px 0;">⚠️ Lütfen aşağıdaki hataları düzeltin:</h4>';
        html += '<ul style="margin: 0; padding-left: 20px;">';
        
        this.errors.forEach(error => {
            html += `<li style="color: #ef4444; margin: 5px 0;">${error.message}</li>`;
        });
        
        html += '</ul></div>';
        container.innerHTML = html;
    }

    /**
     * Tüm hataları temizle
     */
    clearAllErrors() {
        this.errors = [];
        
        // Tüm form elementlerindeki hata stillerini temizle
        const formElements = document.querySelectorAll('.error');
        formElements.forEach(element => {
            element.style.borderColor = '#e5e7eb';
            element.classList.remove('error');
        });
    }
}

/**
 * Gerçek zamanlı validasyon sınıfı
 */
export class RealTimeValidator {
    constructor(validator) {
        this.validator = validator;
        this.debounceTimers = new Map();
    }

    /**
     * Gerçek zamanlı validasyon kurulumu
     */
    setupRealTimeValidation() {
        const fields = ['parselAlani', 'taban', 'emsal', 'katYuksekligi'];
        
        fields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.debounceValidation(fieldName, e.target.value);
                });
            }
        });
    }

    /**
     * Debounced validasyon
     */
    debounceValidation(fieldName, value) {
        // Önceki timer'ı temizle
        if (this.debounceTimers.has(fieldName)) {
            clearTimeout(this.debounceTimers.get(fieldName));
        }

        // Yeni timer kur
        const timer = setTimeout(() => {
            this.validateField(fieldName, value);
        }, 500);

        this.debounceTimers.set(fieldName, timer);
    }

    /**
     * Tek field validasyonu
     */
    validateField(fieldName, value) {
        const rules = this.validator.rules.get(fieldName);
        if (!rules) return;

        let hasError = false;
        for (const rule of rules) {
            if (!rule.validate(value)) {
                this.validator.markFieldError(fieldName);
                hasError = true;
                break;
            }
        }

        if (!hasError) {
            this.validator.clearFieldError(fieldName);
        }
    }
}