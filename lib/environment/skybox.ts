import * as THREE from 'three';

/**
 * Creates skybox with distant horizons
 * @param {THREE.Scene} scene - The THREE.js scene
 */
export const createSkybox = (scene) => {
  // Sky dome
  const skyGeo = new THREE.SphereGeometry(1000, 32, 32);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    side: THREE.BackSide
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);
  
  // Distant horizon
  const horizonGeo = new THREE.CylinderGeometry(1000, 1000, 10, 64, 1, true);
  
  // Create canvas for horizon texture
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  // Draw gradient sky
  const gradientSky = ctx.createLinearGradient(0, 0, 0, 128);
  gradientSky.addColorStop(0, '#87ceeb');
  gradientSky.addColorStop(1, '#a7d8f7');
  ctx.fillStyle = gradientSky;
  ctx.fillRect(0, 0, 1024, 128);
  
  // Draw green hills
  ctx.fillStyle = '#228B22';
  
  // Draw random hills
  let x = 0;
  while (x < 1024) {
    const width = Math.random() * 100 + 50;
    const height = Math.random() * 30 + 20;
    ctx.beginPath();
    ctx.moveTo(x, 128);
    ctx.quadraticCurveTo(x + width/2, 128 - height, x + width, 128);
    ctx.fill();
    x += width;
  }
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  
  const horizonMat = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    transparent: true
  });
  
  const horizon = new THREE.Mesh(horizonGeo, horizonMat);
  horizon.position.y = -40;
  scene.add(horizon);
  
  return { sky, horizon };
};