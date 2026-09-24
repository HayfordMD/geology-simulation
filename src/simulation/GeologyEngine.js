import { StrataGrid } from './StrataGrid.js';
import { TectonicPlates } from './TectonicPlates.js';
import { MineralSystem } from './MineralSystem.js';
import { IdleManager } from './IdleManager.js';
import { BiomeSystem } from './BiomeSystem.js';
import { getEpochByAge } from '../config/epochs.js';

export class GeologyEngine {
  constructor() {
    this.grid = new StrataGrid(64, 32);
    this.plates = new TectonicPlates(this.grid);
    this.minerals = new MineralSystem(this.grid);
    this.idle = new IdleManager();
    this.biomes = new BiomeSystem(this.grid);

    this.currentAgeMa = 4540;
    this.currentEpoch = getEpochByAge(this.currentAgeMa);
    this.grid.setSeaLevel(this.currentEpoch.oceanLevel);
    if (this.biomes.setSeaLevel) this.biomes.setSeaLevel(this.currentEpoch.oceanLevel);

    this.baseYearsPerSecond = 10;
    this.timeScale = 1;
    this.isPaused = false;

    // Climate & Ice Age state
    this.globalTempC = 14;
    this.isIceAge = false;
    this.iceAgeCycleYears = 0;

    this.eventListeners = {
      quake: [],
      epochChange: [],
      discovery: [],
      volcano: [],
      meteor: [],
      iceAge: []
    };

    this.minerals.onDiscovery((m) => this.emit('discovery', m));
  }

  on(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(cb => cb(data));
    }
  }

  setTimeScale(scale) {
    this.timeScale = scale;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  update(deltaSec) {
    if (this.isPaused) return;

    const deltaYears = deltaSec * this.baseYearsPerSecond * this.timeScale;
    const deltaMa = deltaYears / 1_000_000;

    this.currentAgeMa -= deltaMa;

    // Check epoch transition
    const newEpoch = getEpochByAge(this.currentAgeMa);
    if (newEpoch.id !== this.currentEpoch.id) {
      const oldEpoch = this.currentEpoch;
      this.currentEpoch = newEpoch;
      this.grid.setSeaLevel(newEpoch.oceanLevel);
      if (this.biomes.setSeaLevel) this.biomes.setSeaLevel(newEpoch.oceanLevel);
      this.emit('epochChange', { oldEpoch, newEpoch });
    }

    // Milankovitch climate cycle
    this.iceAgeCycleYears += deltaYears;
    const orbitalPhase = Math.sin((this.iceAgeCycleYears / 100_000) * Math.PI * 2);
    const epochBaseTemp = this.currentEpoch.id === 'hadean' ? 45 : (this.currentEpoch.id === 'archean' ? 28 : 14);
    this.globalTempC = Math.round(epochBaseTemp + orbitalPhase * 6);
    this.isIceAge = this.globalTempC < 11;

    // Update Tectonics
    const quakes = this.plates.update(deltaYears, this.currentEpoch);
    for (const quake of quakes) {
      const energyMJ = quake.energyMJ;
      const harvestedSeismic = this.idle.addSeismicFromQuake(energyMJ);
      this.emit('quake', { ...quake, harvestedSeismic });
    }

    // Auto-venting research perk
    if (this.idle.autoVentFaults) {
      for (const fault of this.plates.faultLines) {
        if (fault.stress > 0.88) {
          const autoQuake = this.plates.triggerRupture(fault, false);
          const harvested = this.idle.addSeismicFromQuake(autoQuake.energyMJ);
          this.emit('quake', { ...autoQuake, harvestedSeismic: harvested, isAutoVented: true });
        }
      }
    }

    // Weather & Glacial Erosion
    const boundedYears = Math.min(100_000, deltaYears);
    const erosionRate = 0.000002 * boundedYears * (this.currentEpoch.erosionMultiplier || 1.0);
    this.grid.processWeatherErosion(erosionRate);

    if (this.isIceAge || this.currentEpoch.id === 'cenozoic') {
      const glacialIntensity = this.isIceAge ? 1.4 : 0.6;
      this.grid.processGlacialErosion(glacialIntensity);
    }

    // Thermal cooling: solidify active lava into basalt and dissipate subterranean heat
    this.grid.processCooling(deltaYears);

    // Recalculate biomes periodically
    if (Math.random() < 0.1 || deltaYears > 10_000) {
      this.biomes.calculateClassifications();
    }

    this.idle.update(deltaSec, this.currentEpoch);
  }

  // Geologist Interventions
  triggerCoreDrill(gridX, gridY) {
    const result = this.minerals.prospectCoreSample(gridX, gridY, this.idle.multipliers);
    this.idle.resources.money += result.sampleValue;
    this.idle.resources.research += result.researchGained;
    return result;
  }

  triggerFaultSlip(gridX, gridY) {
    const quake = this.plates.triggerNearestFault(gridX, gridY);
    if (quake) {
      const harvested = this.idle.addSeismicFromQuake(quake.energyMJ);
      this.emit('quake', { ...quake, harvestedSeismic: harvested });
      return quake;
    }
    return null;
  }

  spawnVolcano(gridX, gridY) {
    const radius = 3;
    const peakVolume = 0.40;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.hypot(dx, dy);
        if (dist <= radius) {
          const factor = Math.cos((dist / radius) * (Math.PI / 2));
          const volume = peakVolume * factor;
          const targetX = ((gridX + dx) % this.grid.width + this.grid.width) % this.grid.width;
          const targetY = Math.max(0, Math.min(this.grid.height - 1, gridY + dy));
          this.grid.injectMagma(targetX, targetY, volume, this.currentAgeMa);
        }
      }
    }

    this.idle.resources.geothermal += 120 * this.idle.multipliers.geothermalMultiplier;
    this.biomes.calculateClassifications();
    const volcanoEvent = { x: gridX, y: gridY, currentAgeMa: this.currentAgeMa };
    this.emit('volcano', volcanoEvent);
    return volcanoEvent;
  }

  carveGlaciers(gridX, gridY) {
    const radius = 4;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.hypot(dx, dy);
        if (dist <= radius) {
          const tx = ((gridX + dx) % this.grid.width + this.grid.width) % this.grid.width;
          const ty = Math.max(0, Math.min(this.grid.height - 1, gridY + dy));
          const cell = this.grid.getCell(tx, ty);

          if (cell.elevation > 0.15) {
            const carveDepth = 0.12 * (1 - dist / radius);
            cell.elevation = Math.max(0.08, cell.elevation - carveDepth);
            cell.iceThickness = 0.4;
            const downstreamX = ((tx + 1) % this.grid.width);
            this.grid.depositSediment(downstreamX, ty, carveDepth * 1.5, this.currentAgeMa);
          }
        }
      }
    }
    this.idle.resources.research += 40;
    this.biomes.calculateClassifications();
    this.emit('iceAge', { x: gridX, y: gridY });
  }

  accelerateWeathering(gridX, gridY) {
    const radius = 4;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.hypot(dx, dy);
        if (dist <= radius) {
          const tx = ((gridX + dx) % this.grid.width + this.grid.width) % this.grid.width;
          const ty = Math.max(0, Math.min(this.grid.height - 1, gridY + dy));
          const cell = this.grid.getCell(tx, ty);
          if (cell.elevation > 0.05) {
            const carved = 0.09 * (1 - dist / radius);
            cell.elevation -= carved;
            const downstreamX = ((tx + 1) % this.grid.width);
            this.grid.depositSediment(downstreamX, ty, carved, this.currentAgeMa);
          }
        }
      }
    }
    this.idle.resources.research += 25;
    this.biomes.calculateClassifications();
  }

  triggerMeteorImpact(gridX, gridY) {
    const radius = 5;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.hypot(dx, dy);
        if (dist <= radius) {
          const tx = ((gridX + dx) % this.grid.width + this.grid.width) % this.grid.width;
          const ty = Math.max(0, Math.min(this.grid.height - 1, gridY + dy));
          const cell = this.grid.getCell(tx, ty);

          if (dist < 1.5) {
            cell.elevation = Math.max(-0.4, cell.elevation - 0.35);
            cell.temperature = Math.min(1200, cell.temperature + 500);
            cell.pressure += 18.0;
            this.grid.performMetamorphism(tx, ty);
          } else if (dist <= radius) {
            cell.elevation += 0.12 * (1 - (dist - 1.5) / (radius - 1.5));
          }
        }
      }
    }

    const meteorEvent = { x: gridX, y: gridY };
    this.emit('meteor', meteorEvent);
    this.idle.resources.seismic += 250;
    this.idle.resources.research += 100;
    this.biomes.calculateClassifications();
    return meteorEvent;
  }
}
