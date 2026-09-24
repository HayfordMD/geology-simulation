import * as THREE from 'three';

export class ParticleEffects {
  constructor(scene) {
    this.scene = scene;
    this.activeEffects = [];

    // Magma spark pool
    this.sparkGeometry = new THREE.BufferGeometry();
    const sparkCount = 350;
    this.sparkPositions = new Float32Array(sparkCount * 3);
    this.sparkVelocities = [];

    for (let i = 0; i < sparkCount; i++) {
      this.sparkVelocities.push({
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1
      });
    }

    this.sparkGeometry.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    this.sparkMaterial = new THREE.PointsMaterial({
      color: 0xff5500,
      size: 0.65,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    this.sparkPoints = new THREE.Points(this.sparkGeometry, this.sparkMaterial);
    this.scene.add(this.sparkPoints);
  }

  createShockwave(worldPos, magnitude = 6.0) {
    // Clean up older shockwaves if already 2 active
    const activeWaves = this.activeEffects.filter(e => e.type === 'shockwave');
    if (activeWaves.length >= 2) {
      const oldest = activeWaves[0];
      const idx = this.activeEffects.indexOf(oldest);
      if (idx !== -1) {
        this.scene.remove(oldest.mesh);
        if (oldest.mesh.geometry) oldest.mesh.geometry.dispose();
        if (oldest.mesh.material) oldest.mesh.material.dispose();
        this.activeEffects.splice(idx, 1);
      }
    }

    // Localized seismic wavefront
    const ringGeo = new THREE.RingGeometry(0.06, 0.22, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffaa22,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });

    const mesh = new THREE.Mesh(ringGeo, ringMat);
    const normal = worldPos.clone().normalize();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    mesh.position.copy(worldPos).add(normal.clone().multiplyScalar(0.06));
    this.scene.add(mesh);

    this.activeEffects.push({
      type: 'shockwave',
      mesh,
      life: 0,
      maxLife: 0.9,
      maxScale: 1.8 + Math.min(1.5, magnitude * 0.15)
    });
  }

  createVolcanoPlume(worldPos) {
    const normal = worldPos.clone().normalize();
    let activated = 0;

    for (let i = 0; i < this.sparkVelocities.length; i++) {
      const v = this.sparkVelocities[i];
      if (v.life <= 0 && activated < 65) {
        v.life = 1.0;
        v.maxLife = 1.0 + Math.random() * 0.7;

        // Tangent random spread
        const tangentX = new THREE.Vector3(1, 0, 0).cross(normal).normalize();
        const tangentY = normal.clone().cross(tangentX).normalize();
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.4 + Math.random() * 0.8;

        const spreadVec = tangentX.multiplyScalar(Math.cos(angle) * speed)
          .add(tangentY.multiplyScalar(Math.sin(angle) * speed));

        const upward = normal.clone().multiplyScalar(1.8 + Math.random() * 2.2);
        const totalVel = spreadVec.add(upward);

        v.vx = totalVel.x;
        v.vy = totalVel.y;
        v.vz = totalVel.z;

        this.sparkPositions[i * 3] = worldPos.x;
        this.sparkPositions[i * 3 + 1] = worldPos.y;
        this.sparkPositions[i * 3 + 2] = worldPos.z;
        activated++;
      }
    }
    this.sparkGeometry.attributes.position.needsUpdate = true;
  }

  createDrillMarker(worldPos) {
    const normal = worldPos.clone().normalize();
    const cylGeo = new THREE.CylinderGeometry(0.1, 0.1, 8, 16);
    const cylMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const cylinder = new THREE.Mesh(cylGeo, cylMat);
    cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    cylinder.position.copy(worldPos).add(normal.clone().multiplyScalar(4.0));
    this.scene.add(cylinder);

    this.activeEffects.push({
      type: 'drill',
      mesh: cylinder,
      life: 0,
      maxLife: 0.75
    });
  }

  update(deltaSec) {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const eff = this.activeEffects[i];
      eff.life += deltaSec;
      const progress = eff.life / eff.maxLife;

      if (eff.type === 'shockwave') {
        const scale = 1 + progress * eff.maxScale;
        eff.mesh.scale.set(scale, scale, 1);
        eff.mesh.material.opacity = Math.max(0, 0.85 * (1 - progress));
      } else if (eff.type === 'drill') {
        eff.mesh.material.opacity = Math.max(0, 0.75 * (1 - progress));
      }

      if (progress >= 1.0) {
        this.scene.remove(eff.mesh);
        if (eff.mesh.geometry) eff.mesh.geometry.dispose();
        if (eff.mesh.material) eff.mesh.material.dispose();
        this.activeEffects.splice(i, 1);
      }
    }

    let needsUpdate = false;
    for (let i = 0; i < this.sparkVelocities.length; i++) {
      const v = this.sparkVelocities[i];
      if (v.life > 0) {
        v.life -= deltaSec;
        this.sparkPositions[i * 3] += v.vx * deltaSec;
        this.sparkPositions[i * 3 + 1] += v.vy * deltaSec;
        this.sparkPositions[i * 3 + 2] += v.vz * deltaSec;
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      this.sparkGeometry.attributes.position.needsUpdate = true;
    }
  }
}
