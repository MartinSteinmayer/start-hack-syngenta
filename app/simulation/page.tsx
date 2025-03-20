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
import Image from 'next/image';

export default function SimulationPage() {
    // Get URL params
    const searchParams = useSearchParams();

    // Reference to the 3D container
    const mountRef = useRef(null);
    const fileInputRef = useRef(null);

    // Refs to hold three.js objects
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const rendererRef = useRef(null);
    const cloudsRef = useRef([]);
    const simulationObjectsRef = useRef([]);
    const lightRefs = useRef({
        directional: null,
        ambient: null
    });

    // Current simulation state
    const [currentSimulation, setCurrentSimulation] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);

    // Model loading state
    const [modelLoadingProgress, setModelLoadingProgress] = useState(0);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // Timeline state
    const [timelineController, setTimelineController] = useState(null);
    const [dayInfo, setDayInfo] = useState(null);
    const [totalDays, setTotalDays] = useState(90); // Default 3 months

    // Location state
    const [location, setLocation] = useState(null);

    // Products popup state
    const [isProductsPopupOpen, setIsProductsPopupOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [appliedProducts, setAppliedProducts] = useState<any[]>([]);

    // Message alerts
    const [successMessage, setSuccessMessage] = useState('');
    const [messageDetails, setMessageDetails] = useState({
        growthRate: 0,
        observations: '',
        isSuccess: true
    });
    const [statusMessage, setStatusMessage] = useState('');

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
        const latitude = parseFloat(searchParams.get('lat')) || -12.915559;
        const longitude = parseFloat(searchParams.get('lng')) || -55.314216;
        const hectares = parseFloat(searchParams.get('hectares')) || 350;
        const crop = searchParams.get('crop') || 'corn';
        const polygonParam = searchParams.get('polygon');

        // Parse the polygon from URL
        const geoPolygon = parsePolygonFromUrl(polygonParam);

        // Create the farm location object
        const farmLocation = {
            latitude,
            longitude,
            name: searchParams.get('locationName') || 'Mato Grosso (Brazil)'
        };

        // Convert the geo polygon to 3D coordinates
        const polygon3D = convertGeoPolygonTo3D(geoPolygon, farmLocation);

        // Create the simulation parameters
        const simParams = {
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
                    if (object.material.map) object.material.map.dispose();
                    object.material.dispose();
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
                    sceneRef.current.remove(object);
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

                    setTimelineController(controller);
                    setErrorMessage('');
                } else {
                    console.error('Simulation error:', error);
                    setErrorMessage(`Error creating simulation: ${error}`);
                }
            } catch (err) {
                console.error('Unexpected error in simulation creation:', err);
                setErrorMessage(`Unexpected error: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        }, 500);
    }, [currentSimulation]);


    // Add this handler function:
    const handleProductSelect = async (product) => {
        // Store selected product and close popup
        setSelectedProduct(product);
        setIsProductsPopupOpen(false);

        // Clear any existing messages
        setErrorMessage('');
        setSuccessMessage('');

        // Show a status message to inform the user of processing
        setStatusMessage(`Applying ${product.name} to the simulation...`);

        try {
            // Call API to calculate and apply product effects
            const effectData = await applyProductEffect(product);

            if (!effectData) {
                throw new Error("Failed to calculate product effect");
            }

            // Add the product to applied products list with metadata
            const productWithMetadata = {
                ...product,
                appliedAt: new Date(),
                appliedAtDay: timelineController ? timelineController.getCurrentDayIndex() + 1 : 1,
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

            // Auto-clear success message
            setTimeout(() => {
                setSuccessMessage('');
            }, 8000); // Slightly longer display time for success messages with observations

        } catch (error) {
            // Error handling logic
            console.error('Error in product application:', error);

            // Clear the status message
            setStatusMessage('');

            // Set error message
            setErrorMessage(`Error applying ${product.name}: ${error.message}`);

            // Auto-clear error message
            setTimeout(() => setErrorMessage(''), 5000);
        }
    };

    // Updated applyProductEffect function with robust timeline access
    const applyProductEffect = async (product) => {
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

            if (timelineController && !timelineController.applyGrowthRateIncrease) {
                console.log("Extending timelineController with applyGrowthRateIncrease method");

                // Add the method directly to the controller object
                timelineController.applyGrowthRateIncrease = function(growthRateIncrease, startDayIndex) {
                    console.log(`Custom implementation: Applying growth rate increase of ${growthRateIncrease} starting from day ${startDayIndex}`);

                    // Store the current day index to return to it
                    const currentIndex = this.getCurrentDayIndex();
                    const totalDays = this.getTotalDays();

                    try {
                        // Process each future day
                        for (let i = startDayIndex; i < totalDays; i++) {
                            // Navigate to this day
                            this.setDay(i);

                            // Get the current day data
                            const day = this.getCurrentDay();

                            if (day && day.growthFactor !== undefined) {
                                // Calculate the new growth factor
                                const originalFactor = day.growthFactor;
                                const newFactor = Math.min(1.0, originalFactor * (1 + growthRateIncrease));

                                // Update the day's properties directly
                                day.growthFactor = newFactor;
                                day.growthPercent = newFactor; // For backward compatibility

                                // Update growth stage based on new factor
                                // Simple determination based on common ranges
                                if (day.growthStage) {
                                    if (newFactor < 0.3) {
                                        day.growthStage = "VEGETATIVE";
                                    } else if (newFactor < 0.6) {
                                        day.growthStage = "REPRODUCTIVE";
                                    } else if (newFactor < 0.8) {
                                        day.growthStage = "GRAIN_FILLING";
                                    } else {
                                        day.growthStage = "MATURITY";
                                    }
                                }

                                console.log(`Day ${i}: Modified growth factor from ${originalFactor} to ${newFactor}`);
                            }
                        }

                        // Return to the original day
                        this.setDay(currentIndex);

                        console.log("Successfully applied growth rate increase using custom method");
                        return true;
                    } catch (error) {
                        console.error("Error in custom applyGrowthRateIncrease:", error);
                        return false;
                    }
                };

                console.log("TimelineController successfully extended with applyGrowthRateIncrease method");
            }

            const data = await response.json();
            console.log("Received response from growth-rate API:", data);

            // Apply the growth rate increase to the timeline
            if (data.growth_rate_increase !== undefined) {
                console.log(`Applying growth rate increase: ${data.growth_rate_increase}`);

                // FIXED: Improved approach to detect and use appropriate method
                if (typeof timelineController.applyGrowthRateIncrease === 'function') {
                    // Use the built-in method if available
                    timelineController.applyGrowthRateIncrease(data.growth_rate_increase, currentDayIndex);
                } else {
                    // Fallback implementation with multiple access strategies
                    console.warn("applyGrowthRateIncrease method not found, using fallback implementation");

                    // Try multiple approaches to access timeline data
                    let timelineDays = null;

                    // Approach 1: Try to access through getTimeline method
                    if (typeof timelineController.getTimeline === 'function') {
                        const timeline = timelineController.getTimeline();
                        if (timeline && timeline.days) {
                            timelineDays = timeline.days;
                        }
                    }

                    // Approach 2: Try to access through getAllDays method
                    if (!timelineDays && typeof timelineController.getAllDays === 'function') {
                        timelineDays = timelineController.getAllDays();
                    }

                    // Approach 3: Try to access through private _timeline property
                    if (!timelineDays && timelineController._timeline && timelineController._timeline.days) {
                        timelineDays = timelineController._timeline.days;
                    }

                    // Final check
                    if (timelineDays && Array.isArray(timelineDays)) {
                        // Apply growth rate increase to future days manually
                        for (let i = currentDayIndex; i < timelineDays.length; i++) {
                            const day = timelineDays[i];

                            if (day.growthFactor !== undefined) {
                                // Calculate new growth factor with the increase
                                const originalGrowthFactor = day.growthFactor;
                                const newGrowthFactor = Math.min(1.0, originalGrowthFactor * (1 + data.growth_rate_increase));

                                // Update the day's growth factor and percent
                                day.growthFactor = newGrowthFactor;
                                day.growthPercent = newGrowthFactor; // For backward compatibility

                                // Update growth stage if the determineGrowthStage function is available
                                if (window.determineGrowthStage) {
                                    day.growthStage = window.determineGrowthStage(newGrowthFactor);
                                }
                            }
                        }

                        // Refresh the current day
                        if (typeof timelineController.setDay === 'function') {
                            timelineController.setDay(currentDayIndex);
                        }

                        console.log(`Successfully applied growth rate increase using fallback implementation.`);
                    } else {
                        throw new Error("Unable to access timeline data using any available method");
                    }
                }
            } else {
                console.warn("API response missing growth_rate_increase value");
            }

            // Return the complete API response
            return data;
        } catch (error) {
            console.error('Error applying product effect:', error);
            throw error;
        }
    };

    return (
        <div className="flex flex-col">

            {/* Header Bar */}
            <div className="bg-green-500 py-3 px-4">
                <div className="container mx-auto max-w-5xl flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="text-white font-bold text-xl">Farm Bio-Boost</span>
                        <span className="text-white ml-2">Simulator</span>
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

                {/* Enhanced Applied Products Display - Add this to app/simulation/page.tsx */}
                {appliedProducts.length > 0 && (
                    <div className="absolute bottom-[250px] right-4 z-20 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg max-w-xs">
                        <h3 className="font-medium text-green-700 mb-2">Applied Products</h3>
                        <ul className="space-y-3">
                            {appliedProducts.map((product, index) => (
                                <li key={index} className="border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                                    <div className="flex items-start">
                                        <div className="flex items-center mt-0.5">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{product.name}</div>
                                            <div className="text-gray-600 text-xs flex flex-wrap">
                                                <span className="mr-2">{product.category}</span>
                                                <span>Day {product.appliedAtDay || '?'}</span>
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
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

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
                    <div className={`absolute top-20 right-4 p-3 ${messageDetails.growthRate > 2 ? 'bg-green-600' : 'bg-red-600'
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
