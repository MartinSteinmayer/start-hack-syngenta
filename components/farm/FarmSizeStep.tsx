// components/farm/FarmSizeStep.tsx
'use client'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import MapComponent from './MapComponent';

interface FarmSizeStepProps {
  farmLocation: { latitude: number; longitude: number; name: string };
  farmSize: number;
  onFarmSizeChange: (size: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

const FarmSizeStep: React.FC<FarmSizeStepProps> = ({
  farmLocation,
  farmSize,
  onFarmSizeChange,
  onContinue,
  onBack
}) => {
  const [mapUrl, setMapUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Update map when location or size changes
  useEffect(() => {
    updateMapPreview();
  }, [farmLocation, farmSize]);

  // Generate map preview using OpenStreetMap
  const updateMapPreview = () => {
    if (!farmLocation) return;
    
    setIsLoading(true);
    
    // Calculate radius in km based on hectares
    // Area = π × r²
    // 1 hectare = 0.01 km²
    // r = √(area ÷ π)
    const areaKm2 = farmSize * 0.01;
    const radiusKm = Math.sqrt(areaKm2 / Math.PI);
    
    // Use OpenStreetMap static map API
    // We'll use the OpenStreetMap Static Maps API via Thunderforest
    // You'll need to create an account and get an API key at https://www.thunderforest.com/
    // For demo purposes, we'll use a placeholder API key - replace with your own
    const apiKey = process.env.NEXT_PUBLIC_THUNDERFOREST_API_KEY || 'placeholder-key';
    
    // Calculate zoom level based on farm size
    // This is an approximation - smaller hectares need higher zoom
    let zoomLevel;
    if (farmSize <= 10) zoomLevel = 14;
    else if (farmSize <= 50) zoomLevel = 13;
    else if (farmSize <= 200) zoomLevel = 12;
    else if (farmSize <= 500) zoomLevel = 11;
    else if (farmSize <= 1000) zoomLevel = 10;
    else zoomLevel = 9;
    
    // Create the map URL
    const baseUrl = 'https://tile.thunderforest.com/landscape';
    const mapPreviewUrl = `${baseUrl}/${farmLocation.longitude},${farmLocation.latitude},${zoomLevel}/600x400.png?apikey=${apiKey}`;
    
    // For development without an API key, fall back to a screenshot or embedded iframe
    if (apiKey === 'placeholder-key') {
      // Use a fallback map approach
      const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${farmLocation.longitude-0.1},${farmLocation.latitude-0.1},${farmLocation.longitude+0.1},${farmLocation.latitude+0.1}&layer=mapnik&marker=${farmLocation.latitude},${farmLocation.longitude}`;
      setMapUrl(openStreetMapUrl);
    } else {
      setMapUrl(mapPreviewUrl);
    }
    
    setIsLoading(false);
  };

  // Format hectares for display
  const formatHectares = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k ha`;
    }
    return `${value} ha`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-green-800">Specify Your Farm Size</h2>
      <p className="text-gray-600 mb-6">
        Enter the approximate size of your farm in hectares.
        This will determine the scale of your simulation.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Farm size (hectares):</label>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={farmSize}
              onChange={(e) => onFarmSizeChange(parseInt(e.target.value))}
              className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-600">10 ha</span>
              <span className="font-medium text-green-800">{formatHectares(farmSize)}</span>
              <span className="text-sm text-gray-600">1000 ha</span>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Or enter exact size:</label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={farmSize}
                  onChange={(e) => onFarmSizeChange(parseInt(e.target.value) || 1)}
                  className="w-full p-2 border rounded mr-2"
                />
                <span className="text-gray-600">hectares</span>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">Farm Location:</h3>
              <p className="font-medium">{farmLocation.name || 'Custom Location'}</p>
              <p className="text-sm text-gray-600">
                Lat: {farmLocation.latitude.toFixed(6)}, Lon: {farmLocation.longitude.toFixed(6)}
              </p>
            </div>
            
            <div className="mt-4">
              <div className="text-sm text-gray-500">
                <p><strong>Farm area:</strong> {farmSize} hectares ({(farmSize * 2.47105).toFixed(2)} acres)</p>
                <p><strong>Approximate radius:</strong> {(Math.sqrt(farmSize * 10000 / Math.PI)).toFixed(0)} meters</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Map preview */}
        <div className="bg-gray-100 rounded-lg overflow-hidden">
          <div className="bg-green-800 text-white py-2 px-4 text-sm font-medium">
            Location Preview
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            // Using our MapComponent
            <MapComponent 
              latitude={farmLocation.latitude}
              longitude={farmLocation.longitude}
              hectares={farmSize}
              className="w-full h-64 md:h-80"
              showCircle={true}
            />
          )}
          <div className="px-4 py-2 text-xs text-gray-600">
            Map shows approximate farm location. You'll define the exact boundary in the next step.
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Back
        </button>
        
        <button
          onClick={onContinue}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default FarmSizeStep;