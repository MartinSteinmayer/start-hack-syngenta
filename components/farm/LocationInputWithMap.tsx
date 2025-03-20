// components/farm/LocationInputWithMap.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react';
import MapComponent from './MapComponent';

interface LocationInputWithMapProps {
    onLocationChange: (latitude: number, longitude: number, locationName: string) => void;
    initialLocation: {
        latitude: number;
        longitude: number;
        name: string;
    };
    disabled?: boolean;
}

interface GeocodeResult {
    name: string;
    country: string;
    state?: string;
    lat: number;
    lon: number;
}

const LocationInputWithMap: React.FC<LocationInputWithMapProps> = ({
    onLocationChange,
    initialLocation,
    disabled = false
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [latitude, setLatitude] = useState<number>(initialLocation.latitude);
    const [longitude, setLongitude] = useState<number>(initialLocation.longitude);
    const [locationName, setLocationName] = useState(initialLocation.name);
    const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const [showResults, setShowResults] = useState(false);

    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Initialize with the provided values
    useEffect(() => {
        setLatitude(initialLocation.latitude);
        setLongitude(initialLocation.longitude);
        setLocationName(initialLocation.name);
    }, [initialLocation]);

    // Handle map location selection
    const handleMapLocationSelect = (lat: number, lng: number) => {
        setLatitude(lat);
        setLongitude(lng);

        // Reverse geocode to get location name
        reverseGeocode(lat, lng);
    };

    // Reverse geocode to get location name from coordinates
    const reverseGeocode = async (lat: number, lon: number) => {
        try {
            // Use OpenStreetMap Nominatim for reverse geocoding
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Farm Bio-Boost Simulator' // Nominatim requires a user agent
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.display_name) {
                // Create a more concise location name
                let placeName = '';

                if (data.address) {
                    const parts = [];
                    if (data.address.city) parts.push(data.address.city);
                    else if (data.address.town) parts.push(data.address.town);
                    else if (data.address.village) parts.push(data.address.village);
                    else if (data.address.hamlet) parts.push(data.address.hamlet);

                    if (data.address.state) parts.push(data.address.state);
                    if (data.address.country) parts.push(data.address.country);

                    placeName = parts.join(', ');
                }

                if (!placeName) placeName = data.display_name.split(',').slice(0, 3).join(',');

                setLocationName(placeName);
                onLocationChange(lat, lon, placeName);
            } else {
                setLocationName(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
                onLocationChange(lat, lon, `${lat.toFixed(6)}, ${lon.toFixed(6)}`);
            }
        } catch (error) {
            console.error("Error during reverse geocoding:", error);
            setLocationName(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
            onLocationChange(lat, lon, `${lat.toFixed(6)}, ${lon.toFixed(6)}`);
        }
    };

    // Search for location by name
    const searchLocation = async () => {
        if (!searchQuery.trim() || disabled) return;

        setIsSearching(true);
        setError('');

        try {
            // Use OpenStreetMap Nominatim for search
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Farm Bio-Boost Simulator' // Nominatim requires a user agent
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.length > 0) {
                const results: GeocodeResult[] = data.map((item: any) => ({
                    name: item.display_name.split(',')[0],
                    country: item.display_name.split(',').pop().trim(),
                    state: item.display_name.split(',').length > 2 ? item.display_name.split(',')[1].trim() : '',
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon)
                }));

                setSearchResults(results);
                setShowResults(true);
            } else {
                setSearchResults([]);
                setError('No locations found. Try a different search term.');
            }
        } catch (error) {
            console.error("Error searching location:", error);
            setError('Error searching for location. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    // Handle location selection from search results
    const selectLocation = (result: GeocodeResult) => {
        setLatitude(result.lat);
        setLongitude(result.lon);

        const locationString = result.state
            ? `${result.name}, ${result.state}, ${result.country}`
            : `${result.name}, ${result.country}`;

        setLocationName(locationString);
        setSearchQuery('');
        setShowResults(false);

        // Notify parent component
        onLocationChange(result.lat, result.lon, locationString);
    };

    // Handle manual entry of coordinates
    const handleManualCoordinates = () => {
        if (latitude !== null && longitude !== null) {
            reverseGeocode(latitude, longitude);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2 text-green-800">Location Settings</h3>

            {/* Map for visual selection */}
            <div className="mb-4 rounded-lg overflow-hidden border h-[300px] border-gray-300" ref={mapContainerRef}>
                <div className="bg-green-800 text-white py-1 px-3 text-sm">
                    Click on map to set farm location
                </div>
                <div className="relative" style={{ height: '300px' }}>
                    <MapComponent
                        latitude={latitude}
                        longitude={longitude}
                        onLocationSelect={handleMapLocationSelect}
                        disabled={disabled}
                    />
                </div>
            </div>

            {/* Search by place name */}
            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Search by place name:</label>
                <div className="flex">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                        placeholder="City name, country"
                        className="w-full p-2 border rounded-l"
                        disabled={disabled}
                    />
                    <button
                        onClick={searchLocation}
                        className="bg-blue-500 text-white px-3 rounded-r hover:bg-blue-600"
                        disabled={isSearching || disabled || !searchQuery.trim()}
                    >
                        {isSearching ? '...' : 'Search'}
                    </button>
                </div>

                {/* Search results dropdown */}
                {showResults && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-64 bg-white border rounded shadow-lg">
                        {searchResults.map((result, index) => (
                            <div
                                key={index}
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => selectLocation(result)}
                            >
                                {result.name}, {result.state && `${result.state}, `}{result.country}
                            </div>
                        ))}
                    </div>
                )}

                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>


            {/* Display current location */}
            {locationName && (
                <div className="mt-3 p-2 bg-gray-100 rounded">
                    <p className="text-sm font-medium">Current Location:</p>
                    <p className="font-bold text-green-800">{locationName}</p>
                    <p className="text-xs text-gray-600">
                        Lat: {latitude?.toFixed(6)}, Lon: {longitude?.toFixed(6)}
                    </p>
                </div>
            )}
        </div>
    );
};

export default LocationInputWithMap;
