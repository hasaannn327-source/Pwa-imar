import { state, cityRegulations } from './state.js';
import { updateCityRegulations, displaySelectedApartments, updateFloorPlan, showLoading, showError, updateResultsUI, updateBlockCounters, updateBlockDisplay, updateApartmentList, updateVisualization, showNotification } from './ui.js';

export function setupEventListeners() {
	const sehirSelect = document.getElementById('sehir');
	if (sehirSelect) {
		sehirSelect.addEventListener('change', function() { updateCityRegulations(this.value); });
	}
	const imarSelect = document.getElementById('imarDurumu');
	if (imarSelect) {
		imarSelect.addEventListener('change', function() { updateZoningCoefficients(this.value); });
	}
	const form = document.getElementById('calculatorForm');
	if (form) {
		form.addEventListener('submit', function(e) { e.preventDefault(); handleFormSubmit(); });
	}
	document.querySelectorAll('.apartment-type').forEach(type => {
		type.addEventListener('click', function() { this.classList.toggle('selected'); updateSelectedApartments(); });
	});
	document.querySelectorAll('.tab').forEach(tab => {
		tab.addEventListener('click', function() { const tabName = this.getAttribute('data-tab'); switchTab(tabName, this); });
		tab.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const tabName = this.getAttribute('data-tab'); switchTab(tabName, this); } });
	});
	const addBlockBtn = document.querySelector('.add-block');
	const removeBlockBtn = document.querySelector('.remove-block');
	if (addBlockBtn) addBlockBtn.addEventListener('click', addBlock);
	if (removeBlockBtn) removeBlockBtn.addEventListener('click', removeBlock);
}

export function updateZoningCoefficients(zoning) {
	const city = document.getElementById('sehir').value;
	const tabanInput = document.getElementById('taban');
	const emsalInput = document.getElementById('emsal');
	if (!tabanInput || !emsalInput) return;
	if (city && cityRegulations[city] && zoning.startsWith('konut-')) {
		const level = zoning.split('-')[1];
		tabanInput.value = cityRegulations[city].konutTaks[level] || 0.30;
		emsalInput.value = cityRegulations[city].konutEmsal[level] || 1.00;
	} else {
		switch(zoning) {
			case 'konut-1': tabanInput.value = '0.30'; emsalInput.value = '1.00'; break;
			case 'konut-2': tabanInput.value = '0.35'; emsalInput.value = '1.50'; break;
			case 'konut-3': tabanInput.value = '0.40'; emsalInput.value = '2.00'; break;
			case 'ticaret': tabanInput.value = '0.60'; emsalInput.value = '2.50'; break;
			case 'karma': tabanInput.value = '0.45'; emsalInput.value = '1.80'; break;
			case 'turizm': tabanInput.value = '0.25'; emsalInput.value = '1.20'; break;
		}
	}
}

export function handleFormSubmit() {
	if (!validateForm()) return;
	showLoading(true);
	setTimeout(() => {
		performCalculation();
		showLoading(false);
	}, 500);
}

function validateForm() {
	let isValid = true;
	const required = [ { id: 'sehir' }, { id: 'parselAlani' }, { id: 'imarDurumu' } ];
	required.forEach(f => {
		const el = document.getElementById(f.id);
		if (!el) return;
		const v = el.value.trim();
		if (!v || (f.id === 'parselAlani' && parseFloat(v) <= 0)) {
			el.style.borderColor = '#ef4444';
			isValid = false;
		} else {
			el.style.borderColor = '#e5e7eb';
		}
	});
	if (!isValid) showError('Lütfen tüm zorunlu alanları doldurun!');
	return isValid;
}

export function updateSelectedApartments() {
	state.selectedApartmentTypes = [];
	document.querySelectorAll('.apartment-type.selected').forEach(type => {
		state.selectedApartmentTypes.push({ type: type.dataset.type, area: parseInt(type.dataset.area) });
	});
	displaySelectedApartments();
	updateFloorPlan();
	calculateAndRenderBlocks();
}

export function addBlock() {
	const block = { id: state.blocks.length + 1, floors: 4, apartments: {}, totalArea: 0 };
	state.blocks.push(block);
	calculateAndRenderBlocks();
}

export function removeBlock() {
	if (state.blocks.length > 0) {
		state.blocks.pop();
		calculateAndRenderBlocks();
	}
}

export function updateBlockFloors(blockIndex, floors) {
	if (state.blocks[blockIndex]) {
		state.blocks[blockIndex].floors = parseInt(floors) || 1;
		calculateAndRenderBlocks();
	}
}

export function switchTab(tabName, triggerEl) {
	document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
	document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
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

export function performCalculation() {
	const city = document.getElementById('sehir').value;
	const parselAlani = parseFloat(document.getElementById('parselAlani').value);
	const taban = parseFloat(document.getElementById('taban').value);
	const emsal = parseFloat(document.getElementById('emsal').value);
	const katYuksekligi = parseFloat(document.getElementById('katYuksekligi').value);
	const maxYukseklikLimit = (city && cityRegulations[city]) ? cityRegulations[city].maxHeight : 12.5;
	const maxTabanAlani = parselAlani * taban;
	const maxInsaatAlani = parselAlani * emsal;
	let maxKatSayisi = Math.ceil(emsal / taban);
	const maxKatSayisiYukseklikIle = Math.floor(maxYukseklikLimit / katYuksekligi);
	maxKatSayisi = Math.min(maxKatSayisi, maxKatSayisiYukseklikIle);
	const maxYukseklik = maxKatSayisi * katYuksekligi;
	const acikAlan = parselAlani - maxTabanAlani;
	const yapilasmaorani = (emsal * 100);
	state.projectResults = { parselAlani, maxTabanAlani, maxInsaatAlani, maxKatSayisi, maxYukseklik, acikAlan, yapilasmaorani, city, maxYukseklikLimit };
	updateResultsUI();
	autoCalculateBlocks();
	updateVisualization();
	updateFloorPlan();
	showNotification(`Hesaplama tamamlandı!`, 'success');
}

function autoCalculateBlocks() {
	if (!state.projectResults.maxInsaatAlani) return;
	state.blocks = [];
	const count = suggestBlockCount(state.projectResults.maxInsaatAlani);
	for (let i = 0; i < count; i++) {
		state.blocks.push({ id: i + 1, floors: Math.min(state.projectResults.maxKatSayisi, 5), apartments: {}, totalArea: 0 });
	}
	calculateAndRenderBlocks();
}

function suggestBlockCount(totalArea) {
	if (totalArea < 500) return 1;
	if (totalArea < 1200) return 2;
	if (totalArea < 2500) return 3;
	if (totalArea < 4000) return 4;
	return Math.ceil(totalArea / 1000);
}

function calculateAndRenderBlocks() {
	if (!state.projectResults.maxInsaatAlani || state.blocks.length === 0) {
		updateBlockCounters(0, 0);
		updateBlockDisplay();
		updateApartmentList();
		updateVisualization();
		return;
	}
	const totalFloors = state.blocks.reduce((sum, block) => sum + block.floors, 0);
	const areaPerFloor = totalFloors > 0 ? state.projectResults.maxInsaatAlani / totalFloors : 0;
	let totalApartments = 0;
	state.blocks.forEach(block => {
		block.totalArea = block.floors * areaPerFloor;
		block.apartments = {};
		if (state.selectedApartmentTypes.length > 0) {
			state.selectedApartmentTypes.forEach(aptType => {
				const count = Math.floor(block.totalArea / aptType.area / state.selectedApartmentTypes.length);
				if (count > 0) {
					block.apartments[aptType.type] = count;
					totalApartments += count;
				}
			});
		}
	});
	updateBlockCounters(state.blocks.length, totalApartments);
	updateBlockDisplay();
	updateApartmentList();
	updateVisualization();
}

export function debugApp() {
	console.log('=== Debug ===');
	console.log('State:', state);
}

