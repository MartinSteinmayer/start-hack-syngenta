import * as THREE from 'three';
import { createPlant, PLANTS_PER_HECTARE } from '../crops';
import { createFieldSoil, createFieldBoundary } from '../environment';
import { 
  scalePolygonToHectares, 
  triangulatePolygon, 
  getRandomPointInTriangle, 
  createFieldInfoSign
} from './fieldUtils';
import { adjustCameraView } from './cameraUtils';

/**
 * Creates a crop field simulation
 * @param {Object} simulation - Simulation parameters
 * @param {THREE.Scene} scene - The THREE.js scene
 * @param {THREE.PerspectiveCamera} camera - The THREE.js camera
 * @param {OrbitControls} controls - The OrbitControls instance
 * @returns {Object} - Created simulation objects
 */
export const createCropFieldSimulation = (simulation, scene, camera, controls) => {
  console.log("Creating simulation with params:", simulation);
  console.log("Scene, camera, controls available:", !!scene, !!camera, !!controls);
  
  const { type, hectares, density, polygon } = simulation;
  const simulationObjects = [];
  
  try {
    if (!scene) throw new Error("Scene is not initialized");
    if (!camera) throw new Error("Camera is not initialized");
    if (!controls) throw new Error("Controls are not initialized");
    
    // Scale the polygon based on hectares
    const scaledPolygon = scalePolygonToHectares(polygon, hectares);
    console.log("Scaled polygon vertices:", scaledPolygon);
    
    // Create field boundary
    const boundary = createFieldBoundary(scene, scaledPolygon);
    simulationObjects.push(boundary);
    
    // Create soil
    const soil = createFieldSoil(scene, scaledPolygon);
    simulationObjects.push(soil);
    
    // Triangulate the polygon for plant placement
    const triangles = triangulatePolygon(scaledPolygon);
    console.log(`Created ${triangles.length} triangles for plant placement`);
    
    // Calculate how many plants to create based on real-world density and user-specified density percentage
    const baseCount = PLANTS_PER_HECTARE[type] * hectares;
    const plantCount = Math.floor((density / 100) * baseCount * 0.01); // Scale down for performance but keep more plants
    console.log(`Creating ${plantCount} plants of type ${type}`);
    
    // Create plants
    for (let i = 0; i < plantCount; i++) {
      // Pick a random triangle
      const triangle = triangles[Math.floor(Math.random() * triangles.length)];
      
      // Get random point within the triangle
      const { x, z } = getRandomPointInTriangle(triangle);
      
      // Create plant
      const plant = createPlant(type, x, z);
      scene.add(plant);
      simulationObjects.push(plant);
    }
    
    // Add information sign - DISABLED per user request
    // const signObjects = createFieldInfoSign(scene, simulation, scaledPolygon);
    // simulationObjects.push(...signObjects);
    
    // Adjust camera to view the entire field
    adjustCameraView(scaledPolygon, camera, controls);
    
    console.log(`Successfully created simulation with ${simulationObjects.length} objects`);
    return { success: true, objects: simulationObjects };
  } catch (error) {
    console.error('Error creating simulation:', error);
    return { success: false, error: error.message, objects: simulationObjects };
  }
};

// Export other utilities
export * from './fieldUtils';
export * from './cameraUtils';
export * from './sceneSetup';