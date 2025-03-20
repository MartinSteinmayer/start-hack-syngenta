// Constants for crop-related measurements and scaling
export const HECTARE_TO_SQUARE_METERS = 2000; // 1 hectare = 10,000 square meters
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
