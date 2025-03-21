'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { setupScene } from '@/lib/simulation/sceneSetup';
import { createSkybox, createTerrain, createClouds, animateClouds } from '@/lib/environment';
import {
    createCropFieldSimulation,
    preloadSimulationModels,
    getModelLoadingProgress,
    areModelsLoaded
} from '@/lib/simulation';
import { createCropTimeline, initializeTimelineController } from '@/lib/simulation/timeline';
import { updatePlantsForGrowthStage } from '@/lib/simulation/plantGrowth';
import { convertGeoPolygonTo3D, parsePolygonFromUrl } from '@/lib/utils/coordinateUtils';
import SeasonTimelineControls from './components/SeasonTimelineControls';
import ProductsPopup from './components/ProductsPopup';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Image from 'next/image';

// Define types for the timeline controller
interface TimelineController {
    getCurrentDay: () => any;
    getCurrentDayIndex: () => number;
    getTotalDays: () => number;
    setDay: (dayIndex: number) => void;
    nextDay: () => void;
    prevDay: () => void;
    isPaused: () => boolean;
    play: () => void;
    pause: () => void;
    setSpeed: (speedFactor: number) => void;
    cleanup: () => void;
    applyGrowthRateIncrease?: (growthRateIncrease: number, startDayIndex: number) => boolean;
    getTimeline?: () => any;
    getAllDays?: () => any[];
    _timeline?: { days: any[] };
}

interface ProductWithMetadata {
    id: string; // Add unique ID for identification
    name: string;
    category: string;
    appliedAt: Date;
    appliedAtDay: number;
    effect: {
        growthRateIncrease: number;
        yieldRisk: number;
        observations: string;
    };
    [key: string]: any; // For other potential properties
}

// Define interfaces for simulation parameters
interface SimulationParams {
    type: string;
    hectares: number;
    density: number;
    polygon: [number, number, number][];
    location: {
        latitude: number;
        longitude: number;
        name: string;
    };
    weatherSettings: {
        useRealWeather: boolean;
    };
}

// Interface for location data
interface LocationData {
    latitude: number;
    longitude: number;
    name: string;
}

// Interface for the drought risk alert data
interface DroughtRiskData {
    droughtIndex: number;
    riskLevel: string;
    recommendation: string;
    warning: string | null;
    inputs: {
        rainfall: number;
        evaporation: number;
        soilMoisture: number;
        temperature: number;
    };
}

// Interface for message details
interface MessageDetails {
    growthRate: number;
    observations: string;
    isSuccess: boolean;
}

export default function SimulationPage() {
    // Get URL params
    const searchParams = useSearchParams();

    // Reference to the 3D container
    const mountRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Refs to hold three.js objects with appropriate types
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cloudsRef = useRef<THREE.Group[]>([]);
    const simulationObjectsRef = useRef<(THREE.Object3D | THREE.Group | THREE.Mesh | THREE.Line)[]>([]);
    const lightRefs = useRef<{
        directional: THREE.DirectionalLight | null;
        ambient: THREE.AmbientLight | null;
    }>({
        directional: null,
        ambient: null
    });

    // Current simulation state
    const [currentSimulation, setCurrentSimulation] = useState<SimulationParams | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showSidebar, setShowSidebar] = useState<boolean>(false);

    // Model loading state
    const [modelLoadingProgress, setModelLoadingProgress] = useState<number>(0);
    const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);

    // Timeline state
    const [timelineController, setTimelineController] = useState<TimelineController | null>(null);
    const [dayInfo, setDayInfo] = useState<any>(null);
    const [totalDays, setTotalDays] = useState<number>(90); // Default 3 months

    // Location state
    const [location, setLocation] = useState<LocationData | null>(null);

    // Products popup state
    const [isProductsPopupOpen, setIsProductsPopupOpen] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [appliedProducts, setAppliedProducts] = useState<ProductWithMetadata[]>([]);

    // Message alerts
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [messageDetails, setMessageDetails] = useState<MessageDetails>({
        growthRate: 0,
        observations: '',
        isSuccess: true
    });
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [droughtRiskAlert, setDroughtRiskAlert] = useState<DroughtRiskData | null>(null);
    const [showDroughtAlert, setShowDroughtAlert] = useState<boolean>(false);
    const [droughtRiskShown, setDroughtRiskShown] = useState<boolean>(false);

    // Track model loading progress
    useEffect(() => {
        if (!modelsLoaded) {
            const checkProgress = () => {
                const progress = getModelLoadingProgress();
                setModelLoadingProgress(progress);

                const loaded = areModelsLoaded();
                setModelsLoaded(loaded);

                if (!loaded) {
                    // Continue checking until loaded
                    setTimeout(checkProgress, 500);
                }
            };

            checkProgress();

            // Start preloading models
            preloadSimulationModels().catch(console.error);
        }
    }, [modelsLoaded]);

    // Initialize the scene
    useEffect(() => {
        if (!mountRef.current) return;

        // Setup THREE.js scene
        const { scene, camera, renderer, controls, dispose } = setupScene(mountRef.current);

        // Store references
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        controlsRef.current = controls;

        // Setup lights and store references
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 200, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        lightRefs.current = {
            directional: directionalLight,
            ambient: ambientLight
        };

        // Create environment
        createSkybox(scene);
        createTerrain(scene);

        // Create clouds
        cloudsRef.current = createClouds(scene, 20);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Animate clouds
            animateClouds(cloudsRef.current);

            // Update rain if active
            if (timelineController &&
                timelineController.getCurrentDay &&
                timelineController.getCurrentDay().settings &&
                timelineController.getCurrentDay().settings.rainSystem) {
                timelineController.getCurrentDay().settings.rainSystem.update();
            }

            // Update controls
            controls.update();

            // Render scene
            renderer.render(scene, camera);
        };

        // Start animation loop
        animate();

        // Load simulation based on URL params if available
        const latitude = parseFloat(searchParams.get('lat') || '-12.915559');
        const longitude = parseFloat(searchParams.get('lng') || '-55.314216');
        const hectares = parseFloat(searchParams.get('hectares') || '350');
        const crop = searchParams.get('crop') || 'corn';
        const polygonParam = searchParams.get('polygon');

        // Parse the polygon from URL
        const geoPolygon = parsePolygonFromUrl(polygonParam || '');

        // Create the farm location object
        const farmLocation: LocationData = {
            latitude,
            longitude,
            name: searchParams.get('locationName') || 'Mato Grosso (Brazil)'
        };

        // Convert the geo polygon to 3D coordinates
        const polygon3D = convertGeoPolygonTo3D(geoPolygon, farmLocation);

        // Create the simulation parameters
        const simParams: SimulationParams = {
            type: crop,
            hectares: Math.min(hectares, 1000), // Cap at 1000 hectares for performance
            density: hectares > 100 ? 50 : hectares > 50 ? 75 : 100, // Adjust density based on farm size
            polygon: polygon3D,
            location: farmLocation,
            weatherSettings: {
                useRealWeather: true
            }
        };

        console.log("Creating simulation with parameters:", simParams);
        console.log("Using 3D polygon:", polygon3D);

        // This will trigger the simulation effect
        setCurrentSimulation(simParams);
        setLocation(farmLocation);

        // Cleanup on unmount
        return () => {
            // Clean up timeline controller if exists
            if (timelineController) {
                timelineController.cleanup();
            }

            dispose();

            // Clean up Three.js resources
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    if (object.material instanceof THREE.Material) {
                        if ('map' in object.material && object.material.map instanceof THREE.Texture) {
                            object.material.map.dispose();
                        }
                        object.material.dispose();
                    } else if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    }
                }
            });
        };
    }, [searchParams]);

    // Clear existing simulation and start a new one when parameters change
    useEffect(() => {
        if (!currentSimulation || !sceneRef.current || !cameraRef.current || !controlsRef.current) return;

        setIsLoading(true);

        // Small delay to ensure all references are properly set up
        setTimeout(() => {
            try {
                // Remove all existing simulation objects
                simulationObjectsRef.current.forEach(object => {
                    if (sceneRef.current) {
                        sceneRef.current.remove(object);
                    }
                });
                simulationObjectsRef.current = [];

                // Clean up previous timeline controller
                if (timelineController) {
                    timelineController.cleanup();
                }

                // Create new simulation
                console.log("Creating simulation with params:", currentSimulation);
                const { success, objects, error } = createCropFieldSimulation(
                    currentSimulation,
                    sceneRef.current,
                    cameraRef.current,
                    controlsRef.current
                );

                if (success) {
                    console.log(`Created ${objects.length} simulation objects`);
                    simulationObjectsRef.current = objects;

                    // Separate plants from other objects for growth animation
                    const plants = objects.filter(obj => {
                        // Use isPlant flag set during creation
                        return obj.userData && obj.userData.isPlant === true;
                    });

                    console.log(`Identified ${plants.length} plant objects for growth animation`);

                    // Create timeline starting March 20th
                    const startDate = new Date('2025-03-20');
                    const timeline = createCropTimeline(
                        currentSimulation,
                        startDate,
                        totalDays
                    );

                    // Initialize timeline controller with our custom plant growth logic
                    const controller = initializeTimelineController(
                        timeline,
                        sceneRef.current,
                        {
                            directionalLight: lightRefs.current.directional,
                            ambientLight: lightRefs.current.ambient,
                            clouds: cloudsRef.current,
                            plants: plants,
                            updatePlantsFunction: updatePlantsForGrowthStage // Use our improved function
                        },
                        setDayInfo
                    );

                    setTimelineController(controller as TimelineController);
                    setErrorMessage('');
                } else if (error) {
                    console.error('Simulation error:', error);
                    setErrorMessage(`Error creating simulation: ${error}`);
                }
            } catch (err) {
                console.error('Unexpected error in simulation creation:', err);
                setErrorMessage(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                setIsLoading(false);
            }
        }, 500);
    }, [currentSimulation]);


    // Add this handler function:
    const checkDroughtRisk = async () => {
        // First, validate only the timelineController
        if (!timelineController) {
            console.warn("Cannot check drought risk: timeline controller not available");
            return null;
        }

        try {
            // Extract required environmental data from current day
            const currentDay = timelineController.getCurrentDay();

            // Add validation for the retrieved day data
            if (!currentDay) {
                console.warn("Cannot check drought risk: current day data not available");
                return null;
            }

            // Map simulation data to drought risk API parameters
            const requestData = {
                // Extract rainfall data (convert from mm to appropriate units if necessary)
                rainfall: currentDay.precipitation || 0,

                // Estimate evaporation based on temperature and humidity
                evaporation: calculateEvaporation(currentDay.temperature, currentDay.humidity),

                // Get soil moisture (either from soil data or estimate it)
                soilMoisture: currentDay.soilMoisture || 0.5, // Default to moderate soil moisture if not available

                // Use average temperature for the calculation
                temperature: typeof currentDay.temperature === 'object'
                    ? ((currentDay.temperature.max + currentDay.temperature.min) / 2)
                    : currentDay.temperature
            };

            console.log("Checking drought risk with parameters:", requestData);

            // Call the drought-risk API
            const response = await fetch('/api/drought-risk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Drought risk API responded with status ${response.status}: ${errorText}`);
            }

            const riskData = await response.json();
            console.log("Received drought risk assessment:", riskData);

            if (riskData.success) {
                // Store drought risk data for later use
                setDroughtRiskAlert(riskData.data);

                // If risk is higher than "No risk", show the alert
                if (riskData.data.riskLevel !== 'No risk' && !droughtRiskShown) {
                    setTimeout(() => setShowDroughtAlert(true), 3000);
                }

                setDroughtRiskShown(true);
                return riskData.data;
            } else {
                console.error("Drought risk API error:", riskData.error);
                return null;
            }
        } catch (error) {
            console.error("Error checking drought risk:", error);
            return null;
        }
    };

    // Helper function to estimate evaporation based on temperature and humidity
    const calculateEvaporation = (temperature: any, humidity: any): number => {
        // Default values if data is missing
        const temp = typeof temperature === 'object'
            ? ((temperature.max + temperature.min) / 2)
            : (temperature || 25);
        const hum = humidity || 50;

        // Simple evaporation estimate based on temperature and inverse humidity
        // This is a simplified model - real evaporation depends on many factors
        // Higher temperature → higher evaporation
        // Higher humidity → lower evaporation
        const evapRate = (0.5 * temp * (100 - hum) / 100);

        // Return evaporation rate with reasonable bounds (0.1-15 mm/day)
        return Math.max(0.1, Math.min(15, evapRate));
    };

    // 3. Update the handleProductSelect function to check drought risk after successful product application
    const handleProductSelect = async (product: any) => {
        // Store selected product and close popup
        setSelectedProduct(product);
        setIsProductsPopupOpen(false);

        // Clear any existing messages
        setErrorMessage('');
        setSuccessMessage('');

        // Show a status message to inform the user of processing
        setStatusMessage(`Applying ${product.name} to the simulation...`);

        try {
            // Validation logic for preventing duplicate applications
            const currentDayIndex = timelineController ? timelineController.getCurrentDayIndex() + 1 : 0;
            const alreadyAppliedProduct = appliedProducts.find(p =>
                p.name === product.name && p.appliedAtDay === currentDayIndex
            );

            if (alreadyAppliedProduct) {
                setStatusMessage('');
                setErrorMessage(`${product.name} has already been applied today (Day ${currentDayIndex}). Please advance the timeline to apply it again.`);
                setTimeout(() => setErrorMessage(''), 10000);
                return;
            }

            // Call API to calculate and apply product effects
            const effectData = await applyProductEffect(product);

            if (!effectData) {
                throw new Error("Failed to calculate product effect");
            }

            // Generate a unique ID for this product application
            const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);

            // Add the product to applied products list with metadata
            const productWithMetadata: ProductWithMetadata = {
                ...product,
                id: uniqueId, // Add unique ID
                appliedAt: new Date(),
                appliedAtDay: currentDayIndex,
                effect: {
                    growthRateIncrease: effectData.growth_rate_increase,
                    yieldRisk: effectData.yield_risk,
                    observations: effectData.observations
                }
            };

            setAppliedProducts(prev => [...prev, productWithMetadata]);

            // Clear the status message
            setStatusMessage('');

            // Generate success message with effect details
            let baseMessage = `Applied ${product.name} to the simulation!`;
            const growthRate = effectData.growth_rate_increase !== undefined
                ? effectData.growth_rate_increase * 100
                : 0;

            if (growthRate > 0) {
                baseMessage += ` Growth rate increased by ${growthRate.toFixed(1)}%.`;
            }

            // Set success message with details for styling and additional info
            setSuccessMessage(baseMessage);
            setMessageDetails({
                growthRate: growthRate,
                observations: effectData.observations || '',
                isSuccess: true
            });

            // Check for drought risk after successful product application
            await checkDroughtRisk();

            // Auto-clear success message
            setTimeout(() => {
                setSuccessMessage('');
            }, 10000);

        } catch (error) {
            // Error handling logic
            console.error('Error in product application:', error);

            // Clear the status message
            setStatusMessage('');

            // Set error message
            setErrorMessage(`Error applying ${product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);

            // Auto-clear error message
            setTimeout(() => setErrorMessage(''), 10000);
        }
    };

    // Updated applyProductEffect function with robust timeline access
    const applyProductEffect = async (product: any) => {
        if (!timelineController || !currentSimulation || !location) {
            console.error("Required simulation components not initialized");
            return null;
        }

        // Get the current day's data
        const currentDay = timelineController.getCurrentDay();
        const currentDayIndex = timelineController.getCurrentDayIndex();

        console.log("Current day data:", currentDay);

        // Extract weather data from the current day
        // Handle different possible structures of the temperature data
        const weatherData = {
            precipitation: currentDay.precipitation || 0,
            min_temperature: typeof currentDay.temperature === 'object'
                ? currentDay.temperature.min
                : (currentDay.temperature - 5), // Estimate if only avg is available
            max_temperature: typeof currentDay.temperature === 'object'
                ? currentDay.temperature.max
                : (currentDay.temperature + 5), // Estimate if only avg is available
            humidity: currentDay.humidity || 50
        };

        // Fetch soil data or use defaults
        let soilData = {
            ph: 6.5, // Default soil pH
            nitrogen: 0.05 // Default nitrogen content (5%)
        };

        try {
            // Fetch soil data from the environmental data API
            const response = await fetch(
                `/api/environmental-data?lat=${location.latitude}&lng=${location.longitude}&type=soil`
            );

            if (response.ok) {
                const data = await response.json();

                if (data.soil && data.soil.properties) {
                    // Extract soil properties
                    soilData = {
                        ph: data.soil.properties.ph || soilData.ph,
                        // Convert organic matter percentage to nitrogen approximation
                        nitrogen: data.soil.properties.organicMatter
                            ? (data.soil.properties.organicMatter / 100)
                            : soilData.nitrogen
                    };
                    console.log("Fetched soil data:", soilData);
                }
            }
        } catch (error) {
            console.error('Error fetching soil data:', error);
            // Continue with default values if there's an error
        }

        // Map product name to the expected format for the API
        // The API expects: stress_buster, yield_booster, or nue
        let productName;
        if (product.name === 'Stress Buster') {
            productName = 'stress_buster';
        } else if (product.name === 'Yield Booster') {
            productName = 'yield_booster';
        } else if (product.name.includes('Nutrient Use Efficiency')) {
            productName = 'nue';
        } else {
            // Default case - normalize the name
            productName = product.name.toLowerCase().replace(/\s+/g, '_');
        }

        // Prepare the request data for the API
        const requestData = {
            weather: weatherData,
            crop: currentSimulation.type,
            product: productName,
            soil_ph: soilData.ph,
            soil_nitrogen: soilData.nitrogen
        };

        console.log("Sending request to growth-rate API:", requestData);

        try {
            // Call the growth-rate API
            const response = await fetch('/api/growth-rate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API responded with status ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log("Received response from growth-rate API:", data);

            // Check if timelineController has the new applyProduct method
            if (timelineController.applyProduct && typeof timelineController.applyProduct === 'function') {
                // Apply product using our enhanced method that leverages growth history
                timelineController.applyProduct(
                    product.id || `product_${Date.now()}`,
                    product.name,
                    data.growth_rate_increase,
                    currentDayIndex
                );

                console.log(`Successfully applied product ${product.name} with growth rate increase ${data.growth_rate_increase}`);
            }
            // Fallback to the old method if necessary
            else if (timelineController.applyGrowthRateIncrease && typeof timelineController.applyGrowthRateIncrease === 'function') {
                // Use the built-in method if available
                timelineController.applyGrowthRateIncrease(data.growth_rate_increase, currentDayIndex);

                console.log(`Fallback: Applied growth rate increase of ${data.growth_rate_increase} using applyGrowthRateIncrease`);
            }
            // Last resort fallback for older implementations
            else {
                console.warn("Neither applyProduct nor applyGrowthRateIncrease methods found, using manual approach");

                // Try to access the days array
                let timelineDays = null;

                if (timelineController.getTimeline && typeof timelineController.getTimeline === 'function') {
                    const timeline = timelineController.getTimeline();
                    if (timeline && timeline.days) {
                        timelineDays = timeline.days;
                    }
                } else if (timelineController.getAllDays && typeof timelineController.getAllDays === 'function') {
                    timelineDays = timelineController.getAllDays();
                }

                if (timelineDays && Array.isArray(timelineDays)) {
                    // Apply growth rate increase manually
                    for (let i = currentDayIndex; i < timelineDays.length; i++) {
                        const day = timelineDays[i];

                        if (day.growthFactor !== undefined) {
                            day.growthFactor = Math.min(1.0, day.growthFactor * (1 + data.growth_rate_increase));
                            day.growthPercent = day.growthFactor;
                        }
                    }

                    // Refresh display
                    timelineController.setDay(currentDayIndex);

                    console.log(`Legacy fallback: Modified growth factors directly in timeline days`);
                }
            }

            // Return the complete API response
            return data;
        } catch (error) {
            console.error('Error applying product effect:', error);
            throw error;
        }
    };

    const handleRemoveProduct = async (product: ProductWithMetadata, appliedDay: number) => {
        try {
            // Show status message during processing
            setStatusMessage(`Removing ${product.name} from simulation...`);

            // First, remove product from the appliedProducts array
            setAppliedProducts(prev => prev.filter(p => p.id !== product.id));

            // Check if timelineController exists with required navigation methods
            if (!timelineController || !timelineController.getCurrentDayIndex ||
                !timelineController.getTotalDays || !timelineController.setDay ||
                !timelineController.getCurrentDay) {
                console.warn("Timeline controller missing required methods");
                setStatusMessage('');
                setSuccessMessage(`Removed ${product.name} from product list, but couldn't update simulation.`);
                return;
            }

            // Get current position to restore view later
            const currentPosition = timelineController.getCurrentDayIndex();
            const totalDays = timelineController.getTotalDays();

            // Calculate reversal factor
            const originalIncrease = product.effect?.growthRateIncrease || 0;
            const reverseGrowthRate = -originalIncrease / (1 + originalIncrease);

            console.log(`Attempting day-by-day reversal: original +${originalIncrease}, reversal factor ${reverseGrowthRate}`);

            // Track success
            let modifiedDays = 0;

            // Implement day-by-day modification using available navigation methods
            for (let dayIndex = appliedDay; dayIndex < totalDays; dayIndex++) {
                // Navigate to this day
                timelineController.setDay(dayIndex);

                // Get current day data
                const dayData = timelineController.getCurrentDay();

                // Skip if day data doesn't have growthFactor
                if (!dayData || dayData.growthFactor === undefined) continue;

                try {
                    // Create a direct reference to modify the object properties
                    // This works because JavaScript objects are passed by reference
                    const currentGrowthFactor = dayData.growthFactor;
                    const newGrowthFactor = Math.max(0, Math.min(1, currentGrowthFactor * (1 + reverseGrowthRate)));

                    // Update directly
                    dayData.growthFactor = newGrowthFactor;
                    dayData.growthPercent = newGrowthFactor;

                    // Update growth stage if possible
                    if (newGrowthFactor < 0.3) {
                        dayData.growthStage = 'SEEDLING';
                    } else if (newGrowthFactor < 0.6) {
                        dayData.growthStage = 'VEGETATIVE';
                    } else if (newGrowthFactor < 0.9) {
                        dayData.growthStage = 'REPRODUCTIVE';
                    } else {
                        dayData.growthStage = 'MATURE';
                    }

                    modifiedDays++;
                } catch (dayError) {
                    console.warn(`Failed to modify day ${dayIndex}:`, dayError);
                }
            }

            // Return to original position
            timelineController.setDay(currentPosition);

            // Clear status message
            setStatusMessage('');

            // Show appropriate feedback based on success
            if (modifiedDays > 0) {
                console.log(`Successfully modified ${modifiedDays} days`);
                setSuccessMessage(`Removed ${product.name} and reversed its effects on crop growth.`);
                setMessageDetails({
                    growthRate: 0,
                    observations: `Modified ${modifiedDays} days to show crop development without ${product.name}.`,
                    isSuccess: true
                });
            } else {
                setSuccessMessage(`Removed ${product.name} from product list.`);
                setMessageDetails({
                    growthRate: 0,
                    observations: `Could not modify simulation data, but the product has been removed from tracking.`,
                    isSuccess: true
                });
            }

            // Auto-clear success message
            setTimeout(() => {
                setSuccessMessage('');
            }, 5000);

        } catch (error) {
            console.error('Error removing product:', error);
            setStatusMessage('');
            setErrorMessage(`Error removing ${product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);

            // Auto-clear error message
            setTimeout(() => {
                setErrorMessage('');
            }, 5000);
        }
    };

    return (
        <div className="flex flex-col">

            {/* Header Bar */}
            <div className="bg-green-500 py-3 px-4">
                <div className="container mx-auto max-w-5xl flex justify-between items-center">
                    <div className="flex items-center">
                        <Image 
                            src="/logo_white.png" 
                            alt="Crop & Paste" 
                            width={200} 
                            height={40} 
                            className="mr-2"
                        />

                    </div>
                    {/* Powered by Syngenta */}
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">Powered by</span>
                        <Image
                            src="/images/syngenta-logo.png"
                            alt="Syngenta"
                            width={100}
                            height={30}
                            className="w-auto"
                        />
                    </div>
                </div>
            </div>

            {/* Timeline Controls */}
            {timelineController && (
                <SeasonTimelineControls
                    controller={timelineController}
                    totalDays={totalDays}
                    location={location}
                />
            )}

            {/* Main content */}
            <div className="flex-1 relative">
                {/* 3D View */}
                <div className="w-full h-full">
                    <div ref={mountRef} className="w-full h-screen" />
                </div>

                {/* Simulate Product Button */}
                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={() => setIsProductsPopupOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        Simulate Product
                    </button>
                </div>

                {/* Products Popup */}
                <ProductsPopup
                    isOpen={isProductsPopupOpen}
                    onClose={() => setIsProductsPopupOpen(false)}
                    onSelectProduct={handleProductSelect}
                />

                {/* Enhanced Applied Products Display with remove button */}
                {appliedProducts.length > 0 && (
                    <div className="absolute bottom-[250px] right-4 z-20 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg max-w-xs">
                        <h3 className="font-medium text-green-700 mb-2">Applied Products</h3>

                        {/* Group products by application day for better organization */}
                        {(() => {
                            // Create a map of day → products
                            const productsByDay = appliedProducts.reduce<Record<string, ProductWithMetadata[]>>((acc, product) => {
                                const day = String(product.appliedAtDay || '?');
                                if (!acc[day]) acc[day] = [];
                                acc[day].push(product);
                                return acc;
                            }, {});

                            // Sort days in descending order (most recent first)
                            return Object.keys(productsByDay)
                                .sort((a, b) => Number(b) - Number(a))
                                .map(day => (
                                    <div key={day} className="mb-3 last:mb-0">
                                        <div className="text-xs font-medium text-gray-500 mb-1 border-b border-gray-100">
                                            Day {day}
                                        </div>
                                        <ul className="space-y-2">
                                            {productsByDay[day].map((product, index) => (
                                                <li key={`${day}-${index}`} className="border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                                                    <div className="flex items-start">
                                                        <div className="flex items-center mt-0.5">
                                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">{product.name}</div>
                                                            <div className="text-gray-600 text-xs flex flex-wrap">
                                                                <span className="mr-2">{product.category}</span>
                                                            </div>

                                                            {/* Show effects if available */}
                                                            {product.effect && product.effect.growthRateIncrease !== undefined && (
                                                                <div className="mt-1 bg-green-50 p-1.5 rounded text-xs">
                                                                    <div className="flex justify-between text-green-800">
                                                                        <span>Growth boost:</span>
                                                                        <span className="font-medium">
                                                                            +{(product.effect.growthRateIncrease * 100).toFixed(1)}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Remove button */}
                                                            <button
                                                                onClick={() => handleRemoveProduct(product, Number(day))}
                                                                className="mt-2 text-xs text-red-600 hover:text-red-800 flex items-center"
                                                            >
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                                </svg>
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ));
                        })()}

                        {/* Add totals if multiple products applied */}
                        {appliedProducts.length > 1 && (
                            <div className="mt-3 pt-2 border-t border-gray-200 text-xs font-medium">
                                <div className="flex justify-between text-green-800">
                                    <span>Total Growth Enhancement:</span>
                                    <span>
                                        {(() => {
                                            // Calculate cumulative effect (simplified)
                                            const totalEffect = appliedProducts.reduce((total, product) => {
                                                return total + ((product.effect?.growthRateIncrease || 0) * 100);
                                            }, 0);
                                            return `+${totalEffect.toFixed(1)}%`;
                                        })()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Model Loading Progress */}
                {!modelsLoaded && modelLoadingProgress > 0 && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 p-4 bg-white bg-opacity-90 rounded-lg shadow-lg z-20">
                        <div className="text-center">
                            <h3 className="font-medium mb-2">Loading 3D Models</h3>
                            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all duration-300"
                                    style={{ width: `${modelLoadingProgress * 100}%` }}
                                ></div>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                                {Math.round(modelLoadingProgress * 100)}% Complete
                            </p>
                        </div>
                    </div>
                )}

                {/* Error message */}
                {errorMessage && (
                    <div className="absolute top-20 right-4 p-3 bg-red-600 text-white rounded shadow-lg max-w-md z-20">
                        <strong>Error:</strong> {errorMessage}
                        <button
                            className="ml-3 text-white font-bold"
                            onClick={() => setErrorMessage('')}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Success message with contextual styling */}
                {successMessage && (
                    <div className={`absolute top-20 right-4 p-3 ${messageDetails.growthRate > 2 ? 'bg-green-600' : 'bg-gray-600'
                        } text-white rounded shadow-lg max-w-md z-20`}>
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <p>{successMessage}</p>
                                {messageDetails.observations && (
                                    <p className="mt-2 text-sm border-t border-white/20 pt-2">
                                        <strong>Analysis:</strong> {messageDetails.observations}
                                    </p>
                                )}
                            </div>
                            <button
                                className="ml-3 text-white font-bold"
                                onClick={() => setSuccessMessage('')}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}
                {/* Status/Processing message */}
                {statusMessage && (
                    <div className="absolute top-20 right-4 p-3 bg-blue-600 text-white rounded shadow-lg max-w-md z-20 flex justify-between items-start">
                        <div className="flex items-center">
                            {/* Animated loading spinner */}
                            <div className="mr-3 animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            <p>{statusMessage}</p>
                        </div>
                        <button
                            className="ml-3 text-white font-bold"
                            onClick={() => setStatusMessage('')}
                        >
                            ×
                        </button>
                    </div>

                )}

                {/* Drought Risk Alert Modal */}
                {showDroughtAlert && droughtRiskAlert && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center">
                                    {/* Alert icon */}
                                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">Drought Risk Alert</h2>
                                </div>
                                <button
                                    className="text-gray-500 hover:text-gray-700"
                                    onClick={() => setShowDroughtAlert(false)}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>

                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-amber-700">
                                            <span className="font-medium">Risk Level: </span>
                                            {droughtRiskAlert.riskLevel}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-1">Warning:</h3>
                                <p className="text-sm text-gray-600">{droughtRiskAlert.warning}</p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded mb-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-2">Environmental Conditions:</h3>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-gray-500">Rainfall:</span>
                                        <span className="ml-1 font-medium">{droughtRiskAlert.inputs.rainfall} mm</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Evaporation:</span>
                                        <span className="ml-1 font-medium">{droughtRiskAlert.inputs.evaporation} mm</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Soil Moisture:</span>
                                        <span className="ml-1 font-medium">{droughtRiskAlert.inputs.soilMoisture}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Temperature:</span>
                                        <span className="ml-1 font-medium">{droughtRiskAlert.inputs.temperature}°C</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    onClick={() => setShowDroughtAlert(false)}
                                >
                                    Acknowledge
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-30">
                        <div className="p-4 bg-white rounded shadow-lg">
                            <p className="text-lg font-bold">Loading simulation...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
