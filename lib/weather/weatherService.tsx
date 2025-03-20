// lib/weather/weatherService.ts

// List of standardized weather types
export const WEATHER_TYPES = {
    SUNNY: 'sunny',
    PARTLY_CLOUDY: 'partly_cloudy',
    CLOUDY: 'cloudy',
    RAINY: 'rainy',
    STORMY: 'stormy'
  };
  
  // Weather effects settings
  export const WEATHER_SETTINGS = {
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
  
  // Interface for weather data from API
  export interface WeatherApiResponse {
    main: {
      temp: number;
      humidity: number;
    };
    weather: {
      id: number;
      main: string;
      description: string;
    }[];
    wind: {
      speed: number;
    };
    dt: number; // Unix timestamp
  }
  
  // Interface for historical weather data
  export interface HistoricalWeatherDay {
    date: string;
    temperature: number;
    humidity: number;
    weatherType: string;
    windSpeed: number;
  }
  
  // Interface for simulation weather day
  export interface SimulationWeatherDay {
    date: Date;
    dayNumber: number;
    dateString: string;
    weather: string;
    temperature: number;
    humidity: number;
    growthFactor: number;
    settings: any;
  }
  
  // Map OpenWeatherMap condition codes to our weather types
  export function mapWeatherCodeToType(code: number): string {
    // Thunderstorm: 200-299
    if (code >= 200 && code < 300) {
      return WEATHER_TYPES.STORMY;
    }
    // Drizzle and Rain: 300-599
    else if (code >= 300 && code < 600) {
      return WEATHER_TYPES.RAINY;
    }
    // Snow: 600-699 - we'll map to rainy for now
    else if (code >= 600 && code < 700) {
      return WEATHER_TYPES.RAINY;
    }
    // Atmosphere (fog, mist, etc): 700-799
    else if (code >= 700 && code < 800) {
      return WEATHER_TYPES.CLOUDY;
    }
    // Clear: 800
    else if (code === 800) {
      return WEATHER_TYPES.SUNNY;
    }
    // Clouds: 801-899
    else if (code > 800 && code < 900) {
      // Few clouds (801) or scattered clouds (802) maps to partly cloudy
      return code <= 802 ? WEATHER_TYPES.PARTLY_CLOUDY : WEATHER_TYPES.CLOUDY;
    }
    // Default
    return WEATHER_TYPES.PARTLY_CLOUDY;
  }
  
  // Calculate growth factor based on weather conditions
  export function calculateGrowthFactor(temperature: number, weatherType: string, humidity: number): number {
    // Optimal temperature range for most crops is around 15-25°C (59-77°F)
    const tempFactor = 1 - Math.abs(20 - temperature) / 20;
    
    // Plants like sunlight but need some water too
    const sunFactor = weatherType === WEATHER_TYPES.SUNNY ? 1.0 : 
                    weatherType === WEATHER_TYPES.PARTLY_CLOUDY ? 0.8 : 
                    weatherType === WEATHER_TYPES.CLOUDY ? 0.6 : 
                    weatherType === WEATHER_TYPES.RAINY ? 0.4 : 0.3;
    
    // Optimal humidity range is around 60-70%
    const moistureFactor = Math.min(1.0, humidity / 70) * (humidity <= 85 ? 1 : 0.8);
    
    // Combine factors with different weights
    return Math.max(0, Math.min(1, (tempFactor * 0.4 + sunFactor * 0.3 + moistureFactor * 0.3)));
  }
  
  // Generate random historical weather for a location based on climate patterns
  export function generateHistoricalWeather(
    latitude: number, 
    longitude: number, 
    startDate: Date, 
    days: number
  ): HistoricalWeatherDay[] {
    const weatherData: HistoricalWeatherDay[] = [];
    const currentDate = new Date(startDate);
    
    // Determine hemisphere and adjust seasonal patterns
    const isNorthernHemisphere = latitude > 0;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(currentDate);
      
      // Get month to determine season
      const month = date.getMonth();
      
      // Determine season based on hemisphere
      let season;
      if (isNorthernHemisphere) {
        if (month >= 2 && month <= 4) season = 'spring';
        else if (month >= 5 && month <= 7) season = 'summer';
        else if (month >= 8 && month <= 10) season = 'fall';
        else season = 'winter';
      } else {
        if (month >= 2 && month <= 4) season = 'fall';
        else if (month >= 5 && month <= 7) season = 'winter';
        else if (month >= 8 && month <= 10) season = 'spring';
        else season = 'summer';
      }
      
      // Adjust base temperature based on latitude (equator is hotter)
      let baseTemp = 20 - Math.abs(latitude) * 0.4;
      
      // Seasonal adjustments
      switch (season) {
        case 'spring': baseTemp += 5; break;
        case 'summer': baseTemp += 10; break;
        case 'fall': baseTemp += 2; break;
        case 'winter': baseTemp -= 5; break;
      }
      
      // Weather determination - weather patterns are more consistent
      // and influenced by previous day
      let weatherType;
      if (i === 0 || Math.random() < 0.3) {
        // New weather pattern
        const rand = Math.random();
        if (rand < 0.4) weatherType = WEATHER_TYPES.SUNNY;
        else if (rand < 0.7) weatherType = WEATHER_TYPES.PARTLY_CLOUDY;
        else if (rand < 0.85) weatherType = WEATHER_TYPES.CLOUDY;
        else if (rand < 0.95) weatherType = WEATHER_TYPES.RAINY;
        else weatherType = WEATHER_TYPES.STORMY;
        
        // Seasonal adjustments to weather probability
        if (season === 'summer' && weatherType === WEATHER_TYPES.SUNNY) weatherType = WEATHER_TYPES.SUNNY;
        if (season === 'winter' && weatherType === WEATHER_TYPES.SUNNY && Math.random() < 0.5) weatherType = WEATHER_TYPES.CLOUDY;
        if (season === 'spring' && weatherType === WEATHER_TYPES.PARTLY_CLOUDY && Math.random() < 0.4) weatherType = WEATHER_TYPES.RAINY;
      } else {
        // Continue previous weather pattern
        weatherType = weatherData[i - 1].weatherType;
        
        // Some chance of change
        if (Math.random() < 0.2) {
          const options = [WEATHER_TYPES.SUNNY, WEATHER_TYPES.PARTLY_CLOUDY, WEATHER_TYPES.CLOUDY, WEATHER_TYPES.RAINY];
          weatherType = options[Math.floor(Math.random() * options.length)];
        }
      }
      
      // Adjust temperature based on weather
      let tempModifier = 0;
      switch (weatherType) {
        case WEATHER_TYPES.SUNNY: tempModifier = 3; break;
        case WEATHER_TYPES.PARTLY_CLOUDY: tempModifier = 1; break;
        case WEATHER_TYPES.CLOUDY: tempModifier = -1; break;
        case WEATHER_TYPES.RAINY: tempModifier = -3; break;
        case WEATHER_TYPES.STORMY: tempModifier = -5; break;
      }
      
      // Add some random variation
      const tempVariance = (Math.random() * 4) - 2; // -2 to +2 degrees
      
      // Calculate humidity based on weather type and location
      let baseHumidity = 60; // Default humidity
      
      // Adjust humidity based on weather
      switch (weatherType) {
        case WEATHER_TYPES.SUNNY: baseHumidity -= 20; break;
        case WEATHER_TYPES.PARTLY_CLOUDY: baseHumidity -= 10; break;
        case WEATHER_TYPES.CLOUDY: baseHumidity += 5; break;
        case WEATHER_TYPES.RAINY: baseHumidity += 20; break;
        case WEATHER_TYPES.STORMY: baseHumidity += 30; break;
      }
      
      // Add some random variation to humidity
      const humidityVariance = (Math.random() * 10) - 5; // -5 to +5 percent
      
      // Generate wind speed based on weather and location
      let baseWindSpeed = 2 + Math.random() * 3; // Base wind speed in m/s
      
      // Adjust wind speed based on weather
      switch (weatherType) {
        case WEATHER_TYPES.SUNNY: baseWindSpeed *= 0.8; break;
        case WEATHER_TYPES.PARTLY_CLOUDY: baseWindSpeed *= 1.0; break;
        case WEATHER_TYPES.CLOUDY: baseWindSpeed *= 1.2; break;
        case WEATHER_TYPES.RAINY: baseWindSpeed *= 1.5; break;
        case WEATHER_TYPES.STORMY: baseWindSpeed *= 2.5; break;
      }
      
      // Add to weather data array
      weatherData.push({
        date: date.toISOString().split('T')[0],
        temperature: Math.round((baseTemp + tempModifier + tempVariance) * 10) / 10,
        humidity: Math.min(100, Math.max(10, Math.round(baseHumidity + humidityVariance))),
        weatherType: weatherType,
        windSpeed: Math.round(baseWindSpeed * 10) / 10
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return weatherData;
  }
  
  // Convert historical weather data to simulation weather days
  export function convertToSimulationWeatherDays(
    historicalData: HistoricalWeatherDay[]
  ): SimulationWeatherDay[] {
    return historicalData.map((day, index) => {
      const growthFactor = calculateGrowthFactor(
        day.temperature,
        day.weatherType,
        day.humidity
      );
      
      return {
        date: new Date(day.date),
        dayNumber: index + 1,
        dateString: new Date(day.date).toLocaleDateString(),
        weather: day.weatherType,
        temperature: day.temperature,
        humidity: day.humidity,
        growthFactor: growthFactor,
        settings: WEATHER_SETTINGS[day.weatherType]
      };
    });
  }
  
  // Fetch current weather data from OpenWeatherMap API
  export async function fetchCurrentWeather(
    latitude: number,
    longitude: number,
    apiKey: string
  ): Promise<WeatherApiResponse> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API responded with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }
  
  // Convert API response to our weather format
  export function processWeatherApiResponse(
    apiResponse: WeatherApiResponse
  ): {
    temperature: number;
    humidity: number;
    weatherType: string;
    windSpeed: number;
  } {
    // Get weather code from the first weather item
    const weatherCode = apiResponse.weather[0].id;
    
    return {
      temperature: apiResponse.main.temp,
      humidity: apiResponse.main.humidity,
      weatherType: mapWeatherCodeToType(weatherCode),
      windSpeed: apiResponse.wind.speed
    };
  }