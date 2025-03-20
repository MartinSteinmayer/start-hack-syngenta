import { PLANT_HEIGHTS, SCALE_FACTOR } from '../crops';
import * as THREE from 'three';

// Growth stage modifiers (0-1) for different growth phases
export const GROWTH_STAGES = {
    SEEDLING: 0.2,      // Initial growth
    VEGETATIVE: 0.6,    // Main growth phase
    REPRODUCTIVE: 0.9,  // Flowering/fruiting phase
    MATURE: 1.0         // Fully mature
};

/**
 * Update plants in the scene based on growth stage and actual crop heights
 * Supports both geometry-based plants and 3D models
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

    // Update each plant
    plants.forEach(plant => {
        // Skip non-plant objects
        if (!plant.userData || !plant.userData.isPlant) return;

        // Skip plants that are still loading their models
        if (plant.userData.pendingModelLoad) return;

        // Apply growth stage-specific scaling
        const plantScale = calculatePlantScale(growthFactor, growthStage);

        // Determine if this is a 3D model or a geometry-based plant
        const isModel = plant.userData.cropType && !plant.userData.isLegacyGeometry;

        if (isModel) {
            // Update 3D model plant
            updateModelPlant(plant, plantScale, growthStage, cropType);
        } else {
            // Update geometry-based plant (legacy)
            updateGeometryPlant(plant, plantScale, growthStage, cropType);
        }
    });
};

/**
 * Calculate plant scale based on growth factor and stage
 */
function calculatePlantScale(growthFactor, growthStage) {
    let plantScale;

    switch (growthStage) {
        case 'SEEDLING':
            // Small plants in seedling stage (10-30% of full size)
            plantScale = 0.1 + (0.2 * Math.min(1, growthFactor / 0.2));
            break;

        case 'VEGETATIVE':
            // Rapid growth in vegetative stage (30-70% of full size)
            plantScale = 0.3 + (0.4 * Math.min(1, (growthFactor - 0.2) / 0.4));
            break;

        case 'REPRODUCTIVE':
            // Slower growth in reproductive stage (70-90% of full size)
            plantScale = 0.7 + (0.2 * Math.min(1, (growthFactor - 0.6) / 0.3));
            break;

        case 'MATURE':
            // Full size in mature stage (90-100% of full size)
            plantScale = 0.9 + (0.1 * Math.min(1, (growthFactor - 0.9) / 0.1));
            break;

        default:
            // Fallback to direct percent if stage not recognized
            plantScale = Math.max(0.1, growthFactor);
    }

    // Ensure scale is within reasonable bounds
    return Math.max(0.1, Math.min(1.0, plantScale));
}

/**
 * Update a plant based on 3D model approach
 */
function updateModelPlant(plant, plantScale, growthStage, cropType) {
    // If the plant has an originalScale stored, use that as a reference
    const baseScale = plant.userData.originalScale || { x: 1, y: 1, z: 1 };

    // Apply plant-wide scaling (may be refined for particular plant components)
    plant.scale.set(
        baseScale.x * plantScale,
        baseScale.y * plantScale,
        baseScale.z * plantScale
    );

    // Handle visibility of different plant parts based on growth stage
    plant.traverse((child) => {
        // Skip non-meshes
        if (!(child instanceof THREE.Mesh)) return;

        // Handle fruit/grain visibility based on growth stage
        if (child.userData.isFruit || child.userData.isCob ||
            child.userData.isWheatHead || child.userData.isCottonBoll) {
            // Fruits only appear in reproductive and mature stages
            child.visible = (growthStage === 'REPRODUCTIVE' || growthStage === 'MATURE');

            // Enhance fruits in mature stage
            if (growthStage === 'MATURE' && child.userData.originalScale) {
                const fruitScale = 1.2; // Slightly larger fruits when mature
                child.scale.set(
                    child.userData.originalScale.x * fruitScale,
                    child.userData.originalScale.y * fruitScale,
                    child.userData.originalScale.z * fruitScale
                );
            }
        }

        // Handle flowers which appear in reproductive stage then become fruit
        if (child.userData.isFlower) {
            // Flowers appear in early reproductive stage and may disappear in mature
            child.visible = (growthStage === 'REPRODUCTIVE' && plantScale < 0.85);
        }

        // Apply crop-specific visual effects
        applyCropSpecificEffects(child, cropType, growthStage, plantScale);
    });
}

/**
 * Apply crop-specific visual effects for 3D models
 */
function applyCropSpecificEffects(meshNode, cropType, growthStage, plantScale) {
    switch (cropType) {
        case 'corn':
            // For corn specifically, enhance cob visibility based on growth
            if (meshNode.userData.isCob) {
                // Primary cob - show only in reproductive and mature stages
                meshNode.visible = growthStage === 'REPRODUCTIVE' || growthStage === 'MATURE';

                // Determine which cob this is (primary or secondary)
                const isPrimaryCob = meshNode.position.y > meshNode.parent.position.y * 0.6;
                const isSecondaryCob = !isPrimaryCob;

                // Secondary cobs only appear in mature stage with healthy plants
                if (isSecondaryCob) {
                    meshNode.visible = growthStage === 'MATURE' && plantScale > 0.9;
                }
            }
            break;

        case 'wheat':
            // Wheat heads gradually change color as they mature
            if (meshNode.userData.isWheatHead && meshNode.material) {
                if (growthStage === 'REPRODUCTIVE') {
                    // Transition from green to golden
                    const greenToGold = Math.min(1, (plantScale - 0.7) / 0.2);
                    meshNode.material.color.setRGB(
                        0.5 + (0.5 * greenToGold),  // R: 0.5 to 1.0
                        0.5 + (0.3 * greenToGold),  // G: 0.5 to 0.8
                        0.2                         // B: constant low value
                    );
                } else if (growthStage === 'MATURE') {
                    // Golden when mature
                    meshNode.material.color.setRGB(0.95, 0.85, 0.2);
                }
            }
            break;

        case 'cotton':
            // Cotton bolls gradually open as they mature
            if (meshNode.userData.isCottonBoll) {
                if (growthStage === 'REPRODUCTIVE') {
                    // Bolls are green and closed in early reproductive stage
                    if (plantScale < 0.8 && meshNode.material) {
                        meshNode.material.color.setRGB(0.2, 0.7, 0.3);
                    } else {
                        // Start to open/whiten in late reproductive
                        if (meshNode.material) {
                            const openingFactor = (plantScale - 0.8) / 0.1;
                            meshNode.material.color.setRGB(
                                0.3 + (0.7 * openingFactor),
                                0.7 + (0.3 * openingFactor),
                                0.3 + (0.7 * openingFactor)
                            );
                        }

                        // Slightly increase scale to show "opening"
                        if (meshNode.userData.originalScale) {
                            const openScale = 1 + ((plantScale - 0.8) / 0.1) * 0.3;
                            meshNode.scale.set(
                                meshNode.userData.originalScale.x * openScale,
                                meshNode.userData.originalScale.y * openScale,
                                meshNode.userData.originalScale.z * openScale
                            );
                        }
                    }
                } else if (growthStage === 'MATURE') {
                    // Fully white and open in mature stage
                    if (meshNode.material) {
                        meshNode.material.color.setRGB(1, 1, 1);
                    }

                    // Expanded scale for fully open bolls
                    if (meshNode.userData.originalScale) {
                        meshNode.scale.set(
                            meshNode.userData.originalScale.x * 1.3,
                            meshNode.userData.originalScale.y * 1.3,
                            meshNode.userData.originalScale.z * 1.3
                        );
                    }
                }
            }
            break;
    }
}

/**
 * Update a plant based on the legacy geometry approach
 */
function updateGeometryPlant(plant, plantScale, growthStage, cropType) {
    // Set scale of the plant to match the growth progress
    plant.scale.set(
        plantScale,
        plantScale,
        plantScale
    );

    // Handle crop-specific visual changes based on growth stage
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
    }
}

/**
 * Determine growth stage based on growth percentage
 * @param {number} growthFactor - Growth percentage (0-1)
 * @returns {string} Growth stage
 */
export const determineGrowthStage = (growthFactor) => {
    if (growthFactor < GROWTH_STAGES.SEEDLING) {
        return 'SEEDLING';
    } else if (growthFactor < GROWTH_STAGES.VEGETATIVE) {
        return 'VEGETATIVE';
    } else if (growthFactor < GROWTH_STAGES.REPRODUCTIVE) {
        return 'REPRODUCTIVE';
    } else {
        return 'MATURE';
    }
};
