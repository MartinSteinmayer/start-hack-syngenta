// components/farm/FarmReviewStep.tsx
'use client'

import React from 'react';
import Image from 'next/image';
import MapComponent from './MapComponent';

interface FarmReviewStepProps {
  farmLocation: { latitude: number; longitude: number; name: string };
  farmSize: number;
  farmPolygon: Array<{latitude: number; longitude: number}>;
  cropType: string;
  onStartSimulation: () => void;
  onBack: () => void;
}

const FarmReviewStep: React.FC<FarmReviewStepProps> = ({
  farmLocation,
  farmSize,
  farmPolygon,
  cropType,
  onStartSimulation,
  onBack
}) => {
  // Helper function to get crop emoji
  const getCropEmoji = (crop: string) => {
    switch(crop.toLowerCase()) {
      case 'corn': return '🌽';
      case 'soybean': return '🌱';
      case 'wheat': return '🌾';
      case 'rice': return '🌾';
      case 'cotton': return '💮';
      default: return '🌿';
    }
  };

  // Format hectares for display
  const formatHectares = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k ha`;
    }
    return `${value} ha`;
  };

  // Format a polygon point for display
  const formatCoordinate = (coord: number): string => {
    return coord.toFixed(6);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-green-800">Review Your Setup</h2>
      <p className="text-gray-600 mb-6">
        Review your farm details before starting the simulation. The digital twin will be generated using these parameters.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Farm Details */}
        <div>
          <div className="bg-green-50 p-5 rounded-lg border border-green-200 mb-6">
            <h3 className="text-xl font-semibold text-green-800 mb-4">Farm Details</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-green-700">Location</h4>
                <p className="text-gray-700 font-bold">{farmLocation.name}</p>
                <p className="text-sm text-gray-600">
                  Lat: {formatCoordinate(farmLocation.latitude)}, Lon: {formatCoordinate(farmLocation.longitude)}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-green-700">Farm Size</h4>
                <p className="text-gray-700">
                  <span className="font-bold">{formatHectares(farmSize)}</span> 
                  <span className="text-sm text-gray-600 ml-2">({(farmSize * 2.47105).toFixed(2)} acres)</span>
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-green-700">Crop Type</h4>
                <p className="text-gray-700">
                  <span className="text-2xl mr-2">{getCropEmoji(cropType)}</span>
                  <span className="font-bold capitalize">{cropType}</span>
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-green-700">Farm Boundary</h4>
                <p className="text-sm text-gray-600">
                  {farmPolygon.length} points defining the farm perimeter
                </p>
                <div className="mt-2 max-h-32 overflow-y-auto text-xs bg-white p-2 rounded border border-gray-200">
                  {farmPolygon.map((point, index) => (
                    <div key={index} className="mb-1">
                      <span className="font-medium">Point {index + 1}:</span> {formatCoordinate(point.latitude)}, {formatCoordinate(point.longitude)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
            <h3 className="text-xl font-semibold text-blue-800 mb-4">Simulation Information</h3>
            <div className="space-y-3">
              <p className="text-gray-700">
                Your digital twin simulation will include:
              </p>
              <ul className="list-disc pl-5 text-gray-700 space-y-2">
                <li>3D visualization of your farm</li>
                <li>Weather data and seasonal changes</li>
                <li>Crop growth stages simulation</li>
                <li>Biological product performance analysis</li>
                <li>Yield prediction and comparison</li>
              </ul>
              <p className="text-sm text-gray-600 mt-3">
                The simulation will run for one complete growing season with day-by-day progression.
              </p>
            </div>
          </div>
        </div>
        
        {/* Map Visualization */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            <div className="bg-green-800 text-white py-2 px-4 font-medium">
              Farm Location Map
            </div>
            <div className="h-80">
              <MapComponent 
                latitude={farmLocation.latitude}
                longitude={farmLocation.longitude}
                hectares={farmSize}
                className="w-full h-full"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            <div className="bg-green-800 text-white py-2 px-4 font-medium">
              Farm Boundary Polygon
            </div>
            <div className="relative h-80 bg-gray-100">
              {/* Here we would ideally render the actual polygon on a map */}
              {/* For MVP, we'll show a simplified representation */}
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <svg width="100%" height="100%" viewBox="0 0 200 200" className="max-w-full max-h-full">
                  {/* Create a polygon from the farm boundary points */}
                  {farmPolygon.length >= 3 && (
                    <polygon 
                      points={farmPolygon.map((point, i) => {
                        // Very simple conversion to SVG coordinates (just for visualization)
                        // Center around the farm location, scale based on relative distances
                        const center = { x: 100, y: 100 };
                        const scale = 500; // Arbitrary scale factor
                        
                        const dx = (point.longitude - farmLocation.longitude) * scale;
                        const dy = (farmLocation.latitude - point.latitude) * scale;
                        
                        return `${center.x + dx},${center.y + dy}`;
                      }).join(' ')}
                      fill="rgba(76, 175, 80, 0.3)"
                      stroke="green"
                      strokeWidth="2"
                    />
                  )}
                  
                  {/* Add point markers */}
                  {farmPolygon.map((point, i) => {
                    const center = { x: 100, y: 100 };
                    const scale = 500;
                    
                    const dx = (point.longitude - farmLocation.longitude) * scale;
                    const dy = (farmLocation.latitude - point.latitude) * scale;
                    
                    return (
                      <g key={i}>
                        <circle 
                          cx={center.x + dx} 
                          cy={center.y + dy} 
                          r="4" 
                          fill="red" 
                        />
                        <text 
                          x={center.x + dx} 
                          y={center.y + dy - 7} 
                          fontSize="10" 
                          textAnchor="middle"
                          fill="black"
                        >
                          {i + 1}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Center point marker */}
                  <circle cx="100" cy="100" r="6" fill="blue" opacity="0.7" />
                </svg>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-80 p-2 text-xs text-center">
                Farm polygon visualization (simplified view)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Simulation Button */}
      <div className="mt-8 text-center">
        <button
          onClick={onStartSimulation}
          className="px-8 py-4 bg-green-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-green-700 transform hover:scale-105 transition-all"
        >
          Start Simulation &rarr;
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Your digital twin will be generated with these parameters
        </p>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default FarmReviewStep;