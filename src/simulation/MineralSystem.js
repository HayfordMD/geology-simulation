import { MINERALS } from '../config/minerals.js';

export class MineralSystem {
  constructor(strataGrid) {
    this.grid = strataGrid;
    this.discoveredMinerals = new Set(['basalt', 'granite', 'sandstone']);
    this.totalExtractedValue = 0;
    this.onDiscoveryCallback = null;
  }

  onDiscovery(cb) {
    this.onDiscoveryCallback = cb;
  }

  processErosion(deltaYears, epochModifiers) {
    const erosionRate = 0.000004 * deltaYears * (epochModifiers.erosionMultiplier || 1.0);

    // Erosion sweeps material downslope
    for (let y = 1; y < this.grid.height - 1; y++) {
      for (let x = 1; x < this.grid.width - 1; x++) {
        const cell = this.grid.getCell(x, y);

        // Find lowest neighbor
        let lowestNeighbor = null;
        let lowestElev = cell.elevation;

        const neighbors = [
          this.grid.getCell(x + 1, y),
          this.grid.getCell(x - 1, y),
          this.grid.getCell(x, y + 1),
          this.grid.getCell(x, y - 1)
        ];

        for (const n of neighbors) {
          if (n.elevation < lowestElev) {
            lowestElev = n.elevation;
            lowestNeighbor = n;
          }
        }

        // If height difference is significant, erode top cell and deposit in neighbor
        const diff = cell.elevation - lowestElev;
        if (diff > 0.08 && lowestNeighbor) {
          const erodedAmount = Math.min(diff * 0.4, erosionRate);
          cell.elevation -= erodedAmount;
          this.grid.depositSediment(lowestNeighbor.x, lowestNeighbor.y, erodedAmount, 0);
        }
      }
    }
  }

  prospectCoreSample(x, y, multipliers = {}) {
    const column = this.grid.getStratigraphicColumn(x, y);
    let sampleValue = 0;
    let researchGained = 15 * (multipliers.prospectResearch || 1.0);
    const newDiscoveries = [];

    // Analyze each layer in the drilled core
    for (const layer of column.layers) {
      // Base rock value
      const baseRock = MINERALS[layer.rockId];
      if (baseRock) {
        sampleValue += baseRock.value * parseFloat(layer.thicknessKm);
        researchGained += baseRock.researchValue;

        if (!this.discoveredMinerals.has(layer.rockId)) {
          this.discoveredMinerals.add(layer.rockId);
          newDiscoveries.push(baseRock);
        }
      }

      // Precious veins in layer
      for (const mineral of layer.mineralDetails) {
        const veinValue = mineral.value * mineral.grade * parseFloat(layer.thicknessKm) * 10;
        sampleValue += veinValue;
        researchGained += mineral.researchValue * 2;

        if (!this.discoveredMinerals.has(mineral.id)) {
          this.discoveredMinerals.add(mineral.id);
          newDiscoveries.push(mineral);
        }
      }
    }

    // Apply multipliers
    sampleValue = Math.round(sampleValue * (multipliers.mineralWealth || 1.0));
    researchGained = Math.round(researchGained);

    this.totalExtractedValue += sampleValue;

    if (newDiscoveries.length > 0 && this.onDiscoveryCallback) {
      newDiscoveries.forEach(m => this.onDiscoveryCallback(m));
    }

    return {
      column,
      sampleValue,
      researchGained,
      newDiscoveries
    };
  }

  isDiscovered(mineralId) {
    return this.discoveredMinerals.has(mineralId);
  }

  getDiscoveryStats() {
    const totalCount = Object.keys(MINERALS).length;
    const discoveredCount = this.discoveredMinerals.size;
    return {
      discovered: discoveredCount,
      total: totalCount,
      percentage: Math.round((discoveredCount / totalCount) * 100)
    };
  }
}
