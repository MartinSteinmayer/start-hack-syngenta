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
    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setIsProductsPopupOpen(false);

        // Add the product to applied products list
        setAppliedProducts(prev => [...prev, product]);

        // Here you would add logic to apply the product effects to the simulation
        // For example, you might update growth rates, stress resistance, etc.
        console.log(`Selected product: ${product.name}`);

        // Display a temporary success message
        const successMessage = `Applied ${product.name} to the simulation!`;
        setErrorMessage(successMessage);

        // Clear the message after 3 seconds
        setTimeout(() => {
            if (errorMessage === successMessage) {
                setErrorMessage('');
            }
        }, 3000);

        // If you have a timeline controller, you could update plant properties here
        if (timelineController) {
            // Example of how you might modify the simulation:
            // timelineController.applyProductEffect(product.name, product.effectStrength);
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

                {/* Option to also display applied products */}
                {appliedProducts.length > 0 && (
                    <div className="absolute bottom-4 right-4 z-20 bg-white bg-opacity-80 p-3 rounded-lg shadow">
                        <h3 className="font-medium text-sm mb-1">Applied Products:</h3>
                        <ul className="text-xs">
                            {appliedProducts.map((product, index) => (
                                <li key={index} className="flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                    {product.name}
                                </li>
                            ))}
                        </ul>
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
