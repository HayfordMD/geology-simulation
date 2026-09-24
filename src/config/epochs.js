// Geological Eras and Eons

export const EPOCHS = [
  {
    id: 'hadean',
    name: 'Hadean Eon',
    ageRange: [4540, 4000], // Millions of years ago (Ma)
    durationYears: 540_000_000,
    themeColor: '#ff4500',
    skyColor: '#3d1607',
    ambientColor: '#ffaa66',
    oceanLevel: -0.10, // Primordial degassing, localized basins
    volcanismMultiplier: 3.5,
    erosionMultiplier: 0.4,
    seismicMultiplier: 2.5,
    geothermalBase: 50,
    description: 'Primordial planetary accretion. Magma oceans cool into the first proto-crust under heavy asteroid bombardment.',
    dominantMinerals: ['basalt', 'obsidian', 'uranium'],
    milestone: 'Formation of the Earth\'s Solid Lithosphere'
  },
  {
    id: 'archean',
    name: 'Archean Eon',
    ageRange: [4000, 2500],
    durationYears: 1500_000_000,
    themeColor: '#ff8c00',
    skyColor: '#1c2826',
    ambientColor: '#ffe0b2',
    oceanLevel: -0.02, // Stable primordial oceans; cratons emerge
    volcanismMultiplier: 2.2,
    erosionMultiplier: 0.9,
    seismicMultiplier: 1.8,
    geothermalBase: 35,
    description: 'First stable continental cratons form. Hydrothermal vents precipitate gold and vast Banded Iron Formations.',
    dominantMinerals: ['iron_ore', 'granite', 'quartz', 'basalt'],
    milestone: 'Cratonic Stabilization & Banded Iron Precipitates'
  },
  {
    id: 'proterozoic',
    name: 'Proterozoic Eon',
    ageRange: [2500, 541],
    durationYears: 1959_000_000,
    themeColor: '#48cae4',
    skyColor: '#0c2233',
    ambientColor: '#e0f7fa',
    oceanLevel: 0.00, // Stable supercontinent Rodinia with shallow shelf margins
    volcanismMultiplier: 1.4,
    erosionMultiplier: 1.2,
    seismicMultiplier: 1.4,
    geothermalBase: 25,
    description: 'Supercontinent Rodinia forms and breaks. Oxygenation triggers vast limestone and marble metamorphic belts.',
    dominantMinerals: ['limestone', 'marble', 'sandstone', 'lithium'],
    milestone: 'Supercontinent Cycle & Carbonate Platforms'
  },
  {
    id: 'paleozoic',
    name: 'Paleozoic Era',
    ageRange: [541, 252],
    durationYears: 289_000_000,
    themeColor: '#52b788',
    skyColor: '#10281b',
    ambientColor: '#d8f3dc',
    oceanLevel: 0.02, // Epicontinental shallow seas across coastal margins
    volcanismMultiplier: 1.1,
    erosionMultiplier: 1.4,
    seismicMultiplier: 1.3,
    geothermalBase: 20,
    description: 'Vast swamp forests deposit thick coal beds. Major continental collisions build the Appalachian and Ural mountain ranges.',
    dominantMinerals: ['coal', 'shale', 'sandstone', 'quartz'],
    milestone: 'Carboniferous Coal Measures & Orogenesis'
  },
  {
    id: 'mesozoic',
    name: 'Mesozoic Era',
    ageRange: [252, 66],
    durationYears: 186_000_000,
    themeColor: '#90e0ef',
    skyColor: '#122c34',
    ambientColor: '#caf0f8',
    oceanLevel: 0.035, // Warm greenhouse transgression with inland seaways
    volcanismMultiplier: 1.3,
    erosionMultiplier: 1.3,
    seismicMultiplier: 1.6,
    geothermalBase: 18,
    description: 'Pangaea supercontinent rifts apart. Intense subduction along the Pacific Rim generates Kimberlite diamond pipes and porphyry gold.',
    dominantMinerals: ['diamond', 'gold', 'basalt', 'limestone'],
    milestone: 'Atlantic Rifting & Kimberlite Diamond Emplacement'
  },
  {
    id: 'cenozoic',
    name: 'Cenozoic Era',
    ageRange: [66, 0],
    durationYears: 66_000_000,
    themeColor: '#0077b6',
    skyColor: '#0d1b2a',
    ambientColor: '#e0e1dd',
    oceanLevel: 0.00, // Modern icehouse glaciations, exposed coastal plains
    volcanismMultiplier: 1.0,
    erosionMultiplier: 1.5,
    seismicMultiplier: 1.5,
    geothermalBase: 15,
    description: 'Colossal collision of India and Eurasia forms the Himalayas. Active transform faults generate regular major quakes.',
    dominantMinerals: ['gneiss', 'marble', 'lithium', 'granite'],
    milestone: 'Himalayan Ultra-Orogeny & Modern Fault Belts'
  },
  {
    id: 'future',
    name: 'Planetary Engineering Epoch',
    ageRange: [0, -100],
    durationYears: 100_000_000,
    themeColor: '#9d4edd',
    skyColor: '#1b092b',
    ambientColor: '#f3e8ff',
    oceanLevel: 0.01,
    volcanismMultiplier: 0.8,
    erosionMultiplier: 1.0,
    seismicMultiplier: 1.0,
    geothermalBase: 40,
    description: 'Civilization taps tectonic strain to power planetary generators and mines deep lithospheric mineral treasures.',
    dominantMinerals: ['diamond', 'lithium', 'uranium', 'gold'],
    milestone: 'Total Tectonic Energy Harnessing'
  }
];

export function getEpochByAge(ageInMillionsYears) {
  for (let i = 0; i < EPOCHS.length; i++) {
    const epoch = EPOCHS[i];
    if (ageInMillionsYears <= epoch.ageRange[0] && ageInMillionsYears > epoch.ageRange[1]) {
      return epoch;
    }
  }
  return EPOCHS[EPOCHS.length - 1];
}
