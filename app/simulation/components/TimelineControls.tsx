// components/TimelineControls.tsx - Updated version
import React, { useState, useEffect } from 'react';
import WeatherInfo from './WeatherInfo';

const TimelineControls = ({ controller, totalDays, location }) => {
    const [currentDay, setCurrentDay] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [dayInfo, setDayInfo] = useState(null);
    const [speed, setSpeed] = useState(1);
    const [showWeatherPanel, setShowWeatherPanel] = useState(false);

    // Handle slider change
    const handleSliderChange = (e) => {
        const day = parseInt(e.target.value);
        setCurrentDay(day);
        controller.setDay(day);
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
    const handleSpeedChange = (newSpeed) => {
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
    const getWeatherIcon = (weather) => {
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
    const getGrowthStageIcon = (stage) => {
        switch (stage) {
            case 'SEEDLING': return '🌱';
            case 'VEGETATIVE': return '🌿';
            case 'REPRODUCTIVE': return '🌾';
            case 'MATURE': return '🌽';
            default: return '🌱';
        }
    };

    // Format weather name for display
    const formatWeatherName = (weather) => {
        if (!weather) return '';
        return weather.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

    return (
        <div className="fixed top-16 left-0 right-0 bg-green-800 text-white p-2 shadow-lg z-10">
            <div className="max-w-screen-xl mx-auto relative">
                {/* Day info */}
                {dayInfo && (
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm md:text-base">
                            <span className="font-bold">Day {dayInfo.dayNumber}</span> - {new Date(dayInfo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>

                        <div className="flex space-x-6">
                            <div className="flex items-center cursor-pointer" onClick={() => setShowWeatherPanel(!showWeatherPanel)}>
                                <span className="mr-1">{getWeatherIcon(dayInfo.weather)}</span>
                                <span className="hidden sm:inline">{formatWeatherName(dayInfo.weather)}</span>
                            </div>

                            <div className="flex items-center">
                                <span className="mr-1">🌡️</span>
                                <span>{dayInfo.temperature}°C</span>
                            </div>

                            <div className="flex items-center">
                                <span className="mr-1">💧</span>
                                <span>{dayInfo.humidity}%</span>
                            </div>

                            <div className="flex items-center">
                                <span className="mr-1">{getGrowthStageIcon(dayInfo.growthStage)}</span>
                                <span className="hidden sm:inline">{dayInfo.growthStage.toLowerCase()}</span>
                                <span className="ml-1">({Math.round(dayInfo.growthPercent * 100)}%)</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Weather info panel - conditionally shown */}
                {showWeatherPanel && dayInfo && (
                    <div className="absolute right-0 top-10 z-20 w-64">
                        <WeatherInfo dayInfo={dayInfo} location={location} />
                    </div>
                )}

                {/* Timeline slider */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={togglePlayPause}
                        className="bg-green-600 hover:bg-green-500 text-white p-1 px-3 rounded"
                    >
                        {isPlaying ? '⏸️' : '▶️'}
                    </button>

                    <div className="text-xs">{currentDay + 1}</div>

                    <input
                        type="range"
                        min="0"
                        max={totalDays - 1}
                        value={currentDay}
                        onChange={handleSliderChange}
                        className="flex-grow h-2 rounded-lg appearance-none bg-green-600 cursor-pointer"
                    />

                    <div className="text-xs">{totalDays}</div>

                    {/* Speed control */}
                    <div className="flex items-center space-x-1">
                        <span className="text-xs">Speed:</span>
                        <select
                            value={speed}
                            onChange={(e) => handleSpeedChange(Number(e.target.value))}
                            className="bg-green-700 text-white text-xs rounded p-1"
                        >
                            <option value="0.5">0.5x</option>
                            <option value="1">1x</option>
                            <option value="2">2x</option>
                            <option value="5">5x</option>
                            <option value="10">10x</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineControls;
