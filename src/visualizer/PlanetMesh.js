import * as THREE from 'three';
import { MINERALS } from '../config/minerals.js';
import { TERRAIN_TYPES } from '../simulation/BiomeSystem.js';
import { TextureGenerator } from './TextureGenerator.js';

export class PlanetMesh {
  constructor(strataGrid, plates, radius = 14.0) {
    this.grid = strataGrid;
    this.plates = plates;
    this.radius = radius;
    this.elevationScale = 2.4;
    this.displayMode = 'lithology';
    this.terrainFilter = 'all'; // 'all', 'deep_sea', 'shallow_sea', 'rivers', 'forest', 'desert', 'hills', 'cliffs', 'tropical'
    this.isXRay = false;

    this.group = new THREE.Group();

    this.initTextures();
    this.initTerrainSphere();
    this.initOceanSphere();
    this.initAtmosphericClouds();
    this.updateGeometry();
  }

  initTextures() {
    this.detailTexture = TextureGenerator.createTerrainDetailTexture(1024, 512);
    this.bumpMap = TextureGenerator.createBumpMap(1024, 512);
    this.cloudTexture = TextureGenerator.createCloudTexture(1024, 512);
  }

  initTerrainSphere() {
    this.widthSegments = this.grid.width;
    this.heightSegments = this.grid.height;

    this.geometry = new THREE.SphereGeometry(
      this.radius,
      this.widthSegments,
      this.heightSegments
    );

    const posAttr = this.geometry.attributes.position;
    this.baseNormals = new Float32Array(posAttr.count * 3);
    const tempVec = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      tempVec.fromBufferAttribute(posAttr, i).normalize();
      this.baseNormals[i * 3] = tempVec.x;
      this.baseNormals[i * 3 + 1] = tempVec.y;
      this.baseNormals[i * 3 + 2] = tempVec.z;
    }

    const colors = new Float32Array(posAttr.count * 3);
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      bumpMap: this.bumpMap,
      bumpScale: 0.08,
      roughness: 0.65,
      metalness: 0.1,
      flatShading: true
    });

    this.terrainMesh = new THREE.Mesh(this.geometry, this.material);
    this.terrainMesh.castShadow = true;
    this.terrainMesh.receiveShadow = true;
    this.group.add(this.terrainMesh);
  }

  initOceanSphere() {
    this.oceanGeometry = new THREE.SphereGeometry(
      this.radius,
      64,
      48
    );

    this.oceanMaterial = new THREE.MeshStandardMaterial({
      color: 0x005b8a,
      transparent: true,
      opacity: 0.72,
      roughness: 0.12,
      metalness: 0.85
    });

    this.oceanMesh = new THREE.Mesh(this.oceanGeometry, this.oceanMaterial);
    this.group.add(this.oceanMesh);
  }

  initAtmosphericClouds() {
    this.cloudGeometry = new THREE.SphereGeometry(
      this.radius * 1.025,
      48,
      32
    );

    this.cloudMaterial = new THREE.MeshStandardMaterial({
      map: this.cloudTexture,
      transparent: true,
      opacity: 0.52,
      roughness: 0.9,
      depthWrite: false
    });

    this.cloudMesh = new THREE.Mesh(this.cloudGeometry, this.cloudMaterial);
    this.group.add(this.cloudMesh);
  }

  updateClouds(deltaSec) {
    if (this.cloudMesh) {
      this.cloudMesh.rotation.y += deltaSec * 0.015;
    }
  }

  setXRay(isXRay) {
    this.isXRay = isXRay;
    if (isXRay) {
      this.material.transparent = true;
      this.material.opacity = 0.22;
      this.material.depthWrite = false;
      this.oceanMaterial.opacity = 0.12;
      this.oceanMaterial.depthWrite = false;
      if (this.cloudMesh) this.cloudMesh.visible = false;
    } else {
      this.material.transparent = false;
      this.material.opacity = 1.0;
      this.material.depthWrite = true;
      this.oceanMaterial.opacity = 0.72;
      this.oceanMaterial.depthWrite = true;
      if (this.cloudMesh) this.cloudMesh.visible = true;
    }
  }

  setDisplayMode(mode) {
    this.displayMode = mode;
    this.updateColors();
  }

  setTerrainFilter(filterId) {
    this.terrainFilter = filterId;
    this.updateColors();
  }

  setOceanLevel(level) {
    this.currentOceanLevel = level;
    const r = Math.max(this.radius * 0.85, this.radius + level * this.elevationScale);
    const s = r / this.radius;
    this.oceanMesh.scale.set(s, s, s);
    this.updateColors();
  }

  gridToWorld(gx, gy) {
    const cell = this.grid.getCell(gx, gy);
    const elev = cell ? cell.elevation : 0;
    const r = this.radius + elev * this.elevationScale;

    const v = gy / (this.grid.height - 1);
    const u = gx / this.grid.width;

    const phi = v * Math.PI;
    const theta = u * Math.PI * 2;

    const x = -r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  }

  worldToGrid(worldVec) {
    const dir = worldVec.clone().normalize();
    const phi = Math.acos(Math.max(-1, Math.min(1, dir.y)));
    let theta = Math.atan2(dir.z, -dir.x);
    if (theta < 0) theta += Math.PI * 2;

    const v = phi / Math.PI;
    const u = theta / (Math.PI * 2);

    const gy = Math.round(v * (this.grid.height - 1));
    const gx = Math.round(u * this.grid.width) % this.grid.width;

    return {
      x: Math.max(0, Math.min(this.grid.width - 1, gx)),
      y: Math.max(0, Math.min(this.grid.height - 1, gy))
    };
  }

  updateGeometry() {
    const posAttr = this.geometry.attributes.position;
    const widthSegs = this.widthSegments;
    const heightSegs = this.heightSegments;

    let vIdx = 0;
    for (let iy = 0; iy <= heightSegs; iy++) {
      const gy = Math.min(this.grid.height - 1, iy);

      for (let ix = 0; ix <= widthSegs; ix++) {
        const gx = ix % this.grid.width;
        const cell = this.grid.getCell(gx, gy);
        const elev = cell.elevation;

        const nx = this.baseNormals[vIdx * 3];
        const ny = this.baseNormals[vIdx * 3 + 1];
        const nz = this.baseNormals[vIdx * 3 + 2];

        const r = this.radius + elev * this.elevationScale;

        posAttr.setXYZ(vIdx, nx * r, ny * r, nz * r);
        vIdx++;
      }
    }

    posAttr.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.updateColors();
  }

  updateColors() {
    const colorAttr = this.geometry.attributes.color;
    const widthSegs = this.widthSegments;
    const heightSegs = this.heightSegments;
    const tempCol = new THREE.Color();

    let vIdx = 0;
    for (let iy = 0; iy <= heightSegs; iy++) {
      const gy = Math.min(this.grid.height - 1, iy);
      const latAbs = Math.abs(gy / (this.grid.height - 1) * 2 - 1);

      for (let ix = 0; ix <= widthSegs; ix++) {
        const gx = ix % this.grid.width;
        const cell = this.grid.getCell(gx, gy);

        // Check if Terrain/Biome Filter is active
        if (this.terrainFilter !== 'all') {
          if (cell.terrainType === this.terrainFilter) {
            // Highlighted matched zone in distinct glowing chromatic tint
            const filterDef = TERRAIN_TYPES[this.terrainFilter];
            if (filterDef && filterDef.rgb) {
              tempCol.setRGB(filterDef.rgb[0] / 255, filterDef.rgb[1] / 255, filterDef.rgb[2] / 255);
              tempCol.multiplyScalar(1.2); // Luminescent spotlight
            } else {
              tempCol.setRGB(0.0, 0.95, 1.0);
            }
          } else {
            // Desaturate non-matching terrain to deep dark slate
            const grayElev = 0.12 + Math.max(0, cell.elevation) * 0.15;
            tempCol.setRGB(grayElev * 0.8, grayElev * 0.85, grayElev);
          }
        } else if (this.displayMode === 'lithology') {
          // Standard Natural Lithology dynamically referenced to eustatic sea level
          const seaLevel = (this.currentOceanLevel !== undefined) ? this.currentOceanLevel : (this.grid.seaLevel ?? 0.0);
          const elev = cell.elevation;
          const ice = cell.iceThickness || 0;

          if (cell.activeMagma > 0.08) {
            tempCol.setRGB(1.0, 0.28 * (1 - cell.activeMagma), 0.02);
          } else if (ice > 0.15 || latAbs > 0.85) {
            // Polar ice sheet and glaciers
            tempCol.setRGB(0.92, 0.96, 1.0);
          } else if (elev < seaLevel - 0.12) {
            // Abyssal deep ocean
            tempCol.setRGB(0.04, 0.10, 0.22);
          } else if (elev <= seaLevel) {
            // Shallow coastal turquoise shelf
            tempCol.setRGB(0.12, 0.42, 0.55);
          } else if (elev < seaLevel + 0.035) {
            // Golden coastal beaches and alluvial deltas
            tempCol.setRGB(0.82, 0.72, 0.50);
          } else if (latAbs < 0.20 && elev < seaLevel + 0.45) {
            // Equatorial tropical rainforest
            tempCol.setRGB(0.12, 0.48, 0.18);
          } else if (latAbs >= 0.20 && latAbs <= 0.42 && elev < seaLevel + 0.42) {
            // Subtropical desert & arid steppe
            tempCol.setRGB(0.85, 0.62, 0.35);
          } else if (elev < seaLevel + 0.38) {
            // Lush continental plains & temperate forest
            tempCol.setRGB(0.22, 0.52, 0.22);
          } else if (elev < seaLevel + 0.56) {
            // Rolling foothill woodlands & plateaus
            tempCol.setRGB(0.38, 0.52, 0.28);
          } else if (elev < seaLevel + 0.72) {
            // Mountain highlands & rugged rock scarps
            tempCol.setRGB(0.55, 0.50, 0.46);
          } else {
            // Snowcapped alpine peaks
            tempCol.setRGB(0.95, 0.97, 1.0);
          }
        } else if (this.displayMode === 'plates') {
          const plate = this.plates.plates[cell.plateId];
          tempCol.set(plate.color);
          tempCol.multiplyScalar(0.7 + cell.elevation * 0.4);
        } else if (this.displayMode === 'stress') {
          const s = Math.min(1.0, cell.faultStress);
          if (s < 0.3) tempCol.setRGB(0.1, 0.4 + s * 1.5, 0.5);
          else if (s < 0.75) tempCol.setRGB(0.85, 0.65, 0.1);
          else tempCol.setRGB(1.0, 0.1, 0.15);
        } else if (this.displayMode === 'minerals') {
          let topMineral = null;
          let highestValue = 0;
          cell.layers.forEach(layer => {
            layer.mineralDetails?.forEach(min => {
              if (min.value > highestValue) {
                highestValue = min.value;
                topMineral = min;
              }
            });
          });

          if (topMineral && topMineral.rgb) {
            tempCol.setRGB(topMineral.rgb[0] / 255, topMineral.rgb[1] / 255, topMineral.rgb[2] / 255);
          } else {
            const rock = MINERALS[cell.layers[0]?.rockId];
            if (rock && rock.rgb) {
              tempCol.setRGB(rock.rgb[0] / 255, rock.rgb[1] / 255, rock.rgb[2] / 255);
            } else {
              tempCol.setRGB(0.3, 0.3, 0.3);
            }
          }
        }

        colorAttr.setXYZ(vIdx, tempCol.r, tempCol.g, tempCol.b);
        vIdx++;
      }
    }

    colorAttr.needsUpdate = true;
  }
}
