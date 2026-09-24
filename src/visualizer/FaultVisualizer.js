import * as THREE from 'three';

export class FaultVisualizer {
  constructor(tectonicPlates, planetMesh) {
    this.plates = tectonicPlates;
    this.planetMesh = planetMesh;
    this.visible = true;

    this.group = new THREE.Group();
    this.initFaultLines();
    this.initPlateVectors();
  }

  initFaultLines() {
    const faultCount = this.plates.faultLines.length;
    this.positions = new Float32Array(faultCount * 2 * 3);
    this.colors = new Float32Array(faultCount * 2 * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: 3,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    this.lineSegments = new THREE.LineSegments(this.geometry, this.material);
    this.group.add(this.lineSegments);
  }

  initPlateVectors() {
    this.vectorGroup = new THREE.Group();
    this.arrows = [];

    for (const plate of this.plates.plates) {
      const origin = this.planetMesh.gridToWorld(plate.cx, plate.cy);
      // Tangent direction on sphere surface
      const normal = origin.clone().normalize();
      const rawDir = new THREE.Vector3(plate.vx, 0, plate.vy).normalize();
      // Project rawDir onto tangent plane
      const tangentDir = rawDir.clone().sub(normal.clone().multiplyScalar(rawDir.dot(normal))).normalize();

      const length = 2.0;
      const hex = 0x00f5d4;

      const arrowHelper = new THREE.ArrowHelper(tangentDir, origin, length, hex, 0.6, 0.4);
      this.vectorGroup.add(arrowHelper);
      this.arrows.push({ arrow: arrowHelper, plate });
    }

    this.group.add(this.vectorGroup);
  }

  setVisible(visible) {
    this.visible = visible;
    this.group.visible = visible;
  }

  update() {
    if (!this.visible) return;

    const faults = this.plates.faultLines;
    const posAttr = this.geometry.attributes.position;
    const colAttr = this.geometry.attributes.color;
    const tempCol = new THREE.Color();

    for (let i = 0; i < faults.length; i++) {
      const f = faults[i];
      const p1 = this.planetMesh.gridToWorld(f.x, f.y);
      const p2 = this.planetMesh.gridToWorld(f.nx, f.ny);

      // Radial offset outward along sphere normals
      const n1 = p1.clone().normalize();
      const n2 = p2.clone().normalize();
      p1.add(n1.multiplyScalar(0.08));
      p2.add(n2.multiplyScalar(0.08));

      posAttr.setXYZ(i * 2, p1.x, p1.y, p1.z);
      posAttr.setXYZ(i * 2 + 1, p2.x, p2.y, p2.z);

      const stressRatio = Math.min(1.0, f.stress / f.maxStress);

      if (f.type === 'convergent') {
        tempCol.setHSL(0.95 - stressRatio * 0.15, 1.0, 0.4 + stressRatio * 0.4);
      } else if (f.type === 'divergent') {
        tempCol.setHSL(0.55 - stressRatio * 0.15, 1.0, 0.4 + stressRatio * 0.4);
      } else {
        tempCol.setHSL(0.15 - stressRatio * 0.15, 1.0, 0.4 + stressRatio * 0.4);
      }

      colAttr.setXYZ(i * 2, tempCol.r, tempCol.g, tempCol.b);
      colAttr.setXYZ(i * 2 + 1, tempCol.r, tempCol.g, tempCol.b);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Update plate velocity arrow origins & tangent directions
    for (const item of this.arrows) {
      const origin = this.planetMesh.gridToWorld(item.plate.cx, item.plate.cy);
      const normal = origin.clone().normalize();
      origin.add(normal.clone().multiplyScalar(0.4));
      item.arrow.position.copy(origin);

      const rawDir = new THREE.Vector3(item.plate.vx, 0, item.plate.vy).normalize();
      const tangentDir = rawDir.clone().sub(normal.clone().multiplyScalar(rawDir.dot(normal))).normalize();
      item.arrow.setDirection(tangentDir);
    }
  }
}
