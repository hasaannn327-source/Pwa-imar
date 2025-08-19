// Uygulama durumu ve sabitler

export const state = {
	blocks: [],
	selectedApartmentTypes: [],
	projectResults: {}
};

// Şehir bazlı imar yönetmelikleri
export const cityRegulations = {
	'istanbul': {
		maxHeight: 12.5,
		regulations: ['Deprem yönetmeliği uygulanır', 'Bodrum kat sayılmaz', 'Çatı katı %50 oranında yapılabilir'],
		konutTaks: { '1': 0.30, '2': 0.35, '3': 0.40 },
		konutEmsal: { '1': 1.0, '2': 1.5, '3': 2.0 }
	},
	'ankara': {
		maxHeight: 15.0,
		regulations: ['Kar yükü hesaplanmalı', 'Isı yalıtımı zorunlu', 'Güneş paneli teşvik edilir'],
		konutTaks: { '1': 0.35, '2': 0.40, '3': 0.45 },
		konutEmsal: { '1': 1.2, '2': 1.8, '3': 2.2 }
	},
	'izmir': {
		maxHeight: 12.0,
		regulations: ['Rüzgar yükü önemli', 'Deniz seviyesi kontrolü', 'Tuz korozyonu önlemi'],
		konutTaks: { '1': 0.25, '2': 0.30, '3': 0.35 },
		konutEmsal: { '1': 0.8, '2': 1.2, '3': 1.6 }
	},
	'antalya': {
		maxHeight: 10.0,
		regulations: ['Turizm bölgesi kısıtlamaları', 'Manzara koruma', 'Yangın güvenliği önemli'],
		konutTaks: { '1': 0.20, '2': 0.25, '3': 0.30 },
		konutEmsal: { '1': 0.6, '2': 1.0, '3': 1.4 }
	},
	'bursa': {
		maxHeight: 13.0,
		regulations: ['Sanayi bölgesi yakınlığı', 'Hava kalitesi kontrolü', 'Yeşil alan oranı %25'],
		konutTaks: { '1': 0.32, '2': 0.38, '3': 0.42 },
		konutEmsal: { '1': 1.1, '2': 1.6, '3': 2.1 }
	},
	'diger': {
		maxHeight: 12.5,
		regulations: ['Genel imar yönetmeliği uygulanır', 'Yerel idareden onay gerekli'],
		konutTaks: { '1': 0.30, '2': 0.35, '3': 0.40 },
		konutEmsal: { '1': 1.0, '2': 1.5, '3': 2.0 }
	}
};

// Daire tipleri
export const apartmentTypes = {
	'1+1': { area: 65, rooms: 2 },
	'2+1': { area: 95, rooms: 3 },
	'3+1': { area: 125, rooms: 4 },
	'4+1': { area: 160, rooms: 5 },
	'dubleks': { area: 200, rooms: 6 }
};

