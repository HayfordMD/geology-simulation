// Idle Facilities and Research Tree Config

export const FACILITIES = [
  {
    id: 'seismograph_network',
    name: 'Seismograph Array',
    icon: '📡',
    description: 'Ultra-sensitive broadband seismometers that detect crustal tremors and harvest acoustic seismic energy.',
    baseCost: { money: 100, seismic: 0 },
    costMultiplier: 1.15,
    baseYield: { seismic: 2.5, research: 0.5 }, // per sec
    level: 0
  },
  {
    id: 'geothermal_well',
    name: 'Geothermal Borehole',
    icon: '♨️',
    description: 'Drills deep into magma-adjacent hot dry rock to convert subterranean thermal heat into clean Geothermal Watts.',
    baseCost: { money: 450, seismic: 50 },
    costMultiplier: 1.18,
    baseYield: { geothermal: 3.0, money: 4 },
    level: 0
  },
  {
    id: 'deep_core_drill',
    name: 'Automated Core Rig',
    icon: '🏗️',
    description: 'Continuous sonic rotary drill that probes sedimentary basins and fault shears for valuable mineral veins.',
    baseCost: { money: 1500, geothermal: 100 },
    costMultiplier: 1.22,
    baseYield: { money: 18, research: 2.0 },
    level: 0
  },
  {
    id: 'rift_harvester',
    name: 'Hydrothermal Seafloor Tap',
    icon: '🌊',
    description: 'Submersible drone station anchored at divergent plate boundaries, capturing gold, lithium, and black smoker minerals.',
    baseCost: { money: 6000, seismic: 400, geothermal: 300 },
    costMultiplier: 1.25,
    baseYield: { money: 65, geothermal: 15, research: 5 },
    level: 0
  },
  {
    id: 'subduction_press',
    name: 'Subduction Tectonic Anchor',
    icon: '⚙️',
    description: 'Harnesses millions of gigapascals at convergent plate boundaries to catalyze metamorphic gemstone crystallization.',
    baseCost: { money: 25000, seismic: 1500, research: 500 },
    costMultiplier: 1.28,
    baseYield: { money: 240, seismic: 45, research: 15 },
    level: 0
  },
  {
    id: 'mantle_tap',
    name: 'Moho Mantle Plume Tap',
    icon: '🌋',
    description: 'Ultra-deep carbon-nanotube lined conduit breaching the Mohorovičić discontinuity directly into the asthenosphere.',
    baseCost: { money: 100000, geothermal: 5000, research: 2500 },
    costMultiplier: 1.32,
    baseYield: { geothermal: 250, money: 800, research: 50 },
    level: 0
  }
];

export const RESEARCH_TECH = [
  {
    id: 'piezoelectric_harvesting',
    name: 'Piezoelectric Crustal Grid',
    icon: '⚡',
    cost: { research: 50, money: 500 },
    effect: 'Seismic energy from fault ruptures and quakes is increased by +100%.',
    apply: (state) => { state.multipliers.seismicHarvest *= 2.0; },
    purchased: false
  },
  {
    id: 'stratigraphic_spectrometry',
    name: 'Stratigraphic Laser Scanner',
    icon: '🔬',
    cost: { research: 120, money: 1200 },
    effect: 'Core drill sample prospecting yields +150% more Research Points and uncovers deeper veins.',
    apply: (state) => { state.multipliers.prospectResearch *= 2.5; },
    purchased: false
  },
  {
    id: 'hydrothermal_leaching',
    name: 'Hydrothermal Leaching',
    icon: '🧪',
    cost: { research: 350, geothermal: 200 },
    effect: 'Volcanic hotspots and divergent rifts form +80% richer Gold and Lithium veins.',
    apply: (state) => { state.multipliers.preciousVeinYield *= 1.8; },
    purchased: false
  },
  {
    id: 'lithostatic_catalyst',
    name: 'Lithostatic Compression Catalyst',
    icon: '💎',
    cost: { research: 800, seismic: 1000 },
    effect: 'Metamorphic zones have +200% higher chance to crystallize Kimberlite Diamonds and Marble.',
    apply: (state) => { state.multipliers.metamorphicYield *= 3.0; },
    purchased: false
  },
  {
    id: 'auto_fault_vent',
    name: 'Automated Fault Strain Venting',
    icon: '🛡️',
    cost: { research: 2000, money: 20000 },
    effect: 'Automates fault relief when stress exceeds 90%, triggering controlled micro-quakes and auto-harvesting.',
    apply: (state) => { state.autoVentFaults = true; },
    purchased: false
  },
  {
    id: 'radiogenic_amplification',
    name: 'Radiogenic Mantle Resonance',
    icon: '☢️',
    cost: { research: 5000, geothermal: 3000 },
    effect: 'All Geothermal Watts output multiplied by 3x and unlocks Uranium extraction from deep core drills.',
    apply: (state) => { state.multipliers.geothermalMultiplier *= 3.0; state.uraniumUnlocked = true; },
    purchased: false
  }
];
