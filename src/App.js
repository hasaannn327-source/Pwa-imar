import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useZoningCalculator } from './hooks/useZoningCalculator';

// ---- ETİKET ve RENK SABİTLERİ ----
// Bu sabitler artık App bileşeninin içinde tanımlanabilir veya burada kalabilir.
const inputLabels = {
  plotArea: "Arsa Alanı (m²)", taks: "TAKS (%)", kaks: "KAKS",
  setbackFront: "Ön Bahçe Mesafesi (m)", setbackRear: "Arka Bahçe Mesafesi (m)",
  setbackLeft: "Sol Yan Bahçe Mesafesi (m)", setbackRight: "Sağ Yan Bahçe Mesafesi (m)",
  apt2plus1: "2+1 Daire Sayısı", apt3plus1: "3+1 Daire Sayısı"
};

const resultLabels = {
    maxGroundArea: 'Maksimum Taban Alanı (m²)', totalBuildArea: 'Toplam İnşaat Alanı (m²)',
    floorCount: 'Toplam Kat Sayısı', apartmentCount: 'Toplam Daire Sayısı',
    parkingSpaces: 'Gerekli Otopark Sayısı', buildingHeight: 'Maksimum Blok Yüksekliği (m)',
    fireEscapeRequired: 'Yangın Merdiveni Gerekli mi?'
};

const PIE_CHART_COLORS = ['#ec4899', '#a3e635']; // Pembe (Yapı) ve Yeşil (Açık Alan)


// ---- DAHİLİ BİLEŞENLER ----
// Bu bileşenler, App'in state'lerine doğrudan erişim için App içinde tanımlanmıştır.

const ZoningForm = ({ inputs, handleChange, calculate, saveProject, loadProject }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      {Object.keys(inputs).map((key) => (
        <div key={key}>
          <label htmlFor={key} className="block text-sm font-medium text-white mb-1">
            {inputLabels[key]}
          </label>
          <input id={key} type="number" step="any" placeholder="0" name={key}
                 value={inputs[key]} onChange={handleChange}
                 className="p-3 w-full rounded shadow focus:outline-none focus:ring-2 focus:ring-pink-500" />
        </div>
      ))}
    </div>
    <div className="mb-6 flex justify-center gap-4">
      <button onClick={calculate} className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded shadow-lg transition-colors">Hesapla</button>
      <button onClick={saveProject} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded shadow-lg transition-colors">Kaydet</button>
      <button onClick={loadProject} className="bg-lime-600 hover:bg-lime-700 text-white px-6 py-2 rounded shadow-lg transition-colors">Yükle</button>
    </div>
  </>
);

const ResultsDisplay = ({ results, plotArea }) => {
  const areaData = [
    { name: 'Yapı Oturum Alanı', value: results.maxGroundArea },
    { name: 'Açık & Yeşil Alan', value: Math.max(0, plotArea - results.maxGroundArea) },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2 text-white">Sonuçlar</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <table className="w-full table-auto border border-white bg-white bg-opacity-80 rounded-lg shadow-lg">
          <tbody>
            {Object.entries(results).map(([key, value]) => (
              <tr key={key} className="border-b border-gray-300">
                <td className="px-4 py-2 font-semibold capitalize">{resultLabels[key] || key}</td>
                <td className="px-4 py-2">{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="h-64 bg-white bg-opacity-80 rounded-lg shadow-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={areaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {areaData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(2)} m²`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const BuildingBlocks = ({ blocks }) => (
  <div className="mt-6">
    <h2 className="text-2xl font-semibold mb-2 text-white">Yapı Blokları</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {blocks.map(({ name, floors, apartments }, i) => (
        <div key={i} className="bg-white bg-opacity-70 rounded p-4 shadow-lg">
          <h3 className="text-xl font-semibold mb-2">{name}</h3>
          <div className="flex space-x-4">
            <div>
              <p className="font-semibold mb-1">Kat Sayısı: {floors}</p>
              <div className="space-y-1">
                {Array(floors).fill(0).map((_, idx) => <div key={idx} className="h-8 bg-pink-400 rounded shadow"></div>)}
              </div>
            </div>
            <div>
              <p className="font-semibold mb-1">Daireler: {apartments}</p>
              <div className="flex flex-wrap gap-1">
                {Array(apartments).fill(0).map((_, idx) => <div key={idx} className="w-6 h-6 bg-lime-400 rounded shadow"></div>)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const WarningMessages = ({ warnings }) => {
  if (!warnings.length) return null;
  return (
    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded shadow">
      <ul className="list-disc list-inside">
        {warnings.map((w, i) => <li key={i}>{w}</li>)}
      </ul>
    </div>
  );
};

// ---- ANA APP BİLEŞENİ ----
export default function App() {
  const { 
    inputs, results, warnings, blocks, 
    handleChange, calculate, saveProject, loadProject 
  } = useZoningCalculator();

  return (
    <div className="p-4 max-w-4xl mx-auto font-sans bg-gradient-to-br from-sky-400 via-emerald-300 to-indigo-400 min-h-screen">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold text-white">İmar Hesaplama Aracı</h1>
        <p className="text-white/80">Projenizin potansiyelini keşfedin</p>
      </header>

      <main className="bg-black bg-opacity-10 p-6 rounded-xl shadow-2xl">
        <ZoningForm 
          inputs={inputs}
          handleChange={handleChange}
          calculate={calculate}
          saveProject={saveProject}
          loadProject={loadProject}
        />
        
        <WarningMessages warnings={warnings} />

        {results && (
          <>
            <ResultsDisplay results={results} plotArea={parseFloat(inputs.plotArea) || 0} />
            <BuildingBlocks blocks={blocks} />
          </>
        )}
      </main>

      {/* PWA Kurulum Butonu mantığı basitliği için şimdilik kaldırıldı,
          gerekirse usePWAInstall hook'u tekrar import edilip eklenebilir. */}
    </div>
  );
        }
