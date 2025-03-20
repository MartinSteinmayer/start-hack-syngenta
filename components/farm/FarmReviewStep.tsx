// components/farm/FarmReviewStep.tsx
'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamically import the MapComponent with no SSR to prevent Leaflet issues
const MapComponent = dynamic(
    () => import('./MapComponent'),
    { ssr: false }
);

interface FarmReviewStepProps {
    farmLocation: { latitude: number; longitude: number; name: string };
    farmSize: number;
    farmPolygon: Array<{ latitude: number; longitude: number }>;
    cropType: string;
    onStartSimulation: () => void;
    onBack: () => void;
}

const FarmReviewStep: React.FC<FarmReviewStepProps> = ({
    farmLocation,
    farmSize,
    farmPolygon,
    cropType,
    onStartSimulation,
    onBack
}) => {
    const [isStarting, setIsStarting] = useState(false);
    const [showMap, setShowMap] = useState(true);

    // Helper function to get crop emoji
    const getCropEmoji = (crop: string) => {
        switch (crop.toLowerCase()) {
            case 'corn': return '🌽';
            case 'soybean': return '🌱';
            case 'wheat': return '🌾';
            case 'rice': return '🌾';
            case 'cotton': return '💮';
            default: return '🌿';
        }
    };

    // Format hectares for display
    const formatHectares = (value: number): string => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k ha`;
        }
        return `${value} ha`;
    };

    // Format a polygon point for display
    const formatCoordinate = (coord: number): string => {
        return coord.toFixed(6);
    };

    // Handle start simulation with proper cleanup
    const handleStartSimulation = () => {
        setIsStarting(true);

        // Unmount the map component before navigating
        setShowMap(false);

        // Add a small delay to ensure the map is fully unmounted
        setTimeout(() => {
            onStartSimulation();
        }, 100);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-green-800">Review Your Setup</h2>
            <p className="text-gray-600 mb-6">
                Review your farm details before starting the simulation. The digital twin will be generated using these parameters.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Farm Details */}
                <div>
                    <div className="bg-green-50 p-5 rounded-lg border border-green-200 mb-6">
                        <h3 className="text-xl font-semibold text-green-800 mb-4">Farm Details</h3>

                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium text-green-700">Location</h4>
                                <p className="text-gray-700 font-bold">{farmLocation.name}</p>
                                <p className="text-sm text-gray-600">
                                    Lat: {formatCoordinate(farmLocation.latitude)}, Lon: {formatCoordinate(farmLocation.longitude)}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium text-green-700">Farm Size</h4>
                                <p className="text-gray-700">
                                    <span className="font-bold">{formatHectares(farmSize)}</span>
                                    <span className="text-sm text-gray-600 ml-2">({(farmSize * 2.47105).toFixed(2)} acres)</span>
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium text-green-700">Crop Type</h4>
                                <p className="text-gray-700">
                                    <span className="text-2xl mr-2">{getCropEmoji(cropType)}</span>
                                    <span className="font-bold capitalize">{cropType}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                        <h3 className="text-xl font-semibold text-blue-800 mb-4">Simulation Information</h3>
                        <div className="space-y-3">
                            <p className="text-gray-700">
                                Your digital twin simulation will include:
                            </p>
                            <ul className="list-disc pl-5 text-gray-700 space-y-2">
                                <li>3D visualization of your farm</li>
                                <li>Weather data and seasonal changes</li>
                                <li>Crop growth stages simulation</li>
                                <li>Biological product performance analysis</li>
                                <li>Yield prediction and comparison</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Map Visualization */}
                <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                        <div className="bg-green-800 text-white py-2 px-4 font-medium">
                            Farm Location Map
                        </div>
                        <div className="h-[300px]">
                            {showMap && (
                                <MapComponent
                                    latitude={farmLocation.latitude}
                                    longitude={farmLocation.longitude}
                                    hectares={farmSize}
                                    className="w-full h-full"
                                    disabled={true}
                                    showCircle={true}
                                />
                            )}
                            {!showMap && (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <div className="text-gray-500">Preparing simulation...</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Start Simulation Button */}
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleStartSimulation}
                            disabled={isStarting}
                            className={`px-8 py-4 text-white text-lg font-bold rounded-lg shadow-lg transition-all ${isStarting
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 hover:scale-105'
                                }`}
                        >
                            {isStarting ? 'Preparing Simulation...' : 'Start Simulation →'}
                        </button>
                        <p className="text-sm text-gray-600 mt-2">
                            Your digital twin will be generated with these parameters
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
                <button
                    onClick={onBack}
                    disabled={isStarting}
                    className={`px-6 py-2 text-white rounded-md ${isStarting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-600'
                        }`}
                >
                    Back
                </button>
            </div>
        </div>
    );
};

export default FarmReviewStep;
