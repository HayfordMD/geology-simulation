import * as THREE from 'three';

export class CoreXRayView {
  constructor(scene, planetRadius = 14.0) {
    this.scene = scene;
    this.planetRadius = planetRadius;
    this.isActive = false;

    this.group = new THREE.Group();
    this.initInnerCore();
    this.initOuterCore();
    this.initMantle();
    this.initMagneticField();

    this.group.visible = false;
    this.scene.add(this.group);
  }

  initInnerCore() {
    // Solid incandescent iron-nickel inner core (~24% radius)
    const r = this.planetRadius * 0.24;
    const geo = new THREE.SphereGeometry(r, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffe6a3,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.9
    });

    this.innerCore = new THREE.Mesh(geo, mat);
    this.group.add(this.innerCore);

    // Core point light illuminating the mantle from inside!
    this.coreLight = new THREE.PointLight(0xffaa44, 2.5, this.planetRadius * 1.5);
    this.group.add(this.coreLight);
  }

  initOuterCore() {
    // Liquid convective outer core dynamo (~52% radius)
    const r = this.planetRadius * 0.52;
    const geo = new THREE.SphereGeometry(r, 32, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      emissive: 0xff3300,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.85,
      roughness: 0.4,
      metalness: 0.8,
      wireframe: false
    });

    this.outerCore = new THREE.Mesh(geo, mat);
    this.group.add(this.outerCore);

    // Convective dynamo shell wireframe
    const wireGeo = new THREE.SphereGeometry(r * 1.01, 24, 16);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffbb33,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    this.dynamoWire = new THREE.Mesh(wireGeo, wireMat);
    this.group.add(this.dynamoWire);
  }

  initMantle() {
    // Convective silicate mantle layer (~86% radius)
    const r = this.planetRadius * 0.86;
    const geo = new THREE.SphereGeometry(r, 32, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x4a0e05,
      emissive: 0x300500,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.65,
      roughness: 0.8
    });

    this.mantle = new THREE.Mesh(geo, mat);
    this.group.add(this.mantle);
  }

  initMagneticField() {
    // Dipole magnetic field loops
    this.fieldLinesGroup = new THREE.Group();
    const loopCount = 6;
    const radius = this.planetRadius * 1.5;

    for (let i = 0; i < loopCount; i++) {
      const curve = new THREE.EllipseCurve(
        0, 0,
        radius * 0.7, radius * 1.3,
        0, 2 * Math.PI,
        false,
        0
      );
      const points = curve.getPoints(40);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Line(geo, mat);
      line.rotation.y = (i / loopCount) * Math.PI;
      this.fieldLinesGroup.add(line);
    }

    this.group.add(this.fieldLinesGroup);
  }

  toggle(active) {
    this.isActive = active !== undefined ? active : !this.isActive;
    this.group.visible = this.isActive;
    return this.isActive;
  }

  update(timeSec) {
    if (!this.isActive) return;

    // Swirling liquid outer core dynamo rotation
    this.outerCore.rotation.y = timeSec * 0.25;
    this.dynamoWire.rotation.y = -timeSec * 0.15;
    this.dynamoWire.rotation.x = Math.sin(timeSec * 0.5) * 0.1;

    // Mantle convection pulse
    const pulse = 1.0 + Math.sin(timeSec * 1.2) * 0.015;
    this.mantle.scale.set(pulse, pulse, pulse);

    // Magnetic field rotation
    this.fieldLinesGroup.rotation.y = timeSec * 0.08;
  }
}
