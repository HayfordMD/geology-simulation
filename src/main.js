import { GeologyEngine } from './simulation/GeologyEngine.js';
import { Scene3D } from './visualizer/Scene3D.js';
import { UIManager } from './ui/UIManager.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');

  // Initialize Core Geological Engine
  const engine = new GeologyEngine();

  // Initialize Three.js 3D Visualizer
  const scene3D = new Scene3D(container, engine);

  // Initialize UI & Dashboard Manager
  const ui = new UIManager(engine, scene3D);

  // UI Tick Loop (~15 fps for smooth numbers without overhead)
  setInterval(() => {
    ui.updateHUD();
  }, 80);

  // Welcome toast
  setTimeout(() => {
    ui.showToast('🌋 Welcome to GeoGenesis 3D! Click anywhere on the crust to drill core samples.', 'info');
    ui.showToast('⏳ Simulating at 10 years/second. Use time controls to warp through millions of years!', 'notice');
  }, 600);
});
