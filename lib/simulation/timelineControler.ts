// lib/simulation/timelineController.ts

import { RainSystem, applyWeatherToScene } from '../weather';
import { updatePlantsForGrowthStage } from './plantGrowth';

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
        pause();
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