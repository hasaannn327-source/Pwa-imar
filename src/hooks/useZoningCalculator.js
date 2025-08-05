// src/hooks/useZoningCalculator.js

import { useState, useEffect } from 'react';
import { 
  MAX_BUILDING_HEIGHT, 
  FLOOR_HEIGHT, 
  MAX_FLOORS_PER_BLOCK, 
  PARKING_SPACES_PER_2_PLUS_1,
  PARKING_SPACES_PER_3_PLUS_1,
  LOCAL_STORAGE_KEY
} from '../constants';

const initialInputs = {
  plotArea: "",
  taks: "",
  kaks: "",
  setbackFront: "",
  setbackRear: "",
  setbackLeft: "",
  setbackRight: "",
  apt2plus1: "",
  apt3plus1: ""
};

export function useZoningCalculator() {
  const [inputs, setInputs] = useState(initialInputs);
  const [results, setResults] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [blocks, setBlocks] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prevInputs) => ({ ...prevInputs, [name]: value }));
  };
  
  const validateInputs = () => {
    return Object.values(inputs).every(val => val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0));
  };

  const calculateBlocks = (floorCount, totalApartments) => {
    const apartmentsPerFloor = Math.ceil(totalApartments / floorCount) || 1;
    let remainingApartments = totalApartments;
    let blocksArr = [];
    let blockIndex = 0;
    let remainingFloors = floorCount;

    while (remainingFloors > 0) {
      const floorsInThisBlock = Math.min(remainingFloors, MAX_FLOORS_PER_BLOCK);
      const apartmentsInThisBlock = Math.min(remainingApartments, apartmentsPerFloor * floorsInThisBlock);
      
      blocksArr.push({
        name: `Blok ${String.fromCharCode(65 + blockIndex)}`,
        floors: floorsInThisBlock,
        apartments: apartmentsInThisBlock,
      });
      
      remainingApartments -= apartmentsInThisBlock;
      remainingFloors -= floorsInThisBlock;
      blockIndex++;
    }
    return blocksArr;
  };
  
  const checkPlanRules = (apt2, apt3, buildingHeight, parkingSpaces) => {
    const warningsLocal = [];
    
    let requiredParking = 0;
    requiredParking += Math.ceil(apt2 / PARKING_SPACES_PER_2_PLUS_1);
    requiredParking += Math.ceil(apt3 / PARKING_SPACES_PER_3_PLUS_1);

    if (parkingSpaces < requiredParking) {
      warningsLocal.push(`Eksik otopark: Plan gereği en az ${requiredParking} otopark yeri olmalıdır. Mevcut: ${parkingSpaces}`);
    }

    if (buildingHeight > MAX_BUILDING_HEIGHT) {
      warningsLocal.push(`Bina yüksekliği (${buildingHeight}m) yasal sınırı (${MAX_BUILDING_HEIGHT}m) aşıyor. Bloklara bölünecek.`);
    }

    return warningsLocal;
  };

  const calculate = () => {
    if (!validateInputs()) {
      alert("Lütfen tüm alanlara geçerli pozitif sayılar girin.");
      return;
    }

    const plotArea = parseFloat(inputs.plotArea) || 0;
    const taks = parseFloat(inputs.taks) / 100 || 0;
    const kaks = parseFloat(inputs.kaks) || 0;
    const apt2 = parseInt(inputs.apt2plus1) || 0;
    const apt3 = parseInt(inputs.apt3plus1) || 0;

    if (plotArea === 0 || kaks === 0 || taks === 0) {
      setWarnings(["Hesaplama için Arsa Alanı, TAKS ve KAKS gereklidir."]);
      setResults(null);
      setBlocks([]);
      return;
    }

    const maxGroundArea = plotArea * taks;
    const totalBuildArea = plotArea * kaks;
    let floorCount = Math.ceil(totalBuildArea / maxGroundArea);
    const apartmentCount = apt2 + apt3;
    const parkingSpaces = apt2 + apt3; // Her daireye 1 otopark varsayımı (daha gerçekçi)

    let buildingHeight = floorCount * FLOOR_HEIGHT;
    
    let warningsLocal = checkPlanRules(apt2, apt3, buildingHeight, parkingSpaces);
    
    const blocksArr = calculateBlocks(floorCount, apartmentCount);
    setBlocks(blocksArr);

    setResults({
      maxGroundArea,
      totalBuildArea,
      floorCount: blocksArr.reduce((sum, block) => sum + block.floors, 0),
      apartmentCount,
      parkingSpaces,
      buildingHeight: blocksArr[0]?.floors * FLOOR_HEIGHT || 0, // En yüksek bloğun yüksekliği
      fireEscapeRequired: blocksArr.some(b => b.floors * FLOOR_HEIGHT > MAX_BUILDING_HEIGHT),
    });
    setWarnings(warningsLocal);
  };
  
  const saveProject = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inputs));
    alert("Proje başarıyla kaydedildi.");
  };

  const loadProject = () => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      setInputs(JSON.parse(savedData));
    }
  };
  
  useEffect(() => {
    loadProject();
  }, []);

  return { inputs, results, warnings, blocks, handleChange, calculate, saveProject, loadProject };
      }
