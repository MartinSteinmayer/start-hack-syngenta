// Constants for crop-related measurements and scaling
export const HECTARE_TO_SQUARE_METERS = 1000; // 1 hectare = 10,000 square meters
export const SCALE_FACTOR = 1.0; // Scale for visualization (1 meter = 1 unit in Three.js)

// Plant density per hectare (approximate real-world values)
export const PLANTS_PER_HECTARE = {
    corn: 80000,      // 80,000 plants per hectare
    wheat: 2500000,   // 2.5 million plants per hectare
    soybean: 400000,  // 400,000 plants per hectare
    cotton: 100000,   // 100,000 plants per hectare
    rice: 200000      // 200,000 plants per hectare
};

// Plant heights in meters (approximate real-world values)
export const PLANT_HEIGHTS = {
    corn: 2.5,      // 2.5 meters at full growth
    wheat: 0.8,     // 0.8 meters at full growth
    soybean: 1.5,   // 1.0 meters at full growth
    cotton: 1.2,    // 1.2 meters at full growth
    rice: 1.0       // 1.0 meters at full growth
};

// Plant row spacing in meters (typical agricultural practice)
export const PLANT_ROW_SPACING = {
    corn: 0.76,     // 76 cm between rows
    wheat: 0.15,    // 15 cm between rows
    soybean: 0.5,   // 50 cm between rows
    cotton: 1.0,    // 1 meter between rows
    rice: 0.3       // 30 cm between rows  
};

// Plant spacing within rows in meters (typical agricultural practice)
export const PLANT_SPACING_IN_ROW = {
    corn: 0.16,     // 16 cm between plants in a row
    wheat: 0.025,   // 2.5 cm between plants in a row
    soybean: 0.05,  // 5 cm between plants in a row
    cotton: 0.1,    // 10 cm between plants in a row
    rice: 0.15      // 15 cm between plants in a row
};

// Randomization factors for natural-looking variations
export const RANDOMIZATION_FACTORS = {
    position: 0.05,    // Random position variation (% of spacing)
    rotation: 0.5,     // Random rotation (radians)
    scale: 0.15        // Random scale variation (% of size)
};

// Returns a slightly varied height for natural variation
export const getRandomizedHeight = (baseHeight: number): number => {
    // Return between 85% and 115% of the base height
    return baseHeight * (0.85 + Math.random() * 0.3);
};

// Calculate grid dimensions for a given crop type and field size
export const calculateGridDimensions = (cropType: string, fieldWidthMeters: number, fieldHeightMeters: number) => {
    const rowSpacing = PLANT_ROW_SPACING[cropType] || 0.5;
    const plantSpacing = PLANT_SPACING_IN_ROW[cropType] || 0.1;

    // Calculate number of rows and plants per row
    const numRows = Math.floor(fieldHeightMeters / rowSpacing);
    const plantsPerRow = Math.floor(fieldWidthMeters / plantSpacing);

    return {
        numRows,
        plantsPerRow,
        rowSpacing,
        plantSpacing
    };
};


export const CERRADO_GROWTH_FACTORS = {
    // Different crops require different optimization strategies in Cerrado
    corn: {
        temperature: {
            optimal: 28, // Optimal temperature for corn in Cerrado is higher
            tolerance: 6  // Tolerance range +/- in degrees
        },
        moisture: {
            optimal: 65, // Optimal humidity percentage
            drought_resistant: true // Corn varieties in Cerrado are bred for drought resistance
        },
        growth_cycle: {
            seedling_days: 10,
            vegetative_days: 40,
            reproductive_days: 30,
            mature_days: 15
        }
    },
    soybean: {
        temperature: {
            optimal: 27, // Optimal temperature for soybean in Cerrado
            tolerance: 5
        },
        moisture: {
            optimal: 60,
            drought_resistant: true
        },
        growth_cycle: {
            seedling_days: 8,
            vegetative_days: 35,
            reproductive_days: 35,
            mature_days: 20
        }
    },
    cotton: {
        temperature: {
            optimal: 30, // Cotton prefers hotter conditions
            tolerance: 7
        },
        moisture: {
            optimal: 50, // Can handle drier conditions well
            drought_resistant: true
        },
        growth_cycle: {
            seedling_days: 15,
            vegetative_days: 45,
            reproductive_days: 40,
            mature_days: 25
        }
    },
    rice: {
        temperature: {
            optimal: 29,
            tolerance: 4
        },
        moisture: {
            optimal: 80, // Needs more water
            drought_resistant: false
        },
        growth_cycle: {
            seedling_days: 12,
            vegetative_days: 30,
            reproductive_days: 35,
            mature_days: 18
        }
    },
    wheat: {
        temperature: {
            optimal: 25, // Lower optimal temp, challenging in Cerrado
            tolerance: 4
        },
        moisture: {
            optimal: 55,
            drought_resistant: false // Wheat struggles more during dry season
        },
        growth_cycle: {
            seedling_days: 10,
            vegetative_days: 30,
            reproductive_days: 28,
            mature_days: 15
        }
    }
};

/**
 * Calculate growth factor for crops in Cerrado region
 * @param {string} cropType - Type of crop
 * @param {number} temperature - Current temperature
 * @param {number} humidity - Current humidity
 * @param {string} weatherType - Current weather type
 * @returns {number} - Growth factor between 0-1
 */
export function calculateCerradoGrowthFactor(cropType, temperature, humidity, weatherType) {
    const cropSettings = CERRADO_GROWTH_FACTORS[cropType] || CERRADO_GROWTH_FACTORS.corn;

    // Temperature factor calculation - bell curve around optimal
    const tempDiff = Math.abs(temperature - cropSettings.temperature.optimal);
    const tempFactor = Math.max(0, 1 - (tempDiff / cropSettings.temperature.tolerance));

    // Moisture/humidity factor calculation
    let moistureFactor;
    if (cropSettings.moisture.drought_resistant) {
        // Drought resistant crops can handle lower humidity better
        moistureFactor = humidity < cropSettings.moisture.optimal
            ? Math.max(0.4, humidity / cropSettings.moisture.optimal)
            : 1 - ((humidity - cropSettings.moisture.optimal) / 50);
    } else {
        // Non-drought resistant crops need more consistent moisture
        moistureFactor = humidity < cropSettings.moisture.optimal
            ? Math.max(0.2, humidity / cropSettings.moisture.optimal)
            : 1 - ((humidity - cropSettings.moisture.optimal) / 40);
    }
    moistureFactor = Math.max(0, Math.min(1, moistureFactor));

    // Sunlight factor based on weather
    const sunFactor = weatherType === 'sunny' ? 1.0 :
        weatherType === 'partly_cloudy' ? 0.9 :
            weatherType === 'cloudy' ? 0.7 :
                weatherType === 'rainy' ? 0.5 : 0.3;

    // Calculating final growth factor with appropriate weights
    // In Cerrado, temperature and moisture are especially critical
    let growthFactor = (tempFactor * 0.4) + (moistureFactor * 0.4) + (sunFactor * 0.2);

    // Additional Cerrado-specific adjustments:
    // Growth boost for crops during optimal season
    // Corn and soybean thrive in wet season, cotton can handle dry season better
    const currentMonth = new Date().getMonth();
    const isWetSeason = (currentMonth >= 9 || currentMonth <= 3);

    if (cropType === 'corn' || cropType === 'soybean' || cropType === 'rice') {
        growthFactor *= isWetSeason ? 1.1 : 0.9;
    } else if (cropType === 'cotton') {
        growthFactor *= isWetSeason ? 1.0 : 1.0; // Cotton is adaptable
    } else if (cropType === 'wheat') {
        growthFactor *= isWetSeason ? 0.9 : 1.0; // Wheat does a bit better in drier conditions
    }

    return Math.max(0, Math.min(1, growthFactor));
}
