// lib/simulation/timeline.ts - Updated version with location-based weather

import * as THREE from 'three';
import {
    generateHistoricalWeather,
    convertToSimulationWeatherDays,
    WEATHER_TYPES
} from '../weather/weatherService';
import { applyWeatherToScene, RainSystem } from '../weather';
import { PLANT_HEIGHTS } from '../crops';



// Growth stage modifiers (0-1) for different growth phases
const GROWTH_STAGES = {
    SEEDLING: 0.2,      // Initial growth
    VEGETATIVE: 0.6,    // Main growth phase
    REPRODUCTIVE: 0.9,  // Flowering/fruiting phase
    MATURE: 1.0         // Fully mature
};

/**
 * Creates a timeline for crop growth and weather simulation
 * @param {Object} cropData - Crop type and initial parameters
 * @param {Date} startDate - Start date of simulation
 * @param {number} days - Number of days to simulate
 * @returns {Object} Timeline data
 */
export const createCropTimeline = (cropData, startDate = new Date(), days = 90) => {
    const { type, hectares, density, location } = cropData;

    // Generate weather data based on location
    let weatherData;
    if (location && location.latitude !== undefined && location.longitude !== undefined) {
        const historicalWeather = generateHistoricalWeather(
            location.latitude,
            location.longitude,
            startDate,
            days
        );
        weatherData = convertToSimulationWeatherDays(historicalWeather);
    } else {
        // Fallback to generic weather data if location is not provided
        weatherData = generateGenericWeatherData(days, startDate);
    }

    return {
        type,
        hectares,
        density,
        location: location || null,
        days: weatherData
    };
};

// Fallback function to generate generic weather data
const generateGenericWeatherData = (days, startDate = new Date()) => {
    const weatherData = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < days; i++) {
        const date = new Date(currentDate);

        // Get month to determine season
        const month = date.getMonth();

        // Determine season
        let season;
        if (month >= 2 && month <= 4) season = 'spring';
        else if (month >= 5 && month <= 7) season = 'summer';
        else if (month >= 8 && month <= 10) season = 'fall';
        else season = 'winter';

        // Base temperature
        let baseTemp = 0;
        switch (season) {
            case 'spring': baseTemp = 15; break; // ~60°F
            case 'summer': baseTemp = 25; break; // ~77°F
            case 'fall': baseTemp = 18; break;   // ~64°F
            case 'winter': baseTemp = 5; break;  // ~41°F
        }

        // Random weather with seasonal influence
        let weather;
        const rand = Math.random();

        if (season === 'summer') {
            if (rand < 0.5) weather = WEATHER_TYPES.SUNNY;
            else if (rand < 0.8) weather = WEATHER_TYPES.PARTLY_CLOUDY;
            else if (rand < 0.9) weather = WEATHER_TYPES.CLOUDY;
            else weather = WEATHER_TYPES.RAINY;
        } else if (season === 'winter') {
            if (rand < 0.2) weather = WEATHER_TYPES.SUNNY;
            else if (rand < 0.4) weather = WEATHER_TYPES.PARTLY_CLOUDY;
            else if (rand < 0.7) weather = WEATHER_TYPES.CLOUDY;
            else if (rand < 0.9) weather = WEATHER_TYPES.RAINY;
            else weather = WEATHER_TYPES.STORMY;
        } else {
            // Spring and fall
            if (rand < 0.3) weather = WEATHER_TYPES.SUNNY;
            else if (rand < 0.6) weather = WEATHER_TYPES.PARTLY_CLOUDY;
            else if (rand < 0.8) weather = WEATHER_TYPES.CLOUDY;
            else if (rand < 0.95) weather = WEATHER_TYPES.RAINY;
            else weather = WEATHER_TYPES.STORMY;
        }

        // Adjust temp based on weather
        let tempModifier = 0;
        switch (weather) {
            case WEATHER_TYPES.SUNNY: tempModifier = 5; break;
            case WEATHER_TYPES.PARTLY_CLOUDY: tempModifier = 2; break;
            case WEATHER_TYPES.CLOUDY: tempModifier = 0; break;
            case WEATHER_TYPES.RAINY: tempModifier = -3; break;
            case WEATHER_TYPES.STORMY: tempModifier = -5; break;
        }

        // Random variation
        const tempVariance = (Math.random() * 4) - 2; // -2 to +2 degrees

        // Generate humidity based on weather
        let baseHumidity = 0;
        switch (weather) {
            case WEATHER_TYPES.SUNNY: baseHumidity = 30; break;
            case WEATHER_TYPES.PARTLY_CLOUDY: baseHumidity = 45; break;
            case WEATHER_TYPES.CLOUDY: baseHumidity = 60; break;
            case WEATHER_TYPES.RAINY: baseHumidity = 80; break;
            case WEATHER_TYPES.STORMY: baseHumidity = 90; break;
        }

        // Add random variation to humidity
        const humidityVariance = (Math.random() * 10) - 5; // -5 to +5 percent

        // Calculate growth factor based on conditions
        const tempFactor = 1 - Math.abs(22 - (baseTemp + tempModifier + tempVariance)) / 22;
        const sunFactor = weather === WEATHER_TYPES.SUNNY ? 1.0 :
            weather === WEATHER_TYPES.PARTLY_CLOUDY ? 0.8 :
                weather === WEATHER_TYPES.CLOUDY ? 0.6 :
                    weather === WEATHER_TYPES.RAINY ? 0.4 : 0.3;
        const moistureFactor = Math.min(1.0, (baseHumidity + humidityVariance) / 70);
        console.log('tempFactor')
        console.log(tempFactor)
        console.log('sunFactor')
        console.log(sunFactor)
        console.log('moistureFactor')
        console.log(moistureFactor)

        // Calculate final growth factor
        const growthFactor = (tempFactor * 0.4 + sunFactor * 0.3 + moistureFactor * 0.3);
        console.log('GrowthFactor')
        console.log(growthFactor)

        // Get weather settings
        const settings = {
            [WEATHER_TYPES.SUNNY]: {
                skyColor: 0x87ceeb,
                fogColor: 0xd7f0ff,
                fogDensity: 0.0025,
                lightIntensity: 1.0,
                ambientIntensity: 0.6,
                rainParticles: 0,
                cloudOpacity: 0.8,
                cloudCount: 10
            },
            [WEATHER_TYPES.PARTLY_CLOUDY]: {
                skyColor: 0x87ceeb,
                fogColor: 0xd7f0ff,
                fogDensity: 0.003,
                lightIntensity: 0.8,
                ambientIntensity: 0.5,
                rainParticles: 0,
                cloudOpacity: 0.9,
                cloudCount: 20
            },
            [WEATHER_TYPES.CLOUDY]: {
                skyColor: 0xa3b5c7,
                fogColor: 0xc7c7c7,
                fogDensity: 0.004,
                lightIntensity: 0.6,
                ambientIntensity: 0.4,
                rainParticles: 0,
                cloudOpacity: 1.0,
                cloudCount: 30
            },
            [WEATHER_TYPES.RAINY]: {
                skyColor: 0x708090,
                fogColor: 0xa3a3a3,
                fogDensity: 0.006,
                lightIntensity: 0.5,
                ambientIntensity: 0.3,
                rainParticles: 1000,
                cloudOpacity: 1.0,
                cloudCount: 35
            },
            [WEATHER_TYPES.STORMY]: {
                skyColor: 0x4a5259,
                fogColor: 0x7a7a7a,
                fogDensity: 0.008,
                lightIntensity: 0.4,
                ambientIntensity: 0.2,
                rainParticles: 2000,
                cloudOpacity: 1.0,
                cloudCount: 40
            }
        };

        weatherData.push({
            date,
            dayNumber: i + 1,
            dateString: date.toLocaleDateString(),
            weather,
            temperature: Math.round((baseTemp + tempModifier + tempVariance) * 10) / 10,
            humidity: Math.round(baseHumidity + humidityVariance),
            growthFactor: Math.max(0, Math.min(1, growthFactor)),
            settings: settings[weather]
        });

        // Increment date by one day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return weatherData;
};

/**
 * Update plants in the scene based on growth stage
 * @param {Object} timelineDay - The current day's data
 * @param {Array} plants - Array of plant objects in the scene
 * @param {string} cropType - Type of crop
 */
export const updatePlantsForGrowthStage = (timelineDay, plants, cropType) => {
    if (!plants || plants.length === 0) return;

    const { growthFactor } = timelineDay;
    const baseHeight = PLANT_HEIGHTS[cropType] || 1.0;

    console.log(`Updating ${plants.length} plants for growth stage: ${timelineDay.growthStage}, percent: ${growthFactor}`);

    // Update each plant
    plants.forEach(plant => {
        // Skip non-plant objects
        if (!plant.userData || !plant.userData.isPlant) return;

        // Adjust plant height based on growth
        const targetHeight = baseHeight * growthFactor;


        // Ensure minimum scale to avoid invisible plants
        const plantScale = Math.max(0.2, growthFactor);

        // Set the scale to match the growth percentage
        plant.scale.set(
            plantScale,
            plantScale,
            plantScale
        );

        // For corn specifically, show/hide cobs based on growth stage
        if (cropType === 'corn') {
            // Find cobs (usually the 3rd and possibly 4th child in the corn plant)
            if (plant.children && plant.children.length > 2) {
                // Primary cob - show in reproductive and mature stages
                if (plant.children[2]) {
                    plant.children[2].visible = growthFactor >= 0.6;
                }

                // Secondary cob (if exists) - show only in mature stage
                if (plant.children[3]) {
                    plant.children[3].visible = growthFactor >= 0.85;
                }
            }
        }
    });
};

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

/**
 * Initialize timeline controls for the scene
 * @param {Object} timeline - Timeline data
 * @param {THREE.Scene} scene - The scene
 * @param {Object} sceneObjects - Object containing references to scene objects
 * @param {Function} setDayInfo - Function to update UI with day information
 * @returns {Object} Timeline controller
 */
export const initializeTimelineController = (timeline, scene, sceneObjects, setDayInfo) => {
    let currentDayIndex = 0;
    let paused = true;
    let autoAdvanceInterval = null;
    let rainSystem = null;

    // Initialize rain system
    rainSystem = new RainSystem(scene, 0);

    // Update the scene for a specific day
    const updateSceneForDay = (dayIndex) => {
        if (dayIndex < 0 || dayIndex >= timeline.days.length) return;

        const dayData = timeline.days[dayIndex];

        console.log('dayData')
        console.log(dayData)
        // Determine growth stage if not already set
        if (!dayData.growthStage) {
            dayData.growthStage = determineGrowthStage(dayData.growthFactor);
        }

        // Update plants
        if (sceneObjects.plants && sceneObjects.plants.length > 0) {
            updatePlantsForGrowthStage(dayData, sceneObjects.plants, timeline.type);
        }

        // Update weather effects
        applyWeatherToScene(
            dayData,
            scene,
            {
                directional: sceneObjects.directionalLight,
                ambient: sceneObjects.ambientLight
            },
            sceneObjects.clouds,
            rainSystem
        );

        // Update UI
        if (setDayInfo) {
            setDayInfo(dayData);
        }

        currentDayIndex = dayIndex;
    };

    // Set up auto-advance
    const setAutoAdvance = (enabled, intervalMs = 1000) => {
        clearInterval(autoAdvanceInterval);
        paused = !enabled;

        if (enabled) {
            autoAdvanceInterval = setInterval(() => {
                const nextDay = currentDayIndex + 1;
                if (nextDay < timeline.days.length) {
                    updateSceneForDay(nextDay);
                } else {
                    // Stop at the end
                    clearInterval(autoAdvanceInterval);
                    paused = true;
                }
            }, intervalMs);
        }
    };

    // Start with day 0
    updateSceneForDay(0);

    return {
        getCurrentDay: () => timeline.days[currentDayIndex],
        getCurrentDayIndex: () => currentDayIndex,
        getTotalDays: () => timeline.days.length,
        setDay: (dayIndex) => {
            updateSceneForDay(dayIndex);
        },
        nextDay: () => {
            if (currentDayIndex < timeline.days.length - 1) {
                updateSceneForDay(currentDayIndex + 1);
            }
        },
        prevDay: () => {
            if (currentDayIndex > 0) {
                updateSceneForDay(currentDayIndex - 1);
            }
        },
        isPaused: () => paused,
        play: () => setAutoAdvance(true),
        pause: () => setAutoAdvance(false),
        setSpeed: (speedFactor) => {
            const wasPlaying = !paused;
            if (wasPlaying) {
                setAutoAdvance(false);
                setAutoAdvance(true, 1000 / speedFactor);
            }
        },
    cleanup: () => {
            clearInterval(autoAdvanceInterval);
            if (rainSystem) {
                rainSystem.dispose();
            }
        }
    };
};
