import * as THREE from 'three';
import { MINERALS } from '../config/minerals.js';

export class StrataSliceView {
  constructor(scene, strataGrid, crustMesh) {
    this.scene = scene;
    this.grid = strataGrid;
    this.crustMesh = crustMesh;
    this.isActive = false;

    this.group = new THREE.Group();
    this.initCutPlaneVisualizer();
    this.scene.add(this.group);
    this.group.visible = false;
  }

  initCutPlaneVisualizer() {
    // Cross section 3D vertical face along the center of the terrain
    const sliceWidth = this.crustMesh.worldSize;
    const sliceHeight = 6.0;
    const geometry = new THREE.PlaneGeometry(sliceWidth, sliceHeight, 32, 16);

    const material = new THREE.MeshStandardMaterial({
      color: 0x332211,
      roughness: 0.9,
      side: THREE.DoubleSide
    });

    this.sliceMesh = new THREE.Mesh(geometry, material);
    this.sliceMesh.position.set(0, -1.5, 0);
    this.group.add(this.sliceMesh);

    // Glowing magma chamber sphere
    const magmaGeo = new THREE.SphereGeometry(2.5, 24, 24);
    const magmaMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      wireframe: true
    });
    this.magmaSphere = new THREE.Mesh(magmaGeo, magmaMat);
    this.magmaSphere.position.set(0, -2.8, 0);
    this.group.add(this.magmaSphere);
  }

  toggle(active) {
    this.isActive = active !== undefined ? active : !this.isActive;
    this.group.visible = this.isActive;
    return this.isActive;
  }

  update(timeSec) {
    if (!this.isActive) return;
    this.magmaSphere.rotation.y = timeSec * 0.2;
    const pulse = 1 + Math.sin(timeSec * 2.0) * 0.08;
    this.magmaSphere.scale.set(pulse, pulse, pulse);
  }
}
