// Constants for crop-related measurements and scaling
export const HECTARE_TO_SQUARE_METERS = 10000; // 1 hectare = 10,000 square meters
export const SCALE_FACTOR = 0.25; // Scale for visualization (1 meter = 0.25 units in Three.js)

// Plant density per hectare (approximate real-world values)
export const PLANTS_PER_HECTARE = {
  corn: 70000 / 10,
  wheat: 220000 / 10,
  soybean: 360000 / 10,
  cotton: 70000 / 10,
  rice: 200000 / 10
};

// Plant heights in meters (approximate real-world values)
export const PLANT_HEIGHTS = {
  corn: 10,
  wheat: 1.0,
  soybean: 0.9,
  cotton: 1.2,
  rice: 1.0
};

// Returns a slightly varied height for natural variation
export const getRandomizedHeight = (baseHeight) => {
  return baseHeight * (0.85 + Math.random() * 0.3);
};