import * as THREE from 'three';

export class TextureGenerator {
  static createTerrainDetailTexture(width = 1024, height = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Base noise and rock striations
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      const ny = y / height;
      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const idx = (y * width + x) * 4;

        // Multi-frequency noise calculation
        const n1 = Math.sin(nx * 40 + Math.cos(ny * 30) * 2.0);
        const n2 = Math.sin(nx * 120 + ny * 80) * 0.5;
        const n3 = Math.cos(nx * 250 - ny * 180) * 0.25;
        const noise = (n1 + n2 + n3 + 1.75) / 3.5;

        // Rock striation bands
        const band = Math.sin(ny * 120 + nx * 10) * 0.15;
        const val = Math.max(0, Math.min(255, Math.round((noise + band) * 255)));

        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 180;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 4;
    return texture;
  }

  static createBumpMap(width = 1024, height = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      const ny = y / height;
      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const idx = (y * width + x) * 4;

        // High frequency craggy mountain relief
        const crag = Math.sin(nx * 150 + Math.sin(ny * 150)) * 0.5 + 0.5;
        const ridge = Math.abs(Math.sin(nx * 60 + ny * 60));
        const bumpVal = Math.round((crag * 0.6 + ridge * 0.4) * 255);

        data[idx] = bumpVal;
        data[idx + 1] = bumpVal;
        data[idx + 2] = bumpVal;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  static createCloudTexture(width = 1024, height = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, width, height);

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      const ny = y / height;
      // Coriolis cloud bands: concentrated at equator and mid-latitudes
      const coriolis = Math.sin(ny * Math.PI * 4) * 0.5 + 0.5;

      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const idx = (y * width + x) * 4;

        // Swirling cloud noise
        const swirl = Math.sin(nx * 16 + Math.cos(ny * 12) * 3) +
                      Math.sin(nx * 32 - ny * 24) * 0.5;
        const cloudDensity = Math.max(0, (swirl * coriolis - 0.25) * 1.8);
        const alpha = Math.min(220, Math.round(cloudDensity * 255));

        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = alpha;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }
}
