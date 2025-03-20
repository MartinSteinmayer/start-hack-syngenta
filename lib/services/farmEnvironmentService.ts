import { FarmData, Crop, GeoLocation } from '@/types/farm';

interface EnvironmentalData {
    forecast?: {
        daily: Array<{
            date: string;
            temperature: {
                max: number;
                min: number;
                avg: number;
            };
            precipitation: number;
            humidity: number;
            windSpeed: number;
            globalRadiation: number;
        }>;
        hourly?: Array<any>;
    };
    historical?: any;
    soil?: {
        texture: string;
        properties: {
            bulkDensity: number;
            organicMatter: number;
            ph: number;
            waterHoldingCapacity: number;
            cationExchangeCapacity: number;
        };
    };
    stress_factors?: {
        current: {
            drought: number;
            heat: number;
            nutrient_deficiency: number;
        };
        forecast: Array<{
            date: string;
            drought: number;
            heat: number;
            nutrient_deficiency: number;
        }>;
    };
}

interface CropRequirements {
    temperature: {
        min: number;
        optimal: number;
        max: number;
    };
    water: {
        min: number;    // mm/day
        optimal: number;
        max: number;
    };
    soil: {
        ph: {
            min: number;
            optimal: number;
            max: number;
        };
        preferredTextures: string[];
    };
}

// Crop requirements database (simplified)
const cropRequirementsMap: Record<string, CropRequirements> = {
    rice: {
        temperature: { min: 20, optimal: 30, max: 35 },
        water: { min: 6, optimal: 10, max: 15 },
        soil: {
            ph: { min: 5.5, optimal: 6.5, max: 7.0 },
            preferredTextures: ["Clay", "Silty Clay", "Clay Loam"]
        }
    },
    wheat: {
        temperature: { min: 15, optimal: 23, max: 32 },
        water: { min: 3, optimal: 5, max: 8 },
        soil: {
            ph: { min: 6.0, optimal: 7.0, max: 7.5 },
            preferredTextures: ["Loam", "Clay Loam", "Silty Loam"]
        }
    },
    corn: {
        temperature: { min: 18, optimal: 27, max: 35 },
        water: { min: 4, optimal: 6, max: 9 },
        soil: {
            ph: { min: 5.8, optimal: 6.8, max: 7.2 },
            preferredTextures: ["Loam", "Silty Loam", "Sandy Loam"]
        }
    },
    soybean: {
        temperature: { min: 20, optimal: 28, max: 35 },
        water: { min: 4, optimal: 6, max: 8 },
        soil: {
            ph: { min: 6.0, optimal: 6.8, max: 7.5 },
            preferredTextures: ["Loam", "Silty Loam", "Clay Loam"]
        }
    },
    cotton: {
        temperature: { min: 18, optimal: 30, max: 38 },
        water: { min: 5, optimal: 7, max: 9 },
        soil: {
            ph: { min: 5.8, optimal: 7.0, max: 8.0 },
            preferredTextures: ["Loam", "Sandy Loam", "Clay Loam"]
        }
    },
    vegetable: {
        temperature: { min: 15, optimal: 24, max: 30 },
        water: { min: 3, optimal: 5, max: 7 },
        soil: {
            ph: { min: 6.0, optimal: 6.8, max: 7.5 },
            preferredTextures: ["Loam", "Silty Loam", "Sandy Loam"]
        }
    },
    fruit: {
        temperature: { min: 15, optimal: 25, max: 33 },
        water: { min: 3, optimal: 5, max: 8 },
        soil: {
            ph: { min: 6.0, optimal: 6.5, max: 7.2 },
            preferredTextures: ["Loam", "Sandy Loam", "Silty Loam"]
        }
    }
};

/**
 * Fetches environmental data for a farm location
 */
export async function fetchEnvironmentalData(location: GeoLocation): Promise<EnvironmentalData> {
    try {
        // Calculate dates for API query
        const today = new Date();
        const startDate = today.toISOString().split('T')[0];
        const endDate = new Date(today.setDate(today.getDate() + 14)).toISOString().split('T')[0];

        // Fetch forecast data
        const forecastResponse = await fetch(
            `/api/environmental-data?lat=${location.lat}&lng=${location.lng}&type=forecast&startDate=${startDate}&endDate=${endDate}`
        );

        if (!forecastResponse.ok) {
            throw new Error(`Failed to fetch forecast data: ${forecastResponse.status}`);
        }

        const forecastData = await forecastResponse.json();

        // Fetch soil data
        const soilResponse = await fetch(
            `/api/environmental-data?lat=${location.lat}&lng=${location.lng}&type=soil`
        );

        if (!soilResponse.ok) {
            throw new Error(`Failed to fetch soil data: ${soilResponse.status}`);
        }

        const soilData = await soilResponse.json();

        // Combine the data
        return {
            ...forecastData,
            ...soilData
        };
    } catch (error) {
        console.error('Error fetching environmental data:', error);
        throw error;
    }
}

/**
 * Analyzes environmental conditions for a specific crop
 */
export function analyzeCropSuitability(crop: Crop, environmentalData: EnvironmentalData) {
    const cropRequirements = cropRequirementsMap[crop.type];
    const results = {
        temperature: { suitability: 0, stress: 0 },
        water: { suitability: 0, stress: 0 },
        soil: { suitability: 0, stress: 0 },
        overall: { suitability: 0, stress: 0 }
    };

    // Temperature analysis
    if (environmentalData.forecast?.daily) {
        const forecast = environmentalData.forecast.daily;
        let tempSuitabilitySum = 0;
        let tempStressSum = 0;

        forecast.forEach(day => {
            const avgTemp = day.temperature.avg;
            const { min, optimal, max } = cropRequirements.temperature;

            // Calculate temperature suitability (0-1 scale)
            let tempSuitability = 0;
            if (avgTemp < min) {
                tempSuitability = 0;
            } else if (avgTemp < optimal) {
                tempSuitability = (avgTemp - min) / (optimal - min);
            } else if (avgTemp <= max) {
                tempSuitability = 1 - (avgTemp - optimal) / (max - optimal);
            } else {
                tempSuitability = 0;
            }

            // Calculate temperature stress
            let tempStress = 0;
            if (avgTemp < min) {
                tempStress = (min - avgTemp) / min * 0.5; // Cold stress
            } else if (avgTemp > max) {
                tempStress = (avgTemp - max) / max * 0.5; // Heat stress
            }

            tempSuitabilitySum += tempSuitability;
            tempStressSum += tempStress;
        });

        results.temperature.suitability = tempSuitabilitySum / forecast.length;
        results.temperature.stress = tempStressSum / forecast.length;
    }

    // Water/precipitation analysis
    if (environmentalData.forecast?.daily) {
        const forecast = environmentalData.forecast.daily;
        let waterSuitabilitySum = 0;
        let waterStressSum = 0;

        forecast.forEach(day => {
            const precip = day.precipitation;
            const { min, optimal, max } = cropRequirements.water;

            // Calculate water suitability (0-1 scale)
            let waterSuitability = 0;
            if (precip < min) {
                waterSuitability = precip / min;
            } else if (precip < optimal) {
                waterSuitability = (precip - min) / (optimal - min);
            } else if (precip <= max) {
                waterSuitability = 1 - (precip - optimal) / (max - optimal);
            } else {
                waterSuitability = Math.max(0, 1 - (precip - max) / max);
            }

            // Calculate water stress
            let waterStress = 0;
            if (precip < min) {
                waterStress = (min - precip) / min; // Drought stress
            } else if (precip > max * 1.5) {
                waterStress = (precip - max * 1.5) / (max * 1.5); // Excess water stress
            }

            waterSuitabilitySum += waterSuitability;
            waterStressSum += waterStress;
        });

        results.water.suitability = waterSuitabilitySum / forecast.length;
        results.water.stress = waterStressSum / forecast.length;
    }

    // Soil analysis
    if (environmentalData.soil) {
        const { texture, properties } = environmentalData.soil;
        const { ph, preferredTextures } = cropRequirements.soil;

        // Calculate pH suitability
        let phSuitability = 0;
        const soilPh = properties.ph;

        if (soilPh < ph.min) {
            phSuitability = Math.max(0, soilPh / ph.min);
        } else if (soilPh < ph.optimal) {
            phSuitability = (soilPh - ph.min) / (ph.optimal - ph.min);
        } else if (soilPh <= ph.max) {
            phSuitability = 1 - (soilPh - ph.optimal) / (ph.max - ph.optimal);
        } else {
            phSuitability = Math.max(0, 1 - (soilPh - ph.max) / 2);
        }

        // Calculate texture suitability
        const textureSuitability = preferredTextures.includes(texture) ? 1 : 0.5;

        results.soil.suitability = (phSuitability + textureSuitability) / 2;
        results.soil.stress = 1 - results.soil.suitability;
    }

    // Calculate overall suitability and stress
    results.overall.suitability = (
        results.temperature.suitability +
        results.water.suitability +
        results.soil.suitability
    ) / 3;

    results.overall.stress = (
        results.temperature.stress +
        results.water.stress +
        results.soil.stress
    ) / 3;

    return results;
}

/**
 * Generates crop yield estimations based on environmental factors
 */
export function estimateCropYield(crop: Crop, environmentalData: EnvironmentalData) {
    const suitabilityResults = analyzeCropSuitability(crop, environmentalData);

    // Base yield potential per acre for each crop (tons)
    const baseYieldPotential: Record<string, number> = {
        rice: 3.5,
        wheat: 2.8,
        corn: 5.0,
        soybean: 1.8,
        cotton: 0.9,
        vegetable: 10.0,
        fruit: 7.5
    };

    // Calculate estimated yield
    const yieldPotential = baseYieldPotential[crop.type] || 1.0;
    const estimatedYield = yieldPotential * (1 - suitabilityResults.overall.stress);

    // Calculate potential improvement with bio-products
    const potentialImprovement = yieldPotential * suitabilityResults.overall.stress * 0.7;

    return {
        cropName: crop.name,
        cropType: crop.type,
        acreage: crop.acreage,
        baseYieldPotential: yieldPotential,
        estimatedYield,
        totalEstimatedYield: estimatedYield * crop.acreage,
        potentialImprovement,
        totalPotentialImprovement: potentialImprovement * crop.acreage,
        stressFactors: {
            temperature: suitabilityResults.temperature.stress,
            water: suitabilityResults.water.stress,
            soil: suitabilityResults.soil.stress
        }
    };
}

/**
 * Analyzes a farm's environmental conditions and crop suitability
 */
export async function analyzeFarm(farmData: FarmData) {
    try {
        // Fetch environmental data for farm location
        const environmentalData = await fetchEnvironmentalData(farmData.location);

        // Analyze each crop
        const cropAnalysis = farmData.crops.map(crop => {
            const suitability = analyzeCropSuitability(crop, environmentalData);
            const yieldEstimate = estimateCropYield(crop, environmentalData);

            return {
                crop,
                suitability,
                yieldEstimate
            };
        });

        // Calculate farm-wide metrics
        const totalAcreage = farmData.totalAcreage;
        const allocatedAcreage = farmData.crops.reduce((sum, crop) => sum + crop.acreage, 0);
        const farmSuitability = cropAnalysis.reduce((sum, analysis) => {
            return sum + (analysis.suitability.overall.suitability * analysis.crop.acreage);
        }, 0) / allocatedAcreage;

        return {
            farmData,
            environmentalData,
            cropAnalysis,
            totalAcreage,
            allocatedAcreage,
            unallocatedAcreage: totalAcreage - allocatedAcreage,
            farmSuitability
        };
    } catch (error) {
        console.error('Error analyzing farm:', error);
        throw error;
    }
}
