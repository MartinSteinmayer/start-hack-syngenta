"use client";

import React, { useState } from 'react';
import { FarmData, Crop, GeoLocation } from '@/types/farm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LocationPicker from '@/components/farm/LocationPicker';
import CropSelector from '@/components/farm/CropSelector';
import { useFarmData } from '@/lib/hooks/useFarmData';
import { useRouter } from 'next/navigation';

// Define the steps in our wizard - reduced to 3 substantive steps plus completion
enum SetupStep {
  LOCATION = 0,
  FARM_INFO = 1,
  CROPS = 2,
  COMPLETE = 3  // Now the 4th state (index 3) instead of 5th
}

interface StepIndicatorProps {
  currentStep: SetupStep;
  totalSteps: number;
}

// A simple step indicator component
function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center
              ${index <= currentStep ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            {index + 1}
          </div>
          {index < totalSteps - 1 && (
            <div 
              className={`h-1 w-12 mx-1 
              ${index < currentStep ? 'bg-green-600' : 'bg-gray-200'}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function FarmSetupWizard() {
  const [currentStep, setCurrentStep] = useState<SetupStep>(SetupStep.LOCATION);
  const [showEnvironmentalData, setShowEnvironmentalData] = useState(false);
  const router = useRouter();
  
  const {
    farmData,
    isLoading,
    updateFarmName,
    updateFarmLocation,
    updateFarmSize,
    updateFarmCrops,
    saveFarm,
    error
  } = useFarmData();

  // Handle location selection and move to next step
  const handleLocationSelected = () => {
    if (farmData.location.lat !== 0 && farmData.location.lng !== 0) {
      setShowEnvironmentalData(true);
      setCurrentStep(SetupStep.FARM_INFO);
    }
  };

  // Handle farm info update and move to next step
  const handleFarmInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(SetupStep.CROPS);
  };
  
  // Handle crops setup and move directly to completion (skipping analysis)
  const handleCropsSubmit = () => {
    // Save farm data and proceed to completion
    saveFarm();
    setCurrentStep(SetupStep.COMPLETE);
    
    // Navigate to simulation after a brief delay
    setTimeout(() => {
      router.push('/simulation');
    }, 1000);
  };

  // Go back to previous step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 max-w-3xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-4"></div>
          <p>Loading farm data...</p>
        </div>
      </Card>
    );
  }

  // For step 1: Location Selection
  if (currentStep === SetupStep.LOCATION) {
    return (
      <Card className="p-6 max-w-3xl mx-auto">
        <StepIndicator currentStep={currentStep} totalSteps={3} />
        <h2 className="text-2xl font-bold mb-6 text-center">Where is your farm located?</h2>
        <p className="text-gray-600 mb-6 text-center">
          Select your farm's location to get accurate environmental data and recommendations
        </p>
        
        <div className="space-y-6">
          <LocationPicker
            value={farmData.location}
            onChange={updateFarmLocation}
            className="w-full"
          />
          
          <div className="flex justify-end mt-6">
            <Button
              variant="primary"
              size="lg"
              onClick={handleLocationSelected}
              disabled={farmData.location.lat === 0 || farmData.location.lng === 0}
            >
              Continue
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // For step 2: Farm Information
  if (currentStep === SetupStep.FARM_INFO) {
    return (
      <Card className="p-6 max-w-3xl mx-auto">
        <StepIndicator currentStep={currentStep} totalSteps={3} />
        <h2 className="text-2xl font-bold mb-6 text-center">Tell us about your farm</h2>
        
        <form onSubmit={handleFarmInfoSubmit} className="space-y-6">
          <div>
            <label htmlFor="acreage" className="block text-sm font-medium text-gray-700 mb-1">
              Total Farm Size (acres)
            </label>
            <input
              type="number"
              id="acreage"
              value={farmData.totalAcreage}
              onChange={(e) => updateFarmSize(parseFloat(e.target.value))}
              min="1"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
            >
              Continue
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  // For step 3: Crop Selection - now leads directly to completion
  if (currentStep === SetupStep.CROPS) {
    return (
      <Card className="p-6 max-w-3xl mx-auto">
        <StepIndicator currentStep={currentStep} totalSteps={3} />
        <h2 className="text-2xl font-bold mb-6 text-center">What crops do you grow?</h2>
        <p className="text-gray-600 mb-6 text-center">
          Add the crops you're growing and their approximate acreage
        </p>
        
        <div className="space-y-6">
          <CropSelector
            crops={farmData.crops}
            onChange={updateFarmCrops}
            totalFarmSize={farmData.totalAcreage}
          />
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleCropsSubmit}
              disabled={farmData.crops.length === 0 || !!error}
            >
              Start Simulation
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // For completion step
  if (currentStep === SetupStep.COMPLETE) {
    return (
      <Card className="p-6 max-w-3xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-4">Setup Complete!</h2>
          <p className="text-gray-600 mb-8">Redirecting to the simulation...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
        </div>
      </Card>
    );
  }

  // Default fallback (shouldn't reach here)
  return null;
}