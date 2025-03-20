"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Crop, GeoLocation } from '@/types/farm';
import { analyzeCropSuitability } from '@/lib/services/farmEnvironmentService';

interface CropStressAnalysisProps {
    crops: Crop[];
    location: GeoLocation;
    className?: string;
    onSelectProduct?: (cropId: string, stressType: string) => void;
}

interface StressResult {
    cropId: string;
    cropName: string;
    cropType: string;
    temperature: { stress: number };
    water: { stress: number };
    soil: { stress: number };
    overall: { stress: number };
    loading: boolean;
    error: string | null;
}

export default function CropStressAnalysis({
    crops,
    location,
    className = '',
    onSelectProduct
}: CropStressAnalysisProps) {
    const [stressResults, setStressResults] = useState<StressResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function analyzeStress() {
            if (!crops || crops.length === 0) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Initialize stress results with loading state
                const initialStressResults = crops.map(crop => ({
                    cropId: crop.id,
                    cropName: crop.name,
                    cropType: crop.type,
                    temperature: { stress: 0 },
                    water: { stress: 0 },
                    soil: { stress: 0 },
                    overall: { stress: 0 },
                    loading: true,
                    error: null
                }));

                setStressResults(initialStressResults);

                // Fetch environmental data
                const forecastResponse = await fetch(
                    `/api/environmental-data?lat=${location.lat}&lng=${location.lng}&type=forecast`
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

                // Combine environmental data
                const environmentalData = {
                    ...forecastData,
                    ...soilData
                };

                // Analyze each crop
                const results = crops.map(crop => {
                    try {
                        const analysis = analyzeCropSuitability(crop, environmentalData);
                        return {
                            cropId: crop.id,
                            cropName: crop.name,
                            cropType: crop.type,
                            ...analysis,
                            loading: false,
                            error: null
                        };
                    } catch (err) {
                        console.error(`Error analyzing crop ${crop.name}:`, err);
                        return {
                            cropId: crop.id,
                            cropName: crop.name,
                            cropType: crop.type,
                            temperature: { stress: 0 },
                            water: { stress: 0 },
                            soil: { stress: 0 },
                            overall: { stress: 0 },
                            loading: false,
                            error: 'Analysis failed'
                        };
                    }
                });

                setStressResults(results);
            } catch (err) {
                console.error('Error in crop stress analysis:', err);
                setError('Failed to analyze crop stress. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        }

        analyzeStress();
    }, [crops, location]);

    // Helper to render stress indicator
    const renderStressIndicator = (stressLevel: number) => {
        let color = 'bg-green-500';
        let label = 'Low';

        if (stressLevel > 0.7) {
            color = 'bg-red-500';
            label = 'High';
        } else if (stressLevel > 0.3) {
            color = 'bg-yellow-500';
            label = 'Medium';
        }

        const percentage = Math.min(100, Math.max(0, Math.round(stressLevel * 100)));

        return (
            <div className="w-full">
                <div className="flex justify-between text-xs mb-1">
                    <span>{label}</span>
                    <span>{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className={`${color} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    // Helper function to get appropriate recommendation based on stress type
    const getRecommendationText = (cropType: string, stressType: string, stressLevel: number) => {
        if (stressLevel < 0.3) return "No intervention needed";

        switch (stressType) {
            case 'temperature':
                return stressLevel > 0.7
                    ? "Consider Stress Buster for heat protection"
                    : "Monitor temperature changes";
            case 'water':
                return stressLevel > 0.7
                    ? "Consider Stress Buster for drought protection"
                    : "Monitor soil moisture";
            case 'soil':
                return stressLevel > 0.7
                    ? "Consider NUE Product to improve soil conditions"
                    : "Consider soil amendments";
            default:
                return "Consider crop-specific treatment";
        }
    };

    if (isLoading) {
        return (
            <Card className={`p-4 ${className}`}>
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                    <span className="ml-2">Analyzing crop conditions...</span>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={`p-4 ${className}`}>
                <div className="text-red-500 p-2">
                    <p className="font-semibold">Error analyzing crops</p>
                    <p className="text-sm">{error}</p>
                </div>
            </Card>
        );
    }

    if (stressResults.length === 0) {
        return (
            <Card className={`p-4 ${className}`}>
                <div className="text-gray-500 p-2">
                    <p>No crops to analyze.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={`p-4 ${className}`}>
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Crop Stress Analysis</h3>

                <div className="space-y-6">
                    {stressResults.map((result) => (
                        <div key={result.cropId} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-medium">{result.cropName}</h4>
                                <span className="text-sm text-gray-500 capitalize">{result.cropType}</span>
                            </div>

                            {result.loading ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500"></div>
                                </div>
                            ) : result.error ? (
                                <div className="text-red-500 text-sm">{result.error}</div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Overall Stress */}
                                    <div className="mb-4">
                                        <div className="text-sm font-medium mb-1">Overall Stress Level</div>
                                        {renderStressIndicator(result.overall.stress)}
                                    </div>

                                    {/* Detailed Stress Factors */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Temperature Stress */}
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium">Temperature Stress</div>
                                            {renderStressIndicator(result.temperature.stress)}
                                            <div className="text-xs text-gray-600">
                                                {getRecommendationText(result.cropType, 'temperature', result.temperature.stress)}
                                            </div>
                                            {onSelectProduct && result.temperature.stress > 0.3 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-2"
                                                    onClick={() => onSelectProduct(result.cropId, 'temperature')}
                                                >
                                                    View Solutions
                                                </Button>
                                            )}
                                        </div>

                                        {/* Water Stress */}
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium">Water Stress</div>
                                            {renderStressIndicator(result.water.stress)}
                                            <div className="text-xs text-gray-600">
                                                {getRecommendationText(result.cropType, 'water', result.water.stress)}
                                            </div>
                                            {onSelectProduct && result.water.stress > 0.3 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-2"
                                                    onClick={() => onSelectProduct(result.cropId, 'water')}
                                                >
                                                    View Solutions
                                                </Button>
                                            )}
                                        </div>

                                        {/* Soil Stress */}
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium">Soil Stress</div>
                                            {renderStressIndicator(result.soil.stress)}
                                            <div className="text-xs text-gray-600">
                                                {getRecommendationText(result.cropType, 'soil', result.soil.stress)}
                                            </div>
                                            {onSelectProduct && result.soil.stress > 0.3 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-2"
                                                    onClick={() => onSelectProduct(result.cropId, 'soil')}
                                                >
                                                    View Solutions
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}
