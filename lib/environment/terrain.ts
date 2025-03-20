import * as THREE from 'three';

/**
 * Creates terrain with ground planes and boundaries
 * @param {THREE.Scene} scene - The THREE.js scene
 */
export const createTerrain = (scene) => {
  const terrainObjects = [];
  
  // Large ground plane (distant terrain)
  const groundGeo = new THREE.PlaneGeometry(2000, 2000, 100, 100);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x336633,
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0.2
  });
  
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  scene.add(ground);
  terrainObjects.push(ground);
  
  // Create farm field ground (cultivatable area)
  const farmGroundGeo = new THREE.PlaneGeometry(400, 400, 1, 1);
  const farmGroundMat = new THREE.MeshStandardMaterial({
    color: 0x5e4e35,
    side: THREE.DoubleSide,
    roughness: 0.9,
    metalness: 0
  });
  
  const farmGround = new THREE.Mesh(farmGroundGeo, farmGroundMat);
  farmGround.rotation.x = -Math.PI / 2;
  farmGround.position.y = 0;
  farmGround.receiveShadow = true;
  scene.add(farmGround);
  terrainObjects.push(farmGround);
  
  // Field borders (overall boundary)
  const borderMat = new THREE.LineBasicMaterial({ color: 0x000000 });
  const borderGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-200, 0.01, -200),
    new THREE.Vector3(-200, 0.01, 200),
    new THREE.Vector3(200, 0.01, 200),
    new THREE.Vector3(200, 0.01, -200),
    new THREE.Vector3(-200, 0.01, -200)
  ]);
  const border = new THREE.Line(borderGeo, borderMat);
  scene.add(border);
  terrainObjects.push(border);
  
  return terrainObjects;
};

/**
 * Creates a soil mesh for a specific field based on polygon shape
 * @param {THREE.Scene} scene - The THREE.js scene
 * @param {Array} vertices - Array of vertices defining the field
 * @returns {THREE.Mesh} - The created soil mesh
 */
export const createFieldSoil = (scene, vertices) => {
  // Create a 2D shape from the vertices
  const shape = new THREE.Shape();
  shape.moveTo(vertices[0][0], vertices[0][2]);
  
  for (let i = 1; i < vertices.length; i++) {
    shape.lineTo(vertices[i][0], vertices[i][2]);
  }
  
  // Close the shape
  shape.lineTo(vertices[0][0], vertices[0][2]);
  
  // Create geometry from shape
  const soilGeometry = new THREE.ShapeGeometry(shape);
  const soilMaterial = new THREE.MeshStandardMaterial({
    color: 0x6d4c41,
    roughness: 0.9,
    metalness: 0
  });
  
  const soil = new THREE.Mesh(soilGeometry, soilMaterial);
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.005;
  soil.receiveShadow = true;
  scene.add(soil);
  
  return soil;
};

/**
 * Creates a boundary line for a field
 * @param {THREE.Scene} scene - The THREE.js scene
 * @param {Array} vertices - Array of vertices defining the field boundary
 * @returns {THREE.Line} - The created boundary line
 */
export const createFieldBoundary = (scene, vertices) => {
  const borderMat = new THREE.LineBasicMaterial({ 
    color: 0x000000,
    linewidth: 2
  });
  
  const points = [];
  
  // Create points for the line
  vertices.forEach(vertex => {
    points.push(new THREE.Vector3(vertex[0], 0.01, vertex[2]));
  });
  
  // Close the loop
  points.push(new THREE.Vector3(vertices[0][0], 0.01, vertices[0][2]));
  
  const borderGeo = new THREE.BufferGeometry().setFromPoints(points);
  const border = new THREE.Line(borderGeo, borderMat);
  scene.add(border);
  
  return border;
};