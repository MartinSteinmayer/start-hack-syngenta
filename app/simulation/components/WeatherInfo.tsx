// components/WeatherInfo.tsx
'use client'

import React from 'react';

interface WeatherInfoProps {
    dayInfo: {
        date: Date;
        dateString: string;
        dayNumber: number;
        temperature: number;
        humidity: number;
        weather: string;
        growthPercent: number;
        growthStage: string;
    } | null;
    location?: {
        name: string;
        latitude: number;
        longitude: number;
    };
}

const WeatherInfo: React.FC<WeatherInfoProps> = ({ dayInfo, location }) => {
    // Helper function to get weather icon
    const getWeatherIcon = (weather: string) => {
        switch (weather) {
            case 'sunny': return '☀️';
            case 'partly_cloudy': return '⛅';
            case 'cloudy': return '☁️';
            case 'rainy': return '🌧️';
            case 'stormy': return '⛈️';
            default: return '☁️';
        }
    };

    // Helper function to get growth stage icon
    const getGrowthStageIcon = (stage: string) => {
        switch (stage) {
            case 'SEEDLING': return '🌱';
            case 'VEGETATIVE': return '🌿';
            case 'REPRODUCTIVE': return '🌾';
            case 'MATURE': return '🌽';
            default: return '🌱';
        }
    };

    // Helper function to get formatted weather name
    const getWeatherName = (weather: string) => {
        switch (weather) {
            case 'sunny': return 'Sunny';
            case 'partly_cloudy': return 'Partly Cloudy';
            case 'cloudy': return 'Cloudy';
            case 'rainy': return 'Rainy';
            case 'stormy': return 'Stormy';
            default: return weather;
        }
    };

    // No data available
    if (!dayInfo) {
        return (
            <div className="bg-gray-800 text-white p-3 rounded shadow-lg">
                <p className="text-center">Weather data not available</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 text-white p-3 rounded shadow-lg">
            {/* Location information */}
            {location && (
                <div className="mb-2 pb-2 border-b border-gray-600">
                    <h3 className="text-sm font-bold">Location</h3>
                    <p className="text-sm">{location.name}</p>
                    <p className="text-xs text-gray-400">
                        Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}
                    </p>
                </div>
            )}

            {/* Weather information */}
            <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-gray-700 rounded">
                    <div className="text-xl mb-1">{getWeatherIcon(dayInfo.weather)}</div>
                    <div className="text-sm font-medium">{getWeatherName(dayInfo.weather)}</div>
                </div>

                <div className="text-center p-2 bg-gray-700 rounded">
                    <div className="text-xl mb-1">🌡️</div>
                    <div className="text-sm font-medium">{dayInfo.temperature}°C</div>
                </div>

                <div className="text-center p-2 bg-gray-700 rounded">
                    <div className="text-xl mb-1">💧</div>
                    <div className="text-sm font-medium">{dayInfo.humidity}% Humidity</div>
                </div>

                <div className="text-center p-2 bg-gray-700 rounded">
                    <div className="text-xl mb-1">{getGrowthStageIcon(dayInfo.growthStage)}</div>
                    <div className="text-sm font-medium">
                        {dayInfo.growthStage.charAt(0) + dayInfo.growthStage.slice(1).toLowerCase()}
                    </div>
                    <div className="text-xs text-gray-300">{Math.round(dayInfo.growthPercent * 100)}% Growth</div>
                </div>
            </div>

            {/* Date information */}
            <div className="mt-2 pt-2 border-t border-gray-600 text-center">
                <p className="text-sm">
                    <span className="font-bold">Day {dayInfo.dayNumber}</span> - {new Date(dayInfo.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </p>
            </div>
        </div>
    );
};

export default WeatherInfo;
