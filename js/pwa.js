export function registerPWA() {
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', async () => {
			try {
				const registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });
				if (registration) {
					registration.addEventListener('updatefound', () => { showUpdateNotification(); });
				}
				setupPWAInstall();
			} catch (e) { console.error('SW registration failed:', e); }
		});
	}
}