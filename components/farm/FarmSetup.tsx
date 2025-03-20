"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import LocationPicker from '@/components/farm/LocationPicker';
import CropSelector from '@/components/farm/CropSelector';
import EnvironmentalDataDisplay from '@/components/farm/EnvironmentalDataDisplay';
import CropStressAnalysis from '@/components/farm/CropStressAnalysis';
import { useFarmData } from '@/lib/hooks/useFarmData';

export default function FarmSetup() {
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

    // Flag to track save status
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    // Flag to control environmental data display
    const [showEnvironmentalData, setShowEnvironmentalData] = useState(false);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setSaveStatus('saving');

        // Save farm data
        saveFarm();

        // Set success status
        setSaveStatus('success');

        // Navigate to simulation after a brief delay
        setTimeout(() => {
            router.push('/simulation');
        }, 500);
    };

    // Reset save status after a delay
    useEffect(() => {
        if (saveStatus === 'success' || saveStatus === 'error') {
            const timer = setTimeout(() => {
                setSaveStatus('idle');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [saveStatus]);

    // Show environmental data when location changes
    useEffect(() => {
        if (farmData.location && farmData.location.lat !== 0 && farmData.location.lng !== 0) {
            setShowEnvironmentalData(true);
        }
    }, [farmData.location]);

    if (isLoading) {
        return (
            <Card className="p-6 max-w-2xl mx-auto">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-4"></div>
                    <p>Loading farm data...</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Farm Name */}
                    <div>
                        <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 mb-1">
                            Farm Name
                        </label>
                        <input
                            type="text"
                            id="farmName"
                            value={farmData.name}
                            onChange={(e) => updateFarmName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            required
                        />
                    </div>

                    {/* Location Picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Farm Location
                        </label>
                        <LocationPicker
                            value={farmData.location}
                            onChange={updateFarmLocation}
                            className="w-full"
                        />
                    </div>

                    {/* Environmental Data Display */}
                    {showEnvironmentalData && (
                        <EnvironmentalDataDisplay
                            location={farmData.location}
                            className="mt-4"
                        />
                    )}

                    {/* Farm Size */}
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

                    {/* Crop Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Farm Crops
                        </label>
                        <CropSelector
                            crops={farmData.crops}
                            onChange={updateFarmCrops}
                            totalFarmSize={farmData.totalAcreage}
                        />
                    </div>

                    {/* Crop Stress Analysis */}
                    {farmData.crops.length > 0 && showEnvironmentalData && (
                        <CropStressAnalysis
                            crops={farmData.crops}
                            location={farmData.location}
                            className="mt-4"
                            onSelectProduct={(cropId, stressType) => {
                                // This will be implemented in Batch 3/4
                                console.log(`Selected product for crop ${cropId} with stress type ${stressType}`);
                            }}
                        />
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Save Status */}
                    {saveStatus === 'success' && (
                        <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-md text-sm">
                            Farm setup saved successfully! Redirecting to simulation...
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                            disabled={!!error || saveStatus === 'saving'}
                        >
                            {saveStatus === 'saving' ? 'Saving...' : 'Start Simulation'}
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
}
