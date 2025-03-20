// lib/simulation/plantGrowth.ts

import { PLANT_HEIGHTS, SCALE_FACTOR } from '../crops';

/**
 * Update plants in the scene based on growth stage and actual crop heights
 * @param {Object} timelineDay - The current day's data
 * @param {Array} plants - Array of plant objects in the scene
 * @param {string} cropType - Type of crop
 */
export const updatePlantsForGrowthStage = (timelineDay, plants, cropType) => {
  if (!plants || plants.length === 0) return;
  
  const { growthFactor, growthStage } = timelineDay;
  
  // Get the actual base height from crop constants (in meters)
  const baseHeight = PLANT_HEIGHTS[cropType] || 1.0;
  
  // Scale factor applied to match the 3D scene scale
  const scaledBaseHeight = baseHeight * SCALE_FACTOR;
  
  console.log(`Updating ${plants.length} ${cropType} plants for growth stage: ${growthStage}`);
  console.log(`Growth progress: ${(growthFactor * 100).toFixed(1)}%`);
  console.log(`Base height for ${cropType}: ${baseHeight}m, Scaled height: ${scaledBaseHeight}`);
  
  // Update each plant
  plants.forEach(plant => {
    // Skip non-plant objects
    if (!plant.userData || !plant.userData.isPlant) return;
    
    // Apply growth stage-specific scaling
    let plantScale;
    
    switch (growthFactor) {
      case 'SEEDLING':
        // Small plants in seedling stage (10-30% of full size)
        plantScale = 0.1 + (0.2 * (growthFactor / 0.2)); // Gradual growth within seedling stage
        break;
        
      case 'VEGETATIVE':
        // Rapid growth in vegetative stage (30-70% of full size)
        plantScale = 0.3 + (0.4 * ((growthFactor - 0.2) / 0.4)); // Gradual growth within vegetative stage
        break;
        
      case 'REPRODUCTIVE':
        // Slower growth in reproductive stage (70-90% of full size)
        plantScale = 0.7 + (0.2 * ((growthFactor - 0.6) / 0.3)); // Gradual growth within reproductive stage
        break;
        
      case 'MATURE':
        // Full size in mature stage (90-100% of full size)
        plantScale = 0.9 + (0.1 * ((growthFactor - 0.9) / 0.1)); // Gradual growth to full size
        break;
        
      default:
        // Fallback to direct percent if stage not recognized
        plantScale = Math.max(0.1, growthFactor);
    }
    
    // Ensure scale is within reasonable bounds
    plantScale = Math.max(0.1, Math.min(1.0, plantScale));
    
    // Set scale of the plant to match the growth progress
    plant.scale.set(
      plantScale, 
      plantScale, 
      plantScale
    );
    
    // Handle crop-specific visual changes based on growth stage
    handleCropSpecificGrowth(plant, cropType, growthStage);
  });
};

/**
 * Handle crop-specific visual changes at different growth stages
 * @param {Object} plant - The plant 3D object
 * @param {string} cropType - Type of crop
 * @param {string} growthStage - Current growth stage
 */
export const handleCropSpecificGrowth = (plant, cropType, growthStage) => {
  switch (cropType) {
    case 'corn':
      // For corn specifically, show/hide cobs based on growth stage
      if (plant.children && plant.children.length > 2) {
        // Primary cob - show only in reproductive and mature stages
        if (plant.children[2]) {
          plant.children[2].visible = growthStage === 'REPRODUCTIVE' || growthStage === 'MATURE';
        }
        
        // Secondary cob (if exists) - show only in mature stage
        if (plant.children[3]) {
          plant.children[3].visible = growthStage === 'MATURE';
        }
      }
      break;
      
    case 'soybean':
      // For soybean, show pods only in reproductive and mature stages
      if (plant.children) {
        for (let i = 0; i < plant.children.length; i++) {
          // Identify pod elements in the soybean model (typically these are positioned higher up)
          const child = plant.children[i];
          if (child.position && child.position.y > 0.5 && child.geometry && 
              (child.geometry.type === 'CapsuleGeometry' || child.geometry.type === 'SphereGeometry')) {
            child.visible = growthStage === 'REPRODUCTIVE' || growthStage === 'MATURE';
          }
        }
      }
      break;
      
    case 'wheat':
      // For wheat, show wheat heads only in reproductive and mature stages
      if (plant.children && plant.children.length > 1) {
        // Wheat head is typically the second child in our model
        if (plant.children[1]) {
          plant.children[1].visible = growthStage === 'REPRODUCTIVE' || growthStage === 'MATURE';
        }
      }
      break;
      
    case 'cotton':
      // For cotton, show cotton bolls only in reproductive and mature stages
      if (plant.children) {
        for (let i = 0; i < plant.children.length; i++) {
          const child = plant.children[i];
          // Cotton bolls are typically white sphere geometries
          if (child.material && child.material.color && 
              child.material.color.r > 0.8 && child.material.color.g > 0.8 && child.material.color.b > 0.8) {
            child.visible = growthStage === 'REPRODUCTIVE' || growthStage === 'MATURE';
            
            // Make bolls more visible in mature stage
            if (growthStage === 'MATURE') {
              child.scale.set(1.2, 1.2, 1.2);
            }
          }
        }
      }
      break;
      
    case 'rice':
      // For rice, show grains only in reproductive and mature stages
      if (plant.children) {
        for (let i = 0; i < plant.children.length; i++) {
          const child = plant.children[i];
          // Rice grains are typically at the top and have cone geometries
          if (child.geometry && child.geometry.type === 'ConeGeometry') {
            child.visible = growthStage === 'REPRODUCTIVE' || growthStage === 'MATURE';
          }
        }
      }
      break;
      
    default:
      // No specific handling for other crop types
      break;
  }
};