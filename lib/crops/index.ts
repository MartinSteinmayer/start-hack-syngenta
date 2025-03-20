import { PLANT_HEIGHTS, SCALE_FACTOR, getRandomizedHeight } from './constants';
import { loadModel, getCropModelPaths } from '../services/modelLoader';
import * as THREE from 'three';

// Fallback creation methods if models fail to load
import createCornPlant from './corn';
import createWheatPlant from './wheat';
import createSoybeanPlant from './soybean';
import createCottonPlant from './cotton';
import createRicePlant from './rice';

// Get model paths
const cropModelPaths = getCropModelPaths();

// Track loading status
let modelsPreloaded = false;

/**
 * Preload all crop models - call this at app initialization
 */
export const preloadCropModels = async () => {
  try {
    const modelPaths = Object.values(cropModelPaths);
    for (const path of modelPaths) {
      await loadModel(path);
    }
    modelsPreloaded = true;
    console.log('All crop models preloaded successfully');
  } catch (error) {
    console.error('Error preloading crop models:', error);
  }
};

/**
 * Creates a plant based on type and positions it at the specified coordinates
 * Uses 3D models when available, falls back to geometry-based models if needed
 * @param {string} type - Type of crop
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @returns {THREE.Group} - The created plant 3D object
 */
export const createPlant = async (type: string, x: number, z: number): Promise<THREE.Group> => {
  // Get base height for the plant type and apply scale factor
  const baseHeight = PLANT_HEIGHTS[type] * SCALE_FACTOR;
  
  // Apply natural variation to the height
  const actualHeight = getRandomizedHeight(baseHeight);
  
  // Create a container group for the plant
  const plantGroup = new THREE.Group();
  plantGroup.position.set(x, 0, z);
  
  // Add random rotation for natural variation
  plantGroup.rotation.y = Math.random() * Math.PI * 2;
  
  // Mark as a plant for timeline animations
  plantGroup.userData.isPlant = true;
  plantGroup.userData.cropType = type;
  plantGroup.userData.baseHeight = baseHeight;
  
  try {
    // Try to load the 3D model for this crop type
    if (cropModelPaths[type]) {
      const model = await loadModel(cropModelPaths[type]);
      
      // Scale model appropriately based on desired height
      const modelHeight = getModelHeight(model);
      
      // Calculate scale based on desired height and add scaling factor
      // We multiply by 3 to make the models significantly larger
      const scaleRatio = (actualHeight / modelHeight) * 3.0;
      
      model.scale.set(scaleRatio, scaleRatio, scaleRatio);
      
      // Log scaling information for debugging
      console.log(`Model scaling for ${type}: Model height = ${modelHeight}, Desired height = ${actualHeight}, Scale ratio = ${scaleRatio}`);
      
      // Mark model components for growth animation
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Store original scale for growth animations
          child.userData.originalScale = { 
            x: child.scale.x, 
            y: child.scale.y, 
            z: child.scale.z 
          };
        }
      });
      
      // Store original scale for the model
      model.userData.originalScale = { 
        x: model.scale.x, 
        y: model.scale.y, 
        z: model.scale.z 
      };

      // Add model to the plant group
      plantGroup.add(model);
      
      // Tag specific parts for growth animation
      tagPlantParts(plantGroup, type);
    } else {
      // Fallback to geometry-based plant if no model path exists
      throw new Error(`No model path defined for crop type: ${type}`);
    }
  } catch (error) {
    console.warn(`Failed to load 3D model for ${type}, falling back to geometry:`, error);
    
    // Fallback to geometry-based models
    let fallbackPlant;
    switch (type) {
      case 'corn':
        fallbackPlant = createCornPlant(actualHeight);
        break;
      case 'wheat':
        fallbackPlant = createWheatPlant(actualHeight);
        break;
      case 'soybean':
        fallbackPlant = createSoybeanPlant(actualHeight);
        break;
      case 'cotton':
        fallbackPlant = createCottonPlant(actualHeight);
        break;
      case 'rice':
        fallbackPlant = createRicePlant(actualHeight);
        break;
      default:
        // Create a simple default plant
        const defaultGeometry = new THREE.ConeGeometry(0.1, 0.5, 6);
        const defaultMaterial = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
        fallbackPlant = new THREE.Group();
        const defaultMesh = new THREE.Mesh(defaultGeometry, defaultMaterial);
        defaultMesh.position.y = 0.25;
        defaultMesh.castShadow = true;
        fallbackPlant.add(defaultMesh);
    }
    
    plantGroup.add(fallbackPlant);
  }
  
  return plantGroup;
};

/**
 * Helper function to get the height of a model by analyzing its bounding box
 */
function getModelHeight(model: THREE.Group): number {
  const boundingBox = new THREE.Box3().setFromObject(model);
  return boundingBox.max.y - boundingBox.min.y;
}

/**
 * Tag specific parts of the plant model for growth animation
 * This helps identify which parts to show/hide at different growth stages
 */
function tagPlantParts(plantGroup: THREE.Group, cropType: string) {
  // Traverse the model to find and tag specific parts
  plantGroup.traverse((child) => {
    // Skip non-meshes
    if (!(child instanceof THREE.Mesh)) return;
    
    const name = child.name.toLowerCase();
    
    // Tag parts by their names in the 3D model
    if (name.includes('fruit') || name.includes('cob') || name.includes('grain') || 
        name.includes('pod') || name.includes('boll') || name.includes('head')) {
      child.userData.isFruit = true;
    }
    
    if (name.includes('leaf')) {
      child.userData.isLeaf = true;
    }
    
    if (name.includes('stalk') || name.includes('stem') || name.includes('trunk')) {
      child.userData.isStalk = true;
    }
    
    if (name.includes('flower')) {
      child.userData.isFlower = true;
    }
    
    // Additional crop-specific tags
    if (cropType === 'corn' && (name.includes('cob') || name.includes('ear'))) {
      child.userData.isCob = true;
    }
    
    if (cropType === 'wheat' && name.includes('head')) {
      child.userData.isWheatHead = true;
    }
    
    if (cropType === 'cotton' && name.includes('boll')) {
      child.userData.isCottonBoll = true;
    }
  });
}

// Create a synchronous version for the simulation setup
// This will use a placeholder if the model isn't loaded yet
export const createPlantSync = (type: string, x: number, z: number): THREE.Group => {
  const plantGroup = new THREE.Group();
  plantGroup.position.set(x, 0, z);
  plantGroup.rotation.y = Math.random() * Math.PI * 2;
  plantGroup.userData.isPlant = true;
  plantGroup.userData.cropType = type;
  plantGroup.userData.baseHeight = PLANT_HEIGHTS[type] * SCALE_FACTOR;
  plantGroup.userData.pendingModelLoad = true;
  
  // Create a simple placeholder
  const placeholderGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.3, 6);
  const placeholderMaterial = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
  const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
  placeholder.position.y = 0.15;
  placeholder.castShadow = true;
  plantGroup.add(placeholder);
  
  // Schedule async replacement with the real model
  createPlant(type, 0, 0).then(realPlant => {
    // Remove the placeholder
    while (plantGroup.children.length > 0) {
      plantGroup.remove(plantGroup.children[0]);
    }
    
    // Transfer the loaded model to this group
    while (realPlant.children.length > 0) {
      plantGroup.add(realPlant.children[0]);
    }
    
    // Copy relevant userData
    Object.assign(plantGroup.userData, realPlant.userData);
    plantGroup.userData.pendingModelLoad = false;
  }).catch(error => {
    console.error(`Error loading model for ${type}:`, error);
    plantGroup.userData.pendingModelLoad = false;
  });
  
  return plantGroup;
};

// Export other constants for use elsewhere
export * from './constants';