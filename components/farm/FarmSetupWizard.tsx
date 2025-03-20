// components/farm/FarmSetupWizard.tsx
'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LocationInput from '@/app/simulation/components/LocationInput';
import LocationInputWithMap from './LocationInputWithMap';
import FarmShapeStep from './FarmShapeStep';
import FarmSizeStep from './FarmSizeStep';
import FarmReviewStep from './FarmReviewStep';

// Import additional components as needed

enum SetupStep {
    LOCATION = 0,
    FARM_SIZE = 1,
    FARM_SHAPE = 2,
    CROP_SELECTION = 3,
    REVIEW = 4
}

const FarmSetupWizard = () => {
    const router = useRouter();

    // Wizard state
    const [currentStep, setCurrentStep] = useState<SetupStep>(SetupStep.LOCATION);
    const [isLoading, setIsLoading] = useState(false);

    // Farm configuration state
    const [farmLocation, setFarmLocation] = useState<{
        latitude: number;
        longitude: number;
        name: string;
    }>({
        latitude: -12.915559,
        longitude: -55.314216,
        name: 'Mato Grosso, Brazil'
    });

    const [farmSize, setFarmSize] = useState<number>(350); // Set default to 350 hectares
    const [farmShape, setFarmShape] = useState<Array<{ latitude: number; longitude: number }>>([
        // Default polygon points based on the farm center and size
        { latitude: farmLocation.latitude + 0.01, longitude: farmLocation.longitude - 0.01 },
        { latitude: farmLocation.latitude + 0.01, longitude: farmLocation.longitude + 0.01 },
        { latitude: farmLocation.latitude - 0.01, longitude: farmLocation.longitude + 0.01 },
        { latitude: farmLocation.latitude - 0.01, longitude: farmLocation.longitude - 0.01 }
    ]);
    const [cropType, setCropType] = useState<string>('corn');

    // Handle location change from LocationInput component
    const handleLocationChange = (latitude: number, longitude: number, locationName: string) => {
        setFarmLocation({
            latitude,
            longitude,
            name: locationName
        });
    };

    // Handle farm size change
    const handleFarmSizeChange = (size: number) => {
        setFarmSize(size);
    };

    // Handle farm shape completion
    const handleFarmShapeComplete = (polygonPoints: Array<{ latitude: number; longitude: number }>) => {
        setFarmShape(polygonPoints);
        nextStep();
    };

    // Handle crop type selection
    const handleCropSelection = (crop: string) => {
        setCropType(crop);
        nextStep();
    };

    // Navigate to next step
    const nextStep = () => {
        if (currentStep < SetupStep.REVIEW) {
            setCurrentStep(currentStep + 1);
        } else {
            startSimulation();
        }
    };

    // Navigate to previous step
    const prevStep = () => {
        if (currentStep > SetupStep.LOCATION) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Start the simulation with collected data
    const startSimulation = () => {
        setIsLoading(true);

        // In a real application, you might want to save this data to a backend
        // or pass it via state management to the simulation page

        // For now, we'll pass basic parameters through the URL
        const params = new URLSearchParams({
            lat: farmLocation.latitude.toString(),
            lng: farmLocation.longitude.toString(),
            hectares: farmSize.toString(),
            crop: cropType,
            // We'll need a more sophisticated way to pass the polygon data in a real app
            // This is just a placeholder
            polygon: JSON.stringify(farmShape)
        });

        // Navigate to simulation page
        setTimeout(() => {
            router.push(`/simulation?${params.toString()}`);
        }, 1000);
    };

    // Determine which step to render
    const renderStep = () => {
        switch (currentStep) {
            case SetupStep.LOCATION:
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 text-green-800">Select Your Farm Location</h2>
                        <p className="text-gray-600 mb-6">
                            Select your farm's location by clicking on the map, searching by name, or entering coordinates.
                            This will be used to fetch weather and satellite data for your simulation.
                        </p>

                        <LocationInputWithMap
                            onLocationChange={handleLocationChange}
                            initialLocation={farmLocation}
                        />

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={nextStep}
                                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                );

            case SetupStep.FARM_SIZE:
                return (
                    <FarmSizeStep
                        farmLocation={farmLocation}
                        farmSize={farmSize}
                        onFarmSizeChange={handleFarmSizeChange}
                        onContinue={nextStep}
                        onBack={prevStep}
                    />
                );

            case SetupStep.FARM_SHAPE:
                return (
                    <FarmShapeStep
                        farmLocation={farmLocation}
                        farmSize={farmSize}
                        onComplete={handleFarmShapeComplete}
                        onBack={prevStep}
                    />
                );

            case SetupStep.CROP_SELECTION:
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 text-green-800">Select Your Crop</h2>
                        <p className="text-gray-600 mb-6">
                            Choose the crop type you want to simulate on your farm.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {['corn', 'soybean', 'wheat', 'cotton', 'rice'].map((crop) => (
                                <div
                                    key={crop}
                                    onClick={() => handleCropSelection(crop)}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${cropType === crop
                                            ? 'border-green-500 bg-green-50 shadow-md'
                                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className="h-16 flex items-center justify-center mb-2">
                                            {crop === 'corn' && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-12 h-12">
                                                    <path d="M12,2c0,0-3,4-3,9c0,1.81,0.4,3.27,1,4.5V21h4v-5.5c0.6-1.23,1-2.69,1-4.5C15,6,12,2,12,2z" fill="#F9D423" />
                                                    <path d="M12,2C12,2,9,6,9,11c0,1.81,0.4,3.27,1,4.5V21h2V2z" fill="#F4A261" />
                                                    <path d="M14,12c0.36-0.55,1.56-0.74,1.6-1.5c-0.04-0.76-1.24-0.95-1.6-1.5c-0.36,0.55-1.56,0.74-1.6,1.5C12.44,11.26,13.64,11.45,14,12z" fill="#4CAF50" />
                                                    <path d="M10,8c0.36-0.55,1.56-0.74,1.6-1.5c-0.04-0.76-1.24-0.95-1.6-1.5c-0.36,0.55-1.56,0.74-1.6,1.5C8.44,7.26,9.64,7.45,10,8z" fill="#4CAF50" />
                                                    <path d="M10,16c0.36-0.55,1.56-0.74,1.6-1.5c-0.04-0.76-1.24-0.95-1.6-1.5c-0.36,0.55-1.56,0.74-1.6,1.5C8.44,15.26,9.64,15.45,10,16z" fill="#4CAF50" />
                                                </svg>
                                            )}
                                            {crop === 'soybean' && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-12 h-12">
                                                    <path d="M12,2c-1.1,0-2,0.9-2,2c0,0.74,0.4,1.38,1,1.72V7h2V5.72c0.6-0.34,1-0.98,1-1.72C14,2.9,13.1,2,12,2z" fill="#4CAF50" />
                                                    <path d="M13,7v2c1.66,0,3,1.34,3,3c0,0.35-0.06,0.69-0.17,1L13,13v4c0,1.1-0.9,2-2,2s-2-0.9-2-2v-6c0-1.66,1.34-3,3-3H13z" fill="#81C784" />
                                                    <path d="M15.83,13c-0.42,1.18-1.52,2-2.83,2c-1.66,0-3-1.34-3-3c0-1.31,0.83-2.42,2-2.83V7.1C9.23,7.35,7,9.7,7,12.5c0,2.76,2.24,5,5,5 s5-2.24,5-5c0-0.93-0.26-1.8-0.7-2.54L15.83,13z" fill="#388E3C" />
                                                    <ellipse cx="16" cy="12.5" rx="1.5" ry="2.5" fill="#81C784" />
                                                    <ellipse cx="8" cy="12.5" rx="1.5" ry="2.5" fill="#81C784" />
                                                </svg>
                                            )}
                                            {crop === 'wheat' && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-12 h-12">
                                                    <path d="M12,2v20" stroke="#8D6E63" strokeWidth="1.5" fill="none" />
                                                    <path d="M12,4c0,0,2-1,4,0c2,1,0,3,0,3" stroke="#FFC107" strokeWidth="1" fill="none" />
                                                    <path d="M12,6c0,0,2-1,4,0c2,1,0,3,0,3" stroke="#FFC107" strokeWidth="1" fill="none" />
                                                    <path d="M12,8c0,0,2-1,4,0c2,1,0,3,0,3" stroke="#FFC107" strokeWidth="1" fill="none" />
                                                    <path d="M12,4c0,0,-2-1,-4,0c-2,1,0,3,0,3" stroke="#FFC107" strokeWidth="1" fill="none" />
                                                    <path d="M12,6c0,0,-2-1,-4,0c-2,1,0,3,0,3" stroke="#FFC107" strokeWidth="1" fill="none" />
                                                    <path d="M12,8c0,0,-2-1,-4,0c-2,1,0,3,0,3" stroke="#FFC107" strokeWidth="1" fill="none" />
                                                    <path d="M12,12c0,0,0,0,0,0c-2-2-5,0-5,0c2,2,5,0,5,0Z" fill="#FFC107" />
                                                    <path d="M12,14c0,0,0,0,0,0c-2-2-5,0-5,0c2,2,5,0,5,0Z" fill="#FFC107" />
                                                    <path d="M12,12c0,0,0,0,0,0c2-2,5,0,5,0c-2,2-5,0-5,0Z" fill="#FFC107" />
                                                    <path d="M12,14c0,0,0,0,0,0c2-2,5,0,5,0c-2,2-5,0-5,0Z" fill="#FFC107" />
                                                </svg>
                                            )}
                                            {crop === 'cotton' && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-12 h-12">
                                                    <path d="M12,21V11" stroke="#8D6E63" strokeWidth="1" fill="none" />
                                                    <path d="M10,10c0-2.21,1.79-4,4-4s4,1.79,4,4s-1.79,4-4,4" stroke="#8D6E63" strokeWidth="0.75" fill="none" />
                                                    <path d="M14,10c0-2.21-1.79-4-4-4S6,7.79,6,10s1.79,4,4,4" stroke="#8D6E63" strokeWidth="0.75" fill="none" />
                                                    <circle cx="12" cy="10" r="5" fill="#F5F5F5" />
                                                    <path d="M12,5c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5S14.76,5,12,5z M12,13c-1.66,0-3-1.34-3-3s1.34-3,3-3s3,1.34,3,3 S13.66,13,12,13z" fill="#EEEEEE" />
                                                    <circle cx="12" cy="10" r="2" fill="#E0E0E0" />
                                                    <path d="M14,12l2,2M10,12l-2,2M14,8l2-2M10,8L8,6" stroke="#BDBDBD" strokeWidth="0.5" fill="none" />
                                                </svg>
                                            )}
                                            {crop === 'rice' && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-12 h-12">
                                                    <path d="M12,21V6" stroke="#8D6E63" strokeWidth="1.5" fill="none" />
                                                    <path d="M10,7c0,0-1-3,2-5c3,2,2,5,2,5" fill="#4CAF50" />
                                                    <path d="M7,9c0,0-2-2,0-5c3,1,3,3,3,3" fill="#4CAF50" />
                                                    <path d="M17,9c0,0,2-2,0-5c-3,1-3,3-3,3" fill="#4CAF50" />
                                                    <path d="M12,10c0,0,0,0-3,3c0,2,6,2,6,0C12,10,12,10,12,10z" fill="#FFC107" />
                                                    <path d="M12,13c0,0,0,0-3,3c0,2,6,2,6,0C12,13,12,13,12,13z" fill="#FFC107" />
                                                    <path d="M12,16c0,0,0,0-2,2c0,1,4,1,4,0C12,16,12,16,12,16z" fill="#FFC107" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="font-medium capitalize">{crop}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between mt-6">
                            <button
                                onClick={prevStep}
                                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                            >
                                Back
                            </button>
                            <button
                                onClick={nextStep}
                                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                );

            case SetupStep.REVIEW:
                return (
                    <FarmReviewStep
                        farmLocation={farmLocation}
                        farmSize={farmSize}
                        farmPolygon={farmShape}
                        cropType={cropType}
                        onStartSimulation={startSimulation}
                        onBack={prevStep}
                    />
                );

            default:
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 text-green-800">Something went wrong</h2>
                        <p className="text-gray-600 mb-6">
                            We couldn't determine which step to display. Please try again.
                        </p>
                        <button
                            onClick={() => setCurrentStep(SetupStep.LOCATION)}
                            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                            Start Over
                        </button>
                    </div>
                );
        }
    };

    // Progress bar calculation
    const progressPercentage = ((currentStep + 1) / (Object.keys(SetupStep).length / 2)) * 100;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Loading overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <div className="inline-block w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-lg font-medium">Preparing your simulation...</p>
                    </div>
                </div>
            )}

            {/* Progress bar */}
            <div className="mb-6">
                <div className="flex text-white justify-between text-sm text-gray-600 mb-2">
                    <div className="text-white">Step {currentStep + 1} of {Object.keys(SetupStep).length / 2}</div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-600 transition-all duration-300 ease-in-out"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Current step content */}
            {renderStep()}
        </div>
    );
};

export default FarmSetupWizard;
