// components/farm/MapComponent.tsx
'use client'

import React, { useEffect, useRef } from 'react';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  hectares?: number;
  className?: string;
  showCircle?: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({
  latitude,
  longitude,
  hectares = 100,
  className = "w-full h-64",
  showCircle = true
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    // Generate an approximation of radius in kilometers based on hectares
    // 1 hectare = 0.01 square kilometers
    // Area = π * r²
    // Solve for r: r = sqrt(Area / π)
    const areaKm2 = hectares * 0.01;
    const radiusKm = Math.sqrt(areaKm2 / Math.PI);
    
    // Calculate zoom level based on radius
    let zoomLevel = 14;
    if (radiusKm > 0.5) zoomLevel = 13;
    if (radiusKm > 1) zoomLevel = 12;
    if (radiusKm > 2) zoomLevel = 11;
    if (radiusKm > 5) zoomLevel = 10;
    if (radiusKm > 10) zoomLevel = 9;
    if (radiusKm > 20) zoomLevel = 8;
    if (radiusKm > 50) zoomLevel = 7;
    
    // Create the OpenStreetMap embed URL
    let url = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.1},${latitude-0.1},${longitude+0.1},${latitude+0.1}&layer=mapnik&marker=${latitude},${longitude}`;
    
    // Alternatively with zoom level
    url = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.2},${latitude-0.2},${longitude+0.2},${latitude+0.2}&layer=mapnik&marker=${latitude},${longitude}&zoom=${zoomLevel}`;
    
    // Set the iframe source
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  }, [latitude, longitude, hectares]);

  return (
    <div className={`relative overflow-hidden rounded-md border border-gray-300 ${className}`}>
      <iframe
        ref={iframeRef}
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        className="absolute inset-0 w-full h-full"
        title="Farm location map"
      ></iframe>
      
      {/* We can't easily add a circle overlay on the iframe, but we could add explanatory text */}
      <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-80 p-2 text-xs">
        Farm location: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        {hectares && <span> • Approx. {hectares} hectares</span>}
      </div>
    </div>
  );
};

export default MapComponent;