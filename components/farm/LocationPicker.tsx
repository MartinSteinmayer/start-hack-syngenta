"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { GeoLocation } from '@/types/farm';

// Import types but not actual components to avoid SSR issues
import type { MapContainer as MapContainerType } from 'react-leaflet';

interface LocationPickerProps {
    value: GeoLocation;
    onChange: (location: GeoLocation) => void;
    className?: string;
}

// Dynamically import the map component with SSR disabled
// This ensures Leaflet only loads in the browser, not during server rendering
const MapComponentWithNoSSR = dynamic(
    () => import('@/components/farm/MapComponent').then((mod) => mod.default),
    {
        ssr: false,
        loading: () => (
            <div className="h-64 rounded-md overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center">
                <div className="text-gray-500">Loading map...</div>
            </div>
        )
    }
);

export default function LocationPicker({ value, onChange, className = '' }: LocationPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{
        display_name: string;
        lat: string;
        lon: string;
    }>>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Handler for search functionality
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            // Using Nominatim for geocoding (OpenStreetMap)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
            );
            const data = await response.json();
            setSearchResults(data.slice(0, 5)); // Limit to 5 results
        } catch (error) {
            console.error('Error searching location:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectResult = (result: { lat: string; lon: string }) => {
        onChange({
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
        });
        setSearchResults([]);
        setSearchQuery('');
    };

    return (
        <div className={`flex flex-col ${className}`}>
            {/* Search Component */}
            <div className="mb-4">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search location (e.g., Karnataka, India)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-green-400"
                    >
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="mt-2 border rounded-md shadow-sm max-h-60 overflow-y-auto bg-white">
                        <ul>
                            {searchResults.map((result, index) => (
                                <li
                                    key={index}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                    onClick={() => handleSelectResult(result)}
                                >
                                    {result.display_name}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Map Component - Dynamically loaded on client-side only */}
            <MapComponentWithNoSSR location={value} onLocationChange={onChange} />

        </div>
    );
}
