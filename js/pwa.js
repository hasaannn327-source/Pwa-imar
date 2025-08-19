import { showNotification } from './ui.js';

let deferredPrompt;

export function registerPWA() {
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', async () => {
			try {
				const registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });
				registration.addEventListener('updatefound', () => { showUpdateNotification(); });
				setupPWAInstall();
			} catch (e) { console.error('SW registration failed:', e); }
		});
	}
}

function setupPWAInstall() {
	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault();
		deferredPrompt = e;
		showInstallBanner();
	});
	window.addEventListener('appinstalled', () => {
		showNotification('🎉 Uygulama yüklendi!', 'success');
		hideInstallBanner();
	});
}

export async function installPWA() {
	if (deferredPrompt) {
		deferredPrompt.prompt();
		await deferredPrompt.userChoice;
		deferredPrompt = null;
		hideInstallBanner();
	}
}

export function showInstallBanner() {
	if (document.getElementById('pwa-install-banner')) return;
	const banner = document.createElement('div');
	banner.id = 'pwa-install-banner';
	banner.innerHTML = `
		<div style="position: fixed; top: 0; left: 0; right: 0; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 12px 20px; text-align: center; z-index: 9999; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
			<div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;">
				<div style="display: flex; align-items: center; gap: 10px;"><span style="font-size: 1.2rem;">📱</span><span><strong>İmar Hesaplayıcısı Pro</strong> uygulamasını ana ekrana ekleyin!</span></div>
				<div style="display: flex; gap: 10px;">
					<button id="pwa-install-btn" style="background: white; color: #2563eb; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">📲 Yükle</button>
					<button id="pwa-install-close" style="background: transparent; color: white; border: 1px solid white; padding: 8px 12px; border-radius: 6px; cursor: pointer;">✕</button>
				</div>
			</div>
		</div>`;
	document.body.appendChild(banner);
	document.getElementById('pwa-install-btn')?.addEventListener('click', installPWA);
	document.getElementById('pwa-install-close')?.addEventListener('click', hideInstallBanner);
}

export function hideInstallBanner() {
	const banner = document.getElementById('pwa-install-banner');
	if (banner && document.body.contains(banner)) document.body.removeChild(banner);
}

export function showUpdateNotification() {
	showNotification('🔄 Yeni sürüm mevcut! Sayfa yenilenecek...', 'success');
	setTimeout(() => window.location.reload(), 3000);
}

