import * as THREE from 'three';
import { createPlantSync, preloadCropModels, PLANTS_PER_HECTARE } from '../crops';
import { createFieldSoil, createFieldBoundary } from '../environment';
import {
    scalePolygonToHectares,
    triangulatePolygon,
    getRandomPointInTriangle,
    createFieldInfoSign,
    generateGridPlantPositions
} from './fieldUtils';
import { adjustCameraView } from './cameraUtils';
import { getCropModelPaths, preloadModels, setLoadingCallbacks } from '../services/modelLoader';

// Track loading status
let modelsLoaded = false;
let loadingProgress = 0;

/**
 * Preload all crop models for the simulation
 * @returns {Promise<void>}
 */
export const preloadSimulationModels = async (): Promise<void> => {
    if (modelsLoaded) return;

    try {
        // Preload all crop models
        const modelPaths = Object.values(getCropModelPaths());

        // Set loading callbacks
        setLoadingCallbacks(
            (progress) => {
                loadingProgress = progress;
                console.log(`Model loading progress: ${Math.round(progress * 100)}%`);
            },
            () => {
                modelsLoaded = true;
                console.log('All models loaded successfully');
            }
        );

        await preloadModels(modelPaths);
    } catch (error) {
        console.error('Error preloading models:', error);
    }
};

/**
 * Get current model loading progress
 * @returns {number} - Loading progress from 0 to 1
 */
export const getModelLoadingProgress = (): number => {
    return loadingProgress;
};

/**
 * Check if all models are loaded
 * @returns {boolean} - True if all models are loaded
 */
export const areModelsLoaded = (): boolean => {
    return modelsLoaded;
};

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

        // Start preloading models in the background if not already loaded
        if (!modelsLoaded) {
            preloadSimulationModels().catch(console.error);
        }

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

        // Generate grid-based plant positions
        console.log(`Generating grid-based plant positions for ${type} with ${density}% density`);
        const plantPositions = generateGridPlantPositions(scaledPolygon, type, density);
        console.log(`Generated ${plantPositions.length} plant positions`);

        // Determine maximum number of plants to render based on performance considerations
        // We'll use a higher limit since we're using 3D models with proper scaling
        const maxPlantsToRender = 500;

        // Calculate sample rate if we have too many plants
        let sampleRate = 1;
        if (plantPositions.length > maxPlantsToRender) {
            sampleRate = Math.ceil(plantPositions.length / maxPlantsToRender);
            console.log(`Sampling plants at 1/${sampleRate} rate for performance (${Math.floor(plantPositions.length / sampleRate)} plants)`);
        }

        // Create plants at grid positions with sampling
        let plantsCreated = 0;
        for (let i = 0; i < plantPositions.length; i += sampleRate) {
            const { x, z } = plantPositions[i];

            // Create plant using the sync version for initial setup
            const plant = createPlantSync(type, x, z);

            // Add random rotation for natural variation
            plant.rotation.y = Math.random() * Math.PI * 2;

            scene.add(plant);
            simulationObjects.push(plant);
            plantsCreated++;
        }

        console.log(`Created ${plantsCreated} ${type} plants`);


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
