// Planetary Biome & Terrain Classification Engine

export const TERRAIN_TYPES = {
  all: {
    id: 'all',
    name: 'All Natural',
    icon: '🌍',
    color: '#00f0ff',
    rgb: [0, 240, 255],
    description: 'Natural planetary surface with full procedural lithology and biomes.'
  },
  deep_sea: {
    id: 'deep_sea',
    name: 'Deep Sea & Abyssal Plains',
    icon: '🌊',
    color: '#1d3557',
    rgb: [29, 53, 87],
    description: 'Deep ocean basins and abyssal plains on dense basaltic oceanic crust (elevation < -0.10).'
  },
  shallow_sea: {
    id: 'shallow_sea',
    name: 'Low-Level Shallow Seas & Shelves',
    icon: '🏖️',
    color: '#48cae4',
    rgb: [72, 202, 228],
    description: 'Submerged continental shelves, shallow inland epi-continental seas, and coastal lagoons (-0.10 to 0.05).'
  },
  rivers: {
    id: 'rivers',
    name: 'Rivers & Drainage Basins',
    icon: '🏞️',
    color: '#00b4d8',
    rgb: [0, 180, 216],
    description: 'Fluvial runoff channels, river valley corridors, and alluvial delta deposition basins.'
  },
  forest: {
    id: 'forest',
    name: 'Temperate Forests & Plains',
    icon: '🌲',
    color: '#2d6a4f',
    rgb: [45, 106, 79],
    description: 'Moderate-elevation fertile continental plains and forests in temperate moisture zones.'
  },
  desert: {
    id: 'desert',
    name: 'Deserts & Arid Belts',
    icon: '🏜️',
    color: '#e76f51',
    rgb: [231, 111, 81],
    description: 'Dry subtropical high-pressure belts (15°-35° latitude) characterized by sand dunes and rock plateaus.'
  },
  hills: {
    id: 'hills',
    name: 'Hills & Rolling Uplands',
    icon: '⛰️',
    color: '#f4a261',
    rgb: [244, 162, 97],
    description: 'Rolling elevated terrain and foothill plateaus (0.25 to 0.50 elevation with moderate slopes).'
  },
  cliffs: {
    id: 'cliffs',
    name: 'Cliffs & Tectonic Scarps',
    icon: '🧗',
    color: '#e63946',
    rgb: [230, 57, 70],
    description: 'Sheer vertical rock faces, tectonic fault scarps, and canyon walls with extreme slope angles.'
  },
  tropical: {
    id: 'tropical',
    name: 'Tropical Equatorial Zones',
    icon: '🌴',
    color: '#52b788',
    rgb: [82, 183, 136],
    description: 'Warm, high-humidity equatorial rainforest belts (|lat| < 20°) with intense biological cycling.'
  }
};

export class BiomeSystem {
  constructor(strataGrid) {
    this.grid = strataGrid;
    this.seaLevel = strataGrid.seaLevel ?? -0.10;
    this.activeFilter = 'all';
    this.coverageStats = {};
    this.calculateClassifications();
  }

  setSeaLevel(level) {
    this.seaLevel = level;
    this.calculateClassifications();
  }

  calculateClassifications() {
    const counts = {
      all: 0,
      deep_sea: 0,
      shallow_sea: 0,
      rivers: 0,
      forest: 0,
      desert: 0,
      hills: 0,
      cliffs: 0,
      tropical: 0
    };

    const totalCells = this.grid.cells.length;
    const seaLevel = (this.seaLevel !== undefined) ? this.seaLevel : (this.grid.seaLevel ?? 0.0);

    for (let y = 0; y < this.grid.height; y++) {
      const latAbs = Math.abs(this.grid.getCell(0, y).latNormalized); // 0 at equator, 1 at poles

      for (let x = 0; x < this.grid.width; x++) {
        const cell = this.grid.getCell(x, y);
        const elev = cell.elevation;

        // Calculate maximum local slope
        const neighbors = [
          this.grid.getCell(x + 1, y),
          this.grid.getCell(x - 1, y),
          this.grid.getCell(x, y + 1),
          this.grid.getCell(x, y - 1)
        ];

        let maxDiff = 0;
        for (const n of neighbors) {
          maxDiff = Math.max(maxDiff, Math.abs(elev - n.elevation));
        }
        cell.slope = maxDiff;

        // Determine primary terrain classification relative to dynamic sea level
        let type = 'forest';

        if (elev < seaLevel - 0.12) {
          type = 'deep_sea';
        } else if (elev <= seaLevel) {
          type = 'shallow_sea';
        } else if (maxDiff >= 0.075) {
          // Steep slope threshold = Cliff
          type = 'cliffs';
        } else if (elev <= seaLevel + 0.14 && (cell.sediment > 0.03 || maxDiff < 0.025)) {
          // Lowland alluvial valley / coastal delta platform = Rivers
          type = 'rivers';
        } else if (latAbs < 0.22 && elev < seaLevel + 0.35) {
          // Equatorial warm moist belt = Tropical
          type = 'tropical';
        } else if (latAbs >= 0.22 && latAbs <= 0.45 && elev < seaLevel + 0.35) {
          // Subtropical arid belt = Desert
          type = 'desert';
        } else if (elev >= seaLevel + 0.20 && elev <= seaLevel + 0.50 && maxDiff >= 0.03) {
          // Rolling topography = Hills
          type = 'hills';
        } else if (latAbs > 0.45 && elev < seaLevel + 0.50) {
          type = 'forest';
        } else {
          type = 'hills';
        }

        cell.terrainType = type;
        if (counts[type] !== undefined) {
          counts[type]++;
        }
      }
    }

    counts.all = totalCells;
    const totalAreaEarthSqKm = 510.1; // Million km²

    this.coverageStats = {};
    for (const [key, count] of Object.entries(counts)) {
      const percentage = (count / totalCells) * 100;
      const area = (percentage / 100) * totalAreaEarthSqKm;
      this.coverageStats[key] = {
        count,
        percentage: Math.round(percentage * 10) / 10,
        areaMillionSqKm: Math.round(area * 10) / 10
      };
    }
  }

  setFilter(filterId) {
    if (TERRAIN_TYPES[filterId]) {
      this.activeFilter = filterId;
      return true;
    }
    return false;
  }

  getStats(filterId) {
    return this.coverageStats[filterId] || { percentage: 0, areaMillionSqKm: 0 };
  }
}
