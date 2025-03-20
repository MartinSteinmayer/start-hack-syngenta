import * as THREE from 'three';

/**
 * Creates cloud objects in the scene
 * @param {THREE.Scene} scene - The THREE.js scene
 * @param {number} count - Number of clouds to create
 * @returns {Array} - Array of cloud objects
 */
export const createClouds = (scene, count = 20) => {
  const clouds = [];
  
  for (let i = 0; i < count; i++) {
    const cloudGroup = new THREE.Group();
    
    // Random position and size
    const x = Math.random() * 400 - 200;
    const y = Math.random() * 30 + 50;
    const z = Math.random() * 400 - 200;
    const scale = Math.random() * 2 + 1;
    
    // Create cloud parts
    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
    const cloudPartsCount = Math.floor(Math.random() * 5) + 3;
    
    for (let j = 0; j < cloudPartsCount; j++) {
      const cloudGeo = new THREE.SphereGeometry(scale, 7, 7);
      const cloudPart = new THREE.Mesh(cloudGeo, cloudMaterial);
      
      // Position cloud parts
      const partX = (Math.random() - 0.5) * scale * 3;
      const partY = (Math.random() - 0.5) * scale;
      const partZ = (Math.random() - 0.5) * scale * 3;
      
      cloudPart.position.set(partX, partY, partZ);
      cloudGroup.add(cloudPart);
    }
    
    // Set cloud position and speed
    cloudGroup.position.set(x, y, z);
    cloudGroup.userData = { speed: Math.random() * 0.05 + 0.01 };
    
    // Add cloud to scene and collection
    scene.add(cloudGroup);
    clouds.push(cloudGroup);
  }
  
  return clouds;
};

/**
 * Updates cloud positions for animation
 * @param {Array} clouds - Array of cloud objects
 */
export const animateClouds = (clouds) => {
  if (clouds.length > 0) {
    clouds.forEach(cloud => {
      cloud.position.x += cloud.userData.speed;
      if (cloud.position.x > 200) {
        cloud.position.x = -200;
      }
    });
  }
};