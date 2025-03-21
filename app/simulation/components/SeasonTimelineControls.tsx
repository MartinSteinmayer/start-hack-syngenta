// components/simulation/SeasonTimelineControls.tsx
'use client'

import React, { useState, useEffect } from 'react';

interface SeasonTimelineControlsProps {
    controller: any;
    totalDays: number;
    location: any;
}

const SeasonTimelineControls: React.FC<SeasonTimelineControlsProps> = ({
    controller,
    totalDays,
    location
}) => {
    const [currentDay, setCurrentDay] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [dayInfo, setDayInfo] = useState<any>(null);
    const [speed, setSpeed] = useState(1);
    const [showWeatherPanel, setShowWeatherPanel] = useState(false);

    // Define the three seasons and their day positions
    const seasons = {
        early: { day: Math.floor(totalDays * 0.15), label: "Early Season" },
        middle: { day: Math.floor(totalDays * 0.5), label: "Mid Season" },
        late: { day: Math.floor(totalDays * 0.85), label: "Late Season" }
    };

    // Get current season based on day
    const getCurrentSeason = (day: number) => {
        if (day < Math.floor(totalDays * 0.33)) return 'early';
        if (day < Math.floor(totalDays * 0.67)) return 'middle';
        return 'late';
    };

    // Handle season selection
    const handleSeasonSelect = (seasonKey: string) => {
        const targetDay = seasons[seasonKey as keyof typeof seasons].day;
        setCurrentDay(targetDay);
        controller.setDay(targetDay);
    };

    // Play/pause toggle
    const togglePlayPause = () => {
        if (isPlaying) {
            controller.pause();
        } else {
            controller.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Speed control
    const handleSpeedChange = (newSpeed: number) => {
        setSpeed(newSpeed);
        controller.setSpeed(newSpeed);
    };

    // Update state when controller changes day
    useEffect(() => {
        const updateTimelineState = () => {
            const dayIndex = controller.getCurrentDayIndex();
            setCurrentDay(dayIndex);
            setDayInfo(controller.getCurrentDay());
        };

        // Set initial state
        updateTimelineState();

        // Set up interval to check controller state
        const intervalId = setInterval(updateTimelineState, 200);

        return () => clearInterval(intervalId);
    }, [controller]);

    // Weather icon based on conditions
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

    // Growth stage icon
    const getGrowthStageIcon = (stage: string) => {
        switch (stage) {
            case 'SEEDLING': return '🌱';
            case 'VEGETATIVE': return '🌿';
            case 'REPRODUCTIVE': return '🌾';
            case 'MATURE': return '🌽';
            default: return '🌱';
        }
    };

    // Format weather name for display
    const formatWeatherName = (weather: string) => {
        if (!weather) return '';
        return weather.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

    const currentSeason = getCurrentSeason(currentDay);

    return (
        <div className="fixed left-0 top-0 h-full w-72 bg-green-800 text-white p-4 shadow-xl z-10 overflow-y-auto">
            <div className="flex flex-col space-y-6 h-full">
                {/* Header Section */}
                <div className="border-b border-green-700 pb-4">
                    <h2 className="text-xl font-bold mb-2">Growing Season</h2>
                    {dayInfo && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Day {dayInfo.dayNumber}</p>
                            <p className="text-xs text-green-200">
                                {new Date(dayInfo.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                    )}
                </div>


                {/* Crop Status */}
                {dayInfo && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-green-200">Crop Status</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-700 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">
                                        {getGrowthStageIcon(dayInfo.growthStage)}
                                    </span>
                                    <div>
                                        <div className="text-sm">{dayInfo.growthStage.toLowerCase()}</div>
                                        <div className="text-xs text-green-200">Growth Progress</div>
                                    </div>
                                </div>
                                <div className="text-lg font-semibold">
                                    {Math.round(dayInfo.growthPercent * 100)}%
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Weather Conditions */}
                {dayInfo && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-green-200">Weather Conditions</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-700 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">{getWeatherIcon(dayInfo.weather)}</span>
                                    <div>
                                        <div className="text-sm">{formatWeatherName(dayInfo.weather)}</div>
                                        <div className="text-xs text-green-200">Current Conditions</div>
                                    </div>
                                </div>
                                <div className="text-lg font-semibold">{dayInfo.temperature}°C</div>
                            </div>
                            <div className="p-3 bg-green-700 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xl">💧</span>
                                        <div>
                                            <div className="text-sm">Humidity</div>
                                            <div className="text-xs text-green-200">Relative</div>
                                        </div>
                                    </div>
                                    <div className="text-lg font-semibold">{dayInfo.humidity}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Season Navigation */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-green-200">Season Navigation</h3>
                    <div className="flex flex-col space-y-3">
                        {Object.entries(seasons).map(([key, data]) => (
                            <button
                                key={key}
                                onClick={() => handleSeasonSelect(key)}
                                className={`w-full p-3 rounded-lg text-left transition-all ${currentSeason === key
                                    ? 'bg-green-600 border-2 border-green-500'
                                    : 'bg-green-700 hover:bg-green-600'
                                    }`}
                            >
                                <div className="font-medium">{data.label}</div>
                                <div className="text-xs mt-1 text-green-200">
                                    Days {data.day + 1}-{key === 'early' ?
                                        Math.floor(totalDays * 0.33) :
                                        key === 'middle' ?
                                            Math.floor(totalDays * 0.67) :
                                            totalDays}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto space-y-6">
                    {/* Speed Control */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Playback Speed</label>
                        <select
                            value={speed}
                            onChange={(e) => handleSpeedChange(Number(e.target.value))}
                            className="w-full bg-green-700 text-white rounded-lg p-2 text-sm"
                        >
                            <option value="0.5">0.5x</option>
                            <option value="1">1x</option>
                            <option value="2">2x</option>
                            <option value="5">5x</option>
                            <option value="10">10x</option>
                        </select>
                    </div>

                    {/* Day Slider Control */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold">Simulation Progress</label>
                            <button
                                onClick={togglePlayPause}
                                className="bg-green-600 hover:bg-green-500 text-white p-1 px-2 rounded-md text-xs font-medium"
                            >
                                {isPlaying ? 'Pause' : 'Play'}
                            </button>
                        </div>

                        <input
                            type="range"
                            min="0"
                            max={totalDays - 1}
                            value={currentDay}
                            onChange={(e) => {
                                const newDay = parseInt(e.target.value);
                                setCurrentDay(newDay);
                                controller.setDay(newDay);
                                if (isPlaying) {
                                    controller.pause();
                                    setIsPlaying(false);
                                }
                            }}
                            className="w-full accent-green-500 bg-green-700 h-2 rounded-lg appearance-none cursor-pointer"
                        />

                        <div className="flex justify-between text-sm">
                            <span>Day {currentDay + 1}</span>
                            <span>of {totalDays}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeasonTimelineControls;
