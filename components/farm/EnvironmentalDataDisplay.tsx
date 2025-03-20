"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { GeoLocation } from '@/types/farm';

interface EnvironmentalDataDisplayProps {
    location: GeoLocation;
    className?: string;
}

interface WeatherData {
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
    };
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
}

export default function EnvironmentalDataDisplay({ location, className = '' }: EnvironmentalDataDisplayProps) {
    const [environmentalData, setEnvironmentalData] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEnvironmentalData() {
            if (!location || !location.lat || !location.lng) {
                setError('Invalid location data');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Fetch forecast data
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

                // Combine data
                setEnvironmentalData({
                    forecast: forecastData.forecast,
                    soil: soilData.soil
                });

            } catch (err) {
                console.error('Error fetching environmental data:', err);
                setError('Failed to fetch environmental data. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        }

        fetchEnvironmentalData();
    }, [location]);

    // Format date string
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };

    if (isLoading) {
        return (
            <Card className={`p-4 ${className}`}>
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                    <span className="ml-2">Loading environmental data...</span>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={`p-4 ${className}`}>
                <div className="text-red-500 p-2">
                    <p className="font-semibold">Error loading environmental data</p>
                    <p className="text-sm">{error}</p>
                </div>
            </Card>
        );
    }

    if (!environmentalData || !environmentalData.forecast) {
        return (
            <Card className={`p-4 ${className}`}>
                <div className="text-gray-500 p-2">
                    <p>No environmental data available for this location.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={`p-4 ${className}`}>
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Environmental Conditions</h3>

                {/* Weather Forecast Section */}
                <div>
                    <h4 className="text-md font-medium mb-2">7-Day Weather Forecast</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Temp (°C)
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Precip (mm)
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Humidity (%)
                                    </th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Wind (m/s)
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {environmentalData.forecast.daily.slice(0, 7).map((day, index) => (
                                    <tr key={day.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                                            {formatDate(day.date)}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                                            <span className="text-red-500">{day.temperature.max.toFixed(1)}</span> / <span className="text-blue-500">{day.temperature.min.toFixed(1)}</span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                                            {day.precipitation.toFixed(1)}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                                            {day.humidity.toFixed(0)}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                                            {day.windSpeed.toFixed(1)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Soil Data Section */}
                {environmentalData.soil && (
                    <div>
                        <h4 className="text-md font-medium mb-2">Soil Characteristics</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500 uppercase">Soil Texture</div>
                                <div className="font-medium">{environmentalData.soil.texture}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500 uppercase">Soil pH</div>
                                <div className="font-medium">{environmentalData.soil.properties.ph.toFixed(1)}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500 uppercase">Organic Matter</div>
                                <div className="font-medium">{environmentalData.soil.properties.organicMatter !== null 
    ? `${environmentalData.soil.properties.organicMatter.toFixed(1)}%` 
    : 'Not available'}%</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500 uppercase">Water Holding</div>
                                <div className="font-medium">{environmentalData.soil.properties.waterHoldingCapacity.toFixed(2)} cm³/cm³</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500 uppercase">Bulk Density</div>
                                <div className="font-medium">{environmentalData.soil.properties.bulkDensity.toFixed(2)} g/cm³</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500 uppercase">CEC</div>
                                <div className="font-medium">{environmentalData.soil.properties.cationExchangeCapacity.toFixed(1)} meq/100g</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
