import createCornPlant from './corn';
import createWheatPlant from './wheat';
import createSoybeanPlant from './soybean';
import createCottonPlant from './cotton';
import createRicePlant from './rice';
import { PLANT_HEIGHTS, SCALE_FACTOR, getRandomizedHeight } from './constants';
import * as THREE from 'three';

// Creates a plant based on type and positions it at the specified coordinates
export const createPlant = (type, x, z) => {
  // Get base height for the plant type and apply scale factor
  const baseHeight = PLANT_HEIGHTS[type] * SCALE_FACTOR;
  
  // Apply natural variation to the height
  const actualHeight = getRandomizedHeight(baseHeight);
  
  // Create the plant based on type
  let plantGroup = new THREE.Group();
  
  switch (type) {
    case 'corn':
      plantGroup = createCornPlant(actualHeight);
      break;
    case 'wheat':
      plantGroup = createWheatPlant(actualHeight);
      break;
    case 'soybean':
      plantGroup = createSoybeanPlant(actualHeight);
      break;
    case 'cotton':
      plantGroup = createCottonPlant(actualHeight);
      break;
    case 'rice':
      plantGroup = createRicePlant(actualHeight);
      break;
    default:
      // Fallback to a simple plant if type is not recognized
      const defaultGeometry = new THREE.ConeGeometry(0.1, 0.5, 6);
      const defaultMaterial = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
      const defaultPlant = new THREE.Mesh(defaultGeometry, defaultMaterial);
      defaultPlant.position.y = 0.25;
      defaultPlant.castShadow = true;
      plantGroup.add(defaultPlant);
  }
  
  // Position the plant
  plantGroup.position.set(x, 0, z);
  
  // Add random rotation for natural variation
  plantGroup.rotation.y = Math.random() * Math.PI * 2;
  
  // Mark as a plant for timeline animations
  plantGroup.userData.isPlant = true;
  
  return plantGroup;
};

// Export other constants for use elsewhere
export * from './constants';