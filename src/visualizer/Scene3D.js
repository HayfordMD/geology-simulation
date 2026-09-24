import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PlanetMesh } from './PlanetMesh.js';
import { FaultVisualizer } from './FaultVisualizer.js';
import { ParticleEffects } from './ParticleEffects.js';
import { CoreXRayView } from './CoreXRayView.js';
import { AudioFX } from './AudioFX.js';

export class Scene3D {
  constructor(canvasContainer, engine) {
    this.container = canvasContainer;
    this.engine = engine;
    this.audio = new AudioFX();

    this.activeTool = 'drill';
    this.onTerrainClickCallback = null;

    this.initScene();
    this.initLights();
    this.initMeshes();
    this.initControls();
    this.initRaycaster();
    this.bindEvents();

    this.animate = this.animate.bind(this);
    this.clock = new THREE.Clock();
    requestAnimationFrame(this.animate);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070b);

    this.initStarfield();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 16, 38);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  initStarfield() {
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 180 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi);
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.1,
      transparent: true,
      opacity: 0.8
    });
    this.starfield = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starfield);
  }

  initLights() {
    this.ambientLight = new THREE.AmbientLight(0xfff0dd, 0.45);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.sunLight.position.set(45, 25, 35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 120;
    const d = 25;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);

    const rimLight = new THREE.DirectionalLight(0x284b63, 0.5);
    rimLight.position.set(-35, -15, -30);
    this.scene.add(rimLight);
  }

  initMeshes() {
    this.planetMesh = new PlanetMesh(this.engine.grid, this.engine.plates, 14.0);
    this.scene.add(this.planetMesh.group);

    this.faultVisualizer = new FaultVisualizer(this.engine.plates, this.planetMesh);
    this.scene.add(this.faultVisualizer.group);

    this.particles = new ParticleEffects(this.scene);
    this.coreXRay = new CoreXRayView(this.scene, 14.0);

    this.lastQuakeVisualTime = 0;
    this.engine.on('quake', (quake) => {
      const now = Date.now();
      // Always show player-triggered quakes; rate-limit automatic background quakes to 1 per 750ms
      if (quake.forcedByPlayer || now - this.lastQuakeVisualTime > 750) {
        if (!quake.forcedByPlayer) this.lastQuakeVisualTime = now;
        const pos = this.planetMesh.gridToWorld(quake.x, quake.y);
        this.particles.createShockwave(pos, quake.magnitude);
        this.audio.playQuake(quake.magnitude);
      }
    });

    this.engine.on('volcano', (event) => {
      const pos = this.planetMesh.gridToWorld(event.x, event.y);
      this.particles.createVolcanoPlume(pos);
      this.audio.playVolcano();
    });

    this.engine.on('meteor', (event) => {
      const pos = this.planetMesh.gridToWorld(event.x, event.y);
      this.particles.createShockwave(pos, 9.0);
      this.audio.playQuake(8.5);
    });

    this.engine.on('discovery', () => {
      this.audio.playDiscovery();
    });
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 16;
    this.controls.maxDistance = 75;
    this.controls.target.set(0, 0, 0);
  }

  initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoverMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.45, 24),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide })
    );
    this.hoverMarker.visible = false;
    this.scene.add(this.hoverMarker);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    const dom = this.renderer.domElement;
    let isDragging = false;
    let downX = 0, downY = 0;

    dom.addEventListener('pointerdown', (e) => {
      isDragging = false;
      downX = e.clientX;
      downY = e.clientY;
    });

    dom.addEventListener('pointermove', (e) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) {
        isDragging = true;
      }

      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObject(this.planetMesh.terrainMesh);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const normal = hit.point.clone().normalize();
        this.hoverMarker.position.copy(hit.point).add(normal.clone().multiplyScalar(0.08));
        this.hoverMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        this.hoverMarker.visible = true;
      } else {
        this.hoverMarker.visible = false;
      }
    });

    dom.addEventListener('pointerup', (e) => {
      if (isDragging) return;

      this.audio.init();

      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObject(this.planetMesh.terrainMesh);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const gridCoords = this.planetMesh.worldToGrid(hit.point);
        this.handleToolAction(gridCoords.x, gridCoords.y, hit.point);
      }
    });
  }

  handleToolAction(gridX, gridY, worldPos) {
    if (this.activeTool === 'drill') {
      this.particles.createDrillMarker(worldPos);
      this.audio.playDrill();
      const sample = this.engine.triggerCoreDrill(gridX, gridY);
      if (this.onTerrainClickCallback) {
        this.onTerrainClickCallback('drill', sample);
      }
    } else if (this.activeTool === 'slip') {
      const quake = this.engine.triggerFaultSlip(gridX, gridY);
      if (this.onTerrainClickCallback) {
        this.onTerrainClickCallback('slip', quake);
      }
    } else if (this.activeTool === 'volcano') {
      const volcano = this.engine.spawnVolcano(gridX, gridY);
      if (this.onTerrainClickCallback) {
        this.onTerrainClickCallback('volcano', volcano);
      }
    } else if (this.activeTool === 'ice') {
      this.engine.carveGlaciers(gridX, gridY);
      this.particles.createShockwave(worldPos, 4.0);
      this.audio.playClick();
      if (this.onTerrainClickCallback) {
        this.onTerrainClickCallback('ice', { gridX, gridY });
      }
    } else if (this.activeTool === 'deluge') {
      this.engine.accelerateWeathering(gridX, gridY);
      this.audio.playClick();
      if (this.onTerrainClickCallback) {
        this.onTerrainClickCallback('deluge', { gridX, gridY });
      }
    } else if (this.activeTool === 'meteor') {
      const meteor = this.engine.triggerMeteorImpact(gridX, gridY);
      if (this.onTerrainClickCallback) {
        this.onTerrainClickCallback('meteor', meteor);
      }
    }
  }

  onTerrainClick(cb) {
    this.onTerrainClickCallback = cb;
  }

  setActiveTool(toolId) {
    this.activeTool = toolId;
  }

  setVisualMode(mode) {
    this.planetMesh.setDisplayMode(mode);
    if (mode === 'plates' || mode === 'stress') {
      this.faultVisualizer.setVisible(true);
    }
  }

  setTerrainFilter(filterId) {
    this.planetMesh.setTerrainFilter(filterId);
  }

  toggleFaultLines(visible) {
    this.faultVisualizer.setVisible(visible);
  }

  toggleXRay(active) {
    const isNowActive = this.coreXRay.toggle(active);
    this.planetMesh.setXRay(isNowActive);
    return isNowActive;
  }

  animate() {
    requestAnimationFrame(this.animate);

    const deltaSec = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.engine.update(deltaSec);

    this.planetMesh.updateGeometry();
    this.planetMesh.updateClouds(deltaSec);
    this.faultVisualizer.update();
    this.particles.update(deltaSec);
    this.coreXRay.update(elapsedTime);
    this.controls.update();

    if (this.starfield) {
      this.starfield.rotation.y = elapsedTime * 0.005;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
