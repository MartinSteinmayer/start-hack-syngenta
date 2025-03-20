"use client";

import { useState, useEffect } from 'react';
import { FarmData, Crop, GeoLocation } from '@/types/farm';

// Default India (Karnataka) location
const DEFAULT_LOCATION: GeoLocation = {
    lat: 15.3173,
    lng: 75.7139
};

const DEFAULT_FARM_DATA: FarmData = {
    name: 'My Farm',
    location: DEFAULT_LOCATION,
    crops: [
        {
            id: 'crop_1',
            name: 'Rice Field',
            type: 'rice',
            acreage: 5
        }
    ],
    totalAcreage: 10,
    soilType: 'clay loam',
    waterSource: 'irrigation'
};

interface UseFarmDataReturn {
    farmData: FarmData;
    isLoading: boolean;
    updateFarmData: (data: Partial<FarmData>) => void;
    updateFarmLocation: (location: GeoLocation) => void;
    updateFarmCrops: (crops: Crop[]) => void;
    updateFarmName: (name: string) => void;
    updateFarmSize: (acreage: number) => void;
    saveFarm: () => void;
    resetFarm: () => void;
    error: string | null;
}

export function useFarmData(): UseFarmDataReturn {
    const [farmData, setFarmData] = useState<FarmData>(DEFAULT_FARM_DATA);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load saved farm data on initial mount
    useEffect(() => {
        const loadFarmData = () => {
            try {
                setIsLoading(true);
                const savedFarmData = localStorage.getItem('farmData');

                if (savedFarmData) {
                    const parsedData = JSON.parse(savedFarmData) as FarmData;
                    setFarmData(parsedData);
                }

                setError(null);
            } catch (err) {
                console.error('Error loading farm data:', err);
                setError('Failed to load saved farm data');
            } finally {
                setIsLoading(false);
            }
        };

        loadFarmData();
    }, []);

    // Update entire farm data object
    const updateFarmData = (data: Partial<FarmData>) => {
        setFarmData(prevData => ({
            ...prevData,
            ...data
        }));
    };

    // Update farm location
    const updateFarmLocation = (location: GeoLocation) => {
        setFarmData(prevData => ({
            ...prevData,
            location
        }));
    };

    // Update farm crops
    const updateFarmCrops = (crops: Crop[]) => {
        // Validate crops
        const totalAcreage = crops.reduce((sum, crop) => sum + crop.acreage, 0);

        if (totalAcreage > farmData.totalAcreage) {
            setError(`Total crop acreage (${totalAcreage}) exceeds farm size (${farmData.totalAcreage})`);
        } else {
            setError(null);
        }

        setFarmData(prevData => ({
            ...prevData,
            crops
        }));
    };

    // Update farm name
    const updateFarmName = (name: string) => {
        setFarmData(prevData => ({
            ...prevData,
            name
        }));
    };

    // Update farm size/acreage
    const updateFarmSize = (acreage: number) => {
        // Validate that new size is sufficient for existing crops
        const cropAcreage = farmData.crops.reduce((sum, crop) => sum + crop.acreage, 0);

        if (cropAcreage > acreage) {
            setError(`Cannot reduce farm size to ${acreage} acres as crops require ${cropAcreage} acres`);
        } else {
            setError(null);
            setFarmData(prevData => ({
                ...prevData,
                totalAcreage: acreage
            }));
        }
    };

    // Save farm data to localStorage
    const saveFarm = () => {
        try {
            localStorage.setItem('farmData', JSON.stringify(farmData));
            setError(null);
        } catch (err) {
            console.error('Error saving farm data:', err);
            setError('Failed to save farm data');
        }
    };

    // Reset farm to default
    const resetFarm = () => {
        setFarmData(DEFAULT_FARM_DATA);
        localStorage.removeItem('farmData');
        setError(null);
    };

    return {
        farmData,
        isLoading,
        updateFarmData,
        updateFarmLocation,
        updateFarmCrops,
        updateFarmName,
        updateFarmSize,
        saveFarm,
        resetFarm,
        error,
    };
}
