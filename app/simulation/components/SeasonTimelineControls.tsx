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
    <div className="fixed top-16 left-0 right-0 bg-green-800 text-white p-3 shadow-lg z-10">
      <div className="max-w-screen-xl mx-auto relative">
        {/* Day info */}
        {dayInfo && (
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm md:text-base">
              <span className="font-bold">Day {dayInfo.dayNumber}</span> - {new Date(dayInfo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>

            <div className="flex space-x-6">
              <div className="flex items-center">
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

        {/* Three season buttons */}
        <div className="flex justify-between mb-4 gap-3">
          {Object.entries(seasons).map(([key, data]) => (
            <button
              key={key}
              onClick={() => handleSeasonSelect(key)}
              className={`flex-1 py-3 rounded-md font-medium transition-all ${
                currentSeason === key 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-700 hover:bg-green-600 text-gray-100'
              }`}
            >
              <div className="text-center">{data.label}</div>
              <div className="text-xs text-center mt-1">Day {data.day + 1}-{key === 'early' ? Math.floor(totalDays * 0.33) : key === 'middle' ? Math.floor(totalDays * 0.67) : totalDays}</div>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={togglePlayPause}
            className="bg-green-600 hover:bg-green-500 text-white p-2 px-4 rounded"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>

          <div className="text-sm">Day {currentDay + 1} of {totalDays}</div>

          {/* Speed control */}
          <div className="flex items-center ml-auto space-x-2">
            <span className="text-sm">Speed:</span>
            <select
              value={speed}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="bg-green-700 text-white rounded p-1"
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

export default SeasonTimelineControls;
