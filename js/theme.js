export function setupTheme() {
	const root = document.documentElement;
	const saved = localStorage.getItem('theme');
	if (saved === 'dark') root.classList.add('dark');
	const btn = document.getElementById('themeToggle');
	if (btn) {
		const sync = () => {
			const isDark = root.classList.contains('dark');
			btn.setAttribute('aria-pressed', String(isDark));
			btn.textContent = isDark ? '☀️ Aydınlık Tema' : '🌙 Karanlık Tema';
		};
		btn.addEventListener('click', () => {
			const isDark = root.classList.toggle('dark');
			localStorage.setItem('theme', isDark ? 'dark' : 'light');
			sync();
		});
		sync();
	}
}

