import * as THREE from 'three';
import { MINERALS } from '../config/minerals.js';

export class CrustMesh {
  constructor(strataGrid, plates, worldSize = 40) {
    this.grid = strataGrid;
    this.plates = plates;
    this.worldSize = worldSize;
    this.elevationScale = 7.5;
    this.displayMode = 'lithology'; // 'lithology', 'plates', 'stress', 'minerals'

    this.group = new THREE.Group();

    this.initTerrainMesh();
    this.initOceanMesh();
    this.initMantleSkirt();
    this.updateGeometry();
  }

  initTerrainMesh() {
    this.geometry = new THREE.PlaneGeometry(
      this.worldSize,
      this.worldSize,
      this.grid.width - 1,
      this.grid.height - 1
    );
    this.geometry.rotateX(-Math.PI / 2);

    // Initialize vertex colors
    const vertexCount = this.geometry.attributes.position.count;
    const colors = new Float32Array(vertexCount * 3);
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.15,
      flatShading: true
    });

    this.terrainMesh = new THREE.Mesh(this.geometry, this.material);
    this.terrainMesh.castShadow = true;
    this.terrainMesh.receiveShadow = true;
    this.group.add(this.terrainMesh);
  }

  initOceanMesh() {
    const waterGeo = new THREE.PlaneGeometry(this.worldSize * 1.02, this.worldSize * 1.02);
    waterGeo.rotateX(-Math.PI / 2);

    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x006699,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.85
    });

    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMaterial);
    this.waterMesh.position.y = 0.12 * this.elevationScale; // Default sea level
    this.group.add(this.waterMesh);
  }

  initMantleSkirt() {
    // Underneath the crust slab: glowing asthenosphere mantle base
    const skirtGeo = new THREE.BoxGeometry(this.worldSize, 2.5, this.worldSize);
    const skirtMat = new THREE.MeshStandardMaterial({
      color: 0x1f0d06,
      emissive: 0x441100,
      emissiveIntensity: 0.3,
      roughness: 0.9
    });
    this.skirtMesh = new THREE.Mesh(skirtGeo, skirtMat);
    this.skirtMesh.position.y = -1.3;
    this.group.add(this.skirtMesh);
  }

  setDisplayMode(mode) {
    this.displayMode = mode;
    this.updateColors();
  }

  setOceanLevel(level) {
    this.waterMesh.position.y = level * this.elevationScale;
  }

  gridToWorld(gx, gy) {
    const stepX = this.worldSize / (this.grid.width - 1);
    const stepZ = this.worldSize / (this.grid.height - 1);
    const wx = (gx * stepX) - this.worldSize / 2;
    const wz = (gy * stepZ) - this.worldSize / 2;
    const cell = this.grid.getCell(gx, gy);
    const wy = cell ? cell.elevation * this.elevationScale : 0;
    return new THREE.Vector3(wx, wy, wz);
  }

  worldToGrid(wx, wz) {
    const stepX = this.worldSize / (this.grid.width - 1);
    const stepZ = this.worldSize / (this.grid.height - 1);
    const gx = Math.round((wx + this.worldSize / 2) / stepX);
    const gy = Math.round((wz + this.worldSize / 2) / stepZ);
    return {
      x: Math.max(0, Math.min(this.grid.width - 1, gx)),
      y: Math.max(0, Math.min(this.grid.height - 1, gy))
    };
  }

  updateGeometry() {
    const posAttr = this.geometry.attributes.position;
    for (let gy = 0; gy < this.grid.height; gy++) {
      for (let gx = 0; gx < this.grid.width; gx++) {
        const vIdx = gy * this.grid.width + gx;
        const cell = this.grid.getCell(gx, gy);
        posAttr.setY(vIdx, cell.elevation * this.elevationScale);
      }
    }
    posAttr.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.updateColors();
  }

  updateColors() {
    const colorAttr = this.geometry.attributes.color;
    const tempColor = new THREE.Color();

    for (let gy = 0; gy < this.grid.height; gy++) {
      for (let gx = 0; gx < this.grid.width; gx++) {
        const vIdx = gy * this.grid.width + gx;
        const cell = this.grid.getCell(gx, gy);

        if (this.displayMode === 'lithology') {
          // Dynamic geological terrain coloring
          const elev = cell.elevation;
          if (cell.activeMagma > 0.1) {
            // Glowing volcanic hotspot
            tempColor.setRGB(1.0, 0.25 * (1 - cell.activeMagma), 0.0);
          } else if (elev < 0.05) {
            // Ocean abyssal basalt floor
            tempColor.setRGB(0.12, 0.18, 0.28);
          } else if (elev < 0.15) {
            // Coastal sedimentary / beach
            tempColor.setRGB(0.78, 0.65, 0.45);
          } else if (elev < 0.35) {
            // Continental plains & forests
            tempColor.setRGB(0.28, 0.45, 0.25);
          } else if (elev < 0.6) {
            // Granitic highlands
            tempColor.setRGB(0.55, 0.50, 0.45);
          } else if (elev < 0.8) {
            // Alpine metamorphic ridges
            tempColor.setRGB(0.40, 0.38, 0.38);
          } else {
            // Glaciated mountain peaks
            tempColor.setRGB(0.92, 0.95, 0.98);
          }
        } else if (this.displayMode === 'plates') {
          // Tectonic plate territories
          const plate = this.plates.plates[cell.plateId];
          tempColor.set(plate.color);
          // Modulate with elevation for 3D depth
          tempColor.multiplyScalar(0.7 + cell.elevation * 0.5);
        } else if (this.displayMode === 'stress') {
          // Fault stress heatmap
          const s = Math.min(1.0, cell.faultStress);
          if (s < 0.3) {
            tempColor.setRGB(0.1, 0.4 + s * 1.5, 0.5);
          } else if (s < 0.75) {
            tempColor.setRGB(0.85, 0.65, 0.1);
          } else {
            // Critical rupture warning red
            tempColor.setRGB(1.0, 0.1, 0.15);
          }
        } else if (this.displayMode === 'minerals') {
          // Mineral radar highlights
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
            tempColor.setRGB(
              topMineral.rgb[0] / 255,
              topMineral.rgb[1] / 255,
              topMineral.rgb[2] / 255
            );
          } else {
            const rock = MINERALS[cell.layers[0]?.rockId];
            if (rock && rock.rgb) {
              tempColor.setRGB(rock.rgb[0] / 255, rock.rgb[1] / 255, rock.rgb[2] / 255);
            } else {
              tempColor.setRGB(0.3, 0.3, 0.3);
            }
          }
        }

        colorAttr.setXYZ(vIdx, tempColor.r, tempColor.g, tempColor.b);
      }
    }
    colorAttr.needsUpdate = true;
  }
}
