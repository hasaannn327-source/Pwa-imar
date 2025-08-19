// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    console.log('İmar Hesaplayıcısı başlatılıyor...');
    
    initializeApp();
    setupEventListeners();
    selectDefaultApartments();
    registerServiceWorker();
    setupTheme();

    // Tab değiştirme (mouse + klavye)
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName, this);
        });
        tab.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const tabName = this.getAttribute('data-tab');
                switchTab(tabName, this);
            }
        });
    });
});

function switchTab(tabName, triggerEl) {
    // Tüm tabları ve içerikleri temizle
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Seçili tab ve içeriği aktif et
    const selectedTab = triggerEl || document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(tabName);
    
    if (selectedTab) {
        selectedTab.classList.add('active');
        document.querySelectorAll('.tab').forEach(el => {
            el.setAttribute('aria-selected', String(el === selectedTab));
            el.setAttribute('tabindex', el === selectedTab ? '0' : '-1');
        });
    }
    if (selectedContent) selectedContent.classList.add('active');
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '8px';
    notification.style.fontWeight = '500';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    if (type === 'success') {
        notification.style.backgroundColor = '#ecfdf5';
        notification.style.color = '#059669';
        notification.style.borderLeft = '4px solid #059669';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#fffbeb';
        notification.style.color = '#d97706';
        notification.style.borderLeft = '4px solid #d97706';
    }
    
    document.body.appendChild(notification);

    const region = document.getElementById('notification-region');
    if (region) {
        region.textContent = message;
    }
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

// Tema yönetimi
function setupTheme() {
    const root = document.documentElement;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        root.classList.add('dark');
    }
    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.addEventListener('click', () => {
            const isDark = root.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            btn.setAttribute('aria-pressed', String(isDark));
            btn.textContent = isDark ? '☀️ Aydınlık Tema' : '🌙 Karanlık Tema';
        });
        const isDark = root.classList.contains('dark');
        btn.setAttribute('aria-pressed', String(isDark));
        btn.textContent = isDark ? '☀️ Aydınlık Tema' : '🌙 Karanlık Tema';
    }
}