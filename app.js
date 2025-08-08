function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.getAttribute('data-theme') === 'dark';
  root.setAttribute('data-theme', isDark ? 'light' : 'dark');
}

function calculate() {
  const area = parseFloat(document.getElementById('plotArea').value);
  const taks = parseFloat(document.getElementById('taks').value);
  const kaks = parseFloat(document.getElementById('kaks').value);
  const setback = parseFloat(document.getElementById('setback').value);
  const floors = parseInt(document.getElementById('floors').value);
  const apartmentArea = parseFloat(document.getElementById('apartmentArea').value);

  if ([area, taks, kaks, setback, floors, apartmentArea].some(isNaN)) {
    document.getElementById('result').innerText = "Lütfen tüm değerleri doldurun.";
    return;
  }

  const netBuildArea = area - setback;
  const maxBaseArea = area * taks;
  const maxTotalConstructionArea = area * kaks;
  const maxUnits = Math.floor(maxTotalConstructionArea / apartmentArea);
  const unitsPerFloor = Math.floor(maxUnits / floors);

  const summary = `
▪ Net Arsa Alanı: ${netBuildArea.toFixed(2)} m²
▪ Maks. Taban Alanı (TAKS): ${maxBaseArea.toFixed(2)} m²
▪ Maks. İnşaat Alanı (KAKS): ${maxTotalConstructionArea.toFixed(2)} m²
▪ Kat Sayısı: ${floors}
▪ Daire Sayısı: ${maxUnits}
▪ Kat Başına: ${unitsPerFloor} daire
  `;

  document.getElementById('result').innerText = summary;

  const container = document.getElementById('building3d');
  container.innerHTML = "";
  for (let i = 0; i < floors; i++) {
    const floor = document.createElement('div');
    floor.className = 'floor-box';
    container.appendChild(floor);
  }
}
