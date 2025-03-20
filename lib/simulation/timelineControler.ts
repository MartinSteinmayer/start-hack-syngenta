// lib/simulation/timelineController.ts
import { RainSystem, applyWeatherToScene } from '../weather';
import { updatePlantsForGrowthStage } from './plantGrowth';
import { determineGrowthStage } from './timeline';

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

        // Update plants with improved growth logic
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

    // Create and return the controller object with all methods
    return {
        // Core timeline data access - explicitly expose the timeline
        getTimeline: () => timeline,
        getAllDays: () => timeline.days,

        // Core timeline navigation methods
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

        // Playback control methods
        isPaused: () => paused,
        play: () => setAutoAdvance(true),
        pause: () => setAutoAdvance(false),
        setSpeed: (speedFactor) => {
            const wasPlaying = !paused;
            if (wasPlaying) {
                pause();
                setAutoAdvance(true, 1000 / speedFactor);
            }
        },

        // Growth rate modification method
        applyGrowthRateIncrease: (growthRateIncrease, startDayIndex) => {
            console.log(`Applying growth rate increase of ${growthRateIncrease} starting from day ${startDayIndex}`);

            // Apply growth rate increase to future days
            for (let i = startDayIndex; i < timeline.days.length; i++) {
                const day = timeline.days[i];

                // Calculate new growth factor with the increase
                const originalGrowthFactor = day.growthFactor;
                const newGrowthFactor = Math.min(1.0, originalGrowthFactor * (1 + growthRateIncrease));

                // Update the day's growth factor and percent
                day.growthFactor = newGrowthFactor;
                day.growthPercent = newGrowthFactor; // For backward compatibility

                // Determine new growth stage based on updated growth factor
                day.growthStage = determineGrowthStage(newGrowthFactor);
            }

            // Update the current day to refresh the display
            updateSceneForDay(currentDayIndex);
        },

        // Cleanup method
        cleanup: () => {
            clearInterval(autoAdvanceInterval);
            if (rainSystem) {
                rainSystem.dispose();
            }
        }
    };
};

// Export the determineGrowthStage function to make it available globally for fallback implementations
if (typeof window !== 'undefined') {
    window.determineGrowthStage = determineGrowthStage;
}
