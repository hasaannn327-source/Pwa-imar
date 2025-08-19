import { state, apartmentTypes, cityRegulations } from './state.js';

export function initializeApp() {
	if (!document.getElementById('taban').value) {
		document.getElementById('taban').value = '0.30';
	}
	if (!document.getElementById('emsal').value) {
		document.getElementById('emsal').value = '1.00';
	}
	if (!document.getElementById('katYuksekligi').value) {
		document.getElementById('katYuksekligi').value = '3.0';
	}
}

export function selectDefaultApartments() {
	const apt2plus1 = document.querySelector('[data-type="2+1"]');
	const apt3plus1 = document.querySelector('[data-type="3+1"]');
	if (apt2plus1) apt2plus1.classList.add('selected');
	if (apt3plus1) apt3plus1.classList.add('selected');
	displaySelectedApartments();
	updateFloorPlan();
}

export function displaySelectedApartments() {
	const container = document.getElementById('selectedApartments');
	if (!container) return;
	let html = '<h4 style="margin: 15px 0 10px 0; color: #1f2937;">Seçilen Daire Tipleri:</h4>';
	if (state.selectedApartmentTypes.length === 0) {
		html += '<p style="color: #6b7280; font-style: italic;">Henüz daire tipi seçilmemiş</p>';
	} else {
		state.selectedApartmentTypes.forEach(apt => {
			html += `<div class="result-item"><span class="result-label">${apt.type}</span><span class="result-value">${apt.area} m²</span></div>`;
		});
	}
	container.innerHTML = html;
}

export function updateResultsUI() {
	const pr = state.projectResults;
	if (!pr || !Number.isFinite(pr.maxInsaatAlani)) return;
	const elements = {
		'maxTabanAlani': pr.maxTabanAlani.toFixed(2) + ' m²',
		'maxInsaatAlani': pr.maxInsaatAlani.toFixed(2) + ' m²',
		'maxKatSayisi': pr.maxKatSayisi + ' kat',
		'maxYukseklik': pr.maxYukseklik.toFixed(1) + ' m',
		'acikAlan': pr.acikAlan.toFixed(2) + ' m²',
		'yapilasmaorani': '%' + pr.yapilasmaorani.toFixed(1)
	};
	Object.entries(elements).forEach(([id, value]) => {
		const el = document.getElementById(id);
		if (el) el.textContent = value;
	});
}

export function updateBlockDisplay() {
	const container = document.getElementById('blockList');
	if (!container) return;
	if (state.blocks.length === 0) {
		container.innerHTML = '<p style="text-align: center; color: #6b7280; font-style: italic; padding: 20px;">Henüz blok eklenmemiş</p>';
		return;
	}
	let html = '';
	state.blocks.forEach((block, index) => {
		html += `
			<div class="block-item">
				<h4>🏢 Blok ${block.id}</h4>
				<div class="input-group">
					<label>Kat Sayısı:</label>
					<input type="number" min="1" max="12" value="${block.floors}" onchange="updateBlockFloors(${index}, this.value)">
				</div>
				<div class="result-item">
					<span class="result-label">Toplam Alan:</span>
					<span class="result-value">${block.totalArea.toFixed(0)} m²</span>
				</div>
			</div>`;
	});
	container.innerHTML = html;
}

export function updateBlockCounters(blockCount, apartmentCount) {
	const blockCountElement = document.getElementById('toplamBlokSayisi');
	const apartmentCountElement = document.getElementById('toplamDaireSayisi');
	if (blockCountElement) blockCountElement.textContent = blockCount;
	if (apartmentCountElement) apartmentCountElement.textContent = apartmentCount;
}

export function updateApartmentList() {
	const container = document.getElementById('daireListesiDetay');
	if (!container) return;
	if (state.blocks.length === 0 || state.selectedApartmentTypes.length === 0) {
		container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 40px;">Blok ve daire tipi seçimi yapın</p>';
		return;
	}
	let html = '<h4>📋 Detaylı Daire Listesi</h4>';
	let totalApartments = 0;
	state.blocks.forEach(block => {
		html += `<div class="block-item"><h5>🏢 Blok ${block.id} (${block.floors} kat)</h5>`;
		Object.entries(block.apartments).forEach(([type, count]) => {
			html += `<div class="result-item"><span class="result-label">${type} Daire:</span><span class="result-value">${count} adet</span></div>`;
			totalApartments += count;
		});
		html += '</div>';
	});
	html += `<div class="success"><strong>📊 Toplam Özet:</strong><br>Toplam Blok: ${state.blocks.length} adet<br>Toplam Daire: ${totalApartments} adet<br>Kullanılan Alan: ${state.projectResults.maxInsaatAlani?.toFixed(0) || 0} m²</div>`;
	container.innerHTML = html;
}

export function updateVisualization() {
	const buildingVisual = document.getElementById('buildingVisual');
	if (!buildingVisual) return;
	if (!state.projectResults.maxInsaatAlani || state.blocks.length === 0) {
		buildingVisual.innerHTML = `<div class="placeholder-content"><div class="placeholder-icon">🏗️</div><p>Hesaplama sonrası<br>yerleşim planı görüntülenecek</p></div>`;
		return;
	}
	const blockCount = state.blocks.length;
	const blockWidth = Math.min(50, 280 / blockCount);
	const blockHeight = 80;
	let svg = `<svg width="100%" height="100%" viewBox="0 0 320 300" style="background: #e6f3ff;"><rect x="10" y="10" width="300" height="220" fill="none" stroke="#2d5016" stroke-width="2" stroke-dasharray="5,5"/><text x="160" y="25" text-anchor="middle" font-size="12" fill="#2d5016" font-weight="bold">📍 Parsel: ${state.projectResults.parselAlani}m²</text>`;
	state.blocks.forEach((block, index) => {
		const x = 30 + (index * (blockWidth + 15));
		const y = 60;
		const floors = block.floors;
		for (let floor = 0; floor < floors; floor++) {
			const floorY = y + (blockHeight - (floor * 12));
			const floorColor = `hsl(${200 + floor * 25}, 70%, ${60 - floor * 3}%)`;
			svg += `<rect x="${x}" y="${floorY}" width="${blockWidth}" height="10" fill="${floorColor}" stroke="#1e40af" stroke-width="0.5"/>`;
			const windowCount = Math.min(4, Math.floor(blockWidth / 8));
			for (let w = 0; w < windowCount; w++) {
				const windowX = x + 3 + (w * (blockWidth / windowCount));
				svg += `<rect x="${windowX}" y="${floorY + 2}" width="4" height="4" fill="#87ceeb" stroke="#4682b4" stroke-width="0.3"/>`;
			}
		}
		svg += `<rect x="${x + blockWidth/2 - 3}" y="${y + blockHeight - 2}" width="6" height="4" fill="#8b4513" stroke="#654321" stroke-width="0.5"/>`;
		svg += `<text x="${x + blockWidth/2}" y="${y + blockHeight + 18}" text-anchor="middle" font-size="12" fill="#1f2937" font-weight="bold">Blok ${block.id}</text>`;
		svg += `<text x="${x + blockWidth/2}" y="${y + blockHeight + 32}" text-anchor="middle" font-size="9" fill="#6b7280">${floors} kat</text>`;
		svg += `<text x="${x + blockWidth/2}" y="${y + blockHeight + 45}" text-anchor="middle" font-size="9" fill="#6b7280">${Math.round(block.totalArea)}m²</text>`;
	});
	svg += `<rect x="20" y="180" width="280" height="35" fill="#90EE90" fill-opacity="0.4" stroke="#228B22" stroke-width="1"/><text x="160" y="200" text-anchor="middle" font-size="11" fill="#228B22" font-weight="bold">🌳 Açık Alan: ${state.projectResults.acikAlan.toFixed(0)}m²</text>`;
	const totalApartments = document.getElementById('toplamDaireSayisi')?.textContent || '0';
	svg += `<text x="20" y="245" font-size="10" fill="#1f2937" font-weight="bold">📊 Toplam: ${state.blocks.length} blok, ${totalApartments} daire</text>`;
	svg += `<text x="20" y="260" font-size="10" fill="#1f2937">🏗️ Max Yükseklik: ${state.projectResults.maxYukseklik}m (Limit: ${state.projectResults.maxYukseklikLimit}m)</text>`;
	svg += `<text x="20" y="275" font-size="10" fill="#1f2937">🏘️ Yapılaşma Oranı: %${state.projectResults.yapilasmaorani.toFixed(1)}</text>`;
	svg += '</svg>';
	buildingVisual.innerHTML = svg;
}

export function updateFloorPlan() {
	const floorPlan = document.getElementById('floorPlan');
	if (!floorPlan) return;
	if (state.selectedApartmentTypes.length === 0) {
		floorPlan.innerHTML = `<div class="placeholder-content"><div class="placeholder-icon">📐</div><p>Daire tipi seçildikten sonra<br>kat planı görüntülenecek</p></div>`;
		return;
	}
	const totalHeight = Math.max(280, state.selectedApartmentTypes.length * 80 + 60);
	let svg = `<svg width="100%" height="100%" viewBox="0 0 320 ${totalHeight}" style="background: #f8f9fa;"><text x="160" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#1f2937">📐 Tipik Kat Planı</text>`;
	let currentY = 40;
	state.selectedApartmentTypes.forEach(apt => {
		const roomCount = apartmentTypes[apt.type]?.rooms || 2;
		let width, height;
		if (apt.area <= 70) { width = 100; height = 60; }
		else if (apt.area <= 100) { width = 120; height = 70; }
		else if (apt.area <= 130) { width = 140; height = 80; }
		else if (apt.area <= 170) { width = 160; height = 90; }
		else { width = 180; height = 100; }
		svg += `<text x="50" y="${currentY - 5}" font-size="12" fill="#1f2937" font-weight="bold">${apt.type} Dairesi (${apt.area}m²)</text>`;
		svg += `<rect x="50" y="${currentY + 5}" width="${width}" height="${height}" fill="#ffffff" stroke="#2d3748" stroke-width="2"/>`;
		const rooms = getRoomLayout(apt.type, roomCount);
		rooms.forEach(room => {
			const roomX = 50 + room.x * width;
			const roomY = currentY + 5 + room.y * height;
			const roomWidth = room.width * width;
			const roomHeight = room.height * height;
			svg += `<rect x="${roomX}" y="${roomY}" width="${roomWidth - 2}" height="${roomHeight - 2}" fill="${room.color}" stroke="#64748b" stroke-width="1"/>`;
			if (roomWidth > 25 && roomHeight > 15) {
				svg += `<text x="${roomX + roomWidth/2}" y="${roomY + roomHeight/2 + 3}" text-anchor="middle" font-size="9" fill="#1e293b" font-weight="500">${room.name}</text>`;
			}
		});
		svg += `<rect x="48" y="${currentY + 5 + height/2 - 4}" width="4" height="8" fill="#8b4513"/>`;
		svg += `<circle cx="46" cy="${currentY + 5 + height/2}" r="2" fill="#d4a574"/>`;
		const windowCount = Math.floor(width / 40);
		for (let w = 0; w < windowCount; w++) {
			const windowX = 50 + 20 + (w * 40);
			svg += `<rect x="${windowX}" y="${currentY + 3}" width="15" height="4" fill="#87ceeb" stroke="#4682b4" stroke-width="0.5"/>`;
		}
		currentY += height + 35;
	});
	svg += '</svg>';
	floorPlan.innerHTML = svg;
}

export function getRoomLayout(apartmentType) {
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

export function showLoading(show) {
	const loading = document.getElementById('loading');
	if (loading) loading.classList.toggle('show', show);
}

export function showError(message) {
	const imarNotlari = document.getElementById('imarNotlari');
	if (imarNotlari) imarNotlari.innerHTML = `<div class="error">❌ ${message}</div>`;
}

export function showSuccessMessage(maxInsaatAlani) {
	const imarNotlari = document.getElementById('imarNotlari');
	if (!imarNotlari) return;
	const current = imarNotlari.innerHTML;
	const suggested = suggestBlockCount(maxInsaatAlani);
	imarNotlari.innerHTML = current + `<div class="success">✅ Hesaplama tamamlandı! ${maxInsaatAlani.toFixed(0)}m² inşaat alanından ${suggested} blok öneriliyor.</div>`;
}

export function showNotification(message, type = 'success') {
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
	if (region) region.textContent = message;
	setTimeout(() => { if (document.body.contains(notification)) document.body.removeChild(notification);}, 3000);
}

export function updateCityRegulations(city) {
	const imarNotlari = document.getElementById('imarNotlari');
	if (!imarNotlari) return;
	if (city && cityRegulations[city]) {
		const regs = cityRegulations[city];
		let html = '<div class="warning"><strong>🏛️ ' + city.toUpperCase() + ' İmar Yönetmeliği:</strong><ul>';
		regs.regulations.forEach(reg => { html += '<li>' + reg + '</li>'; });
		html += '</ul></div>';
		imarNotlari.innerHTML = html;
	} else {
		imarNotlari.innerHTML = '';
	}
}

function suggestBlockCount(totalArea) {
	if (totalArea < 500) return 1;
	if (totalArea < 1200) return 2;
	if (totalArea < 2500) return 3;
	if (totalArea < 4000) return 4;
	return Math.ceil(totalArea / 1000);
}

