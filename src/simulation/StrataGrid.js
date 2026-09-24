import { MINERALS } from '../config/minerals.js';

export class StrataGrid {
  constructor(width = 64, height = 32) {
    this.width = width;
    this.height = height;
    this.cells = new Array(width * height);
    this.maxContinentalElevation = 0.85; // Isostatic peak limit (~8,500m)
    this.seaLevel = -0.10; // Synchronized eustatic ocean level
    this.initGrid();
  }

  setSeaLevel(level) {
    this.seaLevel = level;
  }

  getIndex(x, y) {
    const wx = ((x % this.width) + this.width) % this.width;
    const wy = Math.max(0, Math.min(this.height - 1, y));
    return wy * this.width + wx;
  }

  initGrid() {
    for (let y = 0; y < this.height; y++) {
      const latNormalized = (y / (this.height - 1)) * 2 - 1; // -1 to +1
      const latAbs = Math.abs(latNormalized);

      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        const lon = (x / this.width) * Math.PI * 2;

        // Bimodal hypsometric continents: distinct buoyant cratonic platforms and abyssal basins
        const c1 = Math.sin(lon * 2) * Math.cos(latNormalized * Math.PI) * 0.55;
        const c2 = Math.cos(lon * 3 + 1.2) * Math.cos(latNormalized * 2) * 0.35;
        const c3 = Math.sin(lon * 5) * 0.12;
        const rawNoise = c1 + c2 + c3;

        // Strong bimodal separation: continents float at +0.22 to +0.55, oceans rest at -0.38 to -0.18
        const isContinental = rawNoise > 0.04;
        let initialElevation = isContinental
          ? 0.22 + (rawNoise - 0.04) * 0.75 + Math.random() * 0.05
          : -0.32 + rawNoise * 0.2 - Math.random() * 0.06;

        initialElevation = Math.max(-0.45, Math.min(this.maxContinentalElevation, initialElevation));

        const baseTemp = (1.0 - latAbs * 0.7) * 220 + 20;

        this.cells[idx] = {
          x,
          y,
          latNormalized,
          elevation: initialElevation,
          plateId: 0,
          crustType: isContinental ? 'continental' : 'oceanic',
          crustThicknessKm: isContinental ? 38.0 : 7.0, // Buoyant 38km granitic root vs 7km basalt
          temperature: isContinental ? baseTemp : baseTemp + 150,
          pressure: isContinental ? 4.5 : 2.0,
          activeMagma: 0,
          sediment: 0,
          iceThickness: latAbs > 0.82 ? 0.25 : 0,
          faultStress: 0,
          layers: isContinental ? [
            { rockId: 'sandstone', thicknessKm: 1.5, ageMa: 350, minerals: [{ id: 'quartz', grade: 0.3 }] },
            { rockId: 'shale', thicknessKm: 2.2, ageMa: 520, minerals: [{ id: 'iron_ore', grade: 0.2 }] },
            { rockId: 'granite', thicknessKm: 22.0, ageMa: 1800, minerals: [{ id: 'quartz', grade: 0.4 }, { id: 'gold', grade: 0.05 }] },
            { rockId: 'gneiss', thicknessKm: 14.0, ageMa: 2600, minerals: [{ id: 'lithium', grade: 0.08 }] }
          ] : [
            { rockId: 'limestone', thicknessKm: 0.8, ageMa: 120, minerals: [] },
            { rockId: 'basalt', thicknessKm: 6.5, ageMa: 180, minerals: [{ id: 'iron_ore', grade: 0.15 }] }
          ]
        };
      }
    }
  }

  getCell(x, y) {
    return this.cells[this.getIndex(x, y)];
  }

  // Bounded isostatic uplift: mountain building thickens the granitic crustal root
  uplift(x, y, amount) {
    const cell = this.getCell(x, y);

    const current = cell.elevation;
    const headroom = Math.max(0, this.maxContinentalElevation - current);
    const dampingFactor = Math.pow(headroom / this.maxContinentalElevation, 1.4);
    const actualUplift = amount * dampingFactor;

    cell.elevation = Math.min(this.maxContinentalElevation, cell.elevation + actualUplift);
    cell.crustThicknessKm = Math.min(70.0, cell.crustThicknessKm + actualUplift * 8.0);
    cell.pressure = Math.min(30.0, cell.pressure + actualUplift * 2.0);

    this.relaxSteepSlopes(x, y);
  }

  // Bounded subsidence: rifting forms ocean floor at abyssal depths, not bottomless voids
  subside(x, y, amount) {
    const cell = this.getCell(x, y);
    cell.elevation = Math.max(-0.38, cell.elevation - amount);
    if (cell.elevation < 0.0) {
      cell.crustType = 'oceanic';
      cell.crustThicknessKm = Math.max(6.0, cell.crustThicknessKm - amount * 4.0);
    }
  }

  relaxSteepSlopes(x, y) {
    const cell = this.getCell(x, y);
    const maxSlope = 0.12; // Maximum stable angle of repose

    const neighbors = [
      this.getCell(x + 1, y),
      this.getCell(x - 1, y),
      this.getCell(x, y + 1),
      this.getCell(x, y - 1)
    ];

    for (const n of neighbors) {
      const diff = cell.elevation - n.elevation;
      if (diff > maxSlope) {
        const excess = (diff - maxSlope) * 0.35;
        cell.elevation -= excess;
        n.elevation += excess * 0.9; // Conserve volume
      }
    }
  }

  // Thermal cooling: hot lava solidifies into basalt and subterranean heat dissipates
  processCooling(deltaYears = 10) {
    const coolingFactor = Math.min(0.25, 0.05 * (deltaYears / 20 + 1));
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      if (cell.activeMagma > 0) {
        cell.activeMagma = Math.max(0, cell.activeMagma - coolingFactor);
      }
      const baseTemp = (1.0 - Math.abs(cell.latNormalized) * 0.7) * 220 + 20;
      if (cell.temperature > baseTemp) {
        cell.temperature = Math.max(baseTemp, cell.temperature - coolingFactor * 120);
      }
    }
  }

  // Weather & Hydraulic Erosion with Authentic Airy Isostatic Rebound & Cratonic Freeboard:
  // 1. Continental cratons maintain an equilibrium baseline elevation above sea level.
  // 2. Stream power drops to zero as elevation approaches the cratonic baseline (h -> h_sea + 0.12).
  // 3. Mountains erode into rolling hills and fertile plains, but continents NEVER drown into oceans!
  processWeatherErosion(erosionRate) {
    const cratonicBaseline = this.seaLevel + 0.12;

    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.getCell(x, y);
        // Only erode exposed land elevated above the cratonic baseline
        if (cell.elevation <= cratonicBaseline) continue;

        const neighbors = [
          this.getCell(x + 1, y),
          this.getCell(x - 1, y),
          this.getCell(x, y + 1),
          this.getCell(x, y - 1)
        ];

        let lowest = null;
        let lowestElev = cell.elevation;

        for (const n of neighbors) {
          if (n.elevation < lowestElev) {
            lowestElev = n.elevation;
            lowest = n;
          }
        }

        if (lowest) {
          const slope = cell.elevation - lowestElev;
          const reliefAboveCraton = cell.elevation - cratonicBaseline;

          // Stream power incision scales with relief above cratonic base level
          const reliefFactor = Math.min(1.0, reliefAboveCraton / 0.35);
          const carved = Math.min(
            reliefAboveCraton * 0.15,
            erosionRate * (1.0 + slope * 2.5) * reliefFactor
          );

          if (carved > 0.000001) {
            // Airy Isostatic Rebound on buoyant continental crust:
            // rho_crust / rho_mantle = 2700 / 3300 = ~0.82
            const rebound = cell.crustType === 'continental' ? carved * 0.82 : 0;
            cell.elevation -= (carved - rebound);

            // 100% mass-conserved sediment deposited in downstream valley or coastal delta
            this.depositSediment(lowest.x, lowest.y, carved, 0);
          }
        }
      }
    }
  }

  // Glacial & Ice Age Erosion with Isostatic Rebound & Cratonic Base Floor
  processGlacialErosion(intensity = 1.0) {
    const cratonicBaseline = this.seaLevel + 0.10;

    for (let y = 0; y < this.height; y++) {
      const latAbs = Math.abs(this.getCell(0, y).latNormalized);

      for (let x = 0; x < this.width; x++) {
        const cell = this.getCell(x, y);
        const snowline = Math.max(cratonicBaseline, 0.65 - latAbs * 0.45);

        if (cell.elevation > snowline) {
          const iceAccumulation = 0.04 * intensity;
          cell.iceThickness = Math.min(0.6, (cell.iceThickness || 0) + iceAccumulation);

          // Glacial valley scouring bounded by cratonic base level
          const scourAmount = Math.min(
            0.012 * intensity * (cell.elevation - snowline),
            (cell.elevation - cratonicBaseline) * 0.2
          );
          const rebound = cell.crustType === 'continental' ? scourAmount * 0.82 : 0;
          cell.elevation = Math.max(cratonicBaseline, cell.elevation - (scourAmount - rebound));

          // Moraine till pushed downstream into foothill valleys
          const downvalley = this.getCell(x + (Math.random() > 0.5 ? 1 : -1), y + (latAbs > 0.5 ? -1 : 1));
          if (downvalley) {
            this.depositSediment(downvalley.x, downvalley.y, scourAmount, 0);
          }
        } else {
          if (cell.iceThickness > 0) {
            cell.iceThickness = Math.max(0, cell.iceThickness - 0.02 * intensity);
          }
        }
      }
    }
  }

  injectMagma(x, y, volume, currentAgeMa) {
    const cell = this.getCell(x, y);
    cell.activeMagma = Math.min(1.0, cell.activeMagma + volume);
    cell.elevation = Math.min(this.maxContinentalElevation, cell.elevation + volume * 0.35);
    cell.temperature = Math.min(1200, cell.temperature + volume * 450);

    const rockType = cell.elevation > 0.15 ? 'obsidian' : 'basalt';
    const mineralList = [{ id: 'quartz', grade: 0.25 }];

    if (Math.random() < 0.35) mineralList.push({ id: 'gold', grade: 0.15 });
    if (Math.random() < 0.2) mineralList.push({ id: 'lithium', grade: 0.12 });

    cell.layers.unshift({
      rockId: rockType,
      thicknessKm: volume * 1.8,
      ageMa: currentAgeMa,
      minerals: mineralList
    });

    if (cell.layers.length > 8) cell.layers.pop();
    this.relaxSteepSlopes(x, y);
  }

  // Mass-Conserving Sedimentation & Delta Progradation:
  // Builds alluvial floodplains, foothill basins, and extends coastal deltas into shallow shelves
  depositSediment(x, y, amount, currentAgeMa) {
    const cell = this.getCell(x, y);
    cell.sediment += amount;

    if (cell.sediment >= 0.04) {
      const isMarine = cell.elevation < this.seaLevel;
      const sedimentRock = isMarine ? 'limestone' : (Math.random() < 0.4 ? 'coal' : 'sandstone');
      const minerals = [];
      if (sedimentRock === 'coal') minerals.push({ id: 'coal', grade: 0.8 });
      else if (sedimentRock === 'sandstone') minerals.push({ id: 'iron_ore', grade: 0.2 });

      cell.layers.unshift({
        rockId: sedimentRock,
        thicknessKm: cell.sediment * 2.0,
        ageMa: currentAgeMa,
        minerals
      });

      // Deltaic progradation and alluvial aggradation:
      // Shallow marine shelves receive sediment to form coastal marshes and deltas
      const isShelf = cell.elevation < this.seaLevel && cell.elevation >= this.seaLevel - 0.12;
      const deltaBoost = isShelf ? 1.1 : 0.85;
      cell.elevation = Math.min(this.maxContinentalElevation, cell.elevation + cell.sediment * deltaBoost);

      // If delta builds above sea level, promote to continental crust
      if (cell.elevation >= this.seaLevel && cell.crustType === 'oceanic') {
        cell.crustType = 'continental';
        cell.crustThicknessKm = Math.max(cell.crustThicknessKm, 28.0);
      }

      cell.sediment = 0;

      if (cell.layers.length > 8) cell.layers.pop();
    }
  }

  performMetamorphism(x, y) {
    const cell = this.getCell(x, y);
    for (let i = 0; i < cell.layers.length; i++) {
      const layer = cell.layers[i];
      if (cell.pressure > 6.0 && cell.temperature > 300) {
        if (layer.rockId === 'limestone') {
          layer.rockId = 'marble';
          layer.minerals.push({ id: 'quartz', grade: 0.2 });
        } else if (layer.rockId === 'granite' || layer.rockId === 'shale') {
          layer.rockId = 'gneiss';
          if (Math.random() < 0.25) layer.minerals.push({ id: 'lithium', grade: 0.15 });
        }
      }
      if (cell.pressure > 14.0 && cell.temperature > 800) {
        if (!layer.minerals.some(m => m.id === 'diamond')) {
          layer.minerals.push({ id: 'diamond', grade: 0.3 });
        }
      }
    }
  }

  getStratigraphicColumn(x, y) {
    const cell = this.getCell(x, y);
    let cumulativeDepth = 0;

    const column = cell.layers.map(layer => {
      const depthStart = cumulativeDepth;
      cumulativeDepth += layer.thicknessKm;
      const depthEnd = cumulativeDepth;
      const mineralDetails = layer.minerals.map(m => ({
        ...MINERALS[m.id],
        grade: m.grade
      }));

      return {
        ...layer,
        depthStartKm: depthStart.toFixed(1),
        depthEndKm: depthEnd.toFixed(1),
        mineralDetails
      };
    });

    return {
      x: cell.x,
      y: cell.y,
      latDeg: Math.round(cell.latNormalized * 90),
      lonDeg: Math.round((cell.x / this.width) * 360 - 180),
      elevation: (cell.elevation * 8848).toFixed(0),
      crustType: cell.crustType,
      crustThicknessKm: cell.crustThicknessKm.toFixed(1),
      temperature: Math.round(cell.temperature),
      pressure: cell.pressure.toFixed(1),
      iceThicknessKm: (cell.iceThickness ? (cell.iceThickness * 3.5).toFixed(1) : '0.0'),
      faultStress: Math.round(cell.faultStress * 100),
      layers: column,
      totalDepthKm: cumulativeDepth.toFixed(1)
    };
  }
}
