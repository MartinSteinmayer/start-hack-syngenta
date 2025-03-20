export interface GeoLocation {
    lat: number;
    lng: number;
}

export interface Crop {
    id: string;
    name: string;
    type: CropType;
    acreage: number;
}

export type CropType =
    | 'rice'
    | 'wheat'
    | 'corn'
    | 'soybean'
    | 'cotton'
    | 'vegetable'
    | 'fruit';

export interface FarmData {
    id?: string;
    name: string;
    location: GeoLocation;
    crops: Crop[];
    totalAcreage: number;
    soilType?: string;
    waterSource?: string;
}
