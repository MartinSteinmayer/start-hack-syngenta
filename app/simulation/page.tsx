'use client'

import React, { useState, useEffect, useRef } from 'react';
import { setupScene } from '@/lib/simulation/sceneSetup';
import { createSkybox, createTerrain, createClouds, animateClouds } from '@/lib/environment';
import { createCropFieldSimulation } from '@/lib/simulation';
import { createCropTimeline, initializeTimelineController } from '@/lib/simulation/timeline';
import { updatePlantsForGrowthStage } from '@/lib/simulation/plantGrowth';
import SeasonTimelineControls from './components/SeasonTimelineControls';
import * as THREE from 'three';
import Image from 'next/image';

export default function SimulationPage() {
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

    // Timeline state
    const [timelineController, setTimelineController] = useState(null);
    const [dayInfo, setDayInfo] = useState(null);
    const [totalDays, setTotalDays] = useState(90); // Default 3 months

    // Location state
    const [location, setLocation] = useState(null);

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

        // Load a default simulation immediately
        setTimeout(() => {
            const defaultSimParams = {
                type: 'soybean',
                hectares: 1.5,  // Smaller field size for better density
                density: 100,    // Higher density
                polygon: [
                    [-30, 0, -30],
                    [-30, 0, 30],
                    [30, 0, 30],
                    [30, 0, -30]
                ],
                location: {
                    latitude: -12.915559,
                    longitude: -55.314216,
                    name: 'Mato Grosso (Brazil)'
                },
                weatherSettings: {
                    useRealWeather: true
                }
            };

            // This will trigger the simulation effect
            setCurrentSimulation(defaultSimParams);
            setLocation(defaultSimParams.location);
        }, 100);

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
    }, []);

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
