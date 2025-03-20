export type ProductCategory = 'Biocontrol' | 'Biofertilizer' | 'Biostimulant';

export interface Product {
    id: string;
    name: string;
    category: ProductCategory;
    type: string;
    description: string;
    applicationMethod: string;
    compatibleCrops: string[];
    dosageRate: Record<string, string>;
    applicationTiming: Record<string, string>;
    effectivenessRating: number; // 1-10 scale
    roiRating: number; // Return on investment rating
    imageUrl?: string;
}

export interface ApplicationSchedule {
    productId: string;
    day: number;
    cropType: string;
    dosage: string;
}
