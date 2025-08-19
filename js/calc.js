// Hesaplama yardımcıları

export function suggestBlockCount(totalArea) {
	if (totalArea < 500) return 1;
	if (totalArea < 1200) return 2;
	if (totalArea < 2500) return 3;
	if (totalArea < 4000) return 4;
	return Math.ceil(totalArea / 1000);
}

