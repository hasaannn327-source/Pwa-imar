
import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function App() {
  const [inputs, setInputs] = useState({
    plotArea: "",
    taks: "",
    kaks: "",
    setbackFront: "",
    setbackRear: "",
    setbackLeft: "",
    setbackRight: "",
    apt2plus1: "",
    apt3plus1: ""
  });
  const [results, setResults] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [blocks, setBlocks] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: value });
  };

  const validateInputs = () => {
    const vals = Object.values(inputs);
    return vals.every(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0);
  };

  function checkPlanRules({ apt2, apt3, buildingHeight, parkingSpaces }) {
    const warningsLocal = [];
    const totalFlats = apt2 + apt3;

    // Ortalama büyüklük varsayımı
    // 2+1: 90 m2, 3+1: 120 m2
    // Otopark ihtiyacı örnek hesaplama:
    let requiredParking = 0;
    requiredParking += Math.floor(apt2 / 3); // her 3 daire için 1 park
    requiredParking += Math.floor(apt3 / 2); // her 2 daire için 1 park

    if (parkingSpaces < requiredParking) {
      warningsLocal.push(`Eksik otopark: plan gereği en az ${requiredParking} park yeri olmalıdır.`);
    }

    if (buildingHeight > 12.5) {
      warningsLocal.push(`Kat yüksekliği sınırını aştınız (maks 12.5 m).`);
    }

    return warningsLocal;
  }

  // Yeni bloklara bölen fonksiyon
  function calculateBlocks(floorCount, apt2, apt3) {
    const maxFloors = 4; // Kat yüksekliği sınırı max 4 kat
    const totalApartments = apt2 + apt3;
    const apartmentsPerFloor = Math.ceil(totalApartments / floorCount || 1);
    let remainingApartments = totalApartments;
    let blocksArr = [];
    let blockIndex = 0;

    // Kat sayısı sınırı aşarsa blok sayısı artar
    while (floorCount > maxFloors) {
      blocksArr.push({
        name: `Blok ${String.fromCharCode(65 + blockIndex)}`,
        floors: maxFloors,
        apartments: Math.min(remainingApartments, apartmentsPerFloor * maxFloors),
      });
      remainingApartments -= apartmentsPerFloor * maxFloors;
      floorCount -= maxFloors;
      blockIndex++;
    }
    if (floorCount > 0) {
      blocksArr.push({
        name: `Blok ${String.fromCharCode(65 + blockIndex)}`,
        floors: floorCount,
        apartments: remainingApartments,
      });
    }
    return blocksArr;
  }

  const calculate = () => {
    if (!validateInputs()) {
      alert("Please enter valid non-negative numeric values for all fields.");
      return;
    }

    const plotArea = parseFloat(inputs.plotArea);
    const taks = parseFloat(inputs.taks) / 100;
    const kaks = parseFloat(inputs.kaks);
    const apt2 = parseInt(inputs.apt2plus1) || 0;
    const apt3 = parseInt(inputs.apt3plus1) || 0;

    const maxGroundArea = plotArea * taks;
    const totalBuildArea = plotArea * kaks;
    let floorCount = Math.ceil(totalBuildArea / maxGroundArea);
    const apartmentCount = apt2 + apt3;
    const parkingSpaces = Math.ceil(apartmentCount * 1.2);
    let buildingHeight = floorCount * 3;

    let warningsLocal = checkPlanRules({ apt2, apt3, buildingHeight, parkingSpaces });

    // Kat yüksekliği sınırı kontrolü ve bloklara bölme
    if (buildingHeight > 12.5) {
      // Maks kat sayısı 4
      floorCount = Math.min(floorCount, 4);
      buildingHeight = floorCount * 3;
    }

    // Bloklara ayır
    const blocksArr = calculateBlocks(floorCount, apt2, apt3);
    setBlocks(blocksArr);

    setResults({
      maxGroundArea,
      totalBuildArea,
      floorCount,
      apartmentCount,
      parkingSpaces,
      buildingHeight,
      fireEscape: floorCount > 4,
    });
    setWarnings(warningsLocal);
  };

  const saveProject = () => {
    localStorage.setItem("zoningProject", JSON.stringify(inputs));
    alert("Project saved.");
  };

  const loadProject = () => {
    const saved = localStorage.getItem("zoningProject");
    if (saved) setInputs(JSON.parse(saved));
  };

  useEffect(() => {
    loadProject();
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").catch(console.error);
      });
    }

    let deferredPrompt;
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const btn = document.getElementById("a2hs-btn");
      if (btn) btn.style.display = "block";

      btn.addEventListener("click", () => {
        btn.style.display = "none";
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === "accepted") {
            console.log("A2HS accepted");
          }
          deferredPrompt = null;
        });
      });
    });
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto font-sans bg-gradient-to-br from-sky-400 via-emerald-300 to-indigo-400 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-white text-center">Zoning Calculator</h1>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {Object.keys(inputs).map((key) => (
          <input
            key={key}
            type="number"
            step="any"
            placeholder={key}
            name={key}
            value={inputs[key]}
            onChange={handleChange}
            className="p-3 rounded shadow focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        ))}
      </div>

      <div className="mb-4 flex justify-center gap-4">
        <button onClick={calculate} className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded shadow-lg">
          Calculate
        </button>
        <button onClick={saveProject} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded shadow-lg">
          Save
        </button>
        <button onClick={loadProject} className="bg-lime-600 hover:bg-lime-700 text-white px-6 py-2 rounded shadow-lg">
          Load
        </button>
      </div>

      {warnings.length > 0 && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded shadow">
          <ul className="list-disc list-inside">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {results && (
        <div>
          <h2 className="text-2xl font-semibold mb-2 text-white">Results</h2>
          <table className="w-full table-auto border border-white mb-4 bg-white bg-opacity-80 rounded-lg shadow-lg">
            <tbody>
              {Object.entries(results).map(([key, value]) => (
                <tr key={key} className="border-b border-gray-300">
                  <td className="px-4 py-2 font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</td>
                  <td className="px-4 py-2">{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(results).map(([k, v]) => ({ name: k, value: Number(v) }))}>
                <XAxis dataKey="name" stroke="#374151" />
                <YAxis stroke="#374151" />
                <Tooltip />
                <Bar dataKey="value" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {blocks.map(({ name, floors, apartments }, i) => (
              <div key={i} className="bg-white bg-opacity-70 rounded p-4 shadow-lg">
                <h3 className="text-xl font-semibold mb-2">{name}</h3>
                <div className="flex space-x-4">
                  <div>
                    <p className="font-semibold mb-1">Kat Sayısı: {floors}</p>
                    <div className="space-y-1">
                      {Array(floors).fill(0).map((_, idx) => (
                        <div key={idx} className="h-8 bg-pink-400 rounded shadow"></div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Daireler: {apartments}</p>
                    <div className="flex flex-wrap gap-1">
                      {Array(apartments).fill(0).map((_, idx) => (
                        <div key={idx} className="w-6 h-6 bg-lime-400 rounded shadow"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        id="a2hs-btn"
        style={{ display: "none" }}
        className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded shadow-lg z-50"
      >
        Ana Ekrana Ekle
      </button>
    </div>
  );
}
