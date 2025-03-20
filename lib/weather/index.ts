import * as THREE from 'three';

// Weather constants
export const WEATHER_TYPES = {
  SUNNY: 'sunny',
  PARTLY_CLOUDY: 'partly_cloudy',
  CLOUDY: 'cloudy',
  RAINY: 'rainy',
  STORMY: 'stormy'
};

// Weather probabilities (can be adjusted seasonally)
const BASE_WEATHER_PROBABILITIES = {
  [WEATHER_TYPES.SUNNY]: 0.4,
  [WEATHER_TYPES.PARTLY_CLOUDY]: 0.3,
  [WEATHER_TYPES.CLOUDY]: 0.15,
  [WEATHER_TYPES.RAINY]: 0.1,
  [WEATHER_TYPES.STORMY]: 0.05
};

// Weather effects settings
const WEATHER_SETTINGS = {
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

/**
 * Generate weather data for a specified number of days
 * @param {number} days - Number of days to generate weather for
 * @param {Date} startDate - Starting date
 * @returns {Array} - Array of day objects with weather data
 */
export const generateWeatherData = (days, startDate = new Date('2025-03-20')) => {
  const weatherData = [];
  const currentDate = new Date(startDate);
  
  // Get the proper month for seasonality
  const getSeasonalFactor = (date) => {
    const month = date.getMonth();
    // Northern hemisphere seasons (adjust if needed)
    if (month >= 2 && month <= 4) return 'spring'; // March-May
    if (month >= 5 && month <= 7) return 'summer'; // June-August
    if (month >= 8 && month <= 10) return 'fall';  // September-November
    return 'winter'; // December-February
  };
  
  // Adjust weather probabilities based on season
  const getSeasonalProbabilities = (season) => {
    const probs = { ...BASE_WEATHER_PROBABILITIES };
    
    switch (season) {
      case 'spring':
        probs[WEATHER_TYPES.RAINY] = 0.2;
        probs[WEATHER_TYPES.SUNNY] = 0.3;
        break;
      case 'summer':
        probs[WEATHER_TYPES.SUNNY] = 0.5;
        probs[WEATHER_TYPES.RAINY] = 0.1;
        break;
      case 'fall':
        probs[WEATHER_TYPES.CLOUDY] = 0.25;
        probs[WEATHER_TYPES.RAINY] = 0.15;
        break;
      case 'winter':
        probs[WEATHER_TYPES.SUNNY] = 0.2;
        probs[WEATHER_TYPES.CLOUDY] = 0.3;
        break;
    }
    
    return probs;
  };
  
  // Create a coherent sequence of weather (not too random)
  let prevWeather = null;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(currentDate);
    const season = getSeasonalFactor(date);
    const probabilities = getSeasonalProbabilities(season);
    
    // Weather tends to persist (we'll use this to create more realistic sequences)
    let weather;
    if (prevWeather && Math.random() < 0.7) {
      // 70% chance weather is similar to previous day
      const possibleWeathers = Object.keys(WEATHER_TYPES);
      const prevIndex = possibleWeathers.indexOf(prevWeather);
      
      // Get a weather that's at most one step away from the previous
      const maxStep = 1;
      const minIndex = Math.max(0, prevIndex - maxStep);
      const maxIndex = Math.min(possibleWeathers.length - 1, prevIndex + maxStep);
      const randomIndex = minIndex + Math.floor(Math.random() * (maxIndex - minIndex + 1));
      
      weather = possibleWeathers[randomIndex];
    } else {
      // Completely random weather based on probabilities
      const rand = Math.random();
      let cumulativeProbability = 0;
      
      for (const [type, probability] of Object.entries(probabilities)) {
        cumulativeProbability += probability;
        if (rand < cumulativeProbability) {
          weather = type;
          break;
        }
      }
    }
    
    prevWeather = weather;
    
    // Generate temperature based on season and weather
    let baseTemp = 0;
    switch (season) {
      case 'spring': baseTemp = 15; break; // ~60°F
      case 'summer': baseTemp = 25; break; // ~77°F
      case 'fall': baseTemp = 18; break;   // ~64°F
      case 'winter': baseTemp = 5; break;  // ~41°F
    }
    
    // Adjust for weather conditions
    let tempModifier = 0;
    switch (weather) {
      case WEATHER_TYPES.SUNNY: tempModifier = 5; break;
      case WEATHER_TYPES.PARTLY_CLOUDY: tempModifier = 2; break;
      case WEATHER_TYPES.CLOUDY: tempModifier = 0; break;
      case WEATHER_TYPES.RAINY: tempModifier = -3; break;
      case WEATHER_TYPES.STORMY: tempModifier = -5; break;
    }
    
    // Add some randomness
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
    
    // Add some randomness to humidity
    const humidityVariance = (Math.random() * 10) - 5; // -5 to +5 percent
    
    // Generate a daily growth factor based on conditions
    // Plants like moderate temperature, good sunlight, and adequate moisture
    const tempFactor = 1 - Math.abs(22 - (baseTemp + tempModifier + tempVariance)) / 22;
    const sunFactor = weather === WEATHER_TYPES.SUNNY ? 1.0 : 
                      weather === WEATHER_TYPES.PARTLY_CLOUDY ? 0.8 : 
                      weather === WEATHER_TYPES.CLOUDY ? 0.6 : 
                      weather === WEATHER_TYPES.RAINY ? 0.4 : 0.3;
    const moistureFactor = Math.min(1.0, (baseHumidity + humidityVariance) / 70);
    
    // Calculate growth factor (ideally between 0 and 1)
    const growthFactor = (tempFactor * 0.4 + sunFactor * 0.3 + moistureFactor * 0.3);
    
    weatherData.push({
      date,
      dayNumber: i + 1,
      dateString: date.toLocaleDateString(),
      weather,
      temperature: Math.round((baseTemp + tempModifier + tempVariance) * 10) / 10,
      humidity: Math.round(baseHumidity + humidityVariance),
      growthFactor: Math.max(0, Math.min(1, growthFactor)),
      settings: WEATHER_SETTINGS[weather]
    });
    
    // Increment the date by one day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return weatherData;
};

// Rain particle system
export class RainSystem {
  constructor(scene, count) {
    this.scene = scene;
    this.count = count;
    this.particles = null;
    
    if (count > 0) {
      this.createRain();
    }
  }
  
  createRain() {
    if (this.particles) {
      this.scene.remove(this.particles);
    }
    
    if (this.count <= 0) return;
    
    // Create rain particles
    const rainGeometry = new THREE.BufferGeometry();
    const rainVertices = [];
    const rainVelocity = [];
    
    const limit = 100; // Area limit
    
    for (let i = 0; i < this.count; i++) {
      // Random positions within a reasonable area
      const x = (Math.random() * 2 - 1) * limit;
      const y = (Math.random() * 100) + 10;
      const z = (Math.random() * 2 - 1) * limit;
      
      rainVertices.push(x, y, z);
      
      // Velocity vector (falling down with slight angle)
      const velocity = 0.1 + Math.random() * 0.3;
      rainVelocity.push(0, -velocity, 0);
    }
    
    rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rainVertices, 3));
    rainGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(rainVelocity, 3));
    
    const rainMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.15,
      transparent: true,
      opacity: 0.7
    });
    
    this.particles = new THREE.Points(rainGeometry, rainMaterial);
    this.scene.add(this.particles);
  }
  
  update() {
    if (!this.particles) return;
    
    const positions = this.particles.geometry.attributes.position;
    const velocity = this.particles.geometry.attributes.velocity;
    
    for (let i = 0; i < positions.count; i++) {
      // Update position based on velocity
      positions.array[i * 3 + 0] += velocity.array[i * 3 + 0]; // x
      positions.array[i * 3 + 1] += velocity.array[i * 3 + 1]; // y
      positions.array[i * 3 + 2] += velocity.array[i * 3 + 2]; // z
      
      // Reset particles that go below ground level
      if (positions.array[i * 3 + 1] < 0) {
        const limit = 100;
        positions.array[i * 3 + 0] = (Math.random() * 2 - 1) * limit; // x
        positions.array[i * 3 + 1] = 100 + Math.random() * 20; // y
        positions.array[i * 3 + 2] = (Math.random() * 2 - 1) * limit; // z
      }
    }
    
    positions.needsUpdate = true;
  }
  
  setCount(count) {
    if (this.count !== count) {
      this.count = count;
      this.createRain();
    }
  }
  
  dispose() {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.particles = null;
    }
  }
}

/**
 * Apply weather settings to the scene
 * @param {Object} weather - Weather data object
 * @param {THREE.Scene} scene - The scene to apply weather to
 * @param {Object} lightRefs - Object containing references to lights
 * @param {Array} cloudRefs - Array of cloud objects
 * @param {RainSystem} rainSystem - Rain particle system
 */
export const applyWeatherToScene = (weather, scene, lightRefs, cloudRefs, rainSystem) => {
  if (!weather || !scene || !weather.settings) {
    console.error('Missing required parameters in applyWeatherToScene:', 
                 { weatherExists: !!weather, sceneExists: !!scene, 
                   settingsExist: weather ? !!weather.settings : false });
    return { rainSystem }; // Return early to prevent error
  }
  
  const settings = weather.settings;
  
  // Update fog
  if (scene.fog) {
    scene.fog.color.set(settings.fogColor);
    scene.fog.density = settings.fogDensity;
  } else {
    scene.fog = new THREE.FogExp2(settings.fogColor, settings.fogDensity);
  }
  
  // Update sky color
  scene.background = new THREE.Color(settings.skyColor);
  
  // Update lights
  if (lightRefs && lightRefs.directional) {
    lightRefs.directional.intensity = settings.lightIntensity;
  }
  
  if (lightRefs && lightRefs.ambient) {
    lightRefs.ambient.intensity = settings.ambientIntensity;
  }
  
  // Update cloud opacity and count
  if (cloudRefs && cloudRefs.length > 0) {
    // Set visibility for all clouds
    cloudRefs.forEach((cloud, index) => {
      if (cloud.material) {
        cloud.material.opacity = settings.cloudOpacity;
      } else if (cloud.children && cloud.children.length > 0) {
        cloud.children.forEach(part => {
          if (part.material) {
            part.material.opacity = settings.cloudOpacity;
          }
        });
      }
      
      // Hide excess clouds if we need fewer
      if (index < settings.cloudCount) {
        cloud.visible = true;
      } else {
        cloud.visible = false;
      }
    });
  }
  
  // Update rain
  if (rainSystem) {
    rainSystem.setCount(settings.rainParticles);
  }
  
  return { 
    rainSystem
  };
};