// components/farm/FarmSetupWizard.tsx
'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LocationInput from '@/app/simulation/components/LocationInput';
import FarmShapeStep from './FarmShapeStep';

// Import additional components as needed

enum SetupStep {
  LOCATION = 0,
  FARM_SIZE = 1,
  FARM_SHAPE = 2,
  CROP_SELECTION = 3,
  PRODUCTS = 4,
  REVIEW = 5
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
    latitude: 39.8283,
    longitude: -98.5795,
    name: 'United States (default)'
  });
  
  const [farmSize, setFarmSize] = useState<number>(10); // in hectares
  const [farmShape, setFarmShape] = useState<Array<{latitude: number; longitude: number}> | null>(null);
  const [cropType, setCropType] = useState<string>('corn');
  const [selectedProducts, setSelectedProducts] = useState<Array<any>>([]);
  
  // Handle location change from LocationInput component
  const handleLocationChange = (latitude: number, longitude: number, locationName: string) => {
    setFarmLocation({
      latitude,
      longitude,
      name: locationName
    });
  };
  
  // Handle farm size change
  const handleFarmSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFarmSize(parseInt(e.target.value));
  };
  
  // Handle farm shape completion
  const handleFarmShapeComplete = (polygonPoints: Array<{latitude: number; longitude: number}>) => {
    setFarmShape(polygonPoints);
    nextStep();
  };
  
  // Handle crop type selection
  const handleCropSelection = (cropType: string) => {
    setCropType(cropType);
    nextStep();
  };
  
  // Handle product selection
  const handleProductsSelected = (products: Array<any>) => {
    setSelectedProducts(products);
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
              Search for your farm's location by name or enter coordinates.
              This will be used to fetch weather and satellite data for your simulation.
            </p>
            
            <LocationInput onLocationChange={handleLocationChange} />
            
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
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-green-800">Specify Your Farm Size</h2>
            <p className="text-gray-600 mb-6">
              Enter the approximate size of your farm in hectares.
              This will determine the scale of your simulation.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Farm size (hectares):</label>
              <input
                type="range"
                min="1"
                max="100"
                value={farmSize}
                onChange={handleFarmSizeChange}
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-600">1 ha</span>
                <span className="font-medium text-green-800">{farmSize} ha</span>
                <span className="text-sm text-gray-600">100 ha</span>
              </div>
              
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">Farm Location:</h3>
                <p>{farmLocation.name}</p>
                <p className="text-sm text-gray-600">
                  Lat: {farmLocation.latitude.toFixed(4)}, Lon: {farmLocation.longitude.toFixed(4)}
                </p>
              </div>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['corn', 'soybean', 'wheat'].map((crop) => (
                <div
                  key={crop}
                  onClick={() => handleCropSelection(crop)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    cropType === crop 
                      ? 'border-green-500 bg-green-50 shadow-md' 
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {crop === 'corn' ? '🌽' : crop === 'soybean' ? '🌱' : '🌾'}
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
            </div>
          </div>
        );
        
      // Add additional steps as needed
        
      default:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-green-800">Review Your Setup</h2>
            {/* Show summary of choices */}
            
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Back
              </button>
              
              <button
                onClick={startSimulation}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Start Simulation
              </button>
            </div>
          </div>
        );
    }
  };
  
  // Progress bar calculation
  const progressPercentage = ((currentStep + 1) / (Object.keys(SetupStep).length / 2)) * 100;
  
  // Get current step name
  const getCurrentStepName = () => {
    switch (currentStep) {
      case SetupStep.LOCATION:
        return 'Location';
      case SetupStep.FARM_SIZE:
        return 'Farm Size';
      case SetupStep.FARM_SHAPE:
        return 'Farm Shape';
      case SetupStep.CROP_SELECTION:
        return 'Crop Selection';
      case SetupStep.PRODUCTS:
        return 'Products';
      case SetupStep.REVIEW:
        return 'Review';
      default:
        return '';
    }
  };
  
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
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <div>Step {currentStep + 1} of {Object.keys(SetupStep).length / 2}</div>
          <div>{getCurrentStepName()}</div>
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