import { Crop } from './farm';
import { Product } from './products';

export interface SimulationState {
    // Timeline
    currentDay: number;
    totalDays: number;
    isPlaying: boolean;
    playbackSpeed: number;

    // Selections
    selectedCropId: string | null;
    selectedProducts: Record<string, string[]>; // Map of cropId -> productIds

    // Results
    yieldEstimates: Record<string, CropYieldEstimate>;
    environmentalData: EnvironmentalData | null;
}

export interface CropYieldEstimate {
    cropId: string;
    cropName: string;
    cropType: string;
    baseYieldPerAcre: number;
    estimatedYield: number;
    totalEstimatedYield: number;
    potentialImprovement: number;
    totalPotentialImprovement: number;
    productEffect?: number;
    stressFactors: {
        temperature: number;
        water: number;
        soil: number;
        overall: number;
    };
}

export interface EnvironmentalData {
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

export interface SimulationAction {
    type: string;
    payload?: any;
}

// Simulation event types that can be tracked
export type SimulationEvent =
    | 'CROP_PLANTED'
    | 'PRODUCT_APPLIED'
    | 'STRESS_DETECTED'
    | 'HARVEST_READY'
    | 'WEATHER_CHANGE';

export interface SimulationEventData {
    type: SimulationEvent;
    day: number;
    cropId?: string;
    productId?: string;
    message: string;
    severity?: 'info' | 'warning' | 'success';
}
