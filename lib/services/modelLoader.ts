import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Cache for already loaded models to avoid duplicate loading
const modelCache: Map<string, THREE.Group> = new Map();

// Loading manager to track overall loading progress
const loadingManager = new THREE.LoadingManager();
const gltfLoader = new GLTFLoader(loadingManager);

// Loading progress callback handlers
let onProgressCallback: ((progress: number) => void) | null = null;
let onCompleteCallback: (() => void) | null = null;

// Configure loading manager
loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const progress = itemsLoaded / itemsTotal;
  if (onProgressCallback) {
    onProgressCallback(progress);
  }
};

loadingManager.onLoad = () => {
  if (onCompleteCallback) {
    onCompleteCallback();
  }
};

/**
 * Set callbacks for loading progress and completion
 */
export const setLoadingCallbacks = (
  onProgress: (progress: number) => void,
  onComplete: () => void
) => {
  onProgressCallback = onProgress;
  onCompleteCallback = onComplete;
};

/**
 * Load a GLB model and return a clone of it
 * @param {string} path - Path to the GLB file
 * @returns {Promise<THREE.Group>} - Promise that resolves to the loaded model
 */
export const loadModel = async (path: string): Promise<THREE.Group> => {
  // Check if model is already in cache
  if (modelCache.has(path)) {
    // Clone the cached model to avoid modifying the original
    return modelCache.get(path)!.clone();
  }

  try {
    // Load the model
    const gltf = await new Promise<any>((resolve, reject) => {
      gltfLoader.load(
        path,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error)
      );
    });

    // Process the model
    const model = gltf.scene;
    
    // Normalize model size and position
    normalizeModel(model);
    
    // Enable shadows for all meshes in the model
    model.traverse((node: THREE.Object3D) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Cache the original model
    modelCache.set(path, model.clone());
    
    return model;
  } catch (error) {
    console.error(`Error loading model ${path}:`, error);
    throw error;
  }
};

/**
 * Preload models to ensure they're available when needed
 * @param {Array<string>} paths - Array of paths to GLB files
 * @returns {Promise<void>}
 */
export const preloadModels = async (paths: string[]): Promise<void> => {
  const promises = paths.map(path => {
    // Only load if not already in cache
    if (!modelCache.has(path)) {
      return loadModel(path);
    }
    return Promise.resolve();
  });

  await Promise.all(promises);
};

/**
 * Get paths to crop models for different types
 * @returns {Object} - Object with crop types as keys and model paths as values
 */
export const getCropModelPaths = () => {
  return {
    corn: '/models/corn.glb',
    wheat: '/models/wheat.glb',
    soybean: '/models/soybean.glb',
    cotton: '/models/cotton.glb',
    rice: '/models/rice.glb'
  };
};

/**
 * Normalize a loaded model to ensure consistent scaling and positioning
 * @param {THREE.Group} model - The model to normalize
 */
const normalizeModel = (model: THREE.Group): void => {
  // Calculate the model's bounding box
  const bbox = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  
  // Get the model's height (usually the Y dimension)
  const modelHeight = size.y;
  
  // Move model so its base is at y=0
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  model.position.y -= bbox.min.y;
  
  // Apply a consistent scale to make models usable with our growth system
  // We don't adjust scale here - instead we'll let the createPlant function handle scaling
  // based on the actual model size and desired plant height
};

/**
 * Get the dimensions of a model
 * @param {THREE.Group} model - The model to measure
 * @returns {Object} - Object containing width, height, and depth of the model
 */
export const getModelDimensions = (model: THREE.Group): { width: number, height: number, depth: number } => {
  const bbox = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  
  return {
    width: size.x,
    height: size.y,
    depth: size.z
  };
};

/**
 * Clear the model cache
 */
export const clearModelCache = () => {
  modelCache.clear();
};